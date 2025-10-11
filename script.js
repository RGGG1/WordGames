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
    let hintStyles = [];
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

    // Hint shapes, colors, and reveal effects
    const hintShapes = ['cloud', 'sun', 'aviator', 'diamond', 'fluffy-cloud'];
    const hintColors = [
        'color-1', 'color-2', 'color-3', 'color-4', 'color-5',
        'color-6', 'color-7', 'color-8', 'color-9', 'color-10'
    ];
    const hintRevealEffects = [
        'pop', 'stretch', 'zoom', 'bounce', 'spin',
        'slide-left', 'slide-right', 'slide-up', 'slide-down', 'letter', 'splash'
    ];

    // Hint reveal order mapping
    const hintRevealOrder = ['hint-1', 'hint-2', 'hint-3', 'hint-4', 'hint-5'];

    // Shuffle array utility
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Randomize hint styles
    function randomizeHintStyles() {
        hintStyles = [];
        const availableColors = shuffleArray([...hintColors]);
        const shuffledEffects = shuffleArray([...hintRevealEffects]);
        for (let i = 0; i < 5; i++) {
            const color = availableColors.length > 0 ? availableColors[i % availableColors.length] : hintColors[i % hintColors.length];
            const effect = shuffledEffects[i % shuffledEffects.length];
            hintStyles.push({ shape: `hint-shape-${hintShapes[i]}`, color: `hint-color-${color}`, effect });
            if (availableColors.length > 0) availableColors.splice(i % availableColors.length, 1);
        }
        console.log("Assigned randomized hint styles:", hintStyles);
    }

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

    // Keep keyboard open
    function keepKeyboardOpen() {
        if (gameScreen.style.display === "flex" && !gameOver && !isProcessingGuess && !isUILocked && !document.querySelector('.screen.active') && !document.querySelector('.dialog[style*="display: flex"]')) {
            if (guessInput && document.activeElement !== guessInput) {
                console.log("Refocusing guess input to keep keyboard open");
                guessInput.focus();
                activeInput = guessInput;
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

    // Document-level touch handler to refocus input
    document.addEventListener("touchstart", (e) => {
        if (!gameOver && !isProcessingGuess && !isUILocked && gameScreen.style.display === "flex" && !e.target.closest('.screen, .dialog, #guess-btn, #guess-input, #guess-input-container')) {
            console.log("Document touched, refocusing guess input");
            setTimeout(() => {
                guessInput.focus();
                activeInput = guessInput;
                adjustBackground();
            }, 0);
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
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setTimeout(() => { isUILocked = false; }, 500);
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
                    keepKeyboardOpen();
                }
            }
        });
        guessInput.addEventListener("focus", () => {
            console.log("Guess input focused");
            activeInput = guessInput;
            adjustBackground();
        });
        guessInput.addEventListener("blur", () => {
            if (gameScreen.style.display === "flex" && !gameOver && !isProcessingGuess && !isUILocked) {
                console.log("Guess input blurred, re-focusing");
                setTimeout(() => {
                    guessInput.focus();
                    activeInput = guessInput;
                    adjustBackground();
                }, 0);
            }
        });
        guessInput.addEventListener("touchstart", (e) => {
            e.preventDefault();
            console.log("Guess input touched");
            guessInput.focus();
            activeInput = guessInput;
            adjustBackground();
        });
        setTimeout(() => {
            guessInput.focus();
            activeInput = guessInput;
        }, 0);
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
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Submitting guess:", guess);
                    handleGuess(guess);
                    guessInput.focus();
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
            if (guessInput && !gameOver && !isProcessingGuess) {
                setTimeout(() => {
                    guessInput.focus();
                    activeInput = guessInput;
                }, 0);
            }
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
            setTimeout(() => { isUILocked = false; }, 500);
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
            setTimeout(() => { isUILocked = false; }, 500);
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
        });

        giveUpNoBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Give Up No button clicked");
            giveUpDialog.style.display = "none";
            if (guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
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
            setTimeout(() => { isUILocked = false; }, 500);
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
        console.log("Arrow states updated", { currentIndex, gameListLength: gameList.length });
    }

    // Create a Wordy button
    if (createPineappleBtn && formContent) {
        createPineappleBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            console.log("Create a Wordy button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                input.value = "";
            });
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Create a Wordy link (end screen)
    if (createPineappleLink && formContent) {
        createPineappleLink.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            console.log("Create a Wordy (end screen) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                input.value = "";
            });
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Form back button
    if (formBackBtn) {
        formBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            console.log("Form back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            showGameSelectScreen();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Official back button
    if (officialBackBtn) {
        officialBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            console.log("Official back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            if (guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Private back button
    if (privateBackBtn) {
        privateBackBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            console.log("Private back button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            if (guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Form error OK button
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            console.log("Form error OK button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            formErrorDialog.style.display = "none";
            keepKeyboardOpen();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Confirm button
    if (confirmBtn) {
        confirmBtn.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            console.log("Confirm button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            isLoadingGame = true;
            confirmBtn.classList.add("loading");
            try {
                const gameNameInput = document.getElementById("game-name-input");
                const secretWordInput = document.getElementById("secret-word");
                const hints = [
                    document.getElementById("hint-1"),
                    document.getElementById("hint-2"),
                    document.getElementById("hint-3"),
                    document.getElementById("hint-4"),
                    document.getElementById("hint-5")
                ].map(input => input.value.trim().toUpperCase());

                const gameName = gameNameInput.value.trim().toUpperCase();
                const secretWord = secretWordInput.value.trim().toUpperCase();

                if (!gameName || !secretWord || hints.some(hint => !hint)) {
                    throw new Error("All fields must be filled.");
                }

                const formData = new FormData();
                formData.append("gameName", gameName);
                formData.append("secretWord", secretWord);
                hints.forEach((hint, index) => {
                    formData.append(`hint${index + 1}`, hint);
                });

                const response = await fetch(webAppUrl, {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Failed to create game: ${response.statusText}`);
                }

                const result = await response.json();
                console.log("Game created successfully", result);
                await fetchPrivateGames();
                showGameSelectScreen();
                formInputs.forEach(input => {
                    input.value = "";
                });
            } catch (error) {
                console.error("Error creating game:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = error.message || "Failed to create game.";
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
                confirmBtn.classList.remove("loading");
            }
        });
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select screen");
        officialTab.classList.add("active");
        privateTab.classList.remove("active");
        officialContent.classList.add("active");
        officialContent.style.display = "flex";
        privateContent.classList.remove("active");
        privateContent.style.display = "none";
        resetScreenDisplays(gameSelectContent);
        displayGameList();
        adjustBackground();
    }

    // Handle guess
    function handleGuess(guess) {
        console.log("Handling guess:", guess, { guessCount, gameOver, isProcessingGuess });
        if (gameOver || isProcessingGuess) return;
        isProcessingGuess = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;

        if (!firstGuessMade) {
            firstGuessMade = true;
            revealNextHint();
        }

        guessCount++;
        guesses.push(guess);
        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}/5`;
        }

        if (guess === secretWord) {
            let normalizedGameNumber;
            let gameType;
            if (currentGameNumber.includes("- Private")) {
                normalizedGameNumber = currentGameId;
                gameType = "privatePineapple";
            } else {
                normalizedGameNumber = currentGameNumber.replace("Game #", "");
                gameType = "pineapple";
            }
            saveGameResult(gameType, normalizedGameNumber, secretWord, guessCount);
            endGame(true);
            isProcessingGuess = false;
            guessInput.disabled = false;
            guessBtn.disabled = false;
            keepKeyboardOpen();
            return;
        }

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
                saveGameResult(gameType, normalizedGameNumber, secretWord, "Lost");
                endGame(false);
            } else {
                revealNextHint();
            }
            guessInput.value = "";
            guessInput.disabled = false;
            guessBtn.disabled = false;
            isProcessingGuess = false;
            keepKeyboardOpen();
        }, 350);
    }

    // Save game result
    async function saveGameResult(gameType, gameNumber, secretWord, result) {
        console.log("Saving game result", { gameType, gameNumber, secretWord, result });
        try {
            // Store in localStorage
            gameResults[`${gameType}_${gameNumber}`] = result;
            localStorage.setItem("gameResults", JSON.stringify(gameResults));

            // Existing server save
            const formData = new FormData();
            formData.append("gameType", gameType);
            formData.append("gameNumber", gameNumber);
            formData.append("secretWord", secretWord);
            formData.append("result", result);
            const response = await fetch(webAppUrl, {
                method: "POST",
                body: formData
            });
            if (!response.ok) {
                throw new Error(`Failed to save game result: ${response.statusText}`);
            }
            console.log("Game result saved successfully");
        } catch (error) {
            console.error("Error saving game result:", error.message);
        }
    }

    // Display game list
    function displayGameList() {
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");
        if (officialList) {
            officialList.innerHTML = "";
            allGames.forEach(game => {
                const row = document.createElement("div");
                row.classList.add("game-list-row");
                const gameNumber = game["Game Number"];
                const resultKey = `pineapple_${gameNumber}`;
                let resultText = gameResults[resultKey] || "";
                let resultClass = "result";
                if (resultText === "Gave Up") {
                    resultClass += " gave-up";
                } else if (resultText === "Lost") {
                    resultText = "X";
                    resultClass += " lost";
                } else if (resultText) {
                    // Assume it's the guess count
                } else {
                    resultText = "-";
                }
                row.innerHTML = `
                    <span>Game #${gameNumber}</span>
                    <span class="${resultClass}">${resultText}</span>
                    <span class="play-now" data-game-number="${gameNumber}" data-type="official">Play Now</span>
                `;
                officialList.appendChild(row);
            });
        }
        if (privateList) {
            privateList.innerHTML = "";
            privateGames.forEach(game => {
                const row = document.createElement("div");
                row.classList.add("game-list-row");
                const gameNumber = game["Game Number"];
                const gameName = game["Game Name"] || `Private #${gameNumber}`;
                const resultKey = `privatePineapple_${gameNumber}`;
                let resultText = gameResults[resultKey] || "";
                let resultClass = "result";
                if (resultText === "Gave Up") {
                    resultClass += " gave-up";
                } else if (resultText === "Lost") {
                    resultText = "X";
                    resultClass += " lost";
                } else if (resultText) {
                    // Assume it's the guess count
                } else {
                    resultText = "-";
                }
                row.innerHTML = `
                    <span>${gameName}</span>
                    <span class="${resultClass}">${resultText}</span>
                    <span class="play-now" data-game-number="${gameNumber}" data-type="private">Play Now</span>
                `;
                privateList.appendChild(row);
            });
        }

        // Add event listeners for game selection
        const playNowLinks = document.querySelectorAll(".play-now");
        playNowLinks.forEach(link => {
            const handler = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Play now link triggered", { isUILocked, isLoadingGame });
                if (isUILocked || isLoadingGame) return;
                isUILocked = true;
                isLoadingGame = true;
                link.classList.add("loading");
                try {
                    const gameNumber = link.getAttribute("data-game-number");
                    const gameType = link.getAttribute("data-type");
                    console.log("Loading game", { gameNumber, gameType });
                    const gameList = gameType === "private" ? privateGames : allGames;
                    const game = gameList.find(g => g["Game Number"] === gameNumber);
                    if (game) {
                        currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                        await preloadBackground(currentBackground);
                        loadGame(game);
                        resetScreenDisplays(gameScreen);
                        adjustBackground();
                        updateArrowStates(gameList.findIndex(g => g["Game Number"] === gameNumber), gameList);
                    } else {
                        throw new Error(`Game not found: ${gameNumber}`);
                    }
                } catch (error) {
                    console.error("Error loading game:", error.message);
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "Failed to load game.";
                        formErrorDialog.style.display = "flex";
                    }
                } finally {
                    isUILocked = false;
                    isLoadingGame = false;
                    link.classList.remove("loading");
                }
            };

            link.removeEventListener("click", link._handler);
            link.removeEventListener("touchstart", link._handler);
            link._handler = handler;
            link.addEventListener("click", handler);
            link.addEventListener("touchstart", (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchMoved = false;
            });
            link.addEventListener("touchmove", (e) => {
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                if (Math.abs(touchX - touchStartX) > touchThreshold || Math.abs(touchY - touchStartY) > touchThreshold) {
                    touchMoved = true;
                }
            });
            link.addEventListener("touchend", (e) => {
                if (!touchMoved) handler(e);
            });
        });
    }

    // Fetch official games
    async function fetchOfficialGames() {
        console.log("Fetching official games");
        try {
            const response = await fetch(officialUrl);
            if (!response.ok) throw new Error(`Failed to fetch official games: ${response.statusText}`);
            const csvText = await response.text();
            const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            allGames = parsed.data;
            console.log("Official games fetched:", allGames);
            allGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
            displayGameList();
        } catch (error) {
            console.error("Error fetching official games:", error.message);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load official games.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Fetch private games
    async function fetchPrivateGames() {
        console.log("Fetching private games");
        try {
            const response = await fetch(privateUrl);
            if (!response.ok) throw new Error(`Failed to fetch private games: ${response.statusText}`);
            const csvText = await response.text();
            const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            privateGames = parsed.data;
            console.log("Private games fetched:", privateGames);
            privateGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
            displayGameList();
        } catch (error) {
            console.error("Error fetching private games:", error.message);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load private games.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    // Load game
    function loadGame(game) {
        console.log("Loading game:", game);
        gameOver = false;
        gaveUp = false;
        secretWord = game["Secret Word"]?.trim().toUpperCase() || "";
        currentGameNumber = game["Game Name"] ? `${game["Game Name"]} - Private` : `Game #${game["Game Number"]}`;
        currentGameId = game["Game Number"];
        hints = [
            game["Hint 1"]?.trim().toUpperCase() || "",
            game["Hint 2"]?.trim().toUpperCase() || "",
            game["Hint 3"]?.trim().toUpperCase() || "",
            game["Hint 4"]?.trim().toUpperCase() || "",
            game["Hint 5"]?.trim().toUpperCase() || ""
        ];
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        guesses = [];
        if (guessesLink) {
            guessesLink.textContent = "Guesses: 0/5";
        }
        if (gameNumberText) {
            gameNumberText.textContent = currentGameNumber;
        }
        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
        }
        if (guessBtn) {
            guessBtn.disabled = false;
        }
        if (guessInputContainer) {
            guessInputContainer.classList.remove("wrong-guess");
        }
        gameScreen.classList.remove("game-ended");
        clearTimeout(animationTimeout);
        animationTimeout = null;
        isProcessingGuess = false;

        // Reset hints
        hintRevealOrder.forEach(id => {
            const hintElement = document.getElementById(id);
            if (hintElement) {
                hintElement.style.display = "none";
                hintElement.className = "hint";
                hintElement.innerHTML = "";
            }
        });

        // Assign randomized hint styles
        randomizeHintStyles();
        hints.forEach((hint, index) => {
            const hintElement = document.getElementById(hintRevealOrder[index]);
            if (hintElement && hint) {
                const style = hintStyles[index];
                hintElement.className = `hint ${style.shape} ${style.color} reveal-${style.effect}`;
                hintElement.innerHTML = `<span class="hint-text">${hint}</span>`;
                if (style.shape === "hint-shape-fluffy-cloud") {
                    hintElement.innerHTML += `
                        <div class="puff-1"></div>
                        <div class="puff-2"></div>
                    `;
                }
            }
        });

        // Show first hint immediately
        revealNextHint();
    }

    // Reveal next hint
    function revealNextHint() {
        if (hintIndex < hintRevealOrder.length) {
            const hintElement = document.getElementById(hintRevealOrder[hintIndex]);
            if (hintElement) {
                console.log("Revealing hint:", hintIndex + 1, hintElement.textContent);
                hintElement.style.display = "flex";
            }
            hintIndex++;
        }
    }

    // End game
    function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp, guessCount });
        gameOver = true;
        gameScreen.classList.add("game-ended");
        resetScreenDisplays(document.getElementById("game-over"));
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");
        const shareButtons = [
            document.getElementById("share-whatsapp"),
            document.getElementById("share-telegram"),
            document.getElementById("share-twitter"),
            document.getElementById("share-instagram")
        ].filter(Boolean);

        let shareMessage = `WORDY ${currentGameNumber}\n`;
        if (won) {
            shareMessage += `I got it in <span class="guess-count">${guessCount}/5</span> guesses!\n`;
            createPineappleRain();
        } else if (gaveUp) {
            shareMessage += `I gave up after ${guessCount}/5 guesses.\n`;
        } else {
            shareMessage += `I didn't get it in 5/5 guesses.\n`;
        }
        shareMessage += hints.map((hint, index) => hint ? `Hint ${index + 1}: ${hint}` : '').filter(Boolean).join('\n');
        shareMessage += `\nPlay at wordy.bigbraingames.net`;

        if (shareText) {
            shareText.innerHTML = shareMessage.replace(/\n/g, '<br>');
        }
        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }

        const encodedMessage = encodeURIComponent(shareMessage.replace(/<span class="guess-count">(\d\/5)<\/span>/, '$1'));
        const shareUrls = [
            `https://api.whatsapp.com/send?text=${encodedMessage}`,
            `https://t.me/share/url?url=wordy.bigbraingames.net&text=${encodedMessage}`,
            `https://twitter.com/intent/tweet?text=${encodedMessage}`,
            `https://www.instagram.com/?url=wordy.bigbraingames.net&text=${encodedMessage}`
        ];

        shareButtons.forEach((button, index) => {
            if (button) {
                button.href = shareUrls[index];
                const handler = (e) => {
                    e.preventDefault();
                    console.log(`Share ${button.id} triggered`);
                    window.open(shareUrls[index], "_blank");
                };
                button.removeEventListener("click", button._handler);
                button.removeEventListener("touchstart", button._handler);
                button._handler = handler;
                button.addEventListener("click", handler);
                button.addEventListener("touchstart", handler);
            }
        });
    }

    // Create pineapple rain
    function createPineappleRain() {
        console.log("Creating continuous pineapple rain");
        const rainContainer = document.createElement("div");
        rainContainer.classList.add("pineapple-rain");
        document.body.appendChild(rainContainer);

        function spawnWave() {
            const numberOfPineapples = 60; // Increased from 20 to 60 (3x)
            for (let i = 0; i < numberOfPineapples; i++) {
                const pineapple = document.createElement("div");
                pineapple.classList.add("pineapple-piece");
                pineapple.textContent = "🍍";
                pineapple.style.left = `${Math.random() * 100}vw`;
                pineapple.style.animationDuration = `${Math.random() * 2 + 3}s`;
                pineapple.style.setProperty("--drift", Math.random() * 2 - 1);
                pineapple.style.setProperty("--rotation", `${Math.random() * 720 - 360}deg`);
                pineapple.style.animationDelay = `${Math.random() * 2}s`; // Random delay for overlap
                rainContainer.appendChild(pineapple);
                // Remove pineapple after animation
                pineapple.addEventListener("animationend", () => {
                    pineapple.remove();
                });
            }
        }

        // Initial wave
        spawnWave();
        // Continuous waves every 2 seconds
        const waveInterval = setInterval(spawnWave, 2000);

        // Stop after 10 seconds
        setTimeout(() => {
            clearInterval(waveInterval);
            setTimeout(() => {
                rainContainer.remove();
                console.log("Pineapple rain removed");
            }, 5000); // Wait for last pineapples to fall
        }, 10000);
    }

    // Next game button (end screen)
    if (nextGameBtnEnd) {
        nextGameBtnEnd.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            console.log("Next game button (end screen) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            isLoadingGame = true;
            nextGameBtnEnd.classList.add("loading");
            try {
                showGameSelectScreen();
            } catch (error) {
                console.error("Error opening game select screen:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to open game list.";
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
                nextGameBtnEnd.classList.remove("loading");
            }
        });
    }

    // Initialize
    async function initialize() {
        console.log("Initializing game");
        try {
            await fetchOfficialGames();
            if (allGames.length > 0) {
                const latestGame = allGames[0];
                currentBackground = latestGame["Background"] && latestGame["Background"].trim() !== "" ? latestGame["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(latestGame);
                resetScreenDisplays(gameScreen);
                updateArrowStates(0, allGames);
                adjustBackground();
                if (guessInput) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            } else {
                console.error("No games available to load");
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "No games available.";
                    formErrorDialog.style.display = "flex";
                }
            }
        } catch (error) {
            console.error("Initialization error:", error.message);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to initialize game.";
                formErrorDialog.style.display = "flex";
            }
        }
    }

    await initialize();
});