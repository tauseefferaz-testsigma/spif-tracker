// ════════════════════════════════════════════════════════════════════════════
// SPIF Tracker — Google Apps Script Backend
// Full CRUD: GET (read), POST (create), PUT (update), DELETE
// ════════════════════════════════════════════════════════════════════════════

const SHEET_NAME = 'Submissions';
const HEADERS    = ['Date', 'CSM Name', 'Tier', 'Activity', 'No. of Reviews', 'Notes', 'Points'];

// ─── CORS + RESPONSE HELPER ──────────────────────────────────────────────────

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── SHEET HELPER ────────────────────────────────────────────────────────────

function getSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found. Create it with the correct name.`);
  return sheet;
}

function ensureHeaders(sheet) {
  const row1 = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = row1.some(v => String(v).trim() !== '');
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

const VALID_CSMS = [
  'Aarathy Sundaresan', 'Aravinda G', 'Arun S', 'Mohammed Tamiz Uddin',
  'Rama Varma', 'sakshi.bagri', 'Shabrish BM', 'Subhopriyo Sen',
  'Tauseef Feraz', 'Varun Thakur', 'Vig',
];
const VALID_TIERS = ['SMB', 'Enterprise'];
const VALID_ACTIVITIES = [
  'G2 Review — SMB',
  'G2 Review — Enterprise',
  'Case Study',
  'GPI',
];

function validatePayload(p) {
  if (!p.csm || !VALID_CSMS.includes(p.csm)) return 'Invalid CSM name.';
  if (!p.tier || !VALID_TIERS.includes(p.tier)) return 'Invalid tier.';
  if (!p.activity || !VALID_ACTIVITIES.includes(p.activity)) return 'Invalid activity.';
  const pts = Number(p.points);
  if (!Number.isFinite(pts) || pts < 0) return 'Invalid points value.';
  return null;
}

// ─── READ ─────────────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    const sheet = getSheet();
    const data  = sheet.getDataRange().getValues();

    if (data.length < 2) return jsonOut({ submissions: [] });

    const submissions = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // skip completely empty rows
      if (!row[1] || String(row[1]).trim() === '') continue;

      let dateVal = row[0];
      if (dateVal instanceof Date) {
        dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }

      submissions.push({
        rowIndex:  i + 1,           // 1-indexed (row 1 = headers, row 2 = first data row)
        date:      String(dateVal || '').trim(),
        csm:       String(row[1] || '').trim(),
        tier:      String(row[2] || '').trim(),
        activity:  String(row[3] || '').trim(),
        reviews:   row[4] !== '' && row[4] !== null ? Number(row[4]) : '',
        notes:     String(row[5] || '').trim(),
        points:    Number(row[6]) || 0,
      });
    }

    return jsonOut({ ok: true, submissions });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message, submissions: [] });
  }
}

// ─── ALL WRITES GO THROUGH doPost ────────────────────────────────────────────
// Browsers block PUT/DELETE in no-cors mode.
// We use POST for everything and route by _action field.

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action  = payload._action || 'create';

    if (action === 'create') return handleCreate(payload);
    if (action === 'update') return handleUpdate(payload);
    if (action === 'delete') return handleDelete(payload);

    return jsonOut({ ok: false, error: `Unknown action: ${action}` });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

function handleCreate(payload) {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const validationError = validatePayload(payload);
  if (validationError) return jsonOut({ ok: false, error: validationError });

  sheet.appendRow([
    payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    String(payload.csm).trim(),
    String(payload.tier).trim(),
    String(payload.activity).trim(),
    payload.reviews !== '' && payload.reviews !== null ? Number(payload.reviews) : '',
    String(payload.notes || '').trim().slice(0, 500),
    Number(payload.points),
  ]);

  return jsonOut({ ok: true, message: 'Created.' });
}

function handleUpdate(payload) {
  const sheet    = getSheet();
  const rowIndex = Number(payload.rowIndex);

  if (!Number.isFinite(rowIndex) || rowIndex < 2) {
    return jsonOut({ ok: false, error: 'Invalid rowIndex.' });
  }

  const maxRows = sheet.getLastRow();
  if (rowIndex > maxRows) {
    return jsonOut({ ok: false, error: `Row ${rowIndex} does not exist (last row: ${maxRows}).` });
  }

  const validationError = validatePayload(payload);
  if (validationError) return jsonOut({ ok: false, error: validationError });

  // Guard against stale rowIndex — verify row has data
  const existingCsm = sheet.getRange(rowIndex, 2).getValue();
  if (!existingCsm || String(existingCsm).trim() === '') {
    return jsonOut({ ok: false, error: `Row ${rowIndex} appears empty. Refresh the app and try again.` });
  }

  sheet.getRange(rowIndex, 1, 1, 7).setValues([[
    payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    String(payload.csm).trim(),
    String(payload.tier).trim(),
    String(payload.activity).trim(),
    payload.reviews !== '' && payload.reviews !== null ? Number(payload.reviews) : '',
    String(payload.notes || '').trim().slice(0, 500),
    Number(payload.points),
  ]]);

  return jsonOut({ ok: true, message: `Row ${rowIndex} updated.` });
}

function handleDelete(payload) {
  const sheet    = getSheet();
  const rowIndex = Number(payload.rowIndex);

  if (!Number.isFinite(rowIndex) || rowIndex < 2) {
    return jsonOut({ ok: false, error: 'Invalid rowIndex.' });
  }

  const maxRows = sheet.getLastRow();
  if (rowIndex > maxRows) {
    return jsonOut({ ok: false, error: `Row ${rowIndex} does not exist.` });
  }

  // Guard against deleting an empty/wrong row
  const existingCsm = sheet.getRange(rowIndex, 2).getValue();
  if (!existingCsm || String(existingCsm).trim() === '') {
    return jsonOut({ ok: false, error: `Row ${rowIndex} is already empty.` });
  }

  sheet.deleteRow(rowIndex);

  return jsonOut({ ok: true, message: `Row ${rowIndex} deleted.` });
}
