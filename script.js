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
    const gameOverSection = document.getElementById("game-over");
    const backgroundImage = document.getElementById("background-image");
    const backgroundImageContainer = document.getElementById("background-image-container");
    const hintsContainer = document.getElementById("hints-container");
    const guessesSection = document.getElementById("guesses-section");
    const secretWordDisplay = document.getElementById("secret-word-display");

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
            guessInput.focus();
            activeInput = guessInput;
            if (isMobile) {
                guessInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
        const screens = [formErrorDialog, formContent];
        screens.forEach(screen => {
            if (screen && screen !== activeScreen) {
                screen.style.display = "none";
                screen.classList.remove("active");
            }
        });

        if (activeScreen === gameContainer) {
            gameContainer.style.display = "flex";
            guessArea.style.display = "flex";
            hintsContainer.style.display = "flex";
            guessesSection.style.display = "flex";
            backgroundImage.style.display = gameOver ? "none" : "block";
            prevImageArrow.style.display = gameOver ? "none" : "block";
            nextImageArrow.style.display = gameOver ? "none" : "block";
            gameOverSection.classList.toggle("active", gameOver);
            setTimeout(() => {
                ensureInitialFocus();
                keepKeyboardOpen();
            }, 100);
        } else if (activeScreen === formContent) {
            activeScreen.style.display = "flex";
            activeScreen.classList.add("active");
            activeInput = document.getElementById("game-name-input");
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
                const points = result.status !== "Not Played" && result.status !== "X/5" ? [500, 400, 300, 200, 100][parseInt(result.status.split("/")[0]) - 1] || 100 : null;
                const displayResult = result.status === "Not Played" ? "Play Now" : result.status === "X/5" ? "❌" : `${points}`;
                const resultClass = result.status === "X/5" ? "lost" : result.status !== "Not Played" ? "" : "";
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
                const points = result.status !== "Not Played" && result.status !== "X/5" ? [500, 400, 300, 200, 100][parseInt(result.status.split("/")[0]) - 1] || 100 : null;
                const displayResult = result.status === "Not Played" ? "Play Now" : result.status === "X/5" ? "❌" : `${points}`;
                const resultClass = result.status === "X/5" ? "lost" : result.status !== "Not Played" ? "" : "";
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
        if (!savedState || savedState.status === "Not Played") {
            if (gameStates[currentGameId]) {
                const state = gameStates[currentGameId];
                guessCount = state.guessCount;
                guesses = state.guesses;
                hintIndex = state.hintIndex;
                score = state.score;
            } else {
                guessCount = 0;
                guesses = [];
                hintIndex = 0;
                score = 500; // Always start new game with 500 points
            }
        } else {
            guessCount = 0;
            guesses = [];
            hintIndex = 0;
            score = 500; // Always start new game with 500 points
        }

        secretWord = game["Secret Word"]?.trim().toUpperCase() || "";
        hints = [
            game["Hint 1"]?.trim().toUpperCase() || "",
            game["Hint 2"]?.trim().toUpperCase() || "",
            game["Hint 3"]?.trim().toUpperCase() || "",
            game["Hint 4"]?.trim().toUpperCase() || "",
            game["Hint 5"]?.trim().toUpperCase() || ""
        ].filter(hint => hint);

        // Update UI
        gameNumberText.textContent = currentGameNumber;
        scoreText.textContent = `🍍 ${cumulativeScore}`;
        updateHints();
        updateGuesses();
        backgroundImage.src = currentBackground;
        backgroundImage.style.display = gameOver ? "none" : "block";
        prevImageArrow.style.display = gameOver ? "none" : "block";
        nextImageArrow.style.display = gameOver ? "none" : "block";
        guessInput.value = "";
        guessSection.style.display = gameOver ? "none" : "flex";
        hintsContainer.style.display = gameOver ? "none" : "flex";
        guessesSection.style.display = gameOver ? "none" : "flex";
        gameOverSection.classList.toggle("active", gameOver);

        // Check if game is already completed
        if (savedState && savedState.status !== "Not Played") {
            gameOver = true;
            guessInput.disabled = true;
            guessSection.style.display = "none";
            hintsContainer.style.display = "none";
            guessesSection.style.display = "none";
            backgroundImage.style.display = "none";
            prevImageArrow.style.display = "none";
            nextImageArrow.style.display = "none";
            gameOverSection.classList.add("active");
            updateShareSection(savedState.status);
        } else {
            ensureInitialFocus();
        }
    }

    // Update hints display
    function updateHints() {
        const hintsList = document.getElementById("hints-list");
        hintsList.innerHTML = "";
        hints.slice(0, hintIndex + 1).forEach((hint, index) => {
            const hintElement = document.createElement("div");
            hintElement.textContent = hint;
            if (index < hints.length - 1 && index < hintIndex) {
                const separator = document.createElement("span");
                separator.className = "hint-separator";
                separator.textContent = "|";
                hintsList.appendChild(separator);
            }
            hintsList.appendChild(hintElement);
        });
    }

    // Update guesses display
    function updateGuesses() {
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

    // Update share section
    function updateShareSection(status) {
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");
        const shareWhatsApp = document.getElementById("share-whatsapp");
        const shareTelegram = document.getElementById("share-telegram");
        const shareTwitter = document.getElementById("share-twitter");
        const shareInstagram = document.getElementById("share-instagram");
        secretWordDisplay.textContent = `Secret word: ${secretWord}`;

        let message;
        let points;
        if (status === "X/5") {
            message = `Wordy ${currentGameNumber} was hard`;
        } else {
            const guessIndex = parseInt(status.split("/")[0]) - 1;
            points = [500, 400, 300, 200, 100][guessIndex] || 100;
            message = `I scored ${points} points for Wordy ${currentGameNumber}`;
        }

        shareText.textContent = message;
        gameNumberDisplay.textContent = `Game: ${currentGameNumber}`;
        const shareMessage = `${message}\n\nPlay it at: https://wordy.bigbraingames.net/?game=${currentGameId}`;

        const encodedMessage = encodeURIComponent(shareMessage);
        shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodedMessage}`;
        shareTelegram.href = `https://t.me/share/url?url=https://wordy.bigbraingames.net/?game=${currentGameId}&text=${encodedMessage}`;
        shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
        shareInstagram.href = `https://www.instagram.com/?url=https://wordy.bigbraingames.net/?game=${currentGameId}`;
    }

    // Handle guess
    async function handleGuess(guess) {
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored", { isProcessingGuess, gameOver });
            return;
        }

        isProcessingGuess = true;
        guess = guess.trim().toUpperCase();
        console.log("Handling guess:", guess);

        if (!/^[A-Z\s]+$/.test(guess)) {
            console.log("Invalid guess: contains non-letters or spaces");
            guessInputContainer.classList.add("wrong-guess");
            incorrectGuessIndicator.style.display = "block";
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                incorrectGuessIndicator.style.display = "none";
                isProcessingGuess = false;
                keepKeyboardOpen();
            }, 350);
            return;
        }

        if (guesses.includes(guess)) {
            console.log("Guess already made:", guess);
            guessInputContainer.classList.add("wrong-guess");
            incorrectGuessIndicator.style.display = "block";
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                incorrectGuessIndicator.style.display = "none";
                isProcessingGuess = false;
                keepKeyboardOpen();
            }, 350);
            return;
        }

        firstGuessMade = true;
        guessCount++;
        guesses.push(guess);
        guessInput.value = "";
        score = Math.max(0, score - 100);
        scoreText.textContent = `🍍 ${cumulativeScore}`;
        scoreText.classList.add("flash-red");
        animateScoreChange(cumulativeScore, cumulativeScore - 100);

        updateGuesses();

        if (guess === secretWord) {
            console.log("Correct guess!");
            gameOver = true;
            guessInput.disabled = true;
            const pointsEarned = score;
            cumulativeScore += pointsEarned;
            localStorage.setItem("cumulativeScore", cumulativeScore);
            scoreText.textContent = `🍍 ${cumulativeScore}`;
            scoreText.classList.remove("flash-red");
            scoreText.classList.add("flash-green");
            animateScoreChange(cumulativeScore - pointsEarned, cumulativeScore);
            const status = `${guessCount}/5`;
            gameResults[`${currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple"}_${currentGameId}`] = { status };
            localStorage.setItem("gameResults", JSON.stringify(gameResults));
            delete gameStates[currentGameId];
            localStorage.setItem("gameStates", JSON.stringify(gameStates));
            displayGameList();
            guessSection.style.display = "none";
            hintsContainer.style.display = "none";
            guessesSection.style.display = "none";
            backgroundImage.style.display = "none";
            prevImageArrow.style.display = "none";
            nextImageArrow.style.display = "none";
            gameOverSection.classList.add("active");
            updateShareSection(status);
            triggerPineappleRain();
        } else if (guessCount >= 5) {
            console.log("Game over: too many guesses");
            gameOver = true;
            guessInput.disabled = true;
            cumulativeScore = Math.max(0, cumulativeScore - 100);
            localStorage.setItem("cumulativeScore", cumulativeScore);
            scoreText.textContent = `🍍 ${cumulativeScore}`;
            scoreText.classList.remove("flash-red");
            scoreText.classList.add("flash-red");
            animateScoreChange(cumulativeScore + 100, cumulativeScore);
            const status = "X/5";
            gameResults[`${currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple"}_${currentGameId}`] = { status };
            localStorage.setItem("gameResults", JSON.stringify(gameResults));
            delete gameStates[currentGameId];
            localStorage.setItem("gameStates", JSON.stringify(gameStates));
            displayGameList();
            guessSection.style.display = "none";
            hintsContainer.style.display = "none";
            guessesSection.style.display = "none";
            backgroundImage.style.display = "none";
            prevImageArrow.style.display = "none";
            nextImageArrow.style.display = "none";
            gameOverSection.classList.add("active");
            updateShareSection(status);
        } else {
            hintIndex = Math.min(hintIndex + 1, hints.length - 1);
            updateHints();
            gameStates[currentGameId] = {
                guessCount,
                guesses,
                hintIndex,
                score
            };
            localStorage.setItem("gameStates", JSON.stringify(gameStates));
            isProcessingGuess = false;
            keepKeyboardOpen();
        }
    }

    // Trigger pineapple rain animation
    function triggerPineappleRain() {
        const pineappleRain = document.createElement("div");
        pineappleRain.className = "pineapple-rain";
        document.body.appendChild(pineappleRain);

        for (let i = 0; i < 50; i++) {
            const pineapple = document.createElement("div");
            pineapple.className = "pineapple-piece";
            pineapple.textContent = "🍍";
            pineapple.style.left = `${Math.random() * 100}vw`;
            pineapple.style.animationDuration = `${Math.random() * 2 + 1}s`;
            pineapple.style.setProperty('--drift', Math.random() * 2 - 1);
            pineapple.style.setProperty('--rotation', `${Math.random() * 360}deg`);
            pineappleRain.appendChild(pineapple);
        }

        setTimeout(() => {
            pineappleRain.remove();
        }, 3000);
    }

    // Initialize
    console.log("Initializing game");
    adjustBackground();
    await fetchOfficialGames();
});