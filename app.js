let ramens = JSON.parse(localStorage.getItem("mimoRamens")) || [
  {
    name: "長尾中華そば",
    area: "青森県青森市",
    niboshi: "★★★★★",
    comment: "濃厚なのに最後まで飲める一杯。",
    revisit: "😍 また絶対行く",
    image: ""
  },
  {
    name: "ひらこ屋",
    area: "青森県青森市",
    niboshi: "★★★★☆",
    comment: "優しい煮干し。",
    revisit: "😊 また行きたい",
    image: "images/hirakokaranibo.png"
  }
];

const ramenList = document.getElementById("ramenList");

function saveRamens() {
  localStorage.setItem("mimoRamens", JSON.stringify(ramens));
}

function renderRamenList() {
  if (!ramenList) {
  return;
}
  ramenList.innerHTML = "";
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const filteredRamens = ramens.filter(ramen => {
    const searchText = `
      ${ramen.name}
      ${ramen.area}
      ${ramen.niboshi}
      ${ramen.comment}
      ${ramen.revisit}
    `.toLowerCase();
    return searchText.includes(keyword);
  });
  const sortType = document.getElementById("sortSelect").value;
  if (sortType === "name") {
    filteredRamens.sort((a, b) =>
      a.name.localeCompare(b.name, "ja")
    );
  }
  if (sortType === "niboshi") {
    filteredRamens.sort((a, b) =>
      b.niboshi.localeCompare(a.niboshi)
    );
  }
  document.getElementById("resultCount").textContent =
    `${filteredRamens.length}件`;
  filteredRamens.forEach(ramen => {
    ramenList.innerHTML += `
      <div class="ramen-card" onclick="showRamen('${ramen.name}')">
        ${ramen.image ? `
          <img
            class="ramen-photo"
            src="${ramen.image}"
            alt="${ramen.name}"
            onclick="event.stopPropagation(); showImage('${ramen.image}')"
          >
        ` : ""}
        <div class="ramen-card-header">
          <span class="ramen-icon">🍜</span>
          <div>
            <h2>${ramen.name}</h2>
            <p class="ramen-area">${ramen.area}</p>
          </div>
        </div>
        <div class="ramen-info">
          <p>🐟 煮干し：${ramen.niboshi}</p>
          <p>💬 ${ramen.comment}</p>
          <p>🩷 評価：${ramen.revisit}</p>
        </div>
      </div>
    `;
  });
}

renderRamenList();

function showRamen(name) {
  const ramen = ramens.find(item => item.name === name);
  window.selectedRamen = ramen;
  const ramenDetail = document.getElementById("ramenDetail");
  ramenList.classList.add("hidden");
  ramenDetail.classList.remove("hidden");
  ramenDetail.innerHTML = `
    <button class="detail-back-button" onclick="backToList()">← 一覧へ戻る</button>
    <div class="detail-card">
      ${ramen.image ? `
        <img
          class="ramen-photo"
          src="${ramen.image}"
          alt="${ramen.name}"
          onclick="event.stopPropagation(); showImage('${ramen.image}')"
        >
      ` : ""}
      <h2>🍜 ${ramen.name}</h2>
      <p>📍 ${ramen.area}</p>
      <p>🐟 煮干し：${ramen.niboshi}</p>
      <p>💬 ${ramen.comment}</p>
      <p>🩷 評価：${ramen.revisit}</p>
      <div class="detail-actions">
        <button onclick="openMap()">📍 Google Mapで見る</button>
        <button onclick="showEditForm()">✏ 編集</button>
        <button class="delete-button" onclick="deleteRamen()">🗑 削除</button>
      </div>
    </div>
  `;
}

function backToList() {
  const ramenDetail = document.getElementById("ramenDetail");
  ramenDetail.classList.add("hidden");
  ramenList.classList.remove("hidden");
}

function revisitOptions(selectedValue) {
  const options = [
    "🍜 殿堂入り",
    "😍 また絶対行く",
    "😊 また行きたい",
    "😐 普通",
    "🙅 リピなし"
  ];

  return options.map(option => {
    const selected = option === selectedValue ? "selected" : "";
    return `<option ${selected}>${option}</option>`;
  }).join("");
}

