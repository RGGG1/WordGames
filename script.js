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
    let completedGames = JSON.parse(localStorage.getItem("completedGames")) || {};

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
    const keyboardGiveUpYesBtn = document.getElementById("keyboard-give-up-yes-btn");
    const keyboardGiveUpNoBtn = document.getElementById("keyboard-give-up-no-btn");
    // NEW: Added keyboardEndContent
    const keyboardEndContent = document.getElementById("keyboard-end-content");

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
                guessInputContainer.classList.remove("wrong-guess", "correct-guess");
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
            console.log("Form input focused:", input.id);
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
    // UPDATED: Reset fade effect and handle end content
    function showKeyboard() {
        if (!isMobile || !keyboardContainer || !keyboardContent || !keyboardGuessesContent || !keyboardGiveUpContent || !keyboardBackBtn) {
            console.log("Skipping showKeyboard: not mobile or elements missing");
            return;
        }
        console.log("Showing keyboard");
        keyboardContainer.classList.remove("show-alternate", "show-guesses", "show-give-up", "show-end");
        keyboardContainer.style.display = "flex";
        keyboardContent.style.display = "flex";
        keyboardGuessesContent.style.display = "none";
        keyboardGiveUpContent.style.display = "none";
        if (keyboardEndContent) keyboardEndContent.style.display = "none";
        keyboardBackBtn.style.display = "none";
        // Remove game-ended class to reset fade effect
        gameScreen.classList.remove("game-ended");
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
                console.log(`Hiding screen: ${screen.id}`);
            }
        });
        if (keyboardContainer) {
            if (activeScreen === gameScreen && isMobile) {
                showKeyboard();
                keyboardContainer.style.display = "flex";
                console.log("Showing keyboard for game screen");
            } else {
                keyboardContainer.style.display = "none";
                console.log("Hiding keyboard");
            }
        }
        if (activeScreen) {
            activeScreen.style.display = "none";
            activeScreen.offsetHeight; // Trigger reflow
            activeScreen.style.display = "flex";
            console.log(`Showing active screen: ${activeScreen.id}`);
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
        if (isMobile) {
            allGamesLink.addEventListener("click", handler); // Fallback for mobile
        }
        console.log("All Games link event listener attached", { event: isMobile ? "touchstart" : "click" });
    }

    // Give Up link
    if (giveUpLink && giveUpYesBtn && giveUpNoBtn && keyboardGiveUpYesBtn && keyboardGiveUpNoBtn) {
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

        const giveUpYesHandler = debounce((e) => {
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
            let gameResults = JSON.parse(localStorage.getItem("gameResults")) || {};
            let gameKey = currentGameNumber.includes("- Private") ? `${currentGameNumber}` : `Game #${normalizedGameNumber}`;
            gameResults[gameKey] = gameResults[gameKey] || { guesses: "-" };
            gameResults[gameKey].guesses = "Gave up";
            localStorage.setItem("gameResults", JSON.stringify(gameResults));
            saveGameResult(gameType, normalizedGameNumber, secretWord, "Gave Up");
            completedGames[currentGameNumber] = true;
            localStorage.setItem("completedGames", JSON.stringify(completedGames));
            if (isMobile) {
                showKeyboard();
            } else {
                if (giveUpDialog) giveUpDialog.style.display = "none";
            }
            endGame(false, true);
        }, 100);

        giveUpYesBtn.addEventListener("click", giveUpYesHandler);
        giveUpYesBtn.addEventListener("touchstart", giveUpYesHandler);
        keyboardGiveUpYesBtn.addEventListener("click", giveUpYesHandler);
        keyboardGiveUpYesBtn.addEventListener("touchstart", giveUpYesHandler);

        const giveUpNoHandler = debounce((e) => {
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
        }, 100);

        giveUpNoBtn.addEventListener("click", giveUpNoHandler);
        giveUpNoBtn.addEventListener("touchstart", giveUpNoHandler);
        keyboardGiveUpNoBtn.addEventListener("click", giveUpNoHandler);
        keyboardGiveUpNoBtn.addEventListener("touchstart", giveUpNoHandler);
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
            console.log("Previous game arrow triggered", { isUILocked, isLoadingGame, currentGameNumber });
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
                    const gameNum = currentGameNumber.replace("Game #", "");
                    currentIndex = allGames.findIndex(game => game["Game Number"] === gameNum);
                    gameList = allGames;
                }
                console.log("Navigation details", { isPrivate, currentIndex, gameListLength: gameList.length, gameNum: currentGameNumber });
                if (currentIndex === -1) {
                    console.error("Game not found in list", { currentGameNumber, gameNumbers: gameList.map(g => g["Game Number"]) });
                    throw new Error(`Current game not found in game list: ${currentGameNumber}`);
                }
                if (currentIndex < gameList.length - 1) {
                    const targetGame = gameList[currentIndex + 1];
                    console.log("Loading previous game", { currentIndex, targetIndex: currentIndex + 1, targetGame });
                    if (!targetGame || !targetGame["Game Number"]) {
                        console.error("Invalid target game data", { targetGame });
                        throw new Error("Invalid game data for previous game");
                    }
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
                    formErrorMessage.textContent = "Failed to load previous game. Please try another game.";
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
        console.log("Updating arrow states", { currentIndex, gameListLength: gameList.length });
        if (prevGameArrow) {
            if (currentIndex < gameList.length - 1) {
                prevGameArrow.classList.remove("disabled");
                prevGameArrow.style.opacity = "1";
            } else {
                prevGameArrow.classList.add("disabled");
                prevGameArrow.style.opacity = "0.5";
            }
        }
        if (nextGameArrow) {
            if (currentIndex > 0) {
                nextGameArrow.classList.remove("disabled");
                nextGameArrow.style.opacity = "1";
            } else {
                nextGameArrow.classList.add("disabled");
                nextGameArrow.style.opacity = "0.5";
            }
        }
    }

    // Guesses close button
    if (guessesCloseBtn) {
        const handler = (e) => {
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
        };
        guessesCloseBtn.addEventListener("click", handler);
        guessesCloseBtn.addEventListener("touchstart", handler);
    }

    // Form error dialog OK button
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form error dialog OK button clicked");
            formErrorDialog.style.display = "none";
            if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        });
    }

    // Adjust background
    function adjustBackground() {
        console.log("Adjusting background for screen:", gameScreen.style.display);
        const screens = [gameScreen, gameOverScreen, gameSelectScreen, createForm];
        screens.forEach(screen => {
            if (screen && screen.style.display !== "none") {
                screen.style.background = `url('${currentBackground}') no-repeat center top fixed, #FFFFFF`;
                if (screen === gameScreen) {
                    screen.style.backgroundSize = `100% calc(100% - 28.25vh)`; // Adjusted for 21.25vh keyboard + 5vh ad-box + 2vh space
                } else {
                    screen.style.backgroundSize = "cover";
                }
                screen.style.backgroundAttachment = "fixed";
                console.log(`Background adjusted for ${screen.id}:`, screen.style.background);
            }
        });
    }

    // Fetch CSV data
    async function fetchCsvData(url) {
        console.log("Fetching CSV data from:", url);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            const result = Papa.parse(text, { header: true, skipEmptyLines: true });
            if (result.errors.length > 0) {
                console.error("CSV parsing errors:", result.errors);
                throw new Error("Failed to parse CSV data");
            }
            console.log("CSV data fetched and parsed:", result.data);
            return result.data;
        } catch (error) {
            console.error("Error fetching CSV data:", error.message);
            throw error;
        }
    }

    // Load games
    async function loadGames() {
        console.log("Loading games...");
        try {
            const [officialData, privateData] = await Promise.all([
                fetchCsvData(officialUrl),
                fetchCsvData(privateUrl)
            ]);
            allGames = officialData.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
            privateGames = privateData.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
            console.log("Games loaded:", { allGames: allGames.length, privateGames: privateGames.length });

            if (allGames.length > 0) {
                currentBackground = allGames[0]["Background"] && allGames[0]["Background"].trim() !== "" ? allGames[0]["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(allGames[0]);
                adjustBackground();
                updateArrowStates(0, allGames);
            } else {
                console.error("No games available to load");
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "No games available. Please try again later.";
                    formErrorDialog.style.display = "flex";
                }
            }
        } catch (error) {
            console.error("Error loading games:", error.message);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load games. Please try again later.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Load a specific game
    function loadGame(game) {
        console.log("Loading game:", game);
        if (!game) {
            console.error("No game provided to load");
            return;
        }
        isLoadingGame = true;
        gameOver = false;
        secretWord = "";
        hints = [];
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        gaveUp = false;
        guesses = [];
        isProcessingGuess = false;

        const gameNumberDisplay = document.getElementById("new-game-number-display");
        const gameNumberDisplayAlt = document.querySelectorAll(".game-number-display");
        const hintsContainer = document.getElementById("hints-container");

        if (game["Game Number"] && game["Secret Word"]) {
            if (game["Name"]) {
                currentGameNumber = `${game["Game Number"]} - Private`;
            } else {
                currentGameNumber = `Game #${game["Game Number"]}`;
            }
            secretWord = game["Secret Word"].trim().toUpperCase();
            hints = [
                game["Hint 1"]?.trim().toUpperCase() || "",
                game["Hint 2"]?.trim().toUpperCase() || "",
                game["Hint 3"]?.trim().toUpperCase() || "",
                game["Hint 4"]?.trim().toUpperCase() || "",
                game["Hint 5"]?.trim().toUpperCase() || ""
            ].filter(hint => hint);
            console.log("Game loaded", { currentGameNumber, secretWord, hints });

            if (gameNumberDisplay) {
                gameNumberDisplay.textContent = currentGameNumber;
            }
            gameNumberDisplayAlt.forEach(display => {
                display.textContent = currentGameNumber;
            });

            if (hintsContainer) {
                hintsContainer.innerHTML = "";
                hintsContainer.style.display = "block";
                if (hints.length > 0) {
                    hintsContainer.innerHTML = hints[0]; // Display the first hint
                    hintIndex = 0;
                } else {
                    hintsContainer.textContent = "No hints available.";
                }
            }

            if (guessesLink) {
                guessesLink.textContent = `Guesses: ${guessCount}/5`;
            }
            if (guessInput) {
                guessInput.value = "";
                guessInput.disabled = false;
                initializeCursor();
                if (!isMobile) {
                    guessInput.focus();
                }
            }
            if (guessBtn) {
                guessBtn.disabled = false;
            }
            resetScreenDisplays(gameScreen);
            setupKeyboardListeners();
        } else {
            console.error("Invalid game data:", game);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Invalid game data. Please try another game.";
                formErrorDialog.style.display = "flex";
            }
        }
        isLoadingGame = false;
    }

    // Handle guess
    async function handleGuess(guess) {
        console.log("Handling guess:", guess, { isProcessingGuess, gameOver, guessCount });
        if (isProcessingGuess || gameOver || guessCount >= 5) {
            console.log("Guess ignored due to state");
            return;
        }
        isProcessingGuess = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;
        const hintsContainer = document.getElementById("hints-container");

        try {
            guess = guess.trim().toUpperCase();
            if (!firstGuessMade) {
                firstGuessMade = true;
            }

            guessCount++;
            guesses.push(guess);
            if (guessesLink) {
                guessesLink.textContent = `Guesses: ${guessCount}/5`;
            }

            // Update game results in localStorage
            let gameResults = JSON.parse(localStorage.getItem("gameResults")) || {};
            let gameKey = currentGameNumber.includes("- Private") ? `${currentGameNumber}` : `Game #${currentGameNumber.replace("Game #", "")}`;
            gameResults[gameKey] = gameResults[gameKey] || { guesses: "-" };

            if (guess === secretWord) {
                console.log("Correct guess!");
                guessInputContainer.classList.add("correct-guess");
                let normalizedGameNumber;
                let gameType;
                if (currentGameNumber.includes("- Private")) {
                    normalizedGameNumber = currentGameNumber.split(" - ")[0];
                    gameType = "privatePineapple";
                } else {
                    normalizedGameNumber = currentGameNumber.replace("Game #", "");
                    gameType = "pineapple";
                }
                gameResults[gameKey].guesses = guessCount;
                localStorage.setItem("gameResults", JSON.stringify(gameResults));
                await saveGameResult(gameType, normalizedGameNumber, secretWord, guessCount);
                completedGames[currentGameNumber] = true;
                localStorage.setItem("completedGames", JSON.stringify(completedGames));
                animationTimeout = setTimeout(() => {
                    guessInputContainer.classList.remove("correct-guess");
                    endGame(true);
                    guessInput.disabled = false;
                    guessBtn.disabled = false;
                    isProcessingGuess = false;
                    initializeCursor();
                    animationTimeout = null;
                }, 500); // Reduced from 1500ms to 500ms
            } else {
                console.log("Incorrect guess");
                guessInputContainer.classList.add("wrong-guess");
                if (guessCount >= 5) {
                    let normalizedGameNumber;
                    let gameType;
                    if (currentGameNumber.includes("- Private")) {
                        normalizedGameNumber = currentGameNumber.split(" - ")[0];
                        gameType = "privatePineapple";
                    } else {
                        normalizedGameNumber = currentGameNumber.replace("Game #", "");
                        gameType = "pineapple";
                    }
                    gameResults[gameKey].guesses = "X";
                    localStorage.setItem("gameResults", JSON.stringify(gameResults));
                    await saveGameResult(gameType, normalizedGameNumber, secretWord, "Lost");
                    completedGames[currentGameNumber] = true;
                    localStorage.setItem("completedGames", JSON.stringify(completedGames));
                    animationTimeout = setTimeout(() => {
                        guessInputContainer.classList.remove("wrong-guess");
                        endGame(false);
                        guessInput.disabled = false;
                        guessBtn.disabled = false;
                        isProcessingGuess = false;
                        initializeCursor();
                        animationTimeout = null;
                    }, 500); // Reduced from 1500ms to 500ms
                } else {
                    if (hintIndex + 1 < hints.length) {
                        hintIndex++;
                        hintsContainer.innerHTML += ` <span class="separator yellow">| </span> ${hints[hintIndex]}`;
                    }
                    animationTimeout = setTimeout(() => {
                        guessInputContainer.classList.remove("wrong-guess");
                        guessInput.value = "";
                        guessInput.disabled = false;
                        guessBtn.disabled = false;
                        isProcessingGuess = false;
                        initializeCursor();
                        if (!isMobile) {
                            guessInput.focus();
                        }
                        animationTimeout = null;
                    }, 500); // Reduced from 1500ms to 500ms
                }
            }
        } catch (error) {
            console.error("Error handling guess:", error.message);
            guessInputContainer.classList.remove("wrong-guess", "correct-guess");
            guessInput.value = "";
            guessInput.disabled = false;
            guessBtn.disabled = false;
            isProcessingGuess = false;
            initializeCursor();
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Error processing guess. Please try again.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // End game
    // UPDATED: Handle mobile end content in keyboard container
    function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp, guessCount, secretWord });
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;

        let hardLuckLabel, wellDoneLabel, todaysWord, shareText;
        if (isMobile && keyboardEndContent) {
            hardLuckLabel = keyboardEndContent.querySelector("#hard-luck-label");
            wellDoneLabel = keyboardEndContent.querySelector("#well-done-label");
            todaysWord = keyboardEndContent.querySelector("#todays-word");
            shareText = keyboardEndContent.querySelector("#share-text");
        } else {
            hardLuckLabel = document.getElementById("hard-luck-label");
            wellDoneLabel = document.getElementById("well-done-label");
            todaysWord = document.getElementById("todays-word");
            shareText = document.getElementById("share-text");
        }

        if (hardLuckLabel && wellDoneLabel && todaysWord) {
            hardLuckLabel.style.display = won ? "none" : "block";
            wellDoneLabel.style.display = won ? "block" : "none";
            todaysWord.textContent = secretWord;
        }

        if (shareText) {
            let emoji = gaveUp ? "😢" : (won ? "🎉" : "💔");
            let message = `${emoji} Wordy ${currentGameNumber}\n`;
            if (gaveUp) {
                message += "I gave up after ";
            } else if (won) {
                message += "I solved it in ";
            } else {
                message += "I couldn't solve it in ";
            }
            message += `${guessCount}/5 guesses!\n`;
            message += `The word was: ${secretWord}`;
            shareText.textContent = message;
            setupShareButtons(message);
        }

        if (won) {
            triggerPineappleRain();
        }

        if (isMobile && keyboardContainer && keyboardEndContent) {
            // Show end content in keyboard container
            keyboardContainer.classList.add("show-end");
            keyboardContainer.style.display = "flex";
            keyboardContent.style.display = "none";
            keyboardGuessesContent.style.display = "none";
            keyboardGiveUpContent.style.display = "none";
            keyboardEndContent.style.display = "flex";
            keyboardBackBtn.style.display = "block";
            // Apply fade effect to game screen
            gameScreen.classList.add("game-ended");
            gameScreen.style.opacity = "1";
            adjustBackground();
        } else {
            // Desktop: Navigate to game over screen
            gameScreen.style.opacity = "0";
            setTimeout(() => {
                resetScreenDisplays(gameOverScreen);
                gameOverScreen.style.opacity = "1";
                adjustBackground();
            }, 200); // Matches CSS transition duration
        }
    }

    // Trigger pineapple rain
    // UPDATED: Single continuous 4-second wave
    function triggerPineappleRain() {
        console.log("Triggering pineapple rain");
        const container = document.createElement("div");
        container.classList.add("pineapple-rain");
        document.body.appendChild(container);

        const numPieces = 50; // Increased for denser effect
        const duration = 4000; // 4 seconds

        // Spawn pineapples continuously over 4 seconds
        const spawnInterval = duration / numPieces; // Time between each pineapple spawn
        let spawned = 0;

        const spawnPineapple = () => {
            if (spawned < numPieces) {
                const piece = document.createElement("div");
                piece.classList.add("pineapple-piece");
                piece.textContent = "🍍";
                piece.style.left = `${Math.random() * 100}vw`;
                piece.style.fontSize = `${1.5 + Math.random() * 2}vh`;
                piece.style.animationDelay = `${spawned * spawnInterval}ms`;
                piece.style.setProperty("--rotation", `${Math.random() * 360 - 180}deg`); // -180° to +180°
                piece.style.setProperty("--drift", `${-10 + Math.random() * 20}`);
                container.appendChild(piece);
                spawned++;
                setTimeout(spawnPineapple, spawnInterval);
            }
        };

        spawnPineapple();

        setTimeout(() => {
            container.remove();
            console.log("Pineapple rain animation completed");
        }, duration + 4000); // Duration + 4s animation time
    }

    // Setup share buttons
    function setupShareButtons(message) {
        console.log("Setting up share buttons with message:", message);
        const shareButtons = {
            "share-whatsapp": "https://wa.me/?text=",
            "share-telegram": "https://t.me/share/url?url=&text=",
            "share-twitter": "https://twitter.com/intent/tweet?text=",
            "share-instagram": null
        };

        Object.keys(shareButtons).forEach(id => {
            const button = document.getElementById(id);
            if (button) {
                if (id === "share-instagram") {
                    button.addEventListener("click", (e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(message).then(() => {
                            alert("Result copied to clipboard! Paste it into your Instagram post.");
                        }).catch(err => {
                            console.error("Failed to copy text:", err);
                            alert("Failed to copy result. Please copy it manually.");
                        });
                    });
                } else {
                    const url = shareButtons[id] + encodeURIComponent(message);
                    button.href = url;
                }
            }
        });
    }

    // Save game result
    async function saveGameResult(gameType, gameNumber, word, result) {
        console.log("Saving game result", { gameType, gameNumber, word, result });
        try {
            const response = await fetch(webAppUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    gameType,
                    gameNumber,
                    word,
                    result: String(result)
                }).toString()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("Game result saved:", data);
        } catch (error) {
            console.error("Error saving game result:", error.message);
        }
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select screen - Function Called");
        resetScreenDisplays(gameSelectScreen);
        adjustBackground();
        displayGameList();
        console.log("Game select screen should now be visible");
    }

    // Display game list
    function displayGameList() {
        console.log("Displaying game list");
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");
        let gameResults = JSON.parse(localStorage.getItem("gameResults")) || {};

        if (officialList) {
            officialList.innerHTML = "";
            allGames.forEach(game => {
                const row = document.createElement("div");
                row.classList.add("game-list-row");
                const gameNum = game["Game Number"];
                const displayWord = completedGames[`Game #${gameNum}`] ? game["Secret Word"].toUpperCase() : "Play Now";
                const gameKey = `Game #${gameNum}`;
                const guessesDisplay = gameResults[gameKey]?.guesses || "-";
                row.innerHTML = `
                    <span>${gameNum}</span>
                    <span class="play-now">${displayWord}</span>
                    <span>${guessesDisplay}</span>
                `;
                row.addEventListener("click", async () => {
                    console.log("Official game selected:", game["Game Number"]);
                    currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(game);
                    resetScreenDisplays(gameScreen);
                    adjustBackground();
                    const currentIndex = allGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                    updateArrowStates(currentIndex, allGames);
                });
                officialList.appendChild(row);
            });
        }

        if (privateList) {
            privateList.innerHTML = "";
            privateGames.forEach(game => {
                const row = document.createElement("div");
                row.classList.add("game-list-row");
                const gameNum = game["Game Number"];
                const displayWord = completedGames[`${gameNum} - Private`] ? game["Secret Word"].toUpperCase() : "Play Now";
                const gameKey = `${gameNum} - Private`;
                const guessesDisplay = gameResults[gameKey]?.guesses || "-";
                row.innerHTML = `
                    <span>${game["Name"] || "Unnamed"}</span>
                    <span class="play-now">${displayWord}</span>
                    <span>${guessesDisplay}</span>
                `;
                row.addEventListener("click", async () => {
                    console.log("Private game selected:", game["Game Number"]);
                    currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(game);
                    resetScreenDisplays(gameScreen);
                    adjustBackground();
                    const currentIndex = privateGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                    updateArrowStates(currentIndex, privateGames);
                });
                privateList.appendChild(row);
            });
        }
    }

    // Home button
    if (homeBtn) {
        homeBtn.addEventListener("click", () => {
            console.log("Home button clicked");
            if (allGames.length > 0) {
                currentBackground = allGames[0]["Background"] && allGames[0]["Background"].trim() !== "" ? allGames[0]["Background"] : defaultBackground;
                loadGame(allGames[0]);
                resetScreenDisplays(gameScreen);
                adjustBackground();
                updateArrowStates(0, allGames);
            }
        });
    }

    // Official back button
    if (officialBackBtn) {
        officialBackBtn.addEventListener("click", () => {
            console.log("Official back button clicked");
            if (allGames.length > 0) {
                currentBackground = allGames[0]["Background"] && allGames[0]["Background"].trim() !== "" ? allGames[0]["Background"] : defaultBackground;
                loadGame(allGames[0]);
                resetScreenDisplays(gameScreen);
                adjustBackground();
                updateArrowStates(0, allGames);
            }
        });
    }

    // Private back button
    if (privateBackBtn) {
        privateBackBtn.addEventListener("click", () => {
            console.log("Private back button clicked");
            if (allGames.length > 0) {
                currentBackground = allGames[0]["Background"] && allGames[0]["Background"].trim() !== "" ? allGames[0]["Background"] : defaultBackground;
                loadGame(allGames[0]);
                resetScreenDisplays(gameScreen);
                adjustBackground();
                updateArrowStates(0, allGames);
            }
        });
    }

    // Next game button (end screen)
    if (nextGameBtnEnd) {
        nextGameBtnEnd.addEventListener("click", () => {
            console.log("Next game button (end screen) clicked, navigating to game select screen");
            showGameSelectScreen();
        });
    }

    // Create Pineapple button
    if (createPineappleBtn) {
        createPineappleBtn.addEventListener("click", () => {
            console.log("Create Pineapple button clicked");
            resetScreenDisplays(createForm);
            adjustBackground();
            formInputs.forEach(input => {
                input.value = "";
                input.disabled = false;
            });
            if (guessInput) {
                guessInput.disabled = true;
            }
            if (guessBtn) {
                guessBtn.disabled = true;
            }
        });
    }

    // Create Pineapple link (end screen)
    if (createPineappleLink) {
        createPineappleLink.addEventListener("click", () => {
            console.log("Create Pineapple link (end screen) clicked");
            resetScreenDisplays(createForm);
            adjustBackground();
            formInputs.forEach(input => {
                input.value = "";
                input.disabled = false;
            });
        });
    }

    // Form back button
    if (formBackBtn) {
        formBackBtn.addEventListener("click", () => {
            console.log("Form back button clicked, returning to main game screen");
            if (allGames.length > 0) {
                currentBackground = allGames[0]["Background"] && allGames[0]["Background"].trim() !== "" ? allGames[0]["Background"] : defaultBackground;
                loadGame(allGames[0]);
                resetScreenDisplays(gameScreen);
                adjustBackground();
                updateArrowStates(0, allGames);
            } else {
                console.error("No official games available to load");
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "No games available to load.";
                    formErrorDialog.style.display = "flex";
                }
            }
        });
    }

    // Confirm button (create form)
    if (confirmBtn) {
        confirmBtn.addEventListener("click", async () => {
            console.log("Confirm button clicked");
            const gameName = document.getElementById("game-name-input").value.trim();
            const secretWord = document.getElementById("secret-word").value.trim().toUpperCase();
            const newHints = [
                document.getElementById("hint-1").value.trim().toUpperCase(),
                document.getElementById("hint-2").value.trim().toUpperCase(),
                document.getElementById("hint-3").value.trim().toUpperCase(),
                document.getElementById("hint-4").value.trim().toUpperCase(),
                document.getElementById("hint-5").value.trim().toUpperCase()
            ].filter(hint => hint);

            if (!secretWord || newHints.length < 1) {
                console.error("Form validation failed", { secretWord, hints: newHints });
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Please enter a secret word and at least one hint.";
                    formErrorDialog.style.display = "flex";
                }
                return;
            }

            try {
                const newGameNumber = (privateGames.length + 1).toString();
                const newGame = {
                    "Game Number": newGameNumber,
                    "Name": gameName,
                    "Secret Word": secretWord,
                    "Hint 1": newHints[0] || "",
                    "Hint 2": newHints[1] || "",
                    "Hint 3": newHints[2] || "",
                    "Hint 4": newHints[3] || "",
                    "Hint 5": newHints[4] || "",
                    "Background": defaultBackground,
                    "Guesses": ""
                };
                privateGames.unshift(newGame);
                console.log("New private game created:", newGame);

                await saveGameResult("createPrivatePineapple", newGameNumber, secretWord, JSON.stringify({
                    name: gameName,
                    hints: newHints
                }));

                loadGame(newGame);
                resetScreenDisplays(gameScreen);
                adjustBackground();
                updateArrowStates(0, privateGames);
            } catch (error) {
                console.error("Error creating private game:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to create game. Please try again.";
                    formErrorDialog.style.display = "flex";
                }
            }
        });
    }

    // NEW: Add keyboard end content dynamically
    if (isMobile && keyboardContainer && !keyboardEndContent) {
        const endContent = document.createElement("div");
        endContent.id = "keyboard-end-content";
        endContent.classList.add("alternate-content");
        endContent.innerHTML = `
            <span id="hard-luck-label" class="end-label" style="display: none;">Hard Luck!</span>
            <span id="well-done-label" class="end-label" style="display: none;">Well Done!</span>
            <span id="todays-word-label">Today's word was:</span>
            <span id="todays-word"></span>
            <div id="share-section">
                <span id="share-label">Share your results!</span>
                <div id="share-buttons">
                    <a id="share-whatsapp" href="#" target="_blank"><i class="fab fa-whatsapp"></i></a>
                    <a id="share-telegram" href="#" target="_blank"><i class="fab fa-telegram"></i></a>
                    <a id="share-twitter" href="#" target="_blank"><i class="fab fa-x-twitter"></i></a>
                    <a id="share-instagram" href="#"><i class="fab fa-instagram"></i></a>
                </div>
            </div>
            <div class="end-buttons">
                <button id="next-game-btn-end" class="control-btn">Next Game</button>
                <button id="create-pineapple-end" class="control-btn">Create a Wordy</button>
            </div>
        `;
        keyboardContainer.appendChild(endContent);
        console.log("Dynamically added keyboard-end-content");

        // Reattach event listeners for dynamically added buttons
        const nextGameBtnEndDynamic = endContent.querySelector("#next-game-btn-end");
        const createPineappleEndDynamic = endContent.querySelector("#create-pineapple-end");
        if (nextGameBtnEndDynamic) {
            nextGameBtnEndDynamic.addEventListener("click", () => {
                console.log("Next game button (end screen) clicked, navigating to game select screen");
                showGameSelectScreen();
            });
        }
        if (createPineappleEndDynamic) {
            createPineappleEndDynamic.addEventListener("click", () => {
                console.log("Create Pineapple link (end screen) clicked");
                resetScreenDisplays(createForm);
                adjustBackground();
                formInputs.forEach(input => {
                    input.value = "";
                    input.disabled = false;
                });
            });
        }
    }

    // Initialize cursor and load games
    initializeCursor();
    await loadGames();

    if (isMobile) {
        showKeyboard();
    }
});