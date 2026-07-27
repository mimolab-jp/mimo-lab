(() => {
  "use strict";

  const bootScreen = document.getElementById("worldBoot");
  const restartButton = document.getElementById("restartMimoOs");
  const toast = document.getElementById("worldToast");

  if (!bootScreen || !restartButton || !toast) return;

  const BOOT_DURATION = 1900;
  const TOAST_DURATION = 2600;

  let bootTimer;
  let toastTimer;

  function showToast() {
    window.clearTimeout(toastTimer);
    toast.classList.add("is-visible");

    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, TOAST_DURATION);
  }

  function runBootSequence({ showCompleteMessage = true } = {}) {
    window.clearTimeout(bootTimer);
    bootScreen.setAttribute("aria-hidden", "false");
    bootScreen.classList.remove("is-visible");

    // 同じページ内で再実行した時もCSSアニメーションを先頭から動かす
    void bootScreen.offsetWidth;
    bootScreen.classList.add("is-visible");

    bootTimer = window.setTimeout(() => {
      bootScreen.classList.remove("is-visible");
      bootScreen.setAttribute("aria-hidden", "true");

      if (showCompleteMessage) {
        showToast();
      }
    }, BOOT_DURATION);
  }

  restartButton.addEventListener("click", () => {
    restartButton.disabled = true;
    runBootSequence();

    window.setTimeout(() => {
      restartButton.disabled = false;
    }, BOOT_DURATION);
  });

  /*
   * ページを開いた時の起動画面。
   * 同じタブでは最初の1回だけ表示します。
   * 毎回表示したい場合は、下の if 文を削除して
   * runBootSequence({ showCompleteMessage: false }); だけ残してください。
   */
  if (!sessionStorage.getItem("mimoWorldSettingsBooted")) {
    sessionStorage.setItem("mimoWorldSettingsBooted", "true");
    runBootSequence({ showCompleteMessage: false });
  }
})();
