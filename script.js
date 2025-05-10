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
    
        // Form back button
        if (formBackBtn) {
            formBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Form back button triggered");
                resetScreenDisplays(gameScreen);
                gameSelectContent.style.display = "flex";
                gameSelectContent.classList.add("active");
                privateTab.classList.add("active");
                officialTab.classList.remove("active");
                privateContent.classList.add("active");
                privateContent.style.display = "flex";
                officialContent.classList.remove("active");
                officialContent.style.display = "none";
                displayGameList();
                adjustBackground();
                setupKeyboardListeners();
                if (isMobile) showKeyboard();
            });
        }
    
        // Official back button
        if (officialBackBtn) {
            officialBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Official back button triggered");
                resetScreenDisplays(gameScreen);
                adjustBackground();
                if (isMobile) showKeyboard();
                if (guessInput && !isMobile) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            });
        }
    
        // Private back button
        if (privateBackBtn) {
            privateBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Private back button triggered");
                resetScreenDisplays(gameScreen);
                adjustBackground();
                if (isMobile) showKeyboard();
                if (guessInput && !isMobile) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            });
        }
    
        // Form error OK button
        if (formErrorOkBtn) {
            formErrorOkBtn.addEventListener("click", (e) => {
                e.preventDefault();
                console.log("Form error OK button clicked");
                if (formErrorDialog) formErrorDialog.style.display = "none";
                resetScreenDisplays(gameScreen);
                adjustBackground();
                if (guessInput && !isMobile) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            });
        }
    
        // Guesses close button
        if (guessesCloseBtn) {
            guessesCloseBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Guesses close button triggered");
                if (isMobile) {
                    showKeyboard();
                } else {
                    guessesScreen.style.display = "none";
                }
                if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            });
        }
    
        // Next game button (end screen)
        if (nextGameBtnEnd) {
            nextGameBtnEnd.addEventListener(isMobile ? "touchstart" : "click", debounce(async (e) => {
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
                        console.log("Loading next game from end screen", { currentIndex, targetIndex: currentIndex - 1, targetGame });
                        currentBackground = targetGame["Background"] && targetGame["Background"].trim() !== "" ? targetGame["Background"] : defaultBackground;
                        await preloadBackground(currentBackground);
                        loadGame(targetGame);
                        resetScreenDisplays(gameScreen);
                        gameScreen.style.display = "flex";
                        adjustBackground();
                        showKeyboard();
                        updateArrowStates(currentIndex - 1, gameList);
                    } else {
                        console.log("At the newest game, showing game select screen");
                        showGameSelectScreen();
                    }
                } catch (error) {
                    console.error("Error navigating to next game from end screen:", error.message);
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "Failed to load next game.";
                        formErrorDialog.style.display = "flex";
                    }
                } finally {
                    isUILocked = false;
                    isLoadingGame = false;
                }
            }, 50));
        }
    
        // Adjust background
        function adjustBackground() {
            const backgroundUrl = currentBackground || defaultBackground;
            console.log("Adjusting background to:", backgroundUrl);
            gameScreen.style.background = `url('${backgroundUrl}') no-repeat center top fixed, #FFFFFF`;
            gameScreen.style.backgroundSize = `100% calc(100% - 24vh)`;
            gameScreen.style.backgroundAttachment = "fixed";
        }
    
        // Show game select screen
        function showGameSelectScreen() {
            console.log("Showing game select screen");
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
    
        // Fetch games
        async function fetchGames(url) {
            try {
                console.log("Fetching games from:", url);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const text = await response.text();
                const games = parseCSV(text);
                console.log(`Fetched ${games.length} games from ${url}`);
                return games;
            } catch (error) {
                console.error("Error fetching games:", error.message);
                return [];
            }
        }
    
        // Parse CSV
        function parseCSV(csvText) {
            console.log("Parsing CSV data");
            const lines = csvText.split("\n").filter(line => line.trim());
            if (lines.length === 0) {
                console.warn("No valid CSV lines found");
                return [];
            }
            const headers = lines[0].split(",").map(header => header.trim());
            const games = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(",").map(value => value.trim());
                if (values.length < headers.length) {
                    console.warn(`Skipping malformed CSV line ${i + 1}:`, values);
                    continue;
                }
                const game = {};
                headers.forEach((header, index) => {
                    game[header] = values[index] || "";
                });
                games.push(game);
            }
            console.log("Parsed games:", games.length);
            return games;
        }
    
        // Initialize game
        async function initializeGame() {
            console.log("Initializing game");
            try {
                allGames = await fetchGames(officialUrl);
                privateGames = await fetchGames(privateUrl);
                console.log("Games loaded", { allGames: allGames.length, privateGames: privateGames.length });
    
                if (allGames.length === 0) {
                    console.error("No official games available");
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "No games available.";
                        formErrorDialog.style.display = "flex";
                    }
                    return;
                }
    
                const latestGame = allGames[0];
                console.log("Loading latest game:", latestGame);
                currentBackground = latestGame["Background"] && latestGame["Background"].trim() !== "" ? latestGame["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(latestGame);
                adjustBackground();
                updateArrowStates(0, allGames);
                setupKeyboardListeners();
                initializeCursor();
                if (isMobile) showKeyboard();
                resetScreenDisplays(gameScreen);
                gameScreen.style.display = "flex";
            } catch (error) {
                console.error("Error initializing game:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to initialize game.";
                    formErrorDialog.style.display = "flex";
                }
            }
        }
    
        // Load game (Modified to fix game loading as completed)
        function loadGame(game) {
            console.log("Loading game:", game);
            isLoadingGame = true;
            resetGame(); // Reset game state first
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
    
                // Modified: Only mark as completed if the player gave up or failed
                if (pastResult && (pastResult.guesses === "Gave Up" || pastResult.guesses === "X")) {
                    console.log("Game previously gave up or failed, showing result:", pastResult);
                    gameOver = true;
                    guessInput.disabled = true;
                    guessBtn.disabled = true;
                    guessInput.value = secretWord;
                    guessInputContainer.classList.add("game-ended");
                    gameScreen.classList.add("game-ended");
                    const hintsContainer = document.getElementById("hints-container");
                    if (hintsContainer) {
                        hintsContainer.innerHTML = "Hard Luck";
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
                    const shareMessage = `Play WORDY`;
                    if (shareText) {
                        shareText.innerHTML = shareMessage.replace(/\n/g, "<br>");
                    }
                } else {
                    console.log("Setting up new or replayable game");
                    gameOver = false;
                    guessInput.disabled = false;
                    guessBtn.disabled = false;
                    guessInput.value = "";
                    hintIndex = 0;
                    setupHints(); // Always set up hints for new or replayable games
                    if (hints.length > 0) {
                        revealHint(); // Show the first hint immediately
                    }
                    if (guessInput) {
                        guessInput.dispatchEvent(new Event("guessProcessed"));
                        if (!isMobile) {
                            guessInput.focus();
                            activeInput = guessInput;
                        }
                    }
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
                guessInput.dispatchEvent(new Event("guessProcessed"));
            }
            if (guessBtn) {
                guessBtn.disabled = false;
            }
            if (guessInputContainer) {
                guessInputContainer.classList.remove("game-ended", "wrong-guess");
            }
            if (gameScreen) {
                gameScreen.classList.remove("game-ended");
            }
            const hintsContainer = document.getElementById("hints-container");
            if (hintsContainer) {
                hintsContainer.innerHTML = "";
                hintsContainer.classList.remove('lines-0', 'lines-1', 'lines-2');
                hintsContainer.style.display = "none";
            }
            const hintsLabel = document.getElementById("hints-label");
            if (hintsLabel) {
                hintsLabel.style.visibility = "visible";
            }
            if (document.getElementById("main-content")) {
                document.getElementById("main-content").style.display = "flex";
            }
            if (document.getElementById("game-over")) {
                document.getElementById("game-over").style.display = "none";
            }
            if (keyboardContainer) {
                keyboardContainer.classList.remove("show-game-over");
                if (isMobile) {
                    showKeyboard();
                }
            }
            console.log("Game state reset complete");
        }
    
        // Setup hints (Modified to ensure proper initialization)
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
            hintsContainer.classList.remove('lines-0', 'lines-1', 'lines-2');
            if (hints.length > 0 && hintIndex >= 0) {
                const visibleHints = hints.slice(0, hintIndex + 1);
                hintsContainer.innerHTML = buildHintHTML(visibleHints);
                updateHintFade(hintsContainer, visibleHints);
            } else {
                hintsContainer.classList.add('lines-0');
                lastHintLines = 0;
                console.log("No hints available, reserving space");
            }
        }
    
        // Build hint HTML
        function buildHintHTML(hintsArray) {
            console.log("Building hint HTML for:", hintsArray);
            return hintsArray.map(hint => `<span>${hint}</span>`).join('<span class="separator"> | </span>');
        }
    
        // Update hint fade
        function updateHintFade(hintsContainer, hintsArray) {
            console.log("Updating hint fade:", { hintsArray, lastHintLines });
            hintsContainer.classList.remove('lines-0', 'lines-1', 'lines-2');
            const lines = calculateHintLines(hintsArray);
            hintsContainer.classList.add(`lines-${lines}`);
            lastHintLines = lines;
            console.log("Hint lines calculated:", lines);
        }
    
        // Calculate hint lines (Modified for performance)
        function calculateHintLines(hintsArray) {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            context.font = `${isMobile ? "2.75vh" : "3.25vh"} 'Luckiest Guy', cursive`;
            const text = hintsArray.join(" | ");
            const width = context.measureText(text).width;
            const maxWidth = 0.825 * window.innerWidth; // 82.5vw
            const lines = Math.ceil(width / maxWidth) || 1;
            console.log("Calculated hint lines:", { text, width, maxWidth, lines });
            return Math.min(lines, 2);
        }
    
        // Reveal hint (Modified to ensure visibility)
        function revealHint() {
            console.log("Revealing hint:", { hintIndex, hints, nextHint: hints[hintIndex] });
            hintIndex++;
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
        async function handleGuess(guess) {
            console.log("Handling guess:", guess, { isProcessingGuess, gameOver });
            if (isProcessingGuess || gameOver) {
                console.log("Guess ignored: already processing or game over");
                return;
            }
            isProcessingGuess = true;
            guess = guess.trim().toUpperCase();
            guessInput.disabled = true;
            guessBtn.disabled = true;
    
            try {
                if (!firstGuessMade) {
                    firstGuessMade = true;
                    console.log("First guess made, revealing hint");
                    revealHint();
                }
                guessCount++;
                guesses.push(guess);
                console.log("Guess recorded:", { guess, guessCount, guesses });
    
                if (guess === secretWord) {
                    console.log("Correct guess!");
                    guessInputContainer.classList.add("game-ended");
                    gameScreen.classList.add("game-ended");
                    saveGameResult(
                        currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple",
                        currentGameNumber.includes("- Private") ? currentGameNumber.split(" - ")[0] : currentGameNumber.replace("Game #", ""),
                        secretWord,
                        guessCount
                    );
                    await endGame(true);
                } else {
                    console.log("Incorrect guess, flashing red");
                    guessInputContainer.classList.add("wrong-guess");
                    animationTimeout = setTimeout(() => {
                        guessInputContainer.classList.remove("wrong-guess");
                        guessInput.value = "";
                        guessInput.disabled = false;
                        guessBtn.disabled = false;
                        isProcessingGuess = false;
                        guessInput.dispatchEvent(new Event("guessProcessed"));
                        if (!isMobile) {
                            guessInput.focus();
                            activeInput = guessInput;
                        }
                        console.log("Guess animation complete, state reset");
                    }, 350);
                    if (guessCount >= 6) {
                        console.log("Max guesses reached, ending game");
                        saveGameResult(
                            currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple",
                            currentGameNumber.includes("- Private") ? currentGameNumber.split(" - ")[0] : currentGameNumber.replace("Game #", ""),
                            secretWord,
                            "X"
                        );
                        await endGame(false);
                    } else {
                        console.log("Revealing next hint due to incorrect guess");
                        revealHint();
                    }
                }
            } catch (error) {
                console.error("Error handling guess:", error.message);
                guessInput.disabled = false;
                guessBtn.disabled = false;
                isProcessingGuess = false;
                guessInput.dispatchEvent(new Event("guessProcessed"));
            }
        }
    
        // Save game result
        function saveGameResult(gameType, gameNumber, secretWord, result) {
            console.log("Saving game result:", { gameType, gameNumber, secretWord, result });
            const resultsKey = gameType === "pineapple" ? "pineappleResults" : "privatePineappleResults";
            let results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
            results[gameNumber] = { secretWord, guesses: result };
            localStorage.setItem(resultsKey, JSON.stringify(results));
            console.log(`Saved to ${resultsKey}:`, results);
        }
    
        // End game
        async function endGame(won, gaveUp = false) {
            console.log("Ending game", { won, gaveUp });
            gameOver = true;
            guessInput.disabled = true;
            guessBtn.disabled = true;
            const hintsContainer = document.getElementById("hints-container");
            if (hintsContainer) {
                hintsContainer.innerHTML = won ? "Well Done!" : "Hard Luck";
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
            if (!won && !gaveUp) {
                guessInput.value = secretWord;
            }
            if (won) {
                await startPineappleRain();
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
            const shareMessage = `Play WORDY`;
            if (shareText) {
                shareText.innerHTML = shareMessage.replace(/\n/g, "<br>");
            }
            console.log("Game ended, UI updated");
        }
    
        // Pineapple rain animation
        async function startPineappleRain() {
            console.log("Starting pineapple rain");
            const container = document.createElement("div");
            container.className = "pineapple-rain";
            document.body.appendChild(container);
            const pieces = ["🍍"];
            const numPieces = isMobile ? 30 : 50;
            for (let i = 0; i < numPieces; i++) {
                const piece = document.createElement("div");
                piece.className = "pineapple-piece";
                piece.textContent = pieces[Math.floor(Math.random() * pieces.length)];
                piece.style.left = `${Math.random() * 100}vw`;
                piece.style.fontSize = `${Math.random() * 2 + 2}vh`;
                piece.style.animationDuration = `${Math.random() * 2 + 2}s`;
                piece.style.setProperty("--rotation", `${(Math.random() - 0.5) * 360}deg`);
                piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 20}`);
                container.appendChild(piece);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            setTimeout(() => {
                container.remove();
                console.log("Pineapple rain ended");
            }, 4000);
        }
    
        // Display game list
        function displayGameList() {
            console.log("Displaying game list", { allGames: allGames.length, privateGames: privateGames.length });
            const officialList = document.getElementById("official-list");
            const privateList = document.getElementById("private-list");
            if (!officialList || !privateList) {
                console.error("Game list containers not found");
                return;
            }
    
            officialList.innerHTML = "";
            privateList.innerHTML = "";
    
            const officialHeader = document.createElement("div");
            officialHeader.className = "game-list-header";
            officialHeader.innerHTML = `
                <span>Game</span>
                <span>Result</span>
                <span>Play</span>
            `;
            officialList.appendChild(officialHeader);
    
            const privateHeader = document.createElement("div");
            privateHeader.className = "game-list-header";
            privateHeader.innerHTML = `
                <span>Game</span>
                <span>Result</span>
                <span>Play</span>
            `;
            privateList.appendChild(privateHeader);
    
            const pineappleResults = JSON.parse(localStorage.getItem("pineappleResults") || "{}");
            const privatePineappleResults = JSON.parse(localStorage.getItem("privatePineappleResults") || "{}");
    
            allGames.forEach(game => {
                const gameNumber = game["Game Number"];
                const result = pineappleResults[gameNumber];
                const row = document.createElement("div");
                row.className = "game-list-row";
                const status = result ? (result.guesses === "Gave Up" || result.guesses === "X" ? "red" : "green") : "yellow";
                row.innerHTML = `
                    <span class="${status}">Game #${gameNumber}</span>
                    <span class="${status}">${result ? (result.guesses === "Gave Up" ? "Gave Up" : result.guesses === "X" ? "Failed" : `${result.guesses}/6`) : "Not Played"}</span>
                    <span><span class="play-now">Play</span></span>
                `;
                row.addEventListener("touchstart", (e) => {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    touchMoved = false;
                    console.log("Touch started on official game row", { gameNumber });
                });
                row.addEventListener("touchmove", (e) => {
                    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                    if (deltaX > touchThreshold || deltaY > touchThreshold) {
                        touchMoved = true;
                        console.log("Touch moved, preventing click");
                    }
                });
                row.addEventListener("touchend", async (e) => {
                    e.preventDefault();
                    if (!touchMoved && !isUILocked && !isLoadingGame) {
                        console.log("Loading official game:", game);
                        isUILocked = true;
                        isLoadingGame = true;
                        try {
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            gameScreen.style.display = "flex";
                            adjustBackground();
                            updateArrowStates(allGames.findIndex(g => g["Game Number"] === gameNumber), allGames);
                            if (isMobile) showKeyboard();
                            if (guessInput && !isMobile) {
                                guessInput.focus();
                                activeInput = guessInput;
                            }
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
                    }
                });
                officialList.appendChild(row);
            });
    
            privateGames.forEach(game => {
                const gameNumber = game["Game Number"];
                const displayName = game["Display Name"] || `Game ${gameNumber}`;
                const result = privatePineappleResults[gameNumber];
                const row = document.createElement("div");
                row.className = "game-list-row";
                const status = result ? (result.guesses === "Gave Up" || result.guesses === "X" ? "red" : "green") : "yellow";
                row.innerHTML = `
                    <span class="${status}">${displayName}</span>
                    <span class="${status}">${result ? (result.guesses === "Gave Up" ? "Gave Up" : result.guesses === "X" ? "Failed" : `${result.guesses}/6`) : "Not Played"}</span>
                    <span><span class="play-now">Play</span></span>
                `;
                row.addEventListener("touchstart", (e) => {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    touchMoved = false;
                    console.log("Touch started on private game row", { gameNumber, displayName });
                });
                row.addEventListener("touchmove", (e) => {
                    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                    if (deltaX > touchThreshold || deltaY > touchThreshold) {
                        touchMoved = true;
                        console.log("Touch moved, preventing click");
                    }
                });
                row.addEventListener("touchend", async (e) => {
                    e.preventDefault();
                    if (!touchMoved && !isUILocked && !isLoadingGame) {
                        console.log("Loading private game:", game);
                        isUILocked = true;
                        isLoadingGame = true;
                        try {
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            gameScreen.style.display = "flex";
                            adjustBackground();
                            updateArrowStates(privateGames.findIndex(g => g["Game Number"] === gameNumber), privateGames);
                            if (isMobile) showKeyboard();
                            if (guessInput && !isMobile) {
                                guessInput.focus();
                                activeInput = guessInput;
                            }
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
                    }
                });
                privateList.appendChild(row);
            });
    
            console.log("Game lists populated");
        }
    
        // Handle form submission
        if (confirmBtn) {
            confirmBtn.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Confirm button triggered");
                const gameNameInput = document.getElementById("game-name-input");
                const secretWordInput = document.getElementById("secret-word");
                const hintInputs = [
                    document.getElementById("hint-1"),
                    document.getElementById("hint-2"),
                    document.getElementById("hint-3"),
                    document.getElementById("hint-4"),
                    document.getElementById("hint-5")
                ];
                const gameName = gameNameInput.value.trim().toUpperCase();
                const secretWord = secretWordInput.value.trim().toUpperCase();
                const hints = hintInputs.map(input => input.value.trim().toUpperCase()).filter(hint => hint);
                console.log("Form data:", { gameName, secretWord, hints });
    
                if (!secretWord) {
                    console.error("Secret word is required");
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "Secret word is required.";
                        formErrorDialog.style.display = "flex";
                    }
                    return;
                }
                if (hints.length < 3) {
                    console.error("At least three hints are required");
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "Please provide at least three hints.";
                        formErrorDialog.style.display = "flex";
                    }
                    return;
                }
    
                try {
                    const formData = new FormData();
                    formData.append("Game Name", gameName);
                    formData.append("Secret Word", secretWord);
                    hints.forEach((hint, index) => {
                        formData.append(`Hint ${index + 1}`, hint);
                    });
    
                    console.log("Submitting form data to:", webAppUrl);
                    const response = await fetch(webAppUrl, {
                        method: "POST",
                        body: formData
                    });
    
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
    
                    console.log("Form submitted successfully");
                    privateGames = await fetchGames(privateUrl);
                    resetScreenDisplays(gameScreen);
                    gameSelectContent.style.display = "flex";
                    gameSelectContent.classList.add("active");
                    privateTab.classList.add("active");
                    officialTab.classList.remove("active");
                    privateContent.classList.add("active");
                    privateContent.style.display = "flex";
                    officialContent.classList.remove("active");
                    officialContent.style.display = "none";
                    displayGameList();
                    adjustBackground();
                    if (isMobile) showKeyboard();
                    gameNameInput.value = "";
                    secretWordInput.value = "";
                    hintInputs.forEach(input => input.value = "");
                } catch (error) {
                    console.error("Error submitting form:", error.message);
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "Failed to create game.";
                        formErrorDialog.style.display = "flex";
                    }
                }
            });
        }
    
        // Initialize the game
        await initializeGame();
    });