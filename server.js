const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
// pdf-parse v2 can require native canvas support on some systems.
// Load it lazily so the whole server does not fail when that optional
// dependency is unavailable; a pure-JS PDF text fallback is provided below.
let pdfParseModule = null;
let pdfParseLoadError = null;

function getPdfParser() {
    if (pdfParseModule || pdfParseLoadError) return pdfParseModule;
    try {
        pdfParseModule = require("pdf-parse");
    } catch (error) {
        pdfParseLoadError = error;
        console.warn("pdf-parse is unavailable; using built-in PDF text fallback.", error.message);
    }
    return pdfParseModule;
}

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const ROOT = __dirname;

const PUBLIC_DIR =
    path.join(ROOT, "public");

const UPLOAD_DIR =
    path.join(ROOT, "uploads");

const DB_FILE =
    path.join(ROOT, "bhurakshak.db");


/*
=====================================================
DIRECTORIES
=====================================================
*/

if (
    !fs.existsSync(UPLOAD_DIR)
) {

    fs.mkdirSync(
        UPLOAD_DIR,
        {
            recursive: true
        }
    );

}


/*
=====================================================
EXPRESS
=====================================================
*/

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.static(
        PUBLIC_DIR
    )
);

app.use(
    "/uploads",
    express.static(
        UPLOAD_DIR
    )
);


/*
=====================================================
DATABASE
=====================================================
*/

const db =
    new sqlite3.Database(
        DB_FILE
    );


