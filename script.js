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
    const touchThreshold = 10;

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
            guessArea.style.display = "flex";
            guessInputContainer.style.display = "flex";
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
            gameSelectContent.style.display = "flex";
            gameSelectContent.classList.add("active");
            mainContent.style.display = "none";
            adjustBackground();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        allGamesLink.removeEventListener(isMobile ? "touchstart" : "click", handler);
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
           abilia: e.stopPropagation();
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
        console.log("Arrow states updated", { currentIndex, gameListLength: gameList.length });
    }

    // Form back button
    if (formBackBtn) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Form back button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            showGameSelectScreen();
            setTimeout(() => { isUILocked = false; }, 500);
        };
        formBackBtn.addEventListener("click", handler);
        formBackBtn.addEventListener("touchstart", handler);
    }

    // Create Pineapple button
    if (createPineappleBtn) {
        const handler = (e) => {
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
            mainContent.style.display = "none";
            gameSelectContent.style.display = "none";
            gameSelectContent.classList.remove("active");
            formInputs.forEach(input => {
                input.value = "";
                input.disabled = false;
            });
            adjustBackground();
            if (isMobile) {
                keyboardContainer.style.display = "flex";
                showKeyboard();
                activeInput = formInputs[0];
            }
            setTimeout(() => { isUILocked = false; }, 500);
        };
        createPineappleBtn.addEventListener("click", handler);
        createPineappleBtn.addEventListener("touchstart", handler);
    }

    // Create Pineapple link (end game)
    if (createPineappleLink) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple link (end game) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Create Pineapple link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formContent.style.display = "flex";
            formContent.classList.add("active");
            mainContent.style.display = "none";
            gameSelectContent.style.display = "none";
            gameSelectContent.classList.remove("active");
            document.getElementById("game-over").style.display = "none";
            document.getElementById("game-over").classList.remove("active");
            formInputs.forEach(input => {
                input.value = "";
                input.disabled = false;
            });
            adjustBackground();
            if (isMobile) {
                keyboardContainer.style.display = "flex";
                showKeyboard();
                activeInput = formInputs[0];
            }
            setTimeout(() => { isUILocked = false; }, 500);
        };
        createPineappleLink.addEventListener("click", handler);
        createPineappleLink.addEventListener("touchstart", handler);
    }

    // Official back button
    if (officialBackBtn) {
        const handler = (e) => {
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
            gameSelectContent.style.display = "none";
            gameSelectContent.classList.remove("active");
            adjustBackground();
            if (isMobile && !gameOver) {
                keyboardContainer.style.display = "flex";
                showKeyboard();
            }
            if (!isMobile && guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
            setTimeout(() => { isUILocked = false; }, 500);
        };
        officialBackBtn.addEventListener("click", handler);
        officialBackBtn.addEventListener("touchstart", handler);
    }

    // Private back button
    if (privateBackBtn) {
        const handler = (e) => {
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
            gameSelectContent.style.display = "none";
            gameSelectContent.classList.remove("active");
            adjustBackground();
            if (isMobile && !gameOver) {
                keyboardContainer.style.display = "flex";
                showKeyboard();
            }
            if (!isMobile && guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
            setTimeout(() => { isUILocked = false; }, 500);
        };
        privateBackBtn.addEventListener("click", handler);
        privateBackBtn.addEventListener("touchstart", handler);
    }

    // Guesses close button
    if (guessesCloseBtn) {
        guessesCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button clicked");
            if (isMobile) {
                showKeyboard();
            } else {
                if (guessesScreen) guessesScreen.style.display = "none";
            }
            if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        });
    }

    // Next game button (end)
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
                    console.log("Loading next game", { currentIndex, targetIndex: currentIndex - 1, targetGame });
                    currentBackground = targetGame["Background"] && targetGame["Background"].trim() !== "" ? targetGame["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(targetGame);
                    resetScreenDisplays(gameScreen);
                    gameScreen.style.display = "flex";
                    document.getElementById("game-over").style.display = "none";
                    document.getElementById("game-over").classList.remove("active");
                    adjustBackground();
                    if (isMobile && !gameOver) showKeyboard();
                    updateArrowStates(currentIndex - 1, gameList);
                } else {
                    console.log("At the newest game, cannot go to next");
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "This is the latest game.";
                        formErrorDialog.style.display = "flex";
                    }
                }
            } catch (error) {
                console.error("Error navigating to next game (end):", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to load next game.";
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
            }
        }, 100);
        nextGameBtnEnd.addEventListener("click", handler);
        nextGameBtnEnd.addEventListener("touchstart", handler);
    }

    // Form error OK button
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener("click", () => {
            console.log("Form error OK button clicked");
            if (formErrorDialog) formErrorDialog.style.display = "none";
            if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        });
    }

    // Adjust background
    function adjustBackground() {
        const backgroundContainer = document.getElementById("background-container");
        if (!backgroundContainer) {
            console.error("background-container not found in DOM");
            return;
        }
        console.log("Adjusting background to:", currentBackground);
        backgroundContainer.style.background = `url('${currentBackground}') no-repeat center center`;
        backgroundContainer.style.backgroundSize = "cover";
    }

    // Load game
    async function loadGame(game) {
        if (!game) {
            console.error("No game data provided to loadGame");
            return;
        }
        console.log("Loading game:", game);

        // Reset game state
        gameOver = false;
        secretWord = game["Secret Word"]?.trim().toUpperCase() || "";
        hints = [
            game["Hint 1"]?.trim().toUpperCase(),
            game["Hint 2"]?.trim().toUpperCase(),
            game["Hint 3"]?.trim().toUpperCase(),
            game["Hint 4"]?.trim().toUpperCase(),
            game["Hint 5"]?.trim().toUpperCase()
        ].filter(hint => hint && hint !== "");
        hintIndex = firstGuessMade ? hints.length - 1 : 0;
        firstGuessMade = false;
        guessCount = 0;
        guesses = [];
        gaveUp = false;
        isProcessingGuess = false;
        currentGameNumber = game["Game Number"].includes("- Private")
            ? `${game["Game Name"]} - Private`
            : `Game #${game["Game Number"]}`;
        currentGameId = game["Game Number"];
        currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;

        // Update UI
        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
            guessInputContainer.classList.remove("game-ended", "wrong-guess");
            guessInput.style.opacity = "1";
            guessInput.style.visibility = "visible";
            guessInput.style.color = "#000000";
            initializeCursor();
            if (!isMobile) guessInput.focus();
            activeInput = guessInput;
        }
        if (guessBtn) guessBtn.disabled = false;
        if (guessesLink) guessesLink.textContent = `Guesses: ${guessCount}/5`;
        if (gameNumberText) gameNumberText.textContent = currentGameNumber;

        // Setup hints
        setupHints();

        // Load game result
        let normalizedGameNumber;
        let gameType;
        if (currentGameNumber.includes("- Private")) {
            normalizedGameNumber = currentGameId;
            gameType = "privatePineapple";
        } else {
            normalizedGameNumber = currentGameNumber.replace("Game #", "");
            gameType = "pineapple";
        }
        const savedResult = await loadGameResult(gameType, normalizedGameNumber);
        console.log("Loaded game result:", savedResult);
        if (savedResult && savedResult.result !== "In Progress") {
            gameOver = true;
            guessInput.disabled = true;
            guessBtn.disabled = true;
            guessInput.value = secretWord;
            guesses = savedResult.guesses || [];
            guessCount = guesses.length;
            if (guessesLink) guessesLink.textContent = `Guesses: ${guessCount}/5`;
            gaveUp = savedResult.result === "Gave Up";
            endGame(savedResult.result === "Win", gaveUp);
        } else {
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            if (isMobile && !gameOver) showKeyboard();
        }

        // Update arrow states
        let currentIndex;
        let gameList;
        let isPrivate = currentGameNumber.includes("- Private");
        if (isPrivate) {
            currentIndex = privateGames.findIndex(g => g["Game Number"] === currentGameId);
            gameList = privateGames;
        } else {
            currentIndex = allGames.findIndex(g => g["Game Number"] === currentGameNumber.replace("Game #", ""));
            gameList = allGames;
        }
        if (currentIndex !== -1) {
            updateArrowStates(currentIndex, gameList);
        } else {
            console.warn("Current game not found in game list, disabling arrows");
            if (prevGameArrow) prevGameArrow.classList.add("disabled");
            if (nextGameArrow) nextGameArrow.classList.add("disabled");
        }

        adjustBackground();
        console.log("Game loaded successfully:", { currentGameNumber, currentGameId, secretWord, hints });
    }

    // Color palette (~100 colors)
    const colorPalette = [
        '#FF0000', '#FF4500', '#FF6347', '#FF7F50', '#FFA500', '#FFB300', '#FFD700', '#FFFF00',
        '#ADFF2F', '#7FFF00', '#32CD32', '#00FF00', '#00FA9A', '#00CED1', '#00B7EB', '#1E90FF',
        '#4169E1', '#483D8B', '#8A2BE2', '#9932CC', '#C71585', '#FF1493', '#FF69B4', '#FFB6C1',
        '#FFDAB9', '#FFE4B5', '#FFFACD', '#F0FFF0', '#F5FFFA', '#E0FFFF', '#B0E0E6', '#ADD8E6',
        '#87CEEB', '#87CEFA', '#B0C4DE', '#D8BFD8', '#DDA0DD', '#EE82EE', '#FFC1CC', '#FFBBBB',
        '#8B0000', '#B22222', '#DC143C', '#FF4040', '#FF6A6A', '#CD5C5C', '#8B008B', '#9400D3',
        '#4B0082', '#6A5ACD', '#483D8B', '#2F4F4F', '#008B8B', '#20B2AA', '#5F9EA0', '#4682B4',
        'linear-gradient(45deg, #FF4500, #FFD700)', 'linear-gradient(45deg, #00CED1, #32CD32)',
        'linear-gradient(45deg, #C71585, #FF69B4)', 'linear-gradient(45deg, #4169E1, #00B7EB)',
        'linear-gradient(45deg, #FFDAB9, #FFE4B5)', 'linear-gradient(45deg, #87CEEB, #B0E0E6)',
        '#FF8C00', '#FFA07A', '#FFDEAD', '#98FB98', '#90EE90', '#00FF7F', '#7FFFD4', '#40E0D0',
        '#6495ED', '#7B68EE', '#BA55D3', '#DA70D6', '#FF82AB', '#FFD1DC', '#FFE4E1', '#FA8072',
        '#F4A460', '#DAA520', '#B8860B', '#CD853F', '#DEB887', '#F5F5DC', '#FFF8DC', '#F0E68C',
        '#EEE8AA', '#BDB76B', '#9ACD32', '#6B8E23', '#228B22', '#006400', '#2E8B57', '#3CB371',
        'linear-gradient(45deg, #FF8C00, #FFD700)', 'linear-gradient(45deg, #00FF7F, #00CED1)',
        'linear-gradient(45deg, #BA55D3, #FF82AB)', 'linear-gradient(45deg, #6495ED, #B0C4DE)',
        'linear-gradient(45deg, #DEB887, #F5F5DC)', 'linear-gradient(45deg, #9ACD32, #90EE90)'
    ];

    function getRandomColor() {
        const baseColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        const opacity = (Math.random() * 0.2 + 0.7).toFixed(2);
        if (baseColor.startsWith('linear-gradient')) {
            return baseColor;
        }
        return `rgba(${parseColorToRGB(baseColor)}, ${opacity})`;
    }

    function parseColorToRGB(hex) {
        if (hex.startsWith('#')) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        }
        return hex;
    }

    // Setup hints
    function setupHints() {
        console.log("Setting up hints:", hints, "hintIndex:", hintIndex);
        const baseShapes = [
            'hint-shape-speech-bubble', 'hint-shape-star', 'hint-shape-circle', 'hint-shape-cloud',
            'hint-shape-hexagon', 'hint-shape-heart', 'hint-shape-diamond', 'hint-shape-triangle',
            'hint-shape-pentagon'
        ];

        const shapeVariations = [];
        baseShapes.forEach(base => {
            if (base === 'hint-shape-speech-bubble') {
                for (let i = 0; i < 12; i++) {
                    shapeVariations.push({
                        class: base,
                        modifier: (element) => {
                            const tailSize = 0.675 + Math.random() * 0.2;
                            const tailPos = 30 + Math.random() * 40;
                            element.style.setProperty('--tail-size', `${tailSize}vh`);
                            element.style.setProperty('--tail-pos', `${tailPos}%`);
                        }
                    });
                }
            } else if (base === 'hint-shape-star') {
                for (let i = 0; i < 12; i++) {
                    shapeVariations.push({
                        class: base,
                        modifier: (element) => {
                            const points = 5 + Math.floor(Math.random() * 4);
                            const innerRadius = 30 + Math.random() * 20;
                            const clipPath = generateStarClipPath(points, innerRadius);
                            element.style.clipPath = clipPath;
                        }
                    });
                }
            } else if (base === 'hint-shape-cloud') {
                for (let i = 0; i < 12; i++) {
                    shapeVariations.push({
                        class: base,
                        modifier: (element) => {
                            const puff1Size = 4.05 + Math.random() * 1;
                            const puff2Size = 2.7 + Math.random() * 0.8;
                            const puff1Pos = 15 + Math.random() * 10;
                            const puff2Pos = 35 + Math.random() * 10;
                            element.style.setProperty('--puff1-size', `${puff1Size}vh`);
                            element.style.setProperty('--puff2-size', `${puff2Size}vh`);
                            element.style.setProperty('--puff1-pos', `${puff1Pos}%`);
                            element.style.setProperty('--puff2-pos', `${puff2Pos}%`);
                        }
                    });
                }
            } else if (base === 'hint-shape-hexagon' || base === 'hint-shape-pentagon' || base === 'hint-shape-triangle') {
                for (let i = 0; i < 10; i++) {
                    shapeVariations.push({
                        class: base,
                        modifier: (element) => {
                            const rotation = Math.random() * 360;
                            element.style.transform = `rotate(${rotation}deg)`;
                        }
                    });
                }
            } else {
                for (let i = 0; i < 10; i++) {
                    shapeVariations.push({
                        class: base,
                        modifier: () => {}
                    });
                }
            }
        });

        const shuffledShapes = shapeVariations.sort(() => Math.random() - 0.5);

        for (let i = 1; i <= 5; i++) {
            const hintElement = document.getElementById(`hint-${i}`);
            if (hintElement) {
                hintElement.innerHTML = "";
                hintElement.style.display = "none";
                hintElement.style.clipPath = "";
                hintElement.style.transform = "";
                hintElement.style.background = "rgba(255, 255, 255, 0.85)";
                hintElement.style.setProperty('--tail-size', '0.675vh');
                hintElement.style.setProperty('--tail-pos', '50%');
                hintElement.style.setProperty('--puff1-size', '4.05vh');
                hintElement.style.setProperty('--puff2-size', '2.7vh');
                hintElement.style.setProperty('--puff1-pos', '20%');
                hintElement.style.setProperty('--puff2-pos', '40%');
                baseShapes.forEach(shape => hintElement.classList.remove(shape));
            }
        }

        for (let i = 0; i <= hintIndex && i < hints.length; i++) {
            const hintElement = document.getElementById(`hint-${i + 1}`);
            if (hintElement) {
                const shape = shuffledShapes[i % shuffledShapes.length];
                hintElement.classList.add(shape.class);
                shape.modifier(hintElement);
                hintElement.style.background = getRandomColor();
                if (i === hintIndex) {
                    hintElement.innerHTML = buildHintHTML(hints[i]);
                } else {
                    hintElement.innerHTML = hints[i].replace(/ /g, " ");
                }
                hintElement.style.display = "flex";
            }
        }
        console.log("Hints displayed up to index:", hintIndex, "with randomized shapes and colors");
    }

    function generateStarClipPath(points, innerRadiusPercent) {
        const outerRadius = 50;
        const innerRadius = outerRadius * (innerRadiusPercent / 100);
        let path = '';
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            path += `${x}% ${y}%, `;
        }
        return `polygon(${path.slice(0, -2)})`;
    }

    // Build hint HTML
    function buildHintHTML(hint) {
        if (!hint) return "";
        return hint
            .split("")
            .map((letter, index) => `<span class="letter" style="opacity: 0; animation-delay: ${index * 0.05}s">${letter}</span>`)
            .join("");
    }

    // Handle guess
    async function handleGuess(guess) {
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored:", { isProcessingGuess, gameOver });
            return;
        }
        isProcessingGuess = true;
        console.log("Handling guess:", guess);

        if (!guess || guess.length < 1) {
            console.log("Invalid guess: empty or too short");
            guessInputContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                isProcessingGuess = false;
                animationTimeout = null;
            }, 350);
            return;
        }

        guessCount++;
        guesses.push(guess);
        if (guessesLink) guessesLink.textContent = `Guesses: ${guessCount}/5`;
        firstGuessMade = true;

        let normalizedGameNumber;
        let gameType;
        if (currentGameNumber.includes("- Private")) {
            normalizedGameNumber = currentGameId;
            gameType = "privatePineapple";
        } else {
            normalizedGameNumber = currentGameNumber.replace("Game #", "");
            gameType = "pineapple";
        }
        await saveGameResult(gameType, normalizedGameNumber, secretWord, "In Progress", guess);

        if (guess === secretWord) {
            console.log("Correct guess!");
            guessInputContainer.classList.add("game-ended");
            await saveGameResult(gameType, normalizedGameNumber, secretWord, "Win");
            endGame(true);
            isProcessingGuess = false;
            return;
        }

        console.log("Incorrect guess, showing next hint");
        guessInputContainer.classList.add("wrong-guess");
        guessInput.style.opacity = "0";
        guessInput.style.visibility = "hidden";
        guessInput.style.color = "transparent";

        animationTimeout = setTimeout(() => {
            guessInputContainer.classList.remove("wrong-guess");
            guessInput.value = "";
            guessInput.style.opacity = "1";
            guessInput.style.visibility = "visible";
            guessInput.style.color = "#000000";
            initializeCursor();
            if (!isMobile && guessInput && !gameOver) guessInput.focus();
            isProcessingGuess = false;
            animationTimeout = null;
        }, 350);

        hintIndex = Math.min(hintIndex + 1, hints.length - 1);
        setupHints();

        if (guessCount >= 5) {
            console.log("Maximum guesses reached");
            await saveGameResult(gameType, normalizedGameNumber, secretWord, "Loss");
            endGame(false);
        }
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
        adjustBackground();

        if (guessInput && guessInputContainer) {
            guessInput.value = secretWord;
            guessInputContainer.classList.add("game-ended");
            guessInput.dispatchEvent(new Event("guessProcessed"));
        }

        const hintElements = document.querySelectorAll("#hint-section .hint");
        hintElements.forEach(element => {
            element.style.display = "none";
        });
        const hint1 = document.getElementById("hint-1");
        if (hint1) {
            hint1.innerHTML = won ? "Well Done" : "Hard Luck";
            hint1.style.display = "flex";
        }

        if (gameControlsContainer) {
            gameControlsContainer.style.display = "none";
        }

        if (isMobile && keyboardContainer) {
            keyboardContainer.style.display = "none";
        }
        mainContent.style.display = "none";
        const gameOverScreen = document.getElementById("game-over");
        gameOverScreen.style.display = "flex";
        gameOverScreen.classList.add("active");

        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");

        if (gameNumberDisplay) {
            gameNumberDisplay.style.display = "none";
        }

        let shareMessage;
        if (gaveUp || !won) {
            shareMessage = `Play WORDY\nThe secret word was ${secretWord}`;
        } else {
            shareMessage = `${currentGameNumber}\nI solved WORDY in\n<span class="guess-count">${guessCount}</span>\n${guessCount === 1 ? 'guess' : 'guesses'}`;
        }

        if (shareText) {
            shareMessage = shareMessage.replace(currentGameNumber + "\n", "");
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

        guessArea.style.display = "flex";
        guessInputContainer.style.display = "flex";

        setupKeyboardListeners();
        if (currentGameNumber.includes("- Private")) {
            displayGameList();
            console.log("Private games list updated after game end");
        }
    }

    // Start pineapple rain
    function startPineappleRain() {
        console.log("Starting pineapple rain animation");
        const rainContainer = document.createElement("div");
        rainContainer.className = "pineapple-rain";
        document.body.appendChild(rainContainer);

        const emojis = ["🍍"];
        const numPieces = isMobile ? 20 : 30;
        const screenWidth = window.innerWidth;

        for (let i = 0; i < numPieces; i++) {
            const piece = document.createElement("div");
            piece.className = "pineapple-piece";
            piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.fontSize = `${isMobile ? 2 : 3}vh`;
            piece.style.animationDuration = `${3 + Math.random() * 3}s`;
            piece.style.setProperty("--rotation", `${Math.random() * 360}deg`);
            piece.style.setProperty("--drift", `${(Math.random() - 0.5) * screenWidth * 0.1}`);
            rainContainer.appendChild(piece);
        }

        setTimeout(() => {
            console.log("Removing pineapple rain animation");
            rainContainer.remove();
        }, 6000);
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select screen");
        resetScreenDisplays(gameSelectContent);
        gameSelectContent.style.display = "flex";
        gameSelectContent.classList.add("active");
        mainContent.style.display = "none";
        gameScreen.style.display = "none";
        formContent.style.display = "none";
        formContent.classList.remove("active");
        document.getElementById("game-over").style.display = "none";
        document.getElementById("game-over").classList.remove("active");
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
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");

        if (officialList) {
            officialList.innerHTML = "";
            const sortedGames = allGames.slice().sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
            sortedGames.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                const gameNumber = document.createElement("span");
                gameNumber.textContent = `Game #${game["Game Number"]}`;
                const word = document.createElement("span");
                word.textContent = game["Secret Word"] || "-";
                const guesses = document.createElement("span");
                guesses.textContent = game["Result"] && game["Result"] !== "In Progress" ? (game["Guesses"] || "-") : "-";
                row.appendChild(gameNumber);
                row.appendChild(word);
                row.appendChild(guesses);

                const handler = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Game list row clicked", { gameNumber: game["Game Number"], isUILocked, isLoadingGame });
                    if (isUILocked || isLoadingGame) {
                        console.log("Game list row ignored: UI locked or game loading");
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
                        if (!isMobile && guessInput && !gameOver && !isProcessingGuess) {
                            guessInput.focus();
                            activeInput = guessInput;
                        }
                    } catch (error) {
                        console.error("Error loading game from list:", error.message);
                        if (formErrorDialog && formErrorMessage) {
                            formErrorMessage.textContent = "Failed to load game.";
                            formErrorDialog.style.display = "flex";
                        }
                    } finally {
                        isUILocked = false;
                        isLoadingGame = false;
                    }
                };
                row.addEventListener("click", handler);
                row.addEventListener("touchstart", (e) => {
                    if (!touchMoved) handler(e);
                });
                officialList.appendChild(row);
            });
        }

        if (privateList) {
            privateList.innerHTML = "";
            const sortedPrivateGames = privateGames.slice().sort((a, b) => {
                const aTime = new Date(a["Timestamp"] || "1970-01-01");
                const bTime = new Date(b["Timestamp"] || "1970-01-01");
                return bTime - aTime;
            });
            sortedPrivateGames.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                const gameName = document.createElement("span");
                gameName.textContent = game["Game Name"] || "-";
                const word = document.createElement("span");
                word.textContent = game["Secret Word"] || "-";
                const guesses = document.createElement("span");
                guesses.textContent = game["Result"] && game["Result"] !== "In Progress" ? (game["Guesses"] || "-") : "-";
                row.appendChild(gameName);
                row.appendChild(word);
                row.appendChild(guesses);

                const handler = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Private game list row clicked", { gameId: game["Game Number"], isUILocked, isLoadingGame });
                    if (isUILocked || isLoadingGame) {
                        console.log("Private game list row ignored: UI locked or game loading");
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
                        if (!isMobile && guessInput && !gameOver && !isProcessingGuess) {
                            guessInput.focus();
                            activeInput = guessInput;
                        }
                    } catch (error) {
                        console.error("Error loading private game from list:", error.message);
                        if (formErrorDialog && formErrorMessage) {
                            formErrorMessage.textContent = "Failed to load game.";
                            formErrorDialog.style.display = "flex";
                        }
                    } finally {
                        isUILocked = false;
                        isLoadingGame = false;
                    }
                };
                row.addEventListener("click", handler);
                row.addEventListener("touchstart", (e) => {
                    if (!touchMoved) handler(e);
                });
                privateList.appendChild(row);
            });
        }

        // Touch handling for game list
        const gameLists = [officialList, privateList].filter(list => list);
        gameLists.forEach(list => {
            list.addEventListener("touchstart", (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchMoved = false;
                console.log("Touch started on game list", { touchStartX, touchStartY });
            });
            list.addEventListener("touchmove", (e) => {
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                const deltaX = Math.abs(touchX - touchStartX);
                const deltaY = Math.abs(touchY - touchStartY);
                if (deltaX > touchThreshold || deltaY > touchThreshold) {
                    touchMoved = true;
                    console.log("Touch moved, preventing click", { deltaX, deltaY });
                }
            });
            list.addEventListener("touchend", () => {
                console.log("Touch ended on game list", { touchMoved });
            });
        });
    }

    // Load game result
    async function loadGameResult(gameType, gameNumber) {
        try {
            const storageKey = `${gameType}_${gameNumber}`;
            const result = localStorage.getItem(storageKey);
            if (result) {
                console.log(`Found game result in localStorage for ${storageKey}:`, result);
                return JSON.parse(result);
            }
            console.log(`No game result found in localStorage for ${storageKey}`);
            return null;
        } catch (error) {
            console.error("Error loading game result:", error.message);
            return null;
        }
    }

    // Save game result
    async function saveGameResult(gameType, gameNumber, word, result, guess = null) {
        try {
            const storageKey = `${gameType}_${gameNumber}`;
            let existingResult = await loadGameResult(gameType, gameNumber);
            if (!existingResult) {
                existingResult = { word, result, guesses: [] };
            }
            if (guess && result === "In Progress") {
                existingResult.guesses = existingResult.guesses || [];
                if (!existingResult.guesses.includes(guess)) {
                    existingResult.guesses.push(guess);
                }
            }
            existingResult.result = result;
            localStorage.setItem(storageKey, JSON.stringify(existingResult));
            console.log(`Saved game result for ${storageKey}:`, existingResult);
        } catch (error) {
            console.error("Error saving game result:", error.message);
        }
    }

    // Confirm button
    if (confirmBtn) {
        const handler = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Confirm button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Confirm button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;

            try {
                const gameName = formInputs[0].value.trim().toUpperCase();
                const secretWord = formInputs[1].value.trim().toUpperCase();
                const hints = formInputs.slice(2).map(input => input.value.trim().toUpperCase()).filter(hint => hint !== "");

                console.log("Form data:", { gameName, secretWord, hints });

                if (!gameName || !secretWord || hints.length < 1) {
                    throw new Error("Please fill in the game name, secret word, and at least one hint.");
                }
                if (secretWord.includes(" ")) {
                    throw new Error("Secret word cannot contain spaces.");
                }
                if (!/^[A-Z]+$/.test(secretWord)) {
                    throw new Error("Secret word must contain only letters A-Z.");
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
                    throw new Error(`Server error: ${response.statusText}`);
                }

                const result = await response.json();
                console.log("Server response:", result);

                if (result.status === "success" && result.data && result.data.gameNumber) {
                    const newGame = {
                        "Game Number": result.data.gameNumber,
                        "Game Name": gameName,
                        "Secret Word": secretWord,
                        "Hint 1": hints[0] || "",
                        "Hint 2": hints[1] || "",
                        "Hint 3": hints[2] || "",
                        "Hint 4": hints[3] || "",
                        "Hint 5": hints[4] || "",
                        "Background": defaultBackground,
                        "Timestamp": new Date().toISOString()
                    };
                    privateGames.unshift(newGame);
                    console.log("Added new private game:", newGame);

                    currentBackground = defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(newGame);
                    resetScreenDisplays(gameScreen);
                    gameScreen.style.display = "flex";
                    formContent.style.display = "none";
                    formContent.classList.remove("active");
                    adjustBackground();
                    if (isMobile && !gameOver) showKeyboard();
                    if (!isMobile && guessInput && !gameOver && !isProcessingGuess) {
                        guessInput.focus();
                        activeInput = guessInput;
                    }
                } else {
                    throw new Error(result.message || "Failed to create game.");
                }
            } catch (error) {
                console.error("Error submitting form:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = error.message;
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
            }
        };
        confirmBtn.addEventListener("click", handler);
        confirmBtn.addEventListener("touchstart", handler);
    }

    // Load games
    async function loadGames() {
        console.log("Loading games");
        isLoadingGame = true;
        try {
            // Load official games
            const officialResponse = await fetch(officialUrl);
            if (!officialResponse.ok) {
                throw new Error(`Failed to fetch official games: ${officialResponse.statusText}`);
            }
            const officialText = await officialResponse.text();
            const officialData = Papa.parse(officialText, { header: true, skipEmptyLines: true }).data;
            allGames = officialData
                .filter(game => game["Game Number"] && game["Secret Word"])
                .map(game => ({
                    "Game Number": game["Game Number"],
                    "Secret Word": game["Secret Word"]?.trim().toUpperCase(),
                    "Hint 1": game["Hint 1"]?.trim().toUpperCase(),
                    "Hint 2": game["Hint 2"]?.trim().toUpperCase(),
                    "Hint 3": game["Hint 3"]?.trim().toUpperCase(),
                    "Hint 4": game["Hint 4"]?.trim().toUpperCase(),
                    "Hint 5": game["Hint 5"]?.trim().toUpperCase(),
                    "Background": game["Background"] || defaultBackground
                }));
            console.log("Loaded official games:", allGames.length);

            // Load private games
            const privateResponse = await fetch(privateUrl);
            if (!privateResponse.ok) {
                throw new Error(`Failed to fetch private games: ${privateResponse.statusText}`);
            }
            const privateText = await privateResponse.text();
            const privateData = Papa.parse(privateText, { header: true, skipEmptyLines: true }).data;
            privateGames = privateData
                .filter(game => game["Game Number"] && game["Secret Word"])
                .map(game => ({
                    "Game Number": game["Game Number"],
                    "Game Name": game["Game Name"]?.trim().toUpperCase(),
                    "Secret Word": game["Secret Word"]?.trim().toUpperCase(),
                    "Hint 1": game["Hint 1"]?.trim().toUpperCase(),
                    "Hint 2": game["Hint 2"]?.trim().toUpperCase(),
                    "Hint 3": game["Hint 3"]?.trim().toUpperCase(),
                    "Hint 4": game["Hint 4"]?.trim().toUpperCase(),
                    "Hint 5": game["Hint 5"]?.trim().toUpperCase(),
                    "Background": game["Background"] || defaultBackground,
                    "Timestamp": game["Timestamp"] || new Date().toISOString()
                }));
            console.log("Loaded private games:", privateGames.length);

            // Sort games
            allGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
            privateGames.sort((a, b) => {
                const aTime = new Date(a["Timestamp"] || "1970-01-01");
                const bTime = new Date(b["Timestamp"] || "1970-01-01");
                return bTime - aTime;
            });

            // Load latest official game
            if (allGames.length > 0) {
                const latestGame = allGames[0];
                console.log("Loading latest official game:", latestGame);
                currentBackground = latestGame["Background"] && latestGame["Background"].trim() !== "" ? latestGame["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(latestGame);
            } else {
                console.warn("No official games available, loading default game");
                const defaultGame = {
                    "Game Number": "1",
                    "Secret Word": "TEST",
                    "Hint 1": "A procedure to check something",
                    "Hint 2": "Often used in experiments",
                    "Hint 3": "Can be a trial or examination",
                    "Hint 4": "Used to verify functionality",
                    "Hint 5": "Common in software development",
                    "Background": defaultBackground
                };
                currentBackground = defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(defaultGame);
            }
        } catch (error) {
            console.error("Error loading games:", error.message);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load games. Please try again later.";
                formErrorDialog.style.display = "flex";
            }
            // Load default game as fallback
            const defaultGame = {
                "Game Number": "1",
                "Secret Word": "TEST",
                "Hint 1": "A procedure to check something",
                "Hint 2": "Often used in experiments",
                "Hint 3": "Can be a trial or examination",
                "Hint 4": "Used to verify functionality",
                "Hint 5": "Common in software development",
                "Background": defaultBackground
            };
            currentBackground = defaultBackground;
            await preloadBackground(currentBackground);
            loadGame(defaultGame);
        } finally {
            isLoadingGame = false;
        }
    }

    // Initialize
    initializeCursor();
    setupKeyboardListeners();
    await loadGames();
});