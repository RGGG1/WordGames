// Constants and State
const BASE_URL = "https://script.google.com/macros/s/AKfycby8O6e4I-wK0eU2wVunl6I2K8lSwJ8kI0S5VTRB1g/exec";
const HINT_SHAPES = ["circle", "cloud", "sun", "fluffy-cloud", "aviator", "diamond"];
const HINT_ANIMATIONS = [
    "pop", "stretch", "zoom", "bounce", "spin",
    "slide-left", "slide-right", "slide-up", "slide-down", "splash"
];
const HINT_COLORS = [
    "hint-color-1", "hint-color-2", "hint-color-3", "hint-color-4", "hint-color-5",
    "hint-color-6", "hint-color-7", "hint-color-8", "hint-color-9", "hint-color-10"
];

let currentGame = null;
let currentGameIndex = 0;
let currentGuesses = [];
let guessCount = 0;
let officialGames = [];
let privateGames = [];
let currentTab = "official";
let gamesData = null;

// DOM Elements
const elements = {
    gameName: document.getElementById("game-name"),
    allGamesLink: document.getElementById("all-games-link"),
    gameScreen: document.getElementById("game-screen"),
    guessArea: document.getElementById("guess-area"),
    guessInput: document.getElementById("guess-input"),
    guessBtn: document.getElementById("guess-btn"),
    hintsContainer: document.getElementById("hints-container"),
    hints: Array.from(document.getElementsByClassName("hint")),
    giveUpLink: document.getElementById("give-up-link"),
    guessesLink: document.getElementById("guesses-link"),
    gameNumberText: document.getElementById("game-number-text"),
    prevGameArrow: document.getElementById("prev-game-arrow"),
    nextGameArrow: document.getElementById("next-game-arrow"),
    gameSelectContent: document.getElementById("game-select-content"),
    officialTab: document.getElementById("official-tab"),
    privateTab: document.getElementById("private-tab"),
    officialGames: document.getElementById("official-games"),
    privateGames: document.getElementById("private-games"),
    officialList: document.getElementById("official-list"),
    privateList: document.getElementById("private-list"),
    createPineapple: document.getElementById("create-pineapple"),
    officialBackBtn: document.getElementById("official-back-btn"),
    privateBackBtn: document.getElementById("private-back-btn"),
    formContent: document.getElementById("form-content"),
    gameNameInput: document.getElementById("game-name-input"),
    secretWord: document.getElementById("secret-word"),
    hintInputs: [
        document.getElementById("hint-1"),
        document.getElementById("hint-2"),
        document.getElementById("hint-3"),
        document.getElementById("hint-4"),
        document.getElementById("hint-5")
    ],
    confirmBtn: document.getElementById("confirm-btn"),
    formBackBtn: document.getElementById("form-back-btn"),
    gameOver: document.getElementById("game-over"),
    shareText: document.getElementById("share-text"),
    gameNumberDisplay: document.getElementById("game-number-display"),
    shareWhatsApp: document.getElementById("share-whatsapp"),
    shareTelegram: document.getElementById("share-telegram"),
    shareTwitter: document.getElementById("share-twitter"),
    shareInstagram: document.getElementById("share-instagram"),
    nextGameBtnEnd: document.getElementById("next-game-btn-end"),
    createPineappleEnd: document.getElementById("create-pineapple-end"),
    guessesScreen: document.getElementById("guesses-screen"),
    guessesList: document.getElementById("guesses-list"),
    guessesCloseBtn: document.getElementById("guesses-close-btn"),
    giveUpDialog: document.getElementById("give-up-dialog"),
    giveUpYesBtn: document.getElementById("give-up-yes-btn"),
    giveUpNoBtn: document.getElementById("give-up-no-btn"),
    formErrorDialog: document.getElementById("form-error-dialog"),
    formErrorMessage: document.querySelector("#form-error-dialog .dialog-message"),
    formErrorOkBtn: document.getElementById("form-error-ok-btn")
};

// Utility Functions
function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => screen.style.display = "none");
    document.getElementById(screenId).style.display = "flex";
}

function showDialog(dialogId) {
    document.getElementById(dialogId).style.display = "flex";
}

function hideDialog(dialogId) {
    document.getElementById(dialogId).style.display = "none";
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function updateGameNumberDisplay() {
    elements.gameNumberText.textContent = `Game #${currentGameIndex + 1}`;
    elements.guessesLink.textContent = `Guesses: ${guessCount}/5`;
}

// Game Logic
function loadGame(index, isPrivate = false) {
    currentGameIndex = index;
    currentGame = (isPrivate ? privateGames : officialGames)[index];
    guessCount = 0;
    currentGuesses = [];
    elements.guessInput.value = "";
    updateGameNumberDisplay();
    elements.hints.forEach(hint => {
        hint.style.display = "none";
        hint.className = "hint";
    });
    elements.hints[0].style.display = "flex";
    elements.hints[0].textContent = currentGame.hints[0];
    elements.hints[0].classList.add(getRandomItem(HINT_SHAPES), getRandomItem(HINT_COLORS), `reveal-${getRandomItem(HINT_ANIMATIONS)}`);
    elements.guessInput.focus();
}

function revealNextHint() {
    if (guessCount < 5) {
        elements.hints[guessCount].style.display = "flex";
        elements.hints[guessCount].textContent = currentGame.hints[guessCount];
        elements.hints[guessCount].classList.add(getRandomItem(HINT_SHAPES), getRandomItem(HINT_COLORS), `reveal-${getRandomItem(HINT_ANIMATIONS)}`);
    }
}

function handleGuess() {
    const guess = elements.guessInput.value.trim().toLowerCase();
    if (!guess) return;
    currentGuesses.push(guess);
    guessCount++;
    updateGameNumberDisplay();
    elements.guessInput.value = "";
    if (guess === currentGame.secretWord.toLowerCase()) {
        showGameOver(true);
    } else {
        elements.guessArea.classList.add("wrong-guess");
        setTimeout(() => elements.guessArea.classList.remove("wrong-guess"), 300);
        if (guessCount < 5) {
            revealNextHint();
        } else {
            showGameOver(false);
        }
    }
    elements.guessInput.focus();
}

function showGameOver(won) {
    showScreen("game-over");
    elements.shareText.textContent = won ? "I guessed the word!" : "I couldn't guess the word.";
    elements.gameNumberDisplay.textContent = `Game #${currentGameIndex + 1}`;
    const shareText = `WORDY Game #${currentGameIndex + 1}\n${won ? "Guessed" : "Failed"} in ${guessCount}/5 guesses\n${currentGuesses.map((g, i) => `${i + 1}. ${g}`).join("\n")}\nPlay at wordy.bigbraingames.net`;
    elements.shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    elements.shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent("wordy.bigbraingames.net")}&text=${encodeURIComponent(shareText)}`;
    elements.shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    elements.shareInstagram.href = "#"; // Instagram sharing requires manual copy-paste
}

function populateGameList(games, container, isPrivate) {
    container.innerHTML = "";
    games.forEach((game, index) => {
        const gameItem = document.createElement("div");
        gameItem.className = "game-item";
        gameItem.innerHTML = `<span>${game.name}</span><span>${isPrivate ? "Private" : `Game #${index + 1}`}</span>`;
        gameItem.addEventListener("click", () => {
            loadGame(index, isPrivate);
            showScreen("game-screen");
        });
        container.appendChild(gameItem);
    });
}

function loadGames() {
    fetch("games.csv")
        .then(response => response.text())
        .then(data => {
            const parsed = Papa.parse(data, { header: true });
            officialGames = parsed.data.map(row => ({
                name: row["Game Name"],
                secretWord: row["Secret Word"],
                hints: [row["Hint 1"], row["Hint 2"], row["Hint 3"], row["Hint 4"], row["Hint 5"]]
            }));
            loadGame(0);
            populateGameList(officialGames, elements.officialList, false);
        });
}

function submitPrivateGame() {
    const gameName = elements.gameNameInput.value.trim();
    const secretWord = elements.secretWord.value.trim();
    const hints = elements.hintInputs.map(input => input.value.trim());
    if (!gameName || !secretWord || hints.some(hint => !hint)) {
        elements.formErrorMessage.textContent = "Please fill in all fields.";
        showDialog("form-error-dialog");
        return;
    }
    const gameData = { gameName, secretWord, hints };
    fetch(BASE_URL, {
        method: "POST",
        body: JSON.stringify(gameData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                privateGames.push({ name: gameName, secretWord, hints });
                populateGameList(privateGames, elements.privateList, true);
                showScreen("game-select-content");
                elements.officialTab.classList.remove("active");
                elements.privateTab.classList.add("active");
                elements.officialGames.classList.remove("active");
                elements.privateGames.classList.add("active");
                currentTab = "private";
            } else {
                elements.formErrorMessage.textContent = "Failed to create game. Try again.";
                showDialog("form-error-dialog");
            }
        });
}

// Event Listeners
elements.gameName.addEventListener("click", () => {
    if (elements.gameScreen.style.display !== "flex") {
        showScreen("game-screen");
        elements.guessInput.focus();
    }
});

elements.allGamesLink.addEventListener("click", () => {
    showScreen("game-select-content");
});

elements.guessBtn.addEventListener("click", handleGuess);

elements.guessInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleGuess();
});

elements.giveUpLink.addEventListener("click", () => {
    showDialog("give-up-dialog");
});

elements.giveUpYesBtn.addEventListener("click", () => {
    showGameOver(false);
    hideDialog("give-up-dialog");
});

elements.giveUpNoBtn.addEventListener("click", () => {
    hideDialog("give-up-dialog");
    elements.guessInput.focus();
});

elements.guessesLink.addEventListener("click", () => {
    elements.guessesList.innerHTML = currentGuesses.length
        ? currentGuesses.map((guess, index) => `<div class="guess-item">${index + 1}. ${guess}</div>`).join("")
        : "<div class='guess-item'>No guesses yet.</div>";
    showDialog("guesses-screen");
});

elements.guessesCloseBtn.addEventListener("click", () => {
    hideDialog("guesses-screen");
    elements.guessInput.focus();
});

elements.prevGameArrow.addEventListener("click", () => {
    if (currentGameIndex > 0) {
        loadGame(currentGameIndex - 1, currentTab === "private");
    }
});

elements.nextGameArrow.addEventListener("click", () => {
    if (currentGameIndex < (currentTab === "private" ? privateGames : officialGames).length - 1) {
        loadGame(currentGameIndex + 1, currentTab === "private");
    }
});

elements.officialTab.addEventListener("click", () => {
    elements.officialTab.classList.add("active");
    elements.privateTab.classList.remove("active");
    elements.officialGames.classList.add("active");
    elements.privateGames.classList.remove("active");
    currentTab = "official";
});

elements.privateTab.addEventListener("click", () => {
    elements.officialTab.classList.remove("active");
    elements.privateTab.classList.add("active");
    elements.officialGames.classList.remove("active");
    elements.privateGames.classList.add("active");
    currentTab = "private";
});

elements.officialBackBtn.addEventListener("click", () => {
    showScreen("game-screen");
    elements.guessInput.focus();
});

elements.privateBackBtn.addEventListener("click", () => {
    showScreen("game-screen");
    elements.guessInput.focus();
});

elements.createPineapple.addEventListener("click", () => {
    showScreen("form-content");
    elements.gameNameInput.focus();
});

elements.formBackBtn.addEventListener("click", () => {
    showScreen("game-select-content");
});

elements.confirmBtn.addEventListener("click", submitPrivateGame);

elements.nextGameBtnEnd.addEventListener("click", () => {
    if (currentGameIndex < (currentTab === "private" ? privateGames : officialGames).length - 1) {
        loadGame(currentGameIndex + 1, currentTab === "private");
        showScreen("game-screen");
    } else {
        showScreen("game-select-content");
    }
});

elements.createPineappleEnd.addEventListener("click", () => {
    showScreen("form-content");
    elements.gameNameInput.focus();
});

elements.formErrorOkBtn.addEventListener("click", () => {
    hideDialog("form-error-dialog");
    elements.gameNameInput.focus();
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    showScreen("game-screen");
    loadGames();
    elements.guessInput.focus();
});