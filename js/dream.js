document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // 夢の部屋 API
    // ========================================

    const DREAM_API_URL =
        "https://script.google.com/macros/s/AKfycbyadofcyXYDLF0SxQpUdpWxU8pwEi7BljcLe3V_dUuAqAPslxFYW6GThj1DMeO5Pt47/exec?type=dreams";


    // ========================================
    // DOM
    // ========================================

    const dreamList = document.getElementById("dreamList");
    const dreamEmpty = document.getElementById("dreamEmpty");

    const growingCount = document.getElementById("growingCount");
    const realizedCount = document.getElementById("realizedCount");

    const dreamTabs = document.querySelectorAll(".dream-tab");

    const openDreamFormButton =
        document.getElementById("openDreamForm");

    const dreamFormPanel =
        document.getElementById("dreamFormPanel");

    const closeDreamFormButton =
        document.getElementById("closeDreamForm");

    const cancelDreamFormButton =
        document.getElementById("cancelDreamForm");

    const dreamForm =
        document.getElementById("dreamForm");

    const dreamFormTitle =
        document.getElementById("dreamFormTitle");

    const editingDreamId =
        document.getElementById("editingDreamId");

    const dreamTitle =
        document.getElementById("dreamTitle");

    const dreamWhy =
        document.getElementById("dreamWhy");

    const dreamPlace =
        document.getElementById("dreamPlace");

    const dreamFeeling =
        document.getElementById("dreamFeeling");

    const dreamSenses =
        document.getElementById("dreamSenses");

    const dreamDoing =
        document.getElementById("dreamDoing");

    const dreamMemo =
        document.getElementById("dreamMemo");


    const realizedFormPanel =
        document.getElementById("realizedFormPanel");

    const closeRealizedFormButton =
        document.getElementById("closeRealizedForm");

    const cancelRealizedFormButton =
        document.getElementById("cancelRealizedForm");

    const realizedForm =
        document.getElementById("realizedForm");

    const realizedDreamId =
        document.getElementById("realizedDreamId");

    const realizedDreamTitle =
        document.getElementById("realizedDreamTitle");

    const realizedDreamPreview =
        document.getElementById("realizedDreamPreview");

    const realizedDate =
        document.getElementById("realizedDate");

    const realizedReality =
        document.getElementById("realizedReality");

    const realizedFeeling =
        document.getElementById("realizedFeeling");

    const messageToPast =
        document.getElementById("messageToPast");


    // ========================================
    // 状態
    // ========================================

    let dreams = [];
    let activeStatus = "growing";


    // ========================================
    // GASから読み込む
    // ========================================

    async function loadDreams() {
        const response = await fetch(DREAM_API_URL, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTPエラー：${response.status}`);
        }

        const data = await response.json();

        if (!data.ok || !Array.isArray(data.dreams)) {
            throw new Error("夢のデータ形式が正しくありません。");
        }

        return data.dreams;
    }


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
    // 状態判定
    // ========================================

    function isRealized(dream) {
        return dream.status === "叶った";
    }


    // ========================================
    // 件数表示
    // ========================================

    function updateCounts() {
        const growingDreams =
            dreams.filter(dream => !isRealized(dream));

        const realizedDreams =
            dreams.filter(dream => isRealized(dream));

        growingCount.textContent = growingDreams.length;
        realizedCount.textContent = realizedDreams.length;
    }


    // ========================================
    // カード本文
    // ========================================

    function createSection(title, text) {
        if (!text) {
            return "";
        }

        return `
      <section class="dream-card-section">
        <h3>${title}</h3>
        <p>${escapeHtml(text)}</p>
      </section>
    `;
    }


    // ========================================
    // 夢カード
    // ========================================

    function createDreamCard(dream) {
        const realized = isRealized(dream);

        const article = document.createElement("article");

        article.className =
            realized
                ? "dream-card is-realized"
                : "dream-card";

        // 閉じたカードに少しだけ見せる文章
        const previewText =
            dream.why ||
            dream.feeling ||
            dream.place ||
            "";

        article.innerHTML = `
    <div class="dream-card-header">

      <p class="dream-card-status">
        ${realized
                ? "✨ DREAM CAME TRUE"
                : "🌱 GROWING DREAM"}
      </p>

      <h2>${escapeHtml(dream.title)}</h2>

      ${dream.createdAt
                ? `
            <p class="dream-card-date">
              この未来を描いた日：
              ${escapeHtml(dream.createdAt)}
            </p>
          `
                : ""
            }

      ${previewText
                ? `
            <p class="dream-card-preview">
              ${escapeHtml(previewText)}
            </p>
          `
                : ""
            }

      <button
        type="button"
        class="dream-open-button"
        data-action="toggle"
        aria-expanded="false"
      >
        ${realized
                ? "✨ 叶った記憶をひらく"
                : "🌙 夢をひらく"}
      </button>

    </div>


    <div class="dream-card-details" hidden>

      <div class="dream-card-body">

        ${createSection(
                    "💗 なぜ、これを望んでる？",
                    dream.why
                )}

        ${createSection(
                    "🏡 どんな場所にいる？",
                    dream.place
                )}

        ${createSection(
                    "😊 どんな気持ち？",
                    dream.feeling
                )}

        ${createSection(
                    "🌿 何が見える？ どんな音や香り？",
                    dream.senses
                )}

        ${createSection(
                    "✨ 叶った私は何をしてる？",
                    dream.doing
                )}

        ${createSection(
                    "📝 残しておきたいこと",
                    dream.memo
                )}

        ${realized
                ? createRealizedSection(dream)
                : ""
            }

        <div class="dream-card-actions">

          <button
            type="button"
            class="dream-edit-button"
            data-action="edit"
            data-id="${escapeHtml(dream.id)}"
          >
            編集
          </button>

          ${!realized
                ? `
                <button
                  type="button"
                  class="dream-realized-button"
                  data-action="realize"
                  data-id="${escapeHtml(dream.id)}"
                >
                  ✨ この夢、叶った！
                </button>
              `
                : ""
            }

        </div>

      </div>

    </div>
  `;

        return article;
    }


    // ========================================
    // 叶った後の第二章
    // ========================================

    function createRealizedSection(dream) {
        return `
      <section class="dream-realized-section">

        ${dream.realizedAt
                ? `
              <p class="dream-realized-date">
                ✨ ${escapeHtml(dream.realizedAt)}　叶いました
              </p>
            `
                : ""
            }

        ${createSection(
                "実際はどうだった？",
                dream.reality
            )}

        ${createSection(
                "今、何が嬉しい？",
                dream.currentFeeling
            )}

        ${createSection(
                "あの頃の私へ",
                dream.messageToPast
            )}

      </section>
    `;
    }


    // ========================================
    // 一覧描画
    // ========================================

    function renderDreams() {
        dreamList.innerHTML = "";

        const filteredDreams =
            dreams.filter(dream => {
                if (activeStatus === "realized") {
                    return isRealized(dream);
                }

                return !isRealized(dream);
            });

        updateCounts();

        dreamEmpty.hidden =
            filteredDreams.length !== 0;

        filteredDreams.forEach(dream => {
            dreamList.appendChild(
                createDreamCard(dream)
            );
        });
    }


    // ========================================
    // フォーム
    // ========================================

    function openDreamForm() {
        dreamForm.reset();

        editingDreamId.value = "";

        dreamFormTitle.textContent =
            "新しい夢を描く";

        dreamFormPanel.hidden = false;

        document.body.style.overflow = "hidden";

        setTimeout(() => {
            dreamTitle.focus();
        }, 50);
    }


    function closeDreamForm() {
        dreamFormPanel.hidden = true;

        document.body.style.overflow = "";
    }


    // ========================================
    // タブ
    // ========================================

    dreamTabs.forEach(tab => {
        tab.addEventListener("click", () => {

            activeStatus = tab.dataset.status;

            dreamTabs.forEach(item => {
                item.classList.remove("is-active");
            });

            tab.classList.add("is-active");

            renderDreams();
        });
    });


    // ========================================
    // フォーム開閉イベント
    // ========================================

    openDreamFormButton.addEventListener(
        "click",
        openDreamForm
    );

    closeDreamFormButton.addEventListener(
        "click",
        closeDreamForm
    );

    cancelDreamFormButton.addEventListener(
        "click",
        closeDreamForm
    );


    // 背景を押しても閉じる
    dreamFormPanel.addEventListener(
        "click",
        event => {
            if (event.target === dreamFormPanel) {
                closeDreamForm();
            }
        }
    );

    // 
    closeRealizedFormButton.addEventListener(
        "click",
        closeRealizedForm
    );

    cancelRealizedFormButton.addEventListener(
        "click",
        closeRealizedForm
    );

    realizedFormPanel.addEventListener(
        "click",
        event => {
            if (event.target === realizedFormPanel) {
                closeRealizedForm();
            }
        }
    );



    // ID生成関数
    function createDreamId() {
        return `dream-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;
    }

    // 第2章フォームを開閉する関数
    function createPreviewItem(label, text) {
        if (!text) {
            return "";
        }

        return `
    <div class="realized-preview-item">
      <p class="realized-preview-label">
        ${label}
      </p>
      <p class="realized-preview-text">
        ${escapeHtml(text)}
      </p>
    </div>
  `;
    }

    function openRealizedForm(dream) {
        realizedForm.reset();

        realizedDreamId.value = dream.id;
        realizedDreamTitle.textContent = dream.title;

        realizedDreamPreview.innerHTML = `
    ${createPreviewItem(
            "💗 なぜ望んでいた？",
            dream.why
        )}

    ${createPreviewItem(
            "🏡 どんな場所？",
            dream.place
        )}

    ${createPreviewItem(
            "😊 どんな気持ち？",
            dream.feeling
        )}

    ${createPreviewItem(
            "🌿 想像していた空気や感覚",
            dream.senses
        )}

    ${createPreviewItem(
            "✨ 叶った私は何をしてる？",
            dream.doing
        )}
  `;

        // 今日の日付を初期値にする
        const today = new Date();
        const localDate =
            `${today.getFullYear()}-` +
            `${String(today.getMonth() + 1).padStart(2, "0")}-` +
            `${String(today.getDate()).padStart(2, "0")}`;

        realizedDate.value = localDate;

        realizedFormPanel.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeRealizedForm() {
        realizedFormPanel.hidden = true;
        document.body.style.overflow = "";
    }
    realizedForm.addEventListener("submit", async event => {
        event.preventDefault();

        const dreamId = realizedDreamId.value;

        if (!dreamId) {
            return;
        }

        if (!realizedDate.value) {
            alert("叶った日を入れてください。");
            return;
        }

        const submitButton =
            realizedForm.querySelector('[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent =
            "✨ 叶った記憶を残しています…";

        try {
            const response = await fetch(DREAM_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    type: "realizedream",
                    id: dreamId,
                    realizedAt: realizedDate.value,
                    reality: realizedReality.value.trim(),
                    currentFeeling: realizedFeeling.value.trim(),
                    messageToPast: messageToPast.value.trim()
                })
            });

            const data = await response.json();

            if (!data.ok) {
                throw new Error(
                    data.message || "叶った記憶を保存できませんでした。"
                );
            }

            dreams = await loadDreams();

            activeStatus = "realized";

            dreamTabs.forEach(tab => {
                tab.classList.toggle(
                    "is-active",
                    tab.dataset.status === "realized"
                );
            });

            renderDreams();
            closeRealizedForm();

        } catch (error) {
            console.error(
                "叶った記憶の保存に失敗しました。",
                error
            );

            alert(
                "叶った記憶を保存できませんでした。"
            );

        } finally {
            submitButton.disabled = false;
            submitButton.textContent =
                "✨ 叶った記憶を残す";
        }
    });


    // フォーム送信処理
    dreamForm.addEventListener("submit", async event => {
        event.preventDefault();

        const title = dreamTitle.value.trim();

        if (!title) {
            alert("夢のタイトルを入れてください。");
            return;
        }

        const dreamData = {
            id: editingDreamId.value || createDreamId(),
            title,
            why: dreamWhy.value.trim(),
            place: dreamPlace.value.trim(),
            feeling: dreamFeeling.value.trim(),
            senses: dreamSenses.value.trim(),
            doing: dreamDoing.value.trim(),
            memo: dreamMemo.value.trim()
        };

        const submitButton =
            dreamForm.querySelector('[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent = "🌙 未来を置いています…";

        try {
            const response = await fetch(DREAM_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    type: "savedream",
                    dream: dreamData
                })
            });

            const data = await response.json();

            if (!data.ok) {
                throw new Error(
                    data.message || "夢を保存できませんでした。"
                );
            }

            // スプシを正本として、保存後にもう一度読み直す
            dreams = await loadDreams();

            renderDreams();
            closeDreamForm();

        } catch (error) {
            console.error(
                "夢の保存に失敗しました。",
                error
            );

            alert(
                "夢を保存できませんでした。もう一度試してみてください。"
            );

        } finally {
            submitButton.disabled = false;
            submitButton.textContent =
                "🌙 この未来を置いておく";
        }
    });




    // ========================================
    // カードのボタン
    // ※保存処理は次工程
    // ========================================

    dreamList.addEventListener("click", event => {

        const button =
            event.target.closest("[data-action]");

        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const dreamId = button.dataset.id;
          if (action === "toggle") {
    const card = button.closest(".dream-card");
    const details =
      card.querySelector(".dream-card-details");

    const isOpen = !details.hidden;

    details.hidden = isOpen;

    button.setAttribute(
      "aria-expanded",
      String(!isOpen)
    );

    const realized =
      card.classList.contains("is-realized");

    button.textContent = isOpen
      ? realized
        ? "✨ 叶った記憶をひらく"
        : "🌙 夢をひらく"
      : "閉じる";

    return;
  }

        if (action === "edit") {
            const dream = dreams.find(
                item => item.id === dreamId
            );

            if (!dream) {
                return;
            }

            editingDreamId.value = dream.id;

            dreamTitle.value = dream.title || "";
            dreamWhy.value = dream.why || "";
            dreamPlace.value = dream.place || "";
            dreamFeeling.value = dream.feeling || "";
            dreamSenses.value = dream.senses || "";
            dreamDoing.value = dream.doing || "";
            dreamMemo.value = dream.memo || "";

            dreamFormTitle.textContent =
                "夢を書きなおす";

            dreamFormPanel.hidden = false;
            document.body.style.overflow = "hidden";

            setTimeout(() => {
                dreamTitle.focus();
            }, 50);
        }

        if (action === "realize") {
            const dream = dreams.find(
                item => item.id === dreamId
            );

            if (!dream) {
                return;
            }

            openRealizedForm(dream);
        }
    });


    // ========================================
    // 初回起動
    // ========================================

    loadDreams()
        .then(loadedDreams => {
            dreams = loadedDreams;
            renderDreams();
        })
        .catch(error => {
            console.error(
                "夢の読み込みに失敗しました。",
                error
            );

            dreamList.innerHTML = `
        <div class="dream-empty">
          <div class="dream-empty-icon">🌙</div>
          <p class="dream-empty-title">
            夢の部屋を開けませんでした。
          </p>
          <p>
            少し時間をおいて、もう一度開いてみてください。
          </p>
        </div>
      `;
        });

});