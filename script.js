document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded");

    // State variables
    let gameOver = false;
    let secretWord = "";
    let hints = [];
    let hintIndex = 0;
    let firstGuessMade = false;
    let allGames = [];
    let privateGames = [];
    let currentGameNumber = null;
    let currentGameId = null;
    let guessCount = 0;
    let gaveUp = false;
    let isProcessingGuess = false;
    let isLoadingGame = false;
    let isUILocked = false;
    let guesses = [];
    let animationTimeout = null;
    let activeInput = null;
    let currentBackground = "newbackground.png";
    let hintStyles = [];

    // DOM elements
    const gameScreen = document.getElementById("game-screen");
    const gameSelectContent = document.getElementById("game-select-content");
    const createPineappleBtn = document.getElementById("create-pineapple");
    const formContent = document.getElementById("form-content");
    const confirmBtn = document.getElementById("confirm-btn");
    const formBackBtn = document.getElementById("form-back-btn");
    const createPineappleLink = document.getElementById("create-pineapple-end");
    const guessBtn = document.getElementById("guess-btn");
    const guessesScreen = document.getElementById("guesses-screen");
    const guessesCloseBtn = document.getElementById("guesses-close-btn");
    const nextGameBtnEnd = document.getElementById("next-game-btn-end");
    const officialBackBtn = document.getElementById("official-back-btn");
    const privateBackBtn = document.getElementById("private-back-btn");
    const giveUpLink = document.getElementById("give-up-link");
    const giveUpDialog = document.getElementById("give-up-dialog");
    const giveUpYesBtn = document.getElementById("give-up-yes-btn");
    const giveUpNoBtn = document.getElementById("give-up-no-btn");
    const guessesLink = document.getElementById("guesses-link");
    const allGamesLink = document.getElementById("all-games-link");
    const prevGameArrow = document.getElementById("prev-game-arrow");
    const nextGameArrow = document.getElementById("next-game-arrow");
    const gameNumberText = document.getElementById("game-number-text");
    const guessInput = document.getElementById("guess-input");
    const guessArea = document.getElementById("guess-area");
    const guessInputContainer = document.getElementById("guess-input-container");
    const formErrorDialog = document.getElementById("form-error-dialog");
    const formErrorOkBtn = document.getElementById("form-error-ok-btn");
    const formErrorMessage = formErrorDialog?.querySelector(".dialog-message");
    const officialTab = document.getElementById("official-tab");
    const privateTab = document.getElementById("private-tab");
    const officialContent = document.getElementById("official-games");
    const privateContent = document.getElementById("private-games");
    const gameControls = document.getElementById("game-controls");
    const shareSection = document.getElementById("share-section");
    const gameNameElement = document.getElementById("game-name");

    // URLs
    const officialUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiz6IVPR4cZB9JlbNPC1Km5Jls5wsW3i-G9WYLppmnfPDz2kxb0I-g1BY50wFzuJ0aYgYdyub6VpCd/pub?output=csv";
    const privateUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIMKVHVz5EaVdJ5YfZJwLW72R9aI1Si9p-LX7kc__5-iAMaXz2itGmffgHu0b05_IRvFFAadH64Z-M/pub?output=csv";
    const webAppUrl = "https://script.google.com/macros/s/AKfycbyFVSK9mHruHEaX_ImhUobprQczd3JOQWQ9QzK9qwN0kgaAtOLZ_wk2u8HkGifd8oS15w/exec";
    const defaultBackground = "newbackground.png";

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Touch handling for game list sensitivity
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    const touchThreshold = 10;

    // Hint shapes, colors, and reveal effects
    const hintShapes = ['cloud', 'sun', 'aviator', 'diamond', 'fluffy-cloud'];
    const hintColors = [
        'color-1', 'color-2', 'color-3', 'color-4', 'color-5',
        'color-6', 'color-7', 'color-8', 'color-9', 'color-10'
    ];
    const hintRevealEffects = [
        'pop', 'stretch', 'zoom', 'bounce', 'spin',
        'slide-left', 'slide-right', 'slide-up', 'slide-down', 'letter', 'splash'
    ];

    // Hint reveal order mapping: index to hint ID
    const hintRevealOrder = ['hint-1', 'hint-2', 'hint-3', 'hint-4', 'hint-5'];

    // Shuffle array utility
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Randomize hint styles
    function randomizeHintStyles() {
        hintStyles = [];
        const availableColors = shuffleArray([...hintColors]);
        const shuffledEffects = shuffleArray([...hintRevealEffects]);
        for (let i = 0; i < 5; i++) {
            const color = availableColors.length > 0 ? availableColors[i % availableColors.length] : hintColors[i % hintColors.length];
            const effect = shuffledEffects[i % shuffledEffects.length];
            hintStyles.push({ shape: `hint-shape-${hintShapes[i]}`, color: `hint-color-${color}`, effect });
            if (availableColors.length > 0) availableColors.splice(i % availableColors.length, 1);
        }
        console.log("Assigned randomized hint styles:", hintStyles);
    }

    // Debounce utility
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                timeout = null;
                func(...args);
            };
            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
        };
    }

    // Preload background image
    function preloadBackground(url) {
        return new Promise((resolve) => {
            if (!url || url.trim() === "") {
                console.warn(`Invalid background URL: ${url}, using default: ${defaultBackground}`);
                url = defaultBackground;
            }
            const img = new Image();
            img.src = url;
            img.onload = () => {
                console.log(`Successfully preloaded background: ${url}`);
                resolve(url);
            };
            img.onerror = () => {
                console.error(`Failed to preload background: ${url}, using default: ${defaultBackground}`);
                resolve(defaultBackground);
            };
        });
    }

    // Adjust background
    function adjustBackground() {
        console.log("Adjusting background to:", currentBackground);
        const backgroundContainer = document.getElementById("background-container");
        if (backgroundContainer) {
            backgroundContainer.style.background = `url('${currentBackground}') no-repeat center center`;
            backgroundContainer.style.backgroundSize = "cover";
            backgroundContainer.offsetHeight;
        }
        document.body.style.background = "#FFFFFF";
    }

    window.addEventListener("resize", adjustBackground);

    // Setup game name (WORDY) to return to game screen
    if (gameNameElement) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Game name (WORDY) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Game name click ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        gameNameElement.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Setup guess input
    if (guessInput) {
        guessInput.disabled = false;
        guessInput.readOnly = false; // Ensure native keyboard can be used
        guessInput.addEventListener("input", (e) => {
            console.log("Guess input value changed:", guessInput.value);
            guessInput.value = guessInput.value.toUpperCase();
            if (animationTimeout) {
                clearTimeout(animationTimeout);
                animationTimeout = null;
                guessInputContainer.classList.remove("wrong-guess");
                isProcessingGuess = false;
                console.log("Animation cancelled and state reset due to typing");
            }
        });
        guessInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !gameOver && !guessInput.disabled && !isProcessingGuess) {
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Guess submitted via Enter key:", guess);
                    handleGuess(guess);
                }
            }
        });
        guessInput.focus(); // Auto-focus to trigger native keyboard
        activeInput = guessInput;
    } else {
        console.error("guess-input not found in DOM");
    }

    // Setup guess input container
    if (guessInputContainer) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guess input container triggered");
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
        };
        guessInputContainer.addEventListener("click", handler);
        guessInputContainer.addEventListener("touchstart", handler);
    }

    // Setup guess area
    if (guessArea) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guess area triggered");
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
        };
        guessArea.addEventListener("click", handler);
        guessArea.addEventListener("touchstart", handler);
    }

    // Setup guess button
    if (guessBtn) {
        guessBtn.disabled = false;
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guess button triggered:", { gameOver, disabled: guessInput.disabled, isProcessingGuess, guess: guessInput.value });
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Submitting guess:", guess);
                    handleGuess(guess);
                    guessInput.focus();
                }
            }
        }, 100);
        guessBtn.addEventListener("click", handler);
        guessBtn.addEventListener("touchstart", handler);
    } else {
        console.error("guess-btn not found in DOM");
    }

    // Setup form inputs
    const formInputs = [
        document.getElementById("game-name-input"),
        document.getElementById("secret-word"),
        document.getElementById("hint-1"),
        document.getElementById("hint-2"),
        document.getElementById("hint-3"),
        document.getElementById("hint-4"),
        document.getElementById("hint-5")
    ].filter(input => input);

    formInputs.forEach(input => {
        input.readOnly = false; // Ensure native keyboard can be used
        input.disabled = false;
        input.addEventListener("click", () => {
            activeInput = input;
            input.focus();
            console.log("Form input selected:", input.id);
        });
        input.addEventListener("touchstart", (e) => {
            e.preventDefault();
            activeInput = input;
            input.focus();
            console.log("Form input touched:", input.id);
        });
        input.addEventListener("input", () => {
            console.log("Form input updated:", input.id, input.value);
            input.value = input.value.toUpperCase();
        });
    });

    // Reset screen displays
    function resetScreenDisplays(activeScreen) {
        console.log("Resetting screen displays for:", activeScreen?.id);
        const screens = [formErrorDialog, guessesScreen, giveUpDialog, gameSelectContent, formContent, document.getElementById("game-over")];
        screens.forEach(screen => {
            if (screen && screen !== activeScreen) {
                screen.style.display = "none";
                screen.classList.remove("active");
            }
        });

        gameScreen.style.display = "none";
        guessArea.style.display = "none";
        gameControls.style.display = "none";

        if (activeScreen === gameScreen) {
            gameScreen.style.display = "flex";
            guessArea.style.display = "flex";
            gameControls.style.display = "flex";
            if (guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
        } else if (activeScreen === gameSelectContent || activeScreen === formContent || activeScreen.id === "game-over") {
            activeScreen.style.display = "flex";
            activeScreen.classList.add("active");
            if (activeScreen === formContent) {
                activeInput = document.getElementById("game-name-input");
                if (activeInput) activeInput.focus();
            }
        }

        adjustBackground();
    }

    // Tab navigation
    if (officialTab && privateTab && officialContent && privateContent) {
        officialTab.addEventListener("click", () => {
            console.log("Official tab clicked");
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            officialContent.style.display = "flex";
            privateContent.classList.remove("active");
            privateContent.style.display = "none";
            displayGameList();
        });

        privateTab.addEventListener("click", async () => {
            console.log("Private tab clicked");
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            privateContent.style.display = "flex";
            officialContent.classList.remove("active");
            officialContent.style.display = "none";
            if (privateGames.length === 0) {
                await fetchPrivateGames();
            }
            displayGameList();
        });
    }

    // All Games link
    if (allGamesLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("All Games link triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("All Games link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            showGameSelectScreen();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        allGamesLink.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Give Up link
    if (giveUpLink && giveUpYesBtn && giveUpNoBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up link triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Give Up link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            giveUpDialog.style.display = "flex";
            console.log("Showing give-up dialog");
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        giveUpLink.addEventListener(isMobile ? "touchstart" : "click", handler);

        giveUpYesBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up Yes button clicked");
            gaveUp = true;
            let normalizedGameNumber;
            let gameType;
            if (currentGameNumber.includes("- Private")) {
                normalizedGameNumber = currentGameId;
                gameType = "privatePineapple";
            } else {
                normalizedGameNumber = currentGameNumber.replace("Game #", "");
                gameType = "pineapple";
            }
            saveGameResult(gameType, normalizedGameNumber, secretWord, "Gave Up");
            giveUpDialog.style.display = "none";
            endGame(false, true);
        });

        giveUpNoBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up No button clicked");
            giveUpDialog.style.display = "none";
            if (guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
        });
    }

    // Guesses link
    if (guessesLink && guessesScreen) {
        guessesLink.textContent = "Guesses: 0/5";

        guessesLink.addEventListener(isMobile ? "touchstart" : "click", debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses link triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Guesses link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            guessesScreen.style.display = "flex";
            const guessesList = document.getElementById("guesses-list");
            guessesList.innerHTML = guesses.length > 0 ? guesses.join("<br>") : "No guesses yet.";
            console.log("Showing guesses screen with guesses:", guesses);
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100));

        guessesCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button clicked");
            guessesScreen.style.display = "none";
            if (guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
        });
    }

    // Fetch official games
    async function fetchOfficialGames() {
        console.log("Fetching official games from:", officialUrl);
        try {
            const response = await fetch(officialUrl);
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                complete: (result) => {
                    allGames = result.data.filter(row => row["Game Name"] && row["Secret Word"]);
                    console.log("Official games fetched:", allGames);
                    displayGameList();
                },
                error: (error) => {
                    console.error("Error parsing official games CSV:", error);
                }
            });
        } catch (error) {
            console.error("Error fetching official games:", error);
        }
    }

    // Fetch private games
    async function fetchPrivateGames() {
        console.log("Fetching private games from:", privateUrl);
        try {
            const response = await fetch(privateUrl);
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                complete: (result) => {
                    privateGames = result.data.filter(row => row["Game ID"] && row["Secret Word"]);
                    console.log("Private games fetched:", privateGames);
                    displayGameList();
                },
                error: (error) => {
                    console.error("Error parsing private games CSV:", error);
                }
            });
        } catch (error) {
            console.error("Error fetching private games:", error);
        }
    }

    // Display game list
    function displayGameList() {
        console.log("Displaying game list", { officialTab: officialTab?.classList.contains("active"), privateTab: privateTab?.classList.contains("active") });
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");

        if (officialTab.classList.contains("active")) {
            officialList.innerHTML = "";
            allGames.forEach((game, index) => {
                const row = document.createElement("div");
                row.classList.add("game-list-row");
                row.innerHTML = `
                    <span>${game["Game Name"]}</span>
                    <span class="play-now" data-type="official" data-index="${index}">Play Now</span>
                `;
                officialList.appendChild(row);
            });
        } else if (privateTab.classList.contains("active")) {
            privateList.innerHTML = "";
            privateGames.forEach((game) => {
                const row = document.createElement("div");
                row.classList.add("game-list-row");
                row.innerHTML = `
                    <span>${game["Game Name"]}</span>
                    <span class="play-now" data-type="private" data-id="${game["Game ID"]}">Play Now</span>
                `;
                privateList.appendChild(row);
            });
        }

        // Add event listeners for Play Now links
        document.querySelectorAll(".play-now").forEach(link => {
            link.addEventListener(isMobile ? "touchstart" : "click", debounce(async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Play Now link triggered", { isUILocked, isLoadingGame });
                if (isUILocked || isLoadingGame) {
                    console.log("Play Now ignored: UI locked or game loading");
                    return;
                }
                isUILocked = true;
                isLoadingGame = true;
                const type = link.dataset.type;
                if (type === "official") {
                    const index = parseInt(link.dataset.index);
                    await loadGame(allGames[index], index + 1, type);
                } else {
                    const id = link.dataset.id;
                    const game = privateGames.find(g => g["Game ID"] === id);
                    await loadGame(game, id, type);
                }
                resetScreenDisplays(gameScreen);
                setTimeout(() => {
                    isUILocked = false;
                    isLoadingGame = false;
                }, 500);
            }, 100));
        });
    }

    // Load game
    async function loadGame(gameData, gameNumber, gameType) {
        console.log("Loading game:", { gameNumber, gameType });
        isLoadingGame = true;
        gameOver = false;
        secretWord = gameData["Secret Word"].trim().toUpperCase();
        hints = [
            gameData["Hint 1"]?.trim() || "",
            gameData["Hint 2"]?.trim() || "",
            gameData["Hint 3"]?.trim() || "",
            gameData["Hint 4"]?.trim() || "",
            gameData["Hint 5"]?.trim() || ""
        ].filter(hint => hint);
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        gaveUp = false;
        guesses = [];
        currentGameNumber = gameType === "official" ? `Game #${gameNumber}` : `${gameNumber} - Private`;
        currentGameId = gameType === "private" ? gameNumber : null;
        guessInput.value = "";
        guessesLink.textContent = "Guesses: 0/5";
        gameScreen.classList.remove("game-ended");

        // Clear previous hints
        hintRevealOrder.forEach(id => {
            const hintElement = document.getElementById(id);
            if (hintElement) {
                hintElement.style.display = "none";
                hintElement.innerHTML = "";
                hintElement.className = "hint";
            }
        });

        // Randomize hint styles
        randomizeHintStyles();

        // Set background
        const backgroundUrl = gameData["Background URL"]?.trim() || defaultBackground;
        currentBackground = await preloadBackground(backgroundUrl);
        adjustBackground();

        // Display first hint
        if (hints.length > 0) {
            displayHint();
        }

        // Update game number
        if (gameNumberText) {
            gameNumberText.textContent = currentGameNumber;
        }

        // Update arrow states
        updateArrowStates(gameType, gameNumber);

        // Enable input
        guessInput.disabled = false;
        guessBtn.disabled = false;
        guessInput.focus();
        activeInput = guessInput;
        isLoadingGame = false;
        console.log("Game loaded:", { secretWord, hints, currentGameNumber });
    }

    // Update arrow states
    function updateArrowStates(gameType, gameNumber) {
        console.log("Updating arrow states", { gameType, gameNumber });
        if (gameType === "official") {
            const index = parseInt(gameNumber) - 1;
            prevGameArrow.classList.toggle("disabled", index === 0);
            nextGameArrow.classList.toggle("disabled", index === allGames.length - 1);
        } else {
            const index = privateGames.findIndex(g => g["Game ID"] === gameNumber);
            prevGameArrow.classList.toggle("disabled", index === 0);
            nextGameArrow.classList.toggle("disabled", index === privateGames.length - 1);
        }
    }

    // Display hint
    function displayHint() {
        console.log("Displaying hint:", { hintIndex, totalHints: hints.length });
        if (hintIndex >= hints.length) return;
        const hintId = hintRevealOrder[hintIndex];
        const hintElement = document.getElementById(hintId);
        if (hintElement) {
            hintElement.innerHTML = `<span class="hint-text">${hints[hintIndex]}</span>`;
            hintElement.className = `hint ${hintStyles[hintIndex].shape} ${hintStyles[hintIndex].color} reveal-${hintStyles[hintIndex].effect}`;
            hintElement.style.display = "flex";
            console.log(`Hint ${hintId} displayed:`, hints[hintIndex]);
        }
        hintIndex++;
    }

    // Handle guess
    function handleGuess(guess) {
        console.log("Handling guess:", guess);
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored:", { isProcessingGuess, gameOver });
            return;
        }
        isProcessingGuess = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;
        gameControls.classList.remove("wrong-guess");

        guessCount++;
        guesses.push(guess);
        guessesLink.textContent = `Guesses: ${guessCount}/5`;

        if (guess === secretWord) {
            console.log("Correct guess!");
            let normalizedGameNumber;
            let gameType;
            if (currentGameNumber.includes("- Private")) {
                normalizedGameNumber = currentGameId;
                gameType = "privatePineapple";
            } else {
                normalizedGameNumber = currentGameNumber.replace("Game #", "");
                gameType = "pineapple";
            }
            saveGameResult(gameType, normalizedGameNumber, secretWord, `Success after ${guessCount} guesses`);
            endGame(true);
        } else {
            console.log("Incorrect guess");
            guessInputContainer.classList.add("wrong-guess");
            gameControls.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                gameControls.classList.remove("wrong-guess");
                if (guessCount < 5) {
                    if (!firstGuessMade) {
                        firstGuessMade = true;
                        displayHint();
                    }
                    guessInput.value = "";
                    guessInput.disabled = false;
                    guessBtn.disabled = false;
                    guessInput.focus();
                    activeInput = guessInput;
                    isProcessingGuess = false;
                    console.log("Ready for next guess");
                } else {
                    let normalizedGameNumber;
                    let gameType;
                    if (currentGameNumber.includes("- Private")) {
                        normalizedGameNumber = currentGameId;
                        gameType = "privatePineapple";
                    } else {
                        normalizedGameNumber = currentGameNumber.replace("Game #", "");
                        gameType = "pineapple";
                    }
                    saveGameResult(gameType, normalizedGameNumber, secretWord, "Failed");
                    endGame(false);
                }
            }, 350);
        }
    }

    // End game
    function endGame(won, gaveUp = false) {
        console.log("Ending game:", { won, gaveUp });
        gameOver = true;
        gameScreen.classList.add("game-ended");
        guessInput.disabled = true;
        guessBtn.disabled = true;
        gameControls.style.display = "none";
        const gameOverScreen = document.getElementById("game-over");
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");

        let message;
        if (won) {
            message = `I guessed the secret word in WORDY ${currentGameNumber} in ${guessCount}/5 guesses!`;
            createPineappleRain();
        } else if (gaveUp) {
            message = `I gave up on WORDY ${currentGameNumber}. The secret word was ${secretWord}.`;
        } else {
            message = `I couldn't guess the secret word in WORDY ${currentGameNumber} after 5 tries. The secret word was ${secretWord}.`;
        }

        shareText.innerHTML = message.replace(currentGameNumber, `<span class="guess-count">${currentGameNumber}</span>`);
        gameNumberDisplay.textContent = currentGameNumber;

        // Setup share buttons
        const shareData = {
            text: `${message}\nPlay WORDY at https://wordy.bigbraingames.net`,
            url: "https://wordy.bigbraingames.net"
        };

        document.getElementById("share-whatsapp").href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text)}`;
        document.getElementById("share-telegram").href = `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`;
        document.getElementById("share-twitter").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}`;
        document.getElementById("share-instagram").href = `https://www.instagram.com/?url=${encodeURIComponent(shareData.url)}`;

        gameOverScreen.style.display = "flex";
        gameOverScreen.classList.add("active");

        // Show all hints
        while (hintIndex < hints.length) {
            displayHint();
        }
    }

    // Create pineapple rain effect
    function createPineappleRain() {
        console.log("Creating pineapple rain effect");
        const container = document.createElement("div");
        container.classList.add("pineapple-rain");
        document.body.appendChild(container);

        const pieces = ["🍍"];
        const numPieces = 20;

        for (let i = 0; i < numPieces; i++) {
            const piece = document.createElement("div");
            piece.classList.add("pineapple-piece");
            piece.textContent = pieces[Math.floor(Math.random() * pieces.length)];
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.animationDuration = `${Math.random() * 2 + 3}s`;
            piece.style.animationDelay = `${Math.random() * 2}s`;
            piece.style.setProperty("--rotation", `${Math.random() * 360}deg`);
            piece.style.setProperty("--drift", `${Math.random() * 2 - 1}`);
            container.appendChild(piece);
        }

        setTimeout(() => {
            container.remove();
            console.log("Pineapple rain effect removed");
        }, 5000);
    }

    // Save game result
    function saveGameResult(gameType, gameNumber, secretWord, result) {
        console.log("Saving game result:", { gameType, gameNumber, secretWord, result, guesses });
        const data = {
            gameType,
            gameNumber,
            secretWord,
            result,
            guesses: guesses.join(", ")
        };
        fetch(webAppUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => console.log("Game result saved:", data))
            .catch(error => console.error("Error saving game result:", error));
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select screen");
        resetScreenDisplays(gameSelectContent);
        officialTab.classList.add("active");
        privateTab.classList.remove("active");
        officialContent.classList.add("active");
        officialContent.style.display = "flex";
        privateContent.classList.remove("active");
        privateContent.style.display = "none";
        displayGameList();
    }

    // Create a Wordy
    if (createPineappleBtn && createPineappleLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create a Wordy triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Create a Wordy ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => input.value = "");
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        createPineappleBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
        createPineappleLink.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Form submission
    if (confirmBtn) {
        confirmBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form confirm button clicked");
            if (isUILocked || isLoadingGame) {
                console.log("Form submission ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;

            const gameName = formInputs[0].value.trim().toUpperCase();
            const secretWord = formInputs[1].value.trim().toUpperCase();
            const hints = formInputs.slice(2).map(input => input.value.trim().toUpperCase()).filter(hint => hint);

            if (!gameName || !secretWord || hints.length < 2) {
                formErrorMessage.textContent = "Please provide a game name, secret word, and at least two hints.";
                formErrorDialog.style.display = "flex";
                console.log("Form validation failed");
                isUILocked = false;
                return;
            }

            const data = {
                gameType: "privatePineapple",
                gameName,
                secretWord,
                hints,
                backgroundUrl: ""
            };

            try {
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                console.log("Game creation response:", result);
                if (result.status === "success") {
                    await fetchPrivateGames();
                    resetScreenDisplays(gameSelectContent);
                    privateTab.classList.add("active");
                    officialTab.classList.remove("active");
                    privateContent.classList.add("active");
                    privateContent.style.display = "flex";
                    officialContent.classList.remove("active");
                    officialContent.style.display = "none";
                } else {
                    formErrorMessage.textContent = result.message || "Error creating game.";
                    formErrorDialog.style.display = "flex";
                }
            } catch (error) {
                console.error("Error creating game:", error);
                formErrorMessage.textContent = "Error creating game. Please try again.";
                formErrorDialog.style.display = "flex";
            }
            isUILocked = false;
        });
    }

    // Form error dialog OK button
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form error OK button clicked");
            formErrorDialog.style.display = "none";
            activeInput = formInputs[0];
            if (activeInput) activeInput.focus();
        });
    }

    // Form back button
    if (formBackBtn) {
        formBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form back button clicked");
            if (isUILocked || isLoadingGame) {
                console.log("Form back ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameSelectContent);
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            privateContent.style.display = "flex";
            officialContent.classList.remove("active");
            officialContent.style.display = "none";
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Official back button
    if (officialBackBtn) {
        officialBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Official back button clicked");
            if (isUILocked || isLoadingGame) {
                console.log("Official back ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            if (guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Private back button
    if (privateBackBtn) {
        privateBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Private back button clicked");
            if (isUILocked || isLoadingGame) {
                console.log("Private back ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            if (guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Next game button (end screen)
    if (nextGameBtnEnd) {
        nextGameBtnEnd.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next game button (end screen) clicked");
            if (isUILocked || isLoadingGame) {
                console.log("Next game ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;

            let nextGameNumber;
            let gameType;
            if (currentGameNumber.includes("- Private")) {
                const currentIndex = privateGames.findIndex(g => g["Game ID"] === currentGameId);
                if (currentIndex < privateGames.length - 1) {
                    nextGameNumber = privateGames[currentIndex + 1]["Game ID"];
                    gameType = "private";
                } else {
                    console.log("No more private games, switching to first official game");
                    nextGameNumber = 1;
                    gameType = "official";
                }
            } else {
                const currentIndex = parseInt(currentGameNumber.replace("Game #", "")) - 1;
                if (currentIndex < allGames.length - 1) {
                    nextGameNumber = currentIndex + 2;
                    gameType = "official";
                } else {
                    console.log("No more official games, switching to first private game or staying on game select");
                    if (privateGames.length > 0) {
                        nextGameNumber = privateGames[0]["Game ID"];
                        gameType = "private";
                    } else {
                        resetScreenDisplays(gameSelectContent);
                        isUILocked = false;
                        isLoadingGame = false;
                        return;
                    }
                }
            }

            const gameData = gameType === "official" ? allGames[nextGameNumber - 1] : privateGames.find(g => g["Game ID"] === nextGameNumber);
            await loadGame(gameData, nextGameNumber, gameType);
            resetScreenDisplays(gameScreen);
            setTimeout(() => {
                isUILocked = false;
                isLoadingGame = false;
            }, 500);
        });
    }

    // Previous and next game arrows
    if (prevGameArrow && nextGameArrow) {
        prevGameArrow.addEventListener(isMobile ? "touchstart" : "click", debounce(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Previous game arrow clicked", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame || prevGameArrow.classList.contains("disabled")) {
                console.log("Previous game arrow ignored: UI locked, game loading, or disabled");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;

            let prevGameNumber;
            let gameType;
            if (currentGameNumber.includes("- Private")) {
                const currentIndex = privateGames.findIndex(g => g["Game ID"] === currentGameId);
                prevGameNumber = privateGames[currentIndex - 1]["Game ID"];
                gameType = "private";
            } else {
                prevGameNumber = parseInt(currentGameNumber.replace("Game #", "")) - 1;
                gameType = "official";
            }

            const gameData = gameType === "official" ? allGames[prevGameNumber - 1] : privateGames.find(g => g["Game ID"] === prevGameNumber);
            await loadGame(gameData, prevGameNumber, gameType);
            resetScreenDisplays(gameScreen);
            setTimeout(() => {
                isUILocked = false;
                isLoadingGame = false;
            }, 500);
        }, 100));

        nextGameArrow.addEventListener(isMobile ? "touchstart" : "click", debounce(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next game arrow clicked", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame || nextGameArrow.classList.contains("disabled")) {
                console.log("Next game arrow ignored: UI locked, game loading, or disabled");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;

            let nextGameNumber;
            let gameType;
            if (currentGameNumber.includes("- Private")) {
                const currentIndex = privateGames.findIndex(g => g["Game ID"] === currentGameId);
                nextGameNumber = privateGames[currentIndex + 1]["Game ID"];
                gameType = "private";
            } else {
                nextGameNumber = parseInt(currentGameNumber.replace("Game #", "")) + 1;
                gameType = "official";
            }

            const gameData = gameType === "official" ? allGames[nextGameNumber - 1] : privateGames.find(g => g["Game ID"] === nextGameNumber);
            await loadGame(gameData, nextGameNumber, gameType);
            resetScreenDisplays(gameScreen);
            setTimeout(() => {
                isUILocked = false;
                isLoadingGame = false;
            }, 500);
        }, 100));
    }

    // Initialize game
    async function resetGame() {
        console.log("Resetting game");
        await fetchOfficialGames();
        if (allGames.length > 0) {
            await loadGame(allGames[0], 1, "official");
            resetScreenDisplays(gameScreen);
            if (gameControls) {
                gameControls.style.display = "flex";
            }
        } else {
            resetScreenDisplays(gameSelectContent);
        }
    }

    // Handle touch events for sensitivity
    document.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchMoved = false;
    });

    document.addEventListener("touchmove", (e) => {
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        if (deltaX > touchThreshold || deltaY > touchThreshold) {
            touchMoved = true;
        }
    });

    // Initialize
    await resetGame();
});