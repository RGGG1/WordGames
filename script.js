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
    let currentBackground = "newbackground.png"; // Track the current background

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
        guessInput.readOnly = isMobile; // Only readOnly on mobile
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
                guessInput.value = e.target.value.toUpperCase(); // Force uppercase
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
        // Ensure cursor blinks on load
        guessInput.focus();
        activeInput = guessInput;
    } else {
        console.error("guess-input not found in DOM");
    }

    // Add click/tap handler for guess area to focus input
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
        // Remove any existing listeners to prevent duplicates
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
                    guessInput.focus(); // Re-focus input after guess
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

    // Setup form input listeners
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
        input.readOnly = false; // Allow typing on all devices
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
            input.value = input.value.toUpperCase(); // Force uppercase
        });
    });

    // Debounce function for key clicks
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, 50); // Reduced from 100ms
        };
    }

    // Setup keyboard listeners for both game and form
    function setupKeyboardListeners() {
        if (!isMobile) {
            console.log("Skipping on-screen keyboard setup on desktop");
            return;
        }
        const keys = document.querySelectorAll("#keyboard-container .key");
        console.log("Setting up keyboard listeners, found keys:", keys.length);
        keys.forEach(key => {
            // Remove existing listeners to prevent duplicates
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
                    // Ignore Enter for form inputs to prevent unintended submission
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
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
            activeInput = document.getElementById("game-name-input");
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
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

    if (confirmBtn) {
        confirmBtn.removeEventListener("click", confirmBtn._clickHandler);
        const clickHandler = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Confirm button clicked");
            const secretWordInput = document.getElementById("secret-word").value.trim();
            if (secretWordInput.includes(" ") || secretWordInput === "") {
                alert("Secret Word must be one word (no spaces) and cannot be empty.");
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
                alert("Please fill in Game Name, Secret Word, and all Hints (1–5).");
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
                // Clear form inputs
                formInputs.forEach(input => (input.value = ""));
                createForm.style.display = "none";
                resetScreenDisplays();
                gameSelectScreen.style.display = "flex";
                privateTab.classList.add("active");
                officialTab.classList.remove("active");
                privateContent.classList.add("active");
                privateContent.style.display = "flex";
                officialContent.classList.remove("active");
                officialContent.style.display = "none";
                const keyboard = document.getElementById("keyboard-container");
                if (keyboard) keyboard.style.display = "none";
                await fetchPrivateGames();
                displayGameList();
                adjustBackground();
                setupKeyboardListeners();
            } catch (error) {
                console.error("Error submitting form:", error);
                alert("Failed to create game: " + error.message);
            }
        };
        
        confirmBtn._clickHandler = clickHandler;
        confirmBtn.addEventListener("click", clickHandler);
        confirmBtn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            clickHandler(e);
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

    if (guessesScreen && guessesCloseBtn) {
        guessesCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button clicked");
            guessesScreen.style.display = "none";
            gameScreen.style.display = "flex";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            setupKeyboardListeners();
        });

        document.addEventListener("click", (e) => {
            if (guessesScreen.style.display === "flex" && 
                !guessesScreen.contains(e.target) && 
                e.target !== guessesLink) {
                console.log("Clicked outside guesses screen");
                guessesScreen.style.display = "none";
                gameScreen.style.display = "flex";
                const keyboard = document.getElementById("keyboard-container");
                if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
                activeInput = guessInput;
                if (activeInput) activeInput.focus();
                setupKeyboardListeners();
            }
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
            let originalGameNumber;
            if (currentGameNumber.includes("- Private")) {
                const currentNum = parseInt(currentGameNumber.split(" - ")[0]);
                const privateGame = privateGames.find(game => game["Game Number"] === String(currentNum));
                originalGameNumber = privateGame ? privateGame["Game Number"] : currentGameNumber;
            } else {
                originalGameNumber = currentGameNumber;
            }
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

    if (guessesLink && guessesScreen) {
        guessesLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses link clicked");
            const guessesList = document.getElementById("guesses-list");
            console.log("Current guesses array:", guesses);
            if (guessesScreen.style.display === "flex") {
                guessesScreen.style.display = "none";
                gameScreen.style.display = "flex";
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
                const keyboard = document.getElementById("keyboard-container");
                if (keyboard) keyboard.style.display = "none";
                setupKeyboardListeners();
            }
        }, { capture: false });
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

    function resetScreenDisplays() {
        if (gameScreen) gameScreen.style.display = "none";
        if (gameOverScreen) gameOverScreen.style.display = "none";
        if (gameSelectScreen) gameSelectScreen.style.display = "none";
        if (guessesScreen) guessesScreen.style.display = "none";
        if (giveUpDialog) giveUpDialog.style.display = "none";
        if (createForm) createForm.style.display = "none";
    }

    async function fetchGameData() {
        try {
            console.log("Fetching official games from:", officialUrl);
            const response = await fetch(officialUrl, {
                method: "GET",
                mode: "cors",
                cache: "no-cache",
                headers: { "Accept": "text/csv" }
            });
            console.log("Fetch response status:", response.status);
            if (!response.ok) {
                console.error("Fetch failed with status:", response.status, response.statusText);
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            console.log("Official CSV fetched, length:", text.length);
            if (!text.trim()) throw new Error("Empty CSV response");

            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            console.log("Parsed CSV data:", parsed.data);
            if (!parsed.data.length) throw new Error("No data parsed from CSV");

            allGames = parsed.data
                .filter(game => game["Game Number"] && game["Secret Word"])
                .sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            console.log("Filtered and sorted official games:", allGames);
            if (allGames.length === 0) throw new Error("No valid games in CSV");

            const latestGame = allGames[0];
            console.log("Loading latest game:", latestGame);
            loadGame(latestGame);
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            if (createForm) createForm.style.display = "none";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
            adjustBackground();
            setupEventListeners();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
        } catch (error) {
            console.error("Error fetching official games:", error);
            allGames = [
                { "Game Number": "1", "Secret Word": "TEST", "Hint 1": "A trial", "Hint 2": "Not final", "Hint 3": "For checking", "Hint 4": "Experimental", "Hint 5": "Preliminary" }
            ];
            console.log("Using fallback game data:", allGames);
            const fallbackGame = allGames[0];
            loadGame(fallbackGame);
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            if (createForm) createForm.style.display = "none";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
            adjustBackground();
            setupEventListeners();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
        }
    }

    async function fetchPrivateGames() {
        try {
            console.log("Fetching private games from:", privateUrl);
            const response = await fetch(privateUrl, {
                method: "GET",
                mode: "cors",
                cache: "no-cache",
                headers: { "Accept": "text/csv" }
            });
            if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log("Private CSV fetched, length:", text.length);

            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, quoteChar: '"' });
            privateGames = parsed.data
                .filter(game => game["Game Number"] && game["Game Name"] && game["Secret Word"])
                .sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            console.log("Filtered and sorted private games:", privateGames);
        } catch (error) {
            console.error("Error fetching private games:", error);
            privateGames = [];
        }
    }

    function loadGame(game) {
        console.log("Loading game:", game);
        gameOver = false;
        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"],
            game["Hint 2"],
            game["Hint 3"],
            game["Hint 4"],
            game["Hint 5"]
        ].filter(hint => hint).map(hint => hint.toUpperCase());
        hintIndex = 0;
        guessCount = 0;
        guesses = [];
        gaveUp = false;
        isProcessingGuess = false;
        firstGuessMade = false;

        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}`;
        }

        const gameNumberDisplay = document.getElementById("new-game-number-display");
        if (game["Game Name"]) {
            currentGameNumber = `${game["Game Number"]} - Private (${game["Game Name"]})`;
            if (gameNumberDisplay) gameNumberDisplay.textContent = `Game #${game["Game Number"]} - Private (${game["Game Name"]})`;
        } else {
            currentGameNumber = `Game #${game["Game Number"]}`;
            if (gameNumberDisplay) gameNumberDisplay.textContent = `Game #${game["Game Number"]}`;
        }

        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) {
            hintsContainer.innerHTML = "Take a guess to reveal the first hint!";
            hintsContainer.classList.remove("lines-0", "lines-1", "lines-2");
            hintsContainer.classList.add("lines-2");
        }

        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
            guessInput.focus();
            activeInput = guessInput;
        }
        if (guessBtn) guessBtn.disabled = false;

        const savedResult = getSavedResult(currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple", currentGameNumber);
        if (savedResult) {
            console.log("Game already played:", savedResult);
            gameOver = true;
            guessInput.disabled = true;
            guessBtn.disabled = true;
            hintsContainer.innerHTML = hints.slice(0, 5).join(' <span class="separator">/</span> ');
            hintsContainer.classList.remove("lines-0", "lines-1", "lines-2");
            const lineCount = hintsContainer.scrollHeight > hintsContainer.clientHeight * 1.5 ? 2 : 1;
            hintsContainer.classList.add(`lines-${lineCount}`);
            guessCount = savedResult.guesses === "Gave Up" || savedResult.guesses === "X" ? 0 : parseInt(savedResult.guesses);
            guessesLink.textContent = `Guesses: ${savedResult.guesses}`;
            guesses = savedResult.guessesList || [];
        }
        console.log("Game loaded:", { secretWord, hints, currentGameNumber });
    }

    function saveGameResult(gameType, gameNumber, secretWord, guesses) {
        console.log("Saving game result", { gameType, gameNumber, secretWord, guesses });
        let results = JSON.parse(localStorage.getItem(gameType)) || {};
        results[gameNumber] = { secretWord, guesses, guessesList: guesses === "X" || guesses === "Gave Up" ? guesses : [...guesses] };
        localStorage.setItem(gameType, JSON.stringify(results));
        console.log("Saved results:", results);
    }

    function getSavedResult(gameType, gameNumber) {
        const results = JSON.parse(localStorage.getItem(gameType)) || {};
        return results[gameNumber];
    }

    function displayGameList() {
        console.log("Displaying game list", { allGamesLength: allGames.length, privateGamesLength: privateGames.length });
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");

        if (officialList) {
            officialList.innerHTML = "";
            allGames.forEach(game => {
                const result = getSavedResult("pineapple", `Game #${game["Game Number"]}`);
                const row = document.createElement("div");
                row.className = "game-list-row";
                row.innerHTML = `
                    <span>#${game["Game Number"]}</span>
                    <span>${result ? result.secretWord : '-'}</span>
                    <span>${result ? result.guesses : '<span class="play-now">Play Now!</span>'}</span>
                `;
                if (!result) {
                    row.addEventListener("click", () => {
                        console.log("Official game row clicked:", game["Game Number"]);
                        loadGame(game);
                        resetScreenDisplays();
                        gameScreen.style.display = "flex";
                        const keyboard = document.getElementById("keyboard-container");
                        if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
                        activeInput = guessInput;
                        if (activeInput) activeInput.focus();
                        adjustBackground();
                        setupKeyboardListeners();
                        updateArrowStates(allGames.findIndex(g => g["Game Number"] === game["Game Number"]), allGames);
                    });
                }
                officialList.appendChild(row);
            });
        }

        if (privateList) {
            privateList.innerHTML = "";
            privateGames.forEach(game => {
                const result = getSavedResult("privatePineapple", `${game["Game Number"]} - Private (${game["Game Name"]})`);
                const row = document.createElement("div");
                row.className = "game-list-row";
                row.innerHTML = `
                    <span>${game["Game Name"]}</span>
                    <span>${result ? result.secretWord : '-'}</span>
                    <span>${result ? result.guesses : '<span class="play-now">Play Now!</span>'}</span>
                `;
                if (!result) {
                    row.addEventListener("click", () => {
                        console.log("Private game row clicked:", game["Game Number"]);
                        loadGame(game);
                        resetScreenDisplays();
                        gameScreen.style.display = "flex";
                        const keyboard = document.getElementById("keyboard-container");
                        if (keyboard) keyboard.style.display = isMobile ? "flex" : "none";
                        activeInput = guessInput;
                        if (activeInput) activeInput.focus();
                        adjustBackground();
                        setupKeyboardListeners();
                        updateArrowStates(privateGames.findIndex(g => g["Game Number"] === game["Game Number"]), privateGames);
                    });
                }
                privateList.appendChild(row);
            });
        }
    }

    function setupEventListeners() {
        const shareButtons = document.querySelectorAll("#share-buttons a");
        shareButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                e.preventDefault();
                const shareTextElement = document.getElementById("share-text");
                let shareText = shareTextElement.innerText;
                if (gaveUp || guessCount === 0) {
                    shareText = `Play WORDY\nhttps://wordygame.net`;
                } else {
                    shareText = shareText.replace("I solved WORDY in", "I solved it in");
                    shareText = `WORDY ${shareText}\nhttps://wordygame.net`;
                }
                console.log("Share text prepared:", shareText);

                let url;
                if (button.id === "share-whatsapp") {
                    url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                } else if (button.id === "share-telegram") {
                    url = `https://t.me/share/url?url=https://wordygame.net&text=${encodeURIComponent(shareText)}`;
                } else if (button.id === "share-twitter") {
                    url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                }

                if (url) {
                    console.log("Opening share URL:", url);
                    window.open(url, "_blank");
                }
            });
        });
    }

    function revealHint() {
        console.log("Revealing hint, current hintIndex:", hintIndex);
        if (hintIndex < hints.length) {
            const hintsContainer = document.getElementById("hints-container");
            if (hintsContainer) {
                hintIndex++;
                firstGuessMade = true;
                const displayedHints = hints.slice(0, hintIndex);
                hintsContainer.innerHTML = displayedHints.join(' <span class="separator">/</span> ');
                hintsContainer.classList.remove("lines-0", "lines-1", "lines-2");
                const lineCount = hintsContainer.scrollHeight > hintsContainer.clientHeight * 1.5 ? 2 : 1;
                hintsContainer.classList.add(`lines-${lineCount}`);
                console.log("Hint revealed:", displayedHints, "Line count:", lineCount);
            }
        }
    }

    function handleGuess(guess) {
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored:", { isProcessingGuess, gameOver });
            return;
        }
        isProcessingGuess = true;
        console.log("Handling guess:", guess);

        const guessContainer = document.getElementById("guess-input-container");
        guessContainer.classList.remove("wrong-guess");
        guessInput.value = "";
        guessCount++;
        guesses.push(guess);
        console.log("Guess added, current guesses:", guesses);

        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}`;
        }

        if (guess === secretWord) {
            console.log("Correct guess!");
            saveGameResult(currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple", currentGameNumber, secretWord, guessCount);
            endGame(true);
        } else {
            console.log("Incorrect guess, animating...");
            guessContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessContainer.classList.remove("wrong-guess");
                guessInput.style.opacity = "1";
                guessInput.style.visibility = "visible";
                guessInput.style.color = "#000000";
                isProcessingGuess = false;
                console.log("Animation completed, input reset");
                if (guessInput) {
                    guessInput.focus(); // Ensure focus after animation
                    activeInput = guessInput;
                }
            }, 350);

            if (guessCount >= 5) {
                console.log("Reached 5 guesses, ending game");
                saveGameResult(currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple", currentGameNumber, secretWord, "X");
                endGame(false, false);
            } else if (hintIndex < hints.length - 1) {
                revealHint();
            }
        }
    }

    function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp, guessCount, secretWord });
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

        if (todaysWord) todaysWord.textContent = secretWord;
        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }
        if (hardLuckLabel) {
            hardLuckLabel.style.display = (!won && !gaveUp) ? "block" : "none";
        }

        let shareMessage;
        if (gaveUp || !won) {
            shareMessage = `Play WORDY`;
        } else {
            shareMessage = `${currentGameNumber}\nI solved WORDY in\n<span class="guess-count">${guessCount}</span>\n${guessCount === 1 ? 'guess' : 'guesses'}`;
        }

        if (shareText) {
            shareText.innerHTML = shareMessage.replace(/\n/g, "<br>");
        }

        if (won) {
            const pineappleRain = document.createElement("div");
            pineappleRain.className = "pineapple-rain";
            document.body.appendChild(pineappleRain);
            for (let i = 0; i < 10; i++) {
                const piece = document.createElement("span");
                piece.className = "pineapple-piece";
                piece.textContent = "🍍";
                piece.style.fontSize = `${Math.random() * 2 + 1}rem`;
                piece.style.left = `${Math.random() * 100}vw`;
                piece.style.animationDuration = `${Math.random() * 2 + 2}s`;
                piece.style.setProperty('--rotation', `${(Math.random() - 0.5) * 720}deg`);
                piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 20}`);
                pineappleRain.appendChild(piece);
            }
            setTimeout(() => pineappleRain.remove(), 4000);
        }
    }

    function adjustBackground() {
        console.log("Adjusting background for all screens, using currentBackground:", currentBackground);
        const screens = [gameScreen, gameOverScreen, gameSelectScreen, createForm];
        screens.forEach(screen => {
            if (screen) {
                // Apply background to all screens
                if (screen.id === "create-form") {
                    screen.style.background = `url('${currentBackground}') no-repeat center center fixed`;
                    screen.style.backgroundSize = "cover"; // Full screen for create form
                } else {
                    screen.style.background = `url('${currentBackground}') no-repeat center top fixed`;
                    screen.style.backgroundSize = "100% calc(100% - 24vh)";
                }
                // Force repaint
                screen.offsetHeight;
                console.log(`Set background for ${screen.id} to ${currentBackground}`);
            }
        });

        // Update background for the body to ensure consistency
        document.body.style.background = `url('${currentBackground}') no-repeat center top fixed`;
        document.body.style.backgroundSize = "100% calc(100% - 24vh)";
    }

    // Initial fetch and setup
    await fetchGameData();
    await fetchPrivateGames();
    displayGameList();
});