// ════════════════════════════════════════════════════════════════════════
// Customer Advocacy App v3 — Google Apps Script Backend
// Schema: Date · CSM Name · Activity · Reviews · Customer Name ·
//         Customer Email · Context · Notes · Points · Category · URL · Quarter
// ════════════════════════════════════════════════════════════════════════

const SHEET_NAME = "Submissions";
const HEADERS = [
  "Date","CSM Name","Activity","Reviews",
  "Customer Name","Customer Email","Context","Notes","Points","Category","URL","Quarter"
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
    return;
  }
  // Existing sheet: fill any missing trailing header (e.g. new URL/Quarter
  // column) without disturbing existing header cells or any existing data.
  for (let c = 0; c < HEADERS.length; c++) {
    const cell = sheet.getRange(1, c + 1);
    if (String(cell.getValue()).trim() === "") {
      cell.setValue(HEADERS[c]).setFontWeight("bold");
    }
  }
}

// ─── QUARTERS ─────────────────────────────────────────────────────────────
// Mirrors src/types/index.js. New quarters are appended here — existing rows
// are never rewritten. A blank/legacy Quarter cell (rows written before this
// column existed) is treated as Q2 2026 so historical data classifies
// correctly without needing a backfill.
const QUARTERS = ["Q2 2026", "Q3 2026"];
const CURRENT_QUARTER = "Q3 2026";
const LEGACY_QUARTER = "Q2 2026";

function normalizeQuarter(value) {
  const q = String(value || "").trim();
  return QUARTERS.indexOf(q) > -1 ? q : LEGACY_QUARTER;
}

// Resolves legacy raw CSM values (e.g. an old username) to their canonical
// display name, mirroring the `aliases` on the frontend CSM roster.
const CSM_ALIAS_MAP = {
  "sakshi.bagri": "Sakshi Bagri",
};

function canonicalCsmName(rawName) {
  const name = String(rawName || "").trim();
  return CSM_ALIAS_MAP[name] || name;
}

// Accepts both the current canonical names and older raw/legacy values so
// edits to historical rows (and the rows themselves) always validate.
const VALID_CSM_NAMES = [
  // Active roster (Q3 2026 onward)
  "Aarathy Sundaresan",
  "Arun S",
  "Rama Varma",
  "Sakshi Bagri",
  "Tauseef Feraz",
  "Vanshika Adlakha",
  "Yadhu Krishnan",
  // Former CSMs — kept valid so historical Q2 2026 rows can still be edited
  "Subhopriyo Sen",
  "Mohammed Tamiz Uddin",
  "Aravinda G",
  "Varun Thakur",
  "Shabrish BM",
  // Legacy raw value for Sakshi Bagri
  "sakshi.bagri",
];

const VALID_ACTIVITIES = [
  "G2 Review","Gartner Peer Insights Review",
  "Reference Customer","Success Story",
  "Webinar Speaker","Customer Social Post",
];
const REVIEW_ACTIVITIES = ["G2 Review", "Gartner Peer Insights Review"];
const CUSTOMER_ACTIVITIES = [
  "G2 Review",
  "Gartner Peer Insights Review",
  "Reference Customer",
  "Success Story",
  "Customer Social Post",
];
// Activities that require an approved/published URL (mirrors showUrl on the frontend)
const URL_ACTIVITIES = [
  "G2 Review",
  "Gartner Peer Insights Review",
  "Reference Customer",
  "Success Story",
  "Customer Social Post",
];

function isValidUrl(value) {
  return /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(String(value || "").trim());
}