function showEditForm() {
  const ramen = window.selectedRamen;
  const ramenDetail = document.getElementById("ramenDetail");

  ramenDetail.innerHTML = `
    <div class="edit-form">
      <h2>✏️ ラーメン編集</h2>

      <label>店名</label>
      <input id="editName" value="${ramen.name}">

      <label>地域</label>
      <input id="editArea" value="${ramen.area}">

      <label>煮干し評価</label>
      <select id="editNiboshi">
        ${niboshiOptions(ramen.niboshi)}
      </select>

      <label>コメント</label>
      <textarea id="editComment">${ramen.comment}</textarea>

      <label>画像パス</label>
      <input id="editImage" value="${ramen.image || ""}" placeholder="images/kiboshi.png">

      <label>評価</label>
      <select id="editRevisit">
        ${revisitOptions(ramen.revisit)}
      </select>

      <div class="detail-actions">
        <button onclick="saveEdit()">💾 保存する</button>
        <button onclick="showRamen('${ramen.name}')">↩ キャンセル</button>
      </div>
    </div>
  `;
}

function saveEdit() {
  window.selectedRamen.name = document.getElementById("editName").value;
  window.selectedRamen.area = document.getElementById("editArea").value;
  window.selectedRamen.niboshi = document.getElementById("editNiboshi").value;
  window.selectedRamen.comment = document.getElementById("editComment").value;
  window.selectedRamen.image = document.getElementById("editImage").value;
  window.selectedRamen.revisit = document.getElementById("editRevisit").value;

  saveRamens();
  renderRamenList();
  showRamen(window.selectedRamen.name);
}

function showAddForm() {
  const ramenDetail = document.getElementById("ramenDetail");

  ramenList.classList.add("hidden");
  ramenDetail.classList.remove("hidden");

  ramenDetail.innerHTML = `
    <div class="edit-form">
      <h2>➕ ラーメン追加</h2>

      <label>店名</label>
      <input id="editName" placeholder="店名を入力">

      <label>地域</label>
      <input id="editArea" placeholder="地域を入力">

      <label>煮干し評価</label>
      <select id="editNiboshi">
        ${niboshiOptions("★★★★★")}
      </select>

      <label>コメント</label>
      <textarea id="editComment" placeholder="感想やメモを入力"></textarea>

      <label>画像パス</label>
       <input id="editImage" placeholder="images/kiboshi.png">

      <label>評価</label>
      <select id="editRevisit">
        ${revisitOptions("😍 また絶対行く")}
      </select>
     
      <div class="detail-actions">
        <button onclick="saveNewRamen()">💾 追加する</button>
        <button onclick="backToList()">↩ キャンセル</button>
      </div>
    </div>
  `;
}

function niboshiOptions(selectedValue) {
  const options = [
    "★★★★★",
    "★★★★☆",
    "★★★☆☆",
    "★★☆☆☆",
    "★☆☆☆☆"
  ];

  return options.map(option => {
    const selected = option === selectedValue ? "selected" : "";
    return `<option ${selected}>${option}</option>`;
  }).join("");
}

function saveNewRamen() {
  ramens.push({
    name: document.getElementById("editName").value,
    area: document.getElementById("editArea").value,
    niboshi: document.getElementById("editNiboshi").value,
    comment: document.getElementById("editComment").value,
    image: document.getElementById("editImage").value,
    revisit: document.getElementById("editRevisit").value
  });

  saveRamens();
  renderRamenList();
  backToList();
}

function deleteRamen() {
  const result = confirm(window.selectedRamen.name + " を削除しますか？");
  if (result === false) {
    return;
  }

  ramens = ramens.filter(item => item.name !== window.selectedRamen.name);
  window.selectedRamen = null;

  saveRamens();
  renderRamenList();
  backToList();
}
function showImage(src) {

  document.getElementById("modalImage").src = src;

  document
    .getElementById("imageModal")
    .classList
    .remove("hidden");

}

