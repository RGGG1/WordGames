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
                guessInput.value = e.target.value;
                isProcessingGuess = false;
                console.log("Animation cancelled and state reset due to typing");
            }
            updateCursorPosition();
        });
        // Ensure cursor blinks on load
        guessInput.focus();
        activeInput = guessInput;
        updateCursorPosition();
    } else {
        console.error("guess-input not found in DOM");
    }

    // Function to update cursor position based on text length
    function updateCursorPosition() {
        if (!guessInput || guessInput.disabled) return;
        const text = guessInput.value.toUpperCase();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = `bold 4.5vh 'Luckiest Guy', cursive`;
        const textWidth = ctx.measureText(text).width;
        const padding = 1; // 1vw padding from CSS
        const inputWidth = guessInput.offsetWidth;
        const cursorX = textWidth + padding * inputWidth / 100; // Convert vw to pixels
        guessInput.style.setProperty('--cursor-x', `${cursorX}px`);
        console.log("Updated cursor position:", { text, textWidth, cursorX });
    }

    // Add click/tap handler for guess area to focus input
    if (guessArea) {
        guessArea.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
                updateCursorPosition();
                console.log("Guess area clicked, input focused");
            }
        });
        guessArea.addEventListener("touchstart", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
                updateCursorPosition();
                console.log("Guess area touched, input focused");
            }
        });
    }

    if (guessBtn) {
        // Remove any existing listeners to prevent duplicates
        guessBtn.removeEventListener("click", guessBtn._clickHandler);
        const clickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guess button clicked:", { 
                gameOver, 
                disabled: guessBtn.disabled, 
                inputDisabled: guessInput.disabled, 
                isProcessingGuess, 
                guess: guessInput.value 
            });
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Submitting guess via button:", guess);
                    handleGuess(guess);
                } else {
                    console.log("No guess entered");
                }
            } else {
                console.log("Guess button ignored due to state:", { gameOver, disabled: guessBtn.disabled, isProcessingGuess });
            }
        };
        guessBtn._clickHandler = clickHandler;
        guessBtn.addEventListener("click", clickHandler);
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
        // Removed input.readOnly = true to allow direct typing
        input.disabled = false;
        input.addEventListener("click", () => {
            activeInput = input;
            input.focus();
            console.log("Form input selected:", input.id);
        });
        input.addEventListener("touchstart", () => {
            activeInput = input;
            input.focus();
            console.log("Form input touched:", input.id);
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
            timeout = setTimeout(later, wait);
        };
    }

    // Setup keyboard listeners for both game and form
    function setupKeyboardListeners() {
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
                    if (activeInput === guessInput) updateCursorPosition();
                } else {
                    activeInput.value += keyValue;
                    console.log("Key added, new value:", activeInput.value);
                    if (activeInput === guessInput) updateCursorPosition();
                }
                activeInput.focus();
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
            setupKeyboardListeners(); // Re-apply listeners
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
            setupKeyboardListeners(); // Re-apply listeners
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
            setupKeyboardListeners(); // Re-apply listeners
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
            if (keyboard) keyboard.style.display = "flex";
            activeInput = document.getElementById("game-name-input");
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners(); // Re-apply listeners
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
            setupKeyboardListeners(); // Re-apply listeners
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
            setupKeyboardListeners(); // Re-apply listeners
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
            if (keyboard) keyboard.style.display = "flex";
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners(); // Re-apply listeners
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
            if (keyboard) keyboard.style.display = "flex";
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners(); // Re-apply listeners
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener("click", async (e) => {
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
                setupKeyboardListeners(); // Re-apply listeners
            } catch (error) {
                console.error("Error submitting form:", error);
                alert("Failed to create game: " + error.message);
            }
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
            if (keyboard) keyboard.style.display = "flex";
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners(); // Re-apply listeners
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
            if (keyboard) keyboard.style.display = "flex";
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            setupKeyboardListeners(); // Re-apply listeners
        });

        document.addEventListener("click", (e) => {
            if (guessesScreen.style.display === "flex" && 
                !guessesScreen.contains(e.target) && 
                e.target !== guessesLink) {
                console.log("Clicked outside guesses screen, closing");
                guessesScreen.style.display = "none";
                gameScreen.style.display = "flex";
                const keyboard = document.getElementById("keyboard-container");
                if (keyboard) keyboard.style.display = "flex";
                activeInput = guessInput;
                if (activeInput) activeInput.focus();
                setupKeyboardListeners(); // Re-apply listeners
            } else {
                console.log("Click ignored for guesses screen close", {
                    display: guessesScreen.style.display,
                    targetIsGuessesScreen: guessesScreen.contains(e.target),
                    targetIsGuessesLink: e.target === guessesLink
                });
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
            if (keyboard) keyboard.style.display = "flex";
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            setupKeyboardListeners(); // Re-apply listeners
        });

        giveUpDialog.addEventListener("click", (e) => {
            if (e.target === giveUpDialog) {
                console.log("Clicked outside give-up dialog");
                giveUpDialog.style.display = "none";
                gameScreen.style.display = "flex";
                const keyboard = document.getElementById("keyboard-container");
                if (keyboard) keyboard.style.display = "flex";
                activeInput = guessInput;
                if (activeInput) activeInput.focus();
                setupKeyboardListeners(); // Re-apply listeners
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
                if (keyboard) keyboard.style.display = "flex";
                activeInput = guessInput;
                if (activeInput) activeInput.focus();
                setupKeyboardListeners(); // Re-apply listeners
            } else {
                guessesList.innerHTML = guesses.length > 0 
                    ? guesses.join(' <span class="separator yellow">|</span>   ')
                    : "No guesses yet!";
                guessesScreen.style.display = "flex";
                const keyboard = document.getElementById("keyboard-container");
                if (keyboard) keyboard.style.display = "none";
                setupKeyboardListeners(); // Re-apply listeners
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
        setupKeyboardListeners(); // Re-apply listeners
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
            if (keyboard) keyboard.style.display = "flex";
            updateHintCountdown();
            adjustBackground();
            setupEventListeners();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
        } catch (error) {
            console.error("Error fetching official games:", error);
            allGames = [
                { "Game Number": "1", "Secret Word": "TEST", "Hint 1": "SAMPLE", "Hint 2": "WORD", "Hint 3": "GAME", "Hint 4": "PLAY", "Hint 5": "FUN", "Background": "testbackground.png" }
            ];
            console.log("Using hardcoded game with background:", allGames);
            loadGame(allGames[0]);
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            if (createForm) createForm.style.display = "none";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = "flex";
            updateHintCountdown();
            adjustBackground();
            setupEventListeners();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
            alert("Failed to fetch games. Using default game.");
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
            console.log("Fetch response status:", response.status);
            if (!response.ok) {
                console.error("Fetch failed with status:", response.status, response.statusText);
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            console.log("Private CSV fetched, length:", text.length);
            if (!text.trim()) {
                console.log("Empty private games CSV, setting privateGames to empty array");
                privateGames = [];
                return;
            }

            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            console.log("Parsed private CSV data:", parsed.data);
            privateGames = parsed.data
                .filter(game => game["Game Number"] && game["Secret Word"])
                .sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            console.log("Filtered and sorted private games:", privateGames);
        } catch (error) {
            console.error("Error fetching private games:", error);
            privateGames = [];
            console.log("Set privateGames to empty array due to error");
        }
    }

    function adjustBackground() {
        const screens = [gameScreen, gameOverScreen, gameSelectScreen, createForm];
        screens.forEach(screen => {
            if (screen && screen.style.display !== "none") {
                screen.style.backgroundImage = `url('${currentBackground}')`;
                screen.style.backgroundSize = "100% calc(100% - 24vh)";
                screen.style.backgroundPosition = "center top";
                screen.style.backgroundRepeat = "no-repeat";
                screen.style.backgroundAttachment = "fixed";
                console.log(`Adjusted background for screen:`, screen.id, `to:`, currentBackground);
            }
        });
    }

    function loadGame(game) {
        console.log("Loading game:", game);
        secretWord = game["Secret Word"].toUpperCase().trim();
        hints = [
            game["Hint 1"]?.toUpperCase().trim(),
            game["Hint 2"]?.toUpperCase().trim(),
            game["Hint 3"]?.toUpperCase().trim(),
            game["Hint 4"]?.toUpperCase().trim(),
            game["Hint 5"]?.toUpperCase().trim()
        ].filter(hint => hint);
        console.log("Loaded hints:", hints);
        hintIndex = 0;
        guessCount = 0;
        guesses = [];
        gaveUp = false;
        gameOver = false;
        firstGuessMade = false;
        isProcessingGuess = false;
        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
            guessInput.focus();
            activeInput = guessInput;
            updateCursorPosition();
        }
        if (guessBtn) guessBtn.disabled = false;
        currentGameNumber = game["Game Number"].includes("- Private") 
            ? game["Game Number"] 
            : `Game #${game["Game Number"]}`;
        currentBackground = game["Background"]?.trim() || defaultBackground;
        console.log("Set currentGameNumber:", currentGameNumber, "Background:", currentBackground);

        const gameNumberDisplays = document.querySelectorAll(".game-number-display");
        gameNumberDisplays.forEach(display => {
            if (display) display.textContent = currentGameNumber;
        });

        const newGameNumberDisplay = document.querySelector(".new-game-number-display");
        if (newGameNumberDisplay) {
            newGameNumberDisplay.textContent = currentGameNumber;
        }

        updateHintDisplay();
        adjustBackground();

        const guessesList = document.getElementById("guesses-list");
        if (guessesList) {
            guessesList.innerHTML = "No guesses yet!";
        }

        console.log("Game loaded successfully:", { secretWord, currentGameNumber, hints });
    }

    function updateHintDisplay() {
        const hintsLabel = document.getElementById("hints-label");
        const hintsInline = document.getElementById("hints-inline");
        if (!hintsLabel || !hintsInline) {
            console.error("Hints label or inline element not found");
            return;
        }

        hintsLabel.style.display = "block";
        let currentHint = hints[hintIndex] || "";
        console.log("Updating hint display:", { hintIndex, currentHint, firstGuessMade });

        if (!firstGuessMade) {
            hintsInline.textContent = "Make your first guess to reveal a hint!";
            hintsInline.classList.remove("lines-1", "lines-2");
            hintsInline.classList.add("lines-2");
            return;
        }

        if (hintIndex >= hints.length) {
            hintsInline.textContent = "No more hints available!";
            hintsInline.classList.remove("lines-1", "lines-2");
            hintsInline.classList.add("lines-1");
            return;
        }

        hintsInline.textContent = currentHint;
        const lineCount = currentHint.length > 20 ? 2 : 1;
        hintsInline.classList.remove("lines-1", "lines-2");
        hintsInline.classList.add(`lines-${lineCount}`);
        console.log("Hint displayed:", { hint: currentHint, lineCount });
    }

    function updateHintCountdown() {
        const hintCountdown = document.querySelector(".hint-countdown");
        if (!hintCountdown) {
            console.error("Hint countdown element not found");
            return;
        }

        let remainingHints = hints.length - hintIndex;
        if (!firstGuessMade) {
            remainingHints = hints.length;
        }

        hintCountdown.textContent = `${remainingHints} hint${remainingHints !== 1 ? 's' : ''} remaining`;
        console.log("Updated hint countdown:", hintCountdown.textContent);
    }

    function handleGuess(guess) {
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored due to state:", { isProcessingGuess, gameOver });
            return;
        }

        isProcessingGuess = true;
        guessCount++;
        guesses.push(guess);
        console.log("Handling guess:", { guess, guessCount, guesses });

        const guessContainer = document.getElementById("guess-input-container");
        const guessesList = document.getElementById("guesses-list");

        if (guessesList) {
            guessesList.innerHTML = guesses.length > 0 
                ? guesses.join(' <span class="separator yellow">|</span>   ')
                : "No guesses yet!";
        }

        if (!firstGuessMade) {
            firstGuessMade = true;
            updateHintDisplay();
            updateHintCountdown();
        }

        if (guess === secretWord) {
            console.log("Correct guess!");
            let originalGameNumber;
            if (currentGameNumber.includes("- Private")) {
                const currentNum = parseInt(currentGameNumber.split(" - ")[0]);
                const privateGame = privateGames.find(game => game["Game Number"] === String(currentNum));
                originalGameNumber = privateGame ? privateGame["Game Number"] : currentGameNumber;
            } else {
                originalGameNumber = currentGameNumber;
            }
            const gameType = currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple";
            saveGameResult(gameType, originalGameNumber, secretWord, guessCount);
            endGame(true);
            isProcessingGuess = false;
            return;
        }

        console.log("Incorrect guess, showing animation");
        guessContainer.classList.add("wrong-guess");
        guessInput.style.opacity = "0";
        guessInput.style.visibility = "hidden";

        animationTimeout = setTimeout(() => {
            guessContainer.classList.remove("wrong-guess");
            guessInput.style.opacity = "1";
            guessInput.style.visibility = "visible";
            guessInput.value = "";
            guessInput.style.color = "#000000";
            guessInput.focus();
            activeInput = guessInput;
            updateCursorPosition();
            isProcessingGuess = false;
            animationTimeout = null;
            console.log("Animation completed, input reset");
        }, 2000);

        hintIndex++;
        updateHintDisplay();
        updateHintCountdown();
    }

    function saveGameResult(gameType, gameNumber, word, result) {
        console.log("Saving game result:", { gameType, gameNumber, word, result });
        try {
            let results = JSON.parse(localStorage.getItem(gameType)) || {};
            results[gameNumber] = { word, result, timestamp: new Date().toISOString() };
            localStorage.setItem(gameType, JSON.stringify(results));
            console.log("Game result saved to localStorage:", results);
        } catch (error) {
            console.error("Error saving game result:", error);
        }
    }

    function endGame(won, gaveUp = false) {
        console.log("Ending game:", { won, gaveUp });
        gameOver = true;
        if (guessInput) guessInput.disabled = true;
        if (guessBtn) guessBtn.disabled = true;
        resetScreenDisplays();
        gameOverScreen.style.display = "flex";
        const keyboard = document.getElementById("keyboard-container");
        if (keyboard) keyboard.style.display = "none";

        const todaysWordLabel = document.getElementById("todays-word-label");
        const todaysWord = document.getElementById("todays-word");
        const shareText = document.getElementById("share-text");
        const shareGameNumber = document.getElementById("share-game-number");

        if (todaysWordLabel && todaysWord && shareText && shareGameNumber) {
            let resultText = "";
            let shareResult = "";

            if (gaveUp) {
                todaysWordLabel.textContent = `You gave up after ${guessCount} guess${guessCount !== 1 ? 'es' : ''}. Today's word was:`;
                todaysWord.textContent = secretWord;
                resultText = `I gave up after ${guessCount} guess${guessCount !== 1 ? 'es' : ''}!`;
                shareResult = `Gave up after ${guessCount} guess${guessCount !== 1 ? 'es' : ''}`;
            } else if (won) {
                todaysWordLabel.textContent = `You got it in ${guessCount} guess${guessCount !== 1 ? 'es' : ''}! Today's word was:`;
                todaysWord.textContent = secretWord;
                resultText = `I got it in ${guessCount} guess${guessCount !== 1 ? 'es' : ''}!`;
                shareResult = `Solved in ${guessCount} guess${guessCount !== 1 ? 'es' : ''}`;
            }

            shareGameNumber.textContent = currentGameNumber;
            shareText.innerHTML = `
                <span class="guess-count">${guessCount}</span><br>
                ${resultText}<br>
                <span class="small-game-number">${currentGameNumber}</span>
            `;

            console.log("Game over screen updated:", { resultText, shareResult });
        } else {
            console.error("Game over screen elements missing");
        }

        adjustBackground();
        startPineappleRain();
    }

    function startPineappleRain() {
        console.log("Starting pineapple rain");
        const container = document.createElement("div");
        container.className = "pineapple-rain";
        document.body.appendChild(container);

        const numPineapples = 20;
        const emojis = ["🍍", "🥥", "🍌", "🍎", "🍊"];
        const screenWidth = window.innerWidth;

        for (let i = 0; i < numPineapples; i++) {
            const pineapple = document.createElement("span");
            pineapple.className = "pineapple-piece";
            pineapple.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            pineapple.style.left = `${Math.random() * screenWidth}px`;
            pineapple.style.fontSize = `${2 + Math.random() * 2}vh`;
            
            // Random rotation angles between -45 and 45 degrees
            const startAngle = (Math.random() * 90 - 45).toFixed(2);
            const endAngle = (startAngle + (Math.random() * 20 - 10)).toFixed(2); // Slight variation for end angle
            pineapple.style.setProperty('--start-angle', `${startAngle}deg`);
            pineapple.style.setProperty('--end-angle', `${endAngle}deg`);
            
            // Random falling speed between 2s and 4s
            const fallDuration = (2 + Math.random() * 2).toFixed(2);
            pineapple.style.animationDuration = `${fallDuration}s`;

            container.appendChild(pineapple);

            // Remove pineapple after animation
            pineapple.addEventListener("animationend", () => {
                pineapple.remove();
            });
        }

        // Clean up container after all animations
        setTimeout(() => {
            container.remove();
            console.log("Pineapple rain ended");
        }, 4000);
    }

    function displayGameList() {
        console.log("Displaying game list");
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");

        if (officialList) {
            officialList.innerHTML = "";
            allGames.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                row.innerHTML = `
                    <span>${game["Game Number"]}</span>
                    <span>${game["Hint 1"]}</span>
                    <span class="play-now">Play Now</span>
                `;
                row.querySelector(".play-now").addEventListener("click", () => {
                    console.log("Play Now clicked for official game:", game["Game Number"]);
                    loadGame(game);
                    resetScreenDisplays();
                    gameScreen.style.display = "flex";
                    const keyboard = document.getElementById("keyboard-container");
                    if (keyboard) keyboard.style.display = "flex";
                    activeInput = guessInput;
                    if (activeInput) activeInput.focus();
                    adjustBackground();
                    setupKeyboardListeners();
                    updateArrowStates(allGames.indexOf(game), allGames);
                });
                officialList.appendChild(row);
            });
            console.log("Official game list populated:", allGames.length);
        }

        if (privateList) {
            privateList.innerHTML = "";
            privateGames.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                row.innerHTML = `
                    <span>${game["Game Number"]}</span>
                    <span>${game["Game Name"]}</span>
                    <span class="play-now">Play Now</span>
                `;
                row.querySelector(".play-now").addEventListener("click", () => {
                    console.log("Play Now clicked for private game:", game["Game Number"]);
                    loadGame(game);
                    resetScreenDisplays();
                    gameScreen.style.display = "flex";
                    const keyboard = document.getElementById("keyboard-container");
                    if (keyboard) keyboard.style.display = "flex";
                    activeInput = guessInput;
                    if (activeInput) activeInput.focus();
                    adjustBackground();
                    setupKeyboardListeners();
                    updateArrowStates(privateGames.indexOf(game), privateGames);
                });
                privateList.appendChild(row);
            });
            console.log("Private game list populated:", privateGames.length);
        }
    }

    function setupEventListeners() {
        console.log("Setting up event listeners");
        const shareButtons = document.querySelectorAll("#share-buttons a");
        shareButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                e.preventDefault();
                const platform = button.id;
                console.log(`Share button clicked for ${platform}`);
                const shareTextElement = document.getElementById("share-text");
                const shareGameNumberElement = document.getElementById("share-game-number");
                if (shareTextElement && shareGameNumberElement) {
                    const text = `${shareTextElement.textContent}\n${shareGameNumberElement.textContent}\nPlay at: https://your-game-url.com`;
                    if (platform === "copy-link") {
                        navigator.clipboard.writeText(text).then(() => {
                            alert("Results copied to clipboard!");
                            console.log("Share text copied:", text);
                        }).catch(err => {
                            console.error("Failed to copy:", err);
                            alert("Failed to copy results.");
                        });
                    } else {
                        console.log("Share platform not implemented:", platform);
                    }
                }
            });
        });
    }

    // Initialize game
    await fetchGameData();
    await fetchPrivateGames();
    displayGameList();
    adjustBackground();
    setupKeyboardListeners();
    if (guessInput) {
        guessInput.focus();
        activeInput = guessInput;
        updateCursorPosition();
    }
});