const PROGRAM_START = "2026-05-18";
const PROGRAM_WEEKS = 6;
const SLACK_NAME_MAP = {
  "Mohammed Tamiz Uddin": "Tamiz",
  "Aravinda G": "Aravinda",
  "Subhopriyo Sen": "Subho",
  "Sakshi Bagri": "Sakshi",
  "Rama Varma": "Ram",
  "Arun S": "Arun",
  "Varun Thakur": "Varun",
  "Shabrish BM": "Shabrish",
  "Tauseef Feraz": "Tauseef",
  "Aarathy Sundaresan": "Aarathy",
  "Vanshika Adlakha": "Vanshika",
  "Yadhu Krishnan": "Yadhu",
};
// name     = canonical display name.
// quarters = which quarter(s) this CSM is part of — a former CSM keeps their
//            Q2 2026 entry here (so historical stats/targets stay correct)
//            but is left out of Q3 2026, and a brand-new CSM only appears in
//            Q3 2026 since they weren't part of the Q2 program.
const CSM_CONFIG = [
  { name: "Subhopriyo Sen",       targets: { reviews: 5, references: 1, stories: 1 }, quarters: ["Q2 2026"] },
  { name: "Rama Varma",           targets: { reviews: 5, references: 1, stories: 1 }, quarters: ["Q2 2026", "Q3 2026"] },
  { name: "Sakshi Bagri",         targets: { reviews: 5, references: 1, stories: 1 }, quarters: ["Q2 2026", "Q3 2026"] },
  { name: "Mohammed Tamiz Uddin", targets: { reviews: 7, references: 2, stories: 2 }, quarters: ["Q2 2026"] },
  { name: "Aravinda G",           targets: { reviews: 7, references: 2, stories: 2 }, quarters: ["Q2 2026"] },
  { name: "Arun S",               targets: { reviews: 7, references: 2, stories: 2 }, quarters: ["Q2 2026", "Q3 2026"] },
  { name: "Varun Thakur",         targets: { reviews: 7, references: 2, stories: 2 }, quarters: ["Q2 2026"] },
  { name: "Shabrish BM",          targets: { reviews: 7, references: 2, stories: 2 }, quarters: ["Q2 2026"] },
  { name: "Tauseef Feraz",        targets: null, quarters: ["Q2 2026", "Q3 2026"] },
  { name: "Aarathy Sundaresan",   targets: null, quarters: ["Q2 2026", "Q3 2026"] },
  { name: "Vanshika Adlakha",     targets: null, quarters: ["Q3 2026"] },
  { name: "Yadhu Krishnan",       targets: null, quarters: ["Q3 2026"] },
];

function csmConfigForQuarter(quarter) {
  return CSM_CONFIG.filter(function (csm) { return csm.quarters.indexOf(quarter) > -1; });
}

function getTeamTargets(quarter) {
  return csmConfigForQuarter(quarter).reduce(function (acc, csm) {
    if (csm.targets) {
      acc.reviews += csm.targets.reviews;
      acc.references += csm.targets.references;
      acc.stories += csm.targets.stories;
    }
    return acc;
  }, { reviews: 0, references: 0, stories: 0 });
}
// Backwards-compatible export (Q2 2026 team targets — unchanged from before).
const TEAM_TARGETS = getTeamTargets("Q2 2026");

function validatePayload(p) {
  if (!p.csm || !VALID_CSM_NAMES.includes(p.csm)) return "Invalid CSM name.";
  if (!p.activity || !VALID_ACTIVITIES.includes(p.activity)) return "Invalid activity.";
  if (p.quarter && QUARTERS.indexOf(String(p.quarter).trim()) === -1) return "Invalid quarter.";
  const pts = Number(p.points);
  if (!Number.isFinite(pts) || pts < 0) return "Invalid points value.";
  if (CUSTOMER_ACTIVITIES.includes(p.activity)) {
    const customerName = String(p.customerName || "").trim();
    if (customerName.length < 2) return "Invalid customer/company name.";

    const emailDetails = getEmailValidationDetails(p.customerEmail);
    if (emailDetails.rawEmails.length === 0) return "At least one customer email is required.";
    if (emailDetails.invalidEmails.length > 0) return `Invalid email: ${emailDetails.invalidEmails[0]}`;
    if (emailDetails.duplicateCount > 0) return "Duplicate customer emails are not allowed.";

    if (REVIEW_ACTIVITIES.includes(p.activity)) {
      const reviewCount = Math.max(1, parseInt(p.reviews, 10) || 1);
      if (emailDetails.uniqueEmails.length !== reviewCount) {
        return `Expected ${reviewCount} unique email${reviewCount === 1 ? "" : "s"} for ${reviewCount} review${reviewCount === 1 ? "" : "s"}.`;
      }
    }
  }
  if (URL_ACTIVITIES.includes(p.activity)) {
    const url = String(p.url || "").trim();
    if (!url) return "An approved/published URL is required.";
    if (!isValidUrl(url)) return "Invalid URL. Must start with http:// or https://";
  }
  return null;
}

function parseEmailList(value) {
  return String(value || "")
    .split(/[\n,;]+/)
    .map(function (email) { return email.trim().toLowerCase(); })
    .filter(Boolean);
}

function getEmailValidationDetails(value) {
  const rawEmails = parseEmailList(value);
  const uniqueEmails = Array.from(new Set(rawEmails));
  const invalidEmails = uniqueEmails.filter(function (email) {
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  });
  return {
    rawEmails: rawEmails,
    uniqueEmails: uniqueEmails,
    invalidEmails: invalidEmails,
    duplicateCount: rawEmails.length - uniqueEmails.length,
  };
}

