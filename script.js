document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded");

    // State variables
    let gameOver = false;
    let secretWord = "";
    let hints = [];
    let hintIndex = 0;
    let lastHintLines = 0; // Track the number of lines for the last hint state
    let firstGuessMade = false;
    let allGames = [];
    let privateGames = [];
    let currentGameNumber = null;
    let guessCount = 0;
    let gaveUp = false;
    let isProcessingGuess = false;
    let isLoadingGame = false;
    let isUILocked = false; // Prevent concurrent UI interactions
    let guesses = [];
    let animationTimeout = null;
    let activeInput = null;
    let currentBackground = "newbackground.png";

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
    const touchThreshold = 5;

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
                if (url !== defaultBackground) {
                    img.src = defaultBackground;
                    img.onload = () => resolve(defaultBackground);
                    img.onerror = () => resolve(defaultBackground);
                } else {
                    resolve(defaultBackground);
                }
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
        const screens = [formContent, formErrorDialog, guessesScreen, giveUpDialog];
        screens.forEach(screen => {
            if (screen && screen !== activeScreen) {
                screen.style.display = "none";
                screen.classList.remove("active");
            }
        });
        if (gameSelectContent) {
            gameSelectContent.style.display = "none";
            gameSelectContent.classList.remove("active");
        }
        if (document.getElementById("game-over")) {
            document.getElementById("game-over").style.display = "none";
        }
        if (keyboardContainer) {
            if (activeScreen === gameScreen && isMobile && !gameOver && !gameSelectContent.classList.contains("active")) {
                showKeyboard();
                keyboardContainer.style.display = "flex";
            } else {
                keyboardContainer.style.display = "none";
            }
        }
        if (activeScreen) {
            activeScreen.style.display = "none";
            activeScreen.offsetHeight;
            activeScreen.style.display = "flex";
        }
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
            if (isMobile) showKeyboard();
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
            if (isMobile) showKeyboard();
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
        prevGameArrow.addEventListener(isMobile ? "touchstart" : "click", debounce(async (e) => {
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
                    showKeyboard();
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
        }, 50), { passive: false });
    }

    // Next game arrow
    if (nextGameArrow) {
        nextGameArrow.addEventListener(isMobile ? "touchstart" : "click", debounce(async (e) => {
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
                    showKeyboard();
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
        }, 50), { passive: false });
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
            resetScreenDisplays(gameScreen);
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
            resetScreenDisplays(gameScreen);
            gameSelectContent.style.display = "flex";
            gameSelectContent.classList.add("active");
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            privateContent.style.display = "flex";
            officialContent.classList.remove("active");
            officialContent.style.display = "none";
            document.getElementById("game-over").style.display = "none";
            document.getElementById("main-content").style.display = "flex";
            displayGameList();
            adjustBackground();
            setupKeyboardListeners();
            if (isMobile) showKeyboard();
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
                resetScreenDisplays(gameScreen);
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
        resetScreenDisplays(gameScreen);
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
        if (isMobile) showKeyboard();
    }

    // Fetch game data
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
            if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            const text = await response.text();

            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            privateGames = parsed.data
                .filter(game => game["Game Name"] && game["Secret Word"])
                .map((game, index) => ({
                    ...game,
                    "Game Number": String(index + 1),
                    "Display Name": `Game #${index + 1} - ${game["Game Name"]}`
                }))
                .sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            console.log("Parsed private games:", privateGames);
        } catch (error) {
            console.error("Error in fetchPrivateGames:", error.message);
            privateGames = [];
        }
    }

    // Display game list
    function displayGameList() {
        const officialList = document.getElementById("official-list");
        if (officialList) {
            officialList.innerHTML = "";
            const gameNameElement = document.getElementById("game-name");
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
                                gameScreen.style.display = "flex";
                                gameSelectContent.style.display = "none";
                                gameSelectContent.classList.remove("active");
                                showKeyboard();
                                activeInput = guessInput;
                                if (activeInput && !isMobile) activeInput.focus();
                                adjustBackground();
                                setupKeyboardListeners();
                                const currentIndex = allGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                                updateArrowStates(currentIndex, allGames);
                                setTimeout(() => { isUILocked = false; }, 500);
                            } else {
                                console.log("Touch ended with movement, ignoring as scroll");
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
                            gameScreen.style.display = "flex";
                            gameSelectContent.style.display = "none";
                            gameSelectContent.classList.remove("active");
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
                setTimeout(() => {
                    officialList.style.display = "none";
                    officialList.offsetHeight;
                    officialList.style.display = "flex";
                    console.log("Forced repaint on official-list");
                }, 0);
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
                                gameScreen.style.display = "flex";
                                gameSelectContent.style.display = "none";
                                gameSelectContent.classList.remove("active");
                                showKeyboard();
                                activeInput = guessInput;
                                if (activeInput && !isMobile) activeInput.focus();
                                adjustBackground();
                                setupKeyboardListeners();
                                const currentIndex = privateGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                                updateArrowStates(currentIndex, privateGames);
                                setTimeout(() => { isUILocked = false; }, 500);
                            } else {
                                console.log("Touch ended with movement, ignoring as scroll");
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
                            gameScreen.style.display = "flex";
                            gameSelectContent.style.display = "none";
                            gameSelectContent.classList.remove("active");
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
            }
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        document.querySelectorAll("#game-name").forEach(name => {
            name.addEventListener(isMobile ? "touchstart" : "click", async () => {
                console.log("Game name clicked", { isUILocked });
                if (isUILocked) return;
                isUILocked = true;
                resetGame();
                currentBackground = allGames[0]["Background"] && allGames[0]["Background"].trim() !== "" ? allGames[0]["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(allGames[0]);
                resetScreenDisplays(gameScreen);
                gameScreen.style.display = "flex";
                showKeyboard();
                activeInput = guessInput;
                if (activeInput && !isMobile) activeInput.focus();
                adjustBackground();
                setupKeyboardListeners();
                updateArrowStates(0, allGames);
                setTimeout(() => { isUILocked = false; }, 500);
            });
        });

        guessInput.addEventListener("focus", () => {
            console.log("Guess input focused");
            activeInput = guessInput;
        });
    }

    // Calculate hint lines
    function calculateHintLines(hintsArray) {
        const tempContainer = document.createElement("div");
        tempContainer.style.fontSize = isMobile ? "2.75vh" : "3.25vh";
        tempContainer.style.fontFamily = "'Luckiest Guy', cursive";
        tempContainer.style.position = "absolute";
        tempContainer.style.visibility = "hidden";
        tempContainer.style.maxWidth = "82.5vw";
        tempContainer.style.whiteSpace = "normal";
        tempContainer.style.lineHeight = "1.2";
        tempContainer.style.display = "inline-block";
        tempContainer.style.wordBreak = "break-word";
        tempContainer.textContent = hintsArray.join(" | ");
        document.body.appendChild(tempContainer);
        
        const height = tempContainer.offsetHeight;
        const lineHeight = (isMobile ? 2.75 : 3.25) * 1.2;
        const lines = Math.ceil(height / lineHeight) || 1;
        
        document.body.removeChild(tempContainer);
        return lines;
    }

    // Update hint fade
    function updateHintFade(hintsContainer, visibleHints) {
        const lines = calculateHintLines(visibleHints);
        hintsContainer.classList.remove('lines-0', 'lines-1', 'lines-2');
        hintsContainer.classList.add(`lines-${Math.min(lines, 2)}`);
        lastHintLines = lines;
        console.log("Hint fade updated:", { visibleHints, lines });
    }

    // Build hint HTML
    function buildHintHTML(hintsArray) {
        if (hintsArray.length === 0) return "";
        
        const htmlParts = [];
        hintsArray.forEach((hint, index) => {
            htmlParts.push(hint);
            if (index < hintsArray.length - 1) {
                htmlParts.push(' <span class="separator yellow">|</span> ');
            }
        });
        
        return htmlParts.join("");
    }

    // Setup hints
    function setupHints() {
        const hintsContainer = document.getElementById("hints-container");
        if (!hintsContainer) {
            console.error("hints-container element not found");
            return;
        }
        console.log("Setting up hints:", { hints, hintIndex });
        hintsContainer.innerHTML = "";
        hintsContainer.style.display = "block";
        hintsContainer.style.visibility = "visible";
        hintsContainer.style.opacity = "1";
        const visibleHints = hints.slice(0, hintIndex + 1);
        if (visibleHints.length > 0) {
            hintsContainer.innerHTML = buildHintHTML(visibleHints);
            updateHintFade(hintsContainer, visibleHints);
        } else {
            hintsContainer.classList.add('lines-0');
            lastHintLines = 0;
            console.log("No hints to display yet, reserving space");
        }
    }

    // Adjust background
    function adjustBackground() {
        console.log("Adjusting background to:", currentBackground);
        if (gameScreen) {
            gameScreen.style.background = `url('${currentBackground}') no-repeat center top fixed, #FFFFFF`;
            gameScreen.style.backgroundSize = "100% calc(100% - 24vh)";
            gameScreen.style.backgroundAttachment = "fixed";
            gameScreen.offsetHeight;
        }
    }

    window.addEventListener("resize", adjustBackground);

    // Reveal hint
    function revealHint() {
        hintIndex++;
        console.log("Revealing hint, new hintIndex:", hintIndex, "total hints:", hints.length);
        if (hintIndex < hints.length) {
            const hintsContainer = document.getElementById("hints-container");
            if (!hintsContainer) {
                console.error("hints-container element not found in revealHint");
                return;
            }
            const visibleHints = hints.slice(0, hintIndex + 1);
            hintsContainer.innerHTML = buildHintHTML(visibleHints);
            hintsContainer.style.display = "block";
            hintsContainer.style.visibility = "visible";
            hintsContainer.style.opacity = "1";
            updateHintFade(hintsContainer, visibleHints);
            console.log("Revealed hint:", visibleHints[visibleHints.length - 1], "Lines:", lastHintLines);
        }
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
        guessInput.value = "";
        guessCount++;
        guesses.push(guess);
        console.log("Guess added, current guesses:", guesses);

        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}`;
        }

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
            saveGameResult(gameType, normalizedGameNumber, secretWord, guessCount);
            endGame(true);
        } else {
            console.log("Incorrect guess, animating...");
            guessInputContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                guessInput.style.opacity = "1";
                guessInput.style.visibility = "visible";
                guessInput.style.color = "#000000";
                isProcessingGuess = false;
                console.log("Animation completed, input reset");
                if (guessInput && !isMobile) {
                    guessInput.focus();
                    activeInput = guessInput;
                    guessInput.dispatchEvent(new Event("guessProcessed"));
                }
            }, 350);

            if (hintIndex < hints.length - 1) {
                revealHint();
            }
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
            console.log(`Game result not saved for ${resultsKey}[${normalizedGameNumber}]: existing score '${results[normalizedGameNumber].guesses}' is not '-' and will be preserved`, results[normalizedGameNumber]);
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

        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) {
            hintsContainer.innerHTML = won ? "Well Done" : "Hard Luck";
            hintsContainer.style.display = "block";
            hintsContainer.style.visibility = "visible";
            hintsContainer.style.opacity = "1";
            hintsContainer.classList.remove('lines-0', 'lines-1', 'lines-2');
            hintsContainer.classList.add(`lines-${lastHintLines || 1}`);
            console.log("Hints container updated to:", hintsContainer.innerHTML, "Lines:", lastHintLines);
        }

        const hintsLabel = document.getElementById("hints-label");
        if (hintsLabel) {
            hintsLabel.style.visibility = "hidden";
            console.log("Hints label hidden");
        }

        if (isMobile && keyboardContainer) {
            keyboardContainer.classList.add("show-game-over");
            keyboardContainer.style.display = "flex";
            keyboardContent.style.display = "none";
            keyboardGuessesContent.style.display = "none";
            keyboardGiveUpContent.style.display = "none";
            document.getElementById("game-over").style.display = "flex";
            keyboardBackBtn.style.display = "none";
        } else {
            document.getElementById("game-over").style.display = "flex";
            document.getElementById("main-content").style.display = "none";
        }

        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");

        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }

        let shareMessage;
        if (gaveUp) {
            shareMessage = `Play WORDY`;
        } else {
            shareMessage = `${currentGameNumber}\nI solved WORDY in\n<span class="guess-count">${guessCount}</span>\n${guessCount === 1 ? 'guess' : 'guesses'}`;
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
    }

    // Start pineapple rain
    function startPineappleRain() {
        console.log("Starting pineapple rain animation");
        const rainContainer = document.createElement("div");
        rainContainer.className = "pineapple-rain";
        document.body.appendChild(rainContainer);

        function createWave(waveNumber) {
            const pieces = Array(40).fill("🍍");
            pieces.forEach(() => {
                const piece = document.createElement("div");
                piece.className = "pineapple-piece";
                piece.textContent = "🍍";
                piece.style.left = `${Math.random() * 100}vw`;
                piece.style.animationDuration = `${Math.random() * 3.5 + 2.5}s`;
                piece.style.fontSize = `${Math.random() * 1.5 + 0.8}vh`;
                piece.style.animationDelay = `${waveNumber * 0.2 + Math.randomikeyboardContainer * 0.15}s`;
                piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
                piece.style.setProperty('--drift', `${Math.random() * 2 - 1}`);
                rainContainer.appendChild(piece);
            });
        }

        const waveCount = isMobile ? 6 : 5;
        for (let i = 0; i < waveCount; i++) {
            createWave(i);
        }

        setTimeout(() => {
            rainContainer.remove();
            console.log("Pineapple rain animation ended");
        }, 13500);
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
            guesses = [];
            isProcessingGuess = false;
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
                guessInputContainer.classList.remove("wrong-guess", "game-ended");
            }
            if (guessesLink) {
                guessesLink.textContent = `Guesses: 0`;
            }
            const hintsContainer = document.getElementById("hints-container");
            if (hintsContainer) {
                hintsContainer.innerHTML = "";
                hintsContainer.classList.remove('lines-0', 'lines-1', 'lines-2');
                hintsContainer.classList.add('lines-0');
                hintsContainer.style.display = "block";
                hintsContainer.style.visibility = "visible";
                hintsContainer.style.opacity = "1";
                lastHintLines = 0;
            }
            const hintsLabel = document.getElementById("hints-label");
            if (hintsLabel) {
                hintsLabel.style.visibility = "visible";
            }
            if (gameScreen) {
                gameScreen.classList.remove("game-ended");
            }
            if (document.getElementById("game-over")) {
                document.getElementById("game-over").style.display = "none";
            }
            if (document.getElementById("main-content")) {
                document.getElementById("main-content").style.display = "flex";
            }
            if (keyboardContainer) {
                keyboardContainer.classList.remove("show-game-over");
                if (isMobile) {
                    keyboardContainer.style.display = "flex";
                }
            }
            console.log("Game reset complete, state:", { gameOver, secretWord, hints, hintIndex, guessCount });
        }
    
        // Load game
        function loadGame(game) {
            console.log("Loading game:", game);
            isLoadingGame = true;
            resetGame();
            try {
                const gameNumber = game["Game Number"];
                const isPrivate = game["Display Name"] && game["Display Name"].includes("-");
                currentGameNumber = isPrivate ? `${gameNumber} - Private` : `Game #${gameNumber}`;
                if (gameNumberText) {
                    gameNumberText.textContent = currentGameNumber;
                }
                secretWord = game["Secret Word"] ? game["Secret Word"].trim().toUpperCase() : "";
                hints = [
                    game["Hint 1"] ? game["Hint 1"].trim().toUpperCase() : "",
                    game["Hint 2"] ? game["Hint 2"].trim().toUpperCase() : "",
                    game["Hint 3"] ? game["Hint 3"].trim().toUpperCase() : "",
                    game["Hint 4"] ? game["Hint 4"].trim().toUpperCase() : "",
                    game["Hint 5"] ? game["Hint 5"].trim().toUpperCase() : ""
                ].filter(hint => hint);
                console.log("Game data loaded:", { currentGameNumber, secretWord, hints });
    
                const resultsKey = isPrivate ? "privatePineappleResults" : "pineappleResults";
                const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
                const normalizedGameNumber = isPrivate ? gameNumber : gameNumber.replace("Game #", "");
                const pastResult = results[normalizedGameNumber];
                console.log(`Checking past result for ${resultsKey}[${normalizedGameNumber}]:`, pastResult);
    
                if (pastResult && (pastResult.guesses === "Gave Up" || pastResult.guesses === "X" || pastResult.secretWord === secretWord)) {
                    console.log("Game already completed, showing result:", pastResult);
                    gameOver = true;
                    guessInput.disabled = true;
                    guessBtn.disabled = true;
                    guessInput.value = secretWord;
                    guessInputContainer.classList.add("game-ended");
                    gameScreen.classList.add("game-ended");
                    const hintsContainer = document.getElementById("hints-container");
                    if (hintsContainer) {
                        hintsContainer.innerHTML = pastResult.guesses === "Gave Up" || pastResult.guesses === "X" ? "Hard Luck" : "Well Done";
                        hintsContainer.classList.remove('lines-0', 'lines-1', 'lines-2');
                        hintsContainer.classList.add(`lines-${lastHintLines || 1}`);
                        hintsContainer.style.display = "block";
                        hintsContainer.style.visibility = "visible";
                        hintsContainer.style.opacity = "1";
                    }
                    const hintsLabel = document.getElementById("hints-label");
                    if (hintsLabel) {
                        hintsLabel.style.visibility = "hidden";
                    }
                    if (isMobile && keyboardContainer) {
                        keyboardContainer.classList.add("show-game-over");
                        keyboardContainer.style.display = "flex";
                        keyboardContent.style.display = "none";
                        keyboardGuessesContent.style.display = "none";
                        keyboardGiveUpContent.style.display = "none";
                        document.getElementById("game-over").style.display = "flex";
                        keyboardBackBtn.style.display = "none";
                    } else {
                        document.getElementById("game-over").style.display = "flex";
                        document.getElementById("main-content").style.display = "none";
                    }
                    const shareText = document.getElementById("share-text");
                    const gameNumberDisplay = document.getElementById("game-number-display");
                    if (gameNumberDisplay) {
                        gameNumberDisplay.textContent = currentGameNumber;
                    }
                    let shareMessage;
                    if (pastResult.guesses === "Gave Up") {
                        shareMessage = `Play WORDY`;
                    } else {
                        shareMessage = `${currentGameNumber}\nI solved WORDY in\n<span class="guess-count">${pastResult.guesses}</span>\n${pastResult.guesses === 1 ? 'guess' : 'guesses'}`;
                    }
                    if (shareText) {
                        shareText.innerHTML = shareMessage.replace(/\n/g, "<br>");
                    }
                    if (pastResult.guesses !== "Gave Up" && pastResult.guesses !== "X") {
                        startPineappleRain();
                    }
                } else {
                    console.log("Setting up new or uncompleted game");
                    hintIndex = 0;
                    setupHints();
                    if (guessInput && !isMobile) {
                        guessInput.focus();
                        activeInput = guessInput;
                    }
                }
                if (guessInput) {
                    guessInput.dispatchEvent(new Event("guessProcessed"));
                }
            } catch (error) {
                console.error("Error loading game:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to load game.";
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isLoadingGame = false;
            }
        }
    
        // Initialize game
        async function initializeGame() {
            console.log("Initializing game");
            await fetchGameData();
            await fetchPrivateGames();
            initializeCursor();
            setupKeyboardListeners();
            adjustBackground();
        }
    
        // Start the game
        initializeGame().catch(error => {
            console.error("Initialization failed:", error);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to initialize game.";
                formErrorDialog.style.display = "flex";
            }
        });
    });