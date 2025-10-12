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
    let gameResults = JSON.parse(localStorage.getItem("gameResults")) || {};

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
    const officialTab = document.getElementById("official-tab");
    const privateTab = document.getElementById("private-tab");
    const officialContent = document.getElementById("official-games");
    const privateContent = document.getElementById("private-games");
    const shareSection = document.getElementById("share-section");
    const gameNameElement = document.getElementById("game-name");
    const gameContainer = document.getElementById("game-container");

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
                timeout = null;
                func(...args);
            };
            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
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

    // Adjust background and layout
    function adjustBackground() {
        console.log("Adjusting background and layout");
        const backgroundContainer = document.getElementById("background-container");
        if (window.visualViewport) {
            const viewportHeight = window.visualViewport.height;
            console.log("Visual viewport height:", viewportHeight);
            document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
            if (backgroundContainer && gameContainer) {
                backgroundContainer.style.height = `${viewportHeight}px`;
                gameContainer.style.height = `${viewportHeight}px`;
                backgroundContainer.style.background = `url('${currentBackground}') no-repeat center center`;
                backgroundContainer.style.backgroundSize = "100% 100%";
            }
        } else {
            const fallbackHeight = window.innerHeight;
            console.log("Using fallback height:", fallbackHeight);
            document.documentElement.style.setProperty('--viewport-height', `${fallbackHeight}px`);
            if (backgroundContainer && gameContainer) {
                backgroundContainer.style.height = `${fallbackHeight}px`;
                gameContainer.style.height = `${fallbackHeight}px`;
                backgroundContainer.style.background = `url('${currentBackground}') no-repeat center center`;
                backgroundContainer.style.backgroundSize = "100% 100%";
            }
        }
        if (backgroundContainer) backgroundContainer.offsetHeight; // Force repaint
    }

    // Ensure keyboard stays open
    function keepKeyboardOpen() {
        if (
            gameScreen.style.display === "flex" &&
            !gameOver &&
            !isProcessingGuess &&
            !isUILocked &&
            !document.querySelector('.screen.active') &&
            !document.querySelector('.dialog[style*="display: flex"]')
        ) {
            console.log("Ensuring keyboard stays open by focusing guess input");
            if (document.activeElement !== guessInput) {
                guessInput.focus();
                activeInput = guessInput;
            }
            if (isMobile) {
                guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    }

    // Ensure initial focus on game load
    function ensureInitialFocus() {
        if (guessInput && !gameOver && !isProcessingGuess && gameScreen.style.display === "flex") {
            console.log("Attempting initial focus on guess input");
            guessInput.focus();
            activeInput = guessInput;
            if (isMobile) {
                guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                // Force keyboard on mobile by simulating a touch event
                const touchEvent = new Event('touchstart', { bubbles: true });
                guessInput.dispatchEvent(touchEvent);
                setTimeout(() => {
                    if (document.activeElement !== guessInput) {
                        console.log("Initial focus failed, retrying");
                        guessInput.focus();
                        guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                }, 300);
            }
        }
    }

    // Event listeners for resize and viewport changes
    window.addEventListener("resize", () => {
        console.log("Window resized, adjusting layout");
        adjustBackground();
        keepKeyboardOpen();
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", () => {
            console.log("Visual viewport resized, adjusting layout");
            adjustBackground();
            keepKeyboardOpen();
        });
    }

    // Document-level touch handler to focus input on first interaction
    let initialTouchHandled = false;
    document.addEventListener("touchstart", (e) => {
        if (!initialTouchHandled && !gameOver && !isProcessingGuess && !isUILocked && gameScreen.style.display === "flex" && !e.target.closest('.screen, .dialog, #guess-btn')) {
            console.log("First document touch, focusing guess input");
            guessInput.focus();
            activeInput = guessInput;
            adjustBackground();
            initialTouchHandled = true;
            if (isMobile) {
                guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    });

    // Global click handler to refocus guess input
    document.addEventListener("click", (e) => {
        if (
            gameScreen.style.display === "flex" &&
            !gameOver &&
            !isProcessingGuess &&
            !isUILocked &&
            !e.target.closest('.screen, .dialog, #guess-btn, #guess-input, #guess-input-container, #guess-area')
        ) {
            console.log("Global click detected, refocusing guess input");
            guessInput.focus();
            activeInput = guessInput;
            if (isMobile) {
                guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
            keepKeyboardOpen();
        }
    });

    // Setup game name
    if (gameNameElement) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Game name triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            setTimeout(() => {
                isUILocked = false;
                keepKeyboardOpen();
            }, 500);
        }, 100);
        gameNameElement.addEventListener(isMobile ? "touchstart" : "click", handler);
        gameNameElement.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") handler(e);
        });
    }

    // Setup guess input
    if (guessInput) {
        guessInput.disabled = false;
        guessInput.readOnly = false;
        guessInput.addEventListener("input", () => {
            console.log("Guess input value changed:", guessInput.value);
            guessInput.value = guessInput.value.toUpperCase();
            if (animationTimeout) {
                clearTimeout(animationTimeout);
                animationTimeout = null;
                guessInputContainer.classList.remove("wrong-guess");
                isProcessingGuess = false;
            }
        });
        guessInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !gameOver && !guessInput.disabled && !isProcessingGuess) {
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Guess submitted via Enter:", guess);
                    handleGuess(guess);
                }
            }
        });
        guessInput.addEventListener("focus", () => {
            console.log("Guess input focused");
            activeInput = guessInput;
            adjustBackground();
            if (isMobile) {
                guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        });
        guessInput.addEventListener("touchstart", (e) => {
            e.preventDefault();
            console.log("Guess input touched");
            guessInput.focus();
            activeInput = guessInput;
            adjustBackground();
            if (isMobile) {
                guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                // Force keyboard to appear
                setTimeout(() => {
                    if (document.activeElement !== guessInput) {
                        guessInput.focus();
                    }
                }, 100);
            }
        });
    }

    // Setup guess input container
    if (guessInputContainer) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guess input container triggered");
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
                adjustBackground();
                if (isMobile) {
                    guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
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
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
                if (isMobile) {
                    guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    setTimeout(() => {
                        if (document.activeElement !== guessInput) {
                            guessInput.focus();
                        }
                    }, 100);
                }
                adjustBackground();
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
            console.log("Guess button triggered", { gameOver, disabled: guessInput.disabled, isProcessingGuess });
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                // Ensure input is focused before processing guess
                if (isMobile && document.activeElement !== guessInput) {
                    guessInput.focus();
                    activeInput = guessInput;
                    guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Submitting guess:", guess);
                    handleGuess(guess);
                }
            }
        }, 100);
        guessBtn.addEventListener("click", handler);
        guessBtn.addEventListener("touchstart", handler);
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

        if (activeScreen === gameScreen) {
            gameScreen.style.display = "flex";
            guessArea.style.display = "flex";
            setTimeout(() => {
                ensureInitialFocus();
                keepKeyboardOpen();
            }, 100);
        } else if (activeScreen === gameSelectContent || activeScreen === formContent || activeScreen.id === "game-over") {
            activeScreen.style.display = "flex";
            activeScreen.classList.add("active");
            if (activeScreen === formContent) {
                activeInput = document.getElementById("game-name-input");
                if (activeInput) setTimeout(() => activeInput.focus(), 0);
            }
        }

        adjustBackground();
    }

    // Tab navigation
    if (officialTab && privateTab && officialContent && privateContent) {
        const tabHandler = (tab, content) => {
            return debounce((e) => {
                e.preventDefault();
                console.log(`${tab.id} clicked`);
                officialTab.classList.toggle("active", tab === officialTab);
                privateTab.classList.toggle("active", tab === privateTab);
                officialContent.classList.toggle("active", tab === officialTab);
                officialContent.style.display = tab === officialTab ? "flex" : "none";
                privateContent.classList.toggle("active", tab === privateTab);
                privateContent.style.display = tab === privateTab ? "flex" : "none";
                if (tab === privateTab && privateGames.length === 0) {
                    fetchPrivateGames();
                }
                displayGameList();
                adjustBackground();
                keepKeyboardOpen();
            }, 100);
        };

        officialTab.addEventListener("click", tabHandler(officialTab, officialContent));
        privateTab.addEventListener("click", tabHandler(privateTab, privateContent));
        officialTab.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") tabHandler(officialTab, officialContent)(e);
        });
        privateTab.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") tabHandler(privateTab, privateContent)(e);
        });
    }

    // All Games link
    if (allGamesLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            console.log("All Games link triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            showGameSelectScreen();
            setTimeout(() => {
                isUILocked = false;
                keepKeyboardOpen();
            }, 500);
        }, 100);
        allGamesLink.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Give Up link
    if (giveUpLink && giveUpYesBtn && giveUpNoBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            console.log("Give Up link triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            giveUpDialog.style.display = "flex";
            console.log("Showing give-up dialog");
            setTimeout(() => {
                isUILocked = false;
                keepKeyboardOpen();
            }, 500);
        }, 100);
        giveUpLink.addEventListener(isMobile ? "touchstart" : "click", handler);

        giveUpYesBtn.addEventListener("click", (e) => {
            e.preventDefault();
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
            giveUpDialog.style.display = "none";
            endGame(false, true);
            keepKeyboardOpen();
        });

        giveUpNoBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Give Up No button clicked");
            giveUpDialog.style.display = "none";
            keepKeyboardOpen();
        });
    }

    // Guesses link
    if (guessesLink && guessesScreen) {
        guessesLink.textContent = "Guesses: 0/5";
        const handler = debounce((e) => {
            e.preventDefault();
            console.log("Guesses link triggered", { isUILocked, isLoadingGame, guesses, guessCount });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            const guessesList = document.getElementById("guesses-list");
            if (!guessesList) {
                console.error("guesses-list element not found");
                isUILocked = false;
                return;
            }
            guessesList.innerHTML = guesses.length > 0
                ? guesses.map(g => g.toUpperCase()).join(' <span class="separator yellow">|</span> ')
                : "No guesses yet!";
            guessesScreen.style.display = "flex";
            setTimeout(() => {
                isUILocked = false;
                keepKeyboardOpen();
            }, 500);
        }, 100);
        guessesLink.addEventListener(isMobile ? "touchstart" : "click", handler);
        guessesScreen.addEventListener("click", (e) => {
            if (e.target === guessesScreen) {
                console.log("Clicked outside guesses screen");
                guessesScreen.style.display = "none";
                keepKeyboardOpen();
            }
        });
    }

    // Guesses close button
    if (guessesCloseBtn) {
        const handler = (e) => {
            e.preventDefault();
            console.log("Guesses close button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            guessesScreen.style.display = "none";
            keepKeyboardOpen();
            setTimeout(() => { isUILocked = false; }, 500);
        };
        guessesCloseBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Previous game arrow
    if (prevGameArrow) {
        prevGameArrow.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            console.log("Previous game arrow triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            isLoadingGame = true;
            prevGameArrow.classList.add("loading");
            try {
                if (!currentGameNumber || !currentGameId) throw new Error("No current game number or ID set");
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
                if (currentIndex === -1) throw new Error(`Current game not found: ${currentGameNumber}, ID: ${currentGameId}`);
                if (currentIndex < gameList.length - 1) {
                    const targetGame = gameList[currentIndex + 1];
                    console.log("Loading previous game", { currentIndex, targetIndex: currentIndex + 1 });
                    currentBackground = targetGame["Background"] && targetGame["Background"].trim() !== "" ? targetGame["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(targetGame);
                    resetScreenDisplays(gameScreen);
                    adjustBackground();
                    updateArrowStates(currentIndex + 1, gameList);
                } else {
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
                prevGameArrow.classList.remove("loading");
                keepKeyboardOpen();
            }
        });
    }

    // Next game arrow
    if (nextGameArrow) {
        nextGameArrow.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            console.log("Next game arrow triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            isLoadingGame = true;
            nextGameArrow.classList.add("loading");
            try {
                if (!currentGameNumber || !currentGameId) throw new Error("No current game number or ID set");
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
                if (currentIndex === -1) throw new Error(`Current game not found: ${currentGameNumber}, ID: ${currentGameId}`);
                if (currentIndex > 0) {
                    const targetGame = gameList[currentIndex - 1];
                    console.log("Loading next game", { currentIndex, targetIndex: currentIndex - 1 });
                    currentBackground = targetGame["Background"] && targetGame["Background"].trim() !== "" ? targetGame["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(targetGame);
                    resetScreenDisplays(gameScreen);
                    adjustBackground();
                    updateArrowStates(currentIndex - 1, gameList);
                } else {
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
                nextGameArrow.classList.remove("loading");
                keepKeyboardOpen();
            }
        });
    }

    // Create Pineapple button
    if (createPineappleBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            console.log("Create Pineapple button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(formContent);
            setTimeout(() => {
                isUILocked = false;
                keepKeyboardOpen();
            }, 500);
        }, 100);
        createPineappleBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Create Pineapple End button
    if (createPineappleLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            console.log("Create Pineapple End button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(formContent);
            setTimeout(() => {
                isUILocked = false;
                keepKeyboardOpen();
            }, 500);
        }, 100);
        createPineappleLink.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Form Back button
    if (formBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            console.log("Form Back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(gameSelectContent);
            setTimeout(() => {
                isUILocked = false;
                keepKeyboardOpen();
            }, 500);
        }, 100);
        formBackBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Official Back button
    if (officialBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            console.log("Official Back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            setTimeout(() => {
                isUILocked = false;
                keepKeyboardOpen();
            }, 500);
        }, 100);
        officialBackBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Private Back button
    if (privateBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            console.log("Private Back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            setTimeout(() => {
                isUILocked = false;
                keepKeyboardOpen();
            }, 500);
        }, 100);
        privateBackBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Form Error OK button
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Form Error OK button clicked");
            formErrorDialog.style.display = "none";
            keepKeyboardOpen();
        });
    }

    // Next Game End button
    if (nextGameBtnEnd) {
        const handler = debounce(async (e) => {
            e.preventDefault();
            console.log("Next Game End button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            isLoadingGame = true;
            nextGameBtnEnd.classList.add("loading");
            try {
                if (!currentGameNumber || !currentGameId) throw new Error("No current game number or ID set");
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
                if (currentIndex === -1) throw new Error(`Current game not found: ${currentGameNumber}, ID: ${currentGameId}`);
                if (currentIndex > 0) {
                    const targetGame = gameList[currentIndex - 1];
                    console.log("Loading next game from end screen", { currentIndex, targetIndex: currentIndex - 1 });
                    currentBackground = targetGame["Background"] && targetGame["Background"].trim() !== "" ? targetGame["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(targetGame);
                    resetScreenDisplays(gameScreen);
                    adjustBackground();
                    updateArrowStates(currentIndex - 1, gameList);
                } else {
                    nextGameArrow.classList.add("disabled");
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
                nextGameBtnEnd.classList.remove("loading");
                keepKeyboardOpen();
            }
        }, 100);
        nextGameBtnEnd.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Confirm button for form submission
    if (confirmBtn) {
        const handler = debounce(async (e) => {
            e.preventDefault();
            console.log("Confirm button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            isLoadingGame = true;
            confirmBtn.classList.add("loading");
            try {
                const gameName = document.getElementById("game-name-input")?.value.trim().toUpperCase();
                const secretWordInput = document.getElementById("secret-word")?.value.trim().toUpperCase();
                const hintInputs = [
                    document.getElementById("hint-1")?.value.trim().toUpperCase(),
                    document.getElementById("hint-2")?.value.trim().toUpperCase(),
                    document.getElementById("hint-3")?.value.trim().toUpperCase(),
                    document.getElementById("hint-4")?.value.trim().toUpperCase(),
                    document.getElementById("hint-5")?.value.trim().toUpperCase()
                ].filter(hint => hint);

                if (!gameName || !secretWordInput || hintInputs.length < 5) {
                    throw new Error("Please fill in all fields.");
                }

                if (!/^[A-Z\s]+$/.test(secretWordInput) || !/^[A-Z\s]+$/.test(gameName) || hintInputs.some(hint => !/^[A-Z\s]+$/.test(hint))) {
                    throw new Error("Only letters and spaces are allowed.");
                }

                const formData = new FormData();
                formData.append("Game Name", gameName);
                formData.append("Secret Word", secretWordInput);
                hintInputs.forEach((hint, index) => {
                    formData.append(`Hint ${index + 1}`, hint);
                });

                const response = await fetch(webAppUrl, {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    throw new Error("Failed to create game.");
                }

                const result = await response.json();
                console.log("Game created successfully:", result);

                formInputs.forEach(input => {
                    if (input) input.value = "";
                });

                await fetchPrivateGames();
                resetScreenDisplays(gameSelectContent);
            } catch (error) {
                console.error("Error creating game:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = error.message;
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
                confirmBtn.classList.remove("loading");
                keepKeyboardOpen();
            }
        }, 100);
        confirmBtn.addEventListener("click", handler);
        confirmBtn.addEventListener("touchstart", handler);
    }

    // Fetch official games
    async function fetchOfficialGames() {
        console.log("Fetching official games from:", officialUrl);
        try {
            const response = await fetch(officialUrl);
            if (!response.ok) throw new Error("Failed to fetch official games.");
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    allGames = result.data;
                    console.log("Official games fetched:", allGames.length);
                    allGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
                    displayGameList();
                    const urlParams = new URLSearchParams(window.location.search);
                    const gameNum = urlParams.get("game");
                    if (gameNum && !isNaN(gameNum)) {
                        const game = allGames.find(g => g["Game Number"] === gameNum);
                        if (game) {
                            console.log("Loading game from URL parameter:", gameNum);
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            preloadBackground(currentBackground).then(() => {
                                loadGame(game);
                                resetScreenDisplays(gameScreen);
                                adjustBackground();
                                updateArrowStates(allGames.findIndex(g => g["Game Number"] === gameNum), allGames);
                                ensureInitialFocus(); // Ensure keyboard on load
                            });
                        } else {
                            loadLatestGame();
                        }
                    } else {
                        loadLatestGame();
                    }
                },
                error: (error) => {
                    console.error("Error parsing official games CSV:", error);
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "Failed to load games.";
                        formErrorDialog.style.display = "flex";
                    }
                }
            });
        } catch (error) {
            console.error("Error fetching official games:", error.message);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load games.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Fetch private games
    async function fetchPrivateGames() {
        console.log("Fetching private games from:", privateUrl);
        try {
            const response = await fetch(privateUrl);
            if (!response.ok) throw new Error("Failed to fetch private games.");
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    privateGames = result.data;
                    console.log("Private games fetched:", privateGames.length);
                    displayGameList();
                },
                error: (error) => {
                    console.error("Error parsing private games CSV:", error);
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "Failed to load private games.";
                        formErrorDialog.style.display = "flex";
                    }
                }
            });
        } catch (error) {
            console.error("Error fetching private games:", error.message);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load private games.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Display game list
    function displayGameList() {
        console.log("Displaying game list", { officialTabActive: officialTab.classList.contains("active") });
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");

        if (officialList && officialTab.classList.contains("active")) {
            officialList.innerHTML = "";
            allGames.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                const gameNumber = `Game #${game["Game Number"]}`;
                const gameName = game["Game Name"] || "";
                const displayName = gameName ? `${gameNumber} - ${gameName}` : gameNumber;
                const result = gameResults[`pineapple_${game["Game Number"]}`] || { status: "Not Played" };
                const resultClass = result.status === "Gave Up" || result.status === "X/5" ? "gave-up" : "";
                row.innerHTML = `
                    <span>${displayName}</span>
                    <span class="result ${resultClass}">${result.status !== "Not Played" ? result.status : "Play Now"}</span>
                `;
                const resultSpan = row.querySelector(".result");
                if (result.status === "Not Played" && resultSpan) {
                    resultSpan.classList.add("play-now");
                    const handler = debounce(async (e) => {
                        e.preventDefault();
                        console.log("Play Now triggered for game:", gameNumber);
                        if (isUILocked || isLoadingGame) return;
                        isUILocked = true;
                        isLoadingGame = true;
                        try {
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            adjustBackground();
                            updateArrowStates(allGames.findIndex(g => g["Game Number"] === game["Game Number"]), allGames);
                        } catch (error) {
                            console.error("Error loading game:", error.message);
                            if (formErrorDialog && formErrorMessage) {
                                formErrorMessage.textContent = "Failed to load game.";
                                formErrorDialog.style.display = "flex";
                            }
                        } finally {
                            isUILocked = false;
                            isLoadingGame = false;
                            keepKeyboardOpen();
                        }
                    }, 100);
                    resultSpan.addEventListener(isMobile ? "touchstart" : "click", handler);
                    row.addEventListener("touchstart", (e) => {
                        touchStartX = e.touches[0].clientX;
                        touchStartY = e.touches[0].clientY;
                        touchMoved = false;
                    });
                    row.addEventListener("touchmove", () => {
                        touchMoved = true;
                    });
                    row.addEventListener("touchend", (e) => {
                        const touchEndX = e.changedTouches[0].clientX;
                        const touchEndY = e.changedTouches[0].clientY;
                        const deltaX = Math.abs(touchEndX - touchStartX);
                        const deltaY = Math.abs(touchEndY - touchStartY);
                        if (!touchMoved && deltaX < touchThreshold && deltaY < touchThreshold) {
                            handler(e);
                        }
                    });
                }
                officialList.appendChild(row);
            });
        }

        if (privateList && privateTab.classList.contains("active")) {
            privateList.innerHTML = "";
            privateGames.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                const gameNumber = game["Game Number"];
                const gameName = game["Game Name"] || "";
                const displayName = gameName ? `${gameNumber} - ${gameName}` : gameNumber;
                const result = gameResults[`privatePineapple_${gameNumber}`] || { status: "Not Played" };
                const resultClass = result.status === "Gave Up" || result.status === "X/5" ? "gave-up" : "";
                row.innerHTML = `
                    <span>${displayName}</span>
                    <span class="result ${resultClass}">${result.status !== "Not Played" ? result.status : "Play Now"}</span>
                `;
                const resultSpan = row.querySelector(".result");
                if (result.status === "Not Played" && resultSpan) {
                    resultSpan.classList.add("play-now");
                    const handler = debounce(async (e) => {
                        e.preventDefault();
                        console.log("Play Now triggered for private game:", gameNumber);
                        if (isUILocked || isLoadingGame) return;
                        isUILocked = true;
                        isLoadingGame = true;
                        try {
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            adjustBackground();
                            updateArrowStates(privateGames.findIndex(g => g["Game Number"] === gameNumber), privateGames);
                        } catch (error) {
                            console.error("Error loading private game:", error.message);
                            if (formErrorDialog && formErrorMessage) {
                                formErrorMessage.textContent = "Failed to load game.";
                                formErrorDialog.style.display = "flex";
                            }
                        } finally {
                            isUILocked = false;
                            isLoadingGame = false;
                            keepKeyboardOpen();
                        }
                    }, 100);
                    resultSpan.addEventListener(isMobile ? "touchstart" : "click", handler);
                    row.addEventListener("touchstart", (e) => {
                        touchStartX = e.touches[0].clientX;
                        touchStartY = e.touches[0].clientY;
                        touchMoved = false;
                    });
                    row.addEventListener("touchmove", () => {
                        touchMoved = true;
                    });
                    row.addEventListener("touchend", (e) => {
                        const touchEndX = e.changedTouches[0].clientX;
                        const touchEndY = e.changedTouches[0].clientY;
                        const deltaX = Math.abs(touchEndX - touchStartX);
                        const deltaY = Math.abs(touchEndY - touchStartY);
                        if (!touchMoved && deltaX < touchThreshold && deltaY < touchThreshold) {
                            handler(e);
                        }
                    });
                }
                privateList.appendChild(row);
            });
        }
    }

    // Load latest game
    async function loadLatestGame() {
        console.log("Loading latest game");
        if (allGames.length > 0) {
            const latestGame = allGames[0];
            currentBackground = latestGame["Background"] && latestGame["Background"].trim() !== "" ? latestGame["Background"] : defaultBackground;
            await preloadBackground(currentBackground);
            loadGame(latestGame);
            resetScreenDisplays(gameScreen);
            adjustBackground();
            updateArrowStates(0, allGames);
            ensureInitialFocus(); // Ensure keyboard on load
        } else {
            console.error("No games available to load");
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "No games available.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Update arrow states
    function updateArrowStates(currentIndex, gameList) {
        console.log("Updating arrow states", { currentIndex, totalGames: gameList.length });
        if (prevGameArrow && nextGameArrow) {
            prevGameArrow.classList.toggle("disabled", currentIndex >= gameList.length - 1);
            nextGameArrow.classList.toggle("disabled", currentIndex <= 0);
        }
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select screen");
        resetScreenDisplays(gameSelectContent);
        displayGameList();
    }

    // Load game
    function loadGame(game) {
        console.log("Loading game:", game);
        gameOver = false;
        guessInput.disabled = false;
        guessBtn.disabled = false;
        guessCount = 0;
        gaveUp = false;
        guesses = [];
        firstGuessMade = false;
        hintIndex = 0;
        secretWord = game["Secret Word"]?.trim().toUpperCase() || "";
        currentGameId = game["Game Number"];
        currentGameNumber = game["Game Name"] && game["Game Name"].trim() !== ""
            ? `${game["Game Number"]} - ${game["Game Name"]}`
            : game["Game Number"].includes("- Private")
                ? game["Game Number"]
                : `Game #${game["Game Number"]}`;
        gameNumberText.textContent = currentGameNumber;
        guessesLink.textContent = `Guesses: 0/5`;

        hints = [
            game["Hint 1"]?.trim().toUpperCase() || "",
            game["Hint 2"]?.trim().toUpperCase() || "",
            game["Hint 3"]?.trim().toUpperCase() || "",
            game["Hint 4"]?.trim().toUpperCase() || "",
            game["Hint 5"]?.trim().toUpperCase() || ""
        ].filter(hint => hint);

        console.log("Game loaded", { secretWord, hints, currentGameNumber, currentGameId });

        // Clear previous hints
        const hintsList = document.getElementById("hints-list");
        if (hintsList) {
            hintsList.innerHTML = "";
        }

        // Display initial hint
        if (hints.length > 0) {
            displayHint();
        }

        gameScreen.classList.remove("game-ended");
        guessInput.value = "";
        setTimeout(ensureInitialFocus, 100);
    }

    // Display hint
    function displayHint() {
        console.log("Displaying hint:", hintIndex + 1);
        if (hintIndex < hints.length) {
            const hintsList = document.getElementById("hints-list");
            if (hintsList) {
                const hintElement = document.createElement("div");
                hintElement.textContent = hints[hintIndex];
                hintsList.appendChild(hintElement);
                hintElement.style.opacity = 0;
                hintElement.style.transform = "scale(0.8)";
                setTimeout(() => {
                    hintElement.style.transition = "opacity 0.5s ease, transform 0.5s ease";
                    hintElement.style.opacity = 1;
                    hintElement.style.transform = "scale(1)";
                }, 50);
                console.log(`Hint ${hintIndex + 1} displayed: ${hints[hintIndex]}`);
                hintIndex++;
            } else {
                console.error("Hints list element not found");
            }
        }
    }

    // Handle guess
    async function handleGuess(guess) {
        console.log("Handling guess:", guess, { isProcessingGuess, gameOver });
        if (isProcessingGuess || gameOver) return;
        isProcessingGuess = true;
        guessBtn.disabled = true; // Disable button to prevent multiple submissions

        try {
            if (!/^[A-Z\s]+$/.test(guess)) {
                console.log("Invalid guess, only letters and spaces allowed");
                guessInputContainer.classList.add("wrong-guess");
                animationTimeout = setTimeout(() => {
                    guessInputContainer.classList.remove("wrong-guess");
                    animationTimeout = null;
                    isProcessingGuess = false;
                    guessBtn.disabled = false;
                    if (document.activeElement !== guessInput) {
                        guessInput.focus(); // Maintain focus
                        activeInput = guessInput;
                    }
                    if (isMobile) {
                        guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                    keepKeyboardOpen(); // Ensure keyboard stays open
                }, 350);
                return;
            }

            guessCount++;
            guesses.push(guess);
            guessesLink.textContent = `Guesses: ${guessCount}/5`;
            console.log("Guess recorded", { guessCount, guesses });

            if (guess === secretWord) {
                console.log("Correct guess!");
                let normalizedGameNumber;
                let gameType;
                if (currentGameNumber.includes("- Private")) {
                    normalizedGameNumber = currentGameId;
                    gameType = "privatePineapple";
                } else {
                    normalizedGameNumber = currentGameNumber.replace("Game #", "");
                    gameType = "pineapple";
                }
                saveGameResult(gameType, normalizedGameNumber, secretWord, `${guessCount}/5`);
                guessInput.value = ""; // Clear input only on correct guess
                endGame(true);
                return;
            } else {
                console.log("Incorrect guess");
                guessInputContainer.classList.add("wrong-guess");
                animationTimeout = setTimeout(() => {
                    guessInputContainer.classList.remove("wrong-guess");
                    animationTimeout = null;
                    if (guessCount >= 5) {
                        let normalizedGameNumber;
                        let gameType;
                        if (currentGameNumber.includes("- Private")) {
                            normalizedGameNumber = currentGameId;
                            gameType = "privatePineapple";
                        } else {
                            normalizedGameNumber = currentGameNumber.replace("Game #", "");
                            gameType = "pineapple";
                        }
                        saveGameResult(gameType, normalizedGameNumber, secretWord, "X/5");
                        guessInput.value = ""; // Clear input only on game end
                        endGame(false);
                    } else {
                        displayHint();
                    }
                    isProcessingGuess = false;
                    guessBtn.disabled = false;
                    if (document.activeElement !== guessInput) {
                        guessInput.focus(); // Maintain focus
                        activeInput = guessInput;
                    }
                    if (isMobile) {
                        guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                    keepKeyboardOpen(); // Ensure keyboard stays open
                }, 350);
                return;
            }
        } catch (error) {
            console.error("Error handling guess:", error.message);
            guessInputContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                animationTimeout = null;
                isProcessingGuess = false;
                guessBtn.disabled = false;
                if (document.activeElement !== guessInput) {
                    guessInput.focus(); // Maintain focus
                    activeInput = guessInput;
                }
                if (isMobile) {
                    guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
                keepKeyboardOpen(); // Ensure keyboard stays open
            }, 350);
        }
    }

    // Save game result
    function saveGameResult(gameType, gameNumber, secretWord, status) {
        console.log("Saving game result", { gameType, gameNumber, secretWord, status });
        gameResults[`${gameType}_${gameNumber}`] = { secretWord, status };
        localStorage.setItem("gameResults", JSON.stringify(gameResults));
        console.log("Game results updated:", gameResults);
    }

    // End game
    function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp });
        gameOver = true;
        guessBtn.disabled = true;
        guessInput.disabled = true;
        gameScreen.classList.add("game-ended");

        const gameOverScreen = document.getElementById("game-over");
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");

        if (gameOverScreen && shareText && gameNumberDisplay) {
            gameOverScreen.style.display = "flex";
            gameNumberDisplay.textContent = currentGameNumber;
            shareText.innerHTML = gaveUp
                ? `I gave up on <span class="guess-count">WORDY ${currentGameNumber}</span> 😔`
                : won
                    ? `I solved <span class="guess-count">WORDY ${currentGameNumber}</span> in ${guessCount}/5! 🥳`
                    : `I couldn't solve <span class="guess-count">WORDY ${currentGameNumber}</span> 😔`;

            const shareMessage = gaveUp
                ? `I gave up on WORDY ${currentGameNumber} 😔\nPlay it at: https://wordy.bigbraingames.net`
                : won
                    ? `I solved WORDY ${currentGameNumber} in ${guessCount}/5! 🥳\nPlay it at: https://wordy.bigbraingames.net`
                    : `I couldn't solve WORDY ${currentGameNumber} 😔\nPlay it at: https://wordy.bigbraingames.net`;

            const shareButtons = [
                { id: "share-whatsapp", url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}` },
                { id: "share-telegram", url: `https://t.me/share/url?url=https://wordy.bigbraingames.net&text=${encodeURIComponent(shareMessage)}` },
                { id: "share-twitter", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}` },
                { id: "share-instagram", url: "#" }
            ];

            shareButtons.forEach(button => {
                const element = document.getElementById(button.id);
                if (element) {
                    element.href = button.url;
                    if (button.id === "share-instagram") {
                        element.addEventListener("click", (e) => {
                            e.preventDefault();
                            console.log("Instagram sharing not supported via URL, copying share message");
                            navigator.clipboard.writeText(shareMessage).then(() => {
                                alert("Share message copied to clipboard! Paste it in Instagram.");
                            }).catch(err => {
                                console.error("Failed to copy share message:", err);
                            });
                        });
                    }
                }
            });

            if (won && !gaveUp) {
                const pineappleRain = document.createElement("div");
                pineappleRain.className = "pineapple-rain";
                document.body.appendChild(pineappleRain);

                for (let i = 0; i < 30; i++) {
                    const pineapple = document.createElement("div");
                    pineapple.className = "pineapple-piece";
                    pineapple.textContent = "🍍";
                    pineapple.style.left = `${Math.random() * 100}vw`;
                    pineapple.style.animationDuration = `${Math.random() * 2 + 1}s`;
                    pineapple.style.animationDelay = `${Math.random() * 0.5}s`;
                    pineapple.style.setProperty('--drift', Math.random() * 2 - 1);
                    pineapple.style.setProperty('--rotation', `${Math.random() * 360}deg`);
                    pineappleRain.appendChild(pineapple);
                }

                setTimeout(() => {
                    pineappleRain.remove();
                }, 3000);
            }

            resetScreenDisplays(gameOverScreen);
        } else {
            console.error("Game over elements not found");
        }
    }

    // Initial setup
    await fetchOfficialGames();
    console.log("Initial setup completed");
});