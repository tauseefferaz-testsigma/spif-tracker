const SHEET_NAME = 'Submissions';

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return jsonResponse({ submissions: [] });

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse({ submissions: [] });

  const headers = data[0].map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, ''));
  const submissions = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[1]) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      let val = row[idx];
      if (val instanceof Date) val = Utilities.formatDate(val, 'GMT', 'yyyy-MM-dd');
      obj[h] = val;
    });
    submissions.push({
      date:     obj.date     || '',
      csm:      obj.csmname  || obj.csm || '',
      tier:     obj.tier     || '',
      activity: obj.activity || '',
      reviews:  obj.noofreviews || obj.reviews || '',
      notes:    obj.notes    || '',
      points:   Number(obj.points || 0),
    });
  }
  return jsonResponse({ submissions });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Sheet not found');

    sheet.appendRow([
      payload.date,
      payload.csm,
      payload.tier,
      payload.activity,
      payload.reviews,
      payload.notes,
      payload.points,
    ]);

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
