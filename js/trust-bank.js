const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyadofcyXYDLF0SxQpUdpWxU8pwEi7BljcLe3V_dUuAqAPslxFYW6GThj1DMeO5Pt47/exec?type=trust";

const recordList = document.getElementById("recordList");
const recordCount = document.getElementById("recordCount");
const trustError = document.getElementById("trustError");

async function loadTrustRecords() {
  try {
    trustError.hidden = true;
    recordCount.textContent = "積立件数　読み込み中…";
    recordList.innerHTML = "";

    const response = await fetch(GAS_WEB_APP_URL);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.ok || !Array.isArray(data.records)) {
      throw new Error("積立データの形式が正しくありません。");
    }

    const records = data.records;

    recordCount.textContent = `積立件数　${records.length}件`;

    recordList.innerHTML = records
      .map((record) => {
        return `
          <div class="trust-record">
            <time class="trust-record-date">${escapeHtml(record.date || "")}</time>
            <p class="trust-record-text">${escapeHtml(record.text || "")}</p>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error(error);
    recordCount.textContent = "積立件数　取得できませんでした";
    trustError.hidden = false;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadTrustRecords();