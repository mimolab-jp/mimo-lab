const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyadofcyXYDLF0SxQpUdpWxU8pwEi7BljcLe3V_dUuAqAPslxFYW6GThj1DMeO5Pt47/exec?type=shops";

const shopList = document.getElementById("shopList");
const shopCount = document.getElementById("shopCount");
const reloadShops = document.getElementById("reloadShops");
const shopsEmpty = document.getElementById("shopsEmpty");
const shopsError = document.getElementById("shopsError");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadShops() {
  try {
    shopCount.textContent = "読み込み中…";
    shopsError.hidden = true;
    shopsEmpty.hidden = true;
    shopList.innerHTML = "";

    const response = await fetch(GAS_WEB_APP_URL);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.ok || !Array.isArray(data.shops)) {
      throw new Error("お店データの形式が正しくありません。");
    }

    const shops = data.shops;

    shopCount.textContent = `${shops.length}店`;
    shopsEmpty.hidden = shops.length !== 0;

    shopList.innerHTML = shops.map(shop => {
      const memoHtml = shop.memo
        ? `<p class="shop-memo">${escapeHtml(shop.memo)}</p>`
        : "";

     const snsHtml = shop.snsUrl
  ? `
    <a
      class="shop-sns-link"
      href="${escapeHtml(shop.snsUrl)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${shop.snsUrl.includes("instagram.com") ? "📸 Instagram" : "🏠 SNS・公式"}
    </a>
  `
  : ""; 

      return `
        <article class="shop-card">
          <div class="shop-card-header">
            <h2 class="shop-name">📌 ${escapeHtml(shop.name)}</h2>
            <span class="shop-genre">${escapeHtml(shop.genre)}</span>
          </div>

          <dl class="shop-info">
            <dt>営業時間</dt>
            <dd>${escapeHtml(shop.hours)}</dd>

            <dt>定休日</dt>
            <dd class="shop-closed">${escapeHtml(shop.closed)}</dd>
          </dl>

          ${memoHtml}
          ${snsHtml}
        </article>
      `;
    }).join("");

  } catch (error) {
    console.error(error);
    shopCount.textContent = "読み込み失敗";
    shopList.innerHTML = "";
    shopsEmpty.hidden = true;
    shopsError.hidden = false;
  }
}

reloadShops.addEventListener("click", loadShops);

loadShops();