function closeImage() {

  document
    .getElementById("imageModal")
    .classList
    .add("hidden");

}
function openMap() {
  const keyword = `${window.selectedRamen.name} ${window.selectedRamen.area}`;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(keyword)}`;
  window.open(url, "_blank");
}

// 山形市の天気
const latitude = 38.255;
const longitude = 140.339;

// API取得
fetch(
`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo`
)
.then(response => response.json())

.then(data => {

    document.getElementById("currentTemp").textContent =
        Math.round(data.current.temperature_2m);

    document.getElementById("feelsLike").textContent =
        Math.round(data.current.apparent_temperature);

    document.getElementById("humidity").textContent =
        data.current.relative_humidity_2m;

    document.getElementById("rainChance").textContent =
        data.daily.precipitation_probability_max[0];

    document.getElementById("maxTemp").textContent =
        Math.round(data.daily.temperature_2m_max[0]);

    document.getElementById("minTemp").textContent =
        Math.round(data.daily.temperature_2m_min[0]);

    const code = data.current.weather_code;
    document.getElementById("weatherIcon").textContent =
        getWeatherIcon(code);

})

.catch(error => {

    console.error("天気取得失敗", error);

});

// FF14チェックリスト
const ff14Tasks = document.querySelectorAll("[data-task]");

function updateFF14Progress() {
  const dailyTasks = document.querySelectorAll("[data-task^='daily-']");
  const weeklyTasks = document.querySelectorAll("[data-task^='weekly-']");

  const dailyDone = Array.from(dailyTasks).filter((task) => task.checked).length;
  const weeklyDone = Array.from(weeklyTasks).filter((task) => task.checked).length;

  const dailyProgressText = document.getElementById("dailyProgressText");
  const weeklyProgressText = document.getElementById("weeklyProgressText");
  const dailyProgressFill = document.getElementById("dailyProgressFill");
  const weeklyProgressFill = document.getElementById("weeklyProgressFill");

  if (dailyProgressText) {
    dailyProgressText.textContent = `${dailyDone} / ${dailyTasks.length} 完了`;
  }

  if (weeklyProgressText) {
    weeklyProgressText.textContent = `${weeklyDone} / ${weeklyTasks.length} 完了`;
  }

  if (dailyProgressFill) {
    dailyProgressFill.style.width = `${(dailyDone / dailyTasks.length) * 100}%`;
  }

  if (weeklyProgressFill) {
    weeklyProgressFill.style.width = `${(weeklyDone / weeklyTasks.length) * 100}%`;
  }
}

if (ff14Tasks.length > 0) {
  ff14Tasks.forEach((task) => {
    const savedValue = localStorage.getItem(task.dataset.task);

    if (savedValue === "true") {
      task.checked = true;
    }

    task.addEventListener("change", () => {
      localStorage.setItem(task.dataset.task, task.checked);
      updateFF14Progress();
    });
  });

  const resetDailyButton = document.getElementById("resetDaily");
  const resetWeeklyButton = document.getElementById("resetWeekly");

  if (resetDailyButton) {
    resetDailyButton.addEventListener("click", () => {
      ff14Tasks.forEach((task) => {
        if (task.dataset.task.startsWith("daily-")) {
          task.checked = false;
          localStorage.setItem(task.dataset.task, false);
        }
      });

      updateFF14Progress();
    });
  }

  if (resetWeeklyButton) {
    resetWeeklyButton.addEventListener("click", () => {
      ff14Tasks.forEach((task) => {
        if (task.dataset.task.startsWith("weekly-")) {
          task.checked = false;
          localStorage.setItem(task.dataset.task, false);
        }
      });

      updateFF14Progress();
    });
  }

  updateFF14Progress();
}

// FF14メモ 
const ff14Memo = document.getElementById("ff14Memo");
if (ff14Memo) {
  ff14Memo.value = localStorage.getItem("ff14Memo") || "";
  ff14Memo.addEventListener("input", () => {
    localStorage.setItem("ff14Memo", ff14Memo.value);
  });
}

// FF14 今日の目標
const ff14Goal = document.getElementById("ff14Goal");

if (ff14Goal) {
  ff14Goal.value = localStorage.getItem("ff14Goal") || "";

  ff14Goal.addEventListener("input", () => {
    localStorage.setItem("ff14Goal", ff14Goal.value);
  });
}

// ===== エオルゼア時間 =====

const eorzeaTime = document.getElementById("eorzeaTime");

if (eorzeaTime) {

  function updateEorzeaTime() {

    const earthTime = Date.now();

    // 地球時間 → エオルゼア時間
    const eorzeaTimeMs = earthTime * (1440 / 70);

    const date = new Date(eorzeaTimeMs);

    const hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");

    let icon = "🌙";

if (hours >= 5 && hours < 8) {
    icon = "🌅";
} else if (hours >= 8 && hours < 17) {
    icon = "🌞";
} else if (hours >= 17 && hours < 19) {
    icon = "🌆";
}

eorzeaTime.textContent = `${icon} ET ${hours}:${minutes}`;

  }

  updateEorzeaTime();

  setInterval(updateEorzeaTime, 30000);

}

// ===== FF14 タイマー =====

const timerButtons = document.querySelectorAll("[data-minutes]");
const timerDisplay = document.getElementById("timerDisplay");
const stopTimerButton = document.getElementById("stopTimer");
const targetTimeInput = document.getElementById("targetTime");
const startTimeTimerButton = document.getElementById("startTimeTimer");

let timerInterval = null;
let timerEndTime = null;

function playTimerSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 880;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.8);
}

function startTimer(milliseconds) {
  clearInterval(timerInterval);

  timerEndTime = Date.now() + milliseconds;

  updateTimerDisplay();

  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
  if (!timerDisplay || !timerEndTime) {
    return;
  }

  const remaining = timerEndTime - Date.now();

  if (remaining <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerEndTime = null;

    timerDisplay.textContent = "🔔 タイマー終了！";
    playTimerSound();
    return;
  }

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  timerDisplay.textContent = `あと ${minutes}:${String(seconds).padStart(2, "0")}`;
}

if (timerButtons.length > 0) {
  timerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const minutes = Number(button.dataset.minutes);
      startTimer(minutes * 60 * 1000);
    });
  });
}

if (startTimeTimerButton) {
  startTimeTimerButton.addEventListener("click", () => {
    if (!targetTimeInput.value) {
      timerDisplay.textContent = "時刻を選んでね";
      return;
    }

    const now = new Date();
    const [hours, minutes] = targetTimeInput.value.split(":").map(Number);

    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    startTimer(target.getTime() - now.getTime());
  });
}

if (stopTimerButton) {
  stopTimerButton.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerEndTime = null;

    if (timerDisplay) {
      timerDisplay.textContent = "タイマー停止中";
    }
  });
}

// ===== タイマー折りたたみ =====

const timerToggle = document.getElementById("timerToggle");
const timerContent = document.getElementById("timerContent");
const timerToggleIcon = document.getElementById("timerToggleIcon");

if (timerToggle && timerContent && timerToggleIcon) {
  timerToggle.addEventListener("click", () => {
    timerContent.classList.toggle("open");

    if (timerContent.classList.contains("open")) {
      timerToggleIcon.textContent = "▲";
    } else {
      timerToggleIcon.textContent = "▼";
    }
  });
}
// ===== タイマーへジャンプしたら自動で開く =====

const timerJump = document.querySelector(".timer-jump");

if (timerJump && timerContent && timerToggleIcon) {
  timerJump.addEventListener("click", () => {
    timerContent.classList.add("open");
    timerToggleIcon.textContent = "▲";
  });
}

function getWeatherIcon(code) {

    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    if (code <= 99) return "⛈️";

    return "🌤️";
}
/* ========================================
   書斎
======================================== */

document.addEventListener("DOMContentLoaded", () => {
  const bookForm = document.getElementById("bookForm");

  // 書斎ページ以外では何もしない
  if (!bookForm) {
    return;
  }

  const STORAGE_KEY = "mimoLabLibraryBooks";

  const openBookFormButton = document.getElementById("openBookForm");
  const closeBookFormButton = document.getElementById("closeBookForm");
  const cancelBookFormButton = document.getElementById("cancelBookForm");
  const bookFormTitle = document.getElementById("bookFormTitle");
  const editingBookId = document.getElementById("editingBookId");

  const bookTitle = document.getElementById("bookTitle");
  const bookRole = document.getElementById("bookRole");
  const bookBenefits = document.getElementById("bookBenefits");
  const bookOccasion = document.getElementById("bookOccasion");
  const bookKeywords = document.getElementById("bookKeywords");
  const bookLocation = document.getElementById("bookLocation");

  const bookSearch = document.getElementById("bookSearch");
  const filterButtons = document.querySelectorAll(".filter-button");
  const bookList = document.getElementById("bookList");
  const bookCount = document.getElementById("bookCount");
  const emptyLibrary = document.getElementById("emptyLibrary");
  const noSearchResults = document.getElementById("noSearchResults");

  let books = loadBooks();
  let activeFilter = "all";

  function loadBooks() {
    try {
      const savedBooks = localStorage.getItem(STORAGE_KEY);
      return savedBooks ? JSON.parse(savedBooks) : [];
    } catch (error) {
      console.error("書斎データの読み込みに失敗しました。", error);
      return [];
    }
  }

  function saveBooks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (error) {
      console.error("書斎データの保存に失敗しました。", error);
      alert("本を保存できませんでした。ブラウザの保存容量を確認してください。");
    }
  }

  function createBookId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeKeywords(value) {
    return value
      .split(/[,、\n]/)
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  function normalizeBenefits(value) {
    return value
      .split("\n")
      .map((benefit) => benefit.trim())
      .filter(Boolean);
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getSelectedBookType() {
    const selectedType = document.querySelector(
      'input[name="bookType"]:checked'
    );

    return selectedType ? selectedType.value : "physical";
  }

  function resetBookForm() {
    bookForm.reset();
    editingBookId.value = "";
    bookFormTitle.textContent = "新しい本を登録";

    const physicalBookRadio = document.querySelector(
      'input[name="bookType"][value="physical"]'
    );

    if (physicalBookRadio) {
      physicalBookRadio.checked = true;
    }
  }

  function openBookForm(book = null) {
    bookForm.hidden = false;
    openBookFormButton.hidden = true;

    if (book) {
      editingBookId.value = book.id;
      bookFormTitle.textContent = "本の情報を編集";
      bookTitle.value = book.title;
      bookRole.value = book.role;
      bookBenefits.value = book.benefits.join("\n");
      bookOccasion.value = book.occasion;
      bookKeywords.value = book.keywords.join(", ");
      bookLocation.value = book.location;

      const selectedType = document.querySelector(
        `input[name="bookType"][value="${book.type}"]`
      );

      if (selectedType) {
        selectedType.checked = true;
      }
    } else {
      resetBookForm();
    }

    window.setTimeout(() => {
      bookTitle.focus();
      bookForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 50);
  }

  function closeBookForm() {
    bookForm.hidden = true;
    openBookFormButton.hidden = false;
    resetBookForm();
  }

  function getSearchableText(book) {
    return [
      book.title,
      book.role,
      book.benefits.join(" "),
      book.occasion,
      book.keywords.join(" "),
      book.location,
      book.type === "physical" ? "物理本 紙の本" : "電子書籍 Kindle"
    ]
      .join(" ")
      .toLowerCase();
  }

  function getFilteredBooks() {
    const searchTerm = bookSearch.value.trim().toLowerCase();

    return books.filter((book) => {
      const matchesType =
        activeFilter === "all" || book.type === activeFilter;

      const matchesSearch =
        !searchTerm || getSearchableText(book).includes(searchTerm);

      return matchesType && matchesSearch;
    });
  }

  function createBookCard(book) {
    const benefitsHtml = book.benefits.length
      ? `
        <section class="book-card-section">
          <h4>✨ この本で得られること</h4>
          <ul class="book-benefit-list">
            ${book.benefits
              .map((benefit) => `<li>${escapeHtml(benefit)}</li>`)
              .join("")}
          </ul>
        </section>
      `
      : "";

    const occasionHtml = book.occasion
      ? `
        <section class="book-card-section">
          <h4>📖 こんな時に読む</h4>
          <p class="book-card-text">${escapeHtml(book.occasion)}</p>
        </section>
      `
      : "";

    const keywordsHtml = book.keywords.length
      ? `
        <section class="book-card-section">
          <h4>🏷 キーワード</h4>
          <div class="keyword-list">
            ${book.keywords
              .map(
                (keyword) =>
                  `<span class="keyword-tag">${escapeHtml(keyword)}</span>`
              )
              .join("")}
          </div>
        </section>
      `
      : "";

    const locationHtml = book.location
      ? `
        <div class="book-location">
          <span>📍</span>
          <span>${escapeHtml(book.location)}</span>
        </div>
      `
      : "";

    const bookTypeLabel =
      book.type === "ebook" ? "📱 電子書籍" : "📕 物理本";

    return `
      <article class="book-card" data-book-id="${escapeHtml(book.id)}">
        <div class="book-card-top">
          <div>
            <p class="book-card-type">${bookTypeLabel}</p>
            <h3>${escapeHtml(book.title)}</h3>
          </div>

          <div class="book-card-menu">
            <button
              type="button"
              class="book-card-action"
              data-action="edit"
              aria-label="${escapeHtml(book.title)}を編集"
            >
              編集
            </button>

            <button
              type="button"
              class="book-card-action"
              data-action="delete"
              aria-label="${escapeHtml(book.title)}を削除"
            >
              削除
            </button>
          </div>
        </div>

        <p class="book-card-role">
          「${escapeHtml(book.role)}」
        </p>

        ${benefitsHtml}
        ${occasionHtml}
        ${keywordsHtml}
        ${locationHtml}
      </article>
    `;
  }

  function renderBooks() {
    const filteredBooks = getFilteredBooks();
    const hasBooks = books.length > 0;
    const hasResults = filteredBooks.length > 0;
    const isSearching =
      bookSearch.value.trim() !== "" || activeFilter !== "all";

    bookCount.textContent = `${books.length}冊`;
    emptyLibrary.hidden = hasBooks;
    noSearchResults.hidden = !hasBooks || hasResults || !isSearching;

    bookList.innerHTML = filteredBooks
      .map((book) => createBookCard(book))
      .join("");
  }

  function editBook(bookId) {
    const book = books.find((item) => item.id === bookId);

    if (!book) {
      return;
    }

    openBookForm(book);
  }

  function deleteBook(bookId) {
    const book = books.find((item) => item.id === bookId);

    if (!book) {
      return;
    }

    const shouldDelete = window.confirm(
      `「${book.title}」を本棚から取り出しますか？`
    );

    if (!shouldDelete) {
      return;
    }

    books = books.filter((item) => item.id !== bookId);
    saveBooks();
    renderBooks();
  }

  openBookFormButton.addEventListener("click", () => {
    openBookForm();
  });

  closeBookFormButton.addEventListener("click", closeBookForm);
  cancelBookFormButton.addEventListener("click", closeBookForm);

  bookForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = bookTitle.value.trim();
    const role = bookRole.value.trim();

    if (!title || !role) {
      alert("本のタイトルと『この本は何屋さん？』を入力してください。");
      return;
    }

    const bookData = {
      id: editingBookId.value || createBookId(),
      title,
      role,
      benefits: normalizeBenefits(bookBenefits.value),
      occasion: bookOccasion.value.trim(),
      keywords: normalizeKeywords(bookKeywords.value),
      type: getSelectedBookType(),
      location: bookLocation.value.trim(),
      updatedAt: new Date().toISOString()
    };

    const existingBookIndex = books.findIndex(
      (book) => book.id === bookData.id
    );

    if (existingBookIndex >= 0) {
      books[existingBookIndex] = bookData;
    } else {
      books.unshift(bookData);
    }

    saveBooks();
    renderBooks();
    closeBookForm();
  });

  bookSearch.addEventListener("input", renderBooks);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;

      filterButtons.forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });

      renderBooks();
    });
  });

  bookList.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");

    if (!actionButton) {
      return;
    }

    const bookCard = actionButton.closest("[data-book-id]");

    if (!bookCard) {
      return;
    }

    const bookId = bookCard.dataset.bookId;
    const action = actionButton.dataset.action;

    if (action === "edit") {
      editBook(bookId);
    }

    if (action === "delete") {
      deleteBook(bookId);
    }
  });

  renderBooks();
});