"use strict";
const token = localStorage.getItem("bhurakshak-staff-token") || "";
const role = localStorage.getItem("bhurakshak-staff-role") || "";
const staffName = localStorage.getItem("bhurakshak-staff-name") || "Staff";
const $ = id => document.getElementById(id);

if (!token || !["admin","officer"].includes(role)) window.location.replace("/");

function headers(json=false){
  const h={}; if(json) h["Content-Type"]="application/json"; h.Authorization=`Bearer ${token}`; return h;
}
function toast(message,type="info"){
  const el=document.createElement("div"); el.className=`toast ${type}`; el.textContent=message; document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add("show")); setTimeout(()=>{el.classList.remove("show");setTimeout(()=>el.remove(),220)},4200);
}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function statusClass(v){return v==="Verified"?"verified":v==="Rejected"||v==="Flagged"?"rejected":v==="Draft"?"draft":"pending"}

async function api(url, options={}){
  const response=await fetch(url,{...options,headers:{...headers(Boolean(options.body)),...(options.headers||{})}});
  let data={}; try{data=await response.json()}catch{throw new Error("The server returned an invalid response.")}
  if(response.status===401){ localStorage.removeItem("bhurakshak-staff-token"); localStorage.removeItem("bhurakshak-staff-role"); window.location.replace("/"); throw new Error("Session expired. Please sign in again.") }
  if(!response.ok||data.success===false) throw new Error(data.message||"Request failed.");
  return data;
}

function renderRole(){
  $("roleBadge").textContent=role==="admin"?"ADMINISTRATOR":"OFFICER";
  $("staffName").textContent=staffName;
  $("portalTitle").textContent=role==="admin"?"Administrator Dashboard":"Officer Verification Dashboard";
  $("portalDesc").textContent=role==="admin"?"Manage digitized land records, inspect uploaded evidence and monitor verification status.":"Review submitted user records and open the original uploaded documents for verification.";
}

async function loadStats(){
  try{const d=await api("/api/stats"); $("statTotal").textContent=d.total??0; $("statPending").textContent=d.pending??0; $("statVerified").textContent=d.verified??0; $("statDocuments").textContent=d.documents??0;}catch(e){toast(e.message,"error")}
}

let records=[];
async function loadRecords(){
  const body=$("recordRows");
  try{
    records=await api("/api/records");
    renderRecords();
  }catch(e){body.innerHTML=`<tr><td colspan="8" class="portal-empty">${esc(e.message)}</td></tr>`;toast(e.message,"error")}
}
function renderRecords(){
  const q=($("search")?.value||"").toLowerCase().trim(); const filter=$("status")?.value||"All";
  const filtered=records.filter(r=>{
    const hay=[r.record_id,r.user_name,r.khasra_number,r.village,r.district,r.state].join(" ").toLowerCase();
    return hay.includes(q)&&(filter==="All"||r.status===filter);
  });
  const body=$("recordRows");
  if(!filtered.length){body.innerHTML=`<tr><td colspan="8" class="portal-empty">No user records found.</td></tr>`;return}
  body.innerHTML=filtered.map(r=>`<tr><td><b>${esc(r.record_id)}</b></td><td>${esc(r.user_name)}</td><td>${esc(r.khasra_number)}</td><td>${esc(r.village)}, ${esc(r.district)}</td><td>${esc(r.area)}</td><td><span class="status ${statusClass(r.status)}">${esc(r.status)}</span></td><td>${esc(r.confidence)}</td><td><button class="portal-btn primary" data-view="${esc(r.id)}">View</button></td></tr>`).join("");
  body.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>viewRecord(b.dataset.view)));
}

async function viewRecord(id){
  try{
    const d=await api(`/api/admin/records/${encodeURIComponent(id)}`);
    const r=d.record; const docs=d.documents||[];
    $("detailTitle").textContent=`${r.user_name||"User"} — ${r.record_id||"Record"}`;
    const digitalPanel = r.status === "Verified"
      ? `<div class="verification-complete"><strong>✓ Verification complete</strong><p>The officer has verified this land record. A digital version is now available with the verified fields and source-document links.</p><a class="portal-btn primary digital-document-btn" href="/api/admin/records/${encodeURIComponent(id)}/digital-document" target="_blank" rel="noopener">▣ View Digital Document</a></div>`
      : "";
    $("detailBody").innerHTML=`${digitalPanel}<div class="detail-grid">${[["Name",r.user_name],["Mobile",r.user_contact],["Email",r.user_email],["State",r.state],["District",r.district],["Tehsil",r.tehsil],["Village",r.village],["Khasra",r.khasra_number],["Khata / Khatauni",r.khata_number],["Area",r.area],["Land Type",r.land_type],["Ownership",r.ownership_type],["Registration ID",r.registration_id],["Father",r.father_name],["Mother",r.mother_name],["Status",r.status]].map(([a,b])=>`<div class="detail-item"><span>${esc(a)}</span><b>${esc(b)||"—"}</b></div>`).join("")}</div><h3>Uploaded Documents</h3><div class="docs">${docs.length?docs.map(d=>`<div class="doc-row"><div><b>${esc(d.document_type)}</b><small>${esc(d.original_name)} • ${Math.ceil((Number(d.size)||0)/1024)} KB</small></div><a href="${esc(d.url)}" target="_blank" rel="noopener">Open Document ↗</a></div>`).join(""):`<div class="portal-empty">No documents uploaded.</div>`}</div>`;
    $("verifyRecord").dataset.id=id; $("rejectRecord").dataset.id=id;
    const editButton=$("editRecord");
    if(editButton){editButton.dataset.id=id;editButton.style.display=role==="admin"?"inline-flex":"none";editButton.__record=r;}
    $("detailModal").classList.add("open");
  }catch(e){toast(e.message,"error")}
}

function openEditModal(record){
  if(role!=="admin") return toast("Administrator access is required.","error");
  const form=$("editForm"); if(!form) return;
  const fields=[["user_name","Full Name"],["user_contact","Mobile Number"],["user_email","Email"],["state","State"],["district","District"],["tehsil","Tehsil / Taluk"],["village","Village"],["khasra_number","Khasra / Survey Number"],["khata_number","Khata / Khatauni Number"],["area","Area"],["land_type","Land Type"],["ownership_type","Ownership Type"],["registration_id","Registration ID"],["father_name","Father's Name"],["mother_name","Mother's Name"],["id_last4","Applicant ID Last 4"],["father_id_last4","Father ID Last 4"],["mother_id_last4","Mother ID Last 4"]];
  form.innerHTML=fields.map(([key,label])=>`<label><span>${esc(label)}</span><input name="${key}" value="${esc(record[key])}" ${["user_name","father_name","mother_name"].includes(key)?"required":""}></label>`).join("");
  $("editModal").classList.add("open");$("editModal").setAttribute("aria-hidden","false");
}
async function saveEditedRecord(event){
  event.preventDefault();const id=$("editRecord")?.dataset.id;if(!id)return;const payload=Object.fromEntries(new FormData($("editForm")).entries());const button=$("saveEdit");
  try{button.disabled=true;await api(`/api/admin/records/${encodeURIComponent(id)}/details`,{method:"PUT",body:JSON.stringify(payload)});toast("Record details digitized and saved.","success");$("editModal").classList.remove("open");await Promise.all([loadRecords(),loadStats()]);await viewRecord(id);}catch(e){toast(e.message,"error")}finally{button.disabled=false;}
}

let pendingRejectId = null;
function openRejectModal(id){
  pendingRejectId=id;
  $("rejectReason").value="";
  $("rejectModal").classList.add("open");
  $("rejectModal").setAttribute("aria-hidden","false");
  setTimeout(()=>$("rejectReason")?.focus(),50);
}
function closeRejectModal(){
  pendingRejectId=null;
  $("rejectModal")?.classList.remove("open");
  $("rejectModal")?.setAttribute("aria-hidden","true");
}
async function updateStatus(id,status,rejection_reason=""){
  try{
    const result = await api(`/api/admin/records/${encodeURIComponent(id)}/status`,{method:"PUT",body:JSON.stringify({status,rejection_reason})});
    toast(status==="Verified"?"Verification completed. Digital document is ready.":"Record rejected successfully.","success");
    closeRejectModal();
    await Promise.all([loadRecords(),loadStats()]);
    if(status === "Verified") {
      await viewRecord(id);
    } else {
      $("detailModal").classList.remove("open");
    }
  }catch(e){toast(e.message,"error")}
}

$("staffName").textContent=staffName; renderRole(); loadStats(); loadRecords();
$("search")?.addEventListener("input",renderRecords); $("status")?.addEventListener("change",renderRecords);
$("closeDetail")?.addEventListener("click",()=>$("detailModal").classList.remove("open")); $("detailModal")?.addEventListener("click",e=>{if(e.target.id==="detailModal")$("detailModal").classList.remove("open")});
$("verifyRecord")?.addEventListener("click",()=>updateStatus($("verifyRecord").dataset.id,"Verified"));
$("rejectRecord")?.addEventListener("click",()=>openRejectModal($("rejectRecord").dataset.id));
$("closeReject")?.addEventListener("click",closeRejectModal);
$("cancelReject")?.addEventListener("click",closeRejectModal);
$("rejectModal")?.addEventListener("click",e=>{if(e.target.id==="rejectModal")closeRejectModal()});
$("confirmReject")?.addEventListener("click",()=>{const reason=$("rejectReason")?.value.trim()||"";if(!reason){toast("Please enter a rejection reason.","error");$("rejectReason")?.focus();return;}updateStatus(pendingRejectId,"Rejected",reason)});
$("editRecord")?.addEventListener("click",()=>openEditModal($("editRecord").__record||{}));
$("closeEdit")?.addEventListener("click",()=>$("editModal").classList.remove("open"));
$("cancelEdit")?.addEventListener("click",()=>$("editModal").classList.remove("open"));
$("editForm")?.addEventListener("submit",saveEditedRecord);
$("refresh")?.addEventListener("click",()=>Promise.all([loadStats(),loadRecords()]));
$("logout")?.addEventListener("click",async()=>{try{await api("/api/auth/logout",{method:"POST"})}catch{} localStorage.removeItem("bhurakshak-staff-token");localStorage.removeItem("bhurakshak-staff-role");localStorage.removeItem("bhurakshak-staff-name");window.location.replace("/")});
