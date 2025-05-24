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
    const hintShapes = ['cloud', 'sun', 'aviator', 'speech-bubble', 'fluffy-cloud'];
    const hintColors = [
        'color-1', // rgba(255, 105, 180, 0.7) - Hot Pink
        'color-2', // rgba(255, 215, 0, 0.7) - Gold
        'color-3', // rgba(50, 205, 50, 0.7) - Lime Green
        'color-4', // rgba(135, 206, 235, 0.7) - Sky Blue
        'color-5', // rgba(255, 165, 0, 0.7) - Orange
        'color-6', // rgba(138, 43, 226, 0.7) - Blue Violet
        'color-7', // rgba(255, 69, 0, 0.7) - Orange Red
        'color-8', // rgba(75, 0, 130, 0.7) - Indigo
        'color-9', // rgba(0, 191, 255, 0.7) - Deep Sky Blue
        'color-10' // rgba(255, 20, 147, 0.7) - Deep Pink
    ];
    const hintRevealEffects = [
        'pop', 'stretch', 'zoom', 'bounce', 'spin',
        'slide-left', 'slide-right', 'slide-up', 'slide-down', 'splash'
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
        const availableColors = shuffleArray([...hintColors]); // Fresh shuffle each time
        const shuffledEffects = shuffleArray([...hintRevealEffects]);
        for (let i = 0; i < 5; i++) {
            const shape = hintShapes[i % hintShapes.length];
            const color = availableColors[i % availableColors.length];
            const effect = shuffledEffects[i % shuffledEffects.length];
            hintStyles.push({ shape: `hint-shape-${shape}`, color: `hint-color-${color}`, effect });
        }
        console.log("Assigned randomized hint styles:", hintStyles);
    }

    // Debounce utility
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
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
                key.removeEventListener("touchstart", key._touchHandler);
            }
            const clickHandler = debounce(() => {
                console.log("Key clicked:", key.textContent, { gameOver, isProcessingGuess, activeInput: activeInput?.id });
                if (gameOver || isProcessingGuess || !activeInput || activeInput.disabled) {
                    console.log("Key click ignored due to state");
                    return;
                }
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
            }, 100);
            key._clickHandler = clickHandler;
            key._touchHandler = (e) => {
                e.preventDefault();
                clickHandler();
            };
            key.addEventListener("click", clickHandler);
            key.addEventListener("touchstart", key._touchHandler);
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
                console.log("Triggered guesses content, showing keyboard");
                showKeyboard();
            }
        };
        keyboardGuessesContent.addEventListener("click", handler);
        keyboardGuessesContent.addEventListener("touchstart", handler);
    }

    // Keyboard give-up content
    if (keyboardGiveUpContent) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === keyboardGiveUpContent || e.target.classList.contains("dialog-message")) {
                console.log("Triggered give-up content, showing keyboard");
                showKeyboard();
            }
        };
        keyboardGiveUpContent.addEventListener("click", handler);
        keyboardGiveUpContent.addEventListener("touchstart", handler);
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
            setupKeyboardListeners();
        });

        privateTab.addEventListener("click", () => {
            console.log("Private tab clicked");
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            privateContent.style.display = "flex";
            officialContent.classList.remove("active");
            officialContent.style.display = "none";
            displayGameList();
            setupKeyboardListeners();
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
            if (isMobile) {
                if (keyboardContainer && keyboardContent && keyboardGiveUpContent && keyboardBackBtn) {
                    keyboardContainer.classList.add("show-alternate", "show-give-up");
                    keyboardContent.style.display = "none";
                    keyboardGuessesContent.style.display = "none";
                    keyboardGiveUpContent.style.display = "flex";
                    keyboardBackBtn.style.display = "none";
                    console.log("Showing give-up content in keyboard container");
                }
            } else {
                if (giveUpDialog) {
                    giveUpDialog.style.display = "flex";
                    console.log("Showing give-up dialog");
                }
            }
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
            if (isMobile) {
                showKeyboard();
            } else {
                if (giveUpDialog) giveUpDialog.style.display = "none";
            }
            endGame(false, true);
        });

        giveUpNoBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up No button clicked");
            if (isMobile) {
                showKeyboard();
            } else {
                if (giveUpDialog) giveUpDialog.style.display = "none";
            }
            if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
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
            console.log("Guesses link triggered", { isUILocked, isLoadingGame, guesses, guessCount });
            if (isUILocked || isLoadingGame) {
                console.log("Guesses link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            const guessesList = document.getElementById("guesses-list");
            const keyboardGuessesList = keyboardGuessesContent.querySelector("#guesses-list");
            if (!guessesList || !keyboardGuessesList) {
                console.error("guesses-list element not found in DOM");
                isUILocked = false;
                return;
            }
            const guessesContent = guesses.length > 0
                ? guesses.map(g => g.toUpperCase()).join(' <span class="separator yellow">|</span> ')
                : "No guesses yet!";
            guessesList.innerHTML = guessesContent;
            keyboardGuessesList.innerHTML = guessesContent;
            console.log("Rendered guesses:", guessesContent);
            guessesList.style.display = "block";
            keyboardGuessesList.style.display = "block";
            if (isMobile) {
                if (keyboardContainer && keyboardContent && keyboardGuessesContent && keyboardBackBtn) {
                    keyboardContainer.classList.add("show-alternate", "show-guesses");
                    keyboardContent.style.display = "none";
                    keyboardGuessesContent.style.display = "flex";
                    keyboardGiveUpContent.style.display = "none";
                    keyboardBackBtn.style.display = "block";
                    keyboardGuessesContent.offsetHeight;
                    console.log("Showing mobile guesses content, guessesList:", guessesList.innerHTML);
                }
            } else {
                guessesScreen.style.display = "flex";
                console.log("Showing desktop guesses screen, guessesList:", guessesList.innerHTML);
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100));

        guessesScreen.addEventListener("click", (e) => {
            if (e.target === guessesScreen && !isMobile) {
                console.log("Clicked outside guesses screen");
                guessesScreen.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
        });
    }

    // Previous game arrow
    if (prevGameArrow) {
        prevGameArrow.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Previous game arrow triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Previous game arrow ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;
            prevGameArrow.style.opacity = "0.7";
            try {
                if (!currentGameNumber || !currentGameId) {
                    throw new Error("No current game number or ID set");
                }
                let currentIndex;
                let gameList;
                let isPrivate = currentGameNumber.includes("- Private");
                if (isPrivate) {
                    currentIndex = privateGames.findIndex(game => game["Game Number"] === currentGameId);
                    gameList = privateGames;
                } else {
                    currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber.replace("Game #", ""));
                    gameList = allGames;
                }
                console.log("Navigation details", { isPrivate, currentIndex, gameListLength: gameList.length });
                if (currentIndex === -1) {
                    throw new Error(`Current game not found in game list: ${currentGameNumber}, ID: ${currentGameId}`);
                }
                if (currentIndex < gameList.length - 1) {
                    const targetGame = gameList[currentIndex + 1];
                    console.log("Loading previous game", { currentIndex, targetIndex: currentIndex + 1, targetGame });
                    currentBackground = targetGame["Background"] && targetGame["Background"].trim() !== "" ? targetGame["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(targetGame);
                    resetScreenDisplays(gameScreen);
                    gameScreen.style.display = "flex";
                    adjustBackground();
                    if (isMobile && !gameOver) showKeyboard();
                    updateArrowStates(currentIndex + 1, gameList);
                } else {
                    console.log("At the oldest game, cannot go to previous");
                    prevGameArrow.classList.add("disabled");
                }
            } catch (error) {
                console.error("Error navigating to previous game:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to load previous game.";
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
                prevGameArrow.style.opacity = "1";
            }
        });
    }

        // Next game arrow
    if (nextGameArrow) {
        nextGameArrow.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next game arrow triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Next game arrow ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;
            nextGameArrow.style.opacity = "0.7";
            try {
                if (!currentGameNumber || !currentGameId) {
                    throw new Error("No current game number or ID set");
                }
                let currentIndex;
                let gameList;
                let isPrivate = currentGameNumber.includes("- Private");
                if (isPrivate) {
                    currentIndex = privateGames.findIndex(game => game["Game Number"] === currentGameId);
                    gameList = privateGames;
                } else {
                    currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber.replace("Game #", ""));
                    gameList = allGames;
                }
                console.log("Navigation details", { isPrivate, currentIndex, gameListLength: gameList.length });
                if (currentIndex === -1) {
                    throw new Error(`Current game not found in game list: ${currentGameNumber}, ID: ${currentGameId}`);
                }
                if (currentIndex > 0) {
                    const targetGame = gameList[currentIndex - 1];
                    console.log("Loading next game", { currentIndex, targetIndex: currentIndex - 1, targetGame });
                    currentBackground = targetGame["Background"] && targetGame["Background"].trim() !== "" ? targetGame["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(targetGame);
                    resetScreenDisplays(gameScreen);
                    gameScreen.style.display = "flex";
                    adjustBackground();
                    if (isMobile && !gameOver) showKeyboard();
                    updateArrowStates(currentIndex - 1, gameList);
                } else {
                    console.log("At the newest game, cannot go to next");
                    nextGameArrow.classList.add("disabled");
                }
            } catch (error) {
                console.error("Error navigating to next game:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to load next game.";
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
                nextGameArrow.style.opacity = "1";
            }
        });
    }

    // Form error dialog OK button
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener("click", () => {
            console.log("Form error OK button clicked");
            if (formErrorDialog) {
                formErrorDialog.style.display = "none";
            }
            if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        });
    }

    // Guesses close button
    if (guessesCloseBtn) {
        guessesCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button clicked");
            if (guessesScreen) {
                guessesScreen.style.display = "none";
            }
            if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        });
    }

    // Create Pineapple button
    if (createPineappleBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Create Pineapple ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                input.value = "";
                input.disabled = false;
            });
            if (confirmBtn) confirmBtn.disabled = false;
            if (isMobile) {
                showKeyboard();
                activeInput = formInputs[0];
            } else {
                formInputs[0].focus();
                activeInput = formInputs[0];
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        createPineappleBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Create Pineapple link (end screen)
    if (createPineappleLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple link (end screen) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Create Pineapple link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                input.value = "";
                input.disabled = false;
            });
            if (confirmBtn) confirmBtn.disabled = false;
            if (isMobile) {
                showKeyboard();
                activeInput = formInputs[0];
            } else {
                formInputs[0].focus();
                activeInput = formInputs[0];
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        createPineappleLink.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Form back button
    if (formBackBtn) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Form back ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            if (isMobile) {
                showKeyboard();
                activeInput = guessInput;
            } else {
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
            setTimeout(() => { isUILocked = false; }, 500);
        };
        formBackBtn.addEventListener("click", handler);
        formBackBtn.addEventListener("touchstart", handler);
    }

    // Official back button
    if (officialBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Official back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Official back ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            if (isMobile) {
                showKeyboard();
                activeInput = guessInput;
            } else {
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        officialBackBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Private back button
    if (privateBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Private back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Private back ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            if (isMobile) {
                showKeyboard();
                activeInput = guessInput;
            } else {
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        privateBackBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Next game button (end screen)
    if (nextGameBtnEnd) {
        const handler = debounce(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next game button (end screen) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Next game button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;
            try {
                if (!currentGameNumber || !currentGameId) {
                    throw new Error("No current game number or ID set");
                }
                let currentIndex;
                let gameList;
                let isPrivate = currentGameNumber.includes("- Private");
                if (isPrivate) {
                    currentIndex = privateGames.findIndex(game => game["Game Number"] === currentGameId);
                    gameList = privateGames;
                } else {
                    currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber.replace("Game #", ""));
                    gameList = allGames;
                }
                console.log("Next game navigation", { isPrivate, currentIndex, gameListLength: gameList.length });
                if (currentIndex === -1) {
                    throw new Error(`Current game not found in game list: ${currentGameNumber}, ID: ${currentGameId}`);
                }
                if (currentIndex > 0) {
                    const targetGame = gameList[currentIndex - 1];
                    console.log("Loading next game from end screen", { currentIndex, targetIndex: currentIndex - 1, targetGame });
                    currentBackground = targetGame["Background"] && targetGame["Background"].trim() !== "" ? targetGame["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(targetGame);
                    resetScreenDisplays(gameScreen);
                    adjustBackground();
                    if (isMobile && !gameOver) showKeyboard();
                    updateArrowStates(currentIndex - 1, gameList);
                } else {
                    console.log("At the newest game, cannot load next");
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "This is the latest game.";
                        formErrorDialog.style.display = "flex";
                    }
                }
            } catch (error) {
                console.error("Error loading next game from end screen:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to load next game.";
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
            }
        }, 100);
        nextGameBtnEnd.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Confirm button
    if (confirmBtn) {
        const handler = debounce(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Confirm button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Confirm button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;
            confirmBtn.disabled = true;
            try {
                const gameName = formInputs[0].value.trim().toUpperCase();
                const secretWordInput = formInputs[1].value.trim().toUpperCase();
                const hintInputs = formInputs.slice(2).map(input => input.value.trim().toUpperCase());

                console.log("Form data collected", { gameName, secretWord: secretWordInput, hints: hintInputs });

                if (!gameName || !secretWordInput || !hintInputs.every(hint => hint)) {
                    throw new Error("All fields must be filled.");
                }
                if (!/^[A-Z]{4}$/.test(secretWordInput)) {
                    throw new Error("Secret word must be exactly 4 letters (A-Z).");
                }
                if (hintInputs.some(hint => !/^[A-Z\s'-]{1,20}$/.test(hint))) {
                    throw new Error("Hints must be 1-20 characters (A-Z, spaces, apostrophes, or hyphens).");
                }
                if (gameName.length > 50) {
                    throw new Error("Game name must be 50 characters or less.");
                }

                const formData = new FormData();
                formData.append("Game Name", gameName);
                formData.append("Secret Word", secretWordInput);
                hintInputs.forEach((hint, index) => {
                    formData.append(`Hint ${index + 1}`, hint);
                });

                console.log("Submitting form data to web app");
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    body: formData,
                    mode: "cors"
                });

                if (!response.ok) {
                    throw new Error(`Failed to submit game: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                console.log("Form submission response:", result);

                if (result.status !== "success") {
                    throw new Error(result.message || "Failed to create game.");
                }

                const newGame = {
                    "Game Name": gameName,
                    "Secret Word": secretWordInput,
                    "Hint 1": hintInputs[0],
                    "Hint 2": hintInputs[1],
                    "Hint 3": hintInputs[2],
                    "Hint 4": hintInputs[3],
                    "Hint 5": hintInputs[4],
                    "Game Number": `P${Date.now()}-${privateGames.length}`,
                    "Display Name": `Game #${privateGames.length + 1} - ${gameName}`,
                    "Background": defaultBackground
                };

                privateGames.unshift(newGame);
                console.log("Added new private game:", newGame);

                currentBackground = defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(newGame);
                resetScreenDisplays(gameScreen);
                adjustBackground();
                if (isMobile) showKeyboard();
                updateArrowStates(0, privateGames);
            } catch (error) {
                console.error("Error submitting form:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = error.message;
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
                confirmBtn.disabled = false;
            }
        }, 100);
        confirmBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Display game list
    function displayGameList() {
        console.log("Displaying game list");
        if (!officialContent || !privateContent) {
            console.error("Game list containers not found");
            return;
        }
        officialContent.innerHTML = '<span>Official Games</span><div class="game-list"></div>';
        privateContent.innerHTML = '<span>Private Games</span><div class="game-list"></div>';

        const officialList = officialContent.querySelector(".game-list");
        const privateList = privateContent.querySelector(".game-list");

        allGames.forEach((game, index) => {
            const row = document.createElement("div");
            row.classList.add("game-list-row");
            row.innerHTML = `
                <span>${game["Game Number"]}</span>
                <span>${game["Hint 1"] || ""}</span>
                <span class="play-now">Play Now!</span>
            `;
            row.querySelector(".play-now").addEventListener(isMobile ? "touchstart" : "click", debounce(async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Play Now clicked for official game", { index, gameNumber: game["Game Number"] });
                if (isUILocked || isLoadingGame) {
                    console.log("Play Now ignored: UI locked or game loading");
                    return;
                }
                isUILocked = true;
                isLoadingGame = true;
                try {
                    currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(game);
                    resetScreenDisplays(gameScreen);
                    adjustBackground();
                    if (isMobile && !gameOver) showKeyboard();
                    updateArrowStates(index, allGames);
                } catch (error) {
                    console.error("Error loading official game:", error.message);
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "Failed to load game.";
                        formErrorDialog.style.display = "flex";
                    }
                } finally {
                    isUILocked = false;
                    isLoadingGame = false;
                }
            }, 100));
            if (isMobile) {
                row.addEventListener("touchstart", (e) => {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    touchMoved = false;
                });
                row.addEventListener("touchmove", (e) => {
                    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                    if (deltaX > touchThreshold || deltaY > touchThreshold) {
                        touchMoved = true;
                    }
                });
                row.addEventListener("touchend", (e) => {
                    if (!touchMoved) {
                        row.querySelector(".play-now").dispatchEvent(new Event("touchstart"));
                    }
                });
            }
            officialList.appendChild(row);
        });

        privateGames.forEach((game, index) => {
            const row = document.createElement("div");
            row.classList.add("game-list-row");
            row.innerHTML = `
                <span>${game["Display Name"]}</span>
                <span>${game["Hint 1"] || ""}</span>
                <span class="play-now">Play Now!</span>
            `;
            row.querySelector(".play-now").addEventListener(isMobile ? "touchstart" : "click", debounce(async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Play Now clicked for private game", { index, gameNumber: game["Game Number"] });
                if (isUILocked || isLoadingGame) {
                    console.log("Play Now ignored: UI locked or game loading");
                    return;
                }
                isUILocked = true;
                isLoadingGame = true;
                try {
                    currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(game);
                    resetScreenDisplays(gameScreen);
                    adjustBackground();
                    if (isMobile && !gameOver) showKeyboard();
                    updateArrowStates(index, privateGames);
                } catch (error) {
                    console.error("Error loading private game:", error.message);
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "Failed to load game.";
                        formErrorDialog.style.display = "flex";
                    }
                } finally {
                    isUILocked = false;
                    isLoadingGame = false;
                }
            }, 100));
            if (isMobile) {
                row.addEventListener("touchstart", (e) => {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    touchMoved = false;
                });
                row.addEventListener("touchmove", (e) => {
                    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                    if (deltaX > touchThreshold || deltaY > touchThreshold) {
                        touchMoved = true;
                    }
                });
                row.addEventListener("touchend", (e) => {
                    if (!touchMoved) {
                        row.querySelector(".play-now").dispatchEvent(new Event("touchstart"));
                    }
                });
            }
            privateList.appendChild(row);
        });

        console.log("Game lists rendered", { officialGames: allGames.length, privateGames: privateGames.length });
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
        if (isMobile) {
            keyboardContainer.style.display = "none";
        }
        activeInput = null;
    }

    // Update arrow states
    function updateArrowStates(currentIndex, gameList) {
        console.log("Updating arrow states", { currentIndex, gameListLength: gameList.length });
        if (prevGameArrow && nextGameArrow) {
            prevGameArrow.classList.toggle("disabled", currentIndex >= gameList.length - 1);
            nextGameArrow.classList.toggle("disabled", currentIndex <= 0);
        }
    }

    // Setup hints
    function setupHints() {
        console.log("Setting up hints:", hints, "hintIndex:", hintIndex, "hintStyles:", hintStyles);
        for (let i = 1; i <= 5; i++) {
            const hintElement = document.getElementById(`hint-${i}`);
            if (hintElement) {
                hintElement.style.display = "none";
                hintElement.innerHTML = "";
                hintElement.className = "hint";
                if (hintStyles[i - 1]) {
                    hintElement.classList.add(hintStyles[i - 1].shape, hintStyles[i - 1].color);
                }
            }
        }

        const visibleHints = hints.slice(0, hintIndex + 1);
        visibleHints.forEach((hint, index) => {
            const hintElement = document.getElementById(hintRevealOrder[index]);
            if (hintElement && hintStyles[index]) {
                const isFluffyCloudShape = hintStyles[index].shape === "hint-shape-fluffy-cloud";
                const hintContent = isFluffyCloudShape ? `<span class="hint-text">${hint}</span>` : hint;
                hintElement.innerHTML = hintContent;
                hintElement.style.display = "flex";
                const effect = hintStyles[index].effect;
                hintElement.classList.add(`reveal-${effect}`);
                setTimeout(() => {
                    hintElement.classList.remove(`reveal-${effect}`);
                }, 1000);
            }
        });
        console.log("Hints displayed:", visibleHints);
    }

    // Reveal hint
    function revealHint() {
        hintIndex++;
        console.log("Revealing hint, new hintIndex:", hintIndex, "total hints:", hints.length);
        if (hintIndex < hints.length) {
            const hintElement = document.getElementById(hintRevealOrder[hintIndex]);
            if (hintElement && hintStyles[hintIndex]) {
                const hint = hints[hintIndex];
                const isFluffyCloudShape = hintStyles[hintIndex].shape === "hint-shape-fluffy-cloud";
                const hintContent = isFluffyCloudShape ? `<span class="hint-text">${hint}</span>` : hint;
                hintElement.innerHTML = hintContent;
                hintElement.style.display = "flex";
                const effect = hintStyles[hintIndex].effect;
                hintElement.classList.add(`reveal-${effect}`);
                setTimeout(() => {
                    hintElement.classList.remove(`reveal-${effect}`);
                }, 1000);
                console.log("Revealed hint:", hint, "with effect:", effect);
            }
        }
    }

    // Handle guess
    async function handleGuess(guess) {
        console.log("Handling guess:", guess, { gameOver, isProcessingGuess, guessCount });
        if (gameOver || isProcessingGuess) {
            console.log("Guess ignored: game over or processing guess");
            return;
        }
        isProcessingGuess = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;
        guess = guess.trim().toUpperCase();

        if (!/^[A-Z]{1,10}$/.test(guess)) {
            console.log("Invalid guess format:", guess);
            guessInputContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                isProcessingGuess = false;
                guessInput.disabled = false;
                guessBtn.disabled = false;
                if (!isMobile) guessInput.focus();
                animationTimeout = null;
            }, 350);
            return;
        }

        guessCount++;
        guesses.push(guess);
        guessesLink.textContent = `Guesses: ${guessCount}/5`;
        console.log("Guess recorded", { guess, guessCount, guesses });

        if (!firstGuessMade) {
            firstGuessMade = true;
            console.log("First guess made, revealing first hint");
            revealHint();
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
            saveGameResult(gameType, normalizedGameNumber, secretWord, `Solved in ${guessCount} guess${guessCount === 1 ? "" : "es"}`);
            await endGame(true);
        } else {
            console.log("Incorrect guess");
            guessInputContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                guessInput.value = "";
                isProcessingGuess = false;
                guessInput.disabled = false;
                guessBtn.disabled = false;
                if (!isMobile) guessInput.focus();
                animationTimeout = null;

                if (guessCount >= 5) {
                    console.log("Max guesses reached");
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
                } else if (guessCount === hintIndex + 1 && hintIndex < hints.length - 1) {
                    console.log("Revealing next hint due to guess count");
                    revealHint();
                }
            }, 350);
        }
    }

    // Save game result
    function saveGameResult(gameType, gameNumber, secretWord, outcome) {
        console.log("Saving game result", { gameType, gameNumber, secretWord, outcome });
        try {
            localStorage.setItem(`${gameType}_${gameNumber}`, JSON.stringify({
                secretWord,
                outcome,
                guesses,
                guessCount,
                gaveUp
            }));
            console.log("Game result saved to localStorage");
        } catch (error) {
            console.error("Error saving game result:", error.message);
        }
    }

    // End game
    async function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp, secretWord, guessCount });
        gameOver = true;
        gameScreen.classList.add("game-ended");
        guessInput.disabled = true;
        guessBtn.disabled = true;
        guessesLink.textContent = `Guesses: ${guessCount}/5`;

        if (won) {
            console.log("Triggering pineapple rain");
            triggerPineappleRain();
        }

        const gameOverScreen = document.getElementById("game-over");
        const gameOverMessage = document.getElementById("game-over-message");
        const secretWordMessage = document.getElementById("secret-word-message");
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");

        if (gameOverScreen && gameOverMessage && secretWordMessage && shareText && gameNumberDisplay) {
            gameOverMessage.textContent = won ? "You Got It!" : gaveUp ? "Game Over" : "Out of Guesses!";
            secretWordMessage.textContent = `The secret word was ${secretWord}`;
            gameNumberDisplay.textContent = currentGameNumber;
            let shareMessage;
            if (won) {
                shareMessage = `I solved ${currentGameNumber} in ${guessCount} guess${guessCount === 1 ? "" : "es"}!`;
            } else if (gaveUp) {
                shareMessage = `I gave up on ${currentGameNumber}.`;
            } else {
                shareMessage = `I couldn't solve ${currentGameNumber}.`;
            }
            shareText.innerHTML = `${shareMessage} <span class="guess-count">Can you beat my ${guessCount} guess${guessCount === 1 ? "" : "es"}?</span>`;
            resetScreenDisplays(gameOverScreen);

            console.log("Configuring share buttons");
            const shareButtons = document.getElementById("share-buttons");
            if (shareButtons) {
                const twitterLink = shareButtons.querySelector('a[href*="twitter.com"]');
                const facebookLink = shareButtons.querySelector('a[href*="facebook.com"]');
                const shareUrl = window.location.href;
                const encodedShareText = encodeURIComponent(shareMessage);
                if (twitterLink) {
                    twitterLink.href = `https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodeURIComponent(shareUrl)}`;
                    console.log("Twitter share URL:", twitterLink.href);
                }
                if (facebookLink) {
                    facebookLink.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodedShareText}`;
                    console.log("Facebook share URL:", facebookLink.href);
                }
            }

            if (isMobile) {
                keyboardContainer.style.display = "none";
            }
        } else {
            console.error("Game over elements not found");
        }

        activeInput = null;
    }

    // Trigger pineapple rain
    function triggerPineappleRain() {
        console.log("Triggering pineapple rain animation");
        const container = document.createElement("div");
        container.classList.add("pineapple-rain");
        document.body.appendChild(container);

        const emoji = "🍍";
        const count = 20;
        const maxDuration = 3;
        const minDuration = 1;

        for (let i = 0; i < count; i++) {
            const piece = document.createElement("div");
            piece.classList.add("pineapple-piece");
            piece.textContent = emoji;
            piece.style.left = `${Math.random() * 100}%`;
            const duration = Math.random() * (maxDuration - minDuration) + minDuration;
            const rotation = Math.random() * 360;
            const drift = (Math.random() - 0.5) * 2;
            piece.style.setProperty("--rotation", `${rotation}deg`);
            piece.style.setProperty("--drift", drift);
            piece.style.animationDuration = `${duration}s`;
            piece.style.animationDelay = `${Math.random() * 0.5}s`;
            container.appendChild(piece);
        }

        setTimeout(() => {
            console.log("Removing pineapple rain");
            container.remove();
        }, maxDuration * 1000 + 500);
    }

    // Load game
    function loadGame(game) {
        console.log("Loading game:", game);
        gameOver = false;
        secretWord = game["Secret Word"]?.trim().toUpperCase() || "";
        hints = [
            game["Hint 1"]?.trim().toUpperCase() || "",
            game["Hint 2"]?.trim().toUpperCase() || "",
            game["Hint 3"]?.trim().toUpperCase() || "",
            game["Hint 4"]?.trim().toUpperCase() || "",
            game["Hint 5"]?.trim().toUpperCase() || ""
        ].filter(hint => hint);
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        guesses = [];
        gaveUp = false;
        isProcessingGuess = false;
        gameScreen.classList.remove("game-ended");
        guessInput.value = "";
        guessInput.disabled = false;
        guessBtn.disabled = false;
        guessesLink.textContent = "Guesses: 0/5";
        currentGameNumber = game["Display Name"] || `Game #${game["Game Number"]}`;
        currentGameId = game["Game Number"];
        gameNumberText.textContent = currentGameNumber;
        randomizeHintStyles();
        setupHints();
        console.log("Game loaded", { secretWord, hints, currentGameNumber, currentGameId });
        if (!isMobile && guessInput) {
            guessInput.focus();
            activeInput = guessInput;
        }
    }

    // Initial fetch and load
    async function fetchInitialData() {
        try {
            console.log("Fetching initial game data");
            const [officialResponse, privateResponse] = await Promise.all([
                fetch(officialUrl, {
                    method: "GET",
                    mode: "cors",
                    cache: "no-cache",
                    headers: { "Accept": "text/csv" }
                }).then(res => {
                    if (!res.ok) throw new Error(`Official fetch failed: ${res.status}`);
                    return res.text();
                }),
                fetch(privateUrl, {
                    method: "GET",
                    mode: "cors",
                    cache: "no-cache",
                    headers: { "Accept": "text/csv" }
                }).then(res => {
                    if (!res.ok) throw new Error(`Private fetch failed: ${res.status}`);
                    return res.text();
                })
            ]);

            // Parse official games
            if (!officialResponse.trim()) throw new Error("Empty official CSV response");
            const parsedOfficial = Papa.parse(officialResponse, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            allGames = parsedOfficial.data
                .filter(game => game["Game Number"] && game["Secret Word"])
                .sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            if (allGames.length === 0) throw new Error("No valid official games in CSV");

            // Parse private games
            const parsedPrivate = Papa.parse(privateResponse, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            privateGames = parsedPrivate.data
                .filter(game => game["Game Name"] && game["Secret Word"])
                .map((game, index) => ({
                    ...game,
                    "Game Number": `P${Date.now()}-${index}`,
                    "Display Name": `Game #${index + 1} - ${game["Game Name"]}`
                }))
                .sort((a, b) => {
                    const aTime = parseInt(a["Game Number"].split('-')[0].substring(1));
                    const bTime = parseInt(b["Game Number"].split('-')[0].substring(1));
                    return bTime - aTime;
                });

            const latestGame = allGames[0];
            currentBackground = latestGame["Background"] && latestGame["Background"].trim() !== "" ? latestGame["Background"] : defaultBackground;
            await preloadBackground(currentBackground);
            adjustBackground();
            loadGame(latestGame);
            resetScreenDisplays(gameScreen);
            showKeyboard();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
        } catch (error) {
            console.error("Error in fetchInitialData:", error.message);
            allGames = [
                {
                    "Game Number": "1",
                    "Secret Word": "TEST",
                    "Hint 1": "SAMPLE",
                    "Hint 2": "WORD",
                    "Hint 3": "GAME",
                    "Hint 4": "PLAY",
                    "Hint 5": "FUN",
                    "Background": defaultBackground
                }
            ];
            privateGames = [];
            currentBackground = defaultBackground;
            await preloadBackground(currentBackground);
            adjustBackground();
            loadGame(allGames[0]);
            resetScreenDisplays(gameScreen);
            showKeyboard();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load games. Using default game.";
                formErrorDialog.style.display = "flex";
            }
        } finally {
            isUILocked = false;
            isLoadingGame = false;
        }
    }

    // Start the game
    fetchInitialData();
});