db.serialize(() => {

    db.run(`
        PRAGMA foreign_keys = ON
    `);


    db.run(`
        CREATE TABLE IF NOT EXISTS land_records (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            record_id TEXT UNIQUE NOT NULL,
            user_id TEXT UNIQUE NOT NULL,

            user_name TEXT NOT NULL,
            user_contact TEXT NOT NULL,
            user_email TEXT,

            id_last4 TEXT,

            state TEXT NOT NULL,
            district TEXT NOT NULL,
            tehsil TEXT,
            village TEXT NOT NULL,

            khasra_number TEXT NOT NULL,
            khata_number TEXT,
            area TEXT,

            land_type TEXT,
            ownership_type TEXT,
            registration_id TEXT,

            father_name TEXT NOT NULL,
            mother_name TEXT NOT NULL,

            father_id_last4 TEXT,
            mother_id_last4 TEXT,

            status TEXT DEFAULT 'Pending',
            rejection_reason TEXT DEFAULT '',
            confidence TEXT DEFAULT 'Manual',

            created_at
                DATETIME DEFAULT CURRENT_TIMESTAMP,

            updated_at
                DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);


    db.run(`
        CREATE TABLE IF NOT EXISTS documents (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            record_id INTEGER NOT NULL,

            document_type TEXT NOT NULL,

            original_name TEXT NOT NULL,

            stored_name TEXT NOT NULL,

            mime_type TEXT,

            size INTEGER,

            created_at
                DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY(record_id)
                REFERENCES land_records(id)
                ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            user_id TEXT UNIQUE NOT NULL,
            contact TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Backward-compatible columns for separate phone/email registration.
    db.run(`ALTER TABLE admin_users ADD COLUMN email TEXT`, () => {});
    db.run(`ALTER TABLE admin_users ADD COLUMN phone_verified INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE admin_users ADD COLUMN email_verified INTEGER DEFAULT 0`, () => {});

    db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER,
            actor_role TEXT DEFAULT 'system',
            actor_id TEXT DEFAULT 'system',
            action TEXT NOT NULL,
            details TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(record_id) REFERENCES land_records(id) ON DELETE SET NULL
        )
    `);

});


/*
=====================================================
DOCUMENT TYPES
=====================================================
*/

const documentTypes = [

    {
        field:
            "land_document",

        type:
            "Primary Land Record / Deed"
    },

    {
        field:
            "applicant_id_document",

        type:
            "Applicant ID Proof"
    },

    {
        field:
            "father_id_document",

        type:
            "Father / Parent ID Proof"
    },

    {
        field:
            "mother_id_document",

        type:
            "Mother / Parent ID Proof"
    },

    {
        field:
            "registry_document",

        type:
            "Registry / Sale Deed"
    },

    {
        field:
            "ror_document",

        type:
            "Khatauni / Jamabandi / RoR"
    },

    {
        field:
            "mutation_document",

        type:
            "Mutation / Intkal"
    },

    {
        field:
            "inheritance_document",

        type:
            "Inheritance / Legal-Heir Proof"
    },

    {
        field:
            "other_document",

        type:
            "Other Supporting Document"
    }

];


/*
=====================================================
MULTER STORAGE
=====================================================
*/

const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                cb(
                    null,
                    UPLOAD_DIR
                );

            },


        filename:
            function (
                req,
                file,
                cb
            ) {

                const extension =
                    path.extname(
                        file.originalname
                    ).toLowerCase();


                const filename =
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .substring(
                            2,
                            10
                        ) +
                    extension;


                cb(
                    null,
                    filename
                );

            }

    });


/*
=====================================================
NORMAL DOCUMENT UPLOAD
=====================================================
*/

const upload =
    multer({

        storage,

        limits: {

            fileSize:
                20 *
                1024 *
                1024

        },


        fileFilter:
            function (
                req,
                file,
                cb
            ) {

                const allowed = [

                    ".pdf",
                    ".jpg",
                    ".jpeg",
                    ".png"

                ];


                const extension =
                    path.extname(
                        file.originalname
                    ).toLowerCase();


                if (
                    !allowed.includes(
                        extension
                    )
                ) {

                    return cb(
                        new Error(
                            "Only PDF, JPG, JPEG and PNG files are allowed."
                        )
                    );

                }


                cb(
                    null,
                    true
                );

            }

    });


const uploadMiddleware =
    upload.fields(

        documentTypes.map(
            item => ({

                name:
                    item.field,

                maxCount:
                    1

            })
        )

    );


/*
=====================================================
DATABASE HELPERS
=====================================================
*/

function run(
    sql,
    params = []
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            db.run(
                sql,
                params,
                function (
                    error
                ) {

                    if (error) {

                        reject(
                            error
                        );

                        return;

                    }


                    resolve(
                        this
                    );

                }
            );

        }
    );

}


function get(
    sql,
    params = []
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            db.get(
                sql,
                params,
                (
                    error,
                    row
                ) => {

                    if (error) {

                        reject(
                            error
                        );

                        return;

                    }


                    resolve(
                        row
                    );

                }
            );

        }
    );

}


function all(
    sql,
    params = []
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            db.all(
                sql,
                params,
                (
                    error,
                    rows
                ) => {

                    if (error) {

                        reject(
                            error
                        );

                        return;

                    }


                    resolve(
                        rows
                    );

                }
            );

        }
    );

}


/*
=====================================================
ID GENERATORS
=====================================================
*/

function generateRecordId() {

    return (

        "REC-" +

        Date.now() +

        "-" +

        Math.floor(
            Math.random() *
            10000
        )

    );

}


function generateUserId() {

    return (

        "USER-" +

        Date.now() +

        "-" +

        Math.floor(
            Math.random() *
            10000
        )

    );

}



/*
=====================================================
STAFF AUTHENTICATION - HACKATHON PROTOTYPE
=====================================================
*/

const staffSessions = new Map();
const otpChallenges = new Map();
const OFFICER_USER_ID = "DHEE14";
const OFFICER_PASSWORD = "New@1234";

function normalizeContact(value) {
    return String(value || "").trim();
}

function validPhone(value) {
    return /^[0-9]{10}$/.test(normalizeContact(value));
}

function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeContact(value));
}

function generateOtp() {
    return String(crypto.randomInt(100000, 1000000));
}

function otpKey(channel, destination) {
    return `${channel}:${normalizeContact(destination).toLowerCase()}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    try {
        const [salt, storedHash] = String(stored).split(":");
        if (!salt || !storedHash) return false;
        const derived = crypto.scryptSync(String(password), salt, 64);
        const expected = Buffer.from(storedHash, "hex");
        return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
    } catch {
        return false;
    }
}

function createStaffSession(role, userId, displayName) {
    const token = crypto.randomBytes(32).toString("hex");
    staffSessions.set(token, {
        role,
        userId,
        displayName,
        createdAt: Date.now()
    });
    return token;
}

function requireStaffAuth(req, res, next) {
    const header = String(req.headers.authorization || "");
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const session = token ? staffSessions.get(token) : null;
    if (!session) {
        return res.status(401).json({ success: false, code: "AUTH_REQUIRED", message: "Please sign in as an officer or administrator." });
    }
    req.staff = session;
    next();
}

function logAudit(recordId, actorRole, actorId, action, details = "") {
    return run(`INSERT INTO audit_logs (record_id, actor_role, actor_id, action, details) VALUES (?, ?, ?, ?, ?)`, [recordId || null, actorRole || "system", actorId || "system", action, details]).catch(error => console.error("AUDIT LOG ERROR:", error.message));
}

function requireAdmin(req, res, next) {
    requireStaffAuth(req, res, () => {
        if (req.staff.role !== "admin") return res.status(403).json({ success:false, message:"Administrator access is required for this action." });
        next();
    });
}

app.post("/api/auth/otp/send", async (req, res) => {
    try {
        const channel = String(req.body?.channel || "").toLowerCase();
        const destination = normalizeContact(req.body?.destination);
        if (!["phone", "email"].includes(channel)) {
            return res.status(400).json({ success: false, message: "Choose phone or email verification." });
        }
        if (channel === "phone" && !validPhone(destination)) {
            return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number." });
        }
        if (channel === "email" && !validEmail(destination)) {
            return res.status(400).json({ success: false, message: "Enter a valid email address." });
        }

        const otp = generateOtp();
        otpChallenges.set(otpKey(channel, destination), {
            otp, expiresAt: Date.now() + 5 * 60 * 1000, verified: false,
            createdAt: Date.now()
        });

        // Hackathon prototype: no SMS/email provider is configured. Return the
        // generated OTP as a clearly labelled demo value so the team can test
        // both verification channels without external credentials.
        console.log(`[DEMO OTP] ${channel.toUpperCase()} ${destination}: ${otp}`);
        return res.json({
            success: true,
            channel,
            message: `${channel === "phone" ? "Phone" : "Email"} OTP generated successfully.`,
            expires_in: 300,
            demo_otp: otp
        });
    } catch (error) {
        console.error("OTP SEND ERROR:", error);
        return res.status(500).json({ success: false, message: "OTP could not be generated." });
    }
});

app.post("/api/auth/otp/verify", (req, res) => {
    const channel = String(req.body?.channel || "").toLowerCase();
    const destination = normalizeContact(req.body?.destination);
    const otp = String(req.body?.otp || "").trim();
    const challenge = otpChallenges.get(otpKey(channel, destination));
    if (!challenge || challenge.expiresAt < Date.now()) {
        return res.status(400).json({ success: false, message: "OTP has expired. Please request a new OTP." });
    }
    if (!/^\d{6}$/.test(otp) || otp !== challenge.otp) {
        return res.status(400).json({ success: false, message: "Invalid 6-digit OTP." });
    }
    challenge.verified = true;
    challenge.verifiedAt = Date.now();
    return res.json({ success: true, channel, verified: true, message: `${channel === "phone" ? "Phone" : "Email"} verification successful.` });
});

app.post("/api/auth/officer/login", (req, res) => {
    const userId = String(req.body?.user_id || "").trim();
    const password = String(req.body?.password || "");
    if (userId !== OFFICER_USER_ID || password !== OFFICER_PASSWORD) {
        return res.status(401).json({ success: false, message: "Invalid officer ID or password." });
    }
    const token = createStaffSession("officer", OFFICER_USER_ID, "DHEE14 Officer");
    logAudit(null, "officer", OFFICER_USER_ID, "OFFICER_LOGIN", "Demo officer session started");
    return res.json({ success: true, role: "officer", user_id: OFFICER_USER_ID, display_name: "DHEE14 Officer", token });
});

app.post("/api/auth/admin/signup", async (req, res) => {
    try {
        const fullName = String(req.body?.full_name || "").trim();
        const userId = String(req.body?.user_id || "").trim();
        const phone = normalizeContact(req.body?.phone);
        const email = normalizeContact(req.body?.email).toLowerCase();
        const password = String(req.body?.password || "");
        const phoneKey = otpKey("phone", phone);
        const emailKey = otpKey("email", email);
        const phoneOtp = otpChallenges.get(phoneKey);
        const emailOtp = otpChallenges.get(emailKey);

        if (!fullName || !userId || !validPhone(phone) || !validEmail(email) || password.length < 6) {
            return res.status(400).json({ success: false, message: "Please complete all registration fields. Use a valid phone number and email. Password must contain at least 6 characters." });
        }
        if (!phoneOtp?.verified || phoneOtp.expiresAt < Date.now()) {
            return res.status(400).json({ success: false, code: "PHONE_OTP_REQUIRED", message: "Please verify the phone OTP before creating the account." });
        }
        if (!emailOtp?.verified || emailOtp.expiresAt < Date.now()) {
            return res.status(400).json({ success: false, code: "EMAIL_OTP_REQUIRED", message: "Please verify the email OTP before creating the account." });
        }

        const existing = await get("SELECT id FROM admin_users WHERE user_id = ?", [userId]);
        if (existing) return res.status(409).json({ success: false, message: "This administrator ID is already registered." });
        const existingPhone = await get("SELECT id FROM admin_users WHERE contact = ?", [phone]);
        if (existingPhone) return res.status(409).json({ success: false, message: "This mobile number is already registered." });
        const existingEmail = await get("SELECT id FROM admin_users WHERE lower(email) = lower(?)", [email]);
        if (existingEmail) return res.status(409).json({ success: false, message: "This email address is already registered." });

        await run(
            "INSERT INTO admin_users (full_name, user_id, contact, email, password_hash, phone_verified, email_verified) VALUES (?, ?, ?, ?, ?, 1, 1)",
            [fullName, userId, phone, email, hashPassword(password)]
        );

        otpChallenges.delete(phoneKey);
        otpChallenges.delete(emailKey);
        const token = createStaffSession("admin", userId, fullName);
        logAudit(null, "admin", userId, "ADMIN_SIGNUP", "Administrator account created after phone and email OTP verification");
        return res.status(201).json({ success: true, role: "admin", user_id: userId, display_name: fullName, token });
    } catch (error) {
        console.error("ADMIN SIGNUP ERROR:", error);
        return res.status(500).json({ success: false, message: "Administrator registration could not be completed." });
    }
});

app.post("/api/auth/admin/login", async (req, res) => {
    try {
        const userId = String(req.body?.user_id || "").trim();
        const password = String(req.body?.password || "");
        const user = await get("SELECT * FROM admin_users WHERE user_id = ?", [userId]);
        if (!user || !verifyPassword(password, user.password_hash)) {
            return res.status(401).json({ success: false, message: "Invalid administrator ID or password." });
        }
        const token = createStaffSession("admin", user.user_id, user.full_name);
        logAudit(null, "admin", user.user_id, "ADMIN_LOGIN", "Administrator session started");
        return res.json({ success: true, role: "admin", user_id: user.user_id, display_name: user.full_name, token });
    } catch (error) {
        console.error("ADMIN LOGIN ERROR:", error);
        return res.status(500).json({ success: false, message: "Administrator login could not be completed." });
    }
});

app.post("/api/auth/logout", requireStaffAuth, (req, res) => {
    const header = String(req.headers.authorization || "");
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    staffSessions.delete(token);
    res.json({ success: true });
});

/*
=====================================================
CREATE LAND RECORD
=====================================================
*/

function runUploadMiddleware(req, res, next) {
    uploadMiddleware(req, res, (error) => {
        if (!error) return next();

        if (error instanceof multer.MulterError) {
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "The uploaded file is larger than the 20 MB limit."
                : `Upload failed: ${error.message}`;
            return res.status(400).json({ success: false, code: error.code, message });
        }

        return res.status(400).json({
            success: false,
            message: error.message || "The uploaded document could not be processed."
        });
    });
}

app.post(
    "/api/records",
    runUploadMiddleware,
    async (
        req,
        res
    ) => {

        try {

            const body =
                req.body;


            /*
            REQUIRED FIELDS
            */

            const required = [

                "user_name",

                "user_contact",

                "state",

                "district",

                "village",

                "khasra_number",

                "father_name",

                "mother_name"

            ];


            for (
                const field
                of required
            ) {

                if (
                    !body[field] ||
                    !String(
                        body[field]
                    ).trim()
                ) {

                    return res
                        .status(400)
                        .json({

                            success:
                                false,

                            message:
                                `${field} is required.`

                        });

                }

            }


            /*
            REQUIRED DOCUMENTS
            */

            const submitAction =
                body.submit_action === "submit"
                    ? "submit"
                    : "save";

            const requiredDocuments = [
                "land_document",
                "applicant_id_document",
                "father_id_document",
                "mother_id_document"
            ];

            // Documents are mandatory only when the user chooses
            // "Save & Submit". A normal "Save" creates a Draft.
            if (submitAction === "submit") {
                for (const field of requiredDocuments) {
                    if (
                        !req.files ||
                        !req.files[field] ||
                        !req.files[field][0]
                    ) {
                        return res
                            .status(400)
                            .json({
                                success: false,
                                code: "REQUIRED_DOCUMENT_MISSING",
                                message: `${field} is required before submission.`
                            });
                    }
                }
            }


            /*
            GENERATE IDS
            */

            const recordId =
                generateRecordId();

            const userId =
                generateUserId();


            /*
            INSERT LAND RECORD
            */

            const result =
                await run(

                    `

                    INSERT INTO land_records (

                        record_id,
                        user_id,

                        user_name,
                        user_contact,
                        user_email,

                        id_last4,

                        state,
                        district,
                        tehsil,
                        village,

                        khasra_number,
                        khata_number,
                        area,

                        land_type,
                        ownership_type,
                        registration_id,

                        father_name,
                        mother_name,

                        father_id_last4,
                        mother_id_last4,

                        status,
                        rejection_reason,
                        confidence

                    )

                    VALUES (

                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?

                    )

                    `,

                    [

                        recordId,

                        userId,

                        body.user_name,

                        body.user_contact,

                        body.user_email ||
                            "",

                        body.id_last4 ||
                            "",

                        body.state,

                        body.district,

                        body.tehsil ||
                            "",

                        body.village,

                        body.khasra_number,

                        body.khata_number ||
                            "",

                        body.area ||
                            "",

                        body.land_type ||
                            "",

                        body.ownership_type ||
                            "",

                        body.registration_id ||
                            "",

                        body.father_name,

                        body.mother_name,

                        body.father_id_last4 ||
                            "",

                        body.mother_id_last4 ||
                            "",

                        submitAction === "submit"
                            ? "Pending"
                            : "Draft",

                        "",

                        body.confidence ||
                            "Manual"

                    ]

                );


            const databaseId =
                result.lastID;

            await logAudit(databaseId, "user", body.user_id || userId, submitAction === "submit" ? "RECORD_SUBMITTED" : "DRAFT_CREATED", `Record ${recordId} created with ${submitAction} action`);


            /*
            SAVE DOCUMENTS
            */

            const savedDocuments =
                [];


            for (
                const documentType
                of documentTypes
            ) {

                const file =
                    req.files?.[
                        documentType.field
                    ]?.[0];


                if (!file) {

                    continue;

                }


                await run(

                    `

                    INSERT INTO documents (

                        record_id,

                        document_type,

                        original_name,

                        stored_name,

                        mime_type,

                        size

                    )

                    VALUES (

                        ?, ?, ?, ?, ?, ?

                    )

                    `,

                    [

                        databaseId,

                        documentType.type,

                        file.originalname,

                        file.filename,

                        file.mimetype,

                        file.size

                    ]

                );


                savedDocuments.push({

                    document_type:
                        documentType.type,

                    original_name:
                        file.originalname,

                    url:
                        "/uploads/" +
                        file.filename

                });

                await logAudit(databaseId, "user", body.user_id || userId, "DOCUMENT_UPLOADED", `${documentType.type}: ${file.originalname}`);

            }


            /*
            GET SAVED RECORD
            */

            const record =
                await get(

                    `

                    SELECT *

                    FROM land_records

                    WHERE id = ?

                    `,

                    [
                        databaseId
                    ]

                );


            return res
                .status(201)
                .json({

                    success:
                        true,

                    condition:
                        true,

                    message:
                        "Land record saved successfully.",

                    record,

                    documents:
                        savedDocuments

                });


        } catch (
            error
        ) {

            console.error(
                "CREATE RECORD ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        error.message ||
                        "Database error."

                });

        }

    }
);


/*
=====================================================
GET ALL RECORDS
=====================================================
*/

app.get(
    "/api/records",
    async (
        req,
        res
    ) => {

        try {

            const records =
                await all(

                    `

                    SELECT *

                    FROM land_records

                    ORDER BY id DESC

                    `

                );


            return res.json(
                records
            );


        } catch (
            error
        ) {

            console.error(
                error
            );


            return res
                .status(500)
                .json({

                    message:
                        "Unable to load records."

                });

        }

    }
);


/*
=====================================================
GET COMPLETE USER RECORD
=====================================================
*/

app.get(
    "/api/admin/records/:id",
    requireStaffAuth,
    async (
        req,
        res
    ) => {

        try {

            const record =
                await get(

                    `

                    SELECT *

                    FROM land_records

                    WHERE id = ?

                    `,

                    [
                        req.params.id
                    ]

                );


            if (!record) {

                return res
                    .status(404)
                    .json({

                        message:
                            "Record not found."

                    });

            }


            const documents = await getRecordDocuments(record.id);


            return res.json({

                record,

                documents

            });


        } catch (
            error
        ) {

            console.error(
                error
            );


            return res
                .status(500)
                .json({

                    message:
                        "Unable to load record."

                });

        }

    }
);



function htmlEscape(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function getRecordDocuments(recordId) {
    return all(
        `
        SELECT
            id,
            document_type,
            original_name,
            mime_type,
            size,
            created_at,
            '/uploads/' || stored_name AS url
        FROM documents
        WHERE record_id = ?
        ORDER BY id ASC
        `,
        [recordId]
    );
}

function buildDigitalDocument(record, documents) {
    const generatedAt = new Date().toLocaleString("en-IN", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Kolkata"
    });
    const location = [record.village, record.tehsil, record.district, record.state].filter(Boolean).join(", ");
    const rows = [
        ["Record ID", record.record_id],
        ["Applicant / Landowner", record.user_name],
        ["Mobile", record.user_contact],
        ["State", record.state],
        ["District", record.district],
        ["Tehsil / Taluk", record.tehsil],
        ["Village", record.village],
        ["Khasra / Survey Number", record.khasra_number],
        ["Khata / Khatauni Number", record.khata_number],
        ["Plot / Land Area", record.area],
        ["Land Type", record.land_type],
        ["Ownership Type", record.ownership_type],
        ["Registration ID", record.registration_id],
        ["Father's Name", record.father_name],
        ["Mother's Name", record.mother_name]
    ];
    const sourceDocs = documents.map(doc => `
        <li><a href="${htmlEscape(doc.url)}" target="_blank" rel="noopener">${htmlEscape(doc.document_type)}</a><span>${htmlEscape(doc.original_name)}</span></li>
    `).join("");

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BhuRakshak Digital Land Record — ${htmlEscape(record.record_id)}</title>
<style>
:root{--green:#126b3f;--deep:#0b3824;--gold:#c78a2c;--ink:#172033;--muted:#667085;--line:#dfe5e1;--paper:#fff}
*{box-sizing:border-box}body{margin:0;background:#eef3ef;color:var(--ink);font-family:Inter,Segoe UI,Arial,sans-serif}.sheet{width:min(920px,calc(100% - 28px));margin:28px auto;background:var(--paper);border:1px solid #d9e2dc;box-shadow:0 20px 60px rgba(18,49,35,.12);border-radius:20px;overflow:hidden}.top{padding:22px 28px;background:linear-gradient(135deg,#083b26,#176b43);color:#fff;display:flex;justify-content:space-between;gap:20px;align-items:center}.brand{display:flex;gap:14px;align-items:center}.mark{width:74px;height:74px;border:0;border-radius:16px;object-fit:contain;background:rgba(255,255,255,.08)}.top h1{margin:0;font-size:27px}.top p{margin:4px 0 0;opacity:.82;font-size:12px;letter-spacing:.08em}.seal{width:88px;height:88px;border:2px solid #f4d68b;border-radius:50%;display:grid;place-items:center;text-align:center;color:#fbe4a7;font-weight:900;font-size:12px;line-height:1.15}.content{padding:28px}.verified{display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid #b7e3c8;background:#effbf3;border-radius:14px;padding:14px 16px;margin-bottom:20px}.verified strong{color:#166534}.verified small{color:var(--muted)}h2{font-size:18px;margin:22px 0 12px;color:var(--deep)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border:1px solid var(--line);border-radius:14px;overflow:hidden}.item{padding:13px 15px;border-bottom:1px solid var(--line);border-right:1px solid var(--line)}.item:nth-child(even){border-right:0}.item span{display:block;color:var(--muted);font-size:11px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em}.item b{font-size:14px}.docs{margin:0;padding:0;list-style:none;display:grid;gap:9px}.docs li{display:flex;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--line);border-radius:10px}.docs a{color:var(--green);font-weight:800}.docs span{color:var(--muted);font-size:12px}.footer{padding:18px 28px;border-top:1px solid var(--line);color:var(--muted);font-size:11px;display:flex;justify-content:space-between;gap:15px}.print{position:fixed;right:22px;bottom:22px;border:0;border-radius:999px;padding:12px 18px;background:var(--green);color:#fff;font-weight:800;cursor:pointer;box-shadow:0 12px 30px rgba(18,107,63,.25)}
@media(max-width:650px){.sheet{width:100%;margin:0;border-radius:0}.top{padding:18px}.content{padding:18px}.grid{grid-template-columns:1fr}.item,.item:nth-child(even){border-right:0}.seal{width:68px;height:68px}.top h1{font-size:22px}.docs li{flex-direction:column}.footer{flex-direction:column}.print{right:14px;bottom:14px}}
@media print{body{background:#fff}.sheet{width:100%;margin:0;box-shadow:none;border:0}.print{display:none}.top{print-color-adjust:exact;-webkit-print-color-adjust:exact}.verified{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style>
</head>
<body>
<article class="sheet">
<header class="top"><div class="brand"><img class="mark" src="/bhurakshak-logo.webp" alt="BhuRakshak logo"><div><h1>BhuRakshak</h1><p>INTELLIGENT LAND RECORD DIGITIZATION &amp; VALIDATION SYSTEM</p></div></div><div class="seal">DIGITALLY<br>VERIFIED</div></header>
<main class="content">
<div class="verified"><div><strong>✓ Verification Completed</strong><small>Human verification status: Verified</small></div><small>Generated: ${htmlEscape(generatedAt)}</small></div>
<h2>Digital Land Record</h2>
<div class="grid">${rows.map(([label,value]) => `<div class="item"><span>${htmlEscape(label)}</span><b>${htmlEscape(value) || "—"}</b></div>`).join("")}</div>
<h2>Location</h2><div class="item" style="border:1px solid var(--line);border-radius:12px"><b>${htmlEscape(location) || "—"}</b></div>
<h2>Source Documents</h2>
<ul class="docs">${sourceDocs || "<li>No source documents attached.</li>"}</ul>
</main>
<footer class="footer"><span>BhuRakshak • Digital land record verification prototype</span><span>Record: ${htmlEscape(record.record_id)}</span></footer>
</article>
<button class="print" onclick="window.print()">Print / Save as PDF</button>
</body></html>`;
}

app.put("/api/admin/records/:id/details", requireAdmin, async (req, res) => {
    try {
        const allowed = ["user_name","user_contact","user_email","id_last4","state","district","tehsil","village","khasra_number","khata_number","area","land_type","ownership_type","registration_id","father_name","mother_name","father_id_last4","mother_id_last4"];
        const current = await get("SELECT * FROM land_records WHERE id = ?", [req.params.id]);
        if (!current) return res.status(404).json({success:false,message:"Record not found."});
        const values = {};
        for (const field of allowed) values[field] = String(req.body?.[field] ?? current[field] ?? "").trim();
        for (const field of ["user_name","user_contact","state","district","village","khasra_number","father_name","mother_name"]) if (!values[field]) return res.status(400).json({success:false,message:`${field} is required.`});
        const sets = allowed.map(field => `${field} = ?`).join(", ");
        await run(`UPDATE land_records SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...allowed.map(field => values[field]), req.params.id]);
        await logAudit(Number(req.params.id), req.staff.role, req.staff.userId, "RECORD_DETAILS_EDITED", "Administrator digitized/updated record details");
        return res.json({success:true,record:await get("SELECT * FROM land_records WHERE id = ?", [req.params.id])});
    } catch (error) {
        console.error("ADMIN EDIT ERROR:", error);
        return res.status(500).json({success:false,message:"Record details could not be updated."});
    }
});

app.get("/api/admin/records/:id/digital-document", requireStaffAuth, async (req, res) => {
    try {
        const record = await get("SELECT * FROM land_records WHERE id = ?", [req.params.id]);
        if (!record) return res.status(404).send("Record not found.");
        if (record.status !== "Verified") return res.status(409).send("This record has not been verified yet.");
        const documents = await getRecordDocuments(record.id);
        res.type("html").send(buildDigitalDocument(record, documents));
    } catch (error) {
        console.error("DIGITAL DOCUMENT ERROR:", error);
        res.status(500).send("Unable to generate the digital document.");
    }
});

/*
=====================================================
UPDATE HUMAN VERIFICATION STATUS
=====================================================
*/

app.put(
    "/api/admin/records/:id/status",
    requireStaffAuth,
    async (
        req,
        res
    ) => {

        try {

            const allowedStatus = [
                "Draft",
                "Pending",
                "Verified",
                "Rejected",
                "Flagged"
            ];


            const status =
                allowedStatus.includes(req.body.status)
                    ? req.body.status
                    : "Pending";

            const rejectionReason =
                status === "Rejected"
                    ? String(req.body.rejection_reason || "").trim()
                    : "";

            if (status === "Rejected" && !rejectionReason) {
                return res.status(400).json({
                    success: false,
                    message: "Rejection reason is required."
                });
            }

            const updateResult = await run(
                `
                UPDATE land_records
                SET
                    status = ?,
                    rejection_reason = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `,
                [
                    status,
                    rejectionReason,
                    req.params.id
                ]
            );

            if (!updateResult.changes) {
                return res.status(404).json({
                    success: false,
                    message: "Record not found."
                });
            }

            await logAudit(Number(req.params.id), req.staff.role, req.staff.userId, status === "Verified" ? "RECORD_VERIFIED" : status === "Rejected" ? "RECORD_REJECTED" : "RECORD_STATUS_UPDATED", rejectionReason || `Status changed to ${status}`);

            return res.json({
                success: true,
                status,
                digital_document_url: status === "Verified"
                    ? `/api/admin/records/${encodeURIComponent(req.params.id)}/digital-document`
                    : null
            });


        } catch (
            error
        ) {

            console.error(
                error
            );


            return res
                .status(500)
                .json({

                    message:
                        "Unable to update status."

                });

        }

    }
);


/*
=====================================================
DATABASE STATISTICS
=====================================================
*/

app.get("/api/validation", async (req, res) => {
    try {
        const records = await all("SELECT * FROM land_records ORDER BY updated_at DESC");
        const keyFor = r => [r.state, r.district, r.village, r.khasra_number]
            .map(v => String(v || "").trim().toLowerCase())
            .join("|");
        const groups = new Map();
        for (const r of records) {
            const key = keyFor(r);
            if (key.split("|").some((part, i) => i < 3 && !part) || !String(r.khasra_number || "").trim()) continue;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(r);
        }
        const duplicateKeys = new Set([...groups.entries()].filter(([, rows]) => rows.length > 1).map(([key]) => key));
        const duplicateRecordCount = [...duplicateKeys].reduce((sum, key) => sum + groups.get(key).length, 0);
        const results = records.map(r => {
            const issues=[];
            if (!r.user_name || !r.user_contact || !r.state || !r.district || !r.village || !r.khasra_number || !r.father_name || !r.mother_name) issues.push("Required field missing");
            if (!/^[0-9]{10}$/.test(String(r.user_contact||""))) issues.push("Mobile number format");
            if (r.user_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r.user_email))) issues.push("Email format");
            const key = keyFor(r);
            const dup = duplicateKeys.has(key) ? groups.get(key) : null;
            if (dup) issues.push(`Duplicate parcel (${dup.length} records)`);
            return {id:r.id,record_id:r.record_id,user_name:r.user_name,status:r.status,issues,result:issues.length?"Review":"Passed"};
        });
        return res.json({success:true,summary:{total:results.length,passed:results.filter(x=>x.result==="Passed").length,review:results.filter(x=>x.result!=="Passed").length,duplicates:duplicateRecordCount},results});
    } catch(error){console.error("VALIDATION API ERROR:",error);return res.status(500).json({success:false,message:"Validation analysis could not be loaded."});}
});

