const SHEET_NAME = "動画ライブラリ";

/*
 * スプレッドシートに紐づけたApps Scriptとして使います。
 *
 * 1行目の見出し：
 * 登録日 | 動画タイトル | URL | メモ | キーワード | 表示
 *
 * キーワードは「仕事, IT, 心の回復」のように
 * カンマまたは読点区切りで複数指定できます。
 *
 * 表示欄が「FALSE」「非表示」「0」の行はLABへ出しません。
 */
function doGet(e) {
  const callback = sanitizeCallback_(e && e.parameter && e.parameter.callback);

  try {
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(`シート「${SHEET_NAME}」がありません。`);
    }

    const values = sheet.getDataRange().getDisplayValues();
    const rows = values.slice(1);

    const videos = rows
      .filter(row => {
        const title = String(row[1] || "").trim();
        const url = String(row[2] || "").trim();
        const visible = String(row[5] || "").trim().toLowerCase();

        const isHidden = ["false", "非表示", "0", "off"].includes(visible);
        return title && url && !isHidden;
      })
      .map(row => ({
        title: String(row[1] || "").trim(),
        url: String(row[2] || "").trim(),
        memo: String(row[3] || "").trim(),
        keywords: splitKeywords_(row[4])
      }))
      .reverse();

    return output_({ ok: true, videos }, callback);
  } catch (error) {
    return output_({
      ok: false,
      message: error instanceof Error ? error.message : String(error)
    }, callback);
  }
}

function splitKeywords_(value) {
  return String(value || "")
    .split(/[,、\n]/)
    .map(keyword => keyword.trim())
    .filter(Boolean);
}

function sanitizeCallback_(value) {
  const callback = String(value || "").trim();

  if (/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return callback;
  }

  return "";
}

function output_(data, callback) {
  const json = JSON.stringify(data);
  const body = callback ? `${callback}(${json});` : json;
  const mimeType = callback
    ? ContentService.MimeType.JAVASCRIPT
    : ContentService.MimeType.JSON;

  return ContentService
    .createTextOutput(body)
    .setMimeType(mimeType);
}
