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
    const guessSection = document.getElementById("guess-section");
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
            if (!gameOver && !guessInput.disabled && !isProcessingGuess && guessInput.value) {
                const guess = guessInput.value.trim().toUpperCase();
                console.log("Submitting guess:", guess);
                try {
                    handleGuess(guess);
                    if (!isMobile) {
                        guessInput.focus();
                    }
                } catch (error) {
                    console.error("Error handling guess:", error);
                    guessInput.disabled = false;
                    guessBtn.disabled = false;
                    isProcessingGuess = false;
                }
            } else {
                console.log("Guess button ignored: invalid state or empty input");
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
            mainContent.style.display = "block";
            guessSection.style.display = "flex";
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
            guessSection.style.display = "none";
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
            guessSection.style.display = "none";
            gameSelectContent.style.display = "none";
            gameSelectContent.classList.remove("active");
            formContent.style.display = "flex";
            formContent.classList.add("active");
            document.getElementById("game-over").style.display = "none";
            document.getElementById("game-over").classList.remove("active");
            gameControlsContainer.style.display = "none";
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
            try {
                showGameSelectScreen();
                console.log("Game select screen displayed");
            } catch (error) {
                console.error("Error showing game select screen:", error);
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        allGamesLink.addEventListener("click", handler);
        allGamesLink.addEventListener("touchstart", handler);
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
            try {
                if (isMobile) {
                    if (keyboardContainer && keyboardContent && keyboardGiveUpContent && keyboardBackBtn) {
                        keyboardContainer.classList.add("show-alternate", "show-give-up");
                        keyboardContent.style.display = "none";
                        keyboardGuessesContent.style.display = "none";
                        keyboardGiveUpContent.style.display = "flex";
                        keyboardBackBtn.style.display = "block";
                        console.log("Showing give-up content in keyboard container");
                    } else {
                        console.error("Missing mobile give-up elements");
                    }
                } else {
                    if (giveUpDialog) {
                        giveUpDialog.style.display = "flex";
                        console.log("Showing give-up dialog");
                    } else {
                        console.error("giveUpDialog not found");
                    }
                }
            } catch (error) {
                console.error("Error showing give-up dialog:", error);
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
            if (currentGameNumber?.includes("- Private")) {
                normalizedGameNumber = currentGameId;
                gameType = "privatePineapple";
            } else {
                normalizedGameNumber = currentGameNumber?.replace("Game #", "");
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

        // Add mobile give-up buttons
        const keyboardGiveUpYesBtn = document.getElementById("keyboard-give-up-yes-btn");
        const keyboardGiveUpNoBtn = document.getElementById("keyboard-give-up-no-btn");

        if (keyboardGiveUpYesBtn) {
            keyboardGiveUpYesBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Mobile Give Up Yes button clicked");
                gaveUp = true;
                let normalizedGameNumber;
                let gameType;
                if (currentGameNumber?.includes("- Private")) {
                    normalizedGameNumber = currentGameId;
                    gameType = "privatePineapple";
                } else {
                    normalizedGameNumber = currentGameNumber?.replace("Game #", "");
                    gameType = "pineapple";
                }
                saveGameResult(gameType, normalizedGameNumber, secretWord, "Gave Up");
                showKeyboard();
                endGame(false, true);
            });
            keyboardGiveUpYesBtn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                e.stopPropagation();
                keyboardGiveUpYesBtn.click();
            });
        }

        if (keyboardGiveUpNoBtn) {
            keyboardGiveUpNoBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Mobile Give Up No button clicked");
                showKeyboard();
                if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            });
            keyboardGiveUpNoBtn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                e.stopPropagation();
                keyboardGiveUpNoBtn.click();
            });
        }
    }

    // Guesses link
    if (guessesLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses link triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Guesses link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            try {
                if (isMobile) {
                    if (keyboardContainer && keyboardContent && keyboardGuessesContent && keyboardBackBtn) {
                        keyboardContainer.classList.add("show-alternate", "show-guesses");
                        keyboardContent.style.display = "none";
                        keyboardGuessesContent.style.display = "flex";
                        keyboardGiveUpContent.style.display = "none";
                        keyboardBackBtn.style.display = "block";
                        console.log("Showing guesses content in keyboard container");
                    } else {
                        console.error("Missing mobile guesses elements");
                    }
                } else {
                    if (guessesScreen) {
                        guessesScreen.style.display = "flex";
                        console.log("Showing guesses screen");
                    } else {
                        console.error("guessesScreen not found");
                    }
                }
                displayGuesses();
            } catch (error) {
                console.error("Error showing guesses screen:", error);
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        guessesLink.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Guesses close button
    if (guessesCloseBtn) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button clicked");
            try {
                if (isMobile) {
                    showKeyboard();
                    keyboardContainer.classList.remove("show-alternate", "show-guesses");
                    keyboardContent.style.display = "flex";
                    keyboardGuessesContent.style.display = "none";
                    keyboardBackBtn.style.display = "none";
                } else {
                    if (guessesScreen) guessesScreen.style.display = "none";
                }
                if (guessInput && !gameOver && !isProcessingGuess && !isMobile) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            } catch (error) {
                console.error("Error closing guesses screen:", error);
            }
        };
        guessesCloseBtn.addEventListener("click", handler);
        guessesCloseBtn.addEventListener("touchstart", handler);
    }

    // Official back button
    if (officialBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Official back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Official back button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        officialBackBtn.addEventListener("click", handler);
        officialBackBtn.addEventListener("touchstart", handler);
    }

    // Private back button
    if (privateBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Private back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Private back button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        privateBackBtn.addEventListener("click", handler);
        privateBackBtn.addEventListener("touchstart", handler);
    }

    // Form back button
    if (formBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Form back button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameSelectContent);
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            privateContent.style.display = "flex";
            officialContent.classList.remove("active");
            officialContent.style.display = "none";
            displayGameList();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        formBackBtn.addEventListener("click", handler);
        formBackBtn.addEventListener("touchstart", handler);
    }

    // Create Pineapple button
    if (createPineappleBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Create Pineapple button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                input.value = "";
            });
            if (isMobile) {
                showKeyboard();
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        createPineappleBtn.addEventListener("click", handler);
        createPineappleBtn.addEventListener("touchstart", handler);
    }

    // Create Pineapple link
    if (createPineappleLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple link triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Create Pineapple link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                input.value = "";
            });
            if (isMobile) {
                showKeyboard();
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        createPineappleLink.addEventListener("click", handler);
        createPineappleLink.addEventListener("touchstart", handler);
    }

    // Next game button
    if (nextGameBtnEnd) {
        const handler = debounce(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next game button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Next game button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;
            let nextGameIndex = allGames.findIndex(game => game["Game #"] === currentGameNumber.replace("Game #", "") && !game["Game #"].includes("- Private")) + 1;
            if (nextGameIndex >= allGames.length) {
                nextGameIndex = 0;
            }
            const nextGame = allGames[nextGameIndex];
            if (nextGame) {
                await loadGame(`Game #${nextGame["Game #"]}`);
                console.log("Loaded next game:", nextGame["Game #"]);
            } else {
                console.warn("No next game found, reloading current game");
                await loadGame(currentGameNumber);
            }
            isUILocked = false;
            isLoadingGame = false;
        }, 100);
        nextGameBtnEnd.addEventListener("click", handler);
        nextGameBtnEnd.addEventListener("touchstart", handler);
    }

    // Form error OK button
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Form error OK button clicked");
            formErrorDialog.style.display = "none";
            if (!isMobile && activeInput) {
                activeInput.focus();
            }
        });
    }

    // Previous and Next game arrows
    if (prevGameArrow && nextGameArrow && gameNumberText) {
        const prevHandler = debounce(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Previous game arrow triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame || prevGameArrow.classList.contains("disabled")) {
                console.log("Previous game arrow ignored: UI locked, game loading, or disabled");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;
            let prevGameIndex = allGames.findIndex(game => {
                if (currentGameNumber.includes("- Private")) {
                    return game["Game ID"] === currentGameId;
                } else {
                    return game["Game #"] === currentGameNumber;
                }
            }) - 1;
            if (prevGameIndex < 0) {
                prevGameIndex = allGames.length - 1;
            }
            const prevGame = allGames[prevGameIndex];
            if (prevGame) {
                const gameIdentifier = prevGame["Game #"].includes("- Private") ? prevGame["Game ID"] : `Game #${prevGame["Game #"]}`;
                await loadGame(gameIdentifier);
                console.log("Loaded previous game:", gameIdentifier);
            }
            isUILocked = false;
            isLoadingGame = false;
        }, 100);
        prevGameArrow.addEventListener("click", prevHandler);
        prevGameArrow.addEventListener("touchstart", prevHandler);

        const nextHandler = debounce(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next game arrow triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame || nextGameArrow.classList.contains("disabled")) {
                console.log("Next game arrow ignored: UI locked, game loading, or disabled");
                return;
            }
            isUILocked = true;
            isLoadingGame = true;
            let nextGameIndex = allGames.findIndex(game => {
                if (currentGameNumber.includes("- Private")) {
                    return game["Game ID"] === currentGameId;
                } else {
                    return game["Game #"] === currentGameNumber;
                }
            }) + 1;
            if (nextGameIndex >= allGames.length) {
                nextGameIndex = 0;
            }
            const nextGame = allGames[nextGameIndex];
            if (nextGame) {
                const gameIdentifier = nextGame["Game #"].includes("- Private") ? nextGame["Game ID"] : `Game #${nextGame["Game #"]}`;
                await loadGame(gameIdentifier);
                console.log("Loaded next game:", gameIdentifier);
            }
            isUILocked = false;
            isLoadingGame = false;
        }, 100);
        nextGameArrow.addEventListener("click", nextHandler);
        nextGameArrow.addEventListener("touchstart", nextHandler);
    }

    // Load CSV data
    async function loadCSV(url, isPrivate = false) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            return new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (result) => {
                        console.log(`Parsed ${isPrivate ? 'private' : 'official'} CSV data:`, result.data.length, "rows");
                        resolve(result.data);
                    },
                    error: (error) => {
                        console.error(`Error parsing ${isPrivate ? 'private' : 'official'} CSV:`, error);
                        reject(error);
                    }
                });
            });
        } catch (error) {
            console.error(`Error fetching ${isPrivate ? 'private' : 'official'} CSV:`, error);
            return [];
        }
    }

    // Load all games
    async function loadAllGames() {
        console.log("Loading all games");
        try {
            const [officialData, privateData] = await Promise.all([
                loadCSV(officialUrl).catch(err => {
                    console.error("Failed to load official games:", err);
                    return [];
                }),
                loadCSV(privateUrl, true).catch(err => {
                    console.error("Failed to load private games:", err);
                    return [];
                })
            ]);

            allGames = officialData.map(game => ({
                ...game,
                "Game #": `Game #${game["Game #"]}`
            })).concat(privateData.map(game => ({
                ...game,
                "Game #": `${game["Game Name"]} - Private`,
                "Game ID": game["Game ID"]
            })));

            privateGames = privateData.map(game => ({
                ...game,
                "Game #": `${game["Game Name"]} - Private`,
                "Game ID": game["Game ID"]
            }));

            console.log("All games loaded:", allGames.length, "Private games:", privateGames.length);
            return allGames;
        } catch (error) {
            console.error("Error loading games:", error);
            return [];
        }
    }

    // Generate star clip path
    function generateStarClipPath(points, innerRadius) {
        const outerRadius = 100;
        const cx = 50;
        const cy = 50;
        let path = "";
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            path += `${x}% ${y}%${i < points * 2 - 1 ? ',' : ''}`;
        }
        return `polygon(${path})`;
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
                            const tailSize = 1.35 + Math.random() * 0.4;
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
                            const puff1Size = 8.1 + Math.random() * 2;
                            const puff2Size = 5.4 + Math.random() * 1.6;
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
                            element.style.transform = `rotate(${rotation}deg)`; // Preserve positioning transform
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

        const animations = [
            'pop', 'zoomIn', 'bounce', 'jelly', 'fadeIn', 'slideInLeft', 'slideInRight',
            'slideInTop', 'slideInBottom', 'rotateIn', 'pulse', 'swing', 'flip', 'shake',
            'grow', 'shrinkIn', 'spiral', 'drop', 'expand', 'twist', 'glow', 'wobble',
            'spin', 'bounceIn', 'revealLetter'
        ];

        const shuffledShapes = shapeVariations.sort(() => Math.random() - 0.5);

        for (let i = 1; i <= 5; i++) {
            const hintElement = document.getElementById(`hint-${i}`);
            if (hintElement) {
                hintElement.innerHTML = "";
                hintElement.style.display = "none";
                hintElement.style.clipPath = "";
                hintElement.style.transform = "";
                hintElement.style.background = "rgba(255, 255, 255, 0.85)";
                hintElement.style.animation = "none";
                hintElement.style.setProperty('--tail-size', '1.35vh');
                hintElement.style.setProperty('--tail-pos', '50%');
                hintElement.style.setProperty('--puff1-size', '8.1vh');
                hintElement.style.setProperty('--puff2-size', '5.4vh');
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
                const animation = animations[Math.floor(Math.random() * animations.length)];
                hintElement.style.animation = `${animation} ${animation === 'revealLetter' ? '0.05s' : '0.5s'} forwards`;
                if (animation === 'revealLetter') {
                    hintElement.innerHTML = buildHintHTML(hints[i]);
                } else {
                    hintElement.innerHTML = hints[i].replace(/ /g, " ");
                }
                hintElement.style.display = "flex";
            }
        }
        console.log("Hints displayed up to index:", hintIndex, "with randomized shapes, colors, and animations");
    }

    // Build hint HTML
    function buildHintHTML(hint) {
        return hint.split("").map(letter => `<span class="letter" style="opacity:0">${letter}</span>`).join("");
    }

    // Get random color
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 50 + Math.random() * 30;
        const lightness = 40 + Math.random() * 20;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    // Display guesses
    function displayGuesses() {
        console.log("Displaying guesses:", guesses);
        const guessesList = document.getElementById("guesses-list");
        if (guessesList) {
            guessesList.innerHTML = guesses.length > 0 ? guesses.join("<br>") : "No guesses yet";
            console.log("Guesses list updated");
        } else {
            console.error("guesses-list not found in DOM");
        }
    }

    // Adjust background
    function adjustBackground() {
        const backgroundContainer = document.getElementById("background-container");
        if (!backgroundContainer) {
            console.error("background-container not found in DOM");
            return;
        }
        console.log("Adjusting background to:", currentBackground);
        backgroundContainer.style.backgroundImage = `url('${currentBackground}')`;
        backgroundContainer.style.backgroundSize = "cover";
        backgroundContainer.style.backgroundPosition = "center center";
        backgroundContainer.style.backgroundRepeat = "no-repeat";
    }

    // Handle guess
    async function handleGuess(guess) {
        console.log("Handling guess:", guess, { isProcessingGuess, gameOver });
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored: already processing or game over");
            return;
        }
        isProcessingGuess = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;

        guess = guess.trim().toUpperCase();
        if (!guess.match(/^[A-Z]+$/)) {
            console.log("Invalid guess, flashing red");
            guessInputContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                guessInput.value = "";
                guessInput.disabled = false;
                guessBtn.disabled = false;
                if (!isMobile) guessInput.focus();
                initializeCursor();
                isProcessingGuess = false;
                animationTimeout = null;
            }, 350);
            return;
        }

        guessCount++;
        guesses.push(guess);
        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}`;
        }

        let normalizedGameNumber;
        let gameType;
        if (currentGameNumber.includes("- Private")) {
            normalizedGameNumber = currentGameId;
            gameType = "privatePineapple";
        } else {
            normalizedGameNumber = currentGameNumber.replace("Game #", "");
            gameType = "pineapple";
        }

        if (guess === secretWord) {
            console.log("Correct guess, saving result and ending game");
            saveGameResult(gameType, normalizedGameNumber, secretWord, guessCount);
            guessInputContainer.classList.add("game-ended");
            endGame(true);
            isProcessingGuess = false;
            return;
        }

        console.log("Incorrect guess, flashing red");
        guessInputContainer.classList.add("wrong-guess");
        animationTimeout = setTimeout(() => {
            guessInputContainer.classList.remove("wrong-guess");
            guessInput.value = "";
            hintIndex = Math.min(hintIndex + 1, hints.length - 1);
            setupHints();
            guessInput.disabled = false;
            guessBtn.disabled = false;
            if (!isMobile) guessInput.focus();
            initializeCursor();
            isProcessingGuess = false;
            animationTimeout = null;
            firstGuessMade = true;
            console.log("Guess processed, hint index:", hintIndex);
        }, 350);
    }

    // Save game result
    function saveGameResult(gameType, gameNumber, word, result) {
        console.log("Saving game result:", { gameType, gameNumber, word, result });
        const results = JSON.parse(localStorage.getItem(`${gameType}Results`) || "{}");
        results[gameNumber] = { word, result };
        localStorage.setItem(`${gameType}Results`, JSON.stringify(results));
        console.log("Game result saved to localStorage");
    }

    // Load game
    async function loadGame(gameIdentifier) {
        console.log("Loading game:", gameIdentifier);
        isLoadingGame = true;
        gameOver = false;
        guessCount = 0;
        hintIndex = 0;
        firstGuessMade = false;
        guesses = [];
        gaveUp = false;
        isProcessingGuess = false;
        currentGameNumber = gameIdentifier;

        try {
            const game = allGames.find(g => {
                if (gameIdentifier.includes("- Private")) {
                    return g["Game ID"] === gameIdentifier;
                } else {
                    return g["Game #"] === gameIdentifier;
                }
            });

            if (!game) {
                console.error("Game not found:", gameIdentifier);
                isLoadingGame = false;
                return;
            }

            currentGameId = game["Game ID"] || gameIdentifier;
            secretWord = game["Secret Word"]?.trim().toUpperCase() || "";
            hints = [
                game["Hint 1"], game["Hint 2"], game["Hint 3"],
                game["Hint 4"], game["Hint 5"]
            ].filter(hint => hint).map(hint => hint.trim().toUpperCase());

            console.log("Game loaded:", { secretWord, hints, currentGameNumber, currentGameId });

            const backgroundUrl = game["Background"]?.trim() || defaultBackground;
            currentBackground = await preloadBackground(backgroundUrl);

            if (guessInput) {
                guessInput.value = "";
                guessInput.disabled = false;
                guessInputContainer.classList.remove("game-ended", "wrong-guess");
            }
            if (guessBtn) {
                guessBtn.disabled = false;
            }
            if (guessesLink) {
                guessesLink.textContent = `Guesses: 0`;
            }
            if (gameNumberText) {
                gameNumberText.textContent = currentGameNumber;
            }

            const currentIndex = allGames.findIndex(g => g["Game #"] === currentGameNumber || g["Game ID"] === currentGameId);
            if (prevGameArrow) {
                prevGameArrow.classList.toggle("disabled", currentIndex <= 0);
            }
            if (nextGameArrow) {
                nextGameArrow.classList.toggle("disabled", currentIndex >= allGames.length - 1);
            }

            setupHints();
            adjustBackground();
            resetScreenDisplays(gameScreen);
            initializeCursor();
            displayGuesses();

            if (!isMobile && guessInput) {
                guessInput.focus();
                activeInput = guessInput;
            }
            if (isMobile) {
                showKeyboard();
            }

            console.log("Game fully loaded and initialized");
        } catch (error) {
            console.error("Error loading game:", error);
        } finally {
            isLoadingGame = false;
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
        guessSection.style.display = "flex";
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
            hint1.style.animation = "pop 0.5s forwards";
        }

        if (gameControlsContainer) {
            gameControlsContainer.style.display = "none";
        }

        if (isMobile && keyboardContainer) {
            keyboardContainer.style.display = "none";
        }
        mainContent.style.display = "none";
        guessSection.style.display = "none";
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
        const container = document.createElement("div");
        container.classList.add("pineapple-rain");
        document.body.appendChild(container);

        const pieces = ["🍍"];
        const numPieces = 20;

        for (let i = 0; i < numPieces; i++) {
            const piece = document.createElement("div");
            piece.classList.add("pineapple-piece");
            piece.textContent = pieces[Math.floor(Math.random() * pieces.length)];
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.fontSize = `${1 + Math.random() * 1.5}vh`;
            piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
            piece.style.setProperty('--drift', `${-10 + Math.random() * 20}`);
            piece.style.animationDuration = `${2 + Math.random() * 2}s`;
            piece.style.animationDelay = `${Math.random() * 1}s`;
            container.appendChild(piece);
        }

        setTimeout(() => {
            container.remove();
            console.log("Pineapple rain animation completed");
        }, 5000);
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select screen");
        resetScreenDisplays(gameSelectContent);
        officialTab.classList.add("active");
        privateTab.classList.remove("active");
        officialContent.classList.add("active");
        officialContent.style.display = "flex";
        privateContent.classList.remove("active");
        privateContent.style.display = "none";
        displayGameList();
    }

    // Display game list
    function displayGameList() {
        console.log("Displaying game list");
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");
        if (!officialList || !privateList) {
            console.error("official-list or private-list not found in DOM");
            return;
        }

        officialList.innerHTML = "";
        privateList.innerHTML = "";

        const officialResults = JSON.parse(localStorage.getItem("pineappleResults") || "{}");
        const privateResults = JSON.parse(localStorage.getItem("privatePineappleResults") || "{}");

        allGames.forEach(game => {
            const isPrivate = game["Game #"].includes("- Private");
            const list = isPrivate ? privateList : officialList;
            const gameNumber = isPrivate ? game["Game #"] : game["Game #"].replace("Game #", "");
            const gameId = game["Game ID"] || gameNumber;
            const result = isPrivate ? privateResults[gameId] : officialResults[gameNumber];
            const word = result ? result.word : "-";
            const guesses = result ? (result.result === "Gave Up" ? "Gave Up" : result.result) : "-";

            const row = document.createElement("div");
            row.classList.add("game-list-row");
            row.innerHTML = `
                <span>${isPrivate ? game["Game Name"] : gameNumber}</span>
                <span>${word}</span>
                <span>${guesses}</span>
            `;

            const handler = debounce(async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Game row clicked:", game["Game #"], { isUILocked, isLoadingGame });
                if (isUILocked || isLoadingGame) {
                    console.log("Game row click ignored: UI locked or game loading");
                    return;
                }
                isUILocked = true;
                isLoadingGame = true;
                await loadGame(isPrivate ? game["Game ID"] : `Game #${gameNumber}`);
                isUILocked = false;
                isLoadingGame = false;
            }, 100);

            row.addEventListener("click", handler);
            row.addEventListener("touchstart", (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchMoved = false;
            });
            row.addEventListener("touchmove", (e) => {
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                const deltaX = Math.abs(touchX - touchStartX);
                const deltaY = Math.abs(touchY - touchStartY);
                if (deltaX > touchThreshold || deltaY > touchThreshold) {
                    touchMoved = true;
                }
            });
            row.addEventListener("touchend", (e) => {
                if (!touchMoved) {
                    handler(e);
                }
            });

            list.appendChild(row);
        });

        console.log("Game list displayed");
    }

    // Submit form
    if (confirmBtn) {
        confirmBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            console.log("Confirm button clicked");
            if (isUILocked || isLoadingGame) {
                console.log("Confirm button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;

            const gameName = formInputs[0].value.trim().toUpperCase();
            const secretWordInput = formInputs[1].value.trim().toUpperCase();
            const hintsInput = formInputs.slice(2).map(input => input.value.trim().toUpperCase()).filter(hint => hint);

            if (!gameName) {
                formErrorMessage.textContent = "Game name is required.";
                formErrorDialog.style.display = "flex";
                isUILocked = false;
                return;
            }
            if (!secretWordInput.match(/^[A-Z]+$/)) {
                formErrorMessage.textContent = "Secret word must contain only letters.";
                formErrorDialog.style.display = "flex";
                isUILocked = false;
                return;
            }
            if (hintsInput.length < 1) {
                formErrorMessage.textContent = "At least one hint is required.";
                formErrorDialog.style.display = "flex";
                isUILocked = false;
                return;
            }
            for (let hint of hintsInput) {
                if (!hint.match(/^[A-Z\s]+$/)) {
                    formErrorMessage.textContent = "Hints must contain only letters and spaces.";
                    formErrorDialog.style.display = "flex";
                    isUILocked = false;
                    return;
                }
            }

            const formData = new FormData();
            formData.append("Game Name", gameName);
            formData.append("Secret Word", secretWordInput);
            hintsInput.forEach((hint, index) => {
                formData.append(`Hint ${index + 1}`, hint);
            });

            try {
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    body: formData
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                console.log("Form submission response:", result);
                if (result.status === "success") {
                    await loadAllGames();
                    resetScreenDisplays(gameSelectContent);
                    privateTab.classList.add("active");
                    officialTab.classList.remove("active");
                    privateContent.classList.add("active");
                    privateContent.style.display = "flex";
                    officialContent.classList.remove("active");
                    officialContent.style.display = "none";
                    displayGameList();
                } else {
                    formErrorMessage.textContent = result.message || "Failed to create game.";
                    formErrorDialog.style.display = "flex";
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                formErrorMessage.textContent = "An error occurred while creating the game.";
                formErrorDialog.style.display = "flex";
            }
            isUILocked = false;
        });
    }

    // Initialize game
    async function initializeGame() {
        console.log("Initializing game");
        try {
            await loadAllGames();
            if (allGames.length === 0) {
                console.error("No games available to load");
                return;
            }
            let latestGame = allGames[allGames.length - 1];
            if (latestGame) {
                const gameIdentifier = latestGame["Game #"].includes("- Private") ? latestGame["Game ID"] : latestGame["Game #"];
                await loadGame(gameIdentifier);
            } else {
                console.error("No latest game found");
            }
            console.log("Game initialized");
        } catch (error) {
            console.error("Error initializing game:", error);
        }
    }

    // Start the game
    initializeGame();
});