const COZY_PASSWORD = "9569";

const cozyLock = document.getElementById("cozyLock");
const cozyRoom = document.getElementById("cozyRoom");
const cozyPassword = document.getElementById("cozyPassword");
const cozyEnterButton = document.getElementById("cozyEnterButton");
const cozyPasswordError = document.getElementById("cozyPasswordError");
const cozyLockButton = document.getElementById("cozyLockButton");

function openCozyRoom() {
  const enteredPassword = cozyPassword.value.trim();

  if (enteredPassword !== COZY_PASSWORD) {
    cozyPasswordError.textContent = "……合言葉が違うみたい。";
    cozyPassword.select();
    return;
  }

  sessionStorage.setItem("cozyUnlocked", "true");

  cozyLock.hidden = true;
  cozyRoom.hidden = false;
  cozyPasswordError.textContent = "";
  cozyPassword.value = "";
}

function closeCozyRoom() {
  sessionStorage.removeItem("cozyUnlocked");

  cozyRoom.hidden = true;
  cozyLock.hidden = false;
  cozyPassword.value = "";
  cozyPasswordError.textContent = "";
  cozyPassword.focus();
}

if (sessionStorage.getItem("cozyUnlocked") === "true") {
  cozyLock.hidden = true;
  cozyRoom.hidden = false;
}

cozyEnterButton.addEventListener("click", openCozyRoom);
cozyLockButton.addEventListener("click", closeCozyRoom);

cozyPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    openCozyRoom();
  }
});