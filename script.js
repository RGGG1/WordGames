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
            const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
            if (currentIndex > 0) {
                const prevGame = allGames[currentIndex - 1];
                console.log("Loading previous game:", prevGame);
                currentBackground = prevGame["Background"] && prevGame["Background"].trim() !== "" ? prevGame["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(prevGame);
                resetScreenDisplays(gameScreen);
                showKeyboard();
                activeInput = guessInput;
                if (activeInput && !isMobile) activeInput.focus();
                adjustBackground();
                setupKeyboardListeners();
                updateArrowStates(currentIndex - 1, allGames);
            }
            setTimeout(() => { isUILocked = false; }, 500);
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
            const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
            if (currentIndex < allGames.length - 1) {
                const nextGame = allGames[currentIndex + 1];
                console.log("Loading next game:", nextGame);
                currentBackground = nextGame["Background"] && nextGame["Background"].trim() !== "" ? nextGame["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(nextGame);
                resetScreenDisplays(gameScreen);
                showKeyboard();
                activeInput = guessInput;
                if (activeInput && !isMobile) activeInput.focus();
                adjustBackground();
                setupKeyboardListeners();
                updateArrowStates(currentIndex + 1, allGames);
            }
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Update arrow states
    function updateArrowStates(currentIndex, games) {
        console.log("Updating arrow states:", { currentIndex, totalGames: games.length });
        if (prevGameArrow) {
            prevGameArrow.classList.toggle("disabled", currentIndex <= 0);
        }
        if (nextGameArrow) {
            nextGameArrow.classList.toggle("disabled", currentIndex >= games.length - 1);
        }
    }

    // Official back button
    if (officialBackBtn) {
        officialBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Official Back button triggered", { isUILocked, currentGameNumber, currentGameId, secretWord });
            if (isUILocked) {
                console.log("Official Back button ignored: UI locked");
                return;
            }
            if (!currentGameNumber || !currentGameId || !secretWord) {
                console.warn("Game state incomplete, attempting to load latest game");
                if (allGames.length > 0) {
                    loadGame(allGames[0]);
                } else {
                    console.error("No games available to load");
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "No games available to return to.";
                        formErrorDialog.style.display = "flex";
                    }
                    return;
                }
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            showKeyboard();
            activeInput = guessInput;
            if (activeInput && !isMobile) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Private back button
    if (privateBackBtn) {
        privateBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Private Back button triggered", { isUILocked });
            if (isUILocked) {
                console.log("Private Back button ignored: UI locked");
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
        });
    }

    // Guesses close button
    if (guessesCloseBtn) {
        guessesCloseBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button triggered");
            guessesScreen.style.display = "none";
            if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
            if (isMobile) {
                showKeyboard();
            }
        });
    }

    // Create Pineapple button
    if (createPineappleBtn) {
        createPineappleBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple button triggered", { isUILocked });
            if (isUILocked) {
                console.log("Create Pineapple ignored: UI locked");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            activeInput = formInputs[0];
            if (activeInput && !isMobile) activeInput.focus();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Create Pineapple link
    if (createPineappleLink) {
        createPineappleLink.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple link triggered", { isUILocked });
            if (isUILocked) {
                console.log("Create Pineapple link ignored: UI locked");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            activeInput = formInputs[0];
            if (activeInput && !isMobile) activeInput.focus();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Form back button
    if (formBackBtn) {
        formBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form Back button triggered", { isUILocked });
            if (isUILocked) {
                console.log("Form Back button ignored: UI locked");
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
        });
    }

    // Form confirm button
    if (confirmBtn) {
        confirmBtn.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Confirm button triggered", { isUILocked });
            if (isUILocked) {
                console.log("Confirm button ignored: UI locked");
                return;
            }
            isUILocked = true;
            const gameName = formInputs[0].value.trim().toUpperCase();
            const secretWordInput = formInputs[1].value.trim().toUpperCase();
            const gameHints = formInputs.slice(2).map(input => input.value.trim().toUpperCase());

            if (!gameName || !secretWordInput || gameHints.some(hint => !hint)) {
                console.log("Form validation failed", { gameName, secretWord: secretWordInput, hints: gameHints });
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Please fill in all fields.";
                    formErrorDialog.style.display = "flex";
                }
                isUILocked = false;
                return;
            }

            if (!/^[A-Z]{3,8}$/.test(secretWordInput)) {
                console.log("Invalid secret word format", { secretWord: secretWordInput });
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Secret word must be 3-8 letters.";
                    formErrorDialog.style.display = "flex";
                }
                isUILocked = false;
                return;
            }

            const formData = new FormData();
            formData.append("Game Name", gameName);
            formData.append("Secret Word", secretWordInput);
            gameHints.forEach((hint, index) => {
                formData.append(`Hint ${index + 1}`, hint);
            });

            try {
                console.log("Submitting private game to web app:", { gameName, secretWord: secretWordInput, hints: gameHints });
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log("Web app response:", result);

                if (result.status === "success" && result.id) {
                    const newGame = {
                        "Game Number": `${result.id} - Private`,
                        "Game Name": gameName,
                        "Secret Word": secretWordInput,
                        "Hint 1": gameHints[0],
                        "Hint 2": gameHints[1],
                        "Hint 3": gameHints[2],
                        "Hint 4": gameHints[3],
                        "Hint 5": gameHints[4],
                        "Background": ""
                    };
                    privateGames.unshift(newGame);
                    console.log("Added new private game:", newGame);

                    currentBackground = defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(newGame);
                    resetScreenDisplays(gameScreen);
                    showKeyboard();
                    activeInput = guessInput;
                    if (activeInput && !isMobile) activeInput.focus();
                    adjustBackground();
                    setupKeyboardListeners();

                    formInputs.forEach(input => input.value = "");
                } else {
                    console.error("Failed to create game:", result.message);
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = result.message || "Failed to create game.";
                        formErrorDialog.style.display = "flex";
                    }
                }
            } catch (error) {
                console.error("Error submitting private game:", error);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "An error occurred while creating the game.";
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
            }
        });
    }

    // Form error OK button
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form error OK button triggered");
            if (formErrorDialog) {
                formErrorDialog.style.display = "none";
            }
            if (activeInput && !isMobile) {
                activeInput.focus();
            }
        });
    }

    // Next game button (end screen)
    if (nextGameBtnEnd) {
        nextGameBtnEnd.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next game button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Next game button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
            if (currentIndex < allGames.length - 1) {
                const nextGame = allGames[currentIndex + 1];
                console.log("Loading next game from end screen:", nextGame);
                currentBackground = nextGame["Background"] && nextGame["Background"].trim() !== "" ? nextGame["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(nextGame);
                resetScreenDisplays(gameScreen);
                showKeyboard();
                activeInput = guessInput;
                if (activeInput && !isMobile) activeInput.focus();
                adjustBackground();
                setupKeyboardListeners();
                updateArrowStates(currentIndex + 1, allGames);
            } else {
                console.log("No next game available, showing game select screen");
                showGameSelectScreen();
            }
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select screen");
        officialTab.classList.add("active");
        privateTab.classList.remove("active");
        officialContent.classList.add("active");
        officialContent.style.display = "flex";
        privateContent.classList.remove("active");
        privateContent.style.display = "none";
        resetScreenDisplays(gameSelectContent);
        displayGameList();
        setupKeyboardListeners();
    }

    // Parse CSV data
    function parseCSV(csvText) {
        console.log("Parsing CSV data");
        const lines = csvText.trim().split("\n");
        const headers = lines[0].split(",").map(header => header.trim());
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = [];
            let current = "";
            let inQuotes = false;
            for (let char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === "," && !inQuotes) {
                    values.push(current.trim());
                    current = "";
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || "";
            });
            result.push(obj);
        }
        console.log("Parsed CSV result:", result);
        return result;
    }

    // Fetch game data
    async function fetchGameData() {
        console.log("Fetching official game data from:", officialUrl);
        try {
            const response = await fetch(officialUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            allGames = parseCSV(text);
            console.log("Fetched official games:", allGames);
            if (allGames.length > 0) {
                currentBackground = allGames[0]["Background"] && allGames[0]["Background"].trim() !== "" ? allGames[0]["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(allGames[0]);
                updateArrowStates(0, allGames);
            } else {
                console.warn("No official games available, loading default game");
                loadDefaultGame();
            }
        } catch (error) {
            console.error("Error fetching official games:", error);
            loadDefaultGame();
        }
        adjustBackground();
        setupKeyboardListeners();
    }

    // Fetch private games
    async function fetchPrivateGames() {
        console.log("Fetching private game data from:", privateUrl);
        try {
            const response = await fetch(privateUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            privateGames = parseCSV(text).map(game => ({
                ...game,
                "Game Number": `${game["Game Number"]} - Private`
            }));
            console.log("Fetched private games:", privateGames);
        } catch (error) {
            console.error("Error fetching private games:", error);
            privateGames = [];
        }
    }

    // Load default game
    function loadDefaultGame() {
        console.log("Loading default game");
        const defaultGame = {
            "Game Number": "Default",
            "Secret Word": "PINEAPPLE",
            "Hint 1": "A tropical fruit",
            "Hint 2": "Yellow inside",
            "Hint 3": "Spiky outside",
            "Hint 4": "Grows in warm climates",
            "Hint 5": "Used in piña colada",
            "Background": defaultBackground
        };
        currentBackground = defaultBackground;
        loadGame(defaultGame);
    }

    // Display game list
    function displayGameList() {
        const officialList = document.getElementById("official-list");
        if (officialList) {
            officialList.innerHTML = "";
            if (gameNameElement) {
                gameNameElement.textContent = "WORDY";
            }
            console.log("Populating official games list with:", allGames);

            if (!allGames || allGames.length === 0) {
                console.log("No official games to display");
                officialList.innerHTML = "<div>No official games available</div>";
            } else {
                const results = JSON.parse(localStorage.getItem("pineappleResults") || "{}");
                allGames.forEach((game, index) => {
                    const gameNumber = game["Game Number"];
                    const secretWord = game["Secret Word"] ? game["Secret Word"].toUpperCase() : "N/A";
                    const pastResult = results[gameNumber];
                    let guessesDisplay = '-';
                    if (pastResult) {
                        if (pastResult.guesses === "Gave Up") {
                            guessesDisplay = "Gave Up";
                        } else if (pastResult.guesses === "X") {
                            guessesDisplay = "X";
                        } else if (pastResult.secretWord === secretWord) {
                            guessesDisplay = pastResult.guesses;
                        }
                    }

                    const showSecretWord = pastResult && (pastResult.guesses === "Gave Up" || pastResult.guesses === "X" || pastResult.secretWord === secretWord);
                    const displayWord = showSecretWord ? secretWord : "Play Now";

                    const gameItem = document.createElement("div");
                    gameItem.className = "game-list-row";
                    gameItem.innerHTML = `
                        <span>${gameNumber}</span>
                        <span class="${displayWord === 'Play Now' ? 'play-now' : ''}">${displayWord}</span>
                        <span>${guessesDisplay}</span>
                    `;
                    if (isMobile) {
                        gameItem.addEventListener("touchstart", (e) => {
                            touchStartX = e.touches[0].clientX;
                            touchStartY = e.touches[0].clientY;
                            touchMoved = false;
                            console.log("Touch started on game item", { x: touchStartX, y: touchStartY });
                        });
                        gameItem.addEventListener("touchmove", (e) => {
                            const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                            if (deltaX > touchThreshold || deltaY > touchThreshold) {
                                touchMoved = true;
                                console.log("Touch moved, marking as scroll", { deltaX, deltaY });
                            }
                        });
                        gameItem.addEventListener("touchend", async (e) => {
                            e.preventDefault();
                            if (!touchMoved && !isUILocked) {
                                console.log("Touch ended without movement, selecting game:", game);
                                isUILocked = true;
                                currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                                await preloadBackground(currentBackground);
                                loadGame(game);
                                resetScreenDisplays(gameScreen);
                                showKeyboard();
                                activeInput = guessInput;
                                if (activeInput && !isMobile) activeInput.focus();
                                adjustBackground();
                                setupKeyboardListeners();
                                const currentIndex = allGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                                updateArrowStates(currentIndex, allGames);
                                setTimeout(() => { isUILocked = false; }, 500);
                            }
                        });
                    } else {
                        gameItem.addEventListener("click", async () => {
                            console.log("Clicked official game:", game, { isUILocked });
                            if (isUILocked) return;
                            isUILocked = true;
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            showKeyboard();
                            activeInput = guessInput;
                            if (activeInput && !isMobile) activeInput.focus();
                            adjustBackground();
                            setupKeyboardListeners();
                            const currentIndex = allGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                            updateArrowStates(currentIndex, allGames);
                            setTimeout(() => { isUILocked = false; }, 500);
                        });
                    }
                    officialList.appendChild(gameItem);
                    console.log(`Rendered official game ${gameNumber}: Secret Word: ${secretWord}, Guesses: ${guessesDisplay}, Stored Result:`, pastResult);
                });
                officialList.style.display = "flex";
            }
        }

        const privateList = document.getElementById("private-list");
        if (privateList) {
            privateList.innerHTML = "";
            console.log("Populating private games list", privateGames);

            if (!privateGames.length) {
                privateList.innerHTML = "<div>No private games yet</div>";
            } else {
                const results = JSON.parse(localStorage.getItem("privatePineappleResults") || "{}");
                console.log("Private game results from localStorage:", results);
                privateGames.forEach(game => {
                    const gameNumber = game["Game Number"];
                    const gameName = game["Game Name"].toUpperCase();
                    const secretWord = game["Secret Word"] ? game["Secret Word"].toUpperCase() : "N/A";
                    const pastResult = results[gameNumber];
                    let guessesDisplay = '-';
                    let showSecretWord = false;

                    console.log(`Checking result for game ${gameNumber}:`, pastResult);

                    if (pastResult) {
                        if (pastResult.guesses === "Gave Up") {
                            guessesDisplay = "Gave Up";
                            showSecretWord = true;
                        } else if (pastResult.guesses === "X") {
                            guessesDisplay = "X";
                            showSecretWord = true;
                        } else if (pastResult.secretWord === secretWord) {
                            guessesDisplay = pastResult.guesses.toString();
                            showSecretWord = true;
                        }
                    }

                    const displayWord = showSecretWord ? secretWord : "Play Now";

                    const gameItem = document.createElement("div");
                    gameItem.className = "game-list-row";
                    gameItem.innerHTML = `
                        <span>${gameName}</span>
                        <span class="${displayWord === 'Play Now' ? 'play-now' : ''}">${displayWord}</span>
                        <span>${guessesDisplay}</span>
                    `;
                    if (isMobile) {
                        gameItem.addEventListener("touchstart", (e) => {
                            touchStartX = e.touches[0].clientX;
                            touchStartY = e.touches[0].clientY;
                            touchMoved = false;
                            console.log("Touch started on private game item", { x: touchStartX, y: touchStartY });
                        });
                        gameItem.addEventListener("touchmove", (e) => {
                            const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                            if (deltaX > touchThreshold || deltaY > touchThreshold) {
                                touchMoved = true;
                                console.log("Touch moved on private game, marking as scroll", { deltaX, deltaY });
                            }
                        });
                        gameItem.addEventListener("touchend", async (e) => {
                            e.preventDefault();
                            if (!touchMoved && !isUILocked) {
                                console.log("Touch ended without movement, selecting private game:", game);
                                isUILocked = true;
                                currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                                await preloadBackground(currentBackground);
                                loadGame(game);
                                resetScreenDisplays(gameScreen);
                                showKeyboard();
                                activeInput = guessInput;
                                if (activeInput && !isMobile) activeInput.focus();
                                adjustBackground();
                                setupKeyboardListeners();
                                const currentIndex = privateGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                                updateArrowStates(currentIndex, privateGames);
                                setTimeout(() => { isUILocked = false; }, 500);
                            }
                        });
                    } else {
                        gameItem.addEventListener("click", async () => {
                            console.log("Clicked private game:", game, { isUILocked });
                            if (isUILocked) return;
                            isUILocked = true;
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            showKeyboard();
                            activeInput = guessInput;
                            if (activeInput && !isMobile) activeInput.focus();
                            adjustBackground();
                            setupKeyboardListeners();
                            const currentIndex = privateGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                            updateArrowStates(currentIndex, privateGames);
                            setTimeout(() => { isUILocked = false; }, 500);
                        });
                    }
                    privateList.appendChild(gameItem);
                    console.log(`Rendered private game ${gameNumber}: Name: ${gameName}, Secret Word: ${displayWord}, Guesses: ${guessesDisplay}, Stored Result:`, pastResult);
                });
                privateList.style.display = "flex";
            }
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
                const isDiamondShape = hintStyles[index].shape === "hint-shape-diamond";
                const hintContent = isFluffyCloudShape || isDiamondShape ? `<span class="hint-text">${hint}</span>` : hint;
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
                const isDiamondShape = hintStyles[hintIndex].shape === "hint-shape-diamond";
                const hintContent = isFluffyCloudShape || isDiamondShape ? `<span class="hint-text">${hint}</span>` : hint;
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
    function handleGuess(guess) {
        console.log("Handling guess:", guess, { gameOver, isProcessingGuess, guessCount });
        if (gameOver || isProcessingGuess) {
            console.log("Guess ignored due to game state");
            return;
        }
        if (!guess.match(/^[A-Z]{3,8}$/)) {
            console.log("Invalid guess format:", guess);
            guessInputContainer.classList.add("wrong-guess");
            isProcessingGuess = true;
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                isProcessingGuess = false;
                animationTimeout = null;
                console.log("Animation completed, state reset");
            }, 350);
            return;
        }

        isProcessingGuess = true;
        guessCount++;
        guesses.push(guess);
        console.log("Guess added, current guesses:", guesses, "guessCount:", guessCount);

        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}/5`;
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
            console.log("Incorrect guess");
            guessInputContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                animationTimeout = null;
                console.log("Animation completed");
                if (!firstGuessMade) {
                    firstGuessMade = true;
                    revealHint();
                }
                if (guessCount < 5) {
                    guessInput.value = "";
                    isProcessingGuess = false;
                    if (!isMobile) {
                        guessInput.focus();
                    }
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
                    saveGameResult(gameType, normalizedGameNumber, secretWord, "X");
                    endGame(false);
                }
            }, 350);
        }
    }

    // Save game result
    function saveGameResult(gameType, gameNumber, secretWord, guesses) {
        console.log("Saving game result:", { gameType, gameNumber, secretWord, guesses });
        const key = gameType === "pineapple" ? "pineappleResults" : "privatePineappleResults";
        const results = JSON.parse(localStorage.getItem(key) || "{}");
        results[gameNumber] = { secretWord, guesses };
        localStorage.setItem(key, JSON.stringify(results));
        console.log("Updated results in localStorage:", results);
    }

    // End game
    function endGame(won, gaveUp = false) {
        console.log("Ending game:", { won, gaveUp, secretWord, guessCount });
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;
        const gameOverScreen = document.getElementById("game-over");
        const gameOverMessage = document.getElementById("game-over-message");
        const secretWordMessage = document.getElementById("secret-word-message");
        const shareText = document.getElementById("share-text");
        let normalizedGameNumber;

        if (currentGameNumber.includes("- Private")) {
            normalizedGameNumber = currentGameId;
        } else {
            normalizedGameNumber = currentGameNumber.replace("Game #", "");
        }

        if (gameOverScreen && gameOverMessage && secretWordMessage && shareText) {
            resetScreenDisplays(gameOverScreen);
            gameOverScreen.classList.add("active");
            shareSection.style.display = "flex";
            secretWordMessage.textContent = `The word was ${secretWord}!`;
            shareText.innerHTML = `I ${won ? `solved WORDY #${normalizedGameNumber} in <span class="guess-count">${guessCount}/5</span>!` : gaveUp ? `gave up on WORDY #${normalizedGameNumber}` : `didn't solve WORDY #${normalizedGameNumber}`}`;
            gameOverMessage.textContent = won ? "Congratulations!" : gaveUp ? "Game Over" : "Out of Guesses!";
            console.log("Game over screen displayed with message:", gameOverMessage.textContent);
        }

        if (won) {
            startPineappleRain();
        }

        if (isMobile) {
            keyboardContainer.style.display = "none";
        }
    }

    // Start pineapple rain
    function startPineappleRain() {
        console.log("Starting pineapple rain animation");
        const container = document.createElement("div");
        container.className = "pineapple-rain";
        document.body.appendChild(container);

        const emojis = ["🍍", "🌴", "🥥"];
        const numPieces = 30;

        for (let i = 0; i < numPieces; i++) {
            const piece = document.createElement("div");
            piece.className = "pineapple-piece";
            piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.animationDuration = `${3 + Math.random() * 2}s`;
            piece.style.animationDelay = `${Math.random() * 2}s`;
            piece.style.setProperty("--rotation", `${Math.random() * 360}deg`);
            piece.style.setProperty("--drift", Math.random() * 2 - 1);
            container.appendChild(piece);
        }

        setTimeout(() => {
            console.log("Removing pineapple rain");
            container.remove();
        }, 7000);
    }

    // Reset game
    function resetGame() {
        console.log("Resetting game state");
        gameOver = false;
        guessInput.disabled = false;
        guessBtn.disabled = false;
        guessCount = 0;
        guesses = [];
        firstGuessMade = false;
        gaveUp = false;
        isProcessingGuess = false;
        hintIndex = 0;
        if (guessesLink) {
            guessesLink.textContent = "Guesses: 0/5";
        }
        guessInput.value = "";
        setupHints();
    }

    // Load game
    function loadGame(game) {
        console.log("Loading game:", game);
        isLoadingGame = true;
        resetGame();
        currentGameNumber = game["Game Number"];
        currentGameId = game["Game Number"].includes("- Private") ? game["Game Number"].split(" - ")[0] : game["Game Number"];
        secretWord = game["Secret Word"] ? game["Secret Word"].toUpperCase() : "PINEAPPLE";
        hints = [
            game["Hint 1"] || "A tropical fruit",
            game["Hint 2"] || "Yellow inside",
            game["Hint 3"] || "Spiky outside",
            game["Hint 4"] || "Grows in warm climates",
            game["Hint 5"] || "Used in piña colada"
        ].map(hint => hint.toUpperCase());
        randomizeHintStyles();
        setupHints();

        const resultsKey = game["Game Number"].includes("- Private") ? "privatePineappleResults" : "pineappleResults";
        const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
        const pastResult = results[currentGameId];

        if (pastResult && pastResult.secretWord === secretWord) {
            console.log("Found past result for game:", pastResult);
            if (pastResult.guesses === "Gave Up" || pastResult.guesses === "X") {
                gaveUp = true;
                guessCount = 5;
                guesses = Array(5).fill("N/A");
                if (guessesLink) {
                    guessesLink.textContent = `Guesses: 5/5`;
                }
                endGame(false, pastResult.guesses === "Gave Up");
            } else {
                guessCount = parseInt(pastResult.guesses, 10);
                guesses = Array(guessCount).fill("N/A");
                if (guessesLink) {
                    guessesLink.textContent = `Guesses: ${guessCount}/5`;
                }
                endGame(true);
            }
        } else {
            console.log("No past result, starting fresh game");
            if (gameNumberText) {
                gameNumberText.textContent = currentGameNumber;
            }
        }

        isLoadingGame = false;
        console.log("Game loaded:", { currentGameNumber, currentGameId, secretWord, hints });
    }

    // Initial fetch and load
    await fetchGameData();
});