app.get("/api/audit", async (req,res)=>{
    try { const limit=Math.min(Math.max(Number(req.query.limit)||50,1),200); const logs=await all(`SELECT a.*, r.record_id FROM audit_logs a LEFT JOIN land_records r ON r.id=a.record_id ORDER BY a.id DESC LIMIT ?`,[limit]); return res.json({success:true,logs}); }
    catch(error){console.error("AUDIT API ERROR:",error);return res.status(500).json({success:false,message:"Audit trail could not be loaded."});}
});

app.get("/api/analytics", async (req,res)=>{
    try { const status=await all(`SELECT status,COUNT(*) count FROM land_records GROUP BY status`); const confidence=await all(`SELECT confidence,COUNT(*) count FROM land_records GROUP BY confidence`); const documents=await get(`SELECT COUNT(*) count FROM documents`); const daily=await all(`SELECT substr(created_at,1,10) day,COUNT(*) count FROM land_records GROUP BY substr(created_at,1,10) ORDER BY day DESC LIMIT 14`); const verified=await get(`SELECT COUNT(*) count FROM land_records WHERE status='Verified'`); const total=await get(`SELECT COUNT(*) count FROM land_records`); return res.json({success:true,status,confidence,documents:Number(documents.count||0),daily:daily.reverse(),verification_rate:total.count?Math.round((verified.count/total.count)*1000)/10:0}); }
    catch(error){console.error("ANALYTICS API ERROR:",error);return res.status(500).json({success:false,message:"Analytics could not be loaded."});}
});

