document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded");

    let gameOver = false;
    let secretWord = "";
    let hints = [];
    let hintIndex = 0;
    let firstGuessMade = false;
    let allGames = [];
    let privateGames = [];
    let currentGameNumber = null;
    let guessCount = 0;
    let gaveUp = false;
    let isProcessingGuess = false;
    let isLoadingGame = false;
    let guesses = [];
    let animationTimeout = null;
    let activeInput = null;
    let currentBackground = "newbackground.png";

    const gameScreen = document.getElementById("game-screen");
    const gameOverScreen = document.getElementById("game-over");
    const gameSelectScreen = document.getElementById("game-select-screen");
    const homeBtn = document.getElementById("home-btn");
    const createPineappleBtn = document.getElementById("create-pineapple");
    const createForm = document.getElementById("create-form");
    const confirmBtn = document.getElementById("confirm-btn");
    const formBackBtn = document.getElementById("form-back-btn");
    const createPineappleLink = document.getElementById("create-pineapple-end");
    const guessBtn = document.getElementById("guess-btn");
    const guessesScreen = document.getElementById("guesses-screen");
    const guessesCloseBtn = document.getElementById("guesses-close-btn");
    const hamburgerBtn = document.getElementById("hamburger-btn");
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
    const guessInput = document.getElementById("guess-input");
    const guessArea = document.getElementById("guess-area");

    const officialTab = document.getElementById("official-tab");
    const privateTab = document.getElementById("private-tab");
    const officialContent = document.getElementById("official-games");
    const privateContent = document.getElementById("private-games");

    const officialUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiz6IVPR4cZB9JlbNPC1Km5Jls5wsW3i-G9WYLppmnfPDz2kxb0I-g1BY50wFzuJ0aYgYdyub6VpCd/pub?output=csv";
    const privateUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIMKVHVz5EaVdJ5YfZJwLW72R9aI1Si9p-LX7kc__5-iAMaXz2itGmffgHu0b05_IRvFFAadH64Z-M/pub?output=csv";
    const webAppUrl = "https://script.google.com/macros/s/AKfycbyFVSK9mHruHEaX_ImhUobprQczd3JOQWQ9QzK9qwN0kgaAtOLZ_wk2u8HkGifd8oS15w/exec";
    const defaultBackground = "newbackground.png";

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (hamburgerBtn) {
        console.log("Hamburger button found:", hamburgerBtn);
    }

    if (guessInput) {
        guessInput.readOnly = isMobile;
        guessInput.disabled = false;
        guessInput.addEventListener("input", (e) => {
            console.log("Guess input value changed:", guessInput.value);
            if (animationTimeout) {
                clearTimeout(animationTimeout);
                animationTimeout = null;
                const guessContainer = document.getElementById("guess-input-container");
                guessContainer.classList.remove("wrong-guess");
                guessInput.style.opacity = "1";
                guessInput.style.visibility = "visible";
                guessInput.style.color = "#000000";
                guessInput.value = e.target.value.toUpperCase();
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
                }
            }
        });
        guessInput.focus();
        activeInput = guessInput;
    } else {
        console.error("guess-input not found in DOM");
    }

    if (guessArea) {
        guessArea.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
                console.log("Guess area clicked, input focused");
            }
        });
        guessArea.addEventListener("touchstart", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
                console.log("Guess area touched, input focused");
            }
        });
    }

    if (guessBtn) {
        guessBtn.disabled = false;
        guessBtn.removeEventListener("click", guessBtn._clickHandler);
        guessBtn.removeEventListener("touchstart", guessBtn._touchHandler);
        
        const clickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guess button triggered:", { gameOver, disabled: guessInput.disabled, isProcessingGuess, guess: guessInput.value });
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Submitting guess:", guess);
                    handleGuess(guess);
                    guessInput.focus();
                } else {
                    console.log("No guess entered");
                }
            } else {
                console.log("Guess button ignored due to state");
            }
        };
        
        guessBtn._clickHandler = clickHandler;
        guessBtn._touchHandler = (e) => {
            e.preventDefault();
            clickHandler(e);
        };
        
        guessBtn.addEventListener("click", clickHandler);
        guessBtn.addEventListener("touchstart", guessBtn._touchHandler);
    } else {
        console.error("guess-btn not found in DOM");
    }

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

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, 50);
        };
    }

    function setupKeyboardListeners() {
        if (!isMobile) {
            console.log("Skipping on-screen keyboard setup on desktop");
            return;
        }
        const keys = document.querySelectorAll("#keyboard-container .key");
        console.log("Setting up keyboard listeners, found keys:", keys.length);
        keys.forEach(key => {
            if (key._clickHandler) {
                key.removeEventListener("click", key._clickHandler);
                key.removeEventListener("touchstart", key._touchHandler);
            }
            const clickHandler = debounce(() => {
                console.log("Key clicked:", key.textContent, { gameOver, isProcessingGuess, activeInput: activeInput?.id });
                if (gameOver || isProcessingGuess || !activeInput || activeInput.disabled) {
                    console.log("Key click ignored due to state");
                    return;
                }
                const keyValue = key.textContent;
                if (key.id === "key-enter") {
                    if (activeInput === guessInput) {
                        const guess = guessInput.value.trim().toUpperCase();
                        if (guess) {
                            console.log("Guess submitted via on-screen Enter:", guess);
                            handleGuess(guess);
                        }
                    }
                } else if (key.id === "key-backspace") {
                    activeInput.value = activeInput.value.slice(0, -1);
                    console.log("Backspace pressed, new value:", activeInput.value);
                } else {
                    activeInput.value += keyValue;
                    console.log("Key added, new value:", activeInput.value);
                }
                activeInput.focus();
            }, 50);
            key._clickHandler = clickHandler;
            key._touchHandler = (e) => {
                e.preventDefault();
                clickHandler();
            };
            key.addEventListener("click", clickHandler);
            key.addEventListener("touchstart", key._touchHandler);
        });
    }

    if (officialTab && privateTab && officialContent && privateContent) {
        officialTab.addEventListener("click", () => {
            console.log("Official tab clicked");
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            officialContent.style.display = "flex";
            privateContent.classList.remove("active");
            privateContent.style.display = "none";
            if (createForm) createForm.style.display = "none";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = "none";
            displayGameList();
            setupKeyboardListeners();
        });

        privateTab.addEventListener("click", () => {
            console.log("Private tab clicked");
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            privateContent.style.display = "flex";
            officialContent.classList.remove("active");
            officialContent.style.display = "none";
            if (createForm) createForm.style.display = "none";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = "none";
            displayGameList();
            setupKeyboardListeners();
        });
    }

    if (allGamesLink) {
        allGamesLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("All Games link clicked");
            showGameSelectScreen();
        });
    }

    if (prevGameArrow) {
        prevGameArrow.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isLoadingGame) {
                console.log("Previous game arrow ignored: game is still loading");
                return;
            }
            console.log("Previous game arrow clicked", { currentGameNumber, allGamesLength: allGames.length, privateGamesLength: privateGames.length });
            if (!currentGameNumber) {
                console.error("No current game number set");
                return;
            }
            let currentIndex;
            let gameList;
            let isPrivate = currentGameNumber.includes("- Private");
            if (isPrivate) {
                const currentNum = parseInt(currentGameNumber.split(" - ")[0]);
                currentIndex = privateGames.findIndex(game => game["Game Number"] === String(currentNum));
                gameList = privateGames;
            } else {
                currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber.replace("Game #", ""));
                gameList = allGames;
            }
            console.log("Navigation details", { isPrivate, currentIndex, gameListLength: gameList.length });
            if (currentIndex === -1) {
                console.error("Current game not found in game list:", currentGameNumber);
                return;
            }
            if (currentIndex < gameList.length - 1) {
                isLoadingGame = true;
                prevGameArrow.style.opacity = "0.7";
                console.log("Loading previous game", { currentIndex, targetIndex: currentIndex + 1, targetGame: gameList[currentIndex + 1] });
                loadGame(gameList[currentIndex + 1]);
                resetScreenDisplays();
                gameScreen.style.display = "flex";
                adjustBackground();
                setTimeout(() => {
                    isLoadingGame = false;
                    prevGameArrow.style.opacity = "1";
                    updateArrowStates(currentIndex + 1, gameList);
                }, 500);
            } else {
                console.log("At the oldest game, cannot go to previous");
                prevGameArrow.classList.add("disabled");
            }
        });
    }

    if (nextGameArrow) {
        nextGameArrow.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isLoadingGame) {
                console.log("Next game arrow ignored: game is still loading");
                return;
            }
            console.log("Next game arrow clicked", { currentGameNumber, allGamesLength: allGames.length, privateGamesLength: privateGames.length });
            if (!currentGameNumber) {
                console.error("No current game number set");
                return;
            }
            let currentIndex;
            let gameList;
            let isPrivate = currentGameNumber.includes("- Private");
            if (isPrivate) {
                const currentNum = parseInt(currentGameNumber.split(" - ")[0]);
                currentIndex = privateGames.findIndex(game => game["Game Number"] === String(currentNum));
                gameList = privateGames;
            } else {
                currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber.replace("Game #", ""));
                gameList = allGames;
            }
            console.log("Navigation details", { isPrivate, currentIndex, gameListLength: gameList.length });
            if (currentIndex === -1) {
                console.error("Current game not found in game list:", currentGameNumber);
                return;
            }
            if (currentIndex > 0) {
                isLoadingGame = true;
                nextGameArrow.style.opacity = "0.7";
                console.log("Loading next game", { currentIndex, targetIndex: currentIndex - 1, targetGame: gameList[currentIndex - 1] });
                loadGame(gameList[currentIndex - 1]);
                resetScreenDisplays();
                gameScreen.style.display = "flex";
                adjustBackground();
                setTimeout(() => {
                    isLoadingGame = false;
                    nextGameArrow.style.opacity = "1";
                    updateArrowStates(currentIndex - 1, gameList);
                }, 500);
            } else {
                console.log("At the newest game, cannot go to next");
                nextGameArrow.classList.add("disabled");
            }
        });
    }

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

    if (homeBtn) {
        homeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Home button clicked");
            resetScreenDisplays();
            gameSelectScreen.style.display = "flex";
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            officialContent.style.display = "flex";
            privateContent.classList.remove("active");
            privateContent.style.display = "none";
            if (createForm) createForm.style.display = "none";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = "none";
            displayGameList();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    if (createPineappleBtn && createForm) {
        createPineappleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create a Wordy clicked");
            resetScreenDisplays();
            createForm.style.display = "flex";
            activeInput = document.getElementById("game-name-input");
            if (activeInput) activeInput.focus();
            adjustBackground();
        });
    }

    if (createPineappleLink) {
        createPineappleLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Wordy end button clicked");
            resetScreenDisplays();
            gameSelectScreen.style.display = "flex";
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            privateContent.style.display = "flex";
            officialContent.classList.remove("active");
            officialContent.style.display = "none";
            if (createForm) createForm.style.display = "none";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = "none";
            displayGameList();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    if (nextGameBtnEnd) {
        nextGameBtnEnd.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Next Game button on end screen clicked");
            resetScreenDisplays();
            gameSelectScreen.style.display = "flex";
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            officialContent.style.display = "flex";
            privateContent.classList.remove("active");
            privateContent.style.display = "none";
            if (createForm) createForm.style.display = "none";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = "none";
            displayGameList();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    if (officialBackBtn) {
        officialBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Official Back button clicked");
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    if (privateBackBtn) {
        privateBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Private Back button clicked");
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    if (formBackBtn) {
        formBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form Back button clicked");
            createForm.style.display = "none";
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Confirm button clicked");
            const gameNameInput = document.getElementById("game-name-input");
            const secretWordInput = document.getElementById("secret-word");
            const hintInputs = [
                document.getElementById("hint-1"),
                document.getElementById("hint-2"),
                document.getElementById("hint-3"),
                document.getElementById("hint-4"),
                document.getElementById("hint-5")
            ];

            const gameName = gameNameInput.value.trim().toUpperCase();
            const secretWord = secretWordInput.value.trim().toUpperCase();
            const hints = hintInputs.map(input => input.value.trim().toUpperCase()).filter(hint => hint);

            if (!gameName || !secretWord || hints.length < 5) {
                console.log("Form validation failed", { gameName, secretWord, hintsLength: hints.length });
                alert("Please fill in all fields: Game Name, Secret Word, and all 5 Hints.");
                return;
            }

            console.log("Submitting new game", { gameName, secretWord, hints });

            try {
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        gameName,
                        secretWord,
                        hint1: hints[0] || "",
                        hint2: hints[1] || "",
                        hint3: hints[2] || "",
                        hint4: hints[3] || "",
                        hint5: hints[4] || ""
                    }).toString()
                });

                if (response.ok) {
                    console.log("Game created successfully");
                    gameNameInput.value = "";
                    secretWordInput.value = "";
                    hintInputs.forEach(input => input.value = "");
                    await loadPrivateGames();
                    resetScreenDisplays();
                    gameSelectScreen.style.display = "flex";
                    privateTab.classList.add("active");
                    officialTab.classList.remove("active");
                    privateContent.classList.add("active");
                    privateContent.style.display = "flex";
                    officialContent.classList.remove("active");
                    officialContent.style.display = "none";
                    createForm.style.display = "none";
                    const keyboard = document.getElementById("keyboard-container");
                    if (keyboard) keyboard.style.display = "none";
                    displayGameList();
                    adjustBackground();
                    setupKeyboardListeners();
                } else {
                    console.error("Failed to create game", response.statusText);
                    alert("Failed to create game. Please try again.");
                }
            } catch (error) {
                console.error("Error creating game:", error);
                alert("An error occurred while creating the game. Please try again.");
            }
        });
    }

    if (guessesLink && guessesScreen) {
        guessesLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses link clicked");
            const guessesList = document.getElementById("guesses-list");
            console.log("Current guesses array:", guesses);
            if (guessesScreen.style.display === "flex") {
                console.log("Closing guesses screen via guesses link");
                guessesScreen.style.display = "none";
                gameScreen.style.display = "flex";
                gameScreen.classList.remove("active");
                const keyboard = document.getElementById("keyboard-container");
                if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
                activeInput = guessInput;
                if (activeInput) activeInput.focus();
                setupKeyboardListeners();
            } else {
                guessesList.innerHTML = guesses.length > 0 
                    ? guesses.join(' <span class="separator yellow">|</span>   ')
                    : "No guesses yet!";
                guessesScreen.style.display = "flex";
                gameScreen.classList.add("active");
                const keyboard = document.getElementById("keyboard-container");
                if (keyboard) keyboard.style.display = "none";
                setupKeyboardListeners();
            }
        }, { capture: false });

        const closeGuessesHandler = (e) => {
            if (guessesScreen.style.display === "flex" && 
                !guessesScreen.contains(e.target) && 
                e.target !== guessesLink) {
                console.log("Clicked/tapped outside guesses screen");
                guessesScreen.style.display = "none";
                gameScreen.style.display = "flex";
                gameScreen.classList.remove("active");
                const keyboard = document.getElementById("keyboard-container");
                if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
                activeInput = guessInput;
                if (activeInput) activeInput.focus();
                setupKeyboardListeners();
            }
        };

        document.addEventListener("click", closeGuessesHandler);
        document.addEventListener("touchstart", (e) => {
            e.preventDefault();
            closeGuessesHandler(e);
        }, { passive: false });

        guessesScreen.addEventListener("click", (e) => e.stopPropagation());
        guessesScreen.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: false });
    }

    if (guessesCloseBtn) {
        guessesCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses Close button clicked");
            guessesScreen.style.display = "none";
            gameScreen.style.display = "flex";
            gameScreen.classList.remove("active");
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            setupKeyboardListeners();
        });
    }

    if (giveUpLink && giveUpDialog && giveUpYesBtn && giveUpNoBtn) {
        giveUpLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up link clicked");
            giveUpDialog.style.display = "flex";
        }, { capture: false });

        giveUpYesBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up Yes button clicked");
            gaveUp = true;
            let originalGameNumber = currentGameNumber.replace("Game #", "").split(" - ")[0];
            const gameType = currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple";
            saveGameResult(gameType, originalGameNumber, secretWord, "Gave Up");
            giveUpDialog.style.display = "none";
            endGame(false, true);
        });

        giveUpNoBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up No button clicked");
            giveUpDialog.style.display = "none";
            gameScreen.style.display = "flex";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            setupKeyboardListeners();
        });

        giveUpDialog.addEventListener("click", (e) => {
            if (e.target === giveUpDialog) {
                console.log("Clicked outside give-up dialog");
                giveUpDialog.style.display = "none";
                gameScreen.style.display = "flex";
                const keyboard = document.getElementById("keyboard-container");
                if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
                activeInput = guessInput;
                if (activeInput) activeInput.focus();
                setupKeyboardListeners();
            }
        });
    }

    function resetScreenDisplays() {
        console.log("Resetting screen displays");
        gameScreen.style.display = "none";
        gameOverScreen.style.display = "none";
        gameSelectScreen.style.display = "none";
        if (createForm) createForm.style.display = "none";
        guessesScreen.style.display = "none";
        if (giveUpDialog) giveUpDialog.style.display = "none";
        const keyboard = document.getElementById("keyboard-container");
        if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
        gameScreen.classList.remove("active");
    }

    async function loadGames() {
        console.log("Loading official games from:", officialUrl);
        try {
            const response = await fetch(officialUrl);
            const csvText = await response.text();
            console.log("Official games CSV fetched, parsing...");
            Papa.parse(csvText, {
                header: true,
                complete: (result) => {
                    allGames = result.data
                        .filter(row => row["Game Number"] && row["Secret Word"])
                        .map(row => ({
                            "Game Number": String(row["Game Number"]).trim(),
                            "Secret Word": row["Secret Word"]?.trim().toUpperCase(),
                            "Hint #1": row["Hint #1"]?.trim().toUpperCase(),
                            "Hint #2": row["Hint #2"]?.trim().toUpperCase(),
                            "Hint #3": row["Hint #3"]?.trim().toUpperCase(),
                            "Hint #4": row["Hint #4"]?.trim().toUpperCase(),
                            "Hint #5": row["Hint #5"]?.trim().toUpperCase()
                        }))
                        .sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
                    console.log("Official games loaded:", allGames);
                    if (allGames.length > 0) {
                        loadGame(allGames[0]);
                        displayGameList();
                    } else {
                        console.warn("No valid official games found");
                    }
                },
                error: (error) => {
                    console.error("Error parsing official games CSV:", error);
                }
            });
        } catch (error) {
            console.error("Error loading official games:", error);
        }
    }

    async function loadPrivateGames() {
        console.log("Loading private games from:", privateUrl);
        try {
            const response = await fetch(privateUrl);
            const csvText = await response.text();
            console.log("Private games CSV fetched, parsing...");
            Papa.parse(csvText, {
                header: true,
                complete: (result) => {
                    privateGames = result.data
                        .filter(row => row["Game Number"] && row["Game Name"] && row["Secret Word"])
                        .map(row => ({
                            "Game Number": String(row["Game Number"]).trim(),
                            "Game Name": row["Game Name"]?.trim().toUpperCase(),
                            "Secret Word": row["Secret Word"]?.trim().toUpperCase(),
                            "Hint #1": row["Hint #1"]?.trim().toUpperCase(),
                            "Hint #2": row["Hint #2"]?.trim().toUpperCase(),
                            "Hint #3": row["Hint #3"]?.trim().toUpperCase(),
                            "Hint #4": row["Hint #4"]?.trim().toUpperCase(),
                            "Hint #5": row["Hint #5"]?.trim().toUpperCase()
                        }))
                        .sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
                    console.log("Private games loaded:", privateGames);
                    displayGameList();
                },
                error: (error) => {
                    console.error("Error parsing private games CSV:", error);
                }
            });
        } catch (error) {
            console.error("Error loading private games:", error);
        }
    }

    function loadGame(game) {
        console.log("Loading game:", game);
        gameOver = false;
        guessCount = 0;
        gaveUp = false;
        guesses = [];
        hintIndex = 0;
        firstGuessMade = false;
        isProcessingGuess = false;
        secretWord = game["Secret Word"]?.toUpperCase() || "";
        hints = [
            game["Hint #1"],
            game["Hint #2"],
            game["Hint #3"],
            game["Hint #4"],
            game["Hint #5"]
        ].filter(hint => hint);

        const isPrivate = game["Game Number"].includes("- Private") || (game["Game Name"] && !game["Game Number"].startsWith("Game #"));
        currentGameNumber = isPrivate ? `${game["Game Number"]} - Private` : `Game #${game["Game Number"]}`;
        console.log("Set current game number:", currentGameNumber);

        const newGameNumberDisplay = document.getElementById("new-game-number-display");
        const gameNumberDisplay = document.getElementById("game-number-display");
        if (newGameNumberDisplay) {
            newGameNumberDisplay.textContent = isPrivate ? `Private: ${game["Game Name"] || game["Game Number"]}` : currentGameNumber;
        }
        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = isPrivate ? `Private: ${game["Game Name"] || game["Game Number"]}` : currentGameNumber;
        }

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
            guessesLink.textContent = `Guesses: ${guessCount}`;
        }

        updateHints();
        adjustBackground();

        const gameList = isPrivate ? privateGames : allGames;
        const currentIndex = gameList.findIndex(g => g["Game Number"] === game["Game Number"]);
        updateArrowStates(currentIndex, gameList);

        console.log("Game loaded", { secretWord, hints, currentGameNumber, isPrivate });
    }

    function updateHints() {
        console.log("Updating hints, current hintIndex:", hintIndex, "firstGuessMade:", firstGuessMade);
        const hintsContainer = document.getElementById("hints-container");
        if (!hintsContainer) {
            console.error("Hints container not found");
            return;
        }

        let displayHints = [];
        if (!firstGuessMade) {
            displayHints = hints.slice(0, 1);
        } else {
            displayHints = hints.slice(0, Math.min(hintIndex + 1, hints.length));
        }

        console.log("Display hints:", displayHints);

        hintsContainer.innerHTML = displayHints.length > 0
            ? displayHints.join(' <span class="separator yellow">|</span> ')
            : "No hints available";

        const lines = displayHints.length > 0 ? Math.ceil(displayHints.join(' | ').length / 30) : 0;
        hintsContainer.classList.remove("lines-0", "lines-1", "lines-2");
        hintsContainer.classList.add(`lines-${Math.min(lines, 2)}`);
        console.log("Hints updated, lines:", lines);
    }

    function handleGuess(guess) {
        console.log("Handling guess:", guess, { gameOver, isProcessingGuess, guessCount, secretWord });
        if (gameOver || isProcessingGuess) {
            console.log("Guess ignored due to game state");
            return;
        }

        isProcessingGuess = true;
        guessCount++;
        guesses.push(guess);
        firstGuessMade = true;

        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}`;
        }

        console.log("Guess processed", { guess, guessCount, guesses });

        const guessContainer = document.getElementById("guess-input-container");
        if (guess === secretWord) {
            console.log("Correct guess!");
            const isPrivate = currentGameNumber.includes("- Private");
            const gameType = isPrivate ? "privatePineapple" : "pineapple";
            let originalGameNumber = currentGameNumber.replace("Game #", "").split(" - ")[0];
            saveGameResult(gameType, originalGameNumber, secretWord, guessCount);
            guessInput.disabled = true;
            guessBtn.disabled = true;
            endGame(true);
            isProcessingGuess = false;
        } else {
            console.log("Incorrect guess");
            hintIndex = Math.min(guessCount, hints.length - 1);
            updateHints();
            guessContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessContainer.classList.remove("wrong-guess");
                guessInput.value = "";
                guessInput.focus();
                animationTimeout = null;
                isProcessingGuess = false;
                console.log("Animation completed, input cleared and focused");
                if (guessCount >= 5) {
                    console.log("Max guesses reached");
                    const isPrivate = currentGameNumber.includes("- Private");
                    const gameType = isPrivate ? "privatePineapple" : "pineapple";
                    let originalGameNumber = currentGameNumber.replace("Game #", "").split(" - ")[0];
                    saveGameResult(gameType, originalGameNumber, secretWord, "X");
                    endGame(false, false, true);
                }
            }, 350);
        }
    }

    function saveGameResult(gameType, gameNumber, secretWord, guesses) {
        console.log("Saving game result", { gameType, gameNumber, secretWord, guesses });
        const resultsKey = gameType === "pineapple" ? "pineappleResults" : "privatePineappleResults";
        const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
        results[gameNumber.replace("Game #", "").split(" - ")[0]] = { secretWord, guesses };
        localStorage.setItem(resultsKey, JSON.stringify(results));
        console.log("Game result saved:", results);
    }

    function endGame(won, gaveUp = false, failed = false) {
        console.log("Ending game", { won, gaveUp, failed, guessCount, secretWord });
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;

        resetScreenDisplays();
        gameOverScreen.style.display = "flex";
        const keyboard = document.getElementById("keyboard-container");
        if (keyboard) keyboard.style.display = "none";
        adjustBackground();
        setupKeyboardListeners();

        const todaysWord = document.getElementById("todays-word");
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");
        const hardLuckLabel = document.getElementById("hard-luck-label");
        const wellDoneLabel = document.getElementById("well-done-label");

        if (todaysWord) todaysWord.textContent = secretWord;
        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }
        if (hardLuckLabel) {
            hardLuckLabel.style.display = (failed || gaveUp) ? "block" : "none";
        }
        if (wellDoneLabel) {
            wellDoneLabel.style.display = won ? "block" : "none";
        }

        let shareMessage;
        if (gaveUp || failed) {
            shareMessage = `Play WORDY`;
        } else {
            shareMessage = `${currentGameNumber}\nI solved WORDY in\n<span class="guess-count">${guessCount}</span>\n${guessCount === 1 ? 'guess' : 'guesses'}`;
        }

        if (shareText) {
            shareText.innerHTML = shareMessage.replace(/\n/g, "<br>");
        }

        const shareButtons = {
            whatsapp: document.getElementById("share-whatsapp"),
            telegram: document.getElementById("share-telegram"),
            twitter: document.getElementById("share-twitter")
        };

        if (shareButtons.whatsapp) {
            shareButtons.whatsapp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage.replace(/<[^>]+>/g, ''))}`;
        }
        if (shareButtons.telegram) {
            shareButtons.telegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://wordy.bigbraingames.net")}&text=${encodeURIComponent(shareMessage.replace(/<[^>]+>/g, ''))}`;
        }
        if (shareButtons.twitter) {
            shareButtons.twitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage.replace(/<[^>]+>/g, ''))}`;
        }

        if (won) {
            startPineappleRain();
        }
    }

    function startPineappleRain() {
        console.log("Starting pineapple rain animation");
        const container = document.createElement("div");
        container.className = "pineapple-rain";
        document.body.appendChild(container);

        const emojis = ["🍍", "🍎", "🍐", "🍊", "🍋"];
        const numPieces = 20;

        for (let i = 0; i < numPieces; i++) {
            const piece = document.createElement("div");
            piece.className = "pineapple-piece";
            piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.animationDuration = `${Math.random() * 2 + 2}s`;
            piece.style.fontSize = `${Math.random() * 2 + 2}vh`;
            piece.style.setProperty("--rotation", `${Math.random() * 360 - 180}deg`);
            piece.style.setProperty("--drift", `${Math.random() * 20 - 10}`);
            container.appendChild(piece);
        }

        setTimeout(() => {
            container.remove();
            console.log("Pineapple rain animation ended");
        }, 4000);
    }

    function displayGameList() {
        const officialList = document.getElementById("official-list");
        if (officialList) {
            officialList.innerHTML = "";
            const gameNameElement = document.getElementById("game-name");
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
                    let showSecretWord = false;

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
                        <span>${gameNumber}</span>
                        <span class="${displayWord === 'Play Now' ? 'play-now' : ''}">${displayWord}</span>
                        <span>${guessesDisplay}</span>
                    `;
                    gameItem.addEventListener("click", () => {
                        console.log("Clicked official game:", game);
                        loadGame(game);
                        resetScreenDisplays();
                        gameScreen.style.display = "flex";
                        const keyboard = document.getElementById("keyboard-container");
                        if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
                        activeInput = guessInput;
                        if (activeInput) activeInput.focus();
                        adjustBackground();
                        setupKeyboardListeners();
                        const currentIndex = allGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                        updateArrowStates(currentIndex, allGames);
                    });
                    officialList.appendChild(gameItem);
                    console.log(`Rendered official game ${gameNumber}: ${secretWord}, Guesses: ${guessesDisplay}`);
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
                privateGames.forEach(game => {
                    const gameNumber = game["Game Number"];
                    const gameName = game["Game Name"].toUpperCase();
                    const secretWord = game["Secret Word"] ? game["Secret Word"].toUpperCase() : "N/A";
                    const pastResult = results[gameNumber];
                    let guessesDisplay = '-';
                    let showSecretWord = false;

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
                    gameItem.addEventListener("click", () => {
                        console.log("Clicked private game:", game);
                        loadGame(game);
                        resetScreenDisplays();
                        gameScreen.style.display = "flex";
                        const keyboard = document.getElementById("keyboard-container");
                        if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
                        activeInput = guessInput;
                        if (activeInput) activeInput.focus();
                        adjustBackground();
                        setupKeyboardListeners();
                        const currentIndex = privateGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                        updateArrowStates(currentIndex, privateGames);
                    });
                    privateList.appendChild(gameItem);
                    console.log(`Rendered private game ${gameNumber}: ${gameName}, Secret Word: ${displayWord}, Guesses: ${guessesDisplay}`);
                });
            }
        }
    }

    function showGameSelectScreen() {
        console.log("Showing game select screen");
        resetScreenDisplays();
        gameSelectScreen.style.display = "flex";
        officialTab.classList.add("active");
        privateTab.classList.remove("active");
        officialContent.classList.add("active");
        officialContent.style.display = "flex";
        privateContent.classList.remove("active");
        privateContent.style.display = "none";
        if (createForm) createForm.style.display = "none";
        const keyboard = document.getElementById("keyboard-container");
        if (keyboard) keyboard.style.display = "none";
        displayGameList();
        adjustBackground();
        setupKeyboardListeners();
    }

    function adjustBackground() {
        console.log("Adjusting background, current:", currentBackground);
        const screens = [gameScreen, gameOverScreen, gameSelectScreen, createForm];
        screens.forEach(screen => {
            if (screen && screen !== gameScreen) {
                screen.style.background = `url('${currentBackground}') no-repeat center center fixed`;
                screen.style.backgroundSize = "cover";
                screen.style.backgroundAttachment = "fixed";
            }
        });
        if (gameScreen) {
            gameScreen.style.background = `url('${currentBackground}') no-repeat center top fixed`;
            gameScreen.style.backgroundSize = `100% calc(100% - ${isMobile ? '24vh' : '4vh'})`;
            gameScreen.style.backgroundAttachment = "fixed";
        }
    }

    console.log("Initializing game, isMobile:", isMobile);
    await loadGames();
    await loadPrivateGames();
    resetScreenDisplays();
    gameScreen.style.display = "flex";
    const keyboard = document.getElementById("keyboard-container");
    if (keyboard) {
        keyboard.style.display = isMobile ? "flex" : "none";
    }
    if (guessInput) {
        guessInput.focus();
        activeInput = guessInput;
    }
    adjustBackground();
    setupKeyboardListeners();
});