function rowFromPayload(p) {
  const normalizedEmails = getEmailValidationDetails(p.customerEmail).uniqueEmails.join("\n");
  return [
    p.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    canonicalCsmName(p.csm || ""),
    String(p.activity || "").trim(),
    (p.reviews !== "" && p.reviews !== null && p.reviews !== undefined) ? Number(p.reviews) : "",
    String(p.customerName  || "").trim(),
    normalizedEmails,
    String(p.context || "").trim(),
    String(p.notes   || "").trim().slice(0,500),
    Number(p.points),
    String(p.category || "").trim(),
    String(p.url || "").trim(),
    // New creates default to the current quarter; edits pass their existing
    // (possibly Q2 2026) quarter through unchanged.
    normalizeQuarter(p.quarter || CURRENT_QUARTER),
  ];
}

function getSlackWebhookUrl() {
  return String(PropertiesService.getScriptProperties().getProperty("SLACK_WEBHOOK_URL") || "").trim();
}

function getCurrentWeekNumber() {
  const start = new Date(PROGRAM_START + "T00:00:00");
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) return 0;
  return Math.min(Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1, PROGRAM_WEEKS);
}

function getProgramProgress() {
  return getCurrentWeekNumber() / PROGRAM_WEEKS;
}

function getShortSlackName(name) {
  return SLACK_NAME_MAP[name] || name;
}

function padRight(value, width) {
  value = String(value || "");
  while (value.length < width) value += " ";
  return value;
}

function progressBar(actual, target, length) {
  if (!target) return "";
  length = length || 10;
  const filled = Math.round(Math.min(1, actual / target) * length);
  return "▓".repeat(filled) + "░".repeat(length - filled);
}

function getPaceStatus(actual, target) {
  if (!target) return null;
  const expected = getProgramProgress() * target;
  if (expected === 0) return "on_track";
  const ratio = actual / expected;
  if (ratio >= 1.1) return "ahead";
  if (ratio >= 0.85) return "on_track";
  return "behind";
}

function paceEmoji(status) {
  if (status === "ahead") return "🟢";
  if (status === "on_track") return "🟡";
  if (status === "behind") return "🔴";
  return "⚪";
}

function isReviewActivity(activity) {
  return activity === "G2 Review" || activity === "Gartner Peer Insights Review";
}

function isReferenceActivity(activity) {
  return activity === "Reference Customer";
}

function isStoryActivity(activity) {
  return activity === "Success Story";
}

function getSubmissionsFromSheet() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const submissions = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[1] || String(row[1]).trim() === "") continue;
    let dateVal = row[0];
    if (dateVal instanceof Date) {
      dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
    submissions.push({
      rowIndex: i + 1,
      date: String(dateVal || "").trim(),
      csm: canonicalCsmName(row[1]),
      activity: String(row[2] || "").trim(),
      reviews: (row[3] !== "" && row[3] !== null) ? Number(row[3]) : "",
      customerName: String(row[4] || "").trim(),
      customerEmail: String(row[5] || "").trim(),
      context: String(row[6] || "").trim(),
      notes: String(row[7] || "").trim(),
      points: Number(row[8]) || 0,
      category: String(row[9] || "").trim(),
      url: String(row[10] || "").trim(),
      // Rows written before this column existed have a blank cell here —
      // normalizeQuarter classifies those as Q2 2026 without touching the row.
      quarter: normalizeQuarter(row[11]),
    });
  }

  return submissions;
}

function buildCsmStatsFromSubmissions(submissions, quarter) {
  const q = quarter || CURRENT_QUARTER;
  // Defensively scope to the requested quarter here too, mirroring the
  // frontend's buildCsmStats — never trust the caller to have pre-filtered.
  const scoped = submissions.filter(function (row) {
    return normalizeQuarter(row.quarter) === q;
  });
  const map = {};

  csmConfigForQuarter(q).forEach(function (csm) {
    map[csm.name] = {
      name: csm.name,
      targets: csm.targets,
      pts: 0,
      reviews: 0,
      references: 0,
      stories: 0,
      activities: 0,
    };
  });

  scoped.forEach(function (row) {
    const current = map[canonicalCsmName(row.csm)];
    if (!current) return;
    current.pts += Number(row.points) || 0;
    current.activities += 1;
    if (isReviewActivity(row.activity)) current.reviews += Number(row.reviews) || 0;
    if (isReferenceActivity(row.activity)) current.references += 1;
    if (isStoryActivity(row.activity)) current.stories += 1;
  });

  return Object.keys(map).map(function (key) {
    return map[key];
  }).sort(function (a, b) {
    return b.pts - a.pts;
  });
}

function buildSlackSnapshotMessage() {
  const allSubmissions = getSubmissionsFromSheet();
  // The scheduled Slack snapshot reports on the active/current quarter only —
  // Q2 2026 history doesn't carry into it.
  const submissions = allSubmissions.filter(function (row) {
    return normalizeQuarter(row.quarter) === CURRENT_QUARTER;
  });
  const lb = buildCsmStatsFromSubmissions(submissions, CURRENT_QUARTER);
  const summary = {
    totalReviews: lb.reduce(function (sum, csm) { return sum + csm.reviews; }, 0),
    totalRefs: lb.reduce(function (sum, csm) { return sum + csm.references; }, 0),
    totalStories: lb.reduce(function (sum, csm) { return sum + csm.stories; }, 0),
    targets: getTeamTargets(CURRENT_QUARTER),
  };
  const week = getCurrentWeekNumber();
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMM d");
  const reviewPct = Math.round((summary.totalReviews / summary.targets.reviews) * 100) || 0;
  const refPct = Math.round((summary.totalRefs / summary.targets.references) * 100) || 0;
  const storyPct = Math.round((summary.totalStories / summary.targets.stories) * 100) || 0;
  const medals = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
  const topRows = lb.slice(0, 5);
  const leaderboardLines = topRows.map(function (csm, index) {
    const pace = csm.targets ? getPaceStatus(csm.reviews, csm.targets.reviews) : null;
    return medals[index] + " " + padRight(getShortSlackName(csm.name), 9) + " — " + csm.pts + " pts  " + paceEmoji(pace);
  }).join("\n");
  const leaderboardBlock = lb.length > 5 ? leaderboardLines + "\n..." : leaderboardLines;

  const withTargets = lb.filter(function (csm) { return Boolean(csm.targets); });
  const ahead = withTargets.filter(function (csm) {
    return getPaceStatus(csm.reviews, csm.targets.reviews) === "ahead";
  }).map(function (csm) { return getShortSlackName(csm.name); });
  const onTrack = withTargets.filter(function (csm) {
    return getPaceStatus(csm.reviews, csm.targets.reviews) === "on_track";
  }).map(function (csm) { return getShortSlackName(csm.name); });
  const behind = withTargets.filter(function (csm) {
    return getPaceStatus(csm.reviews, csm.targets.reviews) === "behind";
  }).map(function (csm) { return getShortSlackName(csm.name); });

  const paceLines = [
    ahead.length ? "🟢 Ahead    — " + ahead.join(", ") : null,
    onTrack.length ? "🟡 On Track — " + onTrack.join(", ") : null,
    behind.length ? "🔴 Behind   — " + behind.join(", ") : null,
  ].filter(Boolean).join("\n") || "No pace data yet.";

  return "📊 Customer Advocacy App — Snapshot | " + CURRENT_QUARTER + " · " + dateStr + " · Week " + week + " of " + PROGRAM_WEEKS + "\n\n" +
    "📊 Team Progress\n" +
    "Reviews      " + progressBar(summary.totalReviews, summary.targets.reviews) + "  " + summary.totalReviews + " / " + summary.targets.reviews + "  (" + reviewPct + "%)\n" +
    "References   " + progressBar(summary.totalRefs, summary.targets.references) + "  " + summary.totalRefs + " / " + summary.targets.references + "  (" + refPct + "%)\n" +
    "Stories      " + progressBar(summary.totalStories, summary.targets.stories) + "  " + summary.totalStories + " / " + summary.targets.stories + "  (" + storyPct + "%)\n\n" +
    "🏆 Leaderboard\n" + leaderboardBlock + "\n\n" +
    "⚡ Pace Check\n" + paceLines;
}

