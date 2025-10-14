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
    const gameOverScreen = document.getElementById("game-over"); // New reference

    // URLs
    const officialUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiz6IVPR4cZB9JlbNPC1Km5Jls5wsW3i-G9WYLppmnfPDz2kxb0I-g1BY50wFzuJ0aYgYdyub6VpCd/pub?output=csv";
    const privateUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIMKVHVz5EaVdJ5YfZJwLW72R9aI1Si9p-LX7kc__5-iAMaXz2itGmffgHu0b05_IRvFFAadH64Z-M/pub?output=csv";
    const webAppUrl = "https://script.google.com/macros/s/AKfycbyF VSK9mHruHEaX_ImhUobprQczd3JOQWQ9QzK9qwN0kgaAtOLZ_wk2u8HkGifd8oS15w/exec";
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
                guessInput.focus();
                activeInput = guessInput;
                if (isMobile) {
                    guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    setTimeout(() => {
                        if (document.activeElement !== guessInput) {
                            console.log("Refocusing guess input to keep keyboard open");
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
                    guessInput.scrollIntoView({ behavior: "smooth", block: "Nearest" });
                    setTimeout(() => {
                        if (document.activeElement !== guessInput) {
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

    // Setup guess section
    if (guessSection) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guess section triggered");
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

    // Reset screen displays (simplified: only for form and all-games screens now)
    function resetScreenDisplays(activeScreen) {
        console.log("Resetting screen displays for:", activeScreen?.id);
        const screens = [formErrorDialog, formContent];
        // Note: game-over is now inline, handled separately in endGame/loadGame

        screens.forEach(screen => {
            if (screen && screen !== activeScreen) {
                screen.style.display = "none";
                screen.classList.remove("active");
            }
        });

        if (activeScreen === gameContainer) {
            gameContainer.style.display = "flex";
            gameOverScreen.style.display = "none"; // Ensure hidden
            hintsContainer.classList.remove("hidden");
            guessesSection.classList.remove("hidden");
            backgroundImageContainer.classList.remove("end-game");
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

    // Tab navigation (unchanged)
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

    // Previous image arrow (unchanged)
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

    // Next image arrow (unchanged)
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

    // Create Pineapple button (unchanged)
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

    // Form Back button (unchanged)
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

    // Official Back button (unchanged)
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

    // Private Back button (unchanged)
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

    // Form Error OK button (unchanged)
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Form Error OK button clicked");
            formErrorDialog.style.display = "none";
            keepKeyboardOpen();
        });
    }

    // Next Game End button - loads next unplayed game (unchanged logic, but resets end screen)
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

    // Confirm button for form submission (unchanged)
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

    // Fetch official games (unchanged)
    async function fetchOfficialGames() {
        // ... (same as original)
    }

    // Fetch private games (unchanged)
    async function fetchPrivateGames() {
        // ... (same as original)
    }

    // Display game list (unchanged)
    function displayGameList() {
        // ... (same as original)
    }

    // Load the latest game (unchanged)
    function loadLatestGame() {
        // ... (same as original)
    }

    // Load a specific game (updated to hide end screen)
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
        const backgroundImageEl = document.getElementById("background-image");
        if (backgroundImageEl) {
            backgroundImageEl.src = currentBackground;
            backgroundImageEl.alt = `Background for ${currentGameNumber}`;
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
        gameOverScreen.style.display = "none"; // Ensure hidden on load
        hintsContainer.classList.remove("hidden");
        guessesSection.classList.remove("hidden");
        backgroundImageContainer.classList.remove("end-game");

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
    }

    // Update arrow states (unchanged)
    function updateArrowStates(currentIndex, gameList) {
        // ... (same as original)
    }

    // Display hints (unchanged)
    function displayHints() {
        // ... (same as original)
    }

    // Display guesses (unchanged)
    function displayGuesses() {
        // ... (same as original)
    }

    // Handle guess (unchanged)
    async function handleGuess(guess) {
        // ... (same as original)
    }

    // End game (simplified: inline show, hide hints/guesses/image)
    function endGame(status) {
        console.log("Ending game", { status });
        gameOver = true;
        guessInput.disabled = true;
        
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

    // Display share section (unchanged)
    function displayShareSection(status) {
        // ... (same as original)
    }

    // Trigger pineapple rain animation (unchanged)
    function triggerPineappleRain() {
        // ... (same as original)
    }

    // Initialize the game
    console.log("Initializing game");
    scoreText.textContent = `🍍 ${cumulativeScore}`;
    await fetchOfficialGames();
    adjustBackground();
    ensureInitialFocus();
});