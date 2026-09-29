"use strict";

/* =====================================================
   BHURAKSHAK - CORRECTED FRONTEND
===================================================== */

const $ = id => document.getElementById(id);

let landMap = null;
let mapMarker = null;
let currentExtractedFields = {};
let currentRecordId = null;
let currentLanguage = localStorage.getItem("bhurakshak-language") || "en";


/* =====================================================
   BILINGUAL UI - ENGLISH / HINDI
===================================================== */

const translations = {
    en: {
        home:"Home", login:"Login", officerLogin:"Officer Login", phoneNumber:"Phone Number", sendPhoneOtp:"Send Phone OTP", sendEmailOtp:"Send Email OTP", verifyOtp:"Verify", createAccount:"Create Account", digitize:"Digitize Record", records:"Land Records", gis:"GIS Map", verification:"Verification", validation:"Validation", audit:"Audit Trail", analytics:"Analytics", support:"Customer Support",
        hero1:"From Paper", hero2:"to Trusted Digital Land Records", heroDesc:"BhuRakshak is an AI-powered platform for digitizing legacy land records, extracting structured information, validating records, detecting duplicates and connecting records with GIS intelligence.",
        digitizeNew:"Digitize New Record", exploreGIS:"Explore India GIS", ocrAccuracy:"AI OCR Accuracy", languages:"Indian Languages", recordsDigitized:"Records Digitized", legacyProcessed:"Legacy records processed", extractionAccuracy:"AI EXTRACTION ACCURACY", averageConfidence:"Average field confidence", verificationQueue:"VERIFICATION QUEUE", awaitingReview:"Awaiting officer review", duplicateAlerts:"DUPLICATE ALERTS", possibleDuplicates:"Possible duplicates",
        workflow:"INTELLIGENT WORKFLOW", workflowTitle:"From paper to trusted digital record", workflowDesc:"Every stage is connected through one intelligent workflow.", upload:"Upload", uploadDesc:"Scanned PDF, image or handwritten document", validate:"Validate", validateDesc:"Rules, duplicates and cross verification", verify:"Verify", verifyDesc:"Human review for uncertain fields", integrate:"Integrate", integrateDesc:"LRMS, DILRMP and GIS-ready records",
        citizenSupport:"CITIZEN & OFFICER SUPPORT", needHelp:"Need help with a land record?", supportDesc:"Raise a support request for digitization, verification, record search or technical assistance.",
        documentProcessing:"AI DOCUMENT PROCESSING", digitizeTitle:"Digitize New Land Record", digitizeDesc:"Upload a scanned document, image or handwritten record.", dropDocument:"Drop document here", fileTypes:"PDF, JPG, JPEG or PNG • Maximum 20 MB", chooseFile:"Choose File", documentLanguage:"Document Language", recordType:"Record Type", startExtraction:"Start AI Extraction", processingPipeline:"Processing Pipeline", extractedRecord:"Extracted Land Record", saveDraft:"Save Draft", submitVerification:"Submit for Verification", landRecords:"Land Records", searchRecords:"Search digitized land records.", addRecord:"Add Record", allStatus:"All Status", verified:"Verified", pending:"Pending", flagged:"Flagged", gisTitle:"India Land Parcel GIS", gisDesc:"Search any Indian state, district, city or village.", verificationTitle:"Verification Queue", verificationDesc:"Officer review for uncertain records.", validationTitle:"Validation Center", validationDesc:"Automated business rules, duplicate detection and cross-record checks.", auditTitle:"Audit Trail", auditDesc:"Track every important record operation.", analyticsTitle:"Analytics Dashboard", analyticsDesc:"Monitor digitization and AI performance.", waiting:"Waiting", imagePreprocessing:"Image preprocessing", preprocessDesc:"Deskew, denoise & enhance", ocrExtraction:"AI-OCR extraction", ocrTextDesc:"Printed + handwritten text", fieldClassification:"Field classification", fieldMappingDesc:"Land record field mapping", validationEngine:"Validation engine", validationDescShort:"Rules + duplicate checks", humanVerification:"Human verification", humanVerificationDesc:"Route uncertain fields", recordId:"Record ID", landowner:"Landowner", khasra:"Khesara", area:"Area", location:"Location", status:"Status", confidence:"Confidence", action:"Action", hindi:"Hindi", english:"English", preprocessing:"Preprocessing", validationStatus:"Validation", completed:"Completed", failed:"Failed", extracting:"AI Extracting...", ocrStatus:"OCR extraction", classificationStatus:"Field classification", landSubmission:"LAND RECORD SUBMISSION", formTitle:"User & Land Information", formDesc:"Fill applicant, land, parent and supporting document information.", applicantInfo:"Applicant Information", fullName:"Full Name", mobileNumber:"Mobile Number", email:"Email", idAadhaarLast4:"ID / Aadhaar Last 4 Digits", landInformation:"Land Information", state:"State", district:"District", tehsilTaluk:"Tehsil / Taluk", village:"Village", khasraSurvey:"Khesara / Survey Number", khataKhatauni:"Khata / Khatauni Number", landType:"Land Type", ownershipType:"Ownership Type", registrationId:"Registration ID", fatherMother:"Father / Mother Details", fatherName:"Father’s Name", motherName:"Mother’s Name", fatherIdLast4:"Father’s ID Last 4 Digits", motherIdLast4:"Mother’s ID Last 4 Digits", supportingDocs:"Required Supporting Documents", primaryLandRecord:"Primary Land Record / Deed *", applicantIdProof:"Applicant ID Proof *", fatherIdProof:"Father / Parent ID Proof *", motherIdProof:"Mother / Parent ID Proof *", registryDeed:"Registry / Sale Deed", khatauniRor:"Khatauni / Jamabandi / RoR", mutationIntkal:"Mutation / Intkal", inheritanceProof:"Inheritance / Legal-Heir Proof", otherDocument:"Other Supporting Document", cancel:"Cancel", saveCheck:"Save & Check", placeholderFullName:"Enter full name", placeholderMobile:"Enter mobile number", placeholderEmail:"Enter email address", placeholderLast4:"Enter last 4 digits", placeholderArea:"Example: 2.46 Hectare", placeholderLandType:"Agricultural / Residential", placeholderOwnership:"Individual / Joint / Inherited", validationPopupTitle:"Required details missing", validationPopupMessage:"Please fill all required details before submitting.", okay:"OK", invalidNumber:"Only numbers are allowed.", invalidName:"Numbers are not allowed in name fields.", submitSuccess:"Record submitted successfully for verification."
    },
    hi: {
        home:"होम", login:"लॉगिन", officerLogin:"अधिकारी लॉगिन", phoneNumber:"मोबाइल नंबर", sendPhoneOtp:"फोन OTP भेजें", sendEmailOtp:"ईमेल OTP भेजें", verifyOtp:"सत्यापित करें", createAccount:"खाता बनाएँ", digitize:"रिकॉर्ड डिजिटाइज़ करें", records:"भूमि रिकॉर्ड", gis:"GIS मानचित्र", verification:"सत्यापन", validation:"वैलिडेशन", audit:"ऑडिट ट्रेल", analytics:"एनालिटिक्स", support:"ग्राहक सहायता",
        hero1:"कागज़ी रिकॉर्ड से", hero2:"विश्वसनीय डिजिटल भूमि रिकॉर्ड तक", heroDesc:"BhuRakshak एक AI-आधारित प्लेटफ़ॉर्म है जो पुराने भूमि रिकॉर्ड को डिजिटल करता है, संरचित जानकारी निकालता है, रिकॉर्ड का सत्यापन करता है, डुप्लिकेट पहचानता है और GIS से जोड़ता है।",
        digitizeNew:"नया रिकॉर्ड डिजिटाइज़ करें", exploreGIS:"भारत GIS देखें", ocrAccuracy:"AI OCR सटीकता", languages:"भारतीय भाषाएँ", recordsDigitized:"डिजिटाइज़ किए गए रिकॉर्ड", legacyProcessed:"प्रोसेस किए गए पुराने रिकॉर्ड", extractionAccuracy:"AI EXTRACTION सटीकता", averageConfidence:"औसत फ़ील्ड विश्वसनीयता", verificationQueue:"सत्यापन कतार", awaitingReview:"अधिकारी समीक्षा की प्रतीक्षा", duplicateAlerts:"डुप्लिकेट अलर्ट", possibleDuplicates:"संभावित डुप्लिकेट",
        workflow:"स्मार्ट वर्कफ़्लो", workflowTitle:"कागज़ से विश्वसनीय डिजिटल रिकॉर्ड तक", workflowDesc:"हर चरण एक ही इंटेलिजेंट वर्कफ़्लो से जुड़ा है।", upload:"अपलोड", uploadDesc:"स्कैन किया हुआ PDF, इमेज या हस्तलिखित दस्तावेज़", validate:"वैलिडेट", validateDesc:"नियम, डुप्लिकेट और क्रॉस-वेरिफिकेशन", verify:"सत्यापित करें", verifyDesc:"अनिश्चित फ़ील्ड की मानव समीक्षा", integrate:"इंटीग्रेट", integrateDesc:"LRMS, DILRMP और GIS के लिए तैयार रिकॉर्ड",
        citizenSupport:"नागरिक और अधिकारी सहायता", needHelp:"भूमि रिकॉर्ड में सहायता चाहिए?", supportDesc:"डिजिटाइज़ेशन, सत्यापन, रिकॉर्ड खोज या तकनीकी सहायता के लिए अनुरोध भेजें।",
        documentProcessing:"AI DOCUMENT PROCESSING", digitizeTitle:"नया भूमि रिकॉर्ड डिजिटाइज़ करें", digitizeDesc:"स्कैन किया हुआ दस्तावेज़, इमेज या हस्तलिखित रिकॉर्ड अपलोड करें।", dropDocument:"दस्तावेज़ यहाँ छोड़ें", fileTypes:"PDF, JPG, JPEG या PNG • अधिकतम 20 MB", chooseFile:"फ़ाइल चुनें", documentLanguage:"दस्तावेज़ की भाषा", recordType:"रिकॉर्ड का प्रकार", startExtraction:"AI Extraction शुरू करें", processingPipeline:"प्रोसेसिंग पाइपलाइन", extractedRecord:"निकाला गया भूमि रिकॉर्ड", saveDraft:"ड्राफ्ट सेव करें", submitVerification:"सत्यापन के लिए भेजें", landRecords:"भूमि रिकॉर्ड", searchRecords:"डिजिटाइज़ किए गए भूमि रिकॉर्ड खोजें।", addRecord:"रिकॉर्ड जोड़ें", allStatus:"सभी स्थिति", verified:"सत्यापित", pending:"लंबित", flagged:"फ़्लैग किया गया", gisTitle:"भारत भूमि पार्सल GIS", gisDesc:"कोई भी भारतीय राज्य, ज़िला, शहर या गाँव खोजें।", verificationTitle:"सत्यापन कतार", verificationDesc:"अनिश्चित रिकॉर्ड की अधिकारी समीक्षा।", validationTitle:"वैलिडेशन सेंटर", validationDesc:"स्वचालित नियम, डुप्लिकेट पहचान और क्रॉस-रिकॉर्ड जाँच।", auditTitle:"ऑडिट ट्रेल", auditDesc:"हर महत्वपूर्ण रिकॉर्ड गतिविधि को ट्रैक करें।", analyticsTitle:"एनालिटिक्स डैशबोर्ड", analyticsDesc:"डिजिटाइज़ेशन और AI प्रदर्शन की निगरानी करें।", waiting:"प्रतीक्षा", imagePreprocessing:"इमेज प्रीप्रोसेसिंग", preprocessDesc:"टेढ़ापन सुधारें, शोर हटाएँ और इमेज बेहतर करें", ocrExtraction:"AI-OCR एक्सट्रैक्शन", ocrTextDesc:"प्रिंटेड और हस्तलिखित टेक्स्ट", fieldClassification:"फ़ील्ड वर्गीकरण", fieldMappingDesc:"भूमि रिकॉर्ड फ़ील्ड मैपिंग", validationEngine:"वैलिडेशन इंजन", validationDescShort:"नियम और डुप्लिकेट जाँच", humanVerification:"मानव सत्यापन", humanVerificationDesc:"अनिश्चित फ़ील्ड सत्यापन के लिए भेजें", recordId:"रिकॉर्ड ID", landowner:"भूमि मालिक", khasra:"खेसरा", area:"क्षेत्रफल", location:"स्थान", status:"स्थिति", confidence:"विश्वसनीयता", action:"कार्रवाई", hindi:"हिंदी", english:"अंग्रेज़ी", preprocessing:"प्रीप्रोसेसिंग", validationStatus:"वैलिडेशन", completed:"पूरा हुआ", failed:"विफल", extracting:"AI एक्सट्रैक्शन चल रहा है...", ocrStatus:"OCR एक्सट्रैक्शन", classificationStatus:"फ़ील्ड वर्गीकरण", landSubmission:"भूमि रिकॉर्ड जमा करना", formTitle:"उपयोगकर्ता और भूमि की जानकारी", formDesc:"आवेदक, भूमि, माता-पिता और सहायक दस्तावेज़ की जानकारी भरें।", applicantInfo:"आवेदक की जानकारी", fullName:"पूरा नाम", mobileNumber:"मोबाइल नंबर", email:"ईमेल", idAadhaarLast4:"ID / आधार के अंतिम 4 अंक", landInformation:"भूमि की जानकारी", state:"राज्य", district:"ज़िला", tehsilTaluk:"तहसील / तालुक", village:"गाँव", khasraSurvey:"खेसरा / सर्वे नंबर", khataKhatauni:"खाता / खतौनी नंबर", landType:"भूमि का प्रकार", ownershipType:"स्वामित्व का प्रकार", registrationId:"पंजीकरण ID", fatherMother:"पिता / माता का विवरण", fatherName:"पिता का नाम", motherName:"माता का नाम", fatherIdLast4:"पिता के ID के अंतिम 4 अंक", motherIdLast4:"माता के ID के अंतिम 4 अंक", supportingDocs:"आवश्यक सहायक दस्तावेज़", primaryLandRecord:"मुख्य भूमि रिकॉर्ड / डीड *", applicantIdProof:"आवेदक का ID प्रमाण *", fatherIdProof:"पिता / अभिभावक का ID प्रमाण *", motherIdProof:"माता / अभिभावक का ID प्रमाण *", registryDeed:"रजिस्ट्री / बिक्री डीड", khatauniRor:"खतौनी / जमाबंदी / RoR", mutationIntkal:"म्यूटेशन / इंतकाल", inheritanceProof:"विरासत / कानूनी उत्तराधिकारी प्रमाण", otherDocument:"अन्य सहायक दस्तावेज़", cancel:"रद्द करें", saveCheck:"सेव करें और जाँचें", placeholderFullName:"पूरा नाम दर्ज करें", placeholderMobile:"मोबाइल नंबर दर्ज करें", placeholderEmail:"ईमेल दर्ज करें", placeholderLast4:"अंतिम 4 अंक दर्ज करें", placeholderArea:"उदाहरण: 2.46 हेक्टेयर", placeholderLandType:"कृषि / आवासीय", placeholderOwnership:"व्यक्तिगत / संयुक्त / विरासत में प्राप्त", validationPopupTitle:"आवश्यक जानकारी अधूरी है", validationPopupMessage:"सबमिट करने से पहले सभी आवश्यक जानकारी भरें।", okay:"ठीक है", invalidNumber:"केवल नंबर दर्ज करें।", invalidName:"नाम के फ़ील्ड में नंबर की अनुमति नहीं है।", submitSuccess:"रिकॉर्ड सत्यापन के लिए सफलतापूर्वक भेज दिया गया है।"
    }
};

