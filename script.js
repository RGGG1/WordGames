document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded");

    let score = 0;
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
        // Remove existing listeners to prevent duplicates
        guessBtn.removeEventListener("click", guessBtn._clickHandler);
        const clickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guess button clicked:", { gameOver, disabled: guessInput.disabled, isProcessingGuess, guess: guessInput.value });
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Submitting guess:", guess);
                    handleGuess(guess);
                } else {
                    console.log("No guess entered");
                }
            } else {
                console.log("Guess button ignored due to state");
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
        input.readOnly = true; // Use on-screen keyboard
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
                } else {
                    activeInput.value += keyValue;
                    console.log("Key added, new value:", activeInput.value);
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
                console.log("Clicked outside guesses screen");
                guessesScreen.style.display = "none";
                gameScreen.style.display = "flex";
                const keyboard = document.getElementById("keyboard-container");
                if (keyboard) keyboard.style.display = "flex";
                activeInput = guessInput;
                if (activeInput) activeInput.focus();
                setupKeyboardListeners(); // Re-apply listeners
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
        });
    }

    if (guessesLink) {
        guessesLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses link clicked");
            displayGuesses();
            guessesScreen.style.display = "flex";
            gameScreen.style.display = "none";
            const keyboard = document.getElementById("keyboard-container");
            if (keyboard) keyboard.style.display = "none";
        });
    }

    async function fetchGames(url) {
        try {
            const response = await fetch(url);
            const csvText = await response.text();
            console.log("Fetched CSV:", csvText);
            const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            if (parsedData.errors.length > 0) {
                console.error("CSV parsing errors:", parsedData.errors);
            }
            return parsedData.data;
        } catch (error) {
            console.error("Error fetching games:", error);
            return [];
        }
    }

    async function fetchOfficialGames() {
        allGames = await fetchGames(officialUrl);
        console.log("Official games fetched:", allGames);
        allGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
    }

    async function fetchPrivateGames() {
        privateGames = await fetchGames(privateUrl);
        console.log("Private games fetched:", privateGames);
        privateGames.sort((a, b) => parseInt(b["Game Number"]) - parseInt(a["Game Number"]));
    }

    function resetScreenDisplays() {
        gameScreen.style.display = "none";
        gameOverScreen.style.display = "none";
        gameSelectScreen.style.display = "none";
        if (createForm) createForm.style.display = "none";
        guessesScreen.style.display = "none";
        if (giveUpDialog) giveUpDialog.style.display = "none";
    }

    function adjustBackground() {
        const screens = [gameScreen, gameOverScreen, gameSelectScreen, createForm];
        screens.forEach(screen => {
            if (screen && screen.style.display !== "none") {
                screen.style.backgroundImage = `url('${defaultBackground}')`;
                screen.style.backgroundSize = "100% calc(100% - 24vh)";
                screen.style.backgroundPosition = "center top";
                screen.style.backgroundAttachment = "fixed";
            }
        });
    }

    function displayGuesses() {
        const guessesList = document.getElementById("guesses-list");
        if (guessesList) {
            guessesList.innerHTML = "";
            if (guesses.length === 0) {
                guessesList.textContent = "No guesses yet.";
                return;
            }
            guesses.forEach((guess, index) => {
                const guessSpan = document.createElement("span");
                guessSpan.textContent = guess.toUpperCase();
                if (index < guesses.length - 1) {
                    const separator = document.createElement("span");
                    separator.className = "separator";
                    separator.textContent = " | ";
                    guessesList.appendChild(guessSpan);
                    guessesList.appendChild(separator);
                } else {
                    guessesList.appendChild(guessSpan);
                }
            });
        }
    }

    function saveGameResult(gameType, gameNumber, word, result) {
        const results = JSON.parse(localStorage.getItem(gameType) || "{}");
        results[gameNumber] = { word, result };
        localStorage.setItem(gameType, JSON.stringify(results));
        console.log(`Saved game result: ${gameType} ${gameNumber} - ${word} - ${result}`);
    }

    function getGameResult(gameType, gameNumber) {
        const results = JSON.parse(localStorage.getItem(gameType) || "{}");
        return results[gameNumber] || null;
    }

    function displayGameList() {
        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");

        if (officialList) {
            officialList.innerHTML = "";
            allGames.forEach(game => {
                const gameNumber = game["Game Number"];
                const word = game["Secret Word"];
                const result = getGameResult("pineapple", `Game #${gameNumber}`);
                const row = document.createElement("div");
                row.className = "game-list-row";
                row.innerHTML = `
                    <span>Game #${gameNumber}</span>
                    <span>${result ? result.word : "—"}</span>
                    <span>${result ? (result.result === "Gave Up" ? "Gave Up" : `${result.result} ${result.result === 1 ? "guess" : "guesses"}`) : "Play Now"}</span>
                `;
                row.addEventListener("click", () => {
                    console.log("Official game row clicked:", gameNumber);
                    loadGame(game);
                    resetScreenDisplays();
                    gameScreen.style.display = "flex";
                    const keyboard = document.getElementById("keyboard-container");
                    if (keyboard) keyboard.style.display = "flex";
                    activeInput = guessInput;
                    if (activeInput) activeInput.focus();
                    adjustBackground();
                    setupKeyboardListeners();
                });
                officialList.appendChild(row);
            });
        }

        if (privateList) {
            privateList.innerHTML = "";
            privateGames.forEach(game => {
                const gameNumber = game["Game Number"];
                const gameName = game["Game Name"];
                const word = game["Secret Word"];
                const result = getGameResult("privatePineapple", gameNumber);
                const row = document.createElement("div");
                row.className = "game-list-row";
                row.innerHTML = `
                    <span>${gameName}</span>
                    <span>${result ? result.word : "—"}</span>
                    <span>${result ? (result.result === "Gave Up" ? "Gave Up" : `${result.result} ${result.result === 1 ? "guess" : "guesses"}`) : "Play Now"}</span>
                `;
                row.addEventListener("click", () => {
                    console.log("Private game row clicked:", gameNumber);
                    loadGame(game, true);
                    resetScreenDisplays();
                    gameScreen.style.display = "flex";
                    const keyboard = document.getElementById("keyboard-container");
                    if (keyboard) keyboard.style.display = "flex";
                    activeInput = guessInput;
                    if (activeInput) activeInput.focus();
                    adjustBackground();
                    setupKeyboardListeners();
                });
                privateList.appendChild(row);
            });
        }
    }

    function showGameSelectScreen() {
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

    function updateHintDisplay() {
        const hintsContainer = document.getElementById("hints-container");
        const countdownElement = document.getElementById("countdown");
        const hintCountdown = document.querySelector(".hint-countdown");

        if (!hintsContainer || !countdownElement || !hintCountdown) return;

        hintsContainer.innerHTML = "";
        let displayedHints = hints.slice(0, hintIndex + 1);
        let lines = 0;

        displayedHints.forEach((hint, idx) => {
            if (hint) {
                const hintSpan = document.createElement("span");
                hintSpan.textContent = hint;
                hintsContainer.appendChild(hintSpan);
                lines = hintSpan.offsetHeight / (parseFloat(getComputedStyle(hintSpan).lineHeight) || 1);
            }
        });

        hintsContainer.className = `hints-inline lines-${Math.round(lines)}`;

        if (hintIndex < hints.length - 1) {
            const guessesUntilNextHint = 5 - (guessCount % 5);
            countdownElement.textContent = guessesUntilNextHint;
            hintCountdown.style.display = "block";
        } else {
            hintCountdown.style.display = "none";
        }
    }

    function handleGuess(guess) {
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored due to state:", { isProcessingGuess, gameOver });
            return;
        }

        isProcessingGuess = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;

        guess = guess.toUpperCase();
        guesses.push(guess);
        guessCount++;
        firstGuessMade = true;

        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}`;
        }

        if (guess === secretWord) {
            console.log("Correct guess!");
            score = guessCount;
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
            guessInput.disabled = false;
            guessBtn.disabled = false;
            return;
        }

        const guessContainer = document.getElementById("guess-input-container");
        guessContainer.classList.add("wrong-guess");

        guessInput.style.opacity = "0";
        guessInput.style.visibility = "hidden";

        animationTimeout = setTimeout(() => {
            guessInput.value = "";
            guessInput.style.opacity = "1";
            guessInput.style.visibility = "visible";
            guessInput.style.color = "#000000";

            if (guessCount % 5 === 0 && hintIndex < hints.length - 1) {
                hintIndex++;
            }
            updateHintDisplay();

            guessInput.disabled = false;
            guessBtn.disabled = false;
            isProcessingGuess = false;
            guessInput.focus();
            activeInput = guessInput;
        }, 350);
    }

    function startPineappleRain() {
        console.log("Starting pineapple rain animation");
        const rainContainer = document.createElement("div");
        rainContainer.className = "pineapple-rain";
        document.body.appendChild(rainContainer);

        function createWave(waveNumber) {
            const pieces = Array(50).fill("🍍");
            pieces.forEach(() => {
                const piece = document.createElement("div");
                piece.className = "pineapple-piece";
                piece.textContent = "🍍";
                piece.style.left = `${Math.random() * 100}vw`;
                piece.style.animationDuration = `${Math.random() * 2 + 2}s`; // Slower: 3-4s instead of 1-3s
                piece.style.fontSize = `${Math.random() * 2 + 1}vh`;
                piece.style.animationDelay = `${waveNumber * 0.75}s`; // Reduced delay for overlap (was 1.5s)
                rainContainer.appendChild(piece);
            });
        }

        // Create three waves
        for (let i = 0; i < 3; i++) {
            createWave(i);
        }

        setTimeout(() => {
            rainContainer.remove();
            console.log("Pineapple rain animation ended");
        }, 9000); // Increased to 9s to allow final wave to fall off-screen (3s max fall + 2 * 0.75s delays + buffer)
    }

    function endGame(won = false, gaveUp = false) {
        console.log("Game ended", { won, gaveUp, guessCount, secretWord });
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;
        const keyboard = document.getElementById("keyboard-container");
        if (keyboard) keyboard.style.display = "none";

        if (won) {
            startPineappleRain();
        }

        const todaysWord = document.getElementById("todays-word");
        if (todaysWord) todaysWord.textContent = secretWord;

        const shareText = document.getElementById("share-text");
        let shareMessage;
        if (gaveUp) {
            shareMessage = `Play WORDY`;
        } else {
            shareMessage = `${currentGameNumber}\nI solved WORDY in\n<span class="guess-count">${guessCount}</span>\n${guessCount === 1 ? 'guess' : 'guesses'}`;
        }
        if (shareText) shareText.innerHTML = shareMessage;

        const shareWhatsapp = document.getElementById("share-whatsapp");
        const shareTelegram = document.getElementById("share-telegram");
        const shareTwitter = document.getElementById("share-twitter");

        const shareUrl = encodeURIComponent(window.location.href);
        const shareTextEncoded = encodeURIComponent(shareMessage.replace(/<[^>]+>/g, ''));

        if (shareWhatsapp) {
            shareWhatsapp.href = `https://wa.me/?text=${shareTextEncoded}%20${shareUrl}`;
        }
        if (shareTelegram) {
            shareTelegram.href = `https://t.me/share/url?url=${shareUrl}&text=${shareTextEncoded}`;
        }
        if (shareTwitter) {
            shareTwitter.href = `https://twitter.com/intent/tweet?text=${shareTextEncoded}&url=${shareUrl}`;
        }

        resetScreenDisplays();
        gameOverScreen.style.display = "flex";
        adjustBackground();
    }

    async function loadGame(game, isPrivate = false) {
        console.log("Loading game:", game, { isPrivate });
        gameOver = false;
        guessCount = 0;
        gaveUp = false;
        guesses = [];
        hintIndex = 0;
        isProcessingGuess = false;
        score = 0;
        firstGuessMade = false;

        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"],
            game["Hint 2"],
            game["Hint 3"],
            game["Hint 4"],
            game["Hint 5"]
        ].filter(hint => hint).map(hint => hint.toUpperCase());

        const gameNumberDisplay = document.querySelectorAll(".game-number-display");
        const newGameNumberDisplay = document.getElementById("new-game-number-display");
        currentGameNumber = isPrivate ? `${game["Game Number"]} - Private` : `Game #${game["Game Number"]}`;
        gameNumberDisplay.forEach(display => {
            if (display) display.textContent = currentGameNumber;
        });
        if (newGameNumberDisplay) {
            newGameNumberDisplay.textContent = currentGameNumber;
        }

        const gameType = isPrivate ? "privatePineapple" : "pineapple";
        const result = getGameResult(gameType, isPrivate ? game["Game Number"] : `Game #${game["Game Number"]}`);
        if (result) {
            console.log("Game already played:", result);
            guesses = result.result !== "Gave Up" ? Array(parseInt(result.result)).fill("") : [];
            guessCount = guesses.length;
            gaveUp = result.result === "Gave Up";
            gameOver = true;
            endGame(result.result !== "Gave Up", gaveUp);
            return;
        }

        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
            guessInput.focus();
            activeInput = guessInput;
        }

        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}`;
        }

        updateHintDisplay();

        let gameList = isPrivate ? privateGames : allGames;
        let currentIndex = gameList.findIndex(g => g["Game Number"] === game["Game Number"]);
        updateArrowStates(currentIndex, gameList);

        setupKeyboardListeners();
    }

    // Initial setup
    await fetchOfficialGames();
    await fetchPrivateGames();

    if (allGames.length > 0) {
        loadGame(allGames[0]);
        resetScreenDisplays();
        gameScreen.style.display = "flex";
        adjustBackground();
    } else {
        console.error("No official games available to load");
        showGameSelectScreen();
    }
});