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
    const shareSection = document.getElementById("share-section");
    const gameNameElement = document.getElementById("game-name");
    const gameOverScreen = document.getElementById("game-over");

    // URLs
    const officialUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiz6IVPR4cZB9JlbNPC1Km5Jls5wsW3i-G9WYLppmnfPDz2kxb0I-g1BY50wFzuJ0aYgYdyub6VpCd/pub?output=csv";
    const privateUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIMKVHVz5EaVdJ5YfZJwLW72R9aI1Si9p-LX7kc__5-iAMaXz2itGmffgHu0b05_IRvFFAadH64Z-M/pub?output=csv";
    const webAppUrl = "https://script.google.com/macros/s/AKfycbyFVSK9mHruHEaX_ImhUobprQczd3JOQWQ9QzK9qwN0kgaAtOLZ_wk2u8HkGifd8oS15w/exec";
    const defaultBackground = "newbackground.png";

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Touch handling
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    const touchThreshold = 10;

    // Hint shapes, colors, and effects
    const hintShapes = ['cloud', 'sun', 'aviator', 'diamond', 'fluffy-cloud'];
    const hintColors = [
        'color-1', // rgb(255, 105, 180)
        'color-2', // rgb(255, 215, 0)
        'color-3', // rgb(50, 205, 50)
        'color-4', // rgb(135, 206, 235)
        'color-5', // rgb(255, 165, 0)
        'color-6', // rgb(138, 43, 226)
        'color-7', // rgb(255, 69, 0)
        'color-8', // rgb(139, 0, 0)
        'color-9', // rgb(0, 191, 255)
        'color-10' // rgb(255, 20, 147)
    ];
    const hintRevealEffects = ['pop', 'stretch', 'zoom', 'bounce', 'spin', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'splash'];
    const hintRevealOrder = ['hint-1', 'hint-2', 'hint-3', 'hint-4', 'hint-5'];

    // Utilities
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

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

    function adjustBackground() {
        console.log("Adjusting background to:", currentBackground);
        const backgroundContainer = document.getElementById("background-container");
        if (backgroundContainer) {
            backgroundContainer.style.background = `url('${currentBackground}') no-repeat center center`;
            backgroundContainer.style.backgroundSize = "cover";
        }
        document.body.style.background = "#FFFFFF";
    }

    window.addEventListener("resize", adjustBackground);

    // Game name handler
    if (gameNameElement) {
        const handler = debounce((e) => {
            e.preventDefault();
            console.log("Game name clicked");
            if (isUILocked || isLoadingGame) return;
            isUILocked = true;
            resetScreenDisplays(gameScreen);
            showKeyboard();
            if (guessInput && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
            setTimeout(() => { isUILocked = false; }, 500);
        }, 100);
        gameNameElement.addEventListener(isMobile ? "touchstart" : "click", handler);
    }

    // Guess input setup
    if (guessInput) {
        guessInput.disabled = false;
        guessInput.addEventListener("input", () => {
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
                if (guess) handleGuess(guess);
            }
        });
        if (isMobile) {
            guessInput.setAttribute("readonly", "readonly");
            guessInput.addEventListener("focus", (e) => e.preventDefault());
        } else {
            guessInput.focus();
        }
        activeInput = guessInput;
    }

    // Guess input container
    if (guessInputContainer) {
        const handler = (e) => {
            e.preventDefault();
            if (isMobile && keyboardContainer?.classList.contains("show-alternate")) showKeyboard();
            if (!gameOver && !guessInput.disabled && !isProcessingGuess && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        };
        guessInputContainer.addEventListener("click", handler);
        guessInputContainer.addEventListener("touchstart", handler);
    }

    // Guess area
    if (guessArea) {
        const handler = (e) => {
            e.preventDefault();
            if (!gameOver && !guessInput.disabled && !isProcessingGuess && !isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        };
        guessArea.addEventListener("click", handler);
        guessArea.addEventListener("touchstart", handler);
    }

    // Guess button
    if (guessBtn) {
        guessBtn.disabled = false;
        const handler = debounce((e) => {
            e.preventDefault();
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) handleGuess(guess);
            }
        }, 100);
        guessBtn.addEventListener("click", handler);
        guessBtn.addEventListener("touchstart", handler);
    }

    // Form inputs
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
            input.addEventListener("focus", (e) => e.preventDefault());
        } else {
            input.readOnly = false;
        }
        input.disabled = false;
        input.addEventListener("click", () => {
            activeInput = input;
            input.focus();
        });
        input.addEventListener("touchstart", (e) => {
            e.preventDefault();
            activeInput = input;
            input.focus();
        });
        input.addEventListener("input", () => {
            input.value = input.value.toUpperCase();
        });
    });

    // Show keyboard
    function showKeyboard() {
        if (!isMobile || !keyboardContainer || !keyboardContent || !keyboardGuessesContent || !keyboardGiveUpContent || !keyboardBackBtn) {
            return;
        }
        console.log("Showing keyboard");
        keyboardContainer.classList.remove("show-alternate", "show-guesses", "show-give-up");
        keyboardContainer.style.display = "flex";
        keyboardContent.style.display = "flex";
        keyboardGuessesContent.style.display = "none";
        keyboardGiveUpContent.style.display = "none";
        keyboardBackBtn.style.display = "none";
        if (guessInput && !gameOver && !isProcessingGuess) {
            activeInput = guessInput;
        }
        setupKeyboardListeners();
    }

    // Reset screen displays
    function resetScreenDisplays(activeScreen) {
        console.log("Resetting screens for:", activeScreen?.id);
        const screens = [formErrorDialog, guessesScreen, giveUpDialog, gameSelectContent, formContent, gameOverScreen];
        screens.forEach(screen => {
            if (screen && screen !== activeScreen) {
                screen.style.display = "none";
                screen.classList.remove("active");
            }
        });

        gameScreen.style.display = "none";
        guessArea.style.display = "none";
        gameControlsContainer.style.display = "none";
        keyboardContainer.style.display = "none";

        if (activeScreen === gameScreen) {
            gameScreen.style.display = "grid";
            guessArea.style.display = "flex";
            gameControlsContainer.style.display = "flex";
            if (isMobile && !gameOver) {
                keyboardContainer.style.display = "flex";
                showKeyboard();
            }
        } else if (activeScreen) {
            activeScreen.style.display = "flex";
            activeScreen.classList.add("active");
            if (activeScreen === formContent && isMobile) {
                keyboardContainer.style.display = "flex";
                showKeyboard();
            }
        }
        adjustBackground();
    }

    // Keyboard listeners
    function setupKeyboardListeners() {
        if (!isMobile) return;
        const keys = document.querySelectorAll("#keyboard-content .key");
        keys.forEach(key => {
            if (key._clickHandler) {
                key.removeEventListener("click", key._clickHandler);
                key.removeEventListener("touchstart", key._touchHandler);
            }
            const clickHandler = debounce(() => {
                if (gameOver || isProcessingGuess || !activeInput || activeInput.disabled) return;
                const keyValue = key.textContent;
                if (key.id === "key-enter") {
                    if (activeInput === guessInput) {
                        const guess = guessInput.value.trim().toUpperCase();
                        if (guess) handleGuess(guess);
                    }
                } else if (key.id === "key-backspace") {
                    activeInput.value = activeInput.value.slice(0, -1);
                } else {
                    activeInput.value += keyValue;
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
            showKeyboard();
        };
        keyboardBackBtn.addEventListener("click", handler);
        keyboardBackBtn.addEventListener("touchstart", handler);
    }

    // Keyboard guesses content
    if (keyboardGuessesContent) {
        const handler = (e) => {
            e.preventDefault();
            if (e.target === keyboardGuessesContent || e.target === document.getElementById("guesses-list")) {
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
            if (e.target === keyboardGiveUpContent || e.target === document.getElementById("give-up-buttons")) {
                showKeyboard();
            }
        };
        keyboardGiveUpContent.addEventListener("click", handler);
        keyboardGiveUpContent.addEventListener("touchstart", handler);
    }

    // Randomize hint styles
    function randomizeHintStyles() {
        hintStyles = [];
        const availableColors = shuffleArray([...hintColors]);
        const shuffledEffects = shuffleArray([...hintRevealEffects]);
        for (let i = 0; i < 5; i++) {
            const color = availableColors[i % availableColors.length] || hintColors[i % hintColors.length];
            const effect = shuffledEffects[i % shuffledEffects.length];
            hintStyles.push({ shape: `hint-shape-${hintShapes[i]}`, color: `hint-color-${color}`, effect });
        }
        console.log("Randomized hint styles:", hintStyles);
    }

    // Setup hints
    function setupHints() {
        console.log("Setting up hints:", { hints, hintIndex, hintStyles });
        try {
            for (let i = 1; i <= 5; i++) {
                const hintElement = document.getElementById(`hint-${i}`);
                if (hintElement) {
                    hintElement.style.display = "none";
                    hintElement.innerHTML = "";
                    hintElement.className = "hint";
                    hintElement.style.background = "";
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
                    hintElement.style.background = "";
                    const effect = hintStyles[index].effect;
                    hintElement.classList.add(`reveal-${effect}`);
                    setTimeout(() => hintElement.classList.remove(`reveal-${effect}`), 1000);
                }
            });
        } catch (error) {
            console.error("Error setting up hints:", error);
            showErrorDialog("Failed to display hints.");
        }
    }

    // Setup info containers
    function setupInfoContainers() {
        try {
            const scoreContainer = document.getElementById("score-container");
            const streakContainer = document.getElementById("streak-container");
            const bankContainer = document.getElementById("bank-container");

            if (scoreContainer) {
                scoreContainer.innerHTML = `<span class="info-text">Score:<br>${500 - guessCount * 100}</span>`;
            }
            if (streakContainer) {
                const streakMultiple = guessCount === 0 ? 5 : Math.max(1, 5 - guessCount);
                streakContainer.innerHTML = `<span class="info-text">Streak multiple:<br>${streakMultiple}</span>`;
            }
            if (bankContainer) {
                const bankValue = (500 - guessCount * 100) * (guessCount === 0 ? 5 : Math.max(1, 5 - guessCount));
                bankContainer.innerHTML = `<span class="info-text">Bank:<br>${bankValue}</span>`;
            }
        } catch (error) {
            console.error("Error setting up info containers:", error);
            showErrorDialog("Failed to update game info.");
        }
    }

    // Fetch and parse CSV
    async function fetchAndParseCSV(url) {
        console.log("Fetching CSV from:", url);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const csvText = await response.text();
            return new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => resolve(results.data),
                    error: (error) => reject(error)
                });
            });
        } catch (error) {
            console.error("Error fetching CSV:", error);
            throw error;
        }
    }

    // Load game selection
    async function loadGameSelection() {
        console.log("Loading game selection");
        isUILocked = true;
        isLoadingGame = true;
        resetScreenDisplays(gameSelectContent);
        try {
            const [officialData, privateData] = await Promise.all([
                fetchAndParseCSV(officialUrl),
                fetchAndParseCSV(privateUrl)
            ]);
            allGames = officialData.map((row, index) => ({
                id: row['Game ID'] || `official-${index + 1}`,
                number: index + 1,
                name: row['Game Name'] || `Game ${index + 1}`,
                background: row['Background'] || defaultBackground,
                type: 'official'
            }));
            privateGames = privateData.map((row, index) => ({
                id: row['Game ID'] || `private-${index + 1}`,
                name: row['Game Name'] || `Private Game ${index + 1}`,
                background: row['Background'] || defaultBackground,
                type: 'private'
            }));

            const officialList = document.getElementById("official-list");
            const privateList = document.getElementById("private-list");

            if (officialList) {
                officialList.innerHTML = allGames.map(game => `
                    <div class="game-list-row" data-game-id="${game.id}" data-game-number="${game.number}">
                        <span>${game.number}</span>
                        <span>${game.name}</span>
                        <span class="play-now">Play Now!</span>
                    </div>
                `).join("");
                officialList.querySelectorAll(".game-list-row").forEach(row => {
                    const handler = (e) => {
                        e.preventDefault();
                        if (touchMoved) return;
                        const gameId = row.getAttribute("data-game-id");
                        const gameNumber = parseInt(row.getAttribute("data-game-number"), 10);
                        loadGame(gameId, gameNumber);
                    };
                    row.addEventListener("click", handler);
                    row.addEventListener("touchstart", (e) => {
                        touchStartX = e.touches[0].clientX;
                        touchStartY = e.touches[0].clientY;
                        touchMoved = false;
                    });
                    row.addEventListener("touchmove", (e) => {
                        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                        if (deltaX > touchThreshold || deltaY > touchThreshold) touchMoved = true;
                    });
                    row.addEventListener("touchend", (e) => {
                        if (!touchMoved) handler(e);
                    });
                });
            }

            if (privateList) {
                privateList.innerHTML = privateGames.length > 0 ? privateGames.map(game => `
                    <div class="game-list-row" data-game-id="${game.id}">
                        <span></span>
                        <span>${game.name}</span>
                        <span class="play-now">Play Now!</span>
                    </div>
                `).join("") : "<div class='game-list-row'><span>No private games available</span></div>";
                privateList.querySelectorAll(".game-list-row[data-game-id]").forEach(row => {
                    const handler = (e) => {
                        e.preventDefault();
                        if (touchMoved) return;
                        const gameId = row.getAttribute("data-game-id");
                        loadGame(gameId);
                    };
                    row.addEventListener("click", handler);
                    row.addEventListener("touchstart", (e) => {
                        touchStartX = e.touches[0].clientX;
                        touchStartY = e.touches[0].clientY;
                        touchMoved = false;
                    });
                    row.addEventListener("touchmove", (e) => {
                        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                        if (deltaX > touchThreshold || deltaY > touchThreshold) touchMoved = true;
                    });
                    row.addEventListener("touchend", (e) => {
                        if (!touchMoved) handler(e);
                    });
                });
            }
        } catch (error) {
            console.error("Error loading game selection:", error);
            showErrorDialog("Failed to load games.");
        } finally {
            isUILocked = false;
            isLoadingGame = false;
        }
    }

    // Load game
    async function loadGame(gameId, gameNumber = null) {
        if (isUILocked || isLoadingGame) return;
        isUILocked = true;
        isLoadingGame = true;
        try {
            const isOfficial = gameId.startsWith("official") || allGames.some(game => game.id === gameId);
            const dataSource = isOfficial ? allGames : privateGames;
            const game = dataSource.find(g => g.id === gameId);

            if (!game) {
                showErrorDialog("Game not found.");
                return;
            }

            const backgroundUrl = game.background || defaultBackground;
            const csvUrl = isOfficial ? officialUrl : privateUrl;
            const data = await fetchAndParseCSV(csvUrl);
            const gameData = data.find(row => (row['Game ID'] || `official-${game.number}`) === gameId);

            if (!gameData) {
                showErrorDialog("Game data not found.");
                return;
            }

            secretWord = gameData['Secret Word']?.trim().toUpperCase() || "";
            hints = [
                gameData['hint1']?.trim().toUpperCase() || '',
                gameData['hint2']?.trim().toUpperCase() || '',
                gameData['hint3']?.trim().toUpperCase() || '',
                gameData['hint4']?.trim().toUpperCase() || '',
                gameData['hint5']?.trim().toUpperCase() || ''
            ].filter(hint => hint !== '');
            currentGameId = gameId;
            currentGameNumber = gameNumber || null;
            currentBackground = await preloadBackground(backgroundUrl);

            resetGame();
            resetScreenDisplays(gameScreen);
            setupHints();
            setupInfoContainers();
            if (guessInput) {
                guessInput.value = "";
                if (!isMobile) guessInput.focus();
                activeInput = guessInput;
            }
            updateGameNumber();
            setupNavigation();
            adjustBackground();
            showKeyboard();
        } catch (error) {
            console.error("Error loading game:", error);
            showErrorDialog("Failed to load game.");
        } finally {
            isUILocked = false;
            isLoadingGame = false;
        }
    }

    // Reset game
    function resetGame() {
        gameOver = false;
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        gaveUp = false;
        isProcessingGuess = false;
        guesses = [];
        if (guessInput) {
            guessInput.disabled = false;
            guessInput.value = "";
        }
        if (guessBtn) guessBtn.disabled = false;
        if (gameScreen.classList.contains("game-ended")) {
            gameScreen.classList.remove("game-ended");
        }
        randomizeHintStyles();
        setupHints();
        setupInfoContainers();
        updateGuessesLink();
    }

    // Show hint
    function showHint() {
        if (hintIndex < hints.length) {
            hintIndex++;
            setupHints();
        }
    }

    // Handle guess
    async function handleGuess(guess) {
        if (gameOver || guessCount >= 5 || isProcessingGuess) return;
        isProcessingGuess = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;
        isUILocked = true;

        guess = guess.trim().toUpperCase();
        guesses.push(guess);
        guessCount++;
        firstGuessMade = true;

        updateGuessesLink();
        if (guess) guessInput.value = guess;

        if (guess === secretWord) {
            await endGame(true);
            isProcessingGuess = false;
            isUILocked = false;
            return;
        } else {
            guessInputContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(async () => {
                guessInputContainer.classList.remove("wrong-guess");
                animationTimeout = null;
                guessInput.value = "";
                if (!isMobile) guessInput.focus();
                showHint();
                setupInfoContainers();
                if (guessCount >= 5) {
                    await endGame(false);
                } else {
                    isProcessingGuess = false;
                    isUILocked = false;
                    guessInput.disabled = false;
                    guessBtn.disabled = false;
                }
            }, 250);
        }
    }

    // End game
    async function endGame(won) {
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;
        isUILocked = true;

        resetScreenDisplays(gameOverScreen);
        gameOverScreen.style.display = "flex";
        gameScreen.style.display = "none";

        try {
            const shareText = document.getElementById("share-text");
            const gameNumberDisplay = document.getElementById("game-number-display");
            let score = 500 - guessCount * 100;
            let streakMultiple = guessCount === 0 ? 5 : Math.max(1, 5 - guessCount);
            let bankValue = score * streakMultiple;

            let message = won ? `I solved WORDY #${currentGameNumber || currentGameId} with ${guessCount} ${guessCount === 1 ? "guess" : "guesses"}!` :
                gaveUp ? `I gave up on WORDY #${currentGameNumber || currentGameId}.` :
                `I failed to solve WORDY #${currentGameNumber || currentGameId} after ${guessCount} guesses.`;
            message += ` Score: ${score} | Bank: ${bankValue}`;

            if (shareText) {
                shareText.innerHTML = message.replace(/(\d+)/g, '<span class="guess-score">$1</span>');
            }
            if (gameNumberDisplay) {
                gameNumberDisplay.textContent = `Game #${currentGameNumber || currentGameId}`;
            }

            const shareMessage = encodeURIComponent(`${message}\nPlay now: https://wordy.game/${currentGameId}`);
            const shareUrls = {
                whatsapp: `https://api.whatsapp.com/send?text=${shareMessage}`,
                telegram: `https://t.me/share/url?url=https://wordy.game/${currentGameId}&text=${shareMessage}`,
                twitter: `https://twitter.com/intent/tweet?text=${shareMessage}`,
                instagram: `https://www.instagram.com/?url=https://wordy.game/${currentGameId}`
            };

            for (const [platform, url] of Object.entries(shareUrls)) {
                const button = document.getElementById(`share-${platform}`);
                if (button) {
                    button.href = url;
                    button.addEventListener("click", (e) => {
                        e.preventDefault();
                        window.open(url, "_blank");
                    });
                }
            }

            if (won) triggerPineappleRain();
        } catch (error) {
            console.error("Error in endGame:", error);
            showErrorDialog("Failed to display game over screen.");
        } finally {
            isUILocked = false;
        }
    }

    // Pineapple rain
    function triggerPineappleRain() {
        const container = document.createElement("div");
        container.className = "pineapple-rain";
        document.body.appendChild(container);

        for (let i = 0; i < 20; i++) {
            const piece = document.createElement("span");
            piece.className = "pineapple-piece";
            piece.textContent = "🍍";
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.animationDuration = `${Math.random() * 2 + 2}s`;
            piece.style.setProperty('--offset-x', Math.random() * 200 - 100);
            piece.style.setProperty('--rotation', Math.random() * 720 - 360 + 'deg');
            container.appendChild(piece);
        }

        setTimeout(() => container.remove(), 2500);
    }

    // Error dialog
    function showErrorDialog(message) {
        if (formErrorDialog && formErrorMessage) {
            formErrorMessage.textContent = message;
            resetScreenDisplays(formErrorDialog);
            formErrorDialog.style.display = "flex";
            if (formErrorOkBtn) {
                const handler = (e) => {
                    e.preventDefault();
                    resetScreenDisplays(gameScreen);
                    formErrorDialog.removeEventListener("click", handler);
                    formErrorDialog.removeEventListener("touchend", handler);
                };
                formErrorDialog.addEventListener("click", handler);
                formErrorDialog.addEventListener("touchend", handler);
                formErrorOkBtn.focus();
            }
        }
    }

    // Update game number
    function updateGameNumber() {
        if (gameNumberText) {
            gameNumberText.textContent = currentGameNumber ? `#${currentGameNumber}` : currentGameId || "";
        }
        if (prevGameArrow && nextGameArrow) {
            prevGameArrow.disabled = !currentGameNumber || currentGameNumber <= 1;
            nextGameArrow.disabled = !currentGameNumber || currentGameNumber >= allGames.length;
            prevGameArrow.classList.toggle("disabled", !currentGameNumber || currentGameNumber <= 1);
            nextGameArrow.classList.toggle("disabled", !currentGameNumber || currentGameNumber >= allGames.length);
        }
    }

    // Update guesses link
    function updateGuessesLink() {
        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}/5`;
        }
    }

    // Setup navigation
    function setupNavigation() {
        if (prevGameArrow) {
            const handler = debounce((e) => {
                e.preventDefault();
                if (currentGameNumber && currentGameNumber > 1) {
                    loadGame(`official-${currentGameNumber - 1}`, currentGameNumber - 1);
                }
            }, 100);
            prevGameArrow.addEventListener("click", handler);
            prevGameArrow.addEventListener("touchstart", handler);
        }
        if (nextGameArrow) {
            const handler = debounce((e) => {
                e.preventDefault();
                if (currentGameNumber && currentGameNumber < allGames.length) {
                    loadGame(`official-${currentGameNumber + 1}`, currentGameNumber + 1);
                }
            }, 100);
            nextGameArrow.addEventListener("click", handler);
            nextGameArrow.addEventListener("touchstart", handler);
        }
        updateGameNumber();
    }

    // Create pineapple button
    if (createPineappleBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                input.value = "";
                input.disabled = false;
            });
            if (!isMobile) {
                formInputs[0].focus();
                activeInput = formInputs[0];
            }
            showKeyboard();
        }, 100);
        createPineappleBtn.addEventListener("click", handler);
        createPineappleBtn.addEventListener("touchstart", handler);
    }

    // Create pineapple end
    if (createPineappleLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            resetScreenDisplays(formContent);
            formInputs.forEach(input => {
                input.value = "";
                input.disabled = false;
            });
            if (!isMobile) {
                formInputs[0].focus();
                activeInput = formInputs[0];
            }
            showKeyboard();
        }, 100);
        createPineappleLink.addEventListener("click", handler);
        createPineappleLink.addEventListener("touchstart", handler);
    }

    // Form back button
    if (formBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            resetScreenDisplays(gameSelectContent);
            showKeyboard();
        }, 100);
        formBackBtn.addEventListener("click", handler);
        formBackBtn.addEventListener("touchstart", handler);
    }

    // Official back button
    if (officialBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            resetScreenDisplays(gameScreen);
            showKeyboard();
            if (!isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        }, 100);
        officialBackBtn.addEventListener("click", handler);
        officialBackBtn.addEventListener("touchstart", handler);
    }

    // Private back button
    if (privateBackBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            resetScreenDisplays(gameScreen);
            showKeyboard();
            if (!isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        }, 100);
        privateBackBtn.addEventListener("click", handler);
        privateBackBtn.addEventListener("touchstart", handler);
    }

    // All games link
    if (allGamesLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            loadGameSelection();
        }, 100);
        allGamesLink.addEventListener("click", handler);
        allGamesLink.addEventListener("touchstart", handler);
    }

    // Guesses link
    if (guessesLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            const guessesList = document.getElementById("guesses-list");
            if (guessesList) {
                guessesList.innerHTML = guesses.length > 0 ? guesses.map((guess, index) => `<span>${index + 1}. ${guess}</span>`).join("<br>") : "No guesses yet.";
            }
            resetScreenDisplays(guessesScreen);
        }, 100);
        guessesLink.addEventListener("click", handler);
        guessesLink.addEventListener("touchstart", handler);
    }

    // Guesses close button
    if (guessesCloseBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            resetScreenDisplays(gameScreen);
            showKeyboard();
            if (!isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        }, 100);
        guessesCloseBtn.addEventListener("click", handler);
        guessesCloseBtn.addEventListener("touchstart", handler);
    }

    // Give up link
    if (giveUpLink) {
        const handler = debounce((e) => {
            e.preventDefault();
            resetScreenDisplays(giveUpDialog);
        }, 100);
        giveUpLink.addEventListener("click", handler);
        giveUpLink.addEventListener("touchstart", handler);
    }

    // Give up yes button
    if (giveUpYesBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            gaveUp = true;
            guessCount = 5;
            endGame(false);
        }, 100);
        giveUpYesBtn.addEventListener("click", handler);
        giveUpYesBtn.addEventListener("touchstart", handler);
    }

    // Give up no button
    if (giveUpNoBtn) {
        const handler = debounce((e) => {
            e.preventDefault();
            resetScreenDisplays(gameScreen);
            showKeyboard();
            if (!isMobile) {
                guessInput.focus();
                activeInput = guessInput;
            }
        }, 100);
        giveUpNoBtn.addEventListener("click", handler);
        giveUpNoBtn.addEventListener("touchstart", handler);
    }

    // Next game button (end)
    if (nextGameBtnEnd) {
        const handler = debounce((e) => {
            e.preventDefault();
            if (currentGameNumber && currentGameNumber < allGames.length) {
                loadGame(`official-${currentGameNumber + 1}`, currentGameNumber + 1);
            } else {
                loadGameSelection();
            }
        }, 100);
        nextGameBtnEnd.addEventListener("click", handler);
        nextGameBtnEnd.addEventListener("touchstart", handler);
    }

    // Form submission
    if (confirmBtn) {
        const handler = debounce(async (e) => {
            e.preventDefault();
            const gameName = formInputs[0].value.trim().toUpperCase();
            const secretWord = formInputs[1].value.trim().toUpperCase();
            const hints = formInputs.slice(2).map(input => input.value.trim().toUpperCase()).filter(hint => hint);

            if (!gameName || !secretWord || hints.length < 5) {
                showErrorDialog("Please fill in all fields.");
                return;
            }

            isUILocked = true;
            try {
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ gameName, secretWord, hints, background: defaultBackground })
                });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                resetScreenDisplays(gameSelectContent);
                await loadGameSelection();
            } catch (error) {
                console.error("Error submitting form:", error);
                showErrorDialog("Failed to create game.");
            } finally {
                isUILocked = false;
            }
        }, 100);
        confirmBtn.addEventListener("click", handler);
        confirmBtn.addEventListener("touchstart", handler);
    }

    // Tab switching
    if (officialTab && privateTab) {
        officialTab.addEventListener("click", () => {
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            privateContent.classList.remove("active");
        });
        privateTab.addEventListener("click", () => {
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            officialContent.classList.remove("active");
        });
    }

    // Initialize
    await loadGameSelection();
    if (!isMobile && guessInput) {
        guessInput.focus();
        activeInput = guessInput;
    }
    adjustBackground();
    setupKeyboardListeners();
});