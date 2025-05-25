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
    const hintShapes = ['cloud', 'sun', 'aviator', 'fluffy-ball', 'fluffy-cloud'];
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
            if (isUILocked || isLoadingGame || gameOver) {
                console.log("Give Up link ignored: UI locked, game loading, or game over");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(giveUpDialog);
            giveUpDialog.style.display = "flex";
            giveUpDialog.classList.add("active");
            if (isMobile) {
                keyboardContainer.style.display = "flex";
                keyboardContainer.classList.add("show-give-up");
                keyboardContent.style.display = "none";
                keyboardGuessesContent.style.display = "none";
                keyboardGiveUpContent.style.display = "flex";
                keyboardBackBtn.style.display = "none";
            }
            adjustBackground();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        giveUpLink.addEventListener(isMobile ? "touchstart" : "click", handler);

        giveUpYesBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Give Up Yes button clicked");
            gaveUp = true;
            endGame(false, true);
            resetScreenDisplays(document.getElementById("game-over"));
        });

        giveUpNoBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Give Up No button clicked");
            resetScreenDisplays(gameScreen);
            showKeyboard();
            activeInput = guessInput;
            if (!isMobile) guessInput.focus();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    // Guesses link
    if (guessesLink && guessesCloseBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses link triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Guesses link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(guessesScreen);
            guessesScreen.style.display = "flex";
            guessesScreen.classList.add("active");
            const guessesList = document.getElementById("guesses-list");
            if (guessesList) {
                guessesList.innerHTML = guesses.length > 0 ? guesses.join("<span class='separator yellow'>•</span>") : "No guesses yet";
            }
            if (isMobile) {
                keyboardContainer.style.display = "flex";
                keyboardContainer.classList.add("show-guesses");
                keyboardContent.style.display = "none";
                keyboardGuessesContent.style.display = "flex";
                keyboardGiveUpContent.style.display = "none";
                keyboardBackBtn.style.display = "block";
            }
            adjustBackground();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        guessesLink.addEventListener(isMobile ? "touchstart" : "click", handler);

        guessesCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Guesses Close button clicked");
            resetScreenDisplays(gameScreen);
            showKeyboard();
            activeInput = guessInput;
            if (!isMobile) guessInput.focus();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    // Form Error dialog
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Form Error OK button clicked");
            resetScreenDisplays(formContent);
            activeInput = formInputs[0] || null;
            if (!isMobile && activeInput) activeInput.focus();
            showKeyboard();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    // Next Game button (end screen)
    if (nextGameBtnEnd) {
        const handler = debounce(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next Game button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Next Game button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
            if (currentIndex >= 0 && currentIndex < allGames.length - 1) {
                const nextGame = allGames[currentIndex + 1];
                await loadGame(nextGame["Game Number"], nextGame["Game ID"]);
                resetGameState();
                resetScreenDisplays(gameScreen);
                showKeyboard();
                activeInput = guessInput;
                if (!isMobile) guessInput.focus();
                adjustBackground();
                setupHints();
                updateNavigationArrows();
                setupKeyboardListeners();
            } else {
                console.log("No next game available, showing game select screen");
                showGameSelectScreen();
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        nextGameBtnEnd.addEventListener("click", handler);
        nextGameBtnEnd.addEventListener("touchstart", handler);
    }

    // Create Pineapple button
    if (createPineappleBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple button triggered", { isUILocked });
            if (isUILocked) {
                console.log("Create Pineapple button ignored: UI locked");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                if (input) input.value = "";
            });
            activeInput = formInputs[0] || null;
            if (!isMobile && activeInput) activeInput.focus();
            showKeyboard();
            adjustBackground();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        createPineappleBtn.addEventListener("click", handler);
        createPineappleBtn.addEventListener("touchstart", handler);
    }

    // Create Pineapple link (end screen)
    if (createPineappleLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple link (end screen) triggered", { isUILocked });
            if (isUILocked) {
                console.log("Create Pineapple link ignored: UI locked");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                if (input) input.value = "";
            });
            activeInput = formInputs[0] || null;
            if (!isMobile && activeInput) activeInput.focus();
            showKeyboard();
            adjustBackground();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        createPineappleLink.addEventListener("click", handler);
        createPineappleLink.addEventListener("touchstart", handler);
    }

    // Form Back button
    if (formBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form Back button triggered", { isUILocked });
            if (isUILocked) {
                console.log("Form Back button ignored: UI locked");
                return;
            }
            isUILocked = true;
            showGameSelectScreen();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        formBackBtn.addEventListener("click", handler);
        formBackBtn.addEventListener("touchstart", handler);
    }

    // Official Back button
    if (officialBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Official Back button triggered", { isUILocked, currentGameNumber });
            if (isUILocked) {
                console.log("Official Back button ignored: UI locked");
                return;
            }
            isUILocked = true;
            if (currentGameNumber && !currentGameNumber.includes("Private")) {
                resetScreenDisplays(gameScreen);
                showKeyboard();
                activeInput = guessInput;
                if (!isMobile) guessInput.focus();
                adjustBackground();
                setupKeyboardListeners();
            } else {
                resetScreenDisplays(gameScreen);
                showKeyboard();
                activeInput = guessInput;
                if (!isMobile) guessInput.focus();
                adjustBackground();
                setupKeyboardListeners();
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        officialBackBtn.addEventListener("click", handler);
        officialBackBtn.addEventListener("touchstart", handler);
    }

    // Private Back button
    if (privateBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Private Back button triggered", { isUILocked, currentGameNumber });
            if (isUILocked) {
                console.log("Private Back button ignored: UI locked");
                return;
            }
            isUILocked = true;
            if (currentGameNumber && currentGameNumber.includes("Private")) {
                resetScreenDisplays(gameScreen);
                showKeyboard();
                activeInput = guessInput;
                if (!isMobile) guessInput.focus();
                adjustBackground();
                setupKeyboardListeners();
            } else {
                resetScreenDisplays(gameScreen);
                showKeyboard();
                activeInput = guessInput;
                if (!isMobile) guessInput.focus();
                adjustBackground();
                setupKeyboardListeners();
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        privateBackBtn.addEventListener("click", handler);
        privateBackBtn.addEventListener("touchstart", handler);
    }

    // Confirm button (form submission)
    if (confirmBtn) {
        const handler = debounce(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Confirm button triggered", { isUILocked });
            if (isUILocked) {
                console.log("Confirm button ignored: UI locked");
                return;
            }
            isUILocked = true;
            const formData = {};
            formInputs.forEach(input => {
                if (input) {
                    formData[input.id] = input.value.trim().toUpperCase();
                }
            });
            console.log("Form data:", formData);

            // Validate inputs
            if (!formData["game-name-input"] || !formData["secret-word"] || !formData["hint-1"] || !formData["hint-2"] || !formData["hint-3"] || !formData["hint-4"] || !formData["hint-5"]) {
                console.log("Form validation failed: missing fields");
                formErrorMessage.textContent = "Please fill out all fields.";
                resetScreenDisplays(formErrorDialog);
                formErrorDialog.style.display = "flex";
                formErrorDialog.classList.add("active");
                adjustBackground();
                setupKeyboardListeners();
                setTimeout(() => { isUILocked = false; }, 500);
                return;
            }

            // Validate secret word
            if (!/^[A-Z]+$/.test(formData["secret-word"])) {
                console.log("的企业 validation failed: secret word contains invalid characters");
                formErrorMessage.textContent = "Secret word must contain only letters.";
                resetScreenDisplays(formErrorDialog);
                formErrorDialog.style.display = "flex";
                formErrorDialog.classList.add("active");
                adjustBackground();
                setupKeyboardListeners();
                setTimeout(() => { isUILocked = false; }, 500);
                return;
            }

            try {
                console.log("Submitting form data to web app:", webAppUrl);
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        "Game Number": `Private-${Date.now()}`,
                        "Game Name": formData["game-name-input"],
                        "Secret Word": formData["secret-word"],
                        "Hint 1": formData["hint-1"],
                        "Hint 2": formData["hint-2"],
                        "Hint 3": formData["hint-3"],
                        "Hint 4": formData["hint-4"],
                        "Hint 5": formData["hint-5"],
                        "Background Image": ""
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log("Form submission result:", result);
                if (result.status === "success") {
                    console.log("Game created successfully, reloading private games");
                    await loadPrivateGames();
                    showGameSelectScreen();
                    privateTab.click();
                } else {
                    console.error("Form submission failed:", result.message);
                    formErrorMessage.textContent = result.message || "Failed to create game.";
                    resetScreenDisplays(formErrorDialog);
                    formErrorDialog.style.display = "flex";
                    formErrorDialog.classList.add("active");
                    adjustBackground();
                    setupKeyboardListeners();
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                formErrorMessage.textContent = "An error occurred while creating the game.";
                resetScreenDisplays(formErrorDialog);
                formErrorDialog.style.display = "flex";
                formErrorDialog.classList.add("active");
                adjustBackground();
                setupKeyboardListeners();
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        confirmBtn.addEventListener("click", handler);
        confirmBtn.addEventListener("touchstart", handler);
    }

    // Previous and Next Game arrows
    if (prevGameArrow && nextGameArrow) {
        prevGameArrow.addEventListener("click", async (e) => {
            e.preventDefault();
            console.log("Previous Game arrow clicked", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Previous Game arrow ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
            if (currentIndex > 0) {
                const prevGame = allGames[currentIndex - 1];
                await loadGame(prevGame["Game Number"], prevGame["Game ID"]);
                resetGameState();
                resetScreenDisplays(gameScreen);
                showKeyboard();
                activeInput = guessInput;
                if (!isMobile) guessInput.focus();
                adjustBackground();
                setupHints();
                updateNavigationArrows();
                setupKeyboardListeners();
            }
            setTimeout(() => { isUILocked = false; }, 500);
        });

        nextGameArrow.addEventListener("click", async (e) => {
            e.preventDefault();
            console.log("Next Game arrow clicked", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Next Game arrow ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
            if (currentIndex >= 0 && currentIndex < allGames.length - 1) {
                const nextGame = allGames[currentIndex + 1];
                await loadGame(nextGame["Game Number"], nextGame["Game ID"]);
                resetGameState();
                resetScreenDisplays(gameScreen);
                showKeyboard();
                activeInput = guessInput;
                if (!isMobile) guessInput.focus();
                adjustBackground();
                setupHints();
                updateNavigationArrows();
                setupKeyboardListeners();
            }
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Update navigation arrows
    function updateNavigationArrows() {
        console.log("Updating navigation arrows", { currentGameNumber, allGamesLength: allGames.length });
        if (!prevGameArrow || !nextGameArrow || !gameNumberText) {
            console.error("Navigation elements not found");
            return;
        }
        const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
        gameNumberText.textContent = currentGameNumber || "";
        prevGameArrow.classList.toggle("disabled", currentIndex <= 0);
        nextGameArrow.classList.toggle("disabled", currentIndex >= allGames.length - 1 || currentIndex < 0);
    }

    // Parse CSV
    async function parseCSV(url) {
        try {
            console.log("Fetching CSV from:", url);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch CSV: ${response.statusText}`);
            }
            const text = await response.text();
            console.log("CSV text received, length:", text.length);
            const rows = text.trim().split("\n").map(row => row.split(",").map(cell => cell.trim()));
            const headers = rows[0];
            const data = rows.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = row[i] || "";
                });
                return obj;
            });
            console.log("Parsed CSV data:", data);
            return data;
        } catch (error) {
            console.error("Error parsing CSV:", error);
            return [];
        }
    }

    // Load official games
    async function loadOfficialGames() {
        console.log("Loading official games");
        allGames = await parseCSV(officialUrl);
        console.log("Official games loaded:", allGames);
    }

    // Load private games
    async function loadPrivateGames() {
        console.log("Loading private games");
        privateGames = await parseCSV(privateUrl);
        console.log("Private games loaded:", privateGames);
        allGames = [...allGames.filter(game => !game["Game Number"].includes("Private")), ...privateGames];
        console.log("Updated allGames with private games:", allGames);
    }

    // Load game
    async function loadGame(gameNumber, gameId) {
        console.log("Loading game:", { gameNumber, gameId });
        isLoadingGame = true;
        try {
            let gameData;
            if (gameNumber.includes("Private")) {
                gameData = privateGames.find(game => game["Game Number"] === gameNumber);
            } else {
                gameData = allGames.find(game => game["Game Number"] === gameNumber);
            }

            if (!gameData) {
                console.error("Game not found:", gameNumber);
                showGameSelectScreen();
                return;
            }

            console.log("Game data found:", gameData);
            currentGameNumber = gameNumber;
            currentGameId = gameId || gameData["Game ID"];
            secretWord = gameData["Secret Word"]?.toUpperCase() || "";
            hints = [
                gameData["Hint 1"],
                gameData["Hint 2"],
                gameData["Hint 3"],
                gameData["Hint 4"],
                gameData["Hint 5"]
            ].filter(hint => hint && hint.trim()).map(hint => hint.toUpperCase());

            console.log("Game loaded", { secretWord, hints });

            const backgroundUrl = gameData["Background Image"]?.trim() || defaultBackground;
            currentBackground = await preloadBackground(backgroundUrl);
            adjustBackground();

            randomizeHintStyles();
            setupHints();
            updateNavigationArrows();
        } catch (error) {
            console.error("Error loading game:", error);
            showGameSelectScreen();
        } finally {
            isLoadingGame = false;
        }
    }

    // Reset game state
    function resetGameState() {
        console.log("Resetting game state");
        gameOver = false;
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        gaveUp = false;
        isProcessingGuess = false;
        guesses = [];
        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
        }
        if (guessBtn) {
            guessBtn.disabled = false;
        }
        if (guessInputContainer) {
            guessInputContainer.classList.remove("game-ended", "wrong-guess");
        }
        if (animationTimeout) {
            clearTimeout(animationTimeout);
            animationTimeout = null;
        }
        stopPineappleRain();
        console.log("Game state reset");
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
        if (isProcessingGuess || gameOver || !guess) {
            console.log("Guess ignored", { isProcessingGuess, gameOver, guess });
            return;
        }
        isProcessingGuess = true;
        console.log("Handling guess:", guess, { guessCount, hintIndex });
        guessCount++;
        guesses.push(guess);
        firstGuessMade = true;

        if (guess === secretWord) {
            console.log("Correct guess!");
            endGame(true);
            isProcessingGuess = false;
            return;
        }

        console.log("Incorrect guess");
        guessInputContainer.classList.add("wrong-guess");
        if (hintIndex < hints.length - 1) {
            revealHint();
        } else if (hintIndex === hints.length - 1 && guessCount >= 2) {
            console.log("Last hint already shown and max guesses reached");
            endGame(false);
            isProcessingGuess = false;
            return;
        }

        guessInput.value = "";
        animationTimeout = setTimeout(() => {
            guessInputContainer.classList.remove("wrong-guess");
            isProcessingGuess = false;
            console.log("Animation complete, reset processing state");
        }, 350);
    }

    // End game
    function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp, guessCount, secretWord });
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;

        resetScreenDisplays(gameScreen);
        gameScreen.style.display = "flex";
        gameScreen.classList.add("game-ended");
        guessArea.style.display = "flex";
        adjustBackground();

        if (guessInput && guessInputContainer) {
            guessInput.value = "";
            guessInputContainer.classList.add("game-ended");
        }

        for (let i = 1; i <= 5; i++) {
            const hintElement = document.getElementById(`hint-${i}`);
            if (hintElement) {
                hintElement.style.display = "none";
            }
        }

        gameControlsContainer.style.display = "none";
        if (isMobile && keyboardContainer) {
            keyboardContainer.style.display = "none";
        }

        const gameOverScreen = document.getElementById("game-over");
        gameOverScreen.style.display = "flex";
        gameOverScreen.classList.add("active");

        // Remove existing messages
        const existingGameOverMessage = document.getElementById("game-over-message");
        if (existingGameOverMessage) {
            existingGameOverMessage.remove();
        }
        const existingSecretWordMessage = document.getElementById("secret-word-message");
        if (existingSecretWordMessage) {
            existingSecretWordMessage.remove();
        }

        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");
        const gameOverMessage = document.createElement("span");
        gameOverMessage.id = "game-over-message";
        gameOverMessage.textContent = won ? "Well Done" : "Hard Luck";

        // Add secret word message
        const secretWordMessage = document.createElement("span");
        secretWordMessage.id = "secret-word-message";
        secretWordMessage.textContent = `The secret word was ${secretWord}`;
        gameOverScreen.insertBefore(gameOverMessage, shareSection);
        gameOverScreen.insertBefore(secretWordMessage, shareSection);

        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
            gameNumberDisplay.style.display = "block";
        }

        let shareMessage;
        if (gaveUp || !won) {
            shareMessage = "Play WORDY";
        } else {
            shareMessage = `I solved WORDY ${currentGameNumber} in <span class="guess-count">${guessCount}</span> ${guessCount === 1 ? 'guess' : 'guesses'}`;
        }

        if (shareText) {
            shareText.innerHTML = shareMessage.replace(/\n/g, "<br>");
        }

        const shareButtons = {
            whatsapp: document.getElementById("share-whatsapp"),
            telegram: document.getElementById("share-telegram"),
            twitter: document.getElementById("share-twitter"),
            instagram: document.getElementById("share-instagram")
        };

        if (shareButtons.whatsapp) {
            shareButtons.whatsapp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage.replace(/<[^>]+>/g, ''))}`;
        }
        if (shareButtons.telegram) {
            shareButtons.telegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://wordy.bigbraingames.net")}&text=${encodeURIComponent(shareMessage.replace(/<[^>]+>/g, ''))}`;
        }
        if (shareButtons.twitter) {
            shareButtons.twitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage.replace(/<[^>]+>/g, ''))}`;
        }
        if (shareButtons.instagram) {
            shareButtons.instagram.addEventListener("click", (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(shareMessage.replace(/<[^>]+>/g, '')).then(() => {
                    alert("Score copied to clipboard! Paste it into your Instagram post.");
                    window.open("https://www.instagram.com/", "_blank");
                }).catch(err => {
                    console.error("Failed to copy to clipboard:", err);
                    alert("Please copy your score manually and share it on Instagram.");
                    window.open("https://www.instagram.com/", "_blank");
                });
            });
        }

        if (won) {
            startPineappleRain();
        }

        setupKeyboardListeners();

        if (currentGameNumber.includes("- Private")) {
            displayGameList();
            console.log("Private games list updated after game end");
        }
    }

    // Pineapple rain effect
    function startPineappleRain() {
        console.log("Starting pineapple rain");
        const pineappleRain = document.createElement("div");
        pineappleRain.className = "pineapple-rain";
        document.body.appendChild(pineappleRain);

        const duration = 5000;
        const interval = 100;
        const emojis = ["🍍", "🍍", "🍍", "⭐", "🌟"];
        let piecesCreated = 0;
        const maxPieces = 50;

        const createPiece = () => {
            if (piecesCreated >= maxPieces) {
                console.log("Max pineapple pieces reached");
                return;
            }
            const piece = document.createElement("div");
            piece.className = "pineapple-piece";
            piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.animationDuration = `${Math.random() * 2 + 2}s`;
            piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
            piece.style.setProperty('--drift', `${Math.random() * 2 - 1}`);
            pineappleRain.appendChild(piece);
            piecesCreated++;
            piece.addEventListener("animationend", () => {
                piece.remove();
            });
        };

        const intervalId = setInterval(createPiece, interval);
        setTimeout(() => {
            clearInterval(intervalId);
            console.log("Pineapple rain interval cleared");
            setTimeout(() => {
                pineappleRain.remove();
                console.log("Pineapple rain container removed");
            }, 3000);
        }, duration);
    }

    // Stop pineapple rain
    function stopPineappleRain() {
        console.log("Stopping pineapple rain");
        const pineappleRain = document.querySelector(".pineapple-rain");
        if (pineappleRain) {
            pineappleRain.remove();
            console.log("Pineapple rain container removed");
        }
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select screen");
        resetScreenDisplays(gameSelectContent);
        gameSelectContent.style.display = "flex";
        gameSelectContent.classList.add("active");
        officialTab.click();
        adjustBackground();
        setupKeyboardListeners();
    }

    // Display game list
    function displayGameList() {
        console.log("Displaying game list", { allGamesLength: allGames.length, privateGamesLength: privateGames.length });
        if (!officialContent || !privateContent) {
            console.error("Game list containers not found");
            return;
        }

        const populateList = (container, games) => {
            const gameList = container.querySelector(".game-list");
            if (!gameList) {
                console.error("Game list element not found in container");
                return;
            }
            gameList.innerHTML = "";
            games.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                const number = document.createElement("span");
                number.textContent = game["Game Number"];
                const name = document.createElement("span");
                name.textContent = game["Game Name"] || "Unnamed Game";
                const playNow = document.createElement("span");
                playNow.className = "play-now";
                playNow.textContent = "Play Now";
                row.appendChild(number);
                row.appendChild(name);
                row.appendChild(playNow);

                const handler = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Play Now clicked for game:", game["Game Number"]);
                    if (isUILocked || isLoadingGame) {
                        console.log("Play Now ignored: UI locked or game loading");
                        return;
                    }
                    isUILocked = true;
                    await loadGame(game["Game Number"], game["Game ID"]);
                    resetGameState();
                    resetScreenDisplays(gameScreen);
                    showKeyboard();
                    activeInput = guessInput;
                    if (!isMobile) guessInput.focus();
                    adjustBackground();
                    setupHints();
                    updateNavigationArrows();
                    setupKeyboardListeners();
                    setTimeout(() => { isUILocked = false; }, 500);
                };

                row.addEventListener("click", handler);
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
                        handler(e);
                    }
                });

                gameList.appendChild(row);
            });
        };

        const officialGames = allGames.filter(game => !game["Game Number"].includes("Private"));
        populateList(officialContent, officialGames);
        populateList(privateContent, privateGames);
        console.log("Game lists populated");
    }

    // Initialize
    async function initialize() {
        console.log("Initializing game");
        try {
            await loadOfficialGames();
            await loadPrivateGames();
            const urlParams = new URLSearchParams(window.location.search);
            const gameNumber = urlParams.get("game");
            const gameId = urlParams.get("id");

            if (gameNumber && allGames.some(game => game["Game Number"] === gameNumber)) {
                console.log("Loading game from URL params:", { gameNumber, gameId });
                await loadGame(gameNumber, gameId);
                resetGameState();
                resetScreenDisplays(gameScreen);
                showKeyboard();
                activeInput = guessInput;
                if (!isMobile) guessInput.focus();
                adjustBackground();
                setupHints();
                updateNavigationArrows();
                setupKeyboardListeners();
            } else {
                console.log("No valid game in URL, showing game select screen");
                showGameSelectScreen();
            }
        } catch (error) {
            console.error("Initialization error:", error);
            showGameSelectScreen();
        }
    }

    // Start initialization
    initialize();
});