function buildSlackDebugInfo() {
  const webhookUrl = getSlackWebhookUrl();
  return {
    ok: true,
    app: "spif-tracker",
    slackConfigured: Boolean(webhookUrl),
    slackWebhookHost: webhookUrl ? webhookUrl.split("/").slice(0, 3).join("/") : null,
    currentWeek: getCurrentWeekNumber(),
    version: "scheduled-slack-v1",
  };
}

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.diagnostics === "1") {
      return jsonOut(buildSlackDebugInfo());
    }
    if (e && e.parameter && e.parameter.testSlack === "1") {
      return handleSlack({ text: buildSlackSnapshotMessage() });
    }

    const submissions = getSubmissionsFromSheet();
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
    if (action === "slack")  return handleSlack(payload);
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
    const webhookUrl = getSlackWebhookUrl();

    if (!webhookUrl) {
      return jsonOut({ ok: false, error: "SLACK_WEBHOOK_URL not set in Script Properties." });
    }

    const text = String(payload && payload.text ? payload.text : "").trim();
    if (!text) {
      return jsonOut({ ok: false, error: "Slack message text is empty." });
    }

    const response = UrlFetchApp.fetch(webhookUrl, {
      method:      "post",
      contentType: "application/json; charset=utf-8",
      muteHttpExceptions: true,
      payload:     JSON.stringify({ text: text }),
    });

    const code = response.getResponseCode();
    if (code !== 200) {
      return jsonOut({ ok: false, error: `Slack returned HTTP ${code}`, details: response.getContentText() });
    }

    return jsonOut({ ok: true, message: "Sent to Slack." });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

function sendScheduledSlackSnapshot() {
  const result = handleSlack({ text: buildSlackSnapshotMessage() });
  Logger.log(result.getContent());
  return result;
}

function clearSlackScheduleTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "sendScheduledSlackSnapshot") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function createSlackScheduleTriggers() {
  clearSlackScheduleTriggers();
  ScriptApp.newTrigger("sendScheduledSlackSnapshot")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
  ScriptApp.newTrigger("sendScheduledSlackSnapshot")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .atHour(17)
    .create();
  return jsonOut({ ok: true, message: "Created Monday 9 AM and Friday 5 PM triggers in the script timezone." });
}


// ═══════════════════════════════════════════════════════════════════
// AUTOMATED SLACK MESSAGES - Friday CSM Snapshot & Monday Summary
// ═══════════════════════════════════════════════════════════════════

const SLACK_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');

function sendFridayCSMSnapshot() {
  const today = new Date();
  const day = today.getDay();
  
  // Only run on Friday (5) at 10 AM
  if (day !== 5) return;
  
  try {
    const submissions = getSubmissionsFromSheet();
    const message = buildCSMSnapshotMessage(submissions);
    
    const payload = {
      text: message
    };
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
    Logger.log("Friday CSM Snapshot sent: " + response.getResponseCode());
  } catch (e) {
    Logger.log("Error sending Friday CSM Snapshot: " + e);
  }
}

function sendMondayTeamSummary() {
  const today = new Date();
  const day = today.getDay();
  
  // Only run on Monday (1) at 10 AM
  if (day !== 1) return;
  
  try {
    const submissions = getSubmissionsFromSheet();
    const message = buildTeamSummaryMessage(submissions);
    
    const payload = {
      text: message
    };
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
    Logger.log("Monday Team Summary sent: " + response.getResponseCode());
  } catch (e) {
    Logger.log("Error sending Monday Team Summary: " + e);
  }
}

function buildCSMSnapshotMessage(submissions) {
  const week = currentWeekNumber();
  const stats = buildCsmStats(submissions);
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  let message = `📊 Customer Advocacy App — CSM Snapshot | ${dateStr} · Week ${week} of ${PROGRAM_WEEKS}\n\n`;
  
  message += `Name                        Reviews      References    Stories\n`;
  message += `─────────────────────────────────────────────────────────────\n\n`;

  for (const csm of stats) {
    const name = csm.name.padEnd(26, " ");
    
    if (!csm.targets) {
      message += `${name}📝 ${csm.reviews}       📋 ${csm.references}           📖 ${csm.stories}\n`;
    } else {
      message += `${name}📝 ${csm.reviews}/${csm.targets.reviews}       📋 ${csm.references}/${csm.targets.references}         📖 ${csm.stories}/${csm.targets.stories}\n`;
    }
  }

  return message;
}

function buildTeamSummaryMessage(submissions) {
  const week = currentWeekNumber();
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  let message = `📊 Customer Advocacy App — Snapshot | ${dateStr} · Week ${week} of ${PROGRAM_WEEKS}`;

  return message;
}

function setUpAutomatedTriggers() {
  // This function creates the triggers
  // Run this ONCE in AppsScript editor to set up automation
  
  // Friday 10 AM trigger
  ScriptApp.newTrigger('sendFridayCSMSnapshot')
    .timeBased()
    .atHour(10)
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .create();
  
  // Monday 10 AM trigger
  ScriptApp.newTrigger('sendMondayTeamSummary')
    .timeBased()
    .atHour(10)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .create();
  
  Logger.log("Automated triggers set up successfully!");
}
