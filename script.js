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
        const backgroundContainer = document.getElementById("background-container");
        const adBox = document.getElementById("ad-box");
        
        if (backgroundContainer && adBox) {
            backgroundContainer.style.background = `url('${currentBackground}') no-repeat center center`;
            backgroundContainer.style.backgroundSize = "auto 100%"; // Fit vertically without cropping

            // Calculate height to cover game-screen and guess-area (up to top of ad-box)
            const adBoxRect = adBox.getBoundingClientRect();
            const backgroundHeight = adBoxRect.top; // Distance from top of viewport to top of ad-box

            // Use visualViewport if available to handle keyboard presence
            if (window.visualViewport && isMobile) {
                const viewportHeight = window.visualViewport.height;
                // Use the smaller of the viewport height and ad-box top to account for keyboard
                backgroundContainer.style.height = `${Math.min(viewportHeight, backgroundHeight)}px`;
                console.log("Using visualViewport height:", viewportHeight, "Ad-box top:", backgroundHeight);
            } else {
                // Fallback: Use ad-box top position
                backgroundContainer.style.height = backgroundHeight > 0 ? `${backgroundHeight}px` : `calc(100vh - 2.5vh)`;
                console.log("Using fallback height, ad-box top:", backgroundHeight);
            }

            // Force repaint
            backgroundContainer.offsetHeight;
        } else {
            console.warn("background-container or ad-box not found, using default background height");
            backgroundContainer.style.height = isMobile ? `calc(100vh - 2.5vh)` : `calc(100vh - 2.5vh)`;
        }
        
        document.body.style.background = "#000000"; // Ensure body background is black
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
            if (activeInput && isMobile) activeInput.focus(); // Ensure keyboard appears on mobile
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
        guessInput.addEventListener("blur", () => {
            if (gameScreen.style.display === "flex" && !gameOver && !isProcessingGuess && !isUILocked && isMobile) {
                console.log("Guess input blurred, re-focusing on mobile");
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
            if (isMobile) {
                guessInput.focus(); // Ensure keyboard appears on mobile
                activeInput = guessInput;
                console.log("Initial focus set on guess-input for mobile");
            }
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
                    if (isMobile) {
                        guessInput.focus(); // Ensure keyboard appears on mobile
                        console.log("Focused guess-input on game screen load for mobile");
                    }
                }, 0);
            }
        } else if (activeScreen === gameSelectContent || activeScreen === formContent || activeScreen.id === "game-over") {
            activeScreen.style.display = "flex";
            activeScreen.classList.add("active");
            if (activeScreen === formContent) {
                activeInput = document.getElementById("game-name-input");
                if (activeInput && isMobile) setTimeout(() => activeInput.focus(), 0);
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
            if (guessInput && !gameOver && !isProcessingGuess && isMobile) {
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
                if (guessInput && !gameOver && !isProcessingGuess && isMobile) {
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
            if (guessInput && !gameOver && !isProcessingGuess && isMobile) {
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
            const gameNumbers = allGames.map(game => parseInt(game.gameNumber.replace("Game #", "")));
            const current = parseInt(currentGameNumber.replace("Game #", ""));
            const prevGameNumber = gameNumbers.filter(n => n < current).sort((a, b) => b - a)[0];
            if (prevGameNumber) {
                console.log(`Loading previous game: Game #${prevGameNumber}`);
                await loadGame(`Game #${prevGameNumber}`);
            } else {
                console.log("No previous game available");
                prevGameArrow.classList.add("disabled");
            }
            setTimeout(() => { isUILocked = false; }, 500);
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
            const gameNumbers = allGames.map(game => parseInt(game.gameNumber.replace("Game #", "")));
            const current = parseInt(currentGameNumber.replace("Game #", ""));
            const nextGameNumber = gameNumbers.filter(n => n > current).sort((a, b) => a - b)[0];
            if (nextGameNumber) {
                console.log(`Loading next game: Game #${nextGameNumber}`);
                await loadGame(`Game #${nextGameNumber}`);
            } else {
                console.log("No next game available");
                nextGameArrow.classList.add("disabled");
            }
            setTimeout(() => { isUILocked = false; }, 500);
        });
    }

    // Create Pineapple button
    if (createPineappleBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple button triggered", { isUILocked });
            if (isUILocked) {
                console.log("Create Pineapple button ignored: UI locked");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                input.value = "";
                input.disabled = false;
                input.readOnly = false;
            });
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        createPineappleBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Create Pineapple link (end screen)
    if (createPineappleLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple link (end) triggered", { isUILocked });
            if (isUILocked) {
                console.log("Create Pineapple link ignored: UI locked");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                input.value = "";
                input.disabled = false;
                input.readOnly = false;
            });
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        createPineappleLink.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Form back button
    if (formBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form Back button triggered", { isUILocked });
            if (isUILocked) {
                console.log("Form Back button ignored: UI locked");
                return;
            }
            isUILocked = true;
            showGameSelectScreen();
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        formBackBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Official back button
    if (officialBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Official Back button triggered", { isUILocked });
            if (isUILocked) {
                console.log("Official Back button ignored: UI locked");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            if (guessInput && !gameOver && !isProcessingGuess && isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        officialBackBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Private back button
    if (privateBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Private Back button triggered", { isUILocked });
            if (isUILocked) {
                console.log("Private Back button ignored: UI locked");
                return;
            }
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            if (guessInput && !gameOver && !isProcessingGuess && isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        privateBackBtn.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Next game button (end screen)
    if (nextGameBtnEnd) {
        const handler = debounce(async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next Game button (end) triggered", { isUILocked, isLoadingGame });
            if (isUILocked || isLoadingGame) {
                console.log("Next Game button ignored: UI locked or game loading");
                return;
            }
            isUILocked = true;
            const gameNumbers = allGames.map(game => parseInt(game.gameNumber.replace("Game #", "")));
            const current = parseInt(currentGameNumber.replace("Game #", ""));
            const nextGameNumber = gameNumbers.filter(n => n > current).sort((a, b) => a - b)[0];
            if (nextGameNumber) {
                console.log(`Loading next game: Game #${nextGameNumber}`);
                await loadGame(`Game #${nextGameNumber}`);
            } else {
                console.log("No next game available, showing game select screen");
                showGameSelectScreen();
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        nextGameBtnEnd.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Form error OK button
    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form Error OK button clicked");
            formErrorDialog.style.display = "none";
            if (formContent.style.display === "flex") {
                activeInput = document.getElementById("game-name-input");
                if (activeInput && isMobile) setTimeout(() => activeInput.focus(), 0);
            } else if (guessInput && !gameOver && !isProcessingGuess && isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        });
    }

    // Handle guess
    async function handleGuess(guess) {
    console.log("Handling guess:", guess, { isProcessingGuess, gameOver });
    if (isProcessingGuess || gameOver) {
        console.log("Guess ignored: processing another guess or game over");
        return;
    }
    isProcessingGuess = true;
    guessBtn.disabled = true;
    guessInput.disabled = true;

    guess = guess.trim().toUpperCase();
    guesses.push(guess);
    guessCount++;
    guessesLink.textContent = `Guesses: ${guessCount}/5`;

    if (guess === secretWord.toUpperCase()) {
        console.log("Correct guess!");
        gameScreen.classList.add("game-ended");
        guessInputContainer.style.background = "#FFB300";
        await saveGameResult(
            currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple",
            currentGameNumber.includes("- Private") ? currentGameId : currentGameNumber.replace("Game #", ""),
            secretWord,
            `Success: ${guessCount} guess${guessCount === 1 ? "" : "es"}`
        );
        endGame(true);
    } else {
        console.log("Incorrect guess");
        guessInputContainer.classList.add("wrong-guess");
        // Wait for animation to complete
        await new Promise(resolve => {
            animationTimeout = setTimeout(() => {
                guessInputContainer.classList.remove("wrong-guess");
                guessInputContainer.style.background = "transparent";
                animationTimeout = null;
                resolve();
            }, 350);
        });

        if (guessCount >= 5) {
            console.log("Max guesses reached");
            await saveGameResult(
                currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple",
                currentGameNumber.includes("- Private") ? currentGameId : currentGameNumber.replace("Game #", ""),
                secretWord,
                "Failed"
            );
            endGame(false);
        } else {
            console.log(`Revealing hint ${hintIndex + 1}`);
            revealNextHint();
            guessInput.value = "";
            guessInput.disabled = false;
            guessBtn.disabled = false;
            isProcessingGuess = false;
            if (isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        }
    }
    isProcessingGuess = false;
}

    // Reveal next hint
    function revealNextHint() {
        if (hintIndex >= hints.length || hintIndex >= 5) {
            console.log("No more hints to reveal");
            return;
        }
        const hintElement = document.getElementById(hintRevealOrder[hintIndex]);
        if (hintElement) {
            const hintTextElement = hintElement.querySelector(".hint-text");
            if (hintTextElement) {
                hintTextElement.textContent = hints[hintIndex].toUpperCase();
                console.log(`Revealing hint ${hintIndex + 1}: ${hints[hintIndex]}`);
                hintElement.style.display = "flex";
                const { shape, color, effect } = hintStyles[hintIndex];
                hintElement.className = `hint ${shape} ${color} reveal-${effect}`;
                hintIndex++;
            } else {
                console.error(`hint-text not found for hint ${hintIndex + 1}`);
            }
        } else {
            console.error(`Hint element not found for hint ${hintIndex + 1}`);
        }
    }

    // End game
    function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp, guessCount });
        gameOver = true;
        gameScreen.classList.add("game-ended");
        guessInput.disabled = true;
        guessBtn.disabled = true;
        guessInputContainer.style.background = "#FFB300";

        // Display remaining hints
        while (hintIndex < hints.length && hintIndex < 5) {
            revealNextHint();
        }

        // Show game over screen
        const gameOverScreen = document.getElementById("game-over");
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");
        if (gameOverScreen && shareText && gameNumberDisplay) {
            resetScreenDisplays(gameOverScreen);
            let resultText = gaveUp ? `I gave up on ${currentGameNumber}!` : 
                            won ? `I guessed the secret word in ${currentGameNumber} in <span class="guess-count">${guessCount}</span> guess${guessCount === 1 ? "" : "es"}!` :
                                  `I couldn't guess the secret word in ${currentGameNumber}!`;
            shareText.innerHTML = resultText;
            gameNumberDisplay.textContent = `The secret word was: ${secretWord.toUpperCase()}`;
            setupShareButtons(won, gaveUp);
        } else {
            console.error("Game over elements not found");
        }

        // Trigger pineapple rain if won
        if (won) {
            triggerPineappleRain();
        }
    }

    // Setup share buttons
    function setupShareButtons(won, gaveUp) {
        const shareText = document.getElementById("share-text").textContent.replace(/<[^>]+>/g, "");
        const gameNumberDisplay = document.getElementById("game-number-display").textContent;
        const shareMessage = `${shareText}\n${gameNumberDisplay}\nPlay at https://wordy.bigbraingames.net`;

        const shareLinks = {
            whatsapp: document.getElementById("share-whatsapp"),
            telegram: document.getElementById("share-telegram"),
            twitter: document.getElementById("share-twitter"),
            instagram: document.getElementById("share-instagram")
        };

        if (shareLinks.whatsapp) {
            shareLinks.whatsapp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        }
        if (shareLinks.telegram) {
            shareLinks.telegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://wordy.bigbraingames.net")}&text=${encodeURIComponent(shareMessage)}`;
        }
        if (shareLinks.twitter) {
            shareLinks.twitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
        }
        if (shareLinks.instagram) {
            shareLinks.instagram.href = "#"; // Instagram sharing requires clipboard or native app
            shareLinks.instagram.addEventListener("click", (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(shareMessage).then(() => {
                    alert("Result copied to clipboard! Paste it in Instagram to share.");
                });
            });
        }
    }

    // Trigger pineapple rain
    function triggerPineappleRain() {
        console.log("Triggering pineapple rain");
        const rainContainer = document.createElement("div");
        rainContainer.className = "pineapple-rain";
        document.body.appendChild(rainContainer);

        const numPineapples = isMobile ? 20 : 40;
        for (let i = 0; i < numPineapples; i++) {
            const pineapple = document.createElement("div");
            pineapple.className = "pineapple-piece";
            pineapple.textContent = "🍍";
            pineapple.style.left = `${Math.random() * 100}vw`;
            pineapple.style.animationDuration = `${Math.random() * 2 + 2}s`;
            pineapple.style.animationDelay = `${Math.random() * 1}s`;
            pineapple.style.setProperty("--rotation", `${Math.random() * 360}deg`);
            pineapple.style.setProperty("--drift", `${Math.random() * 2 - 1}`);
            rainContainer.appendChild(pineapple);
        }

        setTimeout(() => {
            rainContainer.remove();
            console.log("Pineapple rain removed");
        }, 5000);
    }

    // Fetch official games
    async function fetchOfficialGames() {
        console.log("Fetching official games from:", officialUrl);
        try {
            const response = await fetch(officialUrl);
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    allGames = result.data.map(row => ({
                        gameNumber: `Game #${row["Game Number"]}`,
                        secretWord: row["Secret Word"]?.trim().toUpperCase() || "",
                        hints: [
                            row["Hint 1"]?.trim().toUpperCase() || "",
                            row["Hint 2"]?.trim().toUpperCase() || "",
                            row["Hint 3"]?.trim().toUpperCase() || "",
                            row["Hint 4"]?.trim().toUpperCase() || "",
                            row["Hint 5"]?.trim().toUpperCase() || ""
                        ].filter(hint => hint),
                        background: row["Background"]?.trim() || defaultBackground
                    }));
                    console.log("Official games fetched:", allGames.length);
                    displayGameList();
                },
                error: (error) => {
                    console.error("Error parsing official games CSV:", error);
                }
            });
        } catch (error) {
            console.error("Error fetching official games:", error);
        }
    }

    // Fetch private games
    async function fetchPrivateGames() {
        console.log("Fetching private games from:", privateUrl);
        try {
            const response = await fetch(privateUrl);
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    privateGames = result.data.map(row => ({
                        gameNumber: `${row["Game Name"]} - Private`,
                        gameId: row["Game ID"]?.trim() || "",
                        secretWord: row["Secret Word"]?.trim().toUpperCase() || "",
                        hints: [
                            row["Hint 1"]?.trim().toUpperCase() || "",
                            row["Hint 2"]?.trim().toUpperCase() || "",
                            row["Hint 3"]?.trim().toUpperCase() || "",
                            row["Hint 4"]?.trim().toUpperCase() || "",
                            row["Hint 5"]?.trim().toUpperCase() || ""
                        ].filter(hint => hint),
                        background: row["Background"]?.trim() || defaultBackground
                    }));
                    console.log("Private games fetched:", privateGames.length);
                    displayGameList();
                },
                error: (error) => {
                    console.error("Error parsing private games CSV:", error);
                }
            });
        } catch (error) {
            console.error("Error fetching private games:", error);
        }
    }

    // Display game list
    function displayGameList() {
        console.log("Displaying game list", { officialTab: officialTab.classList.contains("active"), privateGames, allGames });
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");

        if (officialTab.classList.contains("active")) {
            if (officialList) {
                officialList.innerHTML = "";
                allGames.forEach(game => {
                    const row = document.createElement("div");
                    row.className = "game-list-row";
                    row.innerHTML = `
                        <span>${game.gameNumber}</span>
                        <span class="play-now">Play Now</span>
                    `;
                    const playNow = row.querySelector(".play-now");
                    playNow.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isUILocked || isLoadingGame) {
                            console.log("Play Now ignored: UI locked or game loading");
                            return;
                        }
                        console.log(`Loading game: ${game.gameNumber}`);
                        isUILocked = true;
                        await loadGame(game.gameNumber);
                        setTimeout(() => { isUILocked = false; }, 500);
                    });
                    officialList.appendChild(row);
                });
            }
        } else {
            if (privateList) {
                privateList.innerHTML = privateGames.length > 0 ? "" : "<span>No private games available</span>";
                privateGames.forEach(game => {
                    const row = document.createElement("div");
                    row.className = "game-list-row";
                    row.innerHTML = `
                        <span>${game.gameNumber}</span>
                        <span class="play-now">Play Now</span>
                    `;
                    const playNow = row.querySelector(".play-now");
                    playNow.addEventListener(isMobile ? "touchstart" : "click", async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isUILocked || isLoadingGame) {
                            console.log("Play Now ignored: UI locked or game loading");
                            return;
                        }
                        console.log(`Loading private game: ${game.gameNumber}`);
                        isUILocked = true;
                        await loadGame(game.gameNumber, game.gameId);
                        setTimeout(() => { isUILocked = false; }, 500);
                    });
                    privateList.appendChild(row);
                });
            }
        }
    }

    // Show game select screen
    async function showGameSelectScreen() {
        console.log("Showing game select screen");
        await fetchOfficialGames();
        resetScreenDisplays(gameSelectContent);
        officialTab.classList.add("active");
        privateTab.classList.remove("active");
        officialContent.classList.add("active");
        officialContent.style.display = "flex";
        privateContent.classList.remove("active");
        privateContent.style.display = "none";
        displayGameList();
    }

    // Load game
    async function loadGame(gameNumber, gameId = null) {
        console.log("Loading game:", gameNumber, { gameId, isLoadingGame });
        if (isLoadingGame) {
            console.log("Game load ignored: already loading a game");
            return;
        }
        isLoadingGame = true;

        // Reset game state
        gameOver = false;
        secretWord = "";
        hints = [];
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        gaveUp = false;
        guesses = [];
        currentGameNumber = gameNumber;
        currentGameId = gameId;
        gameScreen.classList.remove("game-ended");
        guessInputContainer.style.background = "transparent";
        guessInput.value = "";
        guessInput.disabled = false;
        guessBtn.disabled = false;
        guessesLink.textContent = "Guesses: 0/5";

        // Clear existing hints
        hintRevealOrder.forEach(id => {
            const hintElement = document.getElementById(id);
            if (hintElement) {
                const hintTextElement = hintElement.querySelector(".hint-text");
                if (hintTextElement) {
                    hintTextElement.textContent = "";
                }
                hintElement.style.display = "none";
                hintElement.className = "hint";
            }
        });

        // Find game data
        let gameData;
        if (gameId) {
            await fetchPrivateGames();
            gameData = privateGames.find(game => game.gameId === gameId && game.gameNumber === gameNumber);
        } else {
            gameData = allGames.find(game => game.gameNumber === gameNumber);
        }

        if (gameData) {
            secretWord = gameData.secretWord.toUpperCase();
            hints = gameData.hints.map(hint => hint.toUpperCase());
            currentBackground = await preloadBackground(gameData.background || defaultBackground);
            console.log("Game loaded:", { secretWord, hints, background: currentBackground });
        } else {
            console.error("Game not found:", gameNumber);
            isLoadingGame = false;
            return;
        }

        // Update UI
        resetScreenDisplays(gameScreen);
        gameNumberText.textContent = gameNumber;
        randomizeHintStyles();

        // Update navigation arrows
        const gameNumbers = allGames.map(game => parseInt(game.gameNumber.replace("Game #", "")));
        const current = parseInt(gameNumber.replace("Game #", ""));
        prevGameArrow.classList.toggle("disabled", !gameNumbers.some(n => n < current));
        nextGameArrow.classList.toggle("disabled", !gameNumbers.some(n => n > current));

        // Reveal first hint if available
        if (hints.length > 0) {
            revealNextHint();
        }

        adjustBackground();
        isLoadingGame = false;
        if (isMobile) {
            guessInput.focus();
            activeInput = guessInput;
            console.log("Focused guess-input on game load for mobile");
        }
    }

    // Save game result
    async function saveGameResult(gameType, gameNumber, secretWord, result) {
        console.log("Saving game result:", { gameType, gameNumber, secretWord, result });
        try {
            const response = await fetch(webAppUrl, {
                method: "POST",
                body: JSON.stringify({
                    gameType,
                    gameNumber,
                    secretWord,
                    result,
                    guesses
                }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await response.json();
            console.log("Game result saved:", data);
        } catch (error) {
            console.error("Error saving game result:", error);
        }
    }

    // Submit new game
    if (confirmBtn) {
        confirmBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Confirm button clicked");
            if (isUILocked) {
                console.log("Confirm button ignored: UI locked");
                return;
            }
            isUILocked = true;

            const gameName = formInputs[0].value.trim().toUpperCase();
            const newSecretWord = formInputs[1].value.trim().toUpperCase();
            const newHints = formInputs.slice(2).map(input => input.value.trim().toUpperCase()).filter(hint => hint);

            if (!gameName || !newSecretWord || newHints.length < 3) {
                console.log("Form validation failed", { gameName, newSecretWord, hintsCount: newHints.length });
                formErrorMessage.textContent = "Please provide a game name, secret word, and at least 3 hints.";
                formErrorDialog.style.display = "flex";
                isUILocked = false;
                return;
            }

            try {
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    body: JSON.stringify({
                        gameType: "privatePineapple",
                        gameName,
                        secretWord: newSecretWord,
                        hints: newHints,
                        background: defaultBackground
                    }),
                    headers: { "Content-Type": "application/json" }
                });
                const data = await response.json();
                console.log("New game created:", data);
                await fetchPrivateGames();
                showGameSelectScreen();
                privateTab.click();
            } catch (error) {
                console.error("Error creating game:", error);
                formErrorMessage.textContent = "Error creating game. Please try again.";
                formErrorDialog.style.display = "flex";
            }
            isUILocked = false;
        });
    }

    // Handle touch events for game list
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchMoved = false;
        console.log("Touch start recorded", { touchStartX, touchStartY });
    }

    function handleTouchMove(e) {
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = Math.abs(touchX - touchStartX);
        const deltaY = Math.abs(touchY - touchStartY);
        if (deltaX > touchThreshold || deltaY > touchThreshold) {
            touchMoved = true;
            console.log("Touch moved beyond threshold", { deltaX, deltaY });
        }
    }

    function handleTouchEnd(e, callback) {
        if (!touchMoved) {
            console.log("Touch end without significant movement, executing callback");
            callback(e);
        } else {
            console.log("Touch end ignored due to movement");
        }
    }

    // Attach touch event listeners to game lists
    const gameLists = [document.getElementById("official-list"), document.getElementById("private-list")];
    gameLists.forEach(list => {
        if (list) {
            list.addEventListener("touchstart", handleTouchStart);
            list.addEventListener("touchmove", handleTouchMove);
            list.addEventListener("touchend", (e) => {
                const target = e.target.closest(".play-now");
                if (target) {
                    handleTouchEnd(e, () => target.click());
                }
            });
        }
    });

    // Initialize game
    console.log("Initializing game");
    await fetchOfficialGames();
    const latestGame = allGames.sort((a, b) => 
        parseInt(b.gameNumber.replace("Game #", "")) - parseInt(a.gameNumber.replace("Game #", ""))
    )[0];
    if (latestGame) {
        console.log("Loading latest game:", latestGame.gameNumber);
        await loadGame(latestGame.gameNumber);
    } else {
        console.log("No games available, showing game select screen");
        showGameSelectScreen();
    }
});
    