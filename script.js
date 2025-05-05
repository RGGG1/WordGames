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
    const gameOverScreen = document.getElementById("game-over");
    const gameSelectScreen = document.getElementById("game-select-screen");
    const homeBtn = document.getElementById("home-btn");
    const createPineappleBtn = document.getElementById("create-pineapple");
    const createForm = document.getElementById("create-form");
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
                        resolve(defaultBackground);
                    };
                } else {
                    console.error(`Default background also failed: ${defaultBackground}`);
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
        keyboardContainer.classList.remove("show-alternate", "show-guesses", "show-give-up");
        keyboardContainer.style.display = "flex";
        keyboardContent.style.display = "flex";
        keyboardGuessesContent.style.display = "none";
        keyboardGiveUpContent.style.display = "none";
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
        const screens = [gameScreen, gameOverScreen, gameSelectScreen, createForm, formErrorDialog, guessesScreen, giveUpDialog];
        screens.forEach(screen => {
            if (screen && screen !== activeScreen) {
                screen.style.display = "none";
            }
        });
        if (keyboardContainer) {
            if (activeScreen === gameScreen && isMobile) {
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
            if (createForm) createForm.style.display = "none";
            if (keyboardContainer) keyboardContainer.style.display = "none";
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
            if (createForm) createForm.style.display = "none";
            if (keyboardContainer) keyboardContainer.style.display = "none";
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
                        ? guesses.join(' <span class="separator yellow">| </span>')
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
                    ? guesses.join(' <span class="separator yellow">| </span>')
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
            resetScreenDisplays(gameSelectScreen);
            gameSelectScreen.style.display = "flex";
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            officialContent.style.display = "flex";
            privateContent.classList.remove("active");
            privateContent.style.display = "none";
            if (createForm) createForm.style.display = "none";
            displayGameList();
            adjustBackground();
            setupKeyboardListeners();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Create a Wordy button
    if (createPineappleBtn && createForm) {
        createPineappleBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create a Wordy triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            resetScreenDisplays(createForm);
            createForm.style.display = "flex";
            activeInput = document.getElementById("game-name-input");
            if (activeInput && !isMobile) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
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
            resetScreenDisplays(gameSelectScreen);
            gameSelectScreen.style.display = "flex";
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            privateContent.style.display = "flex";
            officialContent.classList.remove("active");
            officialContent.style.display = "none";
            if (createForm) createForm.style.display = "none";
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
            console.log("Next Game button on end screen triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            resetScreenDisplays(gameSelectScreen);
            gameSelectScreen.style.display = "flex";
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            officialContent.style.display = "flex";
            privateContent.classList.remove("active");
            privateContent.style.display = "none";
            if (createForm) createForm.style.display = "none";
            displayGameList();
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
                createForm.style.display = "none";
                resetScreenDisplays(gameSelectScreen);
                gameSelectScreen.style.display = "flex";
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
            resetScreenDisplays(gameSelectScreen);
            gameSelectScreen.style.display = "flex";
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            privateContent.style.display = "flex";
            officialContent.classList.remove("active");
            officialContent.style.display = "none";
            createForm.style.display = "none";
            displayGameList();
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

    // Hamburger button
    if (hamburgerBtn) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Hamburger button triggered");
            const menu = document.getElementById("hamburger-menu");
            if (menu) {
                menu.style.display = menu.style.display === "flex" ? "none" : "flex";
                console.log("Hamburger menu toggled:", menu.style.display);
            }
        };
        hamburgerBtn.addEventListener("click", handler);
        hamburgerBtn.addEventListener("touchstart", handler);
    }

    // Adjust background
    function adjustBackground() {
        const screens = [gameScreen, gameOverScreen, gameSelectScreen, createForm];
        screens.forEach(screen => {
            if (screen && screen.style.display !== "none") {
                screen.style.background = `url('${currentBackground}') no-repeat center top fixed, #FFFFFF`;
                screen.style.backgroundSize = `100% calc(100% - ${isMobile ? "32vh" : "20vh"})`; // Adjusted for new layout: 25vh keyboard + 5vh ad box + 2vh space
                screen.style.backgroundAttachment = "fixed";
                console.log(`Adjusted background for ${screen.id}: ${currentBackground}`);
            }
        });
    }

    // End game
    function endGame(won = false, gaveUp = false) {
        console.log("Ending game", { won, gaveUp });
        gameOver = true;
        if (guessInput) guessInput.disabled = true;
        if (guessBtn) guessBtn.disabled = true;
        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) hintsContainer.style.display = "none";
        resetScreenDisplays(gameOverScreen);
        gameOverScreen.style.display = "flex";
        adjustBackground();
        const hardLuckLabel = document.getElementById("hard-luck-label");
        const wellDoneLabel = document.getElementById("well-done-label");
        const todaysWordLabel = document.getElementById("todays-word-label");
        const todaysWord = document.getElementById("todays-word");
        if (hardLuckLabel) hardLuckLabel.style.display = won ? "none" : "block";
        if (wellDoneLabel) wellDoneLabel.style.display = won ? "block" : "none";
        if (todaysWordLabel) todaysWordLabel.style.display = "block";
        if (todaysWord) {
            todaysWord.textContent = secretWord.toUpperCase();
            todaysWord.style.display = "block";
        }
        if (won && !isMobile) {
            triggerPineappleRain();
        }
        setupShareSection(won, gaveUp);
        if (keyboardContainer) keyboardContainer.style.display = "none";
    }

    // Trigger pineapple rain
    function triggerPineappleRain() {
        console.log("Triggering pineapple rain");
        const container = document.createElement("div");
        container.className = "pineapple-rain";
        document.body.appendChild(container);
        const count = 20;
        for (let i = 0; i < count; i++) {
            const piece = document.createElement("span");
            piece.className = "pineapple-piece";
            piece.textContent = "🍍";
            piece.style.fontSize = `${Math.random() * 2 + 1}vh`;
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.animationDuration = `${Math.random() * 3 + 2}s`;
            piece.style.setProperty("--rotation", `${Math.random() * 360 - 180}deg`);
            piece.style.setProperty("--drift", `${Math.random() * 20 - 10}`);
            container.appendChild(piece);
        }
        setTimeout(() => {
            container.remove();
            console.log("Pineapple rain animation completed");
        }, 5000);
    }

    // Setup share section
    function setupShareSection(won, gaveUp) {
        console.log("Setting up share section", { won, gaveUp, guessCount });
        const shareText = document.getElementById("share-text");
        const shareButtons = document.getElementById("share-buttons");
        if (!shareText || !shareButtons) {
            console.error("Share section elements not found");
            return;
        }
        let message;
        if (won) {
            message = `I guessed the secret word in Wordy ${currentGameNumber} in ${guessCount} ${guessCount === 1 ? "guess" : "guesses"}!\n\nPlay at: bigbraingames.online`;
        } else if (gaveUp) {
            message = `I gave up on Wordy ${currentGameNumber}.\nThe word was ${secretWord.toUpperCase()}.\n\nPlay at: bigbraingames.online`;
        } else {
            message = `I couldn't guess the secret word in Wordy ${currentGameNumber}.\nThe word was ${secretWord.toUpperCase()}.\n\nPlay at: bigbraingames.online`;
        }
        shareText.textContent = message;
        const encodedMessage = encodeURIComponent(message);
        const shareLinks = {
            whatsapp: `https://api.whatsapp.com/send?text=${encodedMessage}`,
            telegram: `https://t.me/share/url?url=bigbraingames.online&text=${encodedMessage}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
            instagram: `https://www.instagram.com/?url=bigbraingames.online`
        };
        ["whatsapp", "telegram", "twitter", "instagram"].forEach(platform => {
            const link = document.getElementById(`share-${platform}`);
            if (link) {
                link.href = shareLinks[platform];
                console.log(`Set share link for ${platform}: ${link.href}`);
            }
        });
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select screen");
        resetScreenDisplays(gameSelectScreen);
        gameSelectScreen.style.display = "flex";
        officialTab.classList.add("active");
        privateTab.classList.remove("active");
        officialContent.classList.add("active");
        officialContent.style.display = "flex";
        privateContent.classList.remove("active");
        privateContent.style.display = "none";
        if (createForm) createForm.style.display = "none";
        displayGameList();
        adjustBackground();
        setupKeyboardListeners();
    }

    // Display game list
    function displayGameList() {
        console.log("Displaying game list", { allGamesLength: allGames.length, privateGamesLength: privateGames.length });
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");
        if (!officialList || !privateList) {
            console.error("Game list elements not found");
            return;
        }

        // Official games
        officialList.innerHTML = "";
        allGames.forEach(game => {
            const row = document.createElement("div");
            row.className = "game-list-row";
            const gameNumber = document.createElement("span");
            gameNumber.textContent = game["Game Number"];
            const word = document.createElement("span");
            word.textContent = game["Result"] ? game["Secret Word"].toUpperCase() : "-";
            const guesses = document.createElement("span");
            guesses.textContent = game["Result"] ? game["Result"] : "-";
            if (game["Result"] === "Won") {
                guesses.className = "green";
            } else if (game["Result"] === "Gave Up") {
                guesses.className = "red";
            }
            row.appendChild(gameNumber);
            row.appendChild(word);
            row.appendChild(guesses);
            row.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Official game selected", game["Game Number"]);
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
                    adjustBackground();
                    showKeyboard();
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
            });
            officialList.appendChild(row);
        });

        // Private games
        privateList.innerHTML = "";
        privateGames.forEach(game => {
            const row = document.createElement("div");
            row.className = "game-list-row";
            const gameName = document.createElement("span");
            gameName.textContent = game["Game Name"] || game["Game Number"];
            const word = document.createElement("span");
            word.textContent = game["Result"] ? game["Secret Word"].toUpperCase() : "-";
            const guesses = document.createElement("span");
            guesses.textContent = game["Result"] ? game["Result"] : "-";
            if (game["Result"] === "Won") {
                guesses.className = "green";
            } else if (game["Result"] === "Gave Up") {
                guesses.className = "red";
            }
            row.appendChild(gameName);
            row.appendChild(word);
            row.appendChild(guesses);
            row.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Private game selected", game["Game Number"]);
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
                    adjustBackground();
                    showKeyboard();
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
            });
            privateList.appendChild(row);
        });
    }

    // Save game result
    function saveGameResult(gameType, gameNumber, secretWord, result) {
        console.log("Saving game result", { gameType, gameNumber, secretWord, result });
        let gameList = gameType === "pineapple" ? allGames : privateGames;
        const game = gameList.find(g => g["Game Number"] === gameNumber);
        if (game) {
            game["Result"] = result;
            game["Secret Word"] = secretWord;
            console.log("Game result updated", game);
        } else {
            console.warn("Game not found for saving result", { gameType, gameNumber });
        }
    }

    // Reset game
    function resetGame() {
        console.log("Resetting game state");
        gameOver = false;
        secretWord = "";
        hints = [];
        hintIndex = 0;
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
        if (guessesLink) guessesLink.textContent = "Guesses: 0/5";
        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) {
            hintsContainer.innerHTML = "";
            hintsContainer.style.display = "block";
            hintsContainer.classList.add('lines-0');
        }
        showKeyboard();
        setupKeyboardListeners();
    }

    // Load game
    function loadGame(game) {
        console.log("Loading game", game);
        resetGame();
        currentGameNumber = game["Game Name"] ? `${game["Game Number"]} - Private` : `Game #${game["Game Number"]}`;
        secretWord = game["Secret Word"] ? game["Secret Word"].toUpperCase() : "";
        hints = [
            game["Hint 1"] || "",
            game["Hint 2"] || "",
            game["Hint 3"] || "",
            game["Hint 4"] || "",
            game["Hint 5"] || ""
        ].filter(hint => hint).map(hint => hint.toUpperCase());
        hintIndex = 0;
        firstGuessMade = !!game["Result"];
        guessCount = 0;
        guesses = [];
        const newGameNumberDisplay = document.getElementById("new-game-number-display");
        if (newGameNumberDisplay) {
            newGameNumberDisplay.textContent = currentGameNumber;
        }
        const gameNumberDisplay = document.getElementById("game-number-display");
        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }
        if (guessesLink) guessesLink.textContent = "Guesses: 0/5";
        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) {
            hintsContainer.innerHTML = "";
            hintsContainer.classList.remove('lines-0', 'lines-1', 'lines-2');
            hintsContainer.classList.add('lines-0');
        }
        if (game["Result"]) {
            console.log("Game already played", game["Result"]);
            if (game["Result"] === "Won") {
                guessCount = parseInt(game["Guess Count"]) || 0;
                guesses = game["Guesses"] ? game["Guesses"].split(",").map(g => g.trim().toUpperCase()) : [];
                if (guessesLink) guessesLink.textContent = `Guesses: ${guessCount}/5`;
                if (hintsContainer) {
                    hintsContainer.innerHTML = hints.slice(0, guessCount).join(' <span class="separator yellow">| </span>');
                    updateHintLines(hintsContainer, hints.slice(0, guessCount).join(' | '));
                }
            } else if (game["Result"] === "Gave Up") {
                gaveUp = true;
                endGame(false, true);
                return;
            }
        }
        let gameList = game["Game Name"] ? privateGames : allGames;
        let currentIndex = gameList.findIndex(g => g["Game Number"] === game["Game Number"]);
        updateArrowStates(currentIndex, gameList);
        if (guessInput && !isMobile) {
            guessInput.focus();
            activeInput = guessInput;
        }
        console.log("Game loaded", { currentGameNumber, secretWord, hints });
    }

    // Update hint lines
    function updateHintLines(hintsContainer, text) {
        if (!hintsContainer) {
            console.error("hints-container not found");
            return;
        }
        hintsContainer.classList.remove('lines-0', 'lines-1', 'lines-2');
        const computedStyle = window.getComputedStyle(hintsContainer);
        const lineHeight = parseFloat(computedStyle.lineHeight);
        const maxWidth = parseFloat(computedStyle.maxWidth);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = computedStyle.font;
        const textWidth = context.measureText(text).width;
        const lines = Math.ceil(textWidth / maxWidth);
        console.log("Updating hint lines", { text, textWidth, maxWidth, lines });
        hintsContainer.classList.add(`lines-${Math.min(lines, 2)}`);
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
            guessesLink.textContent = `Guesses: ${guessCount}/5`;
        }

        const hintsContainer = document.getElementById("hints-container");
        if (!firstGuessMade) {
            firstGuessMade = true;
            if (hintsContainer) {
                hintsContainer.innerHTML = hints[0];
                updateHintLines(hintsContainer, hints[0]);
            }
            hintIndex = 1;
        } else if (hintIndex < hints.length) {
            if (hintsContainer) {
                hintsContainer.innerHTML = hints.slice(0, hintIndex + 1).join(' <span class="separator yellow">| </span>');
                updateHintLines(hintsContainer, hints.slice(0, hintIndex + 1).join(' | '));
            }
            hintIndex++;
        }

        if (guess.toUpperCase() === secretWord.toUpperCase()) {
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
            saveGameResult(gameType, normalizedGameNumber, secretWord, "Won", guessCount, guesses.join(","));
            endGame(true);
            isProcessingGuess = false;
            return;
        }

        if (guessCount >= 5) {
            console.log("Maximum guesses reached");
            let normalizedGameNumber;
            let gameType;
            if (currentGameNumber.includes("- Private")) {
                normalizedGameNumber = currentGameNumber.split(" - ")[0];
                gameType = "privatePineapple";
            } else {
                normalizedGameNumber = currentGameNumber.replace("Game #", "");
                gameType = "pineapple";
            }
            saveGameResult(gameType, normalizedGameNumber, secretWord, "Lost");
            endGame(false);
            isProcessingGuess = false;
            return;
        }

        console.log("Incorrect guess, showing animation");
        guessInputContainer.classList.add("wrong-guess");
        guessInput.style.opacity = "0";
        guessInput.style.visibility = "hidden";
        animationTimeout = setTimeout(() => {
            guessInputContainer.classList.remove("wrong-guess");
            guessInput.style.opacity = "1";
            guessInput.style.visibility = "visible";
            guessInput.style.color = "#000000";
            guessInput.value = "";
            isProcessingGuess = false;
            console.log("Animation completed, state reset");
            if (!isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
            guessInput.dispatchEvent(new Event("guessProcessed"));
        }, 350);
    }

    // Fetch official games
    async function fetchOfficialGames() {
        console.log("Fetching official games from:", officialUrl);
        try {
            const response = await fetch(officialUrl);
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                complete: (result) => {
                    allGames = result.data.filter(row => row["Game Number"] && row["Secret Word"]);
                    allGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
                    console.log("Official games fetched", allGames.length);
                },
                error: (error) => {
                    console.error("Papa Parse error:", error);
                    throw new Error("Failed to parse official games CSV");
                }
            });
        } catch (error) {
            console.error("Error fetching official games:", error);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load official games.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Fetch private games
    async function fetchPrivateGames() {
        console.log("Fetching private games from:", privateUrl);
        try {
            const response = await fetch(privateUrl);
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                complete: (result) => {
                    privateGames = result.data.filter(row => row["Game Number"] && row["Secret Word"]);
                    privateGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
                    console.log("Private games fetched", privateGames.length);
                },
                error: (error) => {
                    console.error("Papa Parse error:", error);
                    throw new Error("Failed to parse private games CSV");
                }
            });
        } catch (error) {
            console.error("Error fetching private games:", error);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load private games.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Initialize game
    async function initializeGame() {
        console.log("Initializing game");
        try {
            await Promise.all([fetchOfficialGames(), fetchPrivateGames()]);
            if (allGames.length === 0) {
                console.warn("No official games available");
                resetScreenDisplays(gameSelectScreen);
                gameSelectScreen.style.display = "flex";
                adjustBackground();
                displayGameList();
                return;
            }
            const latestGame = allGames[0];
            console.log("Loading latest game", latestGame);
            currentBackground = latestGame["Background"] && latestGame["Background"].trim() !== "" ? latestGame["Background"] : defaultBackground;
            await preloadBackground(currentBackground);
            loadGame(latestGame);
            resetScreenDisplays(gameScreen);
            gameScreen.style.display = "flex";
            adjustBackground();
            initializeCursor();
            showKeyboard();
            setupKeyboardListeners();
        } catch (error) {
            console.error("Initialization error:", error);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to initialize game.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Start the game
    initializeGame();
});