app.get(
    "/api/stats",
    async (
        req,
        res
    ) => {

        try {

            const total =
                await get(

                    `

                    SELECT COUNT(*) AS count

                    FROM land_records

                    `

                );


            const pending =
                await get(

                    `

                    SELECT COUNT(*) AS count

                    FROM land_records

                    WHERE status =
                        'Pending'

                    `

                );


            const verified =
                await get(

                    `

                    SELECT COUNT(*) AS count

                    FROM land_records

                    WHERE status =
                        'Verified'

                    `

                );


            const documents =
                await get(

                    `

                    SELECT COUNT(*) AS count

                    FROM documents

                    `

                );

            const duplicateGroups = await all(`SELECT lower(trim(state)) state, lower(trim(district)) district, lower(trim(village)) village, lower(trim(khasra_number)) khasra_number, COUNT(*) count FROM land_records WHERE trim(state) <> '' AND trim(district) <> '' AND trim(village) <> '' AND trim(khasra_number) <> '' GROUP BY lower(trim(state)), lower(trim(district)), lower(trim(village)), lower(trim(khasra_number)) HAVING COUNT(*) > 1`);
            const duplicateAlerts = duplicateGroups.reduce((sum, row) => sum + Number(row.count || 0), 0);

            return res.json({

                total:
                    total.count,

                pending:
                    pending.count,

                verified:
                    verified.count,

                documents:
                    documents.count,

                duplicates:
                    duplicateAlerts

            });


        } catch (
            error
        ) {

            return res
                .status(500)
                .json({

                    message:
                        "Unable to load statistics."

                });

        }

    }
);


