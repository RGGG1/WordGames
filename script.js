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
                    guessInput.focus();
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
                input.disabled = false;
                input.readOnly = false;
            });
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Create a Wordy link (end screen)
    if (createPineappleLink && formContent) {
        createPineappleLink.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            console.log("Create a Wordy link (end screen) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                input.value = "";
                input.disabled = false;
                input.readOnly = false;
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
            resetScreenDisplays(gameSelectContent);
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
            keepKeyboardOpen();
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
            keepKeyboardOpen();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Next game button (end screen)
    if (nextGameBtnEnd) {
        nextGameBtnEnd.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            console.log("Next game button (end screen) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            nextGameBtnEnd.classList.add("loading");
            showGameSelectScreen();
            setTimeout(() => {
                isUILocked = false;
                nextGameBtnEnd.classList.remove("loading");
            }, 500);
        });
    }

    // Form error dialog OK button
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            console.log("Form error OK button triggered");
            formErrorDialog.style.display = "none";
            if (formContent.style.display === "flex") {
                activeInput = document.getElementById("game-name-input");
                if (activeInput) activeInput.focus();
            } else {
                keepKeyboardOpen();
            }
        });
    }

    // Form submission
    if (confirmBtn) {
        confirmBtn.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
            e.preventDefault();
            console.log("Confirm button triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            isLoadingGame = true;
            confirmBtn.classList.add("loading");
            try {
                const gameName = document.getElementById("game-name-input")?.value.trim().toUpperCase();
                const secretWordInput = document.getElementById("secret-word")?.value.trim().toUpperCase();
                const hintsInputs = [
                    document.getElementById("hint-1")?.value.trim().toUpperCase(),
                    document.getElementById("hint-2")?.value.trim().toUpperCase(),
                    document.getElementById("hint-3")?.value.trim().toUpperCase(),
                    document.getElementById("hint-4")?.value.trim().toUpperCase(),
                    document.getElementById("hint-5")?.value.trim().toUpperCase()
                ];
                if (!gameName || !secretWordInput || hintsInputs.some(hint => !hint)) {
                    throw new Error("All fields must be filled.");
                }
                if (secretWordInput.length < 3 || hintsInputs.some(hint => hint.length < 3)) {
                    throw new Error("Secret word and hints must be at least 3 characters.");
                }
                const formData = new FormData();
                formData.append("Game Name", gameName);
                formData.append("Secret Word", secretWordInput);
                hintsInputs.forEach((hint, index) => {
                    formData.append(`Hint ${index + 1}`, hint);
                });
                formData.append("Background", defaultBackground);
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    body: formData
                });
                if (!response.ok) {
                    throw new Error(`Failed to submit form: ${response.statusText}`);
                }
                const result = await response.text();
                console.log("Form submission response:", result);
                await fetchPrivateGames();
                resetScreenDisplays(gameSelectContent);
                privateTab.classList.add("active");
                officialTab.classList.remove("active");
                privateContent.classList.add("active");
                privateContent.style.display = "flex";
                officialContent.classList.remove("active");
                officialContent.style.display = "none";
                displayGameList();
            } catch (error) {
                console.error("Form submission error:", error.message);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = error.message;
                    formErrorDialog.style.display = "flex";
                }
            } finally {
                isUILocked = false;
                isLoadingGame = false;
                confirmBtn.classList.remove("loading");
            }
        });
    }

    // Fetch official games
    async function fetchOfficialGames() {
        console.log("Fetching official games from:", officialUrl);
        try {
            const response = await fetch(officialUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const csvText = await response.text();
            console.log("Official games CSV fetched");
            Papa.parse(csvText, {
                header: true,
                complete: (result) => {
                    allGames = result.data.filter(row => row["Game Number"] && row["Secret Word"]);
                    console.log("Parsed official games:", allGames);
                    displayGameList();
                    if (allGames.length > 0) {
                        const latestGame = allGames[0];
                        currentBackground = latestGame["Background"] && latestGame["Background"].trim() !== "" ? latestGame["Background"] : defaultBackground;
                        preloadBackground(currentBackground).then(() => {
                            loadGame(latestGame);
                            resetScreenDisplays(gameScreen);
                            adjustBackground();
                            updateArrowStates(0, allGames);
                        });
                    }
                },
                error: (error) => {
                    console.error("Papa Parse error:", error);
                    if (formErrorDialog && formErrorMessage) {
                        formErrorMessage.textContent = "Failed to load official games.";
                        formErrorDialog.style.display = "flex";
                    }
                }
            });
        } catch (error) {
            console.error("Error fetching official games:", error.message);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load official games.";
                formErrorDialog.style.display = "none";
            }
        }
    }

    // Fetch private games
    async function fetchPrivateGames() {
        console.log("Fetching private games from:", privateUrl);
        try {
            const response = await fetch(privateUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const csvText = await response.text();
            console.log("Private games CSV fetched");
            Papa.parse(csvText, {
                header: true,
                complete: (result) => {
                    privateGames = result.data.filter(row => row["Game Number"] && row["Secret Word"]);
                    console.log("Parsed private games:", privateGames);
                    displayGameList();
                },
                error: (error) => {
                    console.error("Papa Parse error:", error);
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
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");

        // Retrieve saved results from local storage
        const savedResults = JSON.parse(localStorage.getItem("wordyGameResults") || "{}");

        if (officialList) {
            officialList.innerHTML = "";
            allGames.forEach(game => {
                const row = document.createElement("div");
                row.classList.add("game-list-row");
                const gameNumber = game["Game Number"];
                const resultKey = `pineapple_${gameNumber}`;
                const result = savedResults[resultKey] || { result: "Not Played" };
                const resultText = result.result === "Not Played" ? "Not Played" :
                                  result.result === "Gave Up" ? "Gave Up" :
                                  result.result === "Lost" ? "Lost" :
                                  `${result.result} ${result.result === 1 ? "guess" : "guesses"}`;
                row.innerHTML = `
                    <span>Game #${gameNumber}</span>
                    <span>${resultText}</span>
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
                const result = savedResults[resultKey] || { result: "Not Played" };
                const resultText = result.result === "Not Played" ? "Not Played" :
                                  result.result === "Gave Up" ? "Gave Up" :
                                  result.result === "Lost" ? "Lost" :
                                  `${result.result} ${result.result === 1 ? "guess" : "guesses"}`;
                row.innerHTML = `
                    <span>${gameName}</span>
                    <span>${resultText}</span>
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
        adjustBackground();
    }

    // Save game result
    async function saveGameResult(gameType, gameNumber, secretWord, result) {
        console.log("Saving game result", { gameType, gameNumber, secretWord, result });
        try {
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
            console.log("Game result saved successfully to server");

            // Store result in local storage
            const resultKey = `${gameType}_${gameNumber}`;
            const savedResults = JSON.parse(localStorage.getItem("wordyGameResults") || "{}");
            savedResults[resultKey] = { result };
            localStorage.setItem("wordyGameResults", JSON.stringify(savedResults));
            console.log("Game result saved to local storage", savedResults);
        } catch (error) {
            console.error("Error saving game result:", error.message);
        }
    }

    // Reveal next hint
    function revealNextHint() {
        if (hintIndex < hintRevealOrder.length) {
            const hintId = hintRevealOrder[hintIndex];
            const hintElement = document.getElementById(hintId);
            if (hintElement) {
                hintElement.style.display = "flex";
                const hintStyle = hintStyles[hintIndex];
                if (hintStyle) {
                    hintElement.className = `hint ${hintStyle.shape} ${hintStyle.color} reveal-${hintStyle.effect}`;
                    console.log(`Revealing hint ${hintId} with style:`, hintStyle);
                }
                hintIndex++;
            } else {
                console.error(`Hint element not found: ${hintId}`);
            }
        }
    }

    // Handle guess
    function handleGuess(guess) {
        console.log("Handling guess:", guess, { guessCount, gameOver, isProcessingGuess });
        if (gameOver || isProcessingGuess) return;
        isProcessingGuess = true;
        // Do not disable guessInput to prevent keyboard collapse
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
            guessBtn.disabled = false;
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
            isProcessingGuess = false;
            guessBtn.disabled = false;
            keepKeyboardOpen();
        }, 350);
    }

    // Load game
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
        guessCount = 0;
        guesses = [];
        hintIndex = 0;
        firstGuessMade = false;
        gameOver = false;
        gaveUp = false;
        isProcessingGuess = false;

        if (guessesLink) {
            guessesLink.textContent = "Guesses: 0/5";
        }

        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) {
            hintsContainer.innerHTML = `
                <div id="hints-heading">HINTS</div>
                ${hints.map((hint, index) => `
                    <div id="hint-${index + 1}" class="hint" style="display: none;">
                        <span class="hint-text">${hint}</span>
                    </div>
                `).join('')}
            `;
        }

        randomizeHintStyles();

        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
            guessInput.readOnly = false;
            setTimeout(() => {
                guessInput.focus();
                activeInput = guessInput;
            }, 0);
        }

        if (guessBtn) {
            guessBtn.disabled = false;
        }

        if (gameScreen) {
            gameScreen.classList.remove("game-ended");
        }

        currentGameNumber = game["Game Number"].includes("- Private") ? game["Game Number"] : `Game #${game["Game Number"]}`;
        currentGameId = game["Game Number"];
        if (gameNumberText) {
            gameNumberText.textContent = currentGameNumber;
        }

        console.log("Game loaded", { currentGameNumber, currentGameId, secretWord, hints });
    }

    // End game
    function endGame(won, gaveUpOverride = false) {
        console.log("Ending game", { won, gaveUpOverride, guessCount, guesses });
        gameOver = true;
        guessInput.disabled = true;
        guessInput.readOnly = true;
        guessBtn.disabled = true;
        gameScreen.classList.add("game-ended");
        const gameOverScreen = document.getElementById("game-over");
        const gameOverMessage = document.getElementById("game-over-message");
        const secretWordMessage = document.getElementById("secret-word-message");
        const shareText = document.getElementById("share-text");

        if (gameOverScreen && gameOverMessage && secretWordMessage && shareText) {
            gameOverScreen.style.display = "flex";
            gameOverScreen.classList.add("active");
            gameOverMessage.textContent = gaveUpOverride ? "You gave up!" : won ? "You won!" : "Game Over!";
            secretWordMessage.textContent = `The word was: ${secretWord}`;
            shareText.innerHTML = `I ${gaveUpOverride ? "gave up on" : won ? `solved ${currentGameNumber} in <span class="guess-count">${guessCount}</span> ${guessCount === 1 ? "guess" : "guesses"}` : `failed ${currentGameNumber}`}!`;
            resetScreenDisplays(gameOverScreen);
        }

        if (won && !gaveUpOverride) {
            startPineappleRain();
        }

        adjustBackground();
    }

    // Start pineapple rain animation
    function startPineappleRain() {
        console.log("Starting pineapple rain");
        const container = document.createElement("div");
        container.className = "pineapple-rain";
        document.body.appendChild(container);

        for (let i = 0; i < 20; i++) {
            const piece = document.createElement("div");
            piece.className = "pineapple-piece";
            piece.textContent = "🍍";
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.animationDuration = `${Math.random() * 2 + 2}s`;
            piece.style.animationDelay = `${Math.random() * 1}s`;
            piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
            piece.style.setProperty('--drift', Math.random() * 2 - 1);
            container.appendChild(piece);
        }

        setTimeout(() => {
            container.remove();
            console.log("Pineapple rain ended");
        }, 4000);
    }

    // Initialize game
    console.log("Initializing game");
    await fetchOfficialGames();
});