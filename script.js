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
    let incorrectGuessCount = 0; // Track incorrect guesses
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
    const homeBtn = document.getElementById("home-btn");
    const createPineappleBtn = document.getElementById("create-pineapple");
    const formContent = document.getElementById("form-content");
    const confirmBtn = document.getElementById("confirm-btn");
    const formBackBtn = document.getElementById("form-back-btn");
    const createPineappleLink = document.getElementById("create-pineapple-end");
    const guessBtn = document.getElementById("guess-btn");
    const guessesScreen = document.getElementById("guesses-screen");
    const guessesCloseBtn = document.getElementById("guesses-close-btn");
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const nextGameBtnEnd = document.getElementById("next-game-btn-end");
    const officialBackBtn = document.getElementById("official-back-btn");
    const privateBackBtn = document.getElementById("private-back-btn");
    const giveUpLink = document.getElementById("give-up-link");
    const giveUpDialog = document.getElementById("give-up-dialog");
    const giveUpYesBtn = document.getElementById("give-up-yes-btn");
    const giveUpNoBtn = document.getElementById("give-up-no-btn");
    const guessesLink = document.getElementById("guesses-link");
    const pineappleLives = document.querySelectorAll(".pineapple-icon"); // Select pineapple icons
    const allGamesLink = document.getElementById("all-games-link");
    const prevGameArrow = document.getElementById("prev-game-arrow");
    const nextGameArrow = document.getElementById("next-game-arrow");
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

    // Preload background image with robust error handling
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
                console.error(`Failed to preload background: ${url}, attempting default: ${defaultBackground}`);
                if (url !== defaultBackground) {
                    img.src = defaultBackground;
                    img.onload = () => {
                        console.log(`Default background preloaded: ${defaultBackground}`);
                        resolve(defaultBackground);
                    };
                    img.onerror = () => {
                        console.error(`Failed to preload default background: ${defaultBackground}`);
                        resolve(defaultBackground); // Always resolve to prevent hanging
                    };
                } else {
                    console.error(`Default background also failed: ${defaultBackground}`);
                    resolve(defaultBackground); // Resolve even if default fails to avoid blocking
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
        input.readOnly = false;
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
        keyboardContainer.offsetHeight; // Force reflow
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
            if (activeScreen === gameScreen && isMobile && !gameOver) {
                showKeyboard();
                keyboardContainer.style.display = "flex";
            } else {
                keyboardContainer.style.display = "none";
            }
        }
        if (activeScreen) {
            activeScreen.style.display = "none";
            activeScreen.offsetHeight; // Trigger reflow
            activeScreen.style.display = "flex";
        }
        // Toggle fade classes
        gameScreen.classList.remove("game-select-active", "form-active");
        if (activeScreen === gameSelectContent) {
            gameScreen.classList.add("game-select-active");
        } else if (activeScreen === formContent) {
            gameScreen.classList.add("form-active");
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

    // Home button
    if (homeBtn) {
        homeBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Home button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
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
            if (isMobile) showKeyboard();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Create a Wordy button
    if (createPineappleBtn && formContent) {
        createPineappleBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create a Wordy triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            resetScreenDisplays(formContent); // Set formContent as active
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

    // Form back button
    if (formBackBtn) {
        formBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form Back button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            formContent.style.display = "none";
            formContent.classList.remove("active");
            activeInput = guessInput;
            if (activeInput && !isMobile) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
            if (isMobile) showKeyboard();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Form error dialog OK button
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form Error OK button clicked");
            if (formErrorDialog) formErrorDialog.style.display = "none";
            if (guessInput && !gameOver && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        });
    }

    // Confirm button
    if (confirmBtn) {
        confirmBtn.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Confirm button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;

            const gameName = document.getElementById("game-name-input").value.trim();
            const secretWordInput = document.getElementById("secret-word").value.trim().toUpperCase();
            const hintInputs = [
                document.getElementById("hint-1").value.trim().toUpperCase(),
                document.getElementById("hint-2").value.trim().toUpperCase(),
                document.getElementById("hint-3").value.trim().toUpperCase(),
                document.getElementById("hint-4").value.trim().toUpperCase(),
                document.getElementById("hint-5").value.trim().toUpperCase(),
            ].filter(hint => hint !== "");

            console.log("Form submitted", { gameName, secretWord: secretWordInput, hints: hintInputs });

            if (!gameName || !secretWordInput || hintInputs.length === 0) {
                console.error("Validation failed: missing required fields");
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Please fill in all required fields.";
                    formErrorDialog.style.display = "flex";
                }
                isUILocked = false;
                return;
            }

            try {
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        gameName,
                        secretWord: secretWordInput,
                        hints: hintInputs,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log("Form submission result:", result);

                if (result.status === "success") {
                    console.log("Game created successfully, reloading private games");
                    await loadPrivateGames();
                    resetScreenDisplays(gameSelectContent);
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

                    // Clear form inputs
                    document.getElementById("game-name-input").value = "";
                    document.getElementById("secret-word").value = "";
                    document.getElementById("hint-1").value = "";
                    document.getElementById("hint-2").value = "";
                    document.getElementById("hint-3").value = "";
                    document.getElementById("hint-4").value = "";
                    document.getElementById("hint-5").value = "";
                } else {
                    throw new Error(result.message || "Failed to create game");
                }
            } catch (error) {
                console.error("Error submitting form:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to create game. Please try again.";
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
            }
        });
    }

    // Guesses close button
    if (guessesCloseBtn) {
        guessesCloseBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses Close button triggered");
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

    // Adjust background
    function adjustBackground() {
        if (!gameScreen) return;
        let backgroundHeight = "calc(100% - 24vh)"; // Default: 100% minus keyboard (20vh) and ad box (4vh)
        if (gameScreen.classList.contains("game-select-active") || gameScreen.classList.contains("form-active")) {
            backgroundHeight = "100%"; // Full height when overlay is active
        }
        gameScreen.style.background = `url('${currentBackground}') no-repeat center top fixed, #FFFFFF`;
        gameScreen.style.backgroundSize = `100% ${backgroundHeight}`;
        gameScreen.style.backgroundAttachment = "fixed";
        console.log("Background adjusted:", { backgroundHeight, currentBackground });
    }

    // Load CSV data
    async function loadCSV(url) {
        return new Promise((resolve, reject) => {
            Papa.parse(url, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    console.log(`CSV loaded from ${url}:`, result.data);
                    resolve(result.data);
                },
                error: (error) => {
                    console.error(`Error loading CSV from ${url}:`, error);
                    reject(error);
                },
            });
        });
    }

    // Load official games
    async function loadOfficialGames() {
        try {
            allGames = await loadCSV(officialUrl);
            console.log("Official games loaded:", allGames);
            allGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
        } catch (error) {
            console.error("Failed to load official games:", error);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load official games.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Load private games
    async function loadPrivateGames() {
        try {
            privateGames = await loadCSV(privateUrl);
            console.log("Private games loaded:", privateGames);
            privateGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
        } catch (error) {
            console.error("Failed to load private games:", error);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load private games.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Load game
    function loadGame(game) {
        console.log("Loading game:", game);
        currentGameNumber = game["Game Name"] ? `${game["Game Number"]} - Private` : `Game #${game["Game Number"]}`;
        secretWord = game["Secret Word"]?.trim().toUpperCase();
        hints = [
            game["Hint 1"],
            game["Hint 2"],
            game["Hint 3"],
            game["Hint 4"],
            game["Hint 5"],
        ].filter(hint => hint && hint.trim() !== "").map(hint => hint.trim().toUpperCase());

        console.log("Game loaded", { currentGameNumber, secretWord, hints });

        if (!secretWord || hints.length === 0) {
            console.error("Invalid game data:", { secretWord, hints });
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Invalid game data.";
                formErrorDialog.style.display = "flex";
            }
            return;
        }

        hintIndex = 0;
        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) {
            hintsContainer.innerHTML = "";
            hintsContainer.classList.remove('lines-1', 'lines-2');
            hintsContainer.classList.add('lines-0');
        }

        const newGameNumberDisplay = document.getElementById("new-game-number-display");
        if (newGameNumberDisplay) {
            newGameNumberDisplay.textContent = currentGameNumber;
        }

        resetGame();
        revealHint();
        initializeCursor();
    }

    // Reveal hint
    function revealHint() {
        const hintsContainer = document.getElementById("hints-container");
        if (!hintsContainer || hintIndex >= hints.length) {
            console.log("No more hints to reveal or container missing", { hintIndex, hintsLength: hints.length });
            return;
        }

        const currentHint = hints[hintIndex];
        if (!currentHint) {
            console.warn("Current hint is undefined at index:", hintIndex);
            hintIndex++;
            return;
        }

        console.log("Revealing hint:", currentHint);
        const hintParts = currentHint.split("|").map(part => part.trim());
        const formattedHint = hintParts.join(' <span class="separator">/</span> ');

        hintsContainer.innerHTML = formattedHint;

        // Measure the number of lines
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.visibility = "hidden";
        tempDiv.style.width = getComputedStyle(hintsContainer).width;
        tempDiv.style.fontSize = getComputedStyle(hintsContainer).fontSize;
        tempDiv.style.lineHeight = getComputedStyle(hintsContainer).lineHeight;
        tempDiv.style.fontFamily = getComputedStyle(hintsContainer).fontFamily;
        tempDiv.style.padding = getComputedStyle(hintsContainer).padding;
        tempDiv.style.whiteSpace = "normal";
        tempDiv.style.wordBreak = "break-word";
        tempDiv.innerHTML = formattedHint;
        document.body.appendChild(tempDiv);

        const lineHeight = parseFloat(getComputedStyle(hintsContainer).lineHeight);
        const containerHeight = tempDiv.offsetHeight;
        const lines = Math.round(containerHeight / lineHeight);

        document.body.removeChild(tempDiv);

        console.log("Hint lines calculated:", { containerHeight, lineHeight, lines });

        // Update hint container classes based on the number of lines
        hintsContainer.classList.remove('lines-0', 'lines-1', 'lines-2');
        if (lines <= 1) {
            hintsContainer.classList.add('lines-1');
        } else {
            hintsContainer.classList.add('lines-2');
        }

        lastHintLines = lines;
        console.log("Hint displayed, lines:", lines);

        hintIndex++;
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
            incorrectGuessCount++; // Increment incorrect guess count
            console.log("Incorrect guess count:", incorrectGuessCount);

            // Update pineapple icons
            if (incorrectGuessCount <= pineappleLives.length) {
                pineappleLives[incorrectGuessCount - 1].classList.add("lost");
            }

            // Check if the player has lost
            if (incorrectGuessCount >= 5) {
                console.log("Five incorrect guesses, player loses!");
                let normalizedGameNumber;
                let gameType;
                if (currentGameNumber.includes("- Private")) {
                    normalizedGameNumber = currentGameNumber.split(" - ")[0];
                    gameType = "privatePineapple";
                } else {
                    normalizedGameNumber = currentGameNumber.replace("Game #", "");
                    gameType = "pineapple";
                }
                saveGameResult(gameType, normalizedGameNumber, secretWord, "X"); // "X" indicates a loss
                endGame(false); // End game with loss
                return;
            }

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

    // Reset game
    function resetGame() {
        console.log("Resetting game state");
        gameOver = false;
        secretWord = "";
        hints = [];
        hintIndex = 0;
        lastHintLines = 0; // Reset hint lines
        firstGuessMade = false;
        guessCount = 0;
        incorrectGuessCount = 0; // Reset incorrect guess count
        gaveUp = false;
        guesses = [];
        isProcessingGuess = false;
        // Reset pineapple icons
        pineappleLives.forEach(icon => icon.classList.remove("lost"));
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
        if (guessesLink) guessesLink.textContent = "Guesses: 0";
        if (guessInputContainer) {
            guessInputContainer.classList.remove("game-ended", "wrong-guess");
            guessInputContainer.style.background = "rgba(255, 255, 255, 0.85)"; // Reset to default
        }
        if (gameScreen) {
            gameScreen.classList.remove("game-ended"); // Remove fade overlay
        }
        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) {
            hintsContainer.innerHTML = "";
            hintsContainer.style.display = "block";
            hintsContainer.classList.remove('lines-1', 'lines-2');
            hintsContainer.classList.add('lines-0');
            console.log("Hints container reset");
        }
        // Restore Hints label visibility
        const hintsLabel = document.getElementById("hints-label");
        if (hintsLabel) {
            hintsLabel.style.visibility = "visible";
            console.log("Hints label restored");
        }
        document.getElementById("game-over").style.display = "none";
        document.getElementById("main-content").style.display = "flex";
        showKeyboard();
        setupKeyboardListeners();
    }

    // End game
    function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp });
        gameOver = true;
        if (guessInput) guessInput.disabled = true;
        if (guessBtn) guessBtn.disabled = true;
        if (gameScreen) gameScreen.classList.add("game-ended");

        const gameOverElement = document.getElementById("game-over");
        const gameNumberDisplay = document.getElementById("game-number-display");
        const shareText = document.getElementById("share-text");
        const shareButtons = document.getElementById("share-buttons");

        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }

        let resultText = `${currentGameNumber}\n`;
        if (won) {
            resultText += `I got it in <span class="guess-count">${guessCount}</span> guess${guessCount !== 1 ? "es" : ""}! 🍍\n`;
            guessInputContainer.classList.add("game-ended");
            triggerPineappleRain();
        } else if (gaveUp) {
            resultText += `I gave up after ${guessCount} guess${guessCount !== 1 ? "es" : ""}. The word was ${secretWord}. 😢\n`;
        } else {
            resultText += `I failed after ${guessCount} guess${guessCount !== 1 ? "es" : ""}. The word was ${secretWord}. 😢\n`;
        }

        const hintsText = hints.map((hint, index) => {
            const hintParts = hint.split("|").map(part => part.trim());
            return `Hint ${index + 1}: ${hintParts.join(" / ")}`;
        }).join("\n");

        resultText += hintsText;

        if (shareText) {
            shareText.innerHTML = resultText;
        }

        const shareMessage = encodeURIComponent(resultText.replace(/<span class="guess-count">(\d+)<\/span>/g, "$1"));
        const shareUrl = encodeURIComponent(window.location.href);

        if (shareButtons) {
            const whatsappLink = document.getElementById("share-whatsapp");
            const telegramLink = document.getElementById("share-telegram");
            const twitterLink = document.getElementById("share-twitter");
            const instagramLink = document.getElementById("share-instagram");

            if (whatsappLink) {
                whatsappLink.href = `https://api.whatsapp.com/send?text=${shareMessage}%0A${shareUrl}`;
            }
            if (telegramLink) {
                telegramLink.href = `https://t.me/share/url?url=${shareUrl}&text=${shareMessage}`;
            }
            if (twitterLink) {
                twitterLink.href = `https://twitter.com/intent/tweet?text=${shareMessage}&url=${shareUrl}`;
            }
            if (instagramLink) {
                instagramLink.href = `https://www.instagram.com/`;
                instagramLink.addEventListener("click", (e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(`${resultText.replace(/<span class="guess-count">(\d+)<\/span>/g, "$1")}\n${window.location.href}`)
                        .then(() => {
                            alert("Result copied to clipboard! Paste it into your Instagram post.");
                            window.open("https://www.instagram.com/", "_blank");
                        })
                        .catch(err => {
                            console.error("Failed to copy text:", err);
                            alert("Failed to copy result. Please copy it manually.");
                        });
                });
            }
        }

        if (gameOverElement) {
            resetScreenDisplays(gameOverElement);
            gameOverElement.style.display = "flex";
            if (isMobile) {
                keyboardContainer.classList.add("show-game-over");
                keyboardContent.style.display = "none";
                keyboardGuessesContent.style.display = "none";
                keyboardGiveUpContent.style.display = "none";
                keyboardBackBtn.style.display = "none";
            }
        }

        const hintsLabel = document.getElementById("hints-label");
        if (hintsLabel) {
            hintsLabel.style.visibility = "hidden";
        }

        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) {
            hintsContainer.style.display = "none";
        }

        console.log("Game over UI updated");
    }

    // Trigger pineapple rain
    function triggerPineappleRain() {
        console.log("Triggering pineapple rain");
        const rainContainer = document.createElement("div");
        rainContainer.classList.add("pineapple-rain");
        document.body.appendChild(rainContainer);

        const numberOfPineapples = 20;
        for (let i = 0; i < numberOfPineapples; i++) {
            const pineapple = document.createElement("span");
            pineapple.classList.add("pineapple-piece");
            pineapple.textContent = "🍍";
            pineapple.style.left = `${Math.random() * 100}vw`;
            pineapple.style.fontSize = `${1.5 + Math.random() * 1.5}vh`;
            pineapple.style.setProperty('--rotation', `${Math.random() * 360}deg`);
            pineapple.style.setProperty('--drift', `${(Math.random() - 0.5) * 20}`);
            pineapple.style.animationDuration = `${3 + Math.random() * 2}s`;
            pineapple.style.animationDelay = `${Math.random() * 2}s`;
            rainContainer.appendChild(pineapple);
        }

        setTimeout(() => {
            rainContainer.remove();
            console.log("Pineapple rain ended");
        }, 7000);
    }

    // Save game result
    function saveGameResult(gameType, gameNumber, secretWord, guesses) {
        console.log("Saving game result", { gameType, gameNumber, secretWord, guesses });
        const result = {
            gameType,
            gameNumber,
            secretWord,
            guesses: String(guesses),
            timestamp: new Date().toISOString(),
        };

        let gameResults = JSON.parse(localStorage.getItem("gameResults") || "[]");
        gameResults = gameResults.filter(r => !(r.gameType === gameType && r.gameNumber === gameNumber));
        gameResults.push(result);
        localStorage.setItem("gameResults", JSON.stringify(gameResults));
        console.log("Game result saved:", result);
    }

    // Get game result
    function getGameResult(gameType, gameNumber) {
        const gameResults = JSON.parse(localStorage.getItem("gameResults") || "[]");
        const result = gameResults.find(r => r.gameType === gameType && r.gameNumber === gameNumber);
        console.log("Retrieved game result:", { gameType, gameNumber, result });
        return result;
    }

    // Display game list
    function displayGameList() {
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");

        if (officialList) {
            officialList.innerHTML = "";
            allGames.forEach((game, index) => {
                const gameNumber = game["Game Number"];
                const secretWord = game["Secret Word"]?.trim().toUpperCase() || "Unknown";
                const result = getGameResult("pineapple", gameNumber);
                const guesses = result ? result.guesses : "-";

                let guessClass = "";
                if (guesses === "-") {
                    guessClass = "yellow";
                } else if (guesses === "Gave Up" || guesses === "X") {
                    guessClass = "red";
                } else {
                    const guessNum = parseInt(guesses);
                    if (guessNum <= 3) guessClass = "green";
                    else if (guessNum <= 5) guessClass = "yellow";
                    else if (guessNum <= 7) guessClass = "orange";
                    else if (guessNum <= 9) guessClass = "pink";
                    else guessClass = "red";
                }

                const row = document.createElement("div");
                row.classList.add("game-list-row");
                row.innerHTML = `
                    <span>Game #${gameNumber}</span>
                    <span>${result ? secretWord : "-"}</span>
                    <span class="${guessClass}">${guesses === "X" ? "X" : guesses === "Gave Up" ? "Gave Up" : guesses}</span>
                `;
                row.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Official game row clicked", { gameNumber, index });
                    if (isUILocked || isLoadingGame) {
                        console.log("Row click ignored: UI locked or game loading");
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
                        showKeyboard();
                        updateArrowStates(index, allGames);
                    } catch (error) {
                        console.error("Error loading game:", error.message);
                        if (formErrorDialog && formErrorMessage) {
                            formErrorMessage.textContent = "Failed to load game.";
                            formErrorDialog.style.display = "flex";
                        }
                    } finally {
                        isUILocked = false;
                        isLoadingGame = false;
                    }
                });
                officialList.appendChild(row);
            });
        }

        if (privateList) {
            privateList.innerHTML = "";
            privateGames.forEach((game, index) => {
                const gameNumber = game["Game Number"];
                const gameName = game["Game Name"] || "Unnamed";
                const secretWord = game["Secret Word"]?.trim().toUpperCase() || "Unknown";
                const result = getGameResult("privatePineapple", gameNumber);
                const guesses = result ? result.guesses : "-";

                let guessClass = "";
                if (guesses === "-") {
                    guessClass = "yellow";
                } else if (guesses === "Gave Up" || guesses === "X") {
                    guessClass = "red";
                } else {
                    const guessNum = parseInt(guesses);
                    if (guessNum <= 3) guessClass = "green";
                    else if (guessNum <= 5) guessClass = "yellow";
                    else if (guessNum <= 7) guessClass = "orange";
                    else if (guessNum <= 9) guessClass = "pink";
                    else guessClass = "red";
                }

                const row = document.createElement("div");
                row.classList.add("game-list-row");
                row.innerHTML = `
                    <span>${gameName}</span>
                    <span>${result ? secretWord : "-"}</span>
                    <span class="${guessClass}">${guesses === "X" ? "X" : guesses === "Gave Up" ? "Gave Up" : guesses}</span>
                `;
                row.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Private game row clicked", { gameNumber, index });
                    if (isUILocked || isLoadingGame) {
                        console.log("Row click ignored: UI locked or game loading");
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
                        showKeyboard();
                        updateArrowStates(index, privateGames);
                    } catch (error) {
                        console.error("Error loading game:", error.message);
                        if (formErrorDialog && formErrorMessage) {
                            formErrorMessage.textContent = "Failed to load game.";
                            formErrorDialog.style.display = "flex";
                        }
                    } finally {
                        isUILocked = false;
                        isLoadingGame = false;
                    }
                });
                privateList.appendChild(row);
            });
        }
    }

    // Show game select screen
    async function showGameSelectScreen() {
        console.log("Showing game select screen");
        await loadOfficialGames();
        await loadPrivateGames();
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
        if (isMobile) showKeyboard();
    }

    // Initialize the game
    async function initializeGame() {
        console.log("Initializing game");
        await loadOfficialGames();
        if (allGames.length > 0) {
            currentBackground = allGames[0]["Background"] && allGames[0]["Background"].trim() !== "" ? allGames[0]["Background"] : defaultBackground;
            await preloadBackground(currentBackground);
            loadGame(allGames[0]);
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            adjustBackground();
            updateArrowStates(0, allGames);
        } else {
            console.error("No official games available to load");
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "No games available.";
                formErrorDialog.style.display = "flex";
            }
        }
        if (isMobile) showKeyboard();
    }

    // Start the game
    initializeCursor();
    initializeGame();
});