/*
=====================================================
CLIENT-SIDE PDF FIELD EXTRACTION
=====================================================
*/

app.post("/api/ai/extract-fields", async (req, res) => {
    try {
        const text = String(req.body?.text || "").trim();
        if (!text) {
            return res.status(422).json({ success: false, message: "No readable text was found in the document." });
        }
        const fields = extractLandFields(text);
        const matchedFields = Object.values(fields).filter(Boolean).length;
        const confidence = matchedFields >= 6 ? "High" : matchedFields >= 3 ? "Medium" : matchedFields > 0 ? "Low" : "None";
        return res.json({ success: true, fields, confidence, text });
    } catch (error) {
        console.error("FIELD EXTRACTION ERROR:", error);
        return res.status(500).json({ success: false, message: "The document text could not be processed." });
    }
});


/*
=====================================================
AI DOCUMENT EXTRACTION
=====================================================
*/


const aiExtractionUpload =
    multer({

        storage:

            storage,

        limits: {

            fileSize:
                20 *
                1024 *
                1024

        },

        fileFilter:
            function (
                req,
                file,
                cb
            ) {

                const allowed = [

                    ".pdf",

                    ".jpg",

                    ".jpeg",

                    ".png"

                ];


                const extension =
                    path.extname(
                        file.originalname
                    ).toLowerCase();


                if (
                    !allowed.includes(
                        extension
                    )
                ) {

                    return cb(
                        new Error(
                            "Only PDF, JPG, JPEG and PNG files are allowed."
                        )
                    );

                }


                cb(
                    null,
                    true
                );

            }

    }).single(
        "document"
    );