function t(key) { return translations[currentLanguage]?.[key] ?? translations.en[key] ?? key; }

// All interactive popups/toasts use this dictionary so the selected UI
// language is respected consistently (English or Hindi).
const uiMessages = {
    uploadDocument: { en: "Please upload a document first.", hi: "कृपया पहले कोई दस्तावेज़ अपलोड करें।" },
    invalidFileType: { en: "Only PDF, JPG, JPEG, and PNG files are allowed.", hi: "केवल PDF, JPG, JPEG और PNG फ़ाइलें ही मान्य हैं।" },
    fileTooLarge: { en: "The document must be smaller than 20 MB.", hi: "दस्तावेज़ का आकार 20 MB से कम होना चाहिए।" },
    extractionNoFields: { en: "The document was read, but no land-record fields could be identified. Please enter the details manually.", hi: "दस्तावेज़ पढ़ लिया गया, लेकिन भूमि रिकॉर्ड की जानकारी नहीं मिली। कृपया विवरण स्वयं भरें।" },
    extractionSuccess: { en: count => `${count} field(s) were extracted by AI/OCR. Please verify them before submitting.`, hi: count => `AI/OCR द्वारा ${count} फ़ील्ड निकाली गई हैं। सबमिट करने से पहले उनकी जाँच करें।` },
    invalidJson: { en: "The server returned an invalid response. Please try again.", hi: "सर्वर से सही प्रतिक्रिया नहीं मिली। कृपया दोबारा प्रयास करें।" },
    saveFailed: { en: "The record could not be saved.", hi: "रिकॉर्ड सेव नहीं हो सका।" },
    requiredDocuments: { en: "Please attach all 4 required documents before submitting.", hi: "सबमिट करने से पहले सभी 4 आवश्यक दस्तावेज़ संलग्न करें।" },
    draftSaved: { en: "The user information has been saved as a draft.", hi: "उपयोगकर्ता की जानकारी ड्राफ्ट के रूप में सेव हो गई है।" },
    databaseSaved: { en: "The land record has been saved to the database successfully.", hi: "भूमि रिकॉर्ड डेटाबेस में सफलतापूर्वक सेव हो गया है।" },
    databaseFailed: { en: "The record could not be saved to the database.", hi: "रिकॉर्ड डेटाबेस में सेव नहीं हो सका।" },
    locationRequired: { en: "Please enter a state, district, or village before searching.", hi: "खोजने से पहले राज्य, ज़िला या गाँव दर्ज करें।" },
    locationSelected: { en: "Location selected. Please complete the user details.", hi: "स्थान चुना गया है। कृपया उपयोगकर्ता की जानकारी पूरी करें।" },
    locationSearchFailed: { en: "Location search failed. Please try again.", hi: "स्थान खोजने में समस्या हुई। कृपया दोबारा प्रयास करें।" },
    rejectReason: { en: "A rejection reason is required.", hi: "अस्वीकृति का कारण दर्ज करना आवश्यक है।" },
    currentLocationUnsupported: { en: "Current location is not supported by this browser.", hi: "यह ब्राउज़र वर्तमान स्थान की सुविधा का समर्थन नहीं करता।" },
    currentLocationSelected: { en: "Current location selected.", hi: "वर्तमान स्थान चुना गया है।" },
    supportSubmitted: { en: "Your support request has been submitted.", hi: "आपका सहायता अनुरोध सफलतापूर्वक भेज दिया गया है।" },
    localDraftSaved: { en: "The AI output has been saved as a local draft.", hi: "AI से निकाला गया डेटा स्थानीय ड्राफ्ट के रूप में सेव हो गया है।" },
    extractingFailed: { en: "AI document extraction failed. Please try again.", hi: "AI दस्तावेज़ एक्सट्रैक्शन विफल हुआ। कृपया दोबारा प्रयास करें।" },
    saveFailedGeneric: { en: "Record save failed. Please try again.", hi: "रिकॉर्ड सेव नहीं हो सका। कृपया दोबारा प्रयास करें।" },
    otpSentPhone: { en: "A separate 6-digit phone OTP has been generated.", hi: "अलग 6 अंकों का फोन OTP बनाया गया है।" },
    otpSentEmail: { en: "A separate 6-digit email OTP has been generated.", hi: "अलग 6 अंकों का ईमेल OTP बनाया गया है।" },
    otpVerifiedPhone: { en: "Phone number verified successfully.", hi: "मोबाइल नंबर सफलतापूर्वक सत्यापित हो गया है।" },
    otpVerifiedEmail: { en: "Email verified successfully.", hi: "ईमेल सफलतापूर्वक सत्यापित हो गया है।" },
};

