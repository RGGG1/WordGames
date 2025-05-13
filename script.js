document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded");

    // State variables
    let gameOver = false;
    let secretWord = "";
    let hints = [];
    let hintIndex = 0;
    let lastHintLines = 0;
    let firstGuessMade = false;
    let allGames = [];
    let privateGames = [];
    let currentGameNumber = null;
    let guessCount = 0;
    let gaveUp = false;
    let isProcessingGuess = false;
    let isLoadingGame = false;
    let isUILocked = false;
    let guesses = [];
    let animationTimeout = null;
    let activeInput = null;
    let currentBackground = "newbackground.png";

    // DOM elements
    const gameScreen = document.getElementById("game-screen");
    const mainContent = document.getElementById("main-content");
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
    const header = document.getElementById("header");

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
    const touchThreshold = 5; // Reduced from 10 for higher sensitivity

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

    // Initialize cursor
    function initializeCursor() {
        const cursor = document.querySelector(".cursor");
        if (!cursor || !guessInput) {
            console.error("Cursor or guess-input not found in DOM");
            return;
        }

        function updateCursorPosition() {
            if (guessInput.disabled) {
                cursor.style.display = "none";
                return;
            }
            cursor.style.display = "inline-block";

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            context.font = `${isMobile ? "3.75vh" : "4.5vh"} 'Luckiest Guy', cursive`;
            const textWidth = context.measureText(guessInput.value.toUpperCase()).width;

            const containerStyles = getComputedStyle(guessInputContainer);
            const paddingLeft = parseFloat(containerStyles.paddingLeft);
            const paddingRight = parseFloat(containerStyles.paddingRight);
            const containerWidth = guessInputContainer.offsetWidth;

            let cursorLeft = paddingLeft + textWidth;
            const cursorWidth = parseFloat(getComputedStyle(cursor).width);
            const maxLeft = containerWidth - paddingRight - cursorWidth;

            if (cursorLeft > maxLeft) {
                cursorLeft = maxLeft;
            }
            cursor.style.left = `${cursorLeft}px`;
            cursor.style.top = "50%";
            cursor.style.transform = "translateY(-50%)";

            console.log("Cursor updated:", { textWidth, cursorLeft, maxLeft });
        }

        if (isMobile) {
            guessInput.setAttribute("readonly", "readonly");
            guessInput.addEventListener("focus", (e) => {
                e.preventDefault();
                console.log("Prevented focus on guessInput to avoid virtual keyboard");
            });
        } else {
            guessInput.readOnly = false;
        }

        guessInput.addEventListener("input", () => {
            guessInput.value = guessInput.value.toUpperCase();
            updateCursorPosition();
        });
        ["change", "keyup", "click", "touchstart"].forEach(event => {
            guessInput.addEventListener(event, updateCursorPosition);
        });
        guessInput.addEventListener("guessProcessed", updateCursorPosition);

        const observer = new MutationObserver(updateCursorPosition);
        observer.observe(guessInput, { attributes: true, attributeFilter: ["disabled"] });

        updateCursorPosition();
    }

    // Setup guess input
    if (guessInput) {
        guessInput.disabled = false;
        guessInput.addEventListener("input", (e) => {
            console.log("Guess input value changed:", guessInput.value);
            if (animationTimeout) {
                clearTimeout(animationTimeout);
                animationTimeout = null;
                guessInputContainer.classList.remove("wrong-guess");
                guessInput.style.opacity = "1";
                guessInput.style.visibility = "visible";
                guessInput.style.color = "#000000";
                guessInput.value = e.target.value.toUpperCase();
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
        if (!isMobile) {
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
        keyboardContainer.classList.remove("show-alternate", "show-guesses", "show-give-up", "show-game-over");
        keyboardContainer.style.display = "flex";
        keyboardContent.style.display = "flex";
        keyboardGuessesContent.style.display = "none";
        keyboardGiveUpContent.style.display = "none";
        document.getElementById("game-over").style.display = "none";
        keyboardBackBtn.style.display = "none";
        keyboardContainer.offsetHeight;
        if (guessInput && !gameOver && !isProcessingGuess) {
            activeInput = guessInput;
            guessInput.dispatchEvent(new Event("guessProcessed"));
        }
        setupKeyboardListeners();
    }

    // Reset screen displays
    function resetScreenDisplays(activeScreen) {
        console.log("Resetting screen displays for:", activeScreen?.id);
        const screens = [formErrorDialog, guessesScreen, giveUpDialog];
        screens.forEach(screen => {
            if (screen && screen !== activeScreen) {
                screen.style.display = "none";
            }
        });

        if (activeScreen === gameScreen) {
            mainContent.style.display = "flex";
            gameSelectContent.style.display = "none";
            gameSelectContent.classList.remove("active");
            formContent.style.display = "none";
            formContent.classList.remove("active");
            document.getElementById("game-over").style.display = "none";
            document.getElementById("game-over").classList.remove("active");
            gameControlsContainer.style.display = "flex";
            if (isMobile && !gameOver) {
                keyboardContainer.style.display = "flex";
                showKeyboard();
            } else {
                keyboardContainer.style.display = "none";
            }
        } else if (activeScreen === gameSelectContent) {
            mainContent.style.display = "none";
            gameSelectContent.style.display = "flex";
            gameSelectContent.classList.add("active");
            formContent.style.display = "none";
            formContent.classList.remove("active");
            document.getElementById("game-over").style.display = "none";
            document.getElementById("game-over").classList.remove("active");
            gameControlsContainer.style.display = "none";
            keyboardContainer.style.display = "none";
        } else if (activeScreen === formContent) {
            mainContent.style.display = "none";
            gameSelectContent.style.display = "none";
            gameSelectContent.classList.remove("active");
            formContent.style.display = "flex";
            formContent.classList.add("active");
            document.getElementById("game-over").style.display = "none";
            document.getElementById("game-over").classList.remove("active");
            gameControlsContainer.style.display = "flex";
            if (isMobile) {
                keyboardContainer.style.display = "flex";
                showKeyboard();
            } else {
                keyboardContainer.style.display = "none";
            }
        }

        if (activeScreen && activeScreen !== gameScreen) {
            activeScreen.style.display = "flex";
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
                    if (activeInput === guessInput) initializeCursor();
                } else {
                    activeInput.value += keyValue;
                    console.log("Key added, new value:", activeInput.value);
                    if (activeInput === guessInput) initializeCursor();
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
            if (e.target === keyboardGuessesContent || e.target === document.getElementById("guesses-list") || e.target === document.getElementById("guesses-title")) {
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
                    keyboardBackBtn.style.display = "block";
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
                normalizedGameNumber = currentGameNumber.split(" - ")[0];
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
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses link triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Guesses link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            const guessesList = document.getElementById("guesses-list");
            console.log("Current guesses array:", guesses);
            if (isMobile) {
                if (keyboardContainer && keyboardContent && keyboardGuessesContent && keyboardBackBtn) {
                    guessesList.innerHTML = guesses.length > 0 
                        ? guesses.join(' <span class="separator yellow">|</span> ')
                        : "No guesses yet!";
                    keyboardContainer.classList.add("show-alternate", "show-guesses");
                    keyboardContent.style.display = "none";
                    keyboardGuessesContent.style.display = "flex";
                    keyboardGiveUpContent.style.display = "none";
                    keyboardBackBtn.style.display = "block";
                    console.log("Showing guesses content in keyboard container");
                }
            } else {
                guessesList.innerHTML = guesses.length > 0 
                    ? guesses.join(' <span class="separator yellow">|</span> ')
                    : "No guesses yet!";
                guessesScreen.style.display = "flex";
                console.log("Showing guesses screen");
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        guessesLink.addEventListener(isMobile ? "touchstart" : "click", handler);

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
                if (!currentGameNumber) {
                    throw new Error("No current game number set");
                }
                let currentIndex;
                let gameList;
                let isPrivate = currentGameNumber.includes("- Private");
                if (isPrivate) {
                    const currentNum = parseInt(currentGameNumber.split(" - ")[0]);
                    currentIndex = privateGames.findIndex(game => game["Game Number"] === String(currentNum));
                    gameList = privateGames;
                } else {
                    currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber.replace("Game #", ""));
                    gameList = allGames;
                }
                console.log("Navigation details", { isPrivate, currentIndex, gameListLength: gameList.length });
                if (currentIndex === -1) {
                    throw new Error(`Current game not found in game list: ${currentGameNumber}`);
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
                if (!currentGameNumber) {
                    throw new Error("No current game number set");
                }
                let currentIndex;
                let gameList;
                let isPrivate = currentGameNumber.includes("- Private");
                if (isPrivate) {
                    const currentNum = parseInt(currentGameNumber.split(" - ")[0]);
                    currentIndex = privateGames.findIndex(game => game["Game Number"] === String(currentNum));
                    gameList = privateGames;
                } else {
                    currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber.replace("Game #", ""));
                    gameList = allGames;
                }
                console.log("Navigation details", { isPrivate, currentIndex, gameListLength: gameList.length });
                if (currentIndex === -1) {
                    throw new Error(`Current game not found in game list: ${currentGameNumber}`);
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

    // Update arrow states
    function updateArrowStates(currentIndex, gameList) {
        if (prevGameArrow) {
            prevGameArrow.classList.remove("disabled");
            if (currentIndex >= gameList.length - 1) {
                prevGameArrow.classList.add("disabled");
            }
        }
        if (nextGameArrow) {
            nextGameArrow.classList.remove("disabled");
            if (currentIndex <= 0) {
                nextGameArrow.classList.add("disabled");
            }
        }
        console.log("Arrow states updated", { currentIndex, gameListLength: gameList.length, prevDisabled: currentIndex >= gameList.length - 1, nextDisabled: currentIndex <= 0 });
    }

    // Create a Wordy button
    if (createPineappleBtn && formContent) {
        createPineappleBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create a Wordy triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            resetScreenDisplays(formContent);
            formContent.style.display = "flex";
            formContent.classList.add("active");
            activeInput = document.getElementById("game-name-input");
            if (activeInput && !isMobile) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
            if (isMobile) showKeyboard();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Create Wordy end button
    if (createPineappleLink) {
        createPineappleLink.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Wordy end button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            resetScreenDisplays(gameSelectContent);
            gameSelectContent.style.display = "flex";
            gameSelectContent.classList.add("active");
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            privateContent.style.display = "flex";
            officialContent.classList.remove("active");
            officialContent.style.display = "none";
            document.getElementById("game-over").style.display = "none";
            document.getElementById("game-over").classList.remove("active");
            document.getElementById("main-content").style.display = "flex";
            displayGameList();
            adjustBackground();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Next game button on end screen
    if (nextGameBtnEnd) {
        nextGameBtnEnd.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next Game button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            resetGame();
            showGameSelectScreen();
            document.getElementById("game-over").style.display = "none";
            document.getElementById("game-over").classList.remove("active");
            adjustBackground();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Official back button
    if (officialBackBtn) {
        officialBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Official Back button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            gameSelectContent.style.display = "none";
            gameSelectContent.classList.remove("active");
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
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
            if (isUILocked) return;
            isUILocked = true;
            gameSelectContent.style.display = "none";
            gameSelectContent.classList.remove("active");
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            showKeyboard();
            activeInput = guessInput;
            if (activeInput && !isMobile) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Confirm button
    if (confirmBtn) {
        const handler = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Confirm button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            const secretWordInput = document.getElementById("secret-word").value.trim();
            if (secretWordInput.includes(" ") || secretWordInput === "") {
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Secret Word must be one word (no spaces) and cannot be empty.";
                    formErrorDialog.style.display = "flex";
                    activeInput = document.getElementById("secret-word");
                }
                isUILocked = false;
                return;
            }

            const formData = {
                gameName: document.getElementById("game-name-input").value.trim(),
                secretWord: secretWordInput.toUpperCase(),
                hint1: document.getElementById("hint-1").value.trim().toUpperCase(),
                hint2: document.getElementById("hint-2").value.trim().toUpperCase(),
                hint3: document.getElementById("hint-3").value.trim().toUpperCase(),
                hint4: document.getElementById("hint-4").value.trim().toUpperCase(),
                hint5: document.getElementById("hint-5").value.trim().toUpperCase()
            };

            if (!formData.gameName || !formData.secretWord || !formData.hint1 || !formData.hint2 || !formData.hint3 || !formData.hint4 || !formData.hint5) {
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Please fill in Game Name, Secret Word, and all Hints (1–5).";
                    formErrorDialog.style.display = "flex";
                    activeInput = formData.gameName ? (formData.secretWord ? null : document.getElementById("secret-word")) : document.getElementById("game-name-input");
                }
                isUILocked = false;
                return;
            }

            try {
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: "data=" + encodeURIComponent(JSON.stringify(formData))
                });
                const result = await response.text();
                console.log("Web App response:", result);

                if (result !== "Success") {
                    throw new Error(result || "Unknown error from Web App");
                }

                console.log("Game created successfully");
                formInputs.forEach(input => (input.value = ""));
                formContent.style.display = "none";
                formContent.classList.remove("active");
                resetScreenDisplays(gameSelectContent);
                gameSelectContent.style.display = "flex";
                gameSelectContent.classList.add("active");
                privateTab.classList.add("active");
                officialTab.classList.remove("active");
                privateContent.classList.add("active");
                privateContent.style.display = "flex";
                officialContent.classList.remove("active");
                officialContent.style.display = "none";
                await fetchPrivateGames();
                displayGameList();
                adjustBackground();
                setupKeyboardListeners();
                if (isMobile) showKeyboard();
            } catch (error) {
                console.error("Error submitting form:", error);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to create game: " + error.message;
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
            }
        };
        confirmBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Form error dialog
    if (formErrorDialog && formErrorOkBtn && formErrorMessage) {
        formErrorOkBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form Error OK button triggered");
            formErrorDialog.style.display = "none";
            if (activeInput) activeInput.focus();
            setupKeyboardListeners();
        });

        formErrorDialog.addEventListener("click", (e) => {
            if (e.target === formErrorDialog) {
                console.log("Clicked outside form error dialog");
                formErrorDialog.style.display = "none";
                if (activeInput) activeInput.focus();
                setupKeyboardListeners();
            }
        });
    }

    // Form back button
    if (formBackBtn) {
        formBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form Back button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            formContent.style.display = "none";
            formContent.classList.remove("active");
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
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
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            if (isMobile) {
                showKeyboard();
            } else {
                guessesScreen.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
            setTimeout(() => { isUILocked = false; }, 500);
        };
        guessesCloseBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Mobile give-up buttons
    const keyboardGiveUpYesBtn = document.getElementById("keyboard-give-up-yes-btn");
    const keyboardGiveUpNoBtn = document.getElementById("keyboard-give-up-no-btn");

    if (keyboardGiveUpYesBtn) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Mobile Give Up Yes button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            gaveUp = true;
            let normalizedGameNumber;
            let gameType;
            if (currentGameNumber.includes("- Private")) {
                normalizedGameNumber = currentGameNumber.split(" - ")[0];
                gameType = "privatePineapple";
            } else {
                normalizedGameNumber = currentGameNumber.replace("Game #", "");
                gameType = "pineapple";
            }
            saveGameResult(gameType, normalizedGameNumber, secretWord, "Gave Up");
            endGame(false, true);
            setTimeout(() => { isUILocked = false; }, 500);
        };
        keyboardGiveUpYesBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    if (keyboardGiveUpNoBtn) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Mobile Give Up No button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            showKeyboard();
            if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
            setTimeout(() => { isUILocked = false; }, 500);
        };
        keyboardGiveUpNoBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Give-up dialog
    if (giveUpDialog) {
        giveUpDialog.addEventListener("click", (e) => {
            if (e.target === giveUpDialog && !isMobile) {
                console.log("Clicked outside give-up dialog");
                giveUpDialog.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
        });
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select overlay", { isUILocked });
        resetScreenDisplays(gameSelectContent);
        gameSelectContent.style.display = "flex";
        gameSelectContent.classList.add("active");
        officialTab.classList.add("active");
        privateTab.classList.remove("active");
        officialContent.classList.add("active");
        officialContent.style.display = "flex";
        privateContent.classList.remove("active");
        privateContent.style.display = "none";
        displayGameList();
        adjustBackground();
        setupKeyboardListeners();
    }

    // Fetch game data with enhanced error handling
    async function fetchGameData() {
        try {
            console.log("Fetching official games from:", officialUrl);
            const response = await fetch(officialUrl, {
                method: "GET",
                mode: "cors",
                cache: "no-cache",
                headers: { "Accept": "text/csv" }
            });
            if (!response.ok) {
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            if (!text.trim()) throw new Error("Empty CSV response");

            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            allGames = parsed.data
                .filter(game => game["Game Number"] && game["Secret Word"])
                .sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            if (allGames.length === 0) throw new Error("No valid games in CSV");

            const latestGame = allGames[0];
            currentBackground = latestGame["Background"] && latestGame["Background"].trim() !== "" ? latestGame["Background"] : defaultBackground;
            console.log("Selected background:", currentBackground);

            await preloadBackground(currentBackground);
            adjustBackground();
            loadGame(latestGame);
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            showKeyboard();
            setupEventListeners();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
        } catch (error) {
            console.error("Error in fetchGameData:", error.message);
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
            currentBackground = defaultBackground;
            console.log("Using fallback game with default background:", currentBackground);
            await preloadBackground(currentBackground);
            adjustBackground();
            loadGame(allGames[0]);
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            showKeyboard();
            setupEventListeners();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load official games. Using default game.";
                formErrorDialog.style.display = "flex";
            }
        } finally {
            isUILocked = false;
            isLoadingGame = false;
        }
    }

        // Fetch private games
    async function fetchPrivateGames() {
        try {
            console.log("Fetching private games from:", privateUrl);
            const response = await fetch(privateUrl, {
                method: "GET",
                mode: "cors",
                cache: "no-cache",
                headers: { "Accept": "text/csv" }
            });
            if (!response.ok) {
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            if (!text.trim()) throw new Error("Empty CSV response");

            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            privateGames = parsed.data
                .filter(game => game["Game Number"] && game["Secret Word"])
                .sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            console.log("Private games fetched:", privateGames.length);
        } catch (error) {
            console.error("Error fetching private games:", error.message);
            privateGames = [];
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load private games.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Display game list
    function displayGameList() {
        console.log("Displaying game list");
        const officialList = document.getElementById("official-game-list");
        const privateList = document.getElementById("private-game-list");

        if (officialList) {
            officialList.innerHTML = "";
            const results = JSON.parse(localStorage.getItem("pineappleResults") || "{}");
            allGames.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                const gameNumber = game["Game Number"];
                const normalizedGameNumber = String(gameNumber);
                const result = results[normalizedGameNumber] || { guesses: "-" };
                row.innerHTML = `
                    <span>${gameNumber}</span>
                    <span>${result.guesses}</span>
                    <span>${result.secretWord || "-"}</span>
                `;
                row.addEventListener("click", () => selectGame(game));
                row.addEventListener("touchstart", handleTouchStart);
                row.addEventListener("touchmove", handleTouchMove);
                row.addEventListener("touchend", (e) => handleTouchEnd(e, game));
                officialList.appendChild(row);
            });
        }

        if (privateList) {
            privateList.innerHTML = "";
            const results = JSON.parse(localStorage.getItem("privatePineappleResults") || "{}");
            privateGames.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                const gameNumber = game["Game Number"];
                const gameName = game["Game Name"] || "Unnamed";
                const normalizedGameNumber = String(gameNumber);
                const result = results[normalizedGameNumber] || { guesses: "-" };
                row.innerHTML = `
                    <span>${gameName}</span>
                    <span>${result.guesses}</span>
                    <span>${result.secretWord || "-"}</span>
                `;
                row.addEventListener("click", () => selectGame(game));
                row.addEventListener("touchstart", handleTouchStart);
                row.addEventListener("touchmove", handleTouchMove);
                row.addEventListener("touchend", (e) => handleTouchEnd(e, game));
                privateList.appendChild(row);
            });
        }
    }

    // Handle touch start
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchMoved = false;
        console.log("Touch start recorded:", { x: touchStartX, y: touchStartY });
    }

    // Handle touch move
    function handleTouchMove(e) {
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = Math.abs(touchX - touchStartX);
        const deltaY = Math.abs(touchY - touchStartY);
        if (deltaX > touchThreshold || deltaY > touchThreshold) {
            touchMoved = true;
            console.log("Touch moved beyond threshold:", { deltaX, deltaY, threshold: touchThreshold });
        }
    }

    // Handle touch end
    function handleTouchEnd(e, game) {
        e.preventDefault();
        if (!touchMoved) {
            console.log("Touch end without significant movement, selecting game:", game["Game Number"]);
            selectGame(game);
        } else {
            console.log("Touch end ignored due to movement");
        }
    }

    // Select game
    async function selectGame(game) {
        console.log("Selecting game:", game["Game Number"], { isUILocked, isLoadingGame });
        if (isUILocked || isLoadingGame) {
            console.log("Game selection ignored: UI locked or game loading");
            return;
        }
        isUILocked = true;
        isLoadingGame = true;
        try {
            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
            await preloadBackground(currentBackground);
            loadGame(game);
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            gameSelectContent.style.display = "none";
            gameSelectContent.classList.remove("active");
            adjustBackground();
            if (isMobile && !gameOver) showKeyboard();
            const isPrivate = game["Game Number"].includes("- Private");
            const gameList = isPrivate ? privateGames : allGames;
            const currentIndex = gameList.findIndex(g => g["Game Number"] === game["Game Number"]);
            updateArrowStates(currentIndex, gameList);
        } catch (error) {
            console.error("Error selecting game:", error.message);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load selected game.";
                formErrorDialog.style.display = "flex";
            }
        } finally {
            isUILocked = false;
            isLoadingGame = false;
        }
    }

    // Load game
    function loadGame(game) {
        console.log("Loading game:", game["Game Number"]);
        resetGame();
        currentGameNumber = game["Game Number"].includes("- Private") ? game["Game Number"] : `Game #${game["Game Number"]}`;
        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"],
            game["Hint 2"],
            game["Hint 3"],
            game["Hint 4"],
            game["Hint 5"]
        ].filter(hint => hint).map(hint => hint.toUpperCase());
        hintIndex = 0;
        firstGuessMade = false;
        gameOver = false;
        guessCount = 0;
        gaveUp = false;
        guesses = [];

        const resultsKey = game["Game Number"].includes("- Private") ? "privatePineappleResults" : "pineappleResults";
        const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
        const normalizedGameNumber = game["Game Number"].includes("- Private") ? game["Game Number"].split(" - ")[0] : game["Game Number"];
        const savedResult = results[normalizedGameNumber];

        if (savedResult && savedResult.guesses !== "-" && savedResult.guesses !== "Gave Up") {
            console.log("Found saved result for game:", savedResult);
            guessCount = parseInt(savedResult.guesses) || 0;
            gameOver = true;
            gaveUp = savedResult.guesses === "Gave Up";
            endGame(savedResult.guesses !== "Gave Up" && savedResult.secretWord.toUpperCase() === secretWord, gaveUp);
        } else {
            updateGameNumberDisplay();
            updateHints();
            if (guessInput) {
                guessInput.disabled = false;
                guessInput.value = "";
                guessInput.dispatchEvent(new Event("guessProcessed"));
            }
            if (guessBtn) guessBtn.disabled = false;
            if (!isMobile && guessInput) guessInput.focus();
            activeInput = guessInput;
        }

        console.log("Game loaded", { currentGameNumber, secretWord, hints, gameOver, guessCount });
    }

    // Reset game
    function resetGame() {
        console.log("Resetting game state");
        gameOver = false;
        secretWord = "";
        hints = [];
        hintIndex = 0;
        lastHintLines = 0;
        firstGuessMade = false;
        guessCount = 0;
        gaveUp = false;
        isProcessingGuess = false;
        guesses = [];
        if (guessInput) {
            guessInput.disabled = false;
            guessInput.value = "";
            guessInput.dispatchEvent(new Event("guessProcessed"));
        }
        if (guessBtn) guessBtn.disabled = false;
        if (guessInputContainer) guessInputContainer.classList.remove("wrong-guess", "game-ended");
        const hintsInline = document.querySelector(".hints-inline");
        if (hintsInline) {
            hintsInline.innerHTML = "";
            hintsInline.classList.remove(`lines-${lastHintLines}`);
        }
        document.querySelectorAll(".pineapple-rain").forEach(el => el.remove());
        if (animationTimeout) {
            clearTimeout(animationTimeout);
            animationTimeout = null;
        }
        if (gameNumberText) gameNumberText.textContent = "";
    }

    // Update game number display
    function updateGameNumberDisplay() {
        if (gameNumberText) {
            gameNumberText.textContent = currentGameNumber || "Loading...";
            console.log("Game number updated:", currentGameNumber);
        }
    }

    // Update hints
    function updateHints() {
        console.log("Updating hints, current hintIndex:", hintIndex);
        const hintsInline = document.querySelector(".hints-inline");
        if (!hintsInline) {
            console.error("hints-inline element not found");
            return;
        }

        let hintText = "";
        if (hintIndex < hints.length) {
            hintText = hints[hintIndex];
        } else {
            hintText = "No more hints!";
        }

        const lines = hintText.split(" ").length > 10 ? 2 : 1;
        hintsInline.classList.remove(`lines-${lastHintLines}`);
        hintsInline.classList.add(`lines-${lines}`);
        lastHintLines = lines;

        hintsInline.innerHTML = "";
        const words = hintText.split(" ");
        words.forEach((word, index) => {
            const span = document.createElement("span");
            span.className = "letter";
            span.textContent = word;
            span.style.animationDelay = `${index * 0.05}s`;
            hintsInline.appendChild(span);
            if (index < words.length - 1) {
                const separator = document.createElement("span");
                separator.className = "separator";
                separator.textContent = " ";
                hintsInline.appendChild(separator);
            }
        });

        console.log("Hints updated:", { hintText, lines, hintIndex });
    }

    // Handle guess
    async function handleGuess(guess) {
        console.log("Handling guess:", guess, { isProcessingGuess, gameOver });
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored: already processing or game over");
            return;
        }
        isProcessingGuess = true;
        guess = guess.toUpperCase().trim();

        if (!guess || guess.includes(" ")) {
            console.log("Invalid guess: empty or contains spaces");
            triggerWrongGuess();
            isProcessingGuess = false;
            return;
        }

        try {
            guessCount++;
            guesses.push(guess);
            console.log("Guess processed", { guess, guessCount, guesses });

            if (guess === secretWord) {
                console.log("Correct guess!");
                let normalizedGameNumber;
                let gameType;
                if (currentGameNumber.includes("- Private")) {
                    normalizedGameNumber = currentGameNumber.split(" - ")[0];
                    gameType = "privatePineapple";
                } else {
                    normalizedGameNumber = currentGameNumber.replace("Game #", "");
                    gameType = "pineapple";
                }
                saveGameResult(gameType, normalizedGameNumber, secretWord, String(guessCount));
                endGame(true);
            } else {
                console.log("Incorrect guess");
                triggerWrongGuess();
                if (!firstGuessMade) {
                    firstGuessMade = true;
                    hintIndex++;
                    updateHints();
                }
                if (guessInput) guessInput.value = "";
                guessInput.dispatchEvent(new Event("guessProcessed"));
                isProcessingGuess = false;
            }
        } catch (error) {
            console.error("Error handling guess:", error.message);
            triggerWrongGuess();
            isProcessingGuess = false;
        }
    }

    // Trigger wrong guess
    function triggerWrongGuess() {
        console.log("Triggering wrong guess animation");
        if (guessInputContainer) {
            guessInputContainer.classList.add("wrong-guess");
            guessInput.style.opacity = "0";
            guessInput.style.visibility = "hidden";
            guessInput.style.color = "#FFFFFF";
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                guessInput.style.opacity = "1";
                guessInput.style.visibility = "visible";
                guessInput.style.color = "#000000";
                guessInput.value = "";
                guessInput.dispatchEvent(new Event("guessProcessed"));
                isProcessingGuess = false;
                if (!isMobile && guessInput) guessInput.focus();
                console.log("Wrong guess animation completed");
            }, 350);
        } else {
            isProcessingGuess = false;
        }
    }

    // Save game result
    function saveGameResult(gameType, gameNumber, secretWord, guesses) {
        console.log("Attempting to save game result", { gameType, gameNumber, secretWord, guesses });
        const resultsKey = gameType === "pineapple" ? "pineappleResults" : "privatePineappleResults";
        let normalizedGameNumber = String(gameNumber);
        if (gameType === "pineapple") {
            normalizedGameNumber = gameNumber.replace("Game #", "");
        } else {
            normalizedGameNumber = gameNumber.split(" - ")[0];
        }
        console.log(`Normalized game number: ${normalizedGameNumber}`);
        const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
        if (!results[normalizedGameNumber] || results[normalizedGameNumber].guesses === '-') {
            results[normalizedGameNumber] = { secretWord, guesses };
            localStorage.setItem(resultsKey, JSON.stringify(results));
            console.log(`Game result saved for ${resultsKey}[${normalizedGameNumber}]:`, results[normalizedGameNumber]);
        } else {
            console.log(`Game result not saved for ${resultsKey}[${normalizedGameNumber}]: existing score '${results[normalizedGameNumber].guesses}' is not '-' and will be preserved`);
        }
    }

    // End game
    function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp, guessCount });
        gameOver = true;
        if (guessInput) guessInput.disabled = true;
        if (guessBtn) guessBtn.disabled = true;
        const gameOverScreen = document.getElementById("game-over");
        const shareText = document.getElementById("share-text");
        const shareButtons = document.getElementById("share-buttons");

        if (gameOverScreen) {
            gameOverScreen.style.display = "flex";
            gameOverScreen.classList.add("active");
            resetScreenDisplays(gameOverScreen);
        }

        if (won && !gaveUp) {
            if (guessInputContainer) guessInputContainer.classList.add("game-ended");
            triggerPineappleRain();
        }

        let shareMessage = "";
        if (currentGameNumber) {
            shareMessage += `${currentGameNumber}\n`;
            if (won && !gaveUp) {
                shareMessage += `I got it in ${guessCount} guess${guessCount === 1 ? "" : "es"}!\n`;
            } else if (gaveUp) {
                shareMessage += `I gave up!\n`;
            } else {
                shareMessage += `I didn't get it!\n`;
            }
            shareMessage += `Secret word: ${secretWord}\n`;
            shareMessage += "Play at: https://pineapplewordgame.com";
        }

        if (shareText) {
            shareText.innerHTML = `<span style="color: #FFFFFF">${shareMessage.replace(/\n/g, "<br>")}</span>`;
        }

        if (shareButtons) {
            const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
            shareButtons.innerHTML = `
                <a href="${tweetUrl}" target="_blank" rel="noopener noreferrer"><i class="fab fa-x"></i></a>
                <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp"></i></a>
            `;
        }

        if (isMobile) {
            keyboardContainer.classList.add("show-alternate", "show-game-over");
            keyboardContent.style.display = "none";
            keyboardGuessesContent.style.display = "none";
            keyboardGiveUpContent.style.display = "none";
            keyboardBackBtn.style.display = "none";
        }

        console.log("Game ended, share message:", shareMessage);
    }

    // Trigger pineapple rain
    function triggerPineappleRain() {
        console.log("Triggering pineapple rain animation");
        const rainContainer = document.createElement("div");
        rainContainer.className = "pineapple-rain";
        document.body.appendChild(rainContainer);

        const totalPineapples = 20;
        const emojis = ["🍍", "🌴", "🏝️"];
        for (let i = 0; i < totalPineapples; i++) {
            const piece = document.createElement("div");
            piece.className = "pineapple-piece";
            piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.fontSize = `${1.5 + Math.random() * 2}vh`;
            piece.style.setProperty("--rotation", `${(Math.random() - 0.5) * 720}deg`);
            piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 50}`);
            piece.style.animationDuration = `${3 + Math.random() * 2}s`;
            piece.style.animationDelay = `${Math.random() * 1}s`;
            rainContainer.appendChild(piece);
        }

        setTimeout(() => {
            rainContainer.remove();
            console.log("Pineapple rain animation completed");
        }, 6000);
    }

    // Adjust background
    function adjustBackground() {
        console.log("Adjusting background to:", currentBackground);
        const backgroundContainer = document.getElementById("background-container");
        if (backgroundContainer) {
            backgroundContainer.style.backgroundImage = `url('${currentBackground}')`;
            backgroundContainer.style.backgroundSize = "cover";
            backgroundContainer.style.backgroundPosition = "center center";
            backgroundContainer.style.backgroundRepeat = "no-repeat";
            backgroundContainer.offsetHeight; // Force repaint
            console.log("Background adjusted");
        } else {
            console.error("background-container not found");
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        console.log("Setting up event listeners");
        const gameName = document.getElementById("game-name");
        if (gameName) {
            gameName.addEventListener(isMobile ? "touchstart" : "click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Game name clicked", { isUILocked });
                if (isUILocked) return;
                isUILocked = true;
                showGameSelectScreen();
                setTimeout(() => { isUILocked = false; }, 500);
            });
        }
    }

    // Initialize game
    console.log("Initializing game");
    initializeCursor();
    await fetchGameData();
    await fetchPrivateGames();
    displayGameList();
    adjustBackground();
    setupKeyboardListeners();
});