/*
=====================================================
CLEAN OCR VALUE
=====================================================
*/

function cleanExtractedValue(
    value
) {

    if (!value) {

        return "";

    }


    return String(value)

        .replace(
            /\s+/g,
            " "
        )

        .replace(
            /[|]/g,
            " "
        )

        .trim();

}


/*
=====================================================
EXTRACT FIELD
=====================================================
*/

function extractField(
    text,
    patterns
) {

    for (
        const pattern
        of patterns
    ) {

        const match =
            text.match(
                pattern
            );


        if (
            match &&
            match[1]
        ) {

            return cleanExtractedValue(
                match[1]
            );

        }

    }


    return "";

}


/*
=====================================================
LAND FIELD EXTRACTION
=====================================================
*/

function extractLandFields(
    text
) {

    const normalized =

        text

            .replace(
                /\r/g,
                "\n"
            )

            .replace(
                /[ \t]+/g,
                " "
            );


    return {

        user_name:

            extractField(
                normalized,
                [

                    /(?:owner(?:'s)?\s*name|land\s*owner|khatedar|खातेदार(?:\s*का\s*नाम)?|नाम)\s*[:\-]\s*([^\n]+)/i

                ]
            ),


        state:

            extractField(
                normalized,
                [

                    /(?:state|राज्य)\s*[:\-]\s*([^\n,]+)/i

                ]
            ),


        district:

            extractField(
                normalized,
                [

                    /(?:district|जिला)\s*[:\-]\s*([^\n,]+)/i

                ]
            ),


        tehsil:

            extractField(
                normalized,
                [

                    /(?:tehsil|taluk|tahsil|तहसील)\s*[:\-]\s*([^\n,]+)/i

                ]
            ),


        village:

            extractField(
                normalized,
                [

                    /(?:village|gaon|गांव|ग्राम)\s*[:\-]\s*([^\n,]+)/i

                ]
            ),


        khasra_number:

            extractField(
                normalized,
                [

                    /(?:khasra|survey\s*(?:no|number)?|खसरा)\s*(?:no\.?|number|संख्या)?\s*[:\-]\s*([A-Za-z0-9\/\-.]+)/i

                ]
            ),


        khata_number:

            extractField(
                normalized,
                [

                    /(?:khata|khatauni|खाता|खतौनी)\s*(?:no\.?|number|संख्या)?\s*[:\-]\s*([A-Za-z0-9\/\-.]+)/i

                ]
            ),


        area:

            extractField(
                normalized,
                [

                    /(?:area|land\s*area|क्षेत्रफल)\s*[:\-]\s*([0-9.,]+\s*(?:hectare|hectares|acre|acres|ha)?)/i

                ]
            ),


        father_name:

            extractField(
                normalized,
                [

                    /(?:father(?:'s)?\s*name|father|पिता\s*का\s*नाम)\s*[:\-]\s*([^\n]+)/i

                ]
            ),


        mother_name:

            extractField(
                normalized,
                [

                    /(?:mother(?:'s)?\s*name|mother|माता\s*का\s*नाम)\s*[:\-]\s*([^\n]+)/i

                ]
            )

    };

}


/*
=====================================================
EXTRACT TEXT FROM DOCUMENT
=====================================================
*/

function decodePdfLiteralString(value) {
    return String(value)
        .replace(/\\([\\()\\])/g, "$1")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\b/g, "\b")
        .replace(/\\f/g, "\f")
        .replace(/\\([0-7]{1,3})/g, (_, octal) => {
            try { return String.fromCharCode(parseInt(octal, 8)); } catch { return ""; }
        });
}

function extractPdfStringsFromContent(content) {
    const chunks = [];

    // Text shown with Tj: (text) Tj
    const literalRegex = /\((?:\\.|[^\\)])*\)\s*Tj/g;
    let match;
    while ((match = literalRegex.exec(content))) {
        const token = match[0];
        const end = token.lastIndexOf(")");
        if (end > 0) chunks.push(decodePdfLiteralString(token.slice(1, end)));
    }

    // Text arrays: [(one) 120 (two)] TJ
    const arrayRegex = /\[(.*?)\]\s*TJ/gs;
    while ((match = arrayRegex.exec(content))) {
        const arrayBody = match[1];
        const strings = arrayBody.match(/\((?:\\.|[^\\)])*\)/g) || [];
        if (strings.length) {
            chunks.push(strings.map(item => decodePdfLiteralString(item.slice(1, -1))).join(" "));
        }
    }

    // Hex strings: <48656c6c6f> Tj
    const hexRegex = /<([0-9A-Fa-f\s]+)>\s*Tj/g;
    while ((match = hexRegex.exec(content))) {
        const hex = match[1].replace(/\s+/g, "");
        try {
            const bytes = Buffer.from(hex.length % 2 ? `${hex}0` : hex, "hex");
            chunks.push(bytes.toString("utf8").replace(/\0/g, ""));
        } catch {}
    }

    return chunks;
}

function extractPdfTextFallback(filePath) {
    const zlib = require("zlib");
    const buffer = fs.readFileSync(filePath);
    const binary = buffer.toString("latin1");
    const textParts = [];

    const streamRegex = /<<([\s\S]*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let streamMatch;

    while ((streamMatch = streamRegex.exec(binary))) {
        const dictionary = streamMatch[1];
        const raw = Buffer.from(streamMatch[2], "latin1");
        let decoded = raw;

        if (/\/FlateDecode\b/.test(dictionary)) {
            try {
                decoded = zlib.inflateSync(raw);
            } catch {
                try { decoded = zlib.inflateRawSync(raw); } catch { continue; }
            }
        }

        const content = decoded.toString("latin1");
        textParts.push(...extractPdfStringsFromContent(content));
    }

    // Some very simple PDFs keep text outside a stream.
    if (!textParts.length) {
        textParts.push(...extractPdfStringsFromContent(binary));
    }

    return textParts
        .map(cleanExtractedValue)
        .filter(Boolean)
        .join("\n");
}

async function extractTextFromDocument(file) {
    if (!file || !file.path) {
        throw new Error("Document file is required.");
    }

    const extension = path.extname(file.originalname).toLowerCase();

    if (extension === ".pdf") {
        const parserModule = getPdfParser();

        // Preferred path: pdf-parse v2.
        if (parserModule && parserModule.PDFParse) {
            try {
                const parser = new parserModule.PDFParse({ data: fs.readFileSync(file.path) });
                try {
                    const result = await parser.getText();
                    const text = result?.text || "";
                    if (text.trim()) return text;
                } finally {
                    if (typeof parser.destroy === "function") await parser.destroy();
                }
            } catch (error) {
                console.warn("pdf-parse v2 failed; trying fallback:", error.message);
            }
        }

        // Compatibility path for older pdf-parse versions.
        if (typeof parserModule === "function") {
            try {
                const result = await parserModule(fs.readFileSync(file.path));
                if (result?.text?.trim()) return result.text;
            } catch (error) {
                console.warn("Legacy pdf-parse failed; trying fallback:", error.message);
            }
        }

        const fallbackText = extractPdfTextFallback(file.path);
        if (fallbackText.trim()) return fallbackText;

        throw new Error(
            "No readable text could be extracted from this PDF. If it is a scanned image-only PDF, upload a JPG/PNG scan or enable PDF OCR on the server."
        );
    }

    if (extension === ".jpg" || extension === ".jpeg" || extension === ".png") {
        const Tesseract = require("tesseract.js");
        const result = await Tesseract.recognize(file.path, "eng");
        return result?.data?.text || "";
    }

    throw new Error("Unsupported document format.");
}


/*
=====================================================
DOCUMENT UPLOAD FALLBACK
=====================================================
*/
const manualDocumentUpload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext)) return cb(new Error("Only PDF, JPG, JPEG and PNG files are allowed."));
        cb(null, true);
    }
}).single("document");

