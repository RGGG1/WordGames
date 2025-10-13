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
    let score = 500; // Current game score
    let cumulativeScore = parseInt(localStorage.getItem("cumulativeScore")) || 500; // Persistent score
    let gameStates = JSON.parse(localStorage.getItem("gameStates")) || {};

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
    function animateScoreChange(start, end, duration = 1500) {
        const steps = 20;
        const increment = (end - start) / steps;
        let current = start;
        let stepCount = 0;

        const interval = setInterval(() => {
            current += increment;
            scoreText.textContent = `🍍 ${Math.round(current)}`;
            stepCount++;
            if (stepCount >= steps) {
                clearInterval(interval);
                scoreText.textContent = `🍍 ${end}`;
                scoreText.classList.remove(end < start ? "flash-red" : "flash-green");
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
                    guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

    // Reset screen displays
    function resetScreenDisplays(activeScreen) {
        console.log("Resetting screen displays for:", activeScreen?.id);
        const screens = [formErrorDialog, formContent, document.getElementById("game-over")];
        const hintsContainer = document.getElementById("hints-container");
        const guessesSection = document.getElementById("guesses-section");

        screens.forEach(screen => {
            if (screen && screen !== activeScreen) {
                screen.style.display = "none";
                screen.classList.remove("active");
            }
        });

        if (activeScreen === gameContainer) {
            gameContainer.style.display = "flex";
            guessArea.style.display = "flex";
            if (hintsContainer) hintsContainer.classList.remove("hidden");
            if (guessesSection) guessesSection.classList.remove("hidden");
            setTimeout(() => {
                ensureInitialFocus();
                keepKeyboardOpen();
            }, 100);
        } else if (activeScreen === formContent || activeScreen.id === "game-over") {
            activeScreen.style.display = "flex";
            activeScreen.classList.add("active");
            if (hintsContainer) hintsContainer.classList.add("hidden");
            if (guessesSection) guessesSection.classList.add("hidden");
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
                    loadGame(targetGame);
                    resetScreenDisplays(gameContainer);
                    adjustBackground();
                    updateArrowStates(currentIndex - 1, gameList);
                } else {
                    nextImageArrow.classList.add("disabled");
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

    // Load latest game
    async function loadLatestGame() {
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

    // Update arrow states
    function updateArrowStates(currentIndex, gameList) {
        console.log("Updating arrow states", { currentIndex, totalGames: gameList.length });
        if (prevImageArrow && nextImageArrow) {
            prevImageArrow.classList.toggle("disabled", currentIndex >= gameList.length - 1);
            nextImageArrow.classList.toggle("disabled", currentIndex <= 0);
        }
    }

    // Load game
    function loadGame(game) {
        console.log("Loading game:", game);
        gameOver = false;
        isProcessingGuess = false;
        guessInput.disabled = false;
        const isPrivate = game["Game Number"].toString().includes("PINEAPPLE");
        currentGameId = game["Game Number"];
        currentGameNumber = isPrivate ? `${game["Game Number"]} - Private` : `Game #${game["Game Number"]}`;
        const gameName = game["Game Name"]?.trim() || "";
        if (gameName) {
            currentGameNumber += ` - ${gameName}`;
        }

                // Restore game state if exists and not completed
        const savedState = gameResults[`${isPrivate ? "privatePineapple" : "pineapple"}_${currentGameId}`];
        const savedGameState = gameStates[`${isPrivate ? "privatePineapple" : "pineapple"}_${currentGameId}`] || {};
        if (savedState && savedState.status !== "Not Played") {
            console.log("Restoring saved game state for game:", currentGameId);
            guessCount = savedGameState.guessCount || 0;
            guesses = savedGameState.guesses || [];
            hintIndex = savedGameState.hintIndex || 0;
            score = savedGameState.score || 500;
        } else {
            guessCount = 0;
            guesses = [];
            hintIndex = 0;
            score = 500;
        }

        gameOver = false; // Explicitly reset gameOver
        isProcessingGuess = false; // Reset processing state
        guessInput.disabled = false; // Ensure input is enabled
        secretWord = game["Secret Word"]?.trim().toUpperCase() || "";
        hints = [
            game["Hint 1"]?.trim().toUpperCase(),
            game["Hint 2"]?.trim().toUpperCase(),
            game["Hint 3"]?.trim().toUpperCase(),
            game["Hint 4"]?.trim().toUpperCase(),
            game["Hint 5"]?.trim().toUpperCase()
        ].filter(hint => hint && hint !== "");
        console.log("Game loaded", { currentGameNumber, currentGameId, secretWord, hints });

        // Update UI
        gameNumberText.textContent = currentGameNumber;
        scoreText.textContent = `🍍 ${score}`;
        const backgroundImage = document.getElementById("background-image");
        if (backgroundImage) {
            backgroundImage.src = currentBackground;
            backgroundImage.alt = `Background for ${currentGameNumber}`;
        }
        displayHints();
        displayGuesses();
        if (savedState && savedState.status !== "Not Played") {
            if (savedState.status === "X/5" || parseInt(savedState.status.split("/")[0]) <= 5) {
                gameOver = true;
                guessInput.disabled = true;
                displayShareSection(savedState.status);
                resetScreenDisplays(document.getElementById("game-over"));
                if (savedState.status !== "X/5") {
                    createPineappleRain();
                }
            }
        }
        guessInput.value = "";
        ensureInitialFocus();
        keepKeyboardOpen();
    }

    // Display hints
    function displayHints() {
        console.log("Displaying hints, current hintIndex:", hintIndex);
        const hintsList = document.getElementById("hints-list");
        if (hintsList) {
            hintsList.innerHTML = "";
            const hintsToShow = hints.slice(0, hintIndex + 1);
            hintsToShow.forEach((hint, index) => {
                const hintElement = document.createElement("div");
                hintElement.textContent = hint;
                if (index < hintsToShow.length - 1) {
                    const separator = document.createElement("span");
                    separator.className = "hint-separator";
                    separator.textContent = "|";
                    hintsList.appendChild(separator);
                }
                hintsList.appendChild(hintElement);
            });
        }
    }

    // Display guesses
    function displayGuesses() {
        console.log("Displaying guesses:", guesses);
        if (guessesList) {
            guessesList.innerHTML = "";
            if (guesses.length === 0) {
                const noGuessesText = document.createElement("div");
                noGuessesText.id = "no-guesses-text";
                noGuessesText.textContent = "No guesses yet";
                guessesList.appendChild(noGuessesText);
            } else {
                guesses.forEach((guess, index) => {
                    const guessElement = document.createElement("div");
                    guessElement.textContent = guess;
                    if (index < guesses.length - 1) {
                        const separator = document.createElement("span");
                        separator.className = "guess-separator";
                        separator.textContent = "|";
                        guessesList.appendChild(separator);
                    }
                    guessesList.appendChild(guessElement);
                });
            }
        }
    }

    // Handle guess
    async function handleGuess(guess) {
        console.log("Handling guess:", guess, { gameOver, isProcessingGuess });
        if (gameOver || isProcessingGuess) {
            console.log("Guess ignored", { gameOver, isProcessingGuess });
            return;
        }
        isProcessingGuess = true;
        guessInput.disabled = true;
        try {
            if (!/^[A-Z\s]+$/.test(guess)) {
                throw new Error("Only letters and spaces are allowed.");
            }
            if (guess.length > 15) {
                throw new Error("Guess is too long.");
            }
            guessCount++;
            guesses.push(guess);
            firstGuessMade = true;
            const isPrivate = currentGameNumber.includes("- Private");
            const key = `${isPrivate ? "privatePineapple" : "pineapple"}_${currentGameId}`;
            gameStates[key] = { guessCount, guesses, hintIndex, score };
            localStorage.setItem("gameStates", JSON.stringify(gameStates));
            displayGuesses();

            if (guess === secretWord) {
                console.log("Correct guess!");
                gameOver = true;
                guessInput.disabled = true;
                const points = guessCount <= 5 ? [500, 400, 300, 200, 100][guessCount - 1] : 100;
                const oldScore = score;
                score = points;
                cumulativeScore += points;
                localStorage.setItem("cumulativeScore", cumulativeScore);
                scoreText.classList.add("flash-green");
                animateScoreChange(oldScore, score);
                gameResults[key] = { status: `${guessCount}/5` };
                localStorage.setItem("gameResults", JSON.stringify(gameResults));
                displayShareSection(`${guessCount}/5`);
                resetScreenDisplays(document.getElementById("game-over"));
                createPineappleRain();
            } else {
                console.log("Incorrect guess");
                guessInputContainer.classList.add("wrong-guess");
                incorrectGuessIndicator.style.display = "block";
                const oldScore = score;
                score = Math.max(0, score - 100);
                scoreText.classList.add("flash-red");
                animateScoreChange(oldScore, score);
                if (guessCount >= 5) {
                    console.log("Game over: 5 guesses used");
                    gameOver = true;
                    guessInput.disabled = true;
                    gameResults[key] = { status: "X/5" };
                    localStorage.setItem("gameResults", JSON.stringify(gameResults));
                    displayShareSection("X/5");
                    resetScreenDisplays(document.getElementById("game-over"));
                } else {
                    hintIndex = Math.min(hintIndex + 1, hints.length - 1);
                    displayHints();
                    gameStates[key] = { guessCount, guesses, hintIndex, score };
                    localStorage.setItem("gameStates", JSON.stringify(gameStates));
                }
                animationTimeout = setTimeout(() => {
                    guessInputContainer.classList.remove("wrong-guess");
                    incorrectGuessIndicator.style.display = "none";
                    isProcessingGuess = false;
                    guessInput.disabled = false;
                    guessInput.focus();
                    guessInput.value = "";
                    keepKeyboardOpen();
                }, 350);
            }
            displayGameList();
        } catch (error) {
            console.error("Error handling guess:", error.message);
            guessInputContainer.classList.add("wrong-guess");
            incorrectGuessIndicator.style.display = "block";
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                incorrectGuessIndicator.style.display = "none";
                isProcessingGuess = false;
                guessInput.disabled = false;
                guessInput.focus();
                guessInput.value = "";
                keepKeyboardOpen();
            }, 350);
        }
    }

    // Display share section
    function displayShareSection(status) {
        console.log("Displaying share section with status:", status);
        const secretWordDisplay = document.getElementById("secret-word-display");
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");
        const shareButtons = document.getElementById("share-buttons");
        if (secretWordDisplay && shareText && gameNumberDisplay && shareButtons) {
            secretWordDisplay.textContent = `Secret Word: ${secretWord}`;
            gameNumberDisplay.textContent = currentGameNumber;

            // Split share message into sentences
            const messages = [
                `I played ${currentGameNumber}!`,
                status === "X/5" ? `I didn't guess the secret word.` : `I guessed it in ${status} tries!`,
                `Can you do better?`
            ];
            shareText.innerHTML = "";
            messages.forEach(message => {
                const messageDiv = document.createElement("div");
                if (message.includes(status)) {
                    messageDiv.className = "guess-count";
                }
                messageDiv.textContent = message;
                shareText.appendChild(messageDiv);
            });

            const shareMessage = messages.join(" ");
            const shareUrl = `https://wordy.bigbraingames.net/?game=${currentGameId}`;
            const encodedMessage = encodeURIComponent(shareMessage + " " + shareUrl);

            const whatsappLink = document.getElementById("share-whatsapp");
            const telegramLink = document.getElementById("share-telegram");
            const twitterLink = document.getElementById("share-twitter");
            const instagramLink = document.getElementById("share-instagram");

            if (whatsappLink) {
                whatsappLink.href = `https://wa.me/?text=${encodedMessage}`;
            }
            if (telegramLink) {
                telegramLink.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`;
            }
            if (twitterLink) {
                twitterLink.href = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
            }
            if (instagramLink) {
                instagramLink.href = "#"; // Instagram doesn't support direct text sharing
                instagramLink.addEventListener("click", (e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(shareMessage + " " + shareUrl).then(() => {
                        alert("Share message copied to clipboard! Paste it in Instagram.");
                    });
                });
            }
        }
    }

    // Create pineapple rain animation
    function createPineappleRain() {
        console.log("Creating pineapple rain animation");
        const rainContainer = document.createElement("div");
        rainContainer.className = "pineapple-rain";
        document.body.appendChild(rainContainer);

        const numPineapples = 60; // Increased from 20 to 60 for denser effect
        for (let i = 0; i < numPineapples; i++) {
            const pineapple = document.createElement("div");
            pineapple.className = "pineapple-piece";
            pineapple.textContent = "🍍";
            pineapple.style.left = `${Math.random() * 100}vw`;
            pineapple.style.animationDuration = `${1.5 + Math.random() * 1}s`; // Between 1.5s and 2.5s
            pineapple.style.animationDelay = `${Math.random() * 0.5}s`; // Staggered start
            pineapple.style.setProperty('--drift', Math.random() * 2 - 1); // Random horizontal drift
            pineapple.style.setProperty('--rotation', `${Math.random() * 360}deg`); // Random rotation
            pineapple.style.setProperty('--fall-distance', 0.8 + Math.random() * 0.2); // Random fall distance
            rainContainer.appendChild(pineapple);
        }

        setTimeout(() => {
            rainContainer.remove();
            console.log("Pineapple rain animation completed");
        }, 2500); // Matches max animation duration
    }

    // Initialize game
    console.log("Initializing game");
    await fetchOfficialGames();
});