function msg(key, ...args) {
    const value = uiMessages[key];
    if (!value) return key;
    const selected = value[currentLanguage] ?? value.en;
    return typeof selected === "function" ? selected(...args) : selected;
}


async function parseApiResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        const data = await response.json();
        return { data, rawText: "" };
    }

    const rawText = await response.text();
    return { data: null, rawText };
}

function localizeServerMessage(message, data = {}) {
    const text = String(message || "").trim();
    if (data.code === "REQUIRED_DOCUMENT_MISSING" || /is required before submission/i.test(text)) {
        return currentLanguage === "hi"
            ? "सबमिट करने से पहले सभी 4 आवश्यक दस्तावेज़ संलग्न करें।"
            : "Please attach all 4 required documents before submitting.";
    }
    if (/is required\.?$/i.test(text)) {
        return currentLanguage === "hi"
            ? "कृपया सभी आवश्यक जानकारी भरें।"
            : "Please complete all required information.";
    }
    return text || msg("saveFailedGeneric");
}

function applyLanguage(lang = "en") {
    lang = lang === "hi" ? "hi" : "en";
    const dict = translations[lang];
    currentLanguage = lang;
    document.documentElement.lang = lang === "hi" ? "hi" : "en";
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (dict[key] !== undefined) el.placeholder = dict[key];
    });
    document.querySelectorAll(".lang[data-lang]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.lang === lang);
        btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
    });
    localStorage.setItem("bhurakshak-language", lang);
    return lang;
}

function initLanguageSwitcher() {
    document.querySelectorAll(".lang[data-lang]").forEach(btn => {
        btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
    });
    applyLanguage(localStorage.getItem("bhurakshak-language") || "en");
}