app.post("/api/documents/upload", (req, res) => {
    manualDocumentUpload(req, res, (error) => {
        if (error) {
            const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
                ? "The uploaded file is larger than the 20 MB limit."
                : (error.message || "The document could not be uploaded.");
            return res.status(400).json({ success: false, message });
        }
        if (!req.file) return res.status(400).json({ success: false, message: "Please select a document first." });
        return res.json({
            success: true,
            message: "Document uploaded successfully.",
            file_name: req.file.originalname,
            file_type: req.file.mimetype,
            upload_url: `/uploads/${req.file.filename}`,
            manual_review: true,
            fields: {},
            confidence: "Manual",
            text: ""
        });
    });
});

/*
=====================================================
AI EXTRACTION API
=====================================================
*/

function runAIUploadMiddleware(req, res, next) {
    aiExtractionUpload(req, res, (error) => {
        if (!error) return next();

        if (error instanceof multer.MulterError) {
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "The uploaded file is larger than the 20 MB limit."
                : `Upload failed: ${error.message}`;
            return res.status(400).json({ success: false, code: error.code, message });
        }

        return res.status(400).json({
            success: false,
            message: error.message || "The uploaded document could not be processed."
        });
    });
}

app.post(
    "/api/ai/extract",

    runAIUploadMiddleware,

    async (
        req,
        res
    ) => {

        let uploadedPath =
            null;


        try {

            /*
            CHECK FILE
            */

            if (!req.file) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Please upload a PDF or image document."

                    });

            }


            uploadedPath =
                req.file.path;


            /*
            EXTRACT TEXT
            */

            const extractedText =
                await extractTextFromDocument(
                    req.file
                );


            /*
            NO TEXT
            */

            if (
                !extractedText.trim()
            ) {

                return res
                    .status(422)
                    .json({

                        success:
                            false,

                        message:
                            "No readable text was found in this document.",

                        fields: {},

                        text: ""

                    });

            }


            /*
            EXTRACT FIELDS
            */

            const fields =
                extractLandFields(
                    extractedText
                );


            /*
            COUNT
            */

            const matchedFields =

                Object.values(
                    fields
                )

                    .filter(
                        Boolean
                    )

                    .length;


            /*
            CONFIDENCE
            */

            let confidence =
                "None";


            if (
                matchedFields >= 6
            ) {

                confidence =
                    "High";

            }

            else if (
                matchedFields >= 3
            ) {

                confidence =
                    "Medium";

            }

            else if (
                matchedFields > 0
            ) {

                confidence =
                    "Low";

            }


            /*
            RESPONSE
            */

            return res.json({

                success:
                    true,

                condition:
                    matchedFields > 0,

                file_name: req.file.originalname,
                file_type: req.file.mimetype,
                confidence,

                fields,

                text:
                    extractedText
                        .substring(
                            0,
                            12000
                        )

            });


        } catch (
            error
        ) {

            console.error(
                "AI EXTRACTION ERROR:",
                error
            );


            // A valid document must never be rejected only because OCR/text
            // extraction failed. Keep the uploaded file so the officer can
            // review it manually and return a structured JSON response.
            let storedName = null;
            let uploadUrl = null;
            if (uploadedPath && fs.existsSync(uploadedPath)) {
                try {
                    const ext = path.extname(req.file.originalname).toLowerCase();
                    storedName = `review-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
                    const destination = path.join(UPLOAD_DIR, storedName);
                    fs.renameSync(uploadedPath, destination);
                    uploadedPath = null;
                    uploadUrl = `/uploads/${storedName}`;
                } catch (storeError) {
                    console.error("MANUAL REVIEW STORE ERROR:", storeError);
                }
            }

            return res.status(200).json({
                success: true,
                condition: false,
                confidence: "Manual",
                fields: {},
                text: "",
                file_name: req.file?.originalname || "Document",
                file_type: req.file?.mimetype || "",
                upload_url: uploadUrl,
                manual_review: true,
                warning: "The document was uploaded successfully, but automatic text extraction was unavailable. The document is available for officer review."
            });


        } finally {

            /*
            DELETE TEMPORARY
            AI FILE
            */

            if (

                uploadedPath &&

                fs.existsSync(
                    uploadedPath
                )

            ) {

                try {

                    fs.unlinkSync(
                        uploadedPath
                    );

                }

                catch (_) {}

            }

        }

    }
);


/*
=====================================================
ERROR HANDLER
=====================================================
*/

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "SERVER ERROR:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(
                error
            );

        }


        return res
            .status(400)
            .json({

                success:
                    false,

                message:
                    error.message ||
                    "Something went wrong."

            });

    }
);


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        service: "BhuRakshak",
        database: fs.existsSync(DB_FILE),
        uploadDirectory: fs.existsSync(UPLOAD_DIR)
    });
});


/*
=====================================================
START SERVER
=====================================================
*/

// Always return JSON for API failures so the frontend can show a useful popup.
app.use((error, req, res, next) => {
    console.error("SERVER ERROR:", error);
    if (res.headersSent) return next(error);

    const isApi = req.path.startsWith("/api/");
    if (isApi) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "The server could not complete the request."
        });
    }

    return res.status(error.statusCode || 500).send("Server error");
});

app.listen(
    PORT,
    () => {

        console.log(
            "================================="
        );

        console.log(
            "BhuRakshak Server Started"
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            `Database: ${DB_FILE}`
        );

        console.log(
            "================================="
        );

    }
);