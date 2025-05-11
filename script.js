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
    const backgroundContainer = document.getElementById("background-container"); // New container
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
    const adBox = document.getElementById("ad-box");

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
        keyboardGuessesContent.addEventListener("touchstart", handler);
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
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            document.getElementById("game-over").style.display = "none";
            document.getElementById("game-over").classList.remove("active");
            document.getElementById("main-content").style.display = "flex";
            if (isMobile) {
                showKeyboard();
            } else {
                keyboardContainer.style.display = "none";
            }
            activeInput = guessInput;
            if (activeInput && !isMobile) activeInput.focus();
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
                resetScreenDisplays(gameSelectContent);
                gameSelectContent.style.display = "flex";
                gameSelectContent.classList.add("active");
                privateTab.classList.add("active");
                officialTab.classList.remove("active");
                privateContent.classList.add("active");
                privateContent.style.display = "flex";
                officialContent.classList.remove("active");
                officialContent.style.display = "none";
                adjustBackground();
                setupKeyboardListeners();
                setTimeout(() => { isUILocked = false; }, 500);
            });
        }
    
        // Form error dialog OK button
        if (formErrorOkBtn) {
            formErrorOkBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Form Error OK button triggered");
                formErrorDialog.style.display = "none";
                if (activeInput && !isMobile) activeInput.focus();
            });
        }
    
        // Guesses close button
        if (guessesCloseBtn) {
            guessesCloseBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Guesses Close button triggered");
                guessesScreen.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            });
        }
    
        // Setup hints
        function setupHints() {
            console.log("Setting up hints", { hints, hintIndex, firstGuessMade });
            const hintsInline = document.querySelector(".hints-inline");
            if (!hintsInline) {
                console.error("hints-inline element not found");
                return;
            }
    
            hintsInline.style.opacity = "0";
            hintsInline.classList.remove("lines-0", "lines-1", "lines-2");
    
            let displayText = "";
            let lines = 0;
    
            if (firstGuessMade && hintIndex > 0) {
                const hintsToShow = hints.slice(0, hintIndex);
                console.log("Hints to show:", hintsToShow);
                if (hintsToShow.length > 0) {
                    displayText = hintsToShow.join(' <span class="separator yellow">|</span> ');
                    const tempElement = document.createElement("div");
                    tempElement.style.position = "absolute";
                    tempElement.style.visibility = "hidden";
                    tempElement.style.width = "82.5vw";
                    tempElement.style.fontSize = "2.75vh";
                    tempElement.style.lineHeight = "1.2";
                    tempElement.style.fontFamily = "'Luckiest Guy', cursive";
                    tempElement.style.wordBreak = "break-word";
                    tempElement.innerHTML = displayText;
                    document.body.appendChild(tempElement);
                    const height = tempElement.offsetHeight;
                    const lineHeight = 2.75 * 1.2;
                    lines = Math.ceil(height / lineHeight);
                    lines = Math.min(lines, 2);
                    console.log("Calculated lines:", lines, { height, lineHeight });
                    document.body.removeChild(tempElement);
                }
            }
    
            hintsInline.innerHTML = displayText || "";
            hintsInline.classList.add(`lines-${lines}`);
            lastHintLines = lines;
    
            setTimeout(() => {
                hintsInline.style.opacity = "1";
                console.log("Hints displayed with fade-in", { displayText, lines });
            }, 50);
        }
    
        // Adjust background
        function adjustBackground() {
            console.log("Adjusting background", { currentBackground });
            if (!backgroundContainer) {
                console.error("background-container not found in DOM");
                return;
            }
    
            const isGameSelectActive = gameSelectContent.classList.contains("active");
            const isGameOverActive = document.getElementById("game-over").classList.contains("active");
    
            if (isGameSelectActive || isGameOverActive) {
                backgroundContainer.style.background = "#000000";
                backgroundContainer.style.backgroundImage = "none";
                console.log("Background set to black for game select or game over screen");
            } else {
                backgroundContainer.style.background = `url('${currentBackground}') no-repeat center center fixed, #FFFFFF`;
                backgroundContainer.style.backgroundSize = "cover";
                console.log("Background set to:", currentBackground);
            }
        }
    
        // Reset game
        function resetGame() {
            console.log("Resetting game");
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
                guessInput.value = "";
                guessInput.disabled = false;
                guessInput.style.opacity = "1";
                guessInput.style.visibility = "visible";
                guessInput.style.color = "#000000";
                guessInputContainer.classList.remove("wrong-guess", "game-ended");
                initializeCursor();
            }
            if (guessBtn) guessBtn.disabled = false;
            setupHints();
            if (pineappleRain) pineappleRain.innerHTML = "";
            console.log("Game reset completed");
        }
    
        // Handle guess
        async function handleGuess(guess) {
            console.log("Handling guess:", guess, { gameOver, isProcessingGuess });
            if (gameOver || isProcessingGuess) {
                console.log("Guess ignored due to game state");
                return;
            }
            isProcessingGuess = true;
            guessInput.disabled = true;
            guessBtn.disabled = true;
            guessInput.style.opacity = "0";
            guessInput.style.visibility = "hidden";
    
            guessCount++;
            if (!firstGuessMade) {
                firstGuessMade = true;
                hintIndex = 1;
                setupHints();
            }
    
            guesses.push(guess);
            console.log("Current guesses:", guesses);
    
            if (guess === secretWord) {
                console.log("Correct guess!");
                guessInputContainer.classList.add("game-ended");
                let normalizedGameNumber;
                let gameType;
                if (currentGameNumber.includes("- Private")) {
                    normalizedGameNumber = currentGameNumber.split(" - ")[0];
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
                if (hintIndex < hints.length) {
                    hintIndex++;
                    setupHints();
                }
                guessInput.value = "";
                animationTimeout = setTimeout(() => {
                    guessInput.style.opacity = "1";
                    guessInput.style.visibility = "visible";
                    guessInput.style.color = "#000000";
                    guessInput.disabled = false;
                    guessBtn.disabled = false;
                    isProcessingGuess = false;
                    initializeCursor();
                    if (!isMobile) guessInput.focus();
                    console.log("Guess input reset after incorrect guess");
                }, 350);
            }
        }
    
        // End game
        function endGame(won = false, gaveUp = false) {
            console.log("Ending game", { won, gaveUp });
            gameOver = true;
            guessInput.disabled = true;
            guessBtn.disabled = true;
            if (won) {
                triggerPineappleRain();
            }
            setTimeout(() => {
                showEndScreen(won, gaveUp);
            }, won ? 3000 : 0);
        }
    
        // Trigger pineapple rain
        function triggerPineappleRain() {
            console.log("Triggering pineapple rain");
            const pineappleRain = document.getElementById("pineapple-rain");
            if (!pineappleRain) {
                console.error("pineapple-rain element not found");
                return;
            }
            pineappleRain.innerHTML = "";
            const numPieces = 30;
            for (let i = 0; i < numPieces; i++) {
                const piece = document.createElement("div");
                piece.classList.add("pineapple-piece");
                piece.textContent = "🍍";
                const size = Math.random() * 2 + 2;
                piece.style.fontSize = `${size}vh`;
                piece.style.left = `${Math.random() * 100}vw`;
                const duration = Math.random() * 2 + 3;
                piece.style.animationDuration = `${duration}s`;
                piece.style.setProperty("--rotation", `${Math.random() * 360 - 180}deg`);
                piece.style.setProperty("--drift", `${Math.random() * 20 - 10}`);
                piece.style.animationDelay = `${Math.random() * 2}s`;
                pineappleRain.appendChild(piece);
            }
            console.log("Pineapple rain triggered with", numPieces, "pieces");
        }
    
        // Show end screen
        function showEndScreen(won, gaveUp) {
            console.log("Showing end screen", { won, gaveUp });
            const gameOverScreen = document.getElementById("game-over");
            const shareText = document.getElementById("share-text");
            if (!gameOverScreen || !shareText) {
                console.error("Game over screen or share text not found");
                return;
            }
    
            let resultText = "";
            if (gaveUp) {
                resultText = `${currentGameNumber}\nI gave up! 😓\nThe answer was: ${secretWord}`;
            } else if (won) {
                resultText = `${currentGameNumber}\nI got it in <span class="guess-count green">${guessCount}</span> ${guessCount === 1 ? "guess" : "guesses"}! 🎉`;
            } else {
                resultText = `${currentGameNumber}\nI ran out of guesses! 😓\nThe answer was: ${secretWord}`;
            }
    
            shareText.innerHTML = resultText;
            gameOverScreen.style.display = "flex";
            gameOverScreen.classList.add("active");
            resetScreenDisplays(gameOverScreen);
            adjustBackground();
            if (isMobile) {
                keyboardContainer.classList.add("show-game-over");
            }
            console.log("End screen displayed");
        }
    
        // Save game result
        function saveGameResult(gameType, gameNumber, answer, result) {
            console.log("Saving game result", { gameType, gameNumber, answer, result });
            const results = JSON.parse(localStorage.getItem(gameType) || "{}");
            results[gameNumber] = { answer, result };
            localStorage.setItem(gameType, JSON.stringify(results));
            console.log("Game result saved to localStorage");
        }
    
        // Fetch official games
        async function fetchOfficialGames() {
            console.log("Fetching official games");
            try {
                const response = await fetch(officialUrl);
                const csvText = await response.text();
                allGames = parseCSV(csvText);
                allGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
                console.log("Official games fetched and sorted:", allGames);
            } catch (error) {
                console.error("Error fetching official games:", error);
                allGames = [];
            }
        }
    
        // Fetch private games
        async function fetchPrivateGames() {
            console.log("Fetching private games");
            try {
                const response = await fetch(privateUrl);
                const csvText = await response.text();
                privateGames = parseCSV(csvText);
                privateGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
                console.log("Private games fetched and sorted:", privateGames);
            } catch (error) {
                console.error("Error fetching private games:", error);
                privateGames = [];
            }
        }
    
        // Parse CSV
        function parseCSV(csvText) {
            console.log("Parsing CSV");
            const lines = csvText.trim().split("\n");
            const headers = lines[0].split(",").map(header => header.trim());
            const result = [];
            for (let i = 1; i < lines.length; i++) {
                const row = lines[i].split(",").map(cell => cell.trim());
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || "";
                });
                result.push(obj);
            }
            console.log("CSV parsed:", result);
            return result;
        }
    
        // Display game list
        function displayGameList() {
            console.log("Displaying game list");
            const officialList = document.getElementById("official-list");
            const privateList = document.getElementById("private-list");
            if (!officialList || !privateList) {
                console.error("Game list elements not found");
                return;
            }
    
            officialList.innerHTML = "";
            privateList.innerHTML = "";
    
            const officialResults = JSON.parse(localStorage.getItem("pineapple") || "{}");
            const privateResults = JSON.parse(localStorage.getItem("privatePineapple") || "{}");
    
            allGames.forEach(game => {
                const row = document.createElement("div");
                row.classList.add("game-list-row");
                const gameNumber = `Game #${game["Game Number"]}`;
                const result = officialResults[game["Game Number"]];
                const status = result ? (result.result === "Gave Up" ? `<span class="red">Gave Up</span>` : result.result.includes("guess") ? `<span class="green">${result.result}</span>` : `<span class="red">Failed</span>`) : `<span class="play-now">Play Now!</span>`;
                row.innerHTML = `
                    <span>${gameNumber}</span>
                    <span>${game["Game Name"]}</span>
                    <span>${status}</span>
                `;
                row.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    touchMoved = false;
                    if (!isMobile) {
                        await loadGameAndStart(game);
                    }
                });
    
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
                    row.addEventListener("touchend", async (e) => {
                        e.preventDefault();
                        if (!touchMoved) {
                            await loadGameAndStart(game);
                        }
                    });
                }
    
                officialList.appendChild(row);
            });
    
            privateGames.forEach(game => {
                const row = document.createElement("div");
                row.classList.add("game-list-row");
                const gameNumber = game["Game Number"];
                const result = privateResults[gameNumber];
                const status = result ? (result.result === "Gave Up" ? `<span class="red">Gave Up</span>` : result.result.includes("guess") ? `<span class="green">${result.result}</span>` : `<span class="red">Failed</span>`) : `<span class="play-now">Play Now!</span>`;
                row.innerHTML = `
                    <span>${gameNumber}</span>
                    <span>${game["Game Name"]}</span>
                    <span>${status}</span>
                `;
                row.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    touchMoved = false;
                    if (!isMobile) {
                        await loadGameAndStart(game);
                    }
                });
    
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
                    row.addEventListener("touchend", async (e) => {
                        e.preventDefault();
                        if (!touchMoved) {
                            await loadGameAndStart(game);
                        }
                    });
                }
    
                privateList.appendChild(row);
            });
    
            console.log("Game list displayed");
        }
    
        // Load game and start
        async function loadGameAndStart(game) {
            console.log("Loading game and starting", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Load game ignored: UI locked or game loading");
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
                adjustBackground();
                if (isMobile && !gameOver) showKeyboard();
                let currentIndex;
                let gameList;
                let isPrivate = game["Game Number"].includes("- Private");
                if (isPrivate) {
                    currentIndex = privateGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                    gameList = privateGames;
                } else {
                    currentIndex = allGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                    gameList = allGames;
                }
                updateArrowStates(currentIndex, gameList);
            } catch (error) {
                console.error("Error loading game:", error);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to load game.";
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
            }
        }
    
        // Load game
        function loadGame(game) {
            console.log("Loading game data:", game);
            resetGame();
            currentGameNumber = game["Game Number"].includes("- Private") ? game["Game Number"] : `Game #${game["Game Number"]}`;
            gameNumberText.textContent = currentGameNumber;
            document.getElementById("game-name").textContent = game["Game Name"];
            document.getElementById("game-name-mobile").textContent = game["Game Name"];
            secretWord = game["Secret Word"].toUpperCase();
            hints = [
                game["Hint 1"],
                game["Hint 2"],
                game["Hint 3"],
                game["Hint 4"],
                game["Hint 5"]
            ].filter(hint => hint).map(hint => hint.toUpperCase());
            console.log("Game loaded", { currentGameNumber, secretWord, hints });
            setupHints();
        }
    
        // Show game select screen
        async function showGameSelectScreen() {
            console.log("Showing game select screen");
            resetScreenDisplays(gameSelectContent);
            gameSelectContent.style.display = "flex";
            gameSelectContent.classList.add("active");
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            officialContent.style.display = "flex";
            privateContent.classList.remove("active");
            privateContent.style.display = "none";
            await fetchOfficialGames();
            await fetchPrivateGames();
            displayGameList();
            adjustBackground();
            setupKeyboardListeners();
        }
    
        // Initial setup
        async function initialize() {
            console.log("Initializing game");
            await fetchOfficialGames();
            if (allGames.length > 0) {
                currentBackground = allGames[0]["Background"] && allGames[0]["Background"].trim() !== "" ? allGames[0]["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(allGames[0]);
                updateArrowStates(0, allGames);
            } else {
                console.error("No official games available to load");
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "No games available to load.";
                    formErrorDialog.style.display = "flex";
                }
            }
            initializeCursor();
            resetScreenDisplays(gameScreen);
            adjustBackground();
            setupKeyboardListeners();
            if (isMobile) showKeyboard();
            console.log("Initialization complete");
        }
    
        // Start the game
        initialize();
    });