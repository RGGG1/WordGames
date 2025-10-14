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
    let isProcessingGuess = false;
    let isLoadingGame = false;
    let isUILocked = false;
    let guesses = [];
    let animationTimeout = null;
    let activeInput = null;
    let currentBackground = "newbackground.png";
    let gameResults = JSON.parse(localStorage.getItem("gameResults")) || {};
    let cumulativeScore = parseInt(localStorage.getItem("cumulativeScore")) || 500; // Persistent cumulative only
    let gameStates = JSON.parse(localStorage.getItem("gameStates")) || {};
    let pendingScoreAddition = 0; // For correct guess addition

    // DOM elements
    const gameContainer = document.getElementById("game-container");
    const createPineappleBtn = document.getElementById("create-pineapple");
    const formContent = document.getElementById("form-content");
    const confirmBtn = document.getElementById("confirm-btn");
    const formBackBtn = document.getElementById("form-back-btn");
    const nextGameBtnEnd = document.getElementById("next-game-btn-end");
    const officialBackBtn = document.getElementById("official-back-btn");
    const privateBackBtn = document.getElementById("private-back-btn");
    const guessesList = document.getElementById("guesses-list");
    const prevImageArrow = document.getElementById("prev-image-arrow");
    const nextImageArrow = document.getElementById("next-image-arrow");
    const gameNumberText = document.getElementById("game-number-text");
    const scoreText = document.getElementById("score");
    const guessInput = document.getElementById("guess-input");
    const guessSection = document.getElementById("guess-section");
    const guessArea = document.getElementById("guess-area");
    const guessInputContainer = document.getElementById("guess-input-container");
    const incorrectGuessIndicator = document.getElementById("incorrect-guess-indicator");
    const formErrorDialog = document.getElementById("form-error-dialog");
    const formErrorOkBtn = document.getElementById("form-error-ok-btn");
    const formErrorMessage = formErrorDialog?.querySelector(".dialog-message");
    const officialTab = document.getElementById("official-tab");
    const privateTab = document.getElementById("private-tab");
    const officialContent = document.getElementById("official-games");
    const privateContent = document.getElementById("private-games");
    const shareSection = document.getElementById("share-section");
    const gameNameElement = document.getElementById("game-name");
    const backgroundImageContainer = document.getElementById("background-image-container");
    const hintsContainer = document.getElementById("hints-container");
    const guessesSection = document.getElementById("guesses-section");
    const backgroundImage = document.getElementById("background-image");
    const hintsList = document.getElementById("hints-list");
    const gameOverScreen = document.getElementById("game-over"); // Added for inline reference
    const congratsMessage = document.getElementById("congrats-message");

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

    // Animate score change
    function animateScoreChange(start, end, isDeduction = false, isAddition = false, duration = 800) {
        const steps = 30;
        const increment = (end - start) / steps;
        let current = start;
        let stepCount = 0;

        if (isDeduction) {
            scoreText.classList.add("deducting");
        } else if (isAddition) {
            scoreText.classList.add("adding");
        }

        const interval = setInterval(() => {
            current += increment;
            scoreText.textContent = `🍍 ${Math.round(current)}`;
            stepCount++;
            if (stepCount >= steps) {
                clearInterval(interval);
                scoreText.textContent = `🍍 ${end}`;
                scoreText.classList.remove("deducting", "adding");
            }
        }, duration / steps);
    }

    // Adjust background and layout
    function adjustBackground() {
        console.log("Adjusting background and layout");
        const backgroundImage = document.getElementById("background-image");
        if (window.visualViewport) {
            const viewportHeight = window.visualViewport.height;
            console.log("Visual viewport height:", viewportHeight);
            document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
            if (gameContainer) {
                gameContainer.style.minHeight = `${viewportHeight}px`;
            }
        } else {
            const fallbackHeight = window.innerHeight;
            console.log("Using fallback height:", fallbackHeight);
            document.documentElement.style.setProperty('--viewport-height', `${fallbackHeight}px`);
            if (gameContainer) {
                gameContainer.style.minHeight = `${fallbackHeight}px`;
            }
        }
        if (backgroundImage) backgroundImage.offsetHeight;
    }

    // Ensure keyboard stays open
    function keepKeyboardOpen() {
        if (
            gameContainer.style.display !== "none" &&
            !gameOver &&
            !isProcessingGuess &&
            !isUILocked &&
            !document.querySelector('.screen.active') &&
            !document.querySelector('.dialog[style*="display: flex"]')
        ) {
            console.log("Ensuring keyboard stays open by focusing guess input");
            if (document.activeElement !== guessInput) {
                guessInput.disabled = false;
                guessInput.focus();
                activeInput = guessInput;
                if (isMobile) {
                    guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    setTimeout(() => {
                        if (document.activeElement !== guessInput) {
                            console.log("Refocusing guess input to keep keyboard open");
                            guessInput.disabled = false;
                            guessInput.focus();
                        }
                    }, 50);
                }
            }
        }
    }

    // Ensure initial focus on game load
    function ensureInitialFocus() {
        if (guessInput && !gameOver && !isProcessingGuess && gameContainer.style.display !== "none") {
            console.log("Attempting initial focus on guess input");
            guessInput.disabled = false;
            guessInput.focus();
            activeInput = guessInput;
            if (isMobile) {
                guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                const touchEvent = new Event('touchstart', { bubbles: true });
                guessInput.dispatchEvent(touchEvent);
                setTimeout(() => {
                    if (document.activeElement !== guessInput) {
                        console.log("Initial focus failed, retrying");
                        guessInput.disabled = false;
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
        if (!initialTouchHandled && !gameOver && !isProcessingGuess && !isUILocked && gameContainer.style.display !== "none" && !e.target.closest('.screen, .dialog')) {
            console.log("First document touch, focusing guess input");
            guessInput.disabled = false;
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
            !gameOver &&
            !isProcessingGuess &&
            !isUILocked &&
            gameContainer.style.display !== "none" &&
            !e.target.closest('.screen, .dialog')
        ) {
            console.log("Global click detected, refocusing guess input");
            guessInput.disabled = false;
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
            resetScreenDisplays(gameContainer);
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
        guessInput.addEventListener("input", () => {
            console.log("Guess input value changed:", guessInput.value);
            guessInput.value = guessInput.value.toUpperCase();
            if (animationTimeout) {
                clearTimeout(animationTimeout);
                animationTimeout = null;
                guessInputContainer.classList.remove("wrong-guess");
                incorrectGuessIndicator.style.display = "none";
                isProcessingGuess = false;
            }
        });
        const enterHandler = (e) => {
            if (e.key === "Enter" && !gameOver && !guessInput.disabled && !isProcessingGuess) {
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Guess submitted via Enter:", guess);
                    handleGuess(guess);
                }
            }
        };
        guessInput.addEventListener("keydown", enterHandler);
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
            guessInput.disabled = false;
            guessInput.focus();
            activeInput = guessInput;
            adjustBackground();
            if (isMobile) {
                guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                setTimeout(() => {
                    if (document.activeElement !== guessInput) {
                        guessInput.disabled = false;
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
                guessInput.disabled = false;
                guessInput.focus();
                activeInput = guessInput;
                adjustBackground();
                if (isMobile) {
                    guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    setTimeout(() => {
                        if (document.activeElement !== guessInput) {
                            guessInput.disabled = false;
                            guessInput.focus();
                        }
                    }, 100);
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
                guessInput.disabled = false;
                guessInput.focus();
                activeInput = guessInput;
                if (isMobile) {
                    guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    setTimeout(() => {
                        if (document.activeElement !== guessInput) {
                            guessInput.disabled = false;
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

    // Setup guess section
    if (guessSection) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guess section triggered");
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                guessInput.disabled = false;
                guessInput.focus();
                activeInput = guessInput;
                if (isMobile) {
                    guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    setTimeout(() => {
                        if (document.activeElement !== guessInput) {
                            guessInput.disabled = false;
                            guessInput.focus();
                        }
                    }, 100);
                }
                adjustBackground();
            }
        };
        guessSection.addEventListener("click", handler);
        guessSection.addEventListener("touchstart", handler);
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
        const screens = [formErrorDialog, formContent];
        // Removed game-over from screens as it's now inline

        screens.forEach(screen => {
            if (screen && screen !== activeScreen) {
                screen.style.display = "none";
                screen.classList.remove("active");
            }
        });

        if (activeScreen === gameContainer) {
            gameContainer.style.display = "flex";
            gameOverScreen.style.display = "none";
            guessArea.style.display = "flex";
            backgroundImageContainer.classList.remove("hidden");
            hintsContainer.classList.remove("hidden");
            guessesSection.classList.remove("hidden");
            backgroundImageContainer.classList.remove("end-game"); // New: unhide image
            setTimeout(() => {
                ensureInitialFocus();
                keepKeyboardOpen();
            }, 100);
        } else if (activeScreen === formContent) {
            activeScreen.style.display = "flex";
            activeScreen.classList.add("active");
            if (activeInput) setTimeout(() => activeInput.focus(), 0);
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

    // Previous image arrow
    if (prevImageArrow) {
        prevImageArrow.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            console.log("Previous image arrow triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            isLoadingGame = true;
            prevImageArrow.classList.add("loading");
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
                    loadGame(targetGame);
                    resetScreenDisplays(gameContainer);
                    adjustBackground();
                    updateArrowStates(currentIndex + 1, gameList);
                } else {
                    prevImageArrow.classList.add("disabled");
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
                prevImageArrow.classList.remove("loading");
                keepKeyboardOpen();
            }
        });
    }

    // Next image arrow
    if (nextImageArrow) {
        nextImageArrow.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            console.log("Next image arrow triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            isLoadingGame = true;
            nextImageArrow.classList.add("loading");
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
                    loadGame(targetGame);
                    resetScreenDisplays(gameContainer);
                    adjustBackground();
                    updateArrowStates(currentIndex - 1, gameList);
                } else {
                    nextImageArrow.classList.add("disabled");
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
                nextImageArrow.classList.remove("loading");
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

    // Form Back button
    if (formBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            console.log("Form Back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(gameContainer);
            document.getElementById("all-games-section").scrollIntoView({ behavior: "smooth", block: "start" });
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
            resetScreenDisplays(gameContainer);
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
            resetScreenDisplays(gameContainer);
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

    // Next Game End button - loads next unplayed game
    if (nextGameBtnEnd) {
        const handler = debounce(async (e) => {
            e.preventDefault();
            console.log("Next Game End button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            isLoadingGame = true;
            nextGameBtnEnd.classList.add("loading");
            try {
                let nextGame = null;
                let isPrivate = currentGameNumber.includes("- Private");
                
                // First try to find unplayed game in current list
                let gameList = isPrivate ? privateGames : allGames;
                let currentIndex = gameList.findIndex(game => {
                    return isPrivate ? 
                        game["Game Number"] === currentGameId : 
                        game["Game Number"] === currentGameNumber.replace("Game #", "");
                });
                
                // Look for next unplayed game after current index
                for (let i = 0; i < gameList.length; i++) {
                    const index = (currentIndex + i + 1) % gameList.length;
                    const gameKey = isPrivate ? 
                        `privatePineapple_${gameList[index]["Game Number"]}` : 
                        `pineapple_${gameList[index]["Game Number"]}`;
                    if (!gameResults[gameKey] || gameResults[gameKey].status === "Not Played") {
                        nextGame = gameList[index];
                        break;
                    }
                }
                
                // If no unplayed games in current list, try the other list
                if (!nextGame) {
                    const otherList = isPrivate ? allGames : privateGames;
                    for (let game of otherList) {
                        const gameKey = isPrivate ? 
                            `pineapple_${game["Game Number"]}` : 
                            `privatePineapple_${game["Game Number"]}`;
                        if (!gameResults[gameKey] || gameResults[gameKey].status === "Not Played") {
                            nextGame = game;
                            break;
                        }
                    }
                }
                
                if (nextGame) {
                    console.log("Loading next unplayed game:", nextGame);
                    currentBackground = nextGame["Background"] && nextGame["Background"].trim() !== "" ? nextGame["Background"] : defaultBackground;
                    loadGame(nextGame);
                    resetScreenDisplays(gameContainer);
                    adjustBackground();
                } else {
                    throw new Error("No unplayed games available");
                }
            } catch (error) {
                console.error("Error loading next game:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "No unplayed games available.";
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
                resetScreenDisplays(gameContainer);
                document.getElementById("all-games-section").scrollIntoView({ behavior: "smooth", block: "start" });
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
                            loadGame(game);
                            resetScreenDisplays(gameContainer);
                            adjustBackground();
                            updateArrowStates(allGames.findIndex(g => g["Game Number"] === gameNum), allGames);
                            ensureInitialFocus();
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
                let displayResult = "Play Now";
                let resultClass = "play-now";
                if (result.status !== "Not Played") {
                    if (result.status === "X/5") {
                        displayResult = "X";
                        resultClass = "lost";
                    } else {
                        const guesses = parseInt(result.status.split("/")[0]);
                        const points = [500, 400, 300, 200, 100][guesses - 1] || 100;
                        displayResult = `${points}`;
                        resultClass = "";
                    }
                }
                row.innerHTML = `
                    <span>${displayName}</span>
                    <span class="result ${resultClass}">${displayResult}</span>
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
                            loadGame(game);
                            resetScreenDisplays(gameContainer);
                            adjustBackground();
                            updateArrowStates(allGames.findIndex(g => g["Game Number"] === game["Game Number"]), allGames);
                            document.getElementById("game-container").scrollIntoView({ behavior: "smooth", block: "start" });
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
                let displayResult = "Play Now";
                let resultClass = "play-now";
                if (result.status !== "Not Played") {
                    if (result.status === "X/5") {
                        displayResult = "X";
                        resultClass = "lost";
                    } else {
                        const guesses = parseInt(result.status.split("/")[0]);
                        const points = [500, 400, 300, 200, 100][guesses - 1] || 100;
                        displayResult = `${points}`;
                        resultClass = "";
                    }
                }
                row.innerHTML = `
                    <span>${displayName}</span>
                    <span class="result ${resultClass}">${displayResult}</span>
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
                            loadGame(game);
                            resetScreenDisplays(gameContainer);
                            adjustBackground();
                            updateArrowStates(privateGames.findIndex(g => g["Game Number"] === gameNumber), privateGames);
                            document.getElementById("game-container").scrollIntoView({ behavior: "smooth", block: "start" });
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

    // Load the latest game
    function loadLatestGame() {
        console.log("Loading latest game");
        if (allGames.length > 0) {
            const latestGame = allGames[0];
            currentBackground = latestGame["Background"] && latestGame["Background"].trim() !== "" ? latestGame["Background"] : defaultBackground;
            loadGame(latestGame);
            resetScreenDisplays(gameContainer);
            adjustBackground();
            updateArrowStates(0, allGames);
            ensureInitialFocus();
        } else {
            console.error("No games available to load");
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "No games available.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Load a specific game
    function loadGame(game) {
        console.log("Loading game:", game);
        secretWord = game["Secret Word"]?.trim().toUpperCase() || "";
        hints = [
            game["Hint 1"]?.trim().toUpperCase() || "",
            game["Hint 2"]?.trim().toUpperCase() || "",
            game["Hint 3"]?.trim().toUpperCase() || "",
            game["Hint 4"]?.trim().toUpperCase() || "",
            game["Hint 5"]?.trim().toUpperCase() || ""
        ].filter(hint => hint);
        const isPrivate = typeof game["Game Number"] === 'string' && game["Game Number"].includes("- Private");
        currentGameNumber = isPrivate ? game["Game Number"] : `Game #${game["Game Number"]}`;
        currentGameId = game["Game Number"];
        gameNumberText.textContent = currentGameNumber;
        const backgroundImage = document.getElementById("background-image");
        if (backgroundImage) {
            backgroundImage.src = currentBackground;
            backgroundImage.alt = `Background for ${currentGameNumber}`;
        }
        guessInput.value = "";
        guesses = [];
        guessCount = 0;
        hintIndex = 0;
        firstGuessMade = false;
        gameOver = false;
        
        scoreText.textContent = `🍍 ${cumulativeScore}`;
        scoreText.classList.remove("deducting", "adding");
        displayHints();
        displayGuesses();
        gameOverScreen.style.display = "none"; // Hide end screen on load
        hintsContainer.classList.remove("hidden");
        guessesSection.classList.remove("hidden");
        backgroundImageContainer.classList.remove("end-game"); // Unhide image
        resetScreenDisplays(gameContainer);

        // Load saved game state
        const gameKey = isPrivate ? `privatePineapple_${currentGameId}` : `pineapple_${currentGameNumber.replace("Game #", "")}`;
        if (gameStates[gameKey]) {
            guesses = gameStates[gameKey].guesses || [];
            guessCount = guesses.length;
            hintIndex = guesses.length;
            firstGuessMade = guessCount > 0;
            cumulativeScore = gameStates[gameKey].cumulativeScore || cumulativeScore;
            localStorage.setItem("cumulativeScore", cumulativeScore);
            displayHints();
            displayGuesses();
            if (gameResults[gameKey] && gameResults[gameKey].status !== "Not Played") {
                endGame(gameResults[gameKey].status);
            }
        }
        scoreText.textContent = `🍍 ${cumulativeScore}`;
        if (guessInput) {
            const enterHandler = (e) => {
                if (e.key === "Enter" && !gameOver && !guessInput.disabled && !isProcessingGuess) {
                    const guess = guessInput.value.trim().toUpperCase();
                    if (guess) {
                        console.log("Guess submitted via Enter:", guess);
                        handleGuess(guess);
                    }
                }
            };
            guessInput.addEventListener("keydown", enterHandler);
        }
        setTimeout(ensureInitialFocus, 100);
    }

    // Update arrow states
    function updateArrowStates(currentIndex, gameList) {
        console.log("Updating arrow states", { currentIndex, totalGames: gameList.length });
        if (prevImageArrow) {
            prevImageArrow.classList.toggle("disabled", currentIndex >= gameList.length - 1);
        }
        if (nextImageArrow) {
            nextImageArrow.classList.toggle("disabled", currentIndex <= 0);
        }
    }

    // Display hints
    function displayHints() {
        console.log("Displaying hints", { hintIndex, hints });
        if (hintsList) {
            hintsList.innerHTML = "";
            for (let i = 0; i < hintIndex; i++) {
                if (hints[i]) {
                    const hintDiv = document.createElement("div");
                    hintDiv.textContent = hints[i];
                    hintDiv.classList.add("hint-burst");
                    hintsList.appendChild(hintDiv);
                    if (i < hintIndex - 1) {
                        const separator = document.createElement("span");
                        separator.className = "hint-separator";
                        separator.textContent = "|";
                        hintsList.appendChild(separator);
                    }
                }
            }
        }
    }

    // Display guesses
    function displayGuesses() {
        console.log("Displaying guesses", { guesses });
        if (guessesList) {
            guessesList.innerHTML = "";
            if (guesses.length === 0) {
                const noGuesses = document.createElement("div");
                noGuesses.id = "no-guesses-text";
                noGuesses.textContent = "NO GUESSES YET";
                guessesList.appendChild(noGuesses);
            } else {
                guesses.forEach((guess, index) => {
                    const guessDiv = document.createElement("div");
                    guessDiv.textContent = guess;
                    guessesList.appendChild(guessDiv);
                    if (index < guesses.length - 1) {
                        const separator = document.createElement("span");
                        separator.className = "guess-separator";
                        separator.textContent = "|";
                        guessesList.appendChild(separator);
                    }
                });
            }
        }
    }

    // Handle guess
    async function handleGuess(guess) {
        console.log("Handling guess:", guess);
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored", { isProcessingGuess, gameOver });
            return;
        }
        isProcessingGuess = true;
        const oldScore = cumulativeScore;
        const isPrivate = currentGameNumber.includes("- Private");
        const gameKey = isPrivate ? `privatePineapple_${currentGameId}` : `pineapple_${currentGameNumber.replace("Game #", "")}`;

        if (!/^[A-Z\s]+$/.test(guess)) {
            console.log("Invalid guess, only letters and spaces allowed");
            guessInputContainer.classList.add("wrong-guess");
            incorrectGuessIndicator.style.display = "block";
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                incorrectGuessIndicator.style.display = "none";
                isProcessingGuess = false;
                guessInput.value = "";
                keepKeyboardOpen();
            }, 350);
            return;
        }

        guesses.push(guess);
        guessCount++;

        if (guess !== secretWord) {
            // Deduct 100 for every incorrect guess
            let newScore = oldScore - 100;
            if (newScore <= 0) {
                newScore = 500;
            }
            animateScoreChange(oldScore, newScore, true);
            cumulativeScore = newScore;
            localStorage.setItem("cumulativeScore", cumulativeScore);
        }

        // Save game state
        gameStates[gameKey] = { guesses, cumulativeScore };
        localStorage.setItem("gameStates", JSON.stringify(gameStates));

        displayGuesses();
        hintIndex = guessCount;

        if (guess === secretWord) {
            console.log("Correct guess!");
            const pointsToAdd = [500, 400, 300, 200, 100][guessCount - 1] || 0;
            const newScore = cumulativeScore + pointsToAdd;
            animateScoreChange(cumulativeScore, newScore, false, true, 1500);
            cumulativeScore = newScore;
            localStorage.setItem("cumulativeScore", cumulativeScore);
            
            gameResults[gameKey] = { status: `${guessCount}/5` };
            localStorage.setItem("gameResults", JSON.stringify(gameResults));
            
            triggerPineappleRain();
            endGame(`${guessCount}/5`);
        } else if (guessCount >= 5) {
            console.log("Game over: too many guesses");
            gameResults[gameKey] = { status: "X/5" };
            localStorage.setItem("gameResults", JSON.stringify(gameResults));
            endGame("X/5");
        } else {
            console.log("Incorrect guess, showing next hint");
            guessInputContainer.classList.add("wrong-guess");
            incorrectGuessIndicator.style.display = "block";
            displayHints();
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                incorrectGuessIndicator.style.display = "none";
                isProcessingGuess = false;
                guessInput.value = "";
                keepKeyboardOpen();
            }, 350);
        }
        displayGameList();
    }

    // End game
    function endGame(status) {
        console.log("Ending game", { status });
        gameOver = true;
        
        // Hide hints, guesses, image (keep arrows)
        hintsContainer.classList.add("hidden");
        guessesSection.classList.add("hidden");
        backgroundImageContainer.classList.add("end-game");
        
        // Show end game inline
        gameOverScreen.style.display = "flex";
        gameOverScreen.scrollIntoView({ behavior: "smooth", block: "center" });
        
        displayShareSection(status);
        adjustBackground();
    }

    // Display share section
    function displayShareSection(status) {
        console.log("Displaying share section", { status });
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");
        const secretWordDisplay = document.getElementById("secret-word-display");
        const shareWhatsApp = document.getElementById("share-whatsapp");
        const shareTelegram = document.getElementById("share-telegram");
        const shareTwitter = document.getElementById("share-twitter");
        const shareInstagram = document.getElementById("share-instagram");

        if (congratsMessage) {
            if (status !== "X/5") {
                congratsMessage.textContent = "CONGRATULATIONS";
            } else {
                congratsMessage.textContent = "Hard Luck - Play Again";
            }
        }
        if (secretWordDisplay) {
            secretWordDisplay.textContent = `Secret Word: ${secretWord}`;
        }
        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }
        if (shareText) {
            shareText.innerHTML = "";
            const isPrivate = currentGameNumber.includes("- Private");
            const gameNum = isPrivate ? currentGameId : currentGameNumber.replace("Game #", "");
            if (status === "X/5") {
                const message = document.createElement("div");
                message.textContent = `WORDY #${gameNum} was hard.`;
                shareText.appendChild(message);
                const challenge = document.createElement("div");
                challenge.textContent = "Can you solve it?";
                shareText.appendChild(challenge);
            } else {
                const guesses = parseInt(status.split("/")[0]);
                const points = [500, 400, 300, 200, 100][guesses - 1] || 100;
                const message = document.createElement("div");
                message.textContent = `I scored `;
                const scoreSpan = document.createElement("span");
                scoreSpan.className = "guess-count";
                scoreSpan.textContent = `${points}`;
                message.appendChild(scoreSpan);
                message.appendChild(document.createTextNode(` for WORDY #${gameNum}.`));
                shareText.appendChild(message);
                const challenge = document.createElement("div");
                challenge.textContent = "Can you beat it?";
                shareText.appendChild(challenge);
            }
        }

        const isPrivate = currentGameNumber.includes("- Private");
        const gameNum = isPrivate ? currentGameId : currentGameNumber.replace("Game #", "");
        const points = status === "X/5" ? "" : [500, 400, 300, 200, 100][parseInt(status.split("/")[0]) - 1] || 100;
        const shareMessage = status === "X/5"
            ? `WORDY #${gameNum} was hard.\nCan you solve it?`
            : `I scored ${points} for WORDY #${gameNum}.\nCan you beat it?`;

        if (shareWhatsApp) {
            shareWhatsApp.href = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        }
        if (shareTelegram) {
            shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(`https://wordy.bigbraingames.net/?game=${gameNum}`)}&text=${encodeURIComponent(shareMessage)}`;
        }
        if (shareTwitter) {
            shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
        }
        if (shareInstagram) {
            shareInstagram.href = `https://www.instagram.com/?url=${encodeURIComponent(`https://wordy.bigbraingames.net/?game=${gameNum}`)}`;
        }
    }

    // Trigger pineapple rain animation
    function triggerPineappleRain() {
        console.log("Triggering pineapple rain");
        const container = document.createElement("div");
        container.className = "pineapple-rain";
        document.body.appendChild(container);
        const numPieces = isMobile ? 60 : 150;
        for (let i = 0; i < numPieces; i++) {
            const piece = document.createElement("div");
            piece.className = "pineapple-piece";
            piece.textContent = "🍍";
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.animationDuration = `${Math.random() * 2 + 2}s`;
            piece.style.animationDelay = `${Math.random() * 0.5}s`;
            piece.style.setProperty("--drift", Math.random() * 2 - 1);
            piece.style.setProperty("--rotation", `${Math.random() * 360}deg`);
            piece.style.setProperty("--fall-distance", Math.random() * 0.2 + 0.8);
            container.appendChild(piece);
        }
        setTimeout(() => {
            container.remove();
        }, 3000);
    }

    // Initialize the game
    console.log("Initializing game");
    scoreText.textContent = `🍍 ${cumulativeScore}`;
    await fetchOfficialGames();
    adjustBackground();
    ensureInitialFocus();
});