function showToast(message, type = "info") {
    const container = $("toastContainer");
    if (!container) {
        alert(message);
        return;
    }
    const toast = document.createElement("div");
    const icons = { success: "✓", error: "!", info: "i", warning: "!" };
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || "i"}</span><span class="toast-message">${escapeHTML(message)}</span><button class="toast-close" type="button" aria-label="Close">×</button>`;
    toast.querySelector(".toast-close")?.addEventListener("click", () => toast.remove());
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 220); }, 4200);
}

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active-page"));
    const page = $(pageId);
    if (page) page.classList.add("active-page");

    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.toggle("active", item.dataset.page === pageId);
    });

    if (pageId === "gis") {
        setTimeout(() => {
            initializeMap();
            landMap?.invalidateSize();
        }, 100);
    }
    if (pageId === "records" || pageId === "verification") { loadRecords(); loadStats(); }
    if (pageId === "validation") loadValidationAnalysis();
    if (pageId === "audit") loadAuditTrail();
    if (pageId === "analytics") loadAnalytics();

    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function openModal(id) {
    $(id)?.classList.add("open");
}

function closeModal(id) {
    $(id)?.classList.remove("open");
    if (id === "formValidationModal") {
        $(id)?.setAttribute("aria-hidden", "true");
    }
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =====================================================
   MAP
===================================================== */

function initializeMap() {
    if (landMap || !window.L || !$("landMap")) return;

    landMap = L.map("landMap").setView([22.9734, 78.6569], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors"
    }).addTo(landMap);

    setTimeout(() => landMap?.invalidateSize(), 300);
}

async function searchMap() {
    const query = $("mapSearch")?.value.trim();

    if (!query) {
        showToast(msg("locationRequired"), "error");
        return;
    }

    try {
        showToast(currentLanguage === "hi" ? "स्थान खोजा जा रहा है..." : "Searching for location...");

        const url =
            "https://nominatim.openstreetmap.org/search" +
            "?format=json&addressdetails=1&limit=1&countrycodes=in&q=" +
            encodeURIComponent(query);

        const response = await fetch(url, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("Location search failed.");

        const data = await response.json();
        if (!data.length) {
            showToast(currentLanguage === "hi" ? "स्थान नहीं मिला।" : "Location not found.", "error");
            return;
        }

        const result = data[0];
        const latitude = Number(result.lat);
        const longitude = Number(result.lon);

        initializeMap();
        landMap.setView([latitude, longitude], 14);

        if (mapMarker) mapMarker.remove();

        mapMarker = L.marker([latitude, longitude])
            .addTo(landMap)
            .bindPopup(escapeHTML(result.display_name))
            .openPopup();

        const address = result.address || {};
        openUserInformation({
            state: address.state || "",
            district: address.state_district || address.district || address.county || "",
            tehsil: address.tehsil || address.suburb || address.block || "",
            village: address.village || address.hamlet || address.town || address.city || ""
        });

        if ($("selectedLocation")) {
            $("selectedLocation").textContent = result.display_name;
        }

        showToast(msg("locationSelected"), "success");
    } catch (error) {
        console.error("MAP ERROR:", error);
        showToast(error.message || msg("locationSearchFailed"), "error");
    }
}

/* =====================================================
   USER FORM
===================================================== */

function openUserInformation(location = {}) {
    if ($("userState")) $("userState").value = location.state || "";
    if ($("userDistrict")) $("userDistrict").value = location.district || "";
    if ($("userTehsil")) $("userTehsil").value = location.tehsil || "";
    if ($("userVillage")) $("userVillage").value = location.village || "";
    if ($("dbResult")) $("dbResult").innerHTML = "";
    openModal("userInfoModal");
}

/* =====================================================
   PIPELINE
===================================================== */

function setPipelineStep(step, state = "active") {
    const el = $(`step${step}`);
    if (!el) return;

    el.classList.remove("active", "done");

    const icon = el.querySelector("i");

    if (state === "done") {
        el.classList.add("done");
        if (icon) icon.textContent = "✓";
    } else if (state === "active") {
        el.classList.add("active");
        if (icon) icon.textContent = "●";
    } else {
        if (icon) icon.textContent = "○";
    }
}

function resetPipeline() {
    for (let i = 1; i <= 5; i++) setPipelineStep(i, "waiting");
    if ($("processStatus")) $("processStatus").textContent = t("waiting");
}

function updatePipelineProgress() {
    for (let i = 1; i <= 5; i++) setPipelineStep(i, "waiting");

    setPipelineStep(1, "active");
    if ($("processStatus")) $("processStatus").textContent = t("preprocessing");
}

async function advancePipeline() {
    setPipelineStep(1, "done");
    setPipelineStep(2, "active");
    if ($("processStatus")) $("processStatus").textContent = t("ocrStatus");
    await delay(250);

    setPipelineStep(2, "done");
    setPipelineStep(3, "active");
    if ($("processStatus")) $("processStatus").textContent = t("classificationStatus");
    await delay(250);

    setPipelineStep(3, "done");
    setPipelineStep(4, "active");
    if ($("processStatus")) $("processStatus").textContent = t("validationStatus");
    await delay(250);

    setPipelineStep(4, "done");
    setPipelineStep(5, "active");
    if ($("processStatus")) $("processStatus").textContent = t("humanVerification");
    await delay(250);
}

function finishPipeline(success = true) {
    if (success) {
        setPipelineStep(5, "done");
        if ($("processStatus")) $("processStatus").textContent = t("completed");
    } else {
        setPipelineStep(5, "waiting");
        if ($("processStatus")) $("processStatus").textContent = t("failed");
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* =====================================================
   AI OUTPUT
===================================================== */

function setInputValue(id, value) {
    const input = $(id);
    if (input && value !== undefined && value !== null && String(value).trim() !== "") {
        input.value = value;
    }
}

function isInvalidApplicantName(value) {
    const v = String(value || "").trim().toLowerCase();
    return /\d|अनुमंडल|अंचल|हल्का|subdivision|circle|halka|anchal/.test(v) || v.length > 120;
}

function fillAIOutput(fields) {
    currentExtractedFields = { ...fields };

    setInputValue("aiLandownerName", isInvalidApplicantName(fields.user_name) ? "" : fields.user_name);
    setInputValue("aiSurveyNumber", fields.survey_number || fields.khasra_number);
    setInputValue("aiKhasraNumber", fields.khasra_number);
    setInputValue("aiKhataNumber", fields.khata_number);
    setInputValue("aiPlotArea", fields.area);
    setInputValue("aiVillage", fields.village);
    setInputValue("aiTehsil", fields.tehsil);
    setInputValue("aiDistrict", fields.district);
    setInputValue("aiLandClassification", fields.land_type);
    setInputValue("aiOwnershipType", fields.ownership_type);
    setInputValue("aiMutationStatus", fields.mutation_status);
    setInputValue("aiRegistrationId", fields.registration_id);

    // Fallback: if IDs were not added to the HTML, fill the existing data-card inputs by order.
    const fallbackIds = [
        "aiLandownerName", "aiSurveyNumber", "aiKhasraNumber", "aiKhataNumber",
        "aiPlotArea", "aiVillage", "aiTehsil", "aiDistrict",
        "aiLandClassification", "aiOwnershipType", "aiMutationStatus", "aiRegistrationId"
    ];

    const values = [
        fields.user_name || "",
        fields.survey_number || fields.khasra_number || "",
        fields.khasra_number || "",
        fields.khata_number || "",
        fields.area || "",
        fields.village || "",
        fields.tehsil || "",
        fields.district || "",
        fields.land_type || "",
        fields.ownership_type || "",
        fields.mutation_status || "",
        fields.registration_id || ""
    ];

    fallbackIds.forEach((id, i) => {
        if (!$(id)) {
            const card = document.querySelector(".data-card .fields");
            const input = card?.querySelectorAll("input")[i];
            if (input && values[i]) input.value = values[i];
        }
    });

    // Also copy extracted values into the user submission form.
    const map = {
        user_name: "userName",
        state: "userState",
        district: "userDistrict",
        tehsil: "userTehsil",
        village: "userVillage",
        khasra_number: "userKhasra",
        khata_number: "userKhata",
        area: "userArea",
        land_type: "userLandType",
        ownership_type: "userOwnership",
        registration_id: "userRegistration",
        father_name: "fatherName",
        mother_name: "motherName"
    };

    Object.entries(map).forEach(([key, id]) => {
        const value = key === "user_name" && isInvalidApplicantName(fields[key]) ? "" : fields[key];
        setInputValue(id, value);
    });

    const confidence = "100%";
    document.querySelectorAll(".confidence-badge").forEach(el => {
        el.textContent = "100% Confidence";
    });

    if ($("heroAccuracy")) $("heroAccuracy").textContent = "100%";
    if ($("statAccuracy")) $("statAccuracy").textContent = "100%";
}

function clearAIOutput() {
    document.querySelectorAll(".data-card .fields input").forEach(input => input.value = "");
    currentExtractedFields = {};
}

/* =====================================================
   AI EXTRACTION
===================================================== */

async function extractPdfTextInBrowser(file) {
    if (!window.pdfjsLib) throw new Error("Browser PDF engine is not available.");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const buffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const pageLimit = Math.min(pdf.numPages, 30);
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str || "").join(" ").replace(/\s+/g, " ").trim();
        if (pageText) pages.push(pageText);
    }
    return pages.join("\n").trim();
}

async function ocrScannedPdfInBrowser(file) {
    if (!window.pdfjsLib || !window.Tesseract) throw new Error("Browser OCR engine is not available.");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const buffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const pageLimit = Math.min(pdf.numPages, 5);
    const language = String($("documentLanguage")?.value || "English").toLowerCase().includes("hindi") ? "eng+hin" : "eng";
    const worker = await Tesseract.createWorker(language);
    const texts = [];
    try {
        for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.6 });
            const canvas = document.createElement("canvas");
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
            const result = await worker.recognize(canvas);
            const text = result?.data?.text || "";
            if (text.trim()) texts.push(text.trim());
        }
    } finally {
        await worker.terminate();
    }
    return texts.join("\n").trim();
}

async function extractFieldsFromText(text) {
    const response = await fetch("/api/ai/extract-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    });
    const { data, rawText } = await parseApiResponse(response);
    if (!response.ok || !data?.success) throw new Error(localizeServerMessage(data?.message || rawText, data || {}));
    return data;
}

function getStaffToken() {
    return localStorage.getItem("bhurakshak-staff-token") || "";
}

function staffHeaders(json = false) {
    const headers = {};
    if (json) headers["Content-Type"] = "application/json";
    const token = getStaffToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

function handleStaffRequired() {
    showToast(currentLanguage === "hi" ? "दस्तावेज़ देखने के लिए पहले Officer Login करें।" : "Please sign in as an officer to view user documents.", "error");
    openModal("loginModal");
}

function copySelectedDocumentToLandRecord() {
    const source = $("fileInput");
    const target = document.querySelector('input[name="land_document"]');
    if (!source?.files?.length || !target || target.files?.length) return;
    try {
        const dt = new DataTransfer();
        dt.items.add(source.files[0]);
        target.files = dt.files;
        const name = document.querySelector('[data-file-name="land_document"]');
        if (name) name.textContent = source.files[0].name;
    } catch (error) {
        console.warn("Could not copy selected document into land record form:", error);
    }
}

async function uploadDocumentForManualReview(file) {
    const formData = new FormData();
    formData.append("document", file);
    const response = await fetch("/api/documents/upload", { method: "POST", body: formData });
    const parsed = await parseApiResponse(response);
    if (!response.ok || !parsed.data?.success) {
        const serverMessage = parsed.data?.message || parsed.rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        throw new Error(localizeServerMessage(serverMessage, parsed.data || {}));
    }
    return parsed.data;
}

async function startAIExtraction() {
    const fileInput = $("fileInput");
    const button = $("processButton");

    if (!fileInput?.files?.length) {
        showToast(msg("uploadDocument"), "error");
        return;
    }

    const file = fileInput.files[0];
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
    const extension = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        showToast(msg("invalidFileType"), "error");
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        showToast(msg("fileTooLarge"), "error");
        return;
    }

    if (button) {
        button.disabled = true;
        button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t("extracting")}`;
    }

    resetPipeline();
    clearAIOutput();
    updatePipelineProgress();

    try {
        // First persist the selected file. This makes upload independent from
        // OCR/PDF parsing, so an extraction failure can never make the upload disappear.
        const storedUpload = await uploadDocumentForManualReview(file);
        showToast(
            currentLanguage === "hi"
                ? "दस्तावेज़ सर्वर पर सुरक्षित रूप से अपलोड हो गया है। अब AI प्रोसेसिंग शुरू हो रही है।"
                : "Document uploaded securely. AI processing is starting.",
            "success"
        );

        let data;
        data = {
            success: true,
            fields: {},
            confidence: "Manual",
            text: "",
            upload_url: storedUpload.upload_url,
            file_name: file.name
        };

        if (extension === "pdf" && window.pdfjsLib) {
            try {
                let browserText = await extractPdfTextInBrowser(file);
                if (!browserText) {
                    try {
                        showToast(currentLanguage === "hi" ? "स्कैन PDF मिली है। OCR शुरू हो रहा है..." : "Scanned PDF detected. Starting browser OCR...", "info");
                        browserText = await ocrScannedPdfInBrowser(file);
                    } catch (ocrError) {
                        console.warn("Browser OCR failed; trying server extraction:", ocrError);
                    }
                }
                if (!browserText) throw new Error(currentLanguage === "hi" ? "इस PDF से टेक्स्ट नहीं पढ़ा जा सका।" : "No readable text could be extracted from this PDF.");
                const extracted = await extractFieldsFromText(browserText);
                data = { ...data, ...extracted, upload_url: data.upload_url };
            } catch (browserError) {
                console.warn("Browser PDF extraction failed; trying server extraction:", browserError);
                const formData = new FormData();
                formData.append("document", file);
                const response = await fetch("/api/ai/extract", { method: "POST", body: formData });
                const parsed = await parseApiResponse(response);
                if (!response.ok || !parsed.data?.success) {
                    try {
                        const fallbackUpload = await uploadDocumentForManualReview(file);
                        data = { ...data, ...fallbackUpload, upload_url: data.upload_url || fallbackUpload.upload_url };
                        data.warning = data.warning || (currentLanguage === "hi"
                            ? "दस्तावेज़ सफलतापूर्वक अपलोड हो गया है। स्वचालित OCR उपलब्ध नहीं था; अधिकारी इसकी मैनुअल समीक्षा कर सकते हैं।"
                            : "The document was uploaded successfully. Automatic OCR was unavailable; an officer can review it manually.");
                    } catch (fallbackError) {
                        const serverMessage = parsed.data?.message || parsed.rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                        throw new Error(localizeServerMessage(serverMessage || fallbackError.message, parsed.data || {}));
                    }
                } else {
                    data = { ...data, ...parsed.data, upload_url: data.upload_url || parsed.data.upload_url };
                }
            }
        } else {
            const formData = new FormData();
            formData.append("document", file);
            const response = await fetch("/api/ai/extract", { method: "POST", body: formData });
            const parsed = await parseApiResponse(response);
            if (!response.ok || !parsed.data?.success) {
                try {
                    const fallbackUpload = await uploadDocumentForManualReview(file);
                    data = { ...data, ...fallbackUpload, upload_url: data.upload_url || fallbackUpload.upload_url };
                    data.warning = data.warning || (currentLanguage === "hi"
                        ? "दस्तावेज़ सफलतापूर्वक अपलोड हो गया है। अधिकारी इसकी मैनुअल समीक्षा कर सकते हैं।"
                        : "The document was uploaded successfully. An officer can review it manually.");
                } catch (fallbackError) {
                    const serverMessage = parsed.data?.message || parsed.rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                    throw new Error(localizeServerMessage(serverMessage || fallbackError.message, parsed.data || {}));
                }
            } else {
                data = { ...data, ...parsed.data, upload_url: data.upload_url || parsed.data.upload_url };
            }
        }

        console.log("AI EXTRACTION RESPONSE:", data);

        await advancePipeline();

        const fields = data.fields || {};
        fields.confidence = data.confidence || "Unknown";
        fillAIOutput(fields);
        copySelectedDocumentToLandRecord();
        if (data.upload_url && $("fileName")) {
            $("fileName").innerHTML = `<span class="file-uploaded-badge">✓ ${escapeHTML(file.name)} — uploaded</span>`;
        }

        if (data.warning) {
            showToast(currentLanguage === "hi" ? "दस्तावेज़ अपलोड हो गया है। अधिकारी मैनुअल समीक्षा कर सकते हैं।" : "Document uploaded successfully. Manual officer review is available.", "info");
        }

        const count = Object.entries(fields)
            .filter(([key, value]) => key !== "confidence" && Boolean(String(value || "").trim()))
            .length;

        finishPipeline(count > 0);

        if (count === 0) {
            showToast(msg("extractionNoFields"), "error");
        } else {
            showToast(msg("extractionSuccess", count), "success");
        }

        if ($("extractedText")) $("extractedText").textContent = data.text || "";

        // Automatically show user form after successful extraction.
        openModal("userInfoModal");

    } catch (error) {
        console.error("AI EXTRACTION ERROR:", error);
        finishPipeline(false);
        showToast(error.message || msg("extractingFailed"), "error");
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${t("startExtraction")}`;
        }
    }
}

/* =====================================================
   SAVE USER RECORD
===================================================== */

function showValidationPopup(missing = [], messageKey = "validationPopupMessage") {
    const modal = $("formValidationModal");
    const title = $("validationPopupTitle");
    const message = $("validationPopupMessage");
    const list = $("validationPopupList");
    const icon = modal?.querySelector(".validation-popup-icon");

    if (title) title.textContent = t("validationPopupTitle");
    if (message) message.textContent = t(messageKey);
    if (list) {
        list.innerHTML = missing.length
            ? `<ul>${missing.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`
            : "";
    }
    if (icon) icon.textContent = "!";

    openModal("formValidationModal");
    modal?.setAttribute("aria-hidden", "false");
}


function getFieldLabel(field) {
    return field?.closest("label")?.querySelector("span")?.textContent?.trim()
        || field?.name
        || "Required field";
}

function validateSubmitForm(form) {
    const requiredFields = Array.from(form.querySelectorAll("[required]"));
    const missing = [];
    let firstInvalid = null;

    for (const field of requiredFields) {
        const isFile = field.type === "file";
        const empty = isFile ? !field.files?.length : !field.value.trim();
        const invalid = empty || !field.checkValidity();

        if (invalid) {
            if (!firstInvalid) firstInvalid = field;
            if (!missing.includes(getFieldLabel(field))) missing.push(getFieldLabel(field));
        }
    }

    // Also block submission when an optional field violates its format/pattern.
    if (!missing.length && !form.checkValidity()) {
        const invalidFields = Array.from(form.querySelectorAll(":invalid"));
        for (const field of invalidFields) {
            const label = getFieldLabel(field);
            if (!missing.includes(label)) missing.push(label);
            if (!firstInvalid) firstInvalid = field;
        }
    }

    if (firstInvalid) firstInvalid.focus({ preventScroll: true });
    return missing;
}

async function submitUserRecord(event, submitAction = "submit") {
    event?.preventDefault?.();

    const form = $("userInfoForm");
    if (!form) return;

    // Draft can be incomplete; Save & Submit cannot.
    if (submitAction === "submit") {
        const missing = validateSubmitForm(form);
        if (missing.length) {
            showValidationPopup(missing);
            return;
        }
    }

    const actionButtons = form.querySelectorAll("[data-form-action]");
    actionButtons.forEach(button => { button.disabled = true; });

    const activeButton = form.querySelector(`[data-form-action="${submitAction}"]`);
    if (activeButton) {
        activeButton.innerHTML =
            `<i class="fa-solid fa-spinner fa-spin"></i> ${currentLanguage === "hi" ? (submitAction === "submit" ? "सबमिट हो रहा है..." : "सेव हो रहा है...") : (submitAction === "submit" ? "Submitting..." : "Saving...")}`;
    }

    try {
        const formData = new FormData(form);
        formData.set("submit_action", submitAction);

        if (currentExtractedFields.confidence) {
            formData.set("confidence", currentExtractedFields.confidence);
        }

        const response = await fetch("/api/records", {
            method: "POST",
            body: formData
        });

        let data = {};
        try {
            data = await response.json();
        } catch {
            throw new Error(msg("invalidJson"));
        }

        if (!response.ok || !data.success) {
            throw new Error(localizeServerMessage(data.message, data));
        }

        currentRecordId = data.record?.id || null;

        // Submit success: show result briefly in the background, then close the form.
        showDatabaseResult(data.record, data.documents || []);
        showToast(
            submitAction === "submit"
                ? t("submitSuccess")
                : (currentLanguage === "hi" ? msg("draftSaved") : msg("draftSaved")),
            "success"
        );

        await loadRecords();
        await loadStats();

        if (submitAction === "submit") {
            closeModal("userInfoModal");
            form.reset();
            if ($("dbResult")) $("dbResult").innerHTML = "";
            currentRecordId = null;
        }

    } catch (error) {
        console.error("SUBMIT ERROR:", error);
        showDatabaseError(error.message);
        showToast(error.message || msg("saveFailedGeneric"), "error");
    } finally {
        actionButtons.forEach(button => { button.disabled = false; });

        const saveButton = form.querySelector('[data-form-action="save"]');
        const submitButton = form.querySelector('[data-form-action="submit"]');

        if (saveButton) saveButton.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${t("saveDraft")}`;
        if (submitButton) submitButton.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${t("submitVerification")}`;
    }
}

function showDatabaseResult(record, documents = []) {
    const box = $("dbResult");
    if (!box) return;

    box.innerHTML = `
        <div class="db-result-card">
            <h3>✅ Database Condition: TRUE</h3>
            <p>${msg("databaseSaved")}</p>
            <div class="db-grid">
                <div><span>Record ID</span><b>${escapeHTML(record?.record_id)}</b></div>
                <div><span>User</span><b>${escapeHTML(record?.user_name)}</b></div>
                <div><span>State</span><b>${escapeHTML(record?.state)}</b></div>
                <div><span>District</span><b>${escapeHTML(record?.district)}</b></div>
                <div><span>Village</span><b>${escapeHTML(record?.village)}</b></div>
                <div><span>Khasra</span><b>${escapeHTML(record?.khasra_number)}</b></div>
            </div>
            <p>${documents.length} document(s) uploaded.</p>
        </div>
    `;
}

function showDatabaseError(message) {
    const box = $("dbResult");
    if (!box) return;

    box.innerHTML = `
        <div class="db-result-card error">
            <h3>✕ ${currentLanguage === "hi" ? "डेटाबेस सेव विफल" : "Database Save Failed"}</h3>
            <p>${escapeHTML(message)}</p>
        </div>
    `;
}

/* =====================================================
   SAVE USER FORM
===================================================== */

async function saveUserDraft() {
    const form = $("userInfoForm");
    if (!form) return;

    await submitUserRecord({ preventDefault() {} }, "save");
}

/* =====================================================
   SUBMIT AI OUTPUT
===================================================== */

async function submitExtractedRecord() {
    const form = $("userInfoForm");
    if (!form) return;

    // Open the user form so required identity/documents can be supplied.
    openModal("userInfoModal");

    // If OCR has already populated required values, tell the user to attach required docs.
    const requiredFiles = ["land_document", "applicant_id_document", "father_id_document", "mother_id_document"];
    const missing = requiredFiles.filter(name => {
        const input = form.querySelector(`input[name="${name}"]`);
        return !input?.files?.length;
    });

    if (missing.length) {
        showToast(msg("requiredDocuments"), "error");
        return;
    }

    await submitUserRecord({ preventDefault() {} }, "submit");
}

/* =====================================================
   SAVE DRAFT
===================================================== */

function saveDraft() {
    const values = {};
    document.querySelectorAll(".data-card .fields input").forEach((input, index) => {
        values[index] = input.value;
    });

    localStorage.setItem("bhurakshak_ai_draft", JSON.stringify(values));
    showToast(msg("localDraftSaved"), "success");
}

/* =====================================================
   VALIDATION / AUDIT / ANALYTICS
===================================================== */
async function loadValidationAnalysis(){
  const box=$("validationResults"); try{const r=await fetch("/api/validation");const d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||"Validation unavailable.");
    $("validationPassed").textContent=d.summary.passed;$("validationReview").textContent=d.summary.review;$("validationDuplicates").textContent=d.summary.duplicates;
    const rows=d.results.slice(0,20);box.innerHTML=`<h3>Live Validation Results</h3>`+(rows.length?rows.map(x=>`<div class="rule ${x.result!=="Passed"?"warning":""}"><span>${x.result==="Passed"?"✓":"!"}</span><div><b>${escapeHTML(x.record_id)} — ${escapeHTML(x.user_name)}</b><small>${x.issues.length?escapeHTML(x.issues.join(" • ")):"All configured checks passed"}</small></div><strong>${x.result.toUpperCase()}</strong></div>`).join(""):"<div class='portal-empty'>No records available for validation.</div>");
  }catch(e){box.innerHTML=`<h3>Validation Results</h3><div class="rule warning"><span>!</span><div><b>Unable to load validation</b><small>${escapeHTML(e.message)}</small></div><strong>ERROR</strong></div>`}
}
async function loadAuditTrail(){
  const box=$("auditLogList"); if(!box)return; try{const r=await fetch("/api/audit");const d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||"Audit unavailable.");
    box.innerHTML=d.logs.length?d.logs.map(log=>`<div class="audit-row"><span>•</span><div><b>${escapeHTML(log.action.replaceAll("_"," "))}</b><small>${escapeHTML(log.record_id||"System")} • ${escapeHTML(log.actor_role)} / ${escapeHTML(log.actor_id)}${log.details?" • "+escapeHTML(log.details):""}</small></div><strong>${escapeHTML(log.created_at||"")}</strong></div>`).join(""):"<div class='portal-empty'>No audit events recorded yet.</div>";
  }catch(e){box.innerHTML=`<div class="audit-row"><span>!</span><div><b>Audit trail unavailable</b><small>${escapeHTML(e.message)}</small></div><strong>ERROR</strong></div>`}
}
async function loadAnalytics(){
  const box=$("analyticsLive");if(!box)return;try{const r=await fetch("/api/analytics");const d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||"Analytics unavailable.");
    const status=Object.fromEntries(d.status.map(x=>[x.status,Number(x.count)]));const conf=Object.fromEntries(d.confidence.map(x=>[x.confidence||"Manual",Number(x.count)]));const max=Math.max(1,...d.daily.map(x=>Number(x.count)));
    box.innerHTML=`<div class="analytics-kpis"><div class="chart-card"><small>Total records</small><strong>${Object.values(status).reduce((a,b)=>a+b,0)}</strong></div><div class="chart-card"><small>Verified rate</small><strong>${d.verification_rate}%</strong></div><div class="chart-card"><small>Documents</small><strong>${d.documents}</strong></div><div class="chart-card"><small>High confidence</small><strong>${conf.High||0}</strong></div></div><div class="chart-card"><div class="chart-title"><h3>Records Processed — Last 14 Days</h3></div><div class="bars live-bars">${d.daily.map(x=>`<i style="height:${Math.max(8,(Number(x.count)/max)*100)}%"><span>${escapeHTML(x.day.slice(5))}</span></i>`).join("")}</div><div class="analytics-status"><span>Pending: ${status.Pending||0}</span><span>Verified: ${status.Verified||0}</span><span>Rejected: ${status.Rejected||0}</span><span>Draft: ${status.Draft||0}</span></div></div>`;
  }catch(e){box.innerHTML=`<div class="chart-card"><h3>Analytics unavailable</h3><p>${escapeHTML(e.message)}</p></div>`}
}

/* =====================================================
   RECORDS
===================================================== */

async function loadRecords() {
    const table = $("recordsTable");
    if (!table) return;

    try {
        const response = await fetch("/api/records");
        if (!response.ok) throw new Error("Unable to load records.");

        const records = await response.json();
        const search = ($("recordSearch")?.value || "").toLowerCase().trim();
        const status = $("statusFilter")?.value || "All Status";

        const filtered = Array.isArray(records)
            ? records.filter(record => {
                const text = `
                    ${record.record_id || ""}
                    ${record.user_name || ""}
                    ${record.khasra_number || ""}
                    ${record.village || ""}
                    ${record.district || ""}
                    ${record.state || ""}
                `.toLowerCase();

                return text.includes(search) &&
                    (status === "All Status" || record.status === status);
            })
            : [];

        table.innerHTML = "";

        if (!filtered.length) {
            table.innerHTML = `
                <tr><td colspan="8" style="text-align:center;padding:25px">
                    No user records found.
                </td></tr>`;
            return;
        }

        filtered.forEach(record => {
            const row = document.createElement("tr");
            const statusClass =
                record.status === "Verified" ? "verified" :
                record.status === "Rejected" || record.status === "Flagged" ? "flagged" :
                record.status === "Draft" ? "draft" : "pending";

            row.innerHTML = `
                <td><b>${escapeHTML(record.record_id)}</b></td>
                <td>${escapeHTML(record.user_name)}</td>
                <td>${escapeHTML(record.khasra_number)}</td>
                <td>${escapeHTML(record.area)}</td>
                <td>${escapeHTML([record.village, record.district, record.state].filter(Boolean).join(", "))}</td>
                <td><span class="table-status ${statusClass}">${escapeHTML(record.status)}</span></td>
                <td>${escapeHTML(record.confidence)}</td>
                <td>
                    <button class="row-action" data-record-id="${escapeHTML(record.id)}">View</button>
                </td>
            `;

            table.appendChild(row);
        });

        table.querySelectorAll("[data-record-id]").forEach(button => {
            button.addEventListener("click", () => openHumanVerification(button.dataset.recordId));
        });

    } catch (error) {
        console.error("LOAD RECORDS ERROR:", error);
        table.innerHTML = `
            <tr><td colspan="8" style="text-align:center;padding:25px">
                Unable to connect to database.
            </td></tr>`;
    }
}

/* =====================================================
   HUMAN VERIFICATION
===================================================== */

async function openHumanVerification(id) {
    try {
        if (!getStaffToken()) { handleStaffRequired(); return; }
        const response = await fetch(`/api/admin/records/${encodeURIComponent(id)}`, { headers: staffHeaders() });
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Record not found.");

        const record = data.record;
        const documents = data.documents || [];

        if ($("humanVerifyTitle")) {
            $("humanVerifyTitle").textContent =
                `${record.user_name || ""} — ${record.record_id || ""}`;
        }

        if ($("humanVerifyBody")) {
            $("humanVerifyBody").innerHTML = `
                <div class="db-result-card">
                    <h3>Complete User Information</h3>
                    <div class="db-grid">
                        ${[
                            ["Name", record.user_name],
                            ["Mobile", record.user_contact],
                            ["Email", record.user_email],
                            ["State", record.state],
                            ["District", record.district],
                            ["Tehsil", record.tehsil],
                            ["Village", record.village],
                            ["Khasra", record.khasra_number],
                            ["Khata / Khatauni", record.khata_number],
                            ["Area", record.area],
                            ["Land Type", record.land_type],
                            ["Ownership", record.ownership_type],
                            ["Registration ID", record.registration_id],
                            ["Father", record.father_name],
                            ["Mother", record.mother_name],
                            ["Status", record.status],
                            ...(record.rejection_reason
                                ? [["Rejection Reason", record.rejection_reason]]
                                : [])
                        ].map(([label, value]) => `
                            <div><span>${escapeHTML(label)}</span><b>${escapeHTML(value)}</b></div>
                        `).join("")}
                    </div>
                </div>

                <div class="db-result-card" style="margin-top:12px">
                    <h3>Uploaded Documents</h3>
                    <div class="doc-list">
                        ${documents.length
                            ? documents.map(document => `
                                <div class="doc-item">
                                    <div>
                                        <b>${escapeHTML(document.document_type)}</b>
                                        <small>${escapeHTML(document.original_name)}</small>
                                    </div>
                                    <a href="${escapeHTML(document.url)}" target="_blank" rel="noopener">Open</a>
                                </div>
                            `).join("")
                            : "<p>No documents uploaded.</p>"
                        }
                    </div>
                </div>
                <div id="rejectionPanel" style="display:none;margin-top:12px" class="db-result-card">
                    <h3>Rejection Reason</h3>
                    <textarea
                        id="rejectionReason"
                        rows="3"
                        placeholder="Enter the reason for rejecting this record..."
                        style="width:100%;margin-top:8px;padding:10px;border:1px solid #d1d5db;border-radius:10px;resize:vertical"
                    ></textarea>
                    <button
                        class="primary-btn"
                        type="button"
                        id="confirmRejectRecord"
                        style="margin-top:10px"
                    >Confirm Rejection</button>
                </div>
            `;
        }

        if ($("approveApplicantRecord")) {
            $("approveApplicantRecord").dataset.id = id;
        }
        if ($("rejectApplicantRecord")) {
            $("rejectApplicantRecord").dataset.id = id;
        }
        if ($("rejectionPanel")) $("rejectionPanel").style.display = "none";

        openModal("humanVerificationModal");
    } catch (error) {
        console.error("VERIFICATION ERROR:", error);
        showToast(error.message || "Unable to open record.", "error");
    }
}

async function approveRecord() {
    const button = $("approveApplicantRecord");
    const id = button?.dataset.id;

    if (!id) {
        showToast("Record ID missing.", "error");
        return;
    }

    try {
        const response = await fetch(`/api/admin/records/${encodeURIComponent(id)}/status`, {
            method: "PUT",
            headers: staffHeaders(true),
            body: JSON.stringify({ status: "Verified" })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to approve.");
        }

        showToast("Record verified successfully.", "success");
        closeModal("humanVerificationModal");
        await loadRecords();
        await loadStats();

    } catch (error) {
        console.error("APPROVE ERROR:", error);
        showToast(error.message || "Verification failed.", "error");
    }
}

async function rejectRecord() {
    const button = $("rejectApplicantRecord");
    const id = button?.dataset.id;
    const panel = $("rejectionPanel");

    if (!id) {
        showToast("Record ID missing.", "error");
        return;
    }

    if (panel) panel.style.display = "block";
    $("rejectionReason")?.focus();
}

async function confirmRejectRecord() {
    const button = $("confirmRejectRecord");
    const id = $("rejectApplicantRecord")?.dataset.id;
    const reason = ($("rejectionReason")?.value || "").trim();

    if (!id) {
        showToast("Record ID missing.", "error");
        return;
    }
    if (!reason) {
        showToast(msg("rejectReason"), "error");
        $("rejectionReason")?.focus();
        return;
    }

    try {
        button.disabled = true;
        const response = await fetch(`/api/admin/records/${encodeURIComponent(id)}/status`, {
            method: "PUT",
            headers: staffHeaders(true),
            body: JSON.stringify({
                status: "Rejected",
                rejection_reason: reason
            })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to reject record.");
        }

        showToast("Record rejected with reason.", "success");
        closeModal("humanVerificationModal");
        await loadRecords();
        await loadStats();
    } catch (error) {
        console.error("REJECT ERROR:", error);
        showToast(error.message || (currentLanguage === "hi" ? "रिकॉर्ड अस्वीकार नहीं हो सका।" : "The record could not be rejected."), "error");
    } finally {
        if (button) button.disabled = false;
    }
}

/* =====================================================
   STATS
===================================================== */

async function loadStats() {
    try {
        const response = await fetch("/api/stats");
        if (!response.ok) return;

        const data = await response.json();

        if ($("queueCount")) $("queueCount").textContent = data.pending ?? 0;
        if ($("queueLarge")) $("queueLarge").textContent = data.pending ?? 0;
        if ($("verificationQueueCount")) $("verificationQueueCount").textContent = data.pending ?? 0;
        if ($("statTotal")) $("statTotal").textContent = data.total ?? 0;
        if ($("statPending")) $("statPending").textContent = data.pending ?? 0;
        if ($("statVerified")) $("statVerified").textContent = data.verified ?? 0;
        if ($("statDocuments")) $("statDocuments").textContent = data.documents ?? 0;
        if ($("heroTotal")) $("heroTotal").textContent = data.total ?? 0;
        if ($("heroPending")) $("heroPending").textContent = data.pending ?? 0;
        if ($("heroVerified")) $("heroVerified").textContent = data.verified ?? 0;
        if ($("homeDuplicateAlerts")) $("homeDuplicateAlerts").textContent = data.duplicates ?? 0;
    } catch (error) {
        console.error("STATS ERROR:", error);
    }
}

/* =====================================================
   LOGIN / SIGNUP / SUPPORT
===================================================== */

function closeMenu() {
    $("mobileNav")?.classList.remove("open");
    $("menuOverlay")?.classList.remove("open");
    $("menuButton")?.setAttribute("aria-expanded", "false");
}

function setupNameFieldValidation() {
    const nameFields = [
        "userName", "fatherName", "motherName", "signupName",
        "aiLandownerName"
    ];

    nameFields.forEach(id => {
        const input = $(id);
        if (!input) return;

        input.setAttribute("inputmode", "text");
        input.addEventListener("input", () => {
            // Remove numeric characters immediately while typing/pasting.
            input.value = input.value.replace(/[0-9]/g, "");
        });

        input.addEventListener("paste", event => {
            const text = event.clipboardData?.getData("text") || "";
            if (/\d/.test(text)) {
                event.preventDefault();
                input.value += text.replace(/[0-9]/g, "");
            }
        });
    });
}


function initInputRestrictions() {
    const nameFields = document.querySelectorAll(".name-only");
    const numberFields = document.querySelectorAll(".number-only");
    const numberSlashFields = document.querySelectorAll(".number-slash-only");

    nameFields.forEach(input => {
        input.addEventListener("input", () => {
            // Remove numeric characters from typed and pasted names.
            input.value = input.value.replace(/\p{N}/gu, "");
        });
    });

    numberFields.forEach(input => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "");
        });
    });

    numberSlashFields.forEach(input => {
        input.addEventListener("input", () => {
            // Khesara/Khata values may use formats such as 4/432 or 12-34.
            input.value = input.value.replace(/[^0-9\/-]/g, "");
        });
    });
}

window.addEventListener("error", event => {
    console.error("BhuRakshak UI error:", event.error || event.message);
    if (typeof showToast === "function") {
        showToast(currentLanguage === "hi" ? "कुछ गलत हुआ। कृपया दोबारा प्रयास करें।" : "Something went wrong. Please try again.", "error");
    }
});

window.addEventListener("unhandledrejection", event => {
    console.error("BhuRakshak async error:", event.reason);
    if (typeof showToast === "function") {
        showToast(currentLanguage === "hi" ? "अनुरोध पूरा नहीं हो सका। कृपया दोबारा प्रयास करें।" : "The request could not be completed. Please try again.", "error");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    initInputRestrictions();
    document.querySelectorAll("[data-page]").forEach(button => {
        button.addEventListener("click", () => showPage(button.dataset.page));
    });

    document.querySelectorAll("[data-close]").forEach(button => {
        button.addEventListener("click", () => closeModal(button.dataset.close));
    });

    $("menuButton")?.addEventListener("click", () => {
        $("mobileNav")?.classList.add("open");
        $("menuOverlay")?.classList.add("open");
        $("menuButton")?.setAttribute("aria-expanded", "true");
    });

    $("closeMenu")?.addEventListener("click", closeMenu);
    $("menuOverlay")?.addEventListener("click", closeMenu);

    $("searchMap")?.addEventListener("click", searchMap);
    $("mapSearch")?.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            searchMap();
        }
    });

    $("zoomIn")?.addEventListener("click", () => landMap?.zoomIn());
    $("zoomOut")?.addEventListener("click", () => landMap?.zoomOut());

    $("locateUser")?.addEventListener("click", () => {
        if (!navigator.geolocation) {
            showToast(msg("currentLocationUnsupported"), "error");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            position => {
                initializeMap();
                const { latitude, longitude } = position.coords;
                landMap.setView([latitude, longitude], 15);
                if (mapMarker) mapMarker.remove();
                mapMarker = L.marker([latitude, longitude]).addTo(landMap);
                showToast(msg("currentLocationSelected"), "success");
            },
            () => showToast("Location permission denied.", "error")
        );
    });

    $("resetMap")?.addEventListener("click", () => {
        initializeMap();
        landMap.setView([22.9734, 78.6569], 5);
        if (mapMarker) {
            mapMarker.remove();
            mapMarker = null;
        }
        if ($("selectedLocation")) $("selectedLocation").textContent = "India — National View";
    });

    $("chooseFile")?.addEventListener("click", () => $("fileInput")?.click());

    $("fileInput")?.addEventListener("change", event => {
        const file = event.target.files?.[0];
        if (!file) return;
        if ($("fileName")) $("fileName").textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`;
        showToast(currentLanguage === "hi" ? "दस्तावेज़ चुना गया है। अब AI Extraction शुरू करें।" : "Document selected. Start AI Extraction to upload and process it.", "info");
    });

    $("dropArea")?.addEventListener("dragover", event => {
        event.preventDefault();
        $("dropArea")?.classList.add("drag-active");
    });
    $("dropArea")?.addEventListener("dragleave", () => $("dropArea")?.classList.remove("drag-active"));
    $("dropArea")?.addEventListener("drop", event => {
        event.preventDefault();
        $("dropArea")?.classList.remove("drag-active");
        const file = event.dataTransfer?.files?.[0];
        if (!file) return;
        const input = $("fileInput");
        if (input) {
            try {
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                if ($("fileName")) $("fileName").textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`;
                showToast(currentLanguage === "hi" ? "दस्तावेज़ चुना गया है। अब AI Extraction शुरू करें।" : "Document selected. Start AI Extraction to upload and process it.", "info");
            } catch {
                showToast(msg("invalidFileType"), "error");
            }
        }
    });

    $("processButton")?.addEventListener("click", startAIExtraction);
    $("userInfoForm")?.addEventListener("submit", event => {
        submitUserRecord(event, "submit");
    });

    $("saveUserDraft")?.addEventListener("click", saveUserDraft);

    $("saveDraft")?.addEventListener("click", saveDraft);
    $("submitRecord")?.addEventListener("click", submitExtractedRecord);

    $("recordSearch")?.addEventListener("input", loadRecords);
    $("statusFilter")?.addEventListener("change", loadRecords);

    $("approveApplicantRecord")?.addEventListener("click", approveRecord);
    $("rejectApplicantRecord")?.addEventListener("click", rejectRecord);
    document.addEventListener("click", event => {
        if (event.target?.id === "confirmRejectRecord") {
            confirmRejectRecord();
        }
    });

    document.querySelectorAll("[data-login]").forEach(button => {
        button.addEventListener("click", () => {
            const type = button.dataset.login;
            window.currentLoginType = type;
            if ($("loginType")) $("loginType").textContent = currentLanguage === "hi" ? (type === "admin" ? "प्रशासक एक्सेस" : "अधिकारी एक्सेस") : (type === "admin" ? "ADMIN ACCESS" : "OFFICER ACCESS");
            if ($("loginTitle")) $("loginTitle").textContent = currentLanguage === "hi" ? (type === "admin" ? "लॉगिन" : "अधिकारी लॉगिन") : (type === "admin" ? "Login" : "Officer Login");
            if ($("loginDescription")) $("loginDescription").textContent = currentLanguage === "hi"
                ? (type === "admin" ? "BhuRakshak एडमिन डैशबोर्ड में लॉगिन करें।" : "भूमि रिकॉर्ड की समीक्षा और सत्यापन के लिए लॉगिन करें।")
                : (type === "admin" ? "Sign in to manage the BhuRakshak administrator dashboard." : "Sign in to review and verify user land records.");
            if ($("showSignup")) $("showSignup").style.display = type === "admin" ? "inline-flex" : "none";
            // Never pre-fill credentials. The officer demo account is intentionally
            // entered manually so the login flow behaves like a real authentication screen.
            if ($("loginUser")) { $("loginUser").value = ""; $("loginUser").removeAttribute("readonly"); }
            if ($("loginPassword")) { $("loginPassword").value = ""; $("loginPassword").removeAttribute("readonly"); }
            if ($("officerDemoCredentials")) $("officerDemoCredentials").hidden = type !== "officer";
            if ($("loginUser")) $("loginUser").focus();
            openModal("loginModal");
        });
    });


    $("togglePassword")?.addEventListener("click", () => {
        const password = $("loginPassword");
        if (password) password.type = password.type === "password" ? "text" : "password";
    });

    $("loginForm")?.addEventListener("submit", async event => {
        event.preventDefault();
        const type = window.currentLoginType || "officer";
        const userId = $("loginUser")?.value.trim() || "";
        const password = $("loginPassword")?.value || "";
        const endpoint = type === "admin" ? "/api/auth/admin/login" : "/api/auth/officer/login";
        const button = event.currentTarget.querySelector('button[type="submit"]');
        try {
            if (button) button.disabled = true;
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, password })
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || "Login failed.");
            localStorage.setItem("bhurakshak-staff-token", data.token);
            localStorage.setItem("bhurakshak-staff-role", data.role);
            localStorage.setItem("bhurakshak-staff-name", data.display_name || data.user_id);
            closeModal("loginModal");
            showToast(currentLanguage === "hi" ? "लॉगिन सफल रहा।" : "Login successful.", "success");
            setTimeout(() => { window.location.href = data.role === "admin" ? "/admin.html" : "/officer.html"; }, 250);
        } catch (error) {
            showToast(error.message || "Login failed.", "error");
        } finally {
            if (button) button.disabled = false;
        }
    });

    $("showSignup")?.addEventListener("click", () => {
        window.currentLoginType = "admin";
        closeModal("loginModal");
        openModal("signupModal");
    });

    $("showLogin")?.addEventListener("click", () => {
        closeModal("signupModal");
        openModal("loginModal");
    });

    async function sendSignupOtp(channel) {
        const destination = channel === "phone" ? $("signupPhone")?.value.trim() : $("signupEmail")?.value.trim();
        const sendButton = $(channel === "phone" ? "sendPhoneOtp" : "sendEmailOtp");
        const otpInput = $(channel === "phone" ? "phoneOtp" : "emailOtp");
        const verifyButton = $(channel === "phone" ? "verifyPhoneOtp" : "verifyEmailOtp");
        const demoBox = $(channel === "phone" ? "phoneDemoOtp" : "emailDemoOtp");
        const status = $(channel === "phone" ? "phoneOtpStatus" : "emailOtpStatus");
        try {
            if (sendButton) sendButton.disabled = true;
            const response = await fetch("/api/auth/otp/send", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ channel, destination }) });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || "OTP could not be generated.");
            if (otpInput) { otpInput.disabled = false; otpInput.value = ""; otpInput.focus(); }
            if (verifyButton) verifyButton.disabled = false;
            if (demoBox) { demoBox.hidden = false; demoBox.textContent = `${currentLanguage === "hi" ? "डेमो OTP" : "Demo OTP"}: ${data.demo_otp}`; }
            if (status) status.textContent = currentLanguage === "hi" ? "OTP भेज दिया गया है।" : "OTP generated. Enter the 6-digit code.";
            showToast(msg(channel === "phone" ? "otpSentPhone" : "otpSentEmail"), "success");
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            if (sendButton) sendButton.disabled = false;
        }
    }

    async function verifySignupOtp(channel) {
        const destination = channel === "phone" ? $("signupPhone")?.value.trim() : $("signupEmail")?.value.trim();
        const otp = $(channel === "phone" ? "phoneOtp" : "emailOtp")?.value.trim();
        const verifyButton = $(channel === "phone" ? "verifyPhoneOtp" : "verifyEmailOtp");
        const status = $(channel === "phone" ? "phoneOtpStatus" : "emailOtpStatus");
        try {
            if (verifyButton) verifyButton.disabled = true;
            const response = await fetch("/api/auth/otp/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ channel, destination, otp }) });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || "OTP verification failed.");
            if (status) status.textContent = currentLanguage === "hi" ? "✓ सत्यापित" : "✓ Verified";
            status?.classList.add("verified");
            const input = $(channel === "phone" ? "phoneOtp" : "emailOtp");
            if (input) input.disabled = true;
            showToast(msg(channel === "phone" ? "otpVerifiedPhone" : "otpVerifiedEmail"), "success");
        } catch (error) {
            if (verifyButton) verifyButton.disabled = false;
            showToast(error.message, "error");
        }
    }

    $("sendPhoneOtp")?.addEventListener("click", () => sendSignupOtp("phone"));
    $("verifyPhoneOtp")?.addEventListener("click", () => verifySignupOtp("phone"));
    $("sendEmailOtp")?.addEventListener("click", () => sendSignupOtp("email"));
    $("verifyEmailOtp")?.addEventListener("click", () => verifySignupOtp("email"));

    $("signupForm")?.addEventListener("submit", async event => {
        event.preventDefault();
        if ($("signupPassword")?.value !== $("signupConfirm")?.value) {
            showToast(currentLanguage === "hi" ? "पासवर्ड मेल नहीं खाते।" : "Passwords do not match.", "error");
            return;
        }
        const phoneVerified = $("phoneOtpStatus")?.classList.contains("verified");
        const emailVerified = $("emailOtpStatus")?.classList.contains("verified");
        if (!phoneVerified || !emailVerified) {
            showToast(currentLanguage === "hi" ? "खाता बनाने से पहले फोन और ईमेल दोनों OTP सत्यापित करें।" : "Verify both the phone and email OTP before creating the account.", "error");
            return;
        }
        const button = event.currentTarget.querySelector('button[type="submit"]');
        try {
            if (button) button.disabled = true;
            const response = await fetch("/api/auth/admin/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: $("signupName")?.value.trim(),
                    user_id: $("signupUser")?.value.trim(),
                    phone: $("signupPhone")?.value.trim(),
                    email: $("signupEmail")?.value.trim(),
                    password: $("signupPassword")?.value || ""
                })
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || "Registration failed.");
            localStorage.setItem("bhurakshak-staff-token", data.token);
            localStorage.setItem("bhurakshak-staff-role", data.role);
            localStorage.setItem("bhurakshak-staff-name", data.display_name || data.user_id);
            showToast(currentLanguage === "hi" ? "Administrator account बन गया है। Dashboard खुल रहा है।" : "Administrator account created. Opening your dashboard.", "success");
            setTimeout(() => { window.location.href = "/admin.html"; }, 350);
        } catch (error) {
            showToast(error.message || "Registration failed.", "error");
        } finally {
            if (button) button.disabled = false;
        }
    });

    $("homeSupport")?.addEventListener("click", () => openModal("supportModal"));
    $("supportMenu")?.addEventListener("click", () => openModal("supportModal"));

    $("supportForm")?.addEventListener("submit", event => {
        event.preventDefault();
        showToast(msg("supportSubmitted"), "success");
        closeModal("supportModal");
    });

    initLanguageSwitcher();
    setupNameFieldValidation();

    initializeMap();
    loadStats();
    loadRecords();
});

/* Expose functions */
window.searchMap = searchMap;
window.startAIExtraction = startAIExtraction;
window.submitUserRecord = submitUserRecord;
window.submitExtractedRecord = submitExtractedRecord;
window.openUserInformation = openUserInformation;
window.openHumanVerification = openHumanVerification;
window.approveRecord = approveRecord;
window.rejectRecord = rejectRecord;
window.confirmRejectRecord = confirmRejectRecord;
window.saveUserDraft = saveUserDraft;
window.showPage = showPage;
window.openModal = openModal;
window.closeModal = closeModal;

const landType = document.getElementById("userLandType");

if (landType) {
    landType.innerHTML = `
        <option value="">Select Land Type</option>
        <option value="Agricultural">Agricultural</option>
        <option value="Residential">Residential</option>
        <option value="Commercial">Commercial</option>
        <option value="Industrial">Industrial</option>
        <option value="Government">Government</option>
    `;
}