document.addEventListener("DOMContentLoaded", async () => {
    const gameScreen = document.getElementById("game-screen");
    const guessInput = document.getElementById("guess-input");
    const guessBtn = document.getElementById("guess-btn");
    const guessInputContainer = document.getElementById("guess-input-container");
    const gameControlsContainer = document.getElementById("game-controls-container");
    const guessesLink = document.getElementById("guesses-link");
    const gameNumberText = document.getElementById("game-number-text");
    const gameNameElement = document.getElementById("game-name");
    const shareSection = document.getElementById("share-section");
    const formErrorDialog = document.getElementById("form-error-dialog");
    const formErrorMessage = formErrorDialog ? formErrorDialog.querySelector(".dialog-message") : null;

    let allGames = [];
    let privateGames = [];
    let secretWord = "";
    let hints = [];
    let hintIndex = 0;
    let guesses = [];
    let guessCount = 0;
    let gameOver = false;
    let gaveUp = false;
    let isProcessingGuess = false;
    let activeInput = null;
    let currentGameNumber = "";
    let currentGameId = "";
    let isUILocked = false;
    let animationTimeout = null;
    const defaultBackground = "url('default-bg.png')";
    let currentBackground = defaultBackground;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const touchThreshold = 10;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;

    // Fetch game data
    async function fetchGameData() {
        try {
            const response = await fetch("games.csv");
            const text = await response.text();
            const parsed = Papa.parse(text, { header: true });
            allGames = parsed.data.filter(g => g["Game Number"]);
            privateGames = allGames.filter(g => g["Private"] === "TRUE");
            populateGameLists();
        } catch (error) {
            console.error("Failed to fetch game data:", error);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load game data.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Populate official and private game lists
    function populateGameLists() {
        const officialList = document.getElementById("official-list");
        if (officialList) {
            officialList.innerHTML = "";
            allGames.forEach(game => {
                const gameNumber = game["Game Number"];
                const secret = game["Secret Word"] ? game["Secret Word"].toUpperCase() : "N/A";
                const pastResults = JSON.parse(localStorage.getItem("pineappleResults") || "{}");
                const pastResult = pastResults[gameNumber];
                const guessesDisplay = pastResult ? pastResult.guesses : "-";
                const displayWord = pastResult && pastResult.secretWord === secret ? secret : "Play Now";

                const gameItem = document.createElement("div");
                gameItem.className = "game-list-row";
                gameItem.innerHTML = `<span>${gameNumber}</span><span class="${displayWord === 'Play Now' ? 'play-now' : ''}">${displayWord}</span><span>${guessesDisplay}</span>`;

                const selectGame = async () => {
                    if (isUILocked) return;
                    isUILocked = true;
                    currentGameId = game["Game Number"];
                    currentGameNumber = `Game #${game["Game Number"]}`;
                    currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(game);
                    setTimeout(() => { isUILocked = false; }, 500);
                };

                if (isMobile) {
                    gameItem.addEventListener("touchstart", e => {
                        touchStartX = e.touches[0].clientX;
                        touchStartY = e.touches[0].clientY;
                        touchMoved = false;
                    });
                    gameItem.addEventListener("touchmove", e => {
                        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                        if (deltaX > touchThreshold || deltaY > touchThreshold) touchMoved = true;
                    });
                    gameItem.addEventListener("touchend", async e => {
                        e.preventDefault();
                        if (!touchMoved) await selectGame();
                    });
                } else {
                    gameItem.addEventListener("click", selectGame);
                }
                officialList.appendChild(gameItem);
            });
        }

        const privateList = document.getElementById("private-list");
        if (privateList) {
            privateList.innerHTML = "";
            privateGames.forEach(game => {
                const gameNumber = game["Game Number"];
                const gameName = game["Game Name"] ? game["Game Name"].toUpperCase() : "Private";
                const secret = game["Secret Word"] ? game["Secret Word"].toUpperCase() : "N/A";
                const pastResults = JSON.parse(localStorage.getItem("privatePineappleResults") || "{}");
                const pastResult = pastResults[gameNumber];
                const guessesDisplay = pastResult ? pastResult.guesses : "-";
                const displayWord = pastResult && pastResult.secretWord === secret ? secret : "Play Now";

                const gameItem = document.createElement("div");
                gameItem.className = "game-list-row";
                gameItem.innerHTML = `<span>${gameName}</span><span class="${displayWord === 'Play Now' ? 'play-now' : ''}">${displayWord}</span><span>${guessesDisplay}</span>`;

                const selectGame = async () => {
                    if (isUILocked) return;
                    isUILocked = true;
                    currentGameId = game["Game Number"];
                    currentGameNumber = `${gameName} - Private`;
                    currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(game);
                    setTimeout(() => { isUILocked = false; }, 500);
                };

                if (isMobile) {
                    gameItem.addEventListener("touchstart", e => {
                        touchStartX = e.touches[0].clientX;
                        touchStartY = e.touches[0].clientY;
                        touchMoved = false;
                    });
                    gameItem.addEventListener("touchmove", e => {
                        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                        if (deltaX > touchThreshold || deltaY > touchThreshold) touchMoved = true;
                    });
                    gameItem.addEventListener("touchend", async e => {
                        e.preventDefault();
                        if (!touchMoved) await selectGame();
                    });
                } else {
                    gameItem.addEventListener("click", selectGame);
                }
                privateList.appendChild(gameItem);
            });
        }
    }

    // Preload background
    async function preloadBackground(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.src = url;
        });
    }

    // Setup hints
    function setupHints() {
        for (let i = 1; i <= 5; i++) {
            const hintElement = document.getElementById(`hint-${i}`);
            if (hintElement) {
                hintElement.style.display = "none";
                hintElement.innerHTML = "";
            }
        }
        hints.slice(0, hintIndex + 1).forEach((hint, idx) => {
            const hintElement = document.getElementById(`hint-${idx + 1}`);
            if (hintElement) {
                hintElement.textContent = hint;
                hintElement.style.display = "flex";
            }
        });
    }

    function revealHint() {
        hintIndex++;
        if (hintIndex < hints.length) {
            const hintElement = document.getElementById(`hint-${hintIndex + 1}`);
            if (hintElement) {
                hintElement.textContent = hints[hintIndex];
                hintElement.style.display = "flex";
            }
        }
    }

    // Handle guess
    function handleGuess(guess) {
        if (isProcessingGuess || gameOver) return;
        isProcessingGuess = true;
        guessInput.value = "";
        guessCount++;
        guesses.push(guess);
        if (guess === secretWord) {
            saveGameResult(secretWord, guessCount);
            endGame(true);
        } else {
            guessInputContainer.classList.add("wrong-guess");
            gameControlsContainer.classList.add("wrong-guess");
            setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                gameControlsContainer.classList.remove("wrong-guess");
                isProcessingGuess = false;
                if (hintIndex < hints.length - 1) revealHint();
                else {
                    saveGameResult(secretWord, "X");
                    endGame(false);
                }
            }, 350);
        }
    }

    function saveGameResult(secret, guessesValue) {
        const resultsKey = currentGameNumber.includes("Private") ? "privatePineappleResults" : "pineappleResults";
        const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
        results[currentGameId] = { secretWord: secret, guesses: guessesValue };
        localStorage.setItem(resultsKey, JSON.stringify(results));
    }

    function endGame(won) {
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;
        // Show game over screen
        const gameOverScreen = document.getElementById("game-over");
        gameOverScreen.style.display = "flex";
        const shareText = document.getElementById("share-text");
        if (shareText) {
            shareText.innerHTML = won
                ? `I solved Wordy #${currentGameNumber} in ${guessCount} ${guessCount === 1 ? "Guess" : "Guesses"}`
                : "Play Wordy!";
        }
    }

    function resetGame() {
        gameOver = false;
        secretWord = "";
        hints = [];
        hintIndex = 0;
        guesses = [];
        guessCount = 0;
        gaveUp = false;
        isProcessingGuess = false;
        guessInput.value = "";
        guessInput.disabled = false;
        guessBtn.disabled = false;
        activeInput = guessInput;
        setupHints();
    }

    function loadGame(game) {
        resetGame();
        secretWord = game["Secret Word"].toUpperCase();
        hints = ["Hint 1","Hint 2","Hint 3","Hint 4","Hint 5"].map(k => game[k]).filter(Boolean);
        hintIndex = 0;
        currentGameId = game["Game Number"];
        currentGameNumber = game["Display Name"] || `Game #${game["Game Number"]}`;
        setupHints();
    }

    guessBtn.addEventListener("click", () => handleGuess(guessInput.value.toUpperCase()));
    guessInput.addEventListener("keyup", e => { if (e.key === "Enter") handleGuess(guessInput.value.toUpperCase()); });

    await fetchGameData();
});
