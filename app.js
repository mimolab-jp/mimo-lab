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
fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo`)

.then(response => response.json())

.then(data => {

    document.getElementById("currentTemp").textContent =
        Math.round(data.current.temperature_2m);

    document.getElementById("maxTemp").textContent =
        Math.round(data.daily.temperature_2m_max[0]);

    document.getElementById("minTemp").textContent =
        Math.round(data.daily.temperature_2m_min[0]);

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