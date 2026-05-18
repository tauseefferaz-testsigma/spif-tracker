// ════════════════════════════════════════════════════════════════════════
// SPIF Tracker v3 — Google Apps Script Backend
// Schema: Date · CSM Name · Activity · Reviews · Customer Name ·
//         Customer Email · Context · Notes · Points · Category
// ════════════════════════════════════════════════════════════════════════

const SHEET_NAME = "Submissions";
const HEADERS = [
  "Date","CSM Name","Activity","Reviews",
  "Customer Name","Customer Email","Context","Notes","Points","Category"
];

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found.`);
  return sheet;
}

function ensureHeaders(sheet) {
  const row1 = sheet.getRange(1,1,1,HEADERS.length).getValues()[0];
  if (!row1.some(v => String(v).trim() !== "")) {
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1,1,1,HEADERS.length).setFontWeight("bold");
  }
}

// Accepts both full names and display names
const VALID_CSM_NAMES = [
  "Subhopriyo Sen",
  "sakshi.bagri",
  "Rama Varma",
  "Mohammed Tamiz Uddin",
  "Aravinda G",
  "Arun S",
  "Varun Thakur",
  "Shabrish BM",
  "Tauseef Feraz",
  "Aarathy Sundaresan",
];

const VALID_ACTIVITIES = [
  "G2 Review","Gartner Peer Insights Review",
  "Reference Customer","Success Story",
  "Webinar Speaker","Customer Social Post",
];

function validatePayload(p) {
  if (!p.csm || !VALID_CSM_NAMES.includes(p.csm)) return "Invalid CSM name.";
  if (!p.activity || !VALID_ACTIVITIES.includes(p.activity)) return "Invalid activity.";
  const pts = Number(p.points);
  if (!Number.isFinite(pts) || pts < 0) return "Invalid points value.";
  return null;
}

function rowFromPayload(p) {
  return [
    p.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    String(p.csm || "").trim(),
    String(p.activity || "").trim(),
    (p.reviews !== "" && p.reviews !== null && p.reviews !== undefined) ? Number(p.reviews) : "",
    String(p.customerName  || "").trim(),
    String(p.customerEmail || "").trim().toLowerCase(),
    String(p.context || "").trim(),
    String(p.notes   || "").trim().slice(0,500),
    Number(p.points),
    String(p.category || "").trim(),
  ];
}

function doGet(e) {
  try {
    const sheet = getSheet();
    const data  = sheet.getDataRange().getValues();
    if (data.length < 2) return jsonOut({ ok:true, submissions:[] });
    const submissions = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[1] || String(row[1]).trim() === "") continue;
      let dateVal = row[0];
      if (dateVal instanceof Date)
        dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
      submissions.push({
        rowIndex:      i + 1,
        date:          String(dateVal  || "").trim(),
        csm:           String(row[1]   || "").trim(),
        activity:      String(row[2]   || "").trim(),
        reviews:       (row[3] !== "" && row[3] !== null) ? Number(row[3]) : "",
        customerName:  String(row[4]   || "").trim(),
        customerEmail: String(row[5]   || "").trim(),
        context:       String(row[6]   || "").trim(),
        notes:         String(row[7]   || "").trim(),
        points:        Number(row[8])  || 0,
        category:      String(row[9]   || "").trim(),
      });
    }
    return jsonOut({ ok:true, submissions });
  } catch(err) {
    return jsonOut({ ok:false, error:err.message, submissions:[] });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action  = payload._action || "create";
    if (action === "create") return handleCreate(payload);
    if (action === "update") return handleUpdate(payload);
    if (action === "delete") return handleDelete(payload);
    return jsonOut({ ok:false, error:`Unknown action: ${action}` });
  } catch(err) {
    return jsonOut({ ok:false, error:err.message });
  }
}

function handleCreate(p) {
  const sheet = getSheet();
  ensureHeaders(sheet);
  const err = validatePayload(p);
  if (err) return jsonOut({ ok:false, error:err });
  sheet.appendRow(rowFromPayload(p));
  return jsonOut({ ok:true, message:"Created." });
}

function handleUpdate(p) {
  const sheet = getSheet();
  const ri    = Number(p.rowIndex);
  if (!Number.isFinite(ri) || ri < 2) return jsonOut({ ok:false, error:"Invalid rowIndex." });
  if (ri > sheet.getLastRow())        return jsonOut({ ok:false, error:`Row ${ri} does not exist.` });
  const err = validatePayload(p);
  if (err) return jsonOut({ ok:false, error:err });
  const existing = sheet.getRange(ri,2).getValue();
  if (!existing || String(existing).trim() === "")
    return jsonOut({ ok:false, error:`Row ${ri} appears empty. Refresh and try again.` });
  sheet.getRange(ri,1,1,HEADERS.length).setValues([rowFromPayload(p)]);
  return jsonOut({ ok:true, message:`Row ${ri} updated.` });
}

function handleDelete(p) {
  const sheet = getSheet();
  const ri    = Number(p.rowIndex);
  if (!Number.isFinite(ri) || ri < 2) return jsonOut({ ok:false, error:"Invalid rowIndex." });
  if (ri > sheet.getLastRow())        return jsonOut({ ok:false, error:`Row ${ri} does not exist.` });
  const existing = sheet.getRange(ri,2).getValue();
  if (!existing || String(existing).trim() === "")
    return jsonOut({ ok:false, error:`Row ${ri} is already empty.` });
  sheet.deleteRow(ri);
  return jsonOut({ ok:true, message:`Row ${ri} deleted.` });
}

// ─── SLACK HANDLER ────────────────────────────────────────────────────────────
// Called when _action === "slack"
// Requires SLACK_WEBHOOK_URL set in Apps Script Project Properties
// Set it: Apps Script editor → Project Settings → Script Properties
// Key: SLACK_WEBHOOK_URL  Value: https://hooks.slack.com/services/...

function handleSlack(payload) {
  try {
    const props      = PropertiesService.getScriptProperties();
    const webhookUrl = props.getProperty("SLACK_WEBHOOK_URL");

    if (!webhookUrl) {
      return jsonOut({ ok: false, error: "SLACK_WEBHOOK_URL not set in Script Properties." });
    }

    const response = UrlFetchApp.fetch(webhookUrl, {
      method:      "post",
      contentType: "application/json",
      payload:     JSON.stringify({ text: payload.text }),
    });

    const code = response.getResponseCode();
    if (code !== 200) {
      return jsonOut({ ok: false, error: `Slack returned HTTP ${code}` });
    }

    return jsonOut({ ok: true, message: "Sent to Slack." });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}
