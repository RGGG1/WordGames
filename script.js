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
    const keyboardContainer = document.getElementById("keyboard-container");
    const keyboardBackBtn = document.getElementById("keyboard-back-btn");
    const keyboardContent = document.getElementById("keyboard-content");
    const keyboardGuessesContent = document.getElementById("keyboard-guesses-content");
    const keyboardGiveUpContent = document.getElementById("keyboard-give-up-content");
    const officialTab = document.getElementById("official-tab");
    const privateTab = document.getElementById("private-tab");
    const officialContent = document.getElementById("official-games");
    const privateContent = document.getElementById("private-games");
    const gameControlsContainer = document.getElementById("game-controls-container");
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
                timeout = null; // Ensure timeout is cleared
                func(...args);
            };
            if (!timeout) { // Only set timeout if none exists
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
            showKeyboard();
            activeInput = guessInput;
            if (activeInput && !isMobile) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        gameNameElement.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Setup guess input
    if (guessInput) {
        guessInput.disabled = false;
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
        if (isMobile) {
            guessInput.setAttribute("readonly", "readonly");
            guessInput.addEventListener("focus", (e) => {
                e.preventDefault();
                console.log("Prevented focus on guessInput to avoid virtual keyboard");
            });
        } else {
            guessInput.focus();
        }
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
            if (isMobile && keyboardContainer.classList.contains("show-alternate")) {
                showKeyboard();
            }
            if (!gameOver && !guessInput.disabled && !isProcessingGuess && !isMobile) {
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
            if (!gameOver && !guessInput.disabled && !isProcessingGuess && !isMobile) {
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
                    if (!isMobile) {
                        guessInput.focus();
                    }
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
        if (isMobile) {
            input.setAttribute("readonly", "readonly");
            input.addEventListener("focus", (e) => {
                e.preventDefault();
                console.log("Prevented focus on form input to avoid virtual keyboard");
            });
        } else {
            input.readOnly = false;
        }
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

    // Show keyboard
    function showKeyboard() {
        if (!isMobile || !keyboardContainer || !keyboardContent || !keyboardGuessesContent || !keyboardGiveUpContent || !keyboardBackBtn) {
            console.log("Skipping showKeyboard: not mobile or elements missing");
            return;
        }
        console.log("Showing keyboard");
        keyboardContainer.classList.remove("show-alternate", "show-guesses", "show-give-up");
        keyboardContainer.style.display = "flex";
        keyboardContent.style.display = "flex";
        keyboardGuessesContent.style.display = "none";
        keyboardGiveUpContent.style.display = "none";
        keyboardBackBtn.style.display = "none";
        keyboardContainer.offsetHeight;
        if (guessInput && !gameOver && !isProcessingGuess) {
            activeInput = guessInput;
        }
        setupKeyboardListeners();
    }

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
        gameControlsContainer.style.display = "none";
        keyboardContainer.style.display = "none";

        if (activeScreen === gameScreen) {
            gameScreen.style.display = "flex";
            guessArea.style.display = "flex";
            gameControlsContainer.style.display = "flex";
            if (isMobile && !gameOver) {
                keyboardContainer.style.display = "flex";
                showKeyboard();
            }
        } else if (activeScreen === gameSelectContent || activeScreen === formContent || activeScreen.id === "game-over") {
            activeScreen.style.display = "flex";
            activeScreen.classList.add("active");
            if (activeScreen === formContent && isMobile) {
                keyboardContainer.style.display = "flex";
                showKeyboard();
            }
        }

        adjustBackground();
    }

    // Setup keyboard listeners
    function setupKeyboardListeners() {
        if (!isMobile) {
            console.log("Skipping on-screen keyboard setup on desktop");
            return;
        }
        const keys = document.querySelectorAll("#keyboard-content .key");
        console.log("Setting up keyboard listeners, found keys:", keys.length);
        keys.forEach(key => {
            if (key._clickHandler) {
                key.removeEventListener("click", key._clickHandler);
                key.removeEventListener("touchstart", key._clickHandler);
                key.removeEventListener("touchend", key._touchEndHandler);
            }
            const clickHandler = debounce((e) => {
                if (e.type === "touchstart") {
                    e.preventDefault();
                    e.stopPropagation();
                }
                console.log("Key triggered:", key.textContent, { gameOver, isProcessingGuess, activeInput: activeInput?.id });
                if (gameOver || isProcessingGuess || !activeInput || activeInput.disabled) {
                    console.log("Key click ignored due to state");
                    return;
                }
                // Add flash effect
                key.classList.add("pressed");
                setTimeout(() => {
                    key.classList.remove("pressed");
                }, 100); // Flash lasts 100ms
                const keyValue = key.textContent;
                if (key.id === "key-enter") {
                    if (activeInput === guessInput) {
                        const guess = guessInput.value.trim().toUpperCase();
                        if (guess) {
                            console.log("Guess submitted via on-screen Enter:", guess);
                            handleGuess(guess);
                        }
                    }
                } else if (key.id === "key-backspace") {
                    activeInput.value = activeInput.value.slice(0, -1);
                    console.log("Backspace pressed, new value:", activeInput.value);
                } else {
                    activeInput.value += keyValue;
                    console.log("Key added, new value:", activeInput.value);
                }
            }, 150);
            const touchEndHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };
            key._clickHandler = clickHandler;
            key._touchEndHandler = touchEndHandler;
            key.addEventListener("click", clickHandler);
            key.addEventListener("touchstart", clickHandler);
            key.addEventListener("touchend", touchEndHandler);
        });
    }

    // Keyboard back button
    if (keyboardBackBtn) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Keyboard back button triggered");
            showKeyboard();
        };
        keyboardBackBtn.addEventListener("click", handler);
        keyboardBackBtn.addEventListener("touchstart", handler);
    }

        // Keyboard guesses content
    if (keyboardGuessesContent) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === keyboardGuessesContent || e.target === document.getElementById("guesses-list")) {
                console.log("Triggered guesses content, showing guesses screen");
                showKeyboard();
                guessesScreen.style.display = "flex";
            }
        };
        keyboardGuessesContent.addEventListener("click", handler);
        keyboardGuessesContent.addEventListener("touchstart", handler);
    }

    // Keyboard give up content
    if (keyboardGiveUpContent) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === keyboardGiveUpContent) {
                console.log("Triggered give up content, showing give up dialog");
                showKeyboard();
                giveUpDialog.style.display = "flex";
            }
        };
        keyboardGiveUpContent.addEventListener("click", handler);
        keyboardGiveUpContent.addEventListener("touchstart", handler);
    }

    // Handle guess
    function handleGuess(guess) {
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored:", { isProcessingGuess, gameOver });
            return;
        }
        isProcessingGuess = true;
        console.log("Handling guess:", guess);

        guessInputContainer.classList.remove("wrong-guess");
        if (keyboardContainer) keyboardContainer.classList.remove("wrong-guess");
        if (gameControlsContainer) gameControlsContainer.classList.remove("wrong-guess");
        guessInput.value = "";
        guessCount++;
        guesses.push(guess);
        console.log("Guess added, current guesses:", guesses, "guessCount:", guessCount);

        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}/5`;
            console.log("Updated guessesLink text:", guessesLink.textContent);
        }

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
            saveGameResult(gameType, normalizedGameNumber, secretWord, guessCount);
            endGame(true);
        } else {
            console.log("Incorrect guess, animating...");
            guessInputContainer.classList.add("wrong-guess");
            if (keyboardContainer) keyboardContainer.classList.add("wrong-guess");
            if (gameControlsContainer) gameControlsContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                if (keyboardContainer) keyboardContainer.classList.remove("wrong-guess");
                if (gameControlsContainer) gameControlsContainer.classList.remove("wrong-guess");
                isProcessingGuess = false;
                console.log("Animation completed, input reset");
                if (guessInput && !isMobile) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }, 350);

            if (hintIndex < hints.length - 1) {
                revealHint();
            } else {
                saveGameResult(
                    currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple",
                    currentGameNumber.includes("- Private") ? currentGameId : currentGameNumber.replace("Game #", ""),
                    secretWord,
                    "X"
                );
                endGame(false, false);
            }
        }
    }

    // Reveal hint
    function revealHint() {
        if (hintIndex >= hints.length) {
            console.log("No more hints to reveal");
            return;
        }
        const hintId = hintRevealOrder[hintIndex];
        const hintElement = document.getElementById(hintId);
        if (hintElement) {
            const hintTextElement = hintElement.querySelector(".hint-text");
            if (hintTextElement) {
                hintTextElement.textContent = hints[hintIndex];
            }
            const styles = hintStyles[hintIndex];
            hintElement.className = `hint ${styles.shape} ${styles.color} reveal-${styles.effect}`;
            hintElement.style.display = "flex";
            console.log(`Revealed hint ${hintIndex + 1}:`, hints[hintIndex], "with styles:", styles);
            hintIndex++;
        }
    }

    // Reset hints
    function resetHints() {
        console.log("Resetting hints");
        hintIndex = 0;
        const hintElements = document.querySelectorAll(".hint");
        hintElements.forEach(element => {
            element.style.display = "none";
            element.className = "hint";
        });
        randomizeHintStyles();
    }

    // Reset game
    function resetGame() {
        console.log("Resetting game state");
        gameOver = false;
        guessCount = 0;
        guesses = [];
        gaveUp = false;
        isProcessingGuess = false;
        firstGuessMade = false;
        if (animationTimeout) {
            clearTimeout(animationTimeout);
            animationTimeout = null;
        }
        resetHints();
        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
            if (!isMobile) {
                guessInput.focus();
            }
            activeInput = guessInput;
        }
        if (guessBtn) {
            guessBtn.disabled = false;
        }
        if (guessInputContainer) {
            guessInputContainer.classList.remove("wrong-guess");
        }
        if (keyboardContainer) {
            keyboardContainer.classList.remove("wrong-guess");
        }
        if (gameControlsContainer) {
            gameControlsContainer.classList.remove("wrong-guess");
        }
        if (guessesLink) {
            guessesLink.textContent = "Guesses: 0/5";
        }
        gameScreen.classList.remove("game-ended");
        document.querySelectorAll(".pineapple-piece").forEach(piece => piece.remove());
        showKeyboard();
        adjustBackground();
    }

    // Save game result
    function saveGameResult(gameType, gameNumber, secretWord, guessCount) {
        console.log("Saving game result:", { gameType, gameNumber, secretWord, guessCount });
        // Placeholder for saving game result (e.g., to localStorage or server)
    }

    // End game
    function endGame(won, showPineappleRain = true) {
        console.log("Ending game:", { won, showPineappleRain });
        gameOver = true;
        if (guessInput) {
            guessInput.disabled = true;
        }
        if (guessBtn) {
            guessBtn.disabled = true;
        }
        gameScreen.classList.add("game-ended");
        const gameOverScreen = document.getElementById("game-over");
        const gameOverMessage = document.getElementById("game-over-message");
        const secretWordMessage = document.getElementById("secret-word-message");
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");

        if (gameOverScreen) {
            resetScreenDisplays(gameOverScreen);
            gameOverScreen.style.display = "flex";
            gameOverScreen.classList.add("active");
        }

        if (gameOverMessage) {
            gameOverMessage.textContent = won ? "You won! Great job!" : gaveUp ? "You gave up!" : "Game Over!";
        }

        if (secretWordMessage) {
            secretWordMessage.textContent = `The word was: ${secretWord}`;
        }

        if (shareText) {
            const guessDisplay = guessCount === 0 || gaveUp ? "X" : guessCount;
            shareText.innerHTML = `I got <span class="guess-count">${guessDisplay}/5</span> on this Pineapple!`;
        }

        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }

        if (won && showPineappleRain) {
            startPineappleRain();
        }

        if (isMobile) {
            keyboardContainer.style.display = "none";
        }
    }

    // Start pineapple rain
    function startPineappleRain() {
        console.log("Starting pineapple rain");
        const container = document.createElement("div");
        container.className = "pineapple-rain";
        document.body.appendChild(container);

        const emojis = ["🍍", "🥳", "🎉"];
        const count = 20;

        for (let i = 0; i < count; i++) {
            const piece = document.createElement("div");
            piece.className = "pineapple-piece";
            piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.animationDuration = `${Math.random() * 2 + 2}s`;
            piece.style.animationDelay = `${Math.random() * 0.5}s`;
            piece.style.setProperty("--rotation", `${Math.random() * 360}deg`);
            piece.style.setProperty("--drift", Math.random() * 2 - 1);
            container.appendChild(piece);

            setTimeout(() => {
                piece.remove();
                if (i === count - 1) {
                    container.remove();
                }
            }, 2500 + parseFloat(piece.style.animationDelay) * 1000);
        }
    }

    // Load game data
    async function loadGameData(gameNumber, isPrivate = false, gameId = null) {
        console.log("Loading game data:", { gameNumber, isPrivate, gameId });
        isLoadingGame = true;
        try {
            let data;
            if (isPrivate && gameId) {
                const response = await fetch(`${webAppUrl}?action=getGame&gameId=${gameId}`);
                const result = await response.json();
                data = result.data ? [result.data] : [];
            } else {
                const url = isPrivate ? privateUrl : officialUrl;
                const response = await fetch(url);
                const csvText = await response.text();
                data = csvText.split("\n").slice(1).map(row => {
                    const cols = row.split(",");
                    return {
                        gameNumber: cols[0],
                        secretWord: cols[1],
                        hints: cols.slice(2, 7),
                        background: cols[7] || defaultBackground
                    };
                });
            }

            const game = data.find(g => (isPrivate ? g.gameId === gameId : g.gameNumber === gameNumber));
            if (!game) {
                console.error("Game not found");
                return null;
            }

            return {
                secretWord: game.secretWord?.trim().toUpperCase() || "",
                hints: game.hints?.map(h => h?.trim().toUpperCase() || "") || [],
                background: game.background?.trim() || defaultBackground,
                gameId: game.gameId || null
            };
        } catch (error) {
            console.error("Error loading game data:", error);
            return null;
        } finally {
            isLoadingGame = false;
        }
    }

    // Initialize game
    async function initializeGame(gameNumber, isPrivate = false, gameId = null) {
        console.log("Initializing game:", { gameNumber, isPrivate, gameId });
        resetGame();
        currentGameNumber = isPrivate ? `Game - Private` : `Game #${gameNumber}`;
        currentGameId = gameId;
        if (gameNumberText) {
            gameNumberText.textContent = currentGameNumber;
        }

        const gameData = await loadGameData(gameNumber, isPrivate, gameId);
        if (!gameData) {
            console.error("Failed to load game data");
            return;
        }

        secretWord = gameData.secretWord;
        hints = gameData.hints;
        currentBackground = await preloadBackground(gameData.background);
        adjustBackground();
        console.log("Game initialized with:", { secretWord, hints, currentBackground });
    }

    // Load game lists
    async function loadGameLists() {
        console.log("Loading game lists");
        try {
            const [officialResponse, privateResponse] = await Promise.all([
                fetch(officialUrl),
                fetch(privateUrl)
            ]);
            const officialText = await officialResponse.text();
            const privateText = await privateResponse.text();

            allGames = officialText.split("\n").slice(1).map(row => {
                const cols = row.split(",");
                return { gameNumber: cols[0], secretWord: cols[1] };
            });
            privateGames = privateText.split("\n").slice(1).map(row => {
                const cols = row.split(",");
                return { gameId: cols[0], secretWord: cols[1] };
            });

            console.log("Loaded games:", { allGames, privateGames });
        } catch (error) {
            console.error("Error loading game lists:", error);
        }
    }

    // Populate game lists
    function populateGameLists() {
        console.log("Populating game lists");
        if (officialContent) {
            officialContent.innerHTML = "";
            allGames.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                row.innerHTML = `
                    <span>Game #${game.gameNumber}</span>
                    <span class="play-now">Play Now</span>
                    <span>${game.secretWord}</span>
                `;
                row.querySelector(".play-now").addEventListener("click", () => {
                    resetScreenDisplays(gameScreen);
                    initializeGame(game.gameNumber);
                });
                row.querySelector(".play-now").addEventListener("touchstart", (e) => {
                    e.preventDefault();
                    if (!touchMoved) {
                        resetScreenDisplays(gameScreen);
                        initializeGame(game.gameNumber);
                    }
                });
                officialContent.appendChild(row);
            });
        }

        if (privateContent) {
            privateContent.innerHTML = "";
            privateGames.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                row.innerHTML = `
                    <span>Game - Private</span>
                    <span class="play-now">Play Now</span>
                    <span>${game.secretWord}</span>
                `;
                row.querySelector(".play-now").addEventListener("click", () => {
                    resetScreenDisplays(gameScreen);
                    initializeGame(null, true, game.gameId);
                });
                row.querySelector(".play-now").addEventListener("touchstart", (e) => {
                    e.preventDefault();
                    if (!touchMoved) {
                        resetScreenDisplays(gameScreen);
                        initializeGame(null, true, game.gameId);
                    }
                });
                privateContent.appendChild(row);
            });
        }
    }

    // Setup tabs
    if (officialTab && privateTab && officialContent && privateContent) {
        officialTab.addEventListener("click", () => {
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            privateContent.classList.remove("active");
        });
        privateTab.addEventListener("click", () => {
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            officialContent.classList.remove("active");
        });
        officialTab.addEventListener("touchstart", (e) => {
            e.preventDefault();
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            privateContent.classList.remove("active");
        });
        privateTab.addEventListener("touchstart", (e) => {
            e.preventDefault();
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            officialContent.classList.remove("active");
        });
    }

    // All games link
    if (allGamesLink) {
        const handler = (e) => {
            e.preventDefault();
            console.log("All games link triggered");
            if (isUILocked || isLoadingGame) {
                console.log("All games link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameSelectContent);
            populateGameLists();
            setTimeout(() => { isUILocked = false; }, 500);
        };
        allGamesLink.addEventListener("click", handler);
        allGamesLink.addEventListener("touchstart", handler);
    }

    // Official back button
    if (officialBackBtn) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Official back button triggered");
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            privateContent.classList.remove("active");
        };
        officialBackBtn.addEventListener("click", handler);
        officialBackBtn.addEventListener("touchstart", handler);
    }

    // Private back button
    if (privateBackBtn) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Private back button triggered");
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            officialContent.classList.remove("active");
        };
        privateBackBtn.addEventListener("click", handler);
        privateBackBtn.addEventListener("touchstart", handler);
    }

    // Create pineapple button
    if (createPineappleBtn) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Create pineapple button triggered");
            resetScreenDisplays(formContent);
            if (isMobile) {
                showKeyboard();
            }
            activeInput = formInputs[0];
            if (activeInput && !isMobile) activeInput.focus();
        };
        createPineappleBtn.addEventListener("click", handler);
        createPineappleBtn.addEventListener("touchstart", handler);
    }

    // Create pineapple end link
    if (createPineappleLink) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Create pineapple end link triggered");
            resetScreenDisplays(formContent);
            if (isMobile) {
                showKeyboard();
            }
            activeInput = formInputs[0];
            if (activeInput && !isMobile) activeInput.focus();
        };
        createPineappleLink.addEventListener("click", handler);
        createPineappleLink.addEventListener("touchstart", handler);
    }

    // Form back button
    if (formBackBtn) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Form back button triggered");
            resetScreenDisplays(gameSelectContent);
            populateGameLists();
        };
        formBackBtn.addEventListener("click", handler);
        formBackBtn.addEventListener("touchstart", handler);
    }

    // Confirm button
    if (confirmBtn) {
        const handler = async (e) => {
            e.preventDefault();
            console.log("Confirm button triggered");
            const formData = {
                gameName: formInputs[0].value.trim().toUpperCase(),
                secretWord: formInputs[1].value.trim().toUpperCase(),
                hints: formInputs.slice(2).map(input => input.value.trim().toUpperCase())
            };
            console.log("Form data:", formData);

            if (!formData.secretWord || formData.hints.some(hint => !hint)) {
                formErrorMessage.textContent = "Please fill in all fields.";
                formErrorDialog.style.display = "flex";
                return;
            }

            try {
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "createGame", ...formData })
                });
                const result = await response.json();
                if (result.success) {
                    resetScreenDisplays(gameScreen);
                    await initializeGame(null, true, result.gameId);
                } else {
                    formErrorMessage.textContent = result.message || "Error creating game.";
                    formErrorDialog.style.display = "flex";
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                formErrorMessage.textContent = "Network error. Please try again.";
                formErrorDialog.style.display = "flex";
            }
        };
        confirmBtn.addEventListener("click", handler);
        confirmBtn.addEventListener("touchstart", handler);
    }

    // Form error OK button
    if (formErrorOkBtn) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Form error OK button triggered");
            formErrorDialog.style.display = "none";
        };
        formErrorOkBtn.addEventListener("click", handler);
        formErrorOkBtn.addEventListener("touchstart", handler);
    }

    // Guesses link
    if (guessesLink) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Guesses link triggered");
            if (isMobile) {
                keyboardContainer.classList.add("show-guesses");
                keyboardContent.style.display = "none";
                keyboardGuessesContent.style.display = "flex";
                keyboardGiveUpContent.style.display = "none";
                keyboardBackBtn.style.display = "block";
            } else {
                guessesScreen.style.display = "flex";
            }
            const guessesList = document.getElementById("guesses-list");
            if (guessesList) {
                guessesList.innerHTML = guesses.length ? guesses.join(" • ") : "No guesses yet.";
            }
        };
        guessesLink.addEventListener("click", handler);
        guessesLink.addEventListener("touchstart", handler);
    }

    // Guesses close button
    if (guessesCloseBtn) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Guesses close button triggered");
            guessesScreen.style.display = "none";
        };
        guessesCloseBtn.addEventListener("click", handler);
        guessesCloseBtn.addEventListener("touchstart", handler);
    }

    // Give up link
    if (giveUpLink) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Give up link triggered");
            if (isMobile) {
                keyboardContainer.classList.add("show-give-up");
                keyboardContent.style.display = "none";
                keyboardGuessesContent.style.display = "none";
                keyboardGiveUpContent.style.display = "flex";
                keyboardBackBtn.style.display = "block";
            } else {
                giveUpDialog.style.display = "flex";
            }
        };
        giveUpLink.addEventListener("click", handler);
        giveUpLink.addEventListener("touchstart", handler);
    }

    // Give up yes button
    if (giveUpYesBtn) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Give up yes button triggered");
            gaveUp = true;
            saveGameResult(
                currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple",
                currentGameNumber.includes("- Private") ? currentGameId : currentGameNumber.replace("Game #", ""),
                secretWord,
                "X"
            );
            endGame(false, false);
            giveUpDialog.style.display = "none";
            showKeyboard();
        };
        giveUpYesBtn.addEventListener("click", handler);
        giveUpYesBtn.addEventListener("touchstart", handler);
    }

    // Give up no button
    if (giveUpNoBtn) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Give up no button triggered");
            giveUpDialog.style.display = "none";
            showKeyboard();
        };
        giveUpNoBtn.addEventListener("click", handler);
        giveUpNoBtn.addEventListener("touchstart", handler);
    }

    // Next game button (end screen)
    if (nextGameBtnEnd) {
        const handler = async (e) => {
            e.preventDefault();
            console.log("Next game button (end) triggered");
            const currentNum = parseInt(currentGameNumber.replace("Game #", ""));
            const nextGameNumber = currentNum + 1;
            if (allGames.some(game => game.gameNumber === nextGameNumber.toString())) {
                resetScreenDisplays(gameScreen);
                await initializeGame(nextGameNumber.toString());
            } else {
                console.log("No next game available");
            }
        };
        nextGameBtnEnd.addEventListener("click", handler);
        nextGameBtnEnd.addEventListener("touchstart", handler);
    }

    // Previous game arrow
    if (prevGameArrow) {
        const handler = async (e) => {
            e.preventDefault();
            console.log("Previous game arrow triggered");
            const currentNum = parseInt(currentGameNumber.replace("Game #", ""));
            const prevGameNumber = currentNum - 1;
            if (prevGameNumber > 0 && allGames.some(game => game.gameNumber === prevGameNumber.toString())) {
                resetScreenDisplays(gameScreen);
                await initializeGame(prevGameNumber.toString());
            } else {
                console.log("No previous game available");
                prevGameArrow.classList.add("disabled");
            }
        };
        prevGameArrow.addEventListener("click", handler);
        prevGameArrow.addEventListener("touchstart", handler);
    }

    // Next game arrow
    if (nextGameArrow) {
        const handler = async (e) => {
            e.preventDefault();
            console.log("Next game arrow triggered");
            const currentNum = parseInt(currentGameNumber.replace("Game #", ""));
            const nextGameNumber = currentNum + 1;
            if (allGames.some(game => game.gameNumber === nextGameNumber.toString())) {
                resetScreenDisplays(gameScreen);
                await initializeGame(nextGameNumber.toString());
            } else {
                console.log("No next game available");
                nextGameArrow.classList.add("disabled");
            }
        };
        nextGameArrow.addEventListener("click", handler);
        nextGameArrow.addEventListener("touchstart", handler);
    }

    // Touch handling for game lists
    const gameLists = [officialContent, privateContent].filter(Boolean);
    gameLists.forEach(list => {
        list.addEventListener("touchstart", (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchMoved = false;
        });
        list.addEventListener("touchmove", (e) => {
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;
            if (Math.abs(deltaX) > touchThreshold || Math.abs(deltaY) > touchThreshold) {
                touchMoved = true;
            }
        });
    });

    // Initialize
    console.log("Starting initialization");
    await loadGameLists();
    await initializeGame("1");
    console.log("Initialization complete");
});