document.addEventListener("DOMContentLoaded", () => {

  // ========================================
  // API
  // ========================================

  const THANKS_API_URL =
    "https://script.google.com/macros/s/AKfycbyadofcyXYDLF0SxQpUdpWxU8pwEi7BljcLe3V_dUuAqAPslxFYW6GThj1DMeO5Pt47/exec?type=thanks";


  // ========================================
  // DOM
  // ========================================

  const thanksForm =
    document.getElementById("thanksForm");

  const thanksInput =
    document.getElementById("thanksInput");

  const thanksSubmit =
    document.getElementById("thanksSubmit");

  const thanksList =
    document.getElementById("thanksList");

  const thanksCount =
    document.getElementById("thanksCount");

  const thanksEmpty =
    document.getElementById("thanksEmpty");


  // ========================================
  // HTMLエスケープ
  // ========================================

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  // ========================================
  // 読み込み
  // ========================================

  async function loadThanks() {
    const response = await fetch(THANKS_API_URL, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `HTTPエラー：${response.status}`
      );
    }

    const data = await response.json();

    if (!data.ok || !Array.isArray(data.thanks)) {
      throw new Error(
        "感謝ノートのデータ形式が正しくありません。"
      );
    }

    return data.thanks;
  }


  // ========================================
  // 日付表示
  // ========================================

  function formatDate(date) {
    const parts = String(date).split("/");

    if (parts.length !== 3) {
      return date;
    }

    return `${Number(parts[1])}月${Number(parts[2])}日`;
  }


  function getTime(createdAt) {
    const match =
      String(createdAt).match(/(\d{2}:\d{2}):\d{2}$/);

    return match ? match[1] : "";
  }


  // ========================================
  // 描画
  // ========================================

  function renderThanks(items) {
    thanksList.innerHTML = "";

    thanksCount.textContent = items.length;
    thanksEmpty.hidden = items.length !== 0;

    const groups = new Map();

    items.forEach(item => {
      if (!groups.has(item.date)) {
        groups.set(item.date, []);
      }

      groups.get(item.date).push(item);
    });

    groups.forEach((groupItems, date) => {

      const section =
        document.createElement("section");

      section.className = "thanks-date-group";

      section.innerHTML = `
        <h2 class="thanks-date-heading">
          ${escapeHtml(formatDate(date))}
        </h2>
      `;

      groupItems.forEach(item => {

        const row =
          document.createElement("div");

        row.className = "thanks-item";

        row.innerHTML = `
          <time class="thanks-time">
            ${escapeHtml(getTime(item.createdAt))}</time>
          <p class="thanks-text">${escapeHtml(item.text)}</p>
        `;

        section.appendChild(row);
      });

      thanksList.appendChild(section);
    });
  }


  // ========================================
  // 保存
  // ========================================

  thanksForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const text = thanksInput.value.trim();

      if (!text) {
        return;
      }

      thanksSubmit.disabled = true;
      thanksSubmit.textContent =
        "💗 感謝しています…";

      try {
        const response = await fetch(
          THANKS_API_URL,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
              type: "savethanks",
              text
            })
          }
        );

        const data = await response.json();

        if (!data.ok) {
          throw new Error(
            data.message ||
            "感謝を保存できませんでした。"
          );
        }

        // 入力欄を空に
        thanksInput.value = "";

        // スプシを正本として再取得
        const items = await loadThanks();

        renderThanks(items);

        // 続けて書きたければすぐ書ける
        thanksInput.focus();

      } catch (error) {
        console.error(
          "感謝の保存に失敗しました。",
          error
        );

        alert(
          "感謝を保存できませんでした。"
        );

      } finally {
        thanksSubmit.disabled = false;
        thanksSubmit.textContent =
          "💗 感謝する";
      }
    }
  );


  // ========================================
  // 初回読み込み
  // ========================================

  loadThanks()
    .then(items => {
      renderThanks(items);
    })
    .catch(error => {

      console.error(
        "感謝ノートの読み込みに失敗しました。",
        error
      );

      thanksList.innerHTML = `
        <div class="thanks-empty">
          <div>💗</div>
          <p>感謝ノートを開けませんでした。</p>
          <p>少し時間をおいて、もう一度開いてみてください。</p>
        </div>
      `;
    });

});