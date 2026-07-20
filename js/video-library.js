(() => {
  "use strict";

  /*
   * GASをウェブアプリとして公開した後、
   * 下のURLだけ自分のものへ置き換えてください。
   */
  const GAS_WEB_APP_URL = "ここにGASのウェブアプリURL";

  const state = {
    videos: [],
    keyword: "all",
    searchText: ""
  };

  const elements = {
    search: document.getElementById("videoSearch"),
    filters: document.getElementById("keywordFilters"),
    count: document.getElementById("videoCount"),
    reload: document.getElementById("reloadVideos"),
    list: document.getElementById("videoList"),
    empty: document.getElementById("videoEmpty"),
    error: document.getElementById("videoError")
  };

  function normalizeText(value) {
    return String(value ?? "").trim();
  }

  function splitKeywords(value) {
    return normalizeText(value)
      .split(/[,、\n]/)
      .map(keyword => keyword.trim())
      .filter(Boolean);
  }

  function escapeHtml(value) {
    return normalizeText(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function isSafeUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  function showLoading() {
    elements.error.hidden = true;
    elements.empty.hidden = true;
    elements.count.textContent = "読み込み中…";
    elements.list.innerHTML = `
      <div class="video-loading-card"></div>
      <div class="video-loading-card"></div>
    `;
  }

  function loadVideos() {
    if (
      !GAS_WEB_APP_URL ||
      GAS_WEB_APP_URL.includes("ここにGAS")
    ) {
      showError();
      return;
    }

    showLoading();

    const callbackName =
      `mimoVideoLibraryCallback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const script = document.createElement("script");
    const separator = GAS_WEB_APP_URL.includes("?") ? "&" : "?";
    const timeoutId = window.setTimeout(() => {
      cleanup();
      showError();
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = payload => {
      cleanup();

      if (!payload || payload.ok !== true || !Array.isArray(payload.videos)) {
        showError();
        return;
      }

      state.videos = payload.videos
        .map(video => ({
          title: normalizeText(video.title),
          url: normalizeText(video.url),
          memo: normalizeText(video.memo),
          keywords: Array.isArray(video.keywords)
            ? video.keywords.map(normalizeText).filter(Boolean)
            : splitKeywords(video.keywords)
        }))
        .filter(video => video.title && isSafeUrl(video.url));

      createKeywordFilters();
      renderVideos();
    };

    script.onerror = () => {
      cleanup();
      showError();
    };

    script.src =
      `${GAS_WEB_APP_URL}${separator}callback=${encodeURIComponent(callbackName)}&t=${Date.now()}`;

    document.body.appendChild(script);
  }

  function createKeywordFilters() {
    const keywords = [
      ...new Set(state.videos.flatMap(video => video.keywords))
    ].sort((a, b) => a.localeCompare(b, "ja"));

    elements.filters.innerHTML = `
      <button
        class="video-filter-button is-active"
        type="button"
        data-keyword="all"
      >すべて</button>
      ${keywords.map(keyword => `
        <button
          class="video-filter-button"
          type="button"
          data-keyword="${escapeHtml(keyword)}"
        >${escapeHtml(keyword)}</button>
      `).join("")}
    `;

    state.keyword = "all";
  }

  function getFilteredVideos() {
    const search = state.searchText.toLocaleLowerCase("ja");

    return state.videos.filter(video => {
      const keywordMatches =
        state.keyword === "all" ||
        video.keywords.includes(state.keyword);

      const haystack = [
        video.title,
        video.memo,
        ...video.keywords
      ].join(" ").toLocaleLowerCase("ja");

      return keywordMatches && (!search || haystack.includes(search));
    });
  }

  function renderVideos() {
    const videos = getFilteredVideos();

    elements.error.hidden = true;
    elements.empty.hidden = videos.length > 0;
    elements.count.textContent = `${videos.length}本`;

    elements.list.innerHTML = videos.map(video => `
      <article class="video-card">
        <h2 class="video-card-title">${escapeHtml(video.title)}</h2>

        ${video.memo ? `
          <p class="video-card-memo-label">この動画を見る理由</p>
          <p class="video-card-memo">${escapeHtml(video.memo)}</p>
        ` : ""}

        ${video.keywords.length ? `
          <div class="video-card-keywords">
            ${video.keywords.map(keyword => `
              <span class="video-keyword">${escapeHtml(keyword)}</span>
            `).join("")}
          </div>
        ` : ""}

        <a
          class="video-watch-link"
          href="${escapeHtml(video.url)}"
          target="_blank"
          rel="noopener noreferrer"
        >動画を見る ↗</a>
      </article>
    `).join("");
  }

  function showError() {
    elements.list.innerHTML = "";
    elements.empty.hidden = true;
    elements.error.hidden = false;
    elements.count.textContent = "読み込み失敗";
  }

  elements.search.addEventListener("input", event => {
    state.searchText = event.target.value.trim();
    renderVideos();
  });

  elements.filters.addEventListener("click", event => {
    const button = event.target.closest("[data-keyword]");
    if (!button) return;

    state.keyword = button.dataset.keyword;

    elements.filters
      .querySelectorAll("[data-keyword]")
      .forEach(item => item.classList.toggle("is-active", item === button));

    renderVideos();
  });

  elements.reload.addEventListener("click", loadVideos);

  loadVideos();
})();
