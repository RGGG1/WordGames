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
    const hintShapes = ['cloud', 'sun', 'circle', 'speech-bubble', 'fluffy-cloud'];
    const hintColors = [
        'color-1',
        'color-2',
        'color-3',
        'color-4',
        'color-5',
        'color-6',
        'color-7',
        'color-8',
        'color-9',
        'color-10'
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
        const availableColors = shuffleArray([...hintColors]);
        const shuffledEffects = shuffleArray([...hintRevealEffects]);
        for (let i = 0; i < 5; i++) {
            const shape = i === 2 ? 'hint-shape-aviator-lens' : `hint-shape-${hintShapes[i]}`;
            const color = availableColors[i % availableColors.length];
            const effect = shuffledEffects[i % shuffledEffects.length];
            hintStyles.push({ shape, color, effect });
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

    // Create Pineapple button
    if (createPineappleBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Create Pineapple button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formContent.style.display = "flex";
            formContent.classList.add("active");
            adjustBackground();
            if (isMobile) showKeyboard();
            activeInput = document.getElementById("game-name-input") || guessInput;
            if (activeInput && !isMobile) activeInput.focus();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        createPineappleBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Create Pineapple link at game end
    if (createPineappleLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple link (end) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Create Pineapple link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formContent.style.display = "flex";
            formContent.classList.add("active");
            adjustBackground();
            if (isMobile) showKeyboard();
            activeInput = document.getElementById("game-name-input") || guessInput;
            if (activeInput && !isMobile) activeInput.focus();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        createPineappleLink.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Form back button
    if (formBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Form back button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            adjustBackground();
            showKeyboard();
            activeInput = guessInput;
            if (activeInput && !isMobile) activeInput.focus();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        formBackBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Form confirm button
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
            confirmBtn.style.opacity = "0.7";
            try {
                const gameNameInput = document.getElementById("game-name-input");
                const secretWordInput = document.getElementById("secret-word");
                const hintInputs = [
                    document.getElementById("hint-1"),
                    document.getElementById("hint-2"),
                    document.getElementById("hint-3"),
                    document.getElementById("hint-4"),
                    document.getElementById("hint-5")
                ];
                const gameName = gameNameInput ? gameNameInput.value.trim().toUpperCase() : "";
                const secretWord = secretWordInput ? secretWordInput.value.trim().toUpperCase() : "";
                const hints = hintInputs.map(input => input ? input.value.trim().toUpperCase() : "");
                console.log("Form data", { gameName, secretWord, hints });

                if (!secretWord || hints.some(hint => !hint)) {
                    throw new Error("Please fill in all required fields: secret word and all hints.");
                }

                const formData = new FormData();
                formData.append("gameName", gameName);
                formData.append("secretWord", secretWord);
                hints.forEach((hint, index) => {
                    formData.append(`hint${index + 1}`, hint);
                });

                const response = await fetch(webAppUrl, {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to submit game: ${errorText}`);
                }

                const result = await response.json();
                console.log("Game creation response:", result);

                if (result.status === "success") {
                    const newGameId = result.gameId || `Private-${Date.now()}`;
                    const newGame = {
                        "Game Number": newGameId,
                        "Secret Word": secretWord,
                        "Hint 1": hints[0],
                        "Hint 2": hints[1],
                        "Hint 3": hints[2],
                        "Hint 4": hints[3],
                        "Hint 5": hints[4],
                        "Background": defaultBackground
                    };
                    privateGames.unshift(newGame);
                    console.log("Added new private game:", newGame);

                    gameNameInput.value = "";
                    secretWordInput.value = "";
                    hintInputs.forEach(input => input.value = "");

                    resetScreenDisplays(gameScreen);
                    loadGame(newGame);
                    adjustBackground();
                    if (isMobile) showKeyboard();
                    updateArrowStates(0, privateGames);
                } else {
                    throw new Error(result.message || "Failed to create game.");
                }
            } catch (error) {
                console.error("Error creating game:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = error.message;
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
                confirmBtn.style.opacity = "1";
            }
        }, 100);
        confirmBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Form error OK button
    if (formErrorOkBtn) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form error OK button triggered");
            if (formErrorDialog) {
                formErrorDialog.style.display = "none";
            }
            if (activeInput && !isMobile && activeInput !== guessInput) {
                activeInput.focus();
            } else if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        };
        formErrorOkBtn.addEventListener("click", handler);
        formErrorOkBtn.addEventListener("touchstart", handler);
    }

    // Guesses close button
    if (guessesCloseBtn) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button triggered");
            if (guessesScreen) {
                guessesScreen.style.display = "none";
            }
            if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        };
        guessesCloseBtn.addEventListener("click", handler);
        guessesCloseBtn.addEventListener("touchstart", handler);
    }

    // Official back button
    if (officialBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Official back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Official back button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            adjustBackground();
            showKeyboard();
            activeInput = guessInput;
            if (activeInput && !isMobile) activeInput.focus();
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
                console.log("Private back button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            adjustBackground();
            showKeyboard();
            activeInput = guessInput;
            if (activeInput && !isMobile) activeInput.focus();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        privateBackBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Next game button at end
    if (nextGameBtnEnd) {
        const handler = debounce(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next game button (end) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Next game button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;
            try {
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
                    console.log("Loading next game at end", { targetIndex: currentIndex - 1, targetGame });
                    currentBackground = targetGame["Background"] && targetGame["Background"].trim() !== "" ? targetGame["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(targetGame);
                    resetScreenDisplays(gameScreen);
                    gameScreen.style.display = "flex";
                    adjustBackground();
                    if (isMobile) showKeyboard();
                    updateArrowStates(currentIndex - 1, gameList);
                } else {
                    console.log("At the newest game, cannot go to next");
                    nextGameArrow.classList.add("disabled");
                }
            } catch (error) {
                console.error("Error loading next game at end:", error.message);
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

    // Handle guess
    async function handleGuess(guess) {
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored", { isProcessingGuess, gameOver });
            return;
        }
        isProcessingGuess = true;
        guessBtn.disabled = true;
        guessInput.disabled = true;
        console.log("Processing guess:", guess);

        guessCount++;
        guesses.push(guess);
        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}/5`;
        }
        console.log("Updated guesses", { guessCount, guesses });

        let normalizedGameNumber;
        let gameType;
        if (currentGameNumber.includes("- Private")) {
            normalizedGameNumber = currentGameId;
            gameType = "privatePineapple";
        } else {
            normalizedGameNumber = currentGameNumber.replace("Game #", "");
            gameType = "pineapple";
        }
        saveGameResult(gameType, normalizedGameNumber, secretWord, guess);

        if (guess === secretWord) {
            console.log("Correct guess!");
            endGame(true);
            isProcessingGuess = false;
            guessBtn.disabled = false;
            guessInput.disabled = false;
            return;
        }

        guessInputContainer.classList.add("wrong-guess");
        animationTimeout = setTimeout(() => {
            guessInputContainer.classList.remove("wrong-guess");
            animationTimeout = null;
            console.log("Wrong guess animation completed");
            isProcessingGuess = false;
            guessBtn.disabled = false;
            guessInput.disabled = false;
            if (!isMobile) guessInput.focus();
        }, 350);

        if (!firstGuessMade) {
            firstGuessMade = true;
            revealNextHint();
        } else if (guessCount < 5) {
            revealNextHint();
        }

        guessInput.value = "";
        if (guessCount >= 5) {
            console.log("Max guesses reached, ending game");
            endGame(false);
        }
    }

    // Reveal next hint
    function revealNextHint() {
        if (hintIndex >= hints.length || hintIndex >= hintRevealOrder.length) {
            console.log("No more hints to reveal", { hintIndex, hintsLength: hints.length });
            return;
        }
        const hintId = hintRevealOrder[hintIndex];
        const hintElement = document.getElementById(hintId);
        if (!hintElement) {
            console.error(`Hint element not found for ID: ${hintId}`);
            return;
        }
        console.log("Revealing hint", { hintId, hintIndex, hintText: hints[hintIndex] });
        hintElement.textContent = hints[hintIndex];
        const style = hintStyles[hintIndex];
        if (style) {
            hintElement.className = `hint ${style.shape} hint-${style.color} reveal-${style.effect}`;
            console.log("Applied styles to hint", { hintId, shape: style.shape, color: style.color, effect: style.effect });
        } else {
            console.warn(`No style defined for hint index: ${hintIndex}`);
        }
        hintElement.style.display = "flex";
        hintIndex++;
        console.log("Hint revealed, new hintIndex:", hintIndex);
    }

    // End game
    function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp, guessCount, secretWord });
        gameOver = true;
        gameScreen.classList.add("game-ended");
        guessBtn.disabled = true;
        guessInput.disabled = true;
        if (isMobile) {
            keyboardContainer.style.display = "none";
        }

        const gameOverScreen = document.getElementById("game-over");
        const gameOverMessage = document.getElementById("game-over-message");
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");

        if (gameOverScreen && gameOverMessage && shareText && gameNumberDisplay) {
            resetScreenDisplays(gameOverScreen);
            gameOverScreen.style.display = "flex";
            gameOverScreen.classList.add("active");

            gameNumberDisplay.textContent = `Game: ${currentGameNumber}`;
            let message = "";
            let shareMessage = `WORDY ${currentGameNumber}\n`;
            if (won) {
                message = `Congratulations! You guessed the secret word "${secretWord}" in ${guessCount} ${guessCount === 1 ? "guess" : "guesses"}!`;
                shareMessage += `${guessCount}/5\n`;
                triggerPineappleRain();
            } else if (gaveUp) {
                message = `You gave up! The secret word was "${secretWord}".`;
                shareMessage += "Gave Up\n";
            } else {
                message = `Game Over! The secret word was "${secretWord}".`;
                shareMessage += "X/5\n";
            }
            gameOverMessage.textContent = message;
            shareText.innerHTML = shareMessage.replace("\n", "<br>");

            console.log("Game over screen displayed", { message, shareMessage });

            const shareButtons = document.getElementById("share-buttons");
            if (shareButtons) {
                shareButtons.innerHTML = "";
                const platforms = [
                    { name: "Twitter", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}` },
                    { name: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
                    { name: "WhatsApp", url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}` }
                ];
                platforms.forEach(platform => {
                    const a = document.createElement("a");
                    a.href = platform.url;
                    a.target = "_blank";
                    const img = document.createElement("img");
                    img.src = `images/${platform.name.toLowerCase()}.png`;
                    img.alt = platform.name;
                    a.appendChild(img);
                    shareButtons.appendChild(a);
                });
                console.log("Share buttons initialized for platforms:", platforms.map(p => p.name));
            }
        } else {
            console.error("Game over elements not found");
        }

        adjustBackground();
    }

    // Trigger pineapple rain animation
    function triggerPineappleRain() {
        console.log("Triggering pineapple rain animation");
        const rainContainer = document.createElement("div");
        rainContainer.className = "pineapple-rain";
        document.body.appendChild(rainContainer);

        const numPieces = 20;
        for (let i = 0; i < numPieces; i++) {
            const piece = document.createElement("div");
            piece.className = "pineapple-piece";
            piece.textContent = "🍍";
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.animationDuration = `${Math.random() * 2 + 1}s`;
            piece.style.animationDelay = `${Math.random() * 0.5}s`;
            piece.style.setProperty("--rotation", `${Math.random() * 360}deg`);
            piece.style.setProperty("--drift", `${Math.random() * 2 - 1}`);
            rainContainer.appendChild(piece);
        }

        setTimeout(() => {
            console.log("Removing pineapple rain container");
            rainContainer.remove();
        }, 3000);
    }

    // Save game result
    function saveGameResult(gameType, gameNumber, secretWord, guess) {
        console.log("Saving game result", { gameType, gameNumber, secretWord, guess });
        // Placeholder for saving game result (e.g., to localStorage or server)
        // Example: localStorage.setItem(`result_${gameType}_${gameNumber}`, JSON.stringify({ secretWord, guess }));
    }

    // Update arrow states
    function updateArrowStates(currentIndex, gameList) {
        console.log("Updating arrow states", { currentIndex, gameListLength: gameList.length });
        if (prevGameArrow && nextGameArrow) {
            prevGameArrow.classList.toggle("disabled", currentIndex >= gameList.length - 1);
            nextGameArrow.classList.toggle("disabled", currentIndex <= 0);
        }
    }

    // Load game
    function loadGame(game) {
        console.log("Loading game:", game);
        gameOver = false;
        secretWord = game["Secret Word"]?.toUpperCase() || "";
        hints = [
            game["Hint 1"]?.toUpperCase() || "",
            game["Hint 2"]?.toUpperCase() || "",
            game["Hint 3"]?.toUpperCase() || "",
            game["Hint 4"]?.toUpperCase() || "",
            game["Hint 5"]?.toUpperCase() || ""
        ].filter(hint => hint);
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        guesses = [];
        gaveUp = false;
        isProcessingGuess = false;
        currentGameNumber = game["Game Number"].includes("Private") ? `${game["Game Number"]} - Private` : `Game #${game["Game Number"]}`;
        currentGameId = game["Game Number"];
        currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;

        console.log("Game state initialized", { secretWord, hints, currentGameNumber, currentGameId, currentBackground });

        if (gameNumberText) {
            gameNumberText.textContent = currentGameNumber;
        }
        if (guessesLink) {
            guessesLink.textContent = "Guesses: 0/5";
        }
        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
        }
        if (guessBtn) {
            guessBtn.disabled = false;
        }
        if (gameScreen) {
            gameScreen.classList.remove("game-ended");
        }

        // Reset and randomize hint styles
        randomizeHintStyles();
        const hintElements = hintRevealOrder.map(id => document.getElementById(id));
        hintElements.forEach((hintElement, index) => {
            if (hintElement) {
                hintElement.style.display = "none";
                hintElement.textContent = "";
                hintElement.className = "hint";
            }
        });

        adjustBackground();
        if (!isMobile && guessInput) {
            guessInput.focus();
            activeInput = guessInput;
        }
        console.log("Game loaded successfully");
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select screen");
        resetScreenDisplays(gameSelectContent);
        gameSelectScreen.style.display = "flex";
        gameSelectScreen.classList.add("active");
        officialTab.classList.add("active");
        privateTab.classList.remove("active");
        officialContent.classList.add("active");
        officialContent.style.display = "flex";
        privateContent.classList.remove("active");
        privateContent.style.display = "none";
        displayGameList();
        adjustBackground();
    }

    // Display game list
    function displayGameList() {
        console.log("Displaying game list", { allGamesLength: allGames.length, privateGamesLength: privateGames.length });
        const officialList = document.querySelector("#official-games .game-list");
        const privateList = document.querySelector("#private-games .game-list");

        if (officialList) {
            officialList.innerHTML = "";
            allGames.forEach((game, index) => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                row.innerHTML = `
                    <span>Game #${game["Game Number"]}</span>
                    <span>${game["Secret Word"] || "Unknown"}</span>
                    <span class="play-now">Play Now</span>
                `;
                row.addEventListener("touchstart", (e) => {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    touchMoved = false;
                    console.log("Touch started on game row", { gameNumber: game["Game Number"], touchStartX, touchStartY });
                });
                row.addEventListener("touchmove", (e) => {
                    const deltaX = e.touches[0].clientX - touchStartX;
                    const deltaY = e.touches[0].clientY - touchStartY;
                    if (Math.abs(deltaX) > touchThreshold || Math.abs(deltaY) > touchThreshold) {
                        touchMoved = true;
                        console.log("Touch moved, ignoring click", { deltaX, deltaY });
                    }
                });
                row.addEventListener("touchend", async (e) => {
                    e.preventDefault();
                    if (!touchMoved && !isUILocked && !isLoadingGame) {
                        console.log("Playing game from official list", { gameNumber: game["Game Number"], index });
                        isUILocked = true;
                        isLoadingGame = true;
                        try {
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            gameScreen.style.display = "flex";
                            adjustBackground();
                            if (isMobile) showKeyboard();
                            updateArrowStates(index, allGames);
                        } catch (error) {
                            console.error("Error loading game from official list:", error.message);
                            if (formErrorDialog && formErrorMessage) {
                                formErrorMessage.textContent = "Failed to load game.";
                                formErrorDialog.style.display = "flex";
                            }
                        } finally {
                            isUILocked = false;
                            isLoadingGame = false;
                        }
                    }
                });
                row.addEventListener("click", async () => {
                    if (!isUILocked && !isLoadingGame) {
                        console.log("Playing game from official list (click)", { gameNumber: game["Game Number"], index });
                        isUILocked = true;
                        isLoadingGame = true;
                        try {
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            gameScreen.style.display = "flex";
                            adjustBackground();
                            if (isMobile) showKeyboard();
                            updateArrowStates(index, allGames);
                        } catch (error) {
                            console.error("Error loading game from official list:", error.message);
                            if (formErrorDialog && formErrorMessage) {
                                formErrorMessage.textContent = "Failed to load game.";
                                formErrorDialog.style.display = "flex";
                            }
                        } finally {
                            isUILocked = false;
                            isLoadingGame = false;
                        }
                    }
                });
                officialList.appendChild(row);
            });
            console.log("Official game list rendered");
        }

        if (privateList) {
            privateList.innerHTML = "";
            privateGames.forEach((game, index) => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                row.innerHTML = `
                    <span>${game["Game Number"]}</span>
                    <span>${game["Secret Word"] || "Unknown"}</span>
                    <span class="play-now">Play Now</span>
                `;
                row.addEventListener("touchstart", (e) => {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    touchMoved = false;
                    console.log("Touch started on private game row", { gameNumber: game["Game Number"], touchStartX, touchStartY });
                });
                row.addEventListener("touchmove", (e) => {
                    const deltaX = e.touches[0].clientX - touchStartX;
                    const deltaY = e.touches[0].clientY - touchStartY;
                    if (Math.abs(deltaX) > touchThreshold || Math.abs(deltaY) > touchThreshold) {
                        touchMoved = true;
                        console.log("Touch moved, ignoring click", { deltaX, deltaY });
                    }
                });
                row.addEventListener("touchend", async (e) => {
                    e.preventDefault();
                    if (!touchMoved && !isUILocked && !isLoadingGame) {
                        console.log("Playing game from private list", { gameNumber: game["Game Number"], index });
                        isUILocked = true;
                        isLoadingGame = true;
                        try {
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            gameScreen.style.display = "flex";
                            adjustBackground();
                            if (isMobile) showKeyboard();
                            updateArrowStates(index, privateGames);
                        } catch (error) {
                            console.error("Error loading game from private list:", error.message);
                            if (formErrorDialog && formErrorMessage) {
                                formErrorMessage.textContent = "Failed to load game.";
                                formErrorDialog.style.display = "flex";
                            }
                        } finally {
                            isUILocked = false;
                            isLoadingGame = false;
                        }
                    }
                });
                row.addEventListener("click", async () => {
                    if (!isUILocked && !isLoadingGame) {
                        console.log("Playing game from private list (click)", { gameNumber: game["Game Number"], index });
                        isUILocked = true;
                        isLoadingGame = true;
                        try {
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            gameScreen.style.display = "flex";
                            adjustBackground();
                            if (isMobile) showKeyboard();
                            updateArrowStates(index, privateGames);
                        } catch (error) {
                            console.error("Error loading game from private list:", error.message);
                            if (formErrorDialog && formErrorMessage) {
                                formErrorMessage.textContent = "Failed to load game.";
                                formErrorDialog.style.display = "flex";
                            }
                        } finally {
                            isUILocked = false;
                            isLoadingGame = false;
                        }
                    }
                });
                privateList.appendChild(row);
            });
            console.log("Private game list rendered");
        }
    }

    // Parse CSV data
    function parseCSV(data) {
        console.log("Parsing CSV data");
        const rows = data.split("\n").map(row => row.trim()).filter(row => row);
        const headers = rows[0].split(",").map(header => header.trim());
        const games = [];
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(",").map(col => col.trim());
            const game = {};
            headers.forEach((header, index) => {
                game[header] = cols[index] || "";
            });
            games.push(game);
        }
        console.log("Parsed games:", games.length);
        return games;
    }

    // Fetch games
    async function fetchGames() {
        console.log("Fetching games");
        try {
            const officialResponse = await fetch(officialUrl);
            const officialText = await officialResponse.text();
            allGames = parseCSV(officialText);
            console.log("Fetched official games:", allGames.length);

            const privateResponse = await fetch(privateUrl);
            const privateText = await privateResponse.text();
            privateGames = parseCSV(privateText);
            console.log("Fetched private games:", privateGames.length);

            if (allGames.length > 0) {
                currentBackground = allGames[0]["Background"] && allGames[0]["Background"].trim() !== "" ? allGames[0]["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(allGames[0]);
                updateArrowStates(0, allGames);
                adjustBackground();
                if (isMobile) showKeyboard();
            } else {
                console.error("No official games available");
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "No games available.";
                    formErrorDialog.style.display = "flex";
                }
            }
        } catch (error) {
            console.error("Error fetching games:", error.message);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load games.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Initialize game
    console.log("Initializing game");
    await fetchGames();
    setupKeyboardListeners();
    console.log("Game initialization complete");
});