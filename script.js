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
    let pineappleRainTimeout = null;

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
    const shareText = document.getElementById("share-text");
    const gameNumberDisplay = document.getElementById("game-number-display");
    const shareWhatsApp = document.getElementById("share-whatsapp");
    const shareTelegram = document.getElementById("share-telegram");
    const shareTwitter = document.getElementById("share-twitter");
    const shareInstagram = document.getElementById("share-instagram");
    const backgroundContainer = document.getElementById("background-container");

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

    // Hint reveal order mapping: index to hint ID
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

    // Adjust background
    function adjustBackground() {
        console.log("Adjusting background to:", currentBackground);
        if (backgroundContainer && guessArea) {
            backgroundContainer.style.background = `url('${currentBackground}') no-repeat center center`;
            backgroundContainer.style.backgroundSize = "cover";

            // Calculate the height based on the guess area's top position
            const guessAreaRect = guessArea.getBoundingClientRect();
            const backgroundHeight = guessAreaRect.top; // Distance from top of viewport to top of guess area

            // Use visualViewport if available to handle keyboard presence
            if (window.visualViewport) {
                const viewportHeight = window.visualViewport.height;
                backgroundContainer.style.height = `${Math.min(viewportHeight, backgroundHeight)}px`;
                console.log("Using visualViewport height:", viewportHeight, "Guess area top:", backgroundHeight);
            } else {
                backgroundContainer.style.height = backgroundHeight > 0 ? `${backgroundHeight}px` : isMobile ? `calc(100vh - 10vh)` : `calc(100vh - 8vh)`;
                console.log("Using fallback height, guess area top:", backgroundHeight);
            }

            backgroundContainer.offsetHeight;
        } else {
            console.warn("background-container or guess-area not found, using default background height");
            backgroundContainer.style.height = isMobile ? `calc(100vh - 10vh)` : `calc(100vh - 8vh)`;
        }
        
        document.body.style.background = "#FFFFFF";
    }

    window.addEventListener("resize", adjustBackground);
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", () => {
            console.log("Visual viewport resized, adjusting background");
            adjustBackground();
        });
    }

    // Setup game name (WORDY) to return to game screen
    if (gameNameElement) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Game name (WORDY) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Game name click ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        gameNameElement.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Setup guess input
    if (guessInput) {
        guessInput.disabled = false;
        guessInput.readOnly = false;
        guessInput.addEventListener("input", (e) => {
            console.log("Guess input value changed:", guessInput.value);
            guessInput.value = guessInput.value.toUpperCase();
            if (animationTimeout) {
                clearTimeout(animationTimeout);
                animationTimeout = null;
                guessInputContainer.classList.remove("wrong-guess");
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
                    guessInput.focus();
                }
            }
        });
        guessInput.addEventListener("focus", () => {
            console.log("Guess input focused");
            activeInput = guessInput;
            adjustBackground();
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
            adjustBackground();
        }, 0);
    } else {
        console.error("guess-input not found in DOM");
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
            console.log("Guess button triggered:", { gameOver, disabled: guessInput.disabled, isProcessingGuess, guess: guessInput.value });
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
                    adjustBackground();
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
        officialTab.addEventListener("click", () => {
            console.log("Official tab clicked");
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            officialContent.style.display = "flex";
            privateContent.classList.remove("active");
            privateContent.style.display = "none";
            displayGameList();
        });

        privateTab.addEventListener("click", async () => {
            console.log("Private tab clicked");
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            privateContent.style.display = "flex";
            officialContent.classList.remove("active");
            officialContent.style.display = "none";
            if (privateGames.length === 0) {
                await fetchPrivateGames();
            }
            displayGameList();
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
            giveUpDialog.style.display = "flex";
            console.log("Showing give-up dialog");
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
            e.stopPropagation();
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
            e.stopPropagation();
            console.log("Guesses link triggered", { isUILocked, isLoadingGame, guesses, guessCount });
            if (isUILocked || isLoadingGame) {
                console.log("Guesses link ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            const guessesList = document.getElementById("guesses-list");
            if (!guessesList) {
                console.error("guesses-list element not found in DOM");
                isUILocked = false;
                return;
            }
            const guessesContent = guesses.length > 0
                ? guesses.map(g => g.toUpperCase()).join(' <span class="separator yellow">|</span> ')
                : "No guesses yet!";
            guessesList.innerHTML = guessesContent;
            console.log("Rendered guesses:", guessesContent);
            guessesScreen.style.display = "flex";
            console.log("Showing guesses screen, guessesList:", guessesList.innerHTML);
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        guessesLink.addEventListener(isMobile ? "touchstart" : "click", handler);

        guessesScreen.addEventListener("click", (e) => {
            if (e.target === guessesScreen) {
                console.log("Clicked outside guesses screen");
                guessesScreen.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
        });
    }

    // Guesses close button
    if (guessesCloseBtn) {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            guessesScreen.style.display = "none";
            if (guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
            setTimeout(() => { isUILocked = false; }, 500);
        };
        guessesCloseBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
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
                if (!currentGameNumber || !currentGameId) {
                    throw new Error("No current game number or ID set");
                }
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
                console.log("Navigation details", { isPrivate, currentIndex, gameListLength: gameList.length });
                if (currentIndex === -1) {
                    throw new Error(`Current game not found in game list: ${currentGameNumber}, ID: ${currentGameId}`);
                }
                if (currentIndex < gameList.length - 1) {
                    const targetGame = gameList[currentIndex + 1];
                    console.log("Loading previous game", { currentIndex, targetIndex: currentIndex + 1, targetGame });
                    currentBackground = targetGame["Background"] && targetGame["Background"].trim() !== "" ? targetGame["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(targetGame);
                    resetScreenDisplays(gameScreen);
                    adjustBackground();
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
                if (!currentGameNumber || !currentGameId) {
                    throw new Error("No current game number or ID set");
                }
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
                console.log("Navigation details", { isPrivate, currentIndex, gameListLength: gameList.length });
                if (currentIndex === -1) {
                    throw new Error(`Current game not found in game list: ${currentGameNumber}, ID: ${currentGameId}`);
                }
                if (currentIndex > 0) {
                    const targetGame = gameList[currentIndex - 1];
                    console.log("Loading next game", { currentIndex, targetIndex: currentIndex - 1, targetGame });
                    currentBackground = targetGame["Background"] && targetGame["Background"].trim() !== "" ? targetGame["Background"] : defaultBackground;
                    await preloadBackground(currentBackground);
                    loadGame(targetGame);
                    resetScreenDisplays(gameScreen);
                    adjustBackground();
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

    // Create a Wordy button
    if (createPineappleBtn && formContent) {
        createPineappleBtn.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create a Wordy triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            resetScreenDisplays(formContent);
            activeInput = document.getElementById("game-name-input");
            if (activeInput) activeInput.focus();
            adjustBackground();
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
            resetScreenDisplays(formContent);
            activeInput = document.getElementById("game-name-input");
            if (activeInput) activeInput.focus();
            adjustBackground();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Next game button on end screen
    if (nextGameBtnEnd) {
        nextGameBtnEnd.addEventListener(isMobile ? "touchstart" : "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next Game button triggered", { isUILocked });
            if (isUILocked) return;
            isUILocked = true;
            resetGame();
            showGameSelectScreen();
            adjustBackground();
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
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
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
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
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
                    if (activeInput) activeInput.focus();
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
                    if (activeInput) activeInput.focus();
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
                resetScreenDisplays(gameSelectContent);
                privateTab.classList.add("active");
                officialTab.classList.remove("active");
                privateContent.classList.add("active");
                privateContent.style.display = "flex";
                officialContent.classList.remove("active");
                officialContent.style.display = "none";
                await fetchPrivateGames();
                displayGameList();
                adjustBackground();
            } catch (error) {
                console.error("Error submitting form:", error);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to create game: " + error.message;
                    formErrorDialog.style.display = "flex";
                    if (activeInput) activeInput.focus();
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
        });

        formErrorDialog.addEventListener("click", (e) => {
            if (e.target === formErrorDialog) {
                console.log("Clicked outside form error dialog");
                formErrorDialog.style.display = "none";
                if (activeInput) activeInput.focus();
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
            resetScreenDisplays(gameScreen);
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Give-up dialog
    if (giveUpDialog) {
        giveUpDialog.addEventListener("click", (e) => {
            if (e.target === giveUpDialog) {
                console.log("Clicked outside give-up dialog");
                giveUpDialog.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
        });
    }

    // Show game select screen
    function showGameSelectScreen() {
        console.log("Showing game select overlay", { isUILocked });
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

    // Fetch game data
    async function fetchGameData() {
        try {
            // Check for cached data
            const cachedData = localStorage.getItem("officialGamesCache");
            const cacheTime = localStorage.getItem("officialGamesCacheTime");
            const now = Date.now();
            const cacheTTL = 60 * 60 * 1000; // 1 hour TTL

            if (cachedData && cacheTime && now - parseInt(cacheTime) < cacheTTL) {
                console.log("Using cached official games");
                allGames = JSON.parse(cachedData);
                const latestGame = allGames[0];
                currentBackground = latestGame["Background"] && latestGame["Background"].trim() !== "" ? latestGame["Background"] : defaultBackground;
                await preloadBackground(currentBackground);
                loadGame(latestGame);
                resetScreenDisplays(gameScreen);
                updateArrowStates(0, allGames);
                adjustBackground();
                return;
            }

            console.log("Fetching official games from:", officialUrl);
            const response = await fetch(officialUrl, {
                method: "GET",
                mode: "cors",
                cache: "no-cache",
                headers: { "Accept": "text/csv" }
            });
            if (!response.ok) {
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            if (!text.trim()) throw new Error("Empty CSV response");

            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            allGames = parsed.data
                .filter(game => game["Game Number"] && game["Secret Word"])
                .sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            if (allGames.length === 0) throw new Error("No valid games in CSV");

            // Store games in cache
            localStorage.setItem("officialGamesCache", JSON.stringify(allGames));
            localStorage.setItem("officialGamesCacheTime", now.toString());

            const latestGame = allGames[0];
            currentBackground = latestGame["Background"] && latestGame["Background"].trim() !== "" ? latestGame["Background"] : defaultBackground;
            await preloadBackground(currentBackground);
            loadGame(latestGame);
            resetScreenDisplays(gameScreen);
            updateArrowStates(0, allGames);
            adjustBackground();
        } catch (error) {
            console.error("Error in fetchGameData:", error.message);
            allGames = [
                {
                    "Game Number": "1",
                    "Secret Word": "TEST",
                    "Hint 1": "SAMPLE",
                    "Hint 2": "WORD",
                    "Hint 3": "GAME",
                    "Hint 4": "PLAY",
                    "Hint 5": "FUN",
                    "Background": defaultBackground
                }
            ];
            currentBackground = defaultBackground;
            await preloadBackground(currentBackground);
            loadGame(allGames[0]);
            resetScreenDisplays(gameScreen);
            updateArrowStates(0, allGames);
            adjustBackground();
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load official games. Using default game.";
                formErrorDialog.style.display = "flex";
            }
        } finally {
            isUILocked = false;
            isLoadingGame = false;
        }
    }

    // Fetch private games
    async function fetchPrivateGames() {
        try {
            console.log("Fetching private-games from:", privateUrl);
            const response = await fetch(privateUrl, {
                method: "GET",
                mode: "cors",
                cache: "no-cache",
                headers: { "Accept": "text/csv" }
            });
            if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            const text = await response.text();

            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            privateGames = parsed.data
                .filter(game => game["Game Name"] && game["Secret Word"])
                .map((game, index) => ({
                    ...game,
                    "Game Number": `P${Date.now()}-${index}`,
                    "Display Name": `Game #${index + 1} - ${game["Game Name"]}`
                }))
                .sort((a, b) => {
                    const aTime = parseInt(a["Game Number"].split('-')[0].substring(1));
                    const bTime = parseInt(b["Game Number"].split('-')[0].substring(1));
                    return bTime - aTime;
                });
            console.log("Parsed private games:", privateGames);
        } catch (error) {
            console.error("Error in fetchPrivateGames:", error.message);
            privateGames = [];
        }
    }

    // Display game list
    function displayGameList() {
        const officialList = document.getElementById("official-list");
        if (officialList) {
            officialList.innerHTML = "";
            if (gameNameElement) {
                gameNameElement.textContent = "WORDY";
            }
            console.log("Populating official games list with:", allGames);

            if (!allGames || allGames.length === 0) {
                console.log("No official games to display");
                officialList.innerHTML = "<div>No official games available</div>";
            } else {
                const results = JSON.parse(localStorage.getItem("pineappleResults") || "{}");
                allGames.forEach((game, index) => {
                    const gameNumber = game["Game Number"];
                    const secretWord = game["Secret Word"] ? game["Secret Word"].toUpperCase() : "N/A";
                    const pastResult = results[gameNumber];
                    let guessesDisplay = '-';
                    if (pastResult) {
                        if (pastResult.guesses === "Gave Up") {
                            guessesDisplay = "Gave Up";
                        } else if (pastResult.guesses === "X") {
                            guessesDisplay = "X";
                        } else if (pastResult.secretWord === secretWord) {
                            guessesDisplay = pastResult.guesses;
                        }
                    }

                    const showSecretWord = pastResult && (pastResult.guesses === "Gave Up" || pastResult.guesses === "X" || pastResult.secretWord === secretWord);
                    const displayWord = showSecretWord ? secretWord : "Play Now";

                    const gameItem = document.createElement("div");
                    gameItem.className = "game-list-row";
                    gameItem.innerHTML = `
                        <span>${gameNumber}</span>
                        <span class="${displayWord === 'Play Now' ? 'play-now' : ''}">${displayWord}</span>
                        <span>${guessesDisplay}</span>
                    `;
                    if (isMobile) {
                        gameItem.addEventListener("touchstart", (e) => {
                            touchStartX = e.touches[0].clientX;
                            touchStartY = e.touches[0].clientY;
                            touchMoved = false;
                            console.log("Touch started on game item", { x: touchStartX, y: touchStartY });
                        });
                        gameItem.addEventListener("touchmove", (e) => {
                            const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                            if (deltaX > touchThreshold || deltaY > touchThreshold) {
                                touchMoved = true;
                                console.log("Touch moved, marking as scroll", { deltaX, deltaY });
                            }
                        });
                        gameItem.addEventListener("touchend", async (e) => {
                            e.preventDefault();
                            if (!touchMoved && !isUILocked) {
                                console.log("Touch ended without movement, selecting game:", game);
                                isUILocked = true;
                                currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                                await preloadBackground(currentBackground);
                                loadGame(game);
                                resetScreenDisplays(gameScreen);
                                activeInput = guessInput;
                                if (activeInput) activeInput.focus();
                                adjustBackground();
                                const currentIndex = allGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                                updateArrowStates(currentIndex, allGames);
                                setTimeout(() => { isUILocked = false; }, 500);
                            }
                        });
                    } else {
                        gameItem.addEventListener("click", async () => {
                            console.log("Clicked official game:", game, { isUILocked });
                            if (isUILocked) return;
                            isUILocked = true;
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            activeInput = guessInput;
                            if (activeInput) activeInput.focus();
                            adjustBackground();
                            const currentIndex = allGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                            updateArrowStates(currentIndex, allGames);
                            setTimeout(() => { isUILocked = false; }, 500);
                        });
                    }
                    officialList.appendChild(gameItem);
                    console.log(`Rendered official game ${gameNumber}: Secret Word: ${secretWord}, Guesses: ${guessesDisplay}, Stored Result:`, pastResult);
                });
                setTimeout(() => {
                    officialList.style.display = "none";
                    officialList.offsetHeight;
                    officialList.style.display = "flex";
                    console.log("Forced repaint on official-list");
                }, 0);
            }
        }

        const privateList = document.getElementById("private-list");
        if (privateList) {
            privateList.innerHTML = "";
            console.log("Populating private games list", privateGames);

            if (!privateGames.length) {
                privateList.innerHTML = "<div>No private games yet</div>";
            } else {
                const results = JSON.parse(localStorage.getItem("privatePineappleResults") || "{}");
                console.log("Private game results from localStorage:", results);
                privateGames.forEach(game => {
                    const gameNumber = game["Game Number"];
                    const gameName = game["Game Name"].toUpperCase();
                    const secretWord = game["Secret Word"] ? game["Secret Word"].toUpperCase() : "N/A";
                    const pastResult = results[gameNumber];
                    let guessesDisplay = '-';
                    let showSecretWord = false;

                    console.log(`Checking result for game ${gameNumber}:`, pastResult);

                    if (pastResult) {
                        if (pastResult.guesses === "Gave Up") {
                            guessesDisplay = "Gave Up";
                            showSecretWord = true;
                        } else if (pastResult.guesses === "X") {
                            guessesDisplay = "X";
                            showSecretWord = true;
                        } else if (pastResult.secretWord === secretWord) {
                            guessesDisplay = pastResult.guesses.toString();
                            showSecretWord = true;
                        }
                    }

                    const displayWord = showSecretWord ? secretWord : "Play Now";

                    const gameItem = document.createElement("div");
                    gameItem.className = "game-list-row";
                    gameItem.innerHTML = `
                        <span>${gameName}</span>
                        <span class="${displayWord === 'Play Now' ? 'play-now' : ''}">${displayWord}</span>
                        <span>${guessesDisplay}</span>
                    `;
                    if (isMobile) {
                        gameItem.addEventListener("touchstart", (e) => {
                            touchStartX = e.touches[0].clientX;
                            touchStartY = e.touches[0].clientY;
                            touchMoved = false;
                            console.log("Touch started on private game item", { x: touchStartX, y: touchStartY });
                        });
                        gameItem.addEventListener("touchmove", (e) => {
                            const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                            if (deltaX > touchThreshold || deltaY > touchThreshold) {
                                touchMoved = true;
                                console.log("Touch moved on private game, marking as scroll", { deltaX, deltaY });
                            }
                        });
                        gameItem.addEventListener("touchend", async (e) => {
                            e.preventDefault();
                            if (!touchMoved && !isUILocked) {
                                console.log("Touch ended without movement, selecting private game:", game);
                                isUILocked = true;
                                currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                                await preloadBackground(currentBackground);
                                loadGame(game);
                                resetScreenDisplays(gameScreen);
                                activeInput = guessInput;
                                if (activeInput) activeInput.focus();
                                adjustBackground();
                                const currentIndex = privateGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                                updateArrowStates(currentIndex, privateGames);
                                setTimeout(() => { isUILocked = false; }, 500);
                            }
                        });
                    } else {
                        gameItem.addEventListener("click", async () => {
                            console.log("Clicked private game:", game, { isUILocked });
                            if (isUILocked) return;
                            isUILocked = true;
                            currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
                            await preloadBackground(currentBackground);
                            loadGame(game);
                            resetScreenDisplays(gameScreen);
                            activeInput = guessInput;
                            if (activeInput) activeInput.focus();
                            adjustBackground();
                            const currentIndex = privateGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                            updateArrowStates(currentIndex, privateGames);
                            setTimeout(() => { isUILocked = false; }, 500);
                        });
                    }
                    privateList.appendChild(gameItem);
                    console.log(`Rendered private game ${gameNumber}: Name: ${gameName}, Secret Word: ${displayWord}, Guesses: ${guessesDisplay}, Stored Result:`, pastResult);
                });
                setTimeout(() => {
                    privateList.style.display = "none";
                    privateList.offsetHeight;
                    privateList.style.display = "flex";
                    console.log("Forced repaint on private-list");
                }, 0);
            }
        }
    }

    // Setup hints
    function setupHints() {
        console.log("Setting up hints:", hints, "hintIndex:", hintIndex, "hintStyles:", hintStyles);
        for (let i = 1; i <= 5; i++) {
            const hintElement = document.getElementById(`hint-${i}`);
            if (hintElement) {
                hintElement.style.display = "none";
                hintElement.innerHTML = "";
                hintElement.className = "hint";
                if (hintStyles[i - 1]) {
                    hintElement.classList.add(hintStyles[i - 1].shape, hintStyles[i - 1].color);
                }
            }
        }

        const visibleHints = hints.slice(0, hintIndex + 1);
        visibleHints.forEach((hint, index) => {
            const hintElement = document.getElementById(hintRevealOrder[index]);
            if (hintElement && hintStyles[index]) {
                const isFluffyCloudShape = hintStyles[index].shape === "hint-shape-fluffy-cloud";
                const hintContent = isFluffyCloudShape ? `<span class="hint-text">${hint}</span>` : hint;
                hintElement.innerHTML = hintContent;
                hintElement.style.display = "flex";
                const effect = hintStyles[index].effect;
                if (effect === "letter") {
                    const letters = hint.split("").map((letter, i) => {
                        const displayChar = letter === " " ? " " : letter;
                        return `<span class="letter" style="animation: fadeInLetter 0.3s forwards; animation-delay: ${i * 0.05}s">${displayChar}</span>`;
                    }).join("");
                    hintElement.innerHTML = isFluffyCloudShape ? `<span class="hint-text">${letters}</span>` : letters;
                } else {
                    hintElement.classList.add(`reveal-${effect}`);
                    setTimeout(() => {
                        hintElement.classList.remove(`reveal-${effect}`);
                    }, 1000);
                }
            }
        });
        console.log("Hints displayed:", visibleHints);
    }

    // Reveal hint
    function revealHint() {
        hintIndex++;
        console.log("Revealing hint, new hintIndex:", hintIndex, "total hints:", hints.length);
        if (hintIndex < hints.length) {
            const hintElement = document.getElementById(hintRevealOrder[hintIndex]);
            if (hintElement && hintStyles[hintIndex]) {
                const hint = hints[hintIndex];
                const isFluffyCloudShape = hintStyles[hintIndex].shape === "hint-shape-fluffy-cloud";
                const hintContent = isFluffyCloudShape ? `<span class="hint-text">${hint}</span>` : hint;
                hintElement.innerHTML = hintContent;
                hintElement.style.display = "flex";
                const effect = hintStyles[hintIndex].effect;
                if (effect === "letter") {
                    const letters = hint.split("").map((letter, i) => {
                        const displayChar = letter === " " ? " " : letter;
                        return `<span class="letter" style="animation: fadeInLetter 0.3s forwards; animation-delay: ${i * 0.05}s">${displayChar}</span>`;
                    }).join("");
                    hintElement.innerHTML = isFluffyCloudShape ? `<span class="hint-text">${letters}</span>` : letters;
                } else {
                    hintElement.classList.add(`reveal-${effect}`);
                    setTimeout(() => {
                        hintElement.classList.remove(`reveal-${effect}`);
                    }, 1000);
                }
                console.log("Revealed hint:", hint, "with effect:", effect);
            }
        }
    }

    // Handle guess
    function handleGuess(guess) {
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored:", { isProcessingGuess, gameOver });
            return;
        }
        isProcessingGuess = true;
        console.log("Handling guess:", guess);
        guessBtn.disabled = true;
        guessInput.disabled = true;

        guessInputContainer.classList.remove("wrong-guess");
        guessInput.value = "";
        guessCount++;
        guesses.push(guess);
        console.log("Guess added, current guesses:", guesses, "guessCount:", guessCount);

        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}/5`;
            console.log("Updated guessesLink text:", guessesLink.textContent);
        }

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
            saveGameResult(gameType, normalizedGameNumber, secretWord, guessCount);
            endGame(true);
        } else {
            console.log("Incorrect guess, animating...");
            guessInputContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                isProcessingGuess = false;
                guessBtn.disabled = false;
                guessInput.disabled = false;
                console.log("Animation completed, input reset");
                if (guessInput) {
                    guessInput.focus();
                    activeInput = guessInput;
                }

                if (hintIndex < hints.length - 1) {
                    revealHint();
                } else {
                    saveGameResult(
                        currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple",
                        currentGameNumber.includes("- Private") ? currentGameId : currentGameNumber.replace("Game #", ""),
                        secretWord,
                        "X"
                    );
                    endGame(false, false);
                }
            }, 350);
        }
    }

    // Save game result
    function saveGameResult(gameType, gameNumber, secretWord, guesses) {
        console.log("Attempting to save game result", { gameType, gameNumber, secretWord, guesses });
        const resultsKey = gameType === "pineapple" ? "pineappleResults" : "privatePineappleResults";
        let normalizedGameNumber = String(gameNumber);
        if (gameType === "pineapple") {
            normalizedGameNumber = gameNumber.replace("Game #", "");
        }
        console.log(`Normalized game number: ${normalizedGameNumber}`);
        const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
        if (!results[normalizedGameNumber] || results[normalizedGameNumber].guesses === '-') {
            results[normalizedGameNumber] = { secretWord, guesses };
            localStorage.setItem(resultsKey, JSON.stringify(results));
            console.log(`Game result saved for ${resultsKey}[${normalizedGameNumber}]:`, results[normalizedGameNumber]);
        } else {
            console.log(`Game result not saved for ${resultsKey}[${normalizedGameNumber}]: existing score '${results[normalizedGameNumber].guesses}' preserved`);
        }
        console.log(`Current ${resultsKey} in localStorage:`, results);
    }

    // End game
    function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp, guessCount, secretWord, guesses });
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;

        const existingGameOverMessage = document.getElementById("game-over-message");
        if (existingGameOverMessage) existingGameOverMessage.remove();
        const existingSecretWordMessage = document.getElementById("secret-word-message");
        if (existingSecretWordMessage) existingSecretWordMessage.remove();

        resetScreenDisplays(document.getElementById("game-over"));
        document.getElementById("game-over").style.display = "flex";
        document.getElementById("game-over").classList.add("active");

        if (guessInput && guessInputContainer) {
            guessInput.value = "";
            guessInputContainer.classList.add("game-ended");
        }

        for (let i = 1; i <= 5; i++) {
            const hintElement = document.getElementById(`hint-${i}`);
            if (hintElement) {
                hintElement.style.display = "none";
            }
        }

        const gameOverScreen = document.getElementById("game-over");
        const gameOverMessage = document.createElement("span");
        gameOverMessage.id = "game-over-message";
        gameOverMessage.textContent = won ? "Well Done" : "Hard Luck";

        const secretWordMessage = document.createElement("span");
        secretWordMessage.id = "secret-word-message";
        secretWordMessage.textContent = `The secret word was ${secretWord}`;
        gameOverScreen.insertBefore(gameOverMessage, shareSection);
        gameOverScreen.insertBefore(secretWordMessage, shareSection);

        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber.split(" -")[0];
            gameNumberDisplay.style.display = "block";
        }

        let shareMessage;
        if (won) {
            let normalizedGameNumber = currentGameNumber.includes("- Private")
                ? currentGameId
                : currentGameNumber.replace("Game #", "");
            shareMessage = `I solved Wordy #${normalizedGameNumber} in\n${guessCount}\n${guessCount === 1 ? 'Guess' : 'Guesses'}`;
        } else {
            shareMessage = `Play Wordy\nThe Big Brain Word Game`;
        }

        if (shareText) {
            const displayMessage = won
                ? `I solved Wordy #${currentGameNumber.includes("- Private") ? currentGameId : currentGameNumber.replace("Game #", "")} in<br><span class="guess-count">${guessCount}</span><br>${guessCount === 1 ? 'Guess' : 'Guesses'}`
                : `Play Wordy<br>The Big Brain Word Game`;
            shareText.innerHTML = displayMessage;
            console.log("Share text set to:", shareText.innerHTML);
        }

        const shareButtons = {
            whatsapp: shareWhatsApp,
            telegram: shareTelegram,
            twitter: shareTwitter,
            instagram: shareInstagram
        };

        if (shareButtons.whatsapp) {
            shareButtons.whatsapp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        }
        if (shareButtons.telegram) {
            shareButtons.telegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://wordy.bigbraingames.net")}&text=${encodeURIComponent(shareMessage)}`;
        }
        if (shareButtons.twitter) {
            shareButtons.twitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
        }
        if (shareButtons.instagram) {
            shareButtons.instagram.addEventListener("click", (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(shareMessage).then(() => {
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
    }

    // Start pineapple rain
    function startPineappleRain() {
        console.log("Starting pineapple rain animation");
        const rainContainer = document.createElement("div");
        rainContainer.className = "pineapple-rain";
        document.body.appendChild(rainContainer);

        for (let i = 0; i < 20; i++) {
            const piece = document.createElement("div");
            piece.className = "pineapple-piece";
            piece.textContent = "🍍";
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.animationDuration = `${2 + Math.random() * 3}s`;
            piece.style.setProperty('--drift', Math.random() * 2 - 1);
            piece.style.setProperty('--rotation', `${Math.random() * 720}deg`);
            rainContainer.appendChild(piece);
        }

        pineappleRainTimeout = setTimeout(() => {
            rainContainer.remove();
            console.log("Pineapple rain animation ended");
        }, 5000);
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
        console.log("Guesses array reset:", guesses);
        isProcessingGuess = false;
        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
            guessInput.focus();
            activeInput = guessInput;
        }
        if (guessBtn) {
            guessBtn.disabled = false;
        }
        if (guessesLink) {
            guessesLink.textContent = "Guesses: 0/5";
            console.log("Reset guessesLink text:", guessesLink.textContent);
        }
        if (guessInputContainer) {
            guessInputContainer.classList.remove("game-ended", "wrong-guess");
            guessInputContainer.style.background = "rgba(255, 255, 255, 0.85)";
        }
        if (gameScreen) {
            gameScreen.classList.remove("game-ended");
        }
        if (animationTimeout) {
            clearTimeout(animationTimeout);
            animationTimeout = null;
        }
        if (pineappleRainTimeout) {
            clearTimeout(pineappleRainTimeout);
            pineappleRainTimeout = null;
        }
        const pineappleRain = document.querySelector(".pineapple-rain");
        if (pineappleRain) {
            pineappleRain.remove();
        }
        const guessesList = document.getElementById("guesses-list");
        if (guessesList) {
            guessesList.innerHTML = "No guesses yet!";
            console.log("Reset guessesList:", guessesList.innerHTML);
        }
        const existingGameOverMessage = document.getElementById("game-over-message");
        if (existingGameOverMessage) existingGameOverMessage.remove();
        const existingSecretWordMessage = document.getElementById("secret-word-message");
        if (existingSecretWordMessage) existingSecretWordMessage.remove();
        console.log("Game state reset complete");
    }

    // Load game
    function loadGame(game) {
        if (!game) {
            console.error("No game provided to loadGame");
            return;
        }
        console.log("Loading game:", game);
        resetGame();
        isLoadingGame = true;
        try {
            secretWord = game["Secret Word"] ? game["Secret Word"].toUpperCase().trim() : "";
            if (secretWord.includes(" ")) {
                throw new Error("Secret word contains internal spaces");
            }
            hints = [
                game["Hint 1"]?.toUpperCase().trim() || "",
                game["Hint 2"]?.toUpperCase().trim() || "",
                game["Hint 3"]?.toUpperCase().trim() || "",
                game["Hint 4"]?.toUpperCase().trim() || "",
                game["Hint 5"]?.toUpperCase().trim() || ""
            ].filter(hint => hint !== "");
            console.log("Loaded hints with preserved internal spaces:", hints);

            hintIndex = 0;
            currentGameId = game["Game Number"];
            const isPrivate = game["Display Name"] && game["Display Name"].includes("-");
            if (isPrivate) {
                currentGameNumber = game["Display Name"].split("-")[0].trim() + " - Private";
            } else {
                currentGameNumber = `Game #${game["Game Number"]}`;
            }
            console.log("Set currentGameId:", currentGameId, "currentGameNumber:", currentGameNumber, "isPrivate:", isPrivate);

            if (gameNumberText) {
                gameNumberText.textContent = currentGameNumber.split(" -")[0];
            } else {
                console.error("game-number-text element not found");
            }

            if (gameNameElement) {
                gameNameElement.textContent = isPrivate ? game["Game Name"].toUpperCase() : "WORDY";
            }

            randomizeHintStyles();
            setupHints();

            const resultsKey = isPrivate ? "privatePineappleResults" : "pineappleResults";
            const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
            const pastResult = results[currentGameId];
            console.log(`Checking past result for ${resultsKey}[${currentGameId}]:`, pastResult);

            if (pastResult && pastResult.secretWord === secretWord) {
                gameOver = true;
                guessInput.disabled = true;
                guessBtn.disabled = true;
                if (pastResult.guesses !== "Gave Up" && pastResult.guesses !== "X") {
                    guessCount = parseInt(pastResult.guesses, 10) || 0;
                    guesses = Array(guessCount).fill("PREVIOUS");
                    if (guessesLink) {
                        guessesLink.textContent = `Guesses: ${guessCount}/5`;
                    }
                    hintIndex = guessCount - 1;
                    if (hintIndex >= hints.length) hintIndex = hints.length - 1;
                    setupHints();
                } else if (pastResult.guesses === "Gave Up") {
                    gaveUp = true;
                    hintIndex = hints.length - 1;
                    setupHints();
                    endGame(false, true);
                } else if (pastResult.guesses === "X") {
                    hintIndex = hints.length - 1;
                    setupHints();
                    endGame(false, false);
                }
            } else {
                console.log("No past result found, starting fresh game");
                gameOver = false;
                guessInput.disabled = false;
                guessBtn.disabled = false;
                if (guessInput) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
                setupHints();
            }

            adjustBackground();
            console.log("Game loaded successfully:", { secretWord, hints, hintIndex, gameOver, guessCount });
        } catch (error) {
            console.error("Error loading game:", error.message);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load game: " + error.message;
                formErrorDialog.style.display = "flex";
            }
        } finally {
            isLoadingGame = false;
        }
    }

    // Initialize game
    try {
        await fetchGameData();
    } catch (error) {
        console.error("Initialization error:", error);
        if (formErrorDialog && formErrorMessage) {
            formErrorMessage.textContent = "Failed to initialize game.";
            formErrorDialog.style.display = "flex";
        }
    }

    // Setup CSS for letter reveal animation
    const style = document.createElement("style");
    style.textContent = `
        .letter {
            display: inline-block;
            opacity: 0;
        }
        @keyframes fadeInLetter {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
});