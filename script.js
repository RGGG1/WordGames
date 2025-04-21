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

    const guessInput = document.getElementById("guess-input");

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
    } else {
        console.error("guess-input not found in DOM");
    }

    if (guessBtn) {
        guessBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guess button clicked:", { gameOver, disabled: guessInput.disabled, isProcessingGuess });
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Guess submitted via button:", guess);
                    handleGuess(guess);
                }
            }
        });
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
        input.addEventListener("click", () => {
            activeInput = input;
            console.log("Form input selected:", input.id);
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
        const keys = document.querySelectorAll("#keyboard-container .key, #form-keyboard-container .key");
        keys.forEach(key => {
            // Remove existing listeners to prevent stacking
            key.removeEventListener("click", key._clickHandler);
            const clickHandler = debounce(() => {
                if (gameOver || (activeInput && activeInput.disabled) || isProcessingGuess) return;
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
                    if (activeInput) {
                        activeInput.value = activeInput.value.slice(0, -1);
                    }
                } else {
                    if (activeInput) {
                        activeInput.value += keyValue;
                    }
                }
                if (activeInput) activeInput.focus();
            }, 100);
            key._clickHandler = clickHandler;
            key.addEventListener("click", clickHandler);
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
            displayGameList();
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
            displayGameList();
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
            displayGameList();
            adjustBackground();
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
            displayGameList();
            adjustBackground();
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
            displayGameList();
            adjustBackground();
        });
    }

    if (officialBackBtn) {
        officialBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Official Back button clicked");
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            adjustBackground();
        });
    }

    if (privateBackBtn) {
        privateBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Private Back button clicked");
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            adjustBackground();
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
                await fetchPrivateGames();
                displayGameList();
                adjustBackground();
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
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
        });
    }

    if (guessesScreen && guessesCloseBtn) {
        guessesCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button clicked");
            guessesScreen.style.display = "none";
            gameScreen.style.display = "flex";
        });

        document.addEventListener("click", (e) => {
            if (guessesScreen.style.display === "flex" && 
                !guessesScreen.contains(e.target) && 
                e.target !== guessesLink) {
                console.log("Clicked outside guesses screen");
                guessesScreen.style.display = "none";
                gameScreen.style.display = "flex";
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
        });

        giveUpDialog.addEventListener("click", (e) => {
            if (e.target === giveUpDialog) {
                console.log("Clicked outside give-up dialog");
                giveUpDialog.style.display = "none";
                gameScreen.style.display = "flex";
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
            } else {
                guessesList.innerHTML = guesses.length > 0 
                    ? guesses.join(' <span class="separator yellow">|</span>   ')
                    : "No guesses yet!";
                guessesScreen.style.display = "flex";
                console.log("Guesses screen displayed, content:", guessesList.innerHTML);
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
        displayGameList();
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
            updateHintCountdown();
            adjustBackground();
            setupEventListeners();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
        } catch (error) {
            console.error("Error fetching official games:", error);
            allGames = [
                { "Game Number": "1", "Secret Word": "TEST", "Hint 1": "SAMPLE", "Hint 2": "WORD", "Hint 3": "GAME", "Hint 4": "PLAY", "Hint 5": "FUN", "Background": "" }
            ];
            console.log("Using hardcoded game:", allGames);
            loadGame(allGames[0]);
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            if (createForm) createForm.style.display = "none";
            updateHintCountdown();
            adjustBackground();
            setupEventListeners();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
            alert("Failed to load official games data. Using hardcoded game.");
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
            if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log("Private CSV fetched, length:", text.length);

            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            privateGames = parsed.data
                .filter(game => game["Game Name"] && game["Secret Word"])
                .map((game, index) => ({
                    ...game,
                    "Game Number": String(index + 1),
                    "Display Name": `Game #${index + 1} - ${game["Game Name"]}`
                }))
                .sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            console.log("Parsed private games:", privateGames);
        } catch (error) {
            console.error("Error fetching private games:", error);
            privateGames = [];
        }
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
                    const guesses = pastResult ? (pastResult.guesses !== "Gave Up" ? pastResult.guesses : "Gave Up") : "-";
                    const showSecretWord = pastResult && (pastResult.guesses === "Gave Up" || pastResult.secretWord === secretWord);
                    const displayWord = showSecretWord ? secretWord : "Play Now";

                    const gameItem = document.createElement("div");
                    gameItem.className = "game-list-row";
                    gameItem.innerHTML = `
                        <span>${gameNumber}</span>
                        <span class="${displayWord === 'Play Now' ? 'play-now' : ''}">${displayWord}</span>
                        <span>${guesses}</span>
                    `;
                    gameItem.addEventListener("click", () => {
                        console.log("Clicked official game:", game);
                        loadGame(game);
                        resetScreenDisplays();
                        gameScreen.style.display = "flex";
                        adjustBackground();
                        const currentIndex = allGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                        updateArrowStates(currentIndex, allGames);
                    });
                    officialList.appendChild(gameItem);
                    console.log(`Rendered official game ${gameNumber}: ${secretWord}, Guesses: ${guesses}`);
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
                    console.log(`Checking private game ${gameNumber}: pastResult=`, pastResult, `secretWord=`, secretWord);
                    const guesses = pastResult ? (pastResult.guesses !== "Gave Up" ? pastResult.guesses : "Gave Up") : "-";
                    const showSecretWord = pastResult && (pastResult.guesses === "Gave Up" || pastResult.secretWord === secretWord);
                    const displayWord = showSecretWord ? secretWord : "Play Now";

                    const gameItem = document.createElement("div");
                    gameItem.className = "game-list-row";
                    gameItem.innerHTML = `
                        <span>${gameName}</span>
                        <span class="${displayWord === 'Play Now' ? 'play-now' : ''}">${displayWord}</span>
                        <span>${guesses}</span>
                    `;
                    gameItem.addEventListener("click", () => {
                        console.log("Clicked private game:", game);
                        loadGame(game);
                        resetScreenDisplays();
                        gameScreen.style.display = "flex";
                        adjustBackground();
                        const currentIndex = privateGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                        updateArrowStates(currentIndex, privateGames);
                    });
                    privateList.appendChild(gameItem);
                    console.log(`Rendered private game ${gameNumber}: ${gameName}, Secret Word: ${displayWord}, Guesses: ${guesses}`);
                });
            }
        }
    }

    function setupEventListeners() {
        const gameControls = document.getElementById("game-controls");

        document.addEventListener("click", (e) => {
            if (!gameOver && gameScreen.style.display === "flex" &&
                !gameControls?.contains(e.target) &&
                !e.target.closest("button") &&
                e.target.id !== "game-name" &&
                e.target !== guessInput) {
            }
        });

        document.querySelectorAll("#game-name").forEach(name => {
            name.addEventListener("click", () => {
                resetGame();
                loadGame(allGames[0]);
                resetScreenDisplays();
                gameScreen.style.display = "flex";
                adjustBackground();
                updateArrowStates(0, allGames);
            });
        });

        guessInput.addEventListener("focus", () => {
            console.log("Guess input focused");
            activeInput = guessInput;
        });
    }

    function updateHintCountdown() {
        const countdownElement = document.querySelector(".hint-countdown");
        if (!countdownElement) {
            console.error("hint-countdown element not found");
            return;
        }
        if (hintIndex >= hints.length) {
            countdownElement.textContent = "(All hints have been revealed)";
            countdownElement.style.display = "block";
        } else {
            const guessesUntilNextHint = guessCount === 0 ? 5 : 5 - (guessCount % 5);
            countdownElement.style.display = "block";
            countdownElement.textContent = `(next hint revealed in ${guessesUntilNextHint} guesses)`;
        }
        console.log("Updated hint countdown:", countdownElement.textContent);
    }

    function calculateHintLines(hintsArray) {
        const tempContainer = document.createElement("div");
        tempContainer.style.fontSize = "3.25vh";
        tempContainer.style.fontFamily = "'Luckiest Guy', cursive";
        tempContainer.style.position = "absolute";
        tempContainer.style.visibility = "hidden";
        tempContainer.style.maxWidth = "82.5vw";
        tempContainer.style.whiteSpace = "normal";
        tempContainer.style.lineHeight = "1.2";
        tempContainer.style.display = "inline-block";
        tempContainer.style.wordBreak = "break-word";
        tempContainer.textContent = hintsArray.join(" | ");
        document.body.appendChild(tempContainer);
        
        const height = tempContainer.offsetHeight;
        const lineHeight = 3.25 * 1.2;
        const lines = Math.ceil(height / lineHeight);
        
        document.body.removeChild(tempContainer);
        return lines;
    }

    function updateHintFade(hintsContainer, visibleHints) {
        const lines = calculateHintLines(visibleHints);
        hintsContainer.classList.remove('lines-1', 'lines-2');
        if (lines === 1) {
            hintsContainer.classList.add('lines-1');
        } else if (lines >= 2) {
            hintsContainer.classList.add('lines-2');
        }
    }

    function buildHintHTML(hintsArray) {
        if (hintsArray.length === 0) return "";
        
        const htmlParts = [];
        hintsArray.forEach((hint, index) => {
            htmlParts.push(hint);
            if (index < hintsArray.length - 1) {
                htmlParts.push(' <span class="separator yellow">|</span> ');
            }
        });
        
        return htmlParts.join("");
    }

    function setupHints() {
        const hintsContainer = document.getElementById("hints-container");
        if (!hintsContainer) {
            console.error("hints-container element not found");
            return;
        }
        console.log("Setting up hints:", hints, "hintIndex:", hintIndex);
        hintsContainer.innerHTML = "";
        const visibleHints = hints.slice(0, hintIndex + 1);
        if (visibleHints.length > 0) {
            hintsContainer.innerHTML = buildHintHTML(visibleHints);
            hintsContainer.style.display = "block";
            updateHintFade(hintsContainer, visibleHints);
            console.log("Hints displayed:", visibleHints);
        } else {
            hintsContainer.style.display = "block";
            hintsContainer.classList.add('lines-0');
            console.log("No hints to display yet, reserving space");
        }
    }

    function adjustBackground() {
        console.log("Adjusting background for screens");
        const screens = [gameScreen, gameOverScreen, gameSelectScreen, createForm];
        screens.forEach(screen => {
            if (screen && screen.style.display === "flex") {
                screen.style.height = "100vh";
                screen.style.width = "100vw";
                screen.style.backgroundSize = "100% 100%";
                screen.offsetHeight;
                console.log(`Adjusted background for ${screen.id}`);
            }
        });
        window.dispatchEvent(new Event('resize'));
    }

    window.addEventListener("resize", adjustBackground);

    function revealHint() {
        hintIndex++;
        console.log("Revealing hint, new hintIndex:", hintIndex, "total hints:", hints.length);
        if (hintIndex < hints.length) {
            const hintsContainer = document.getElementById("hints-container");
            if (!hintsContainer) {
                console.error("hints-container element not found in revealHint");
                return;
            }
            const visibleHints = hints.slice(0, hintIndex);
            const newHint = hints[hintIndex];
            hintsContainer.innerHTML = buildHintHTML(visibleHints);
            hintsContainer.style.display = "block";

            const hintSpan = document.createElement("span");
            hintSpan.className = "hint-text";
            hintSpan.textContent = "";
            hintsContainer.appendChild(hintSpan);

            let charIndex = 0;
            function typeLetter() {
                if (charIndex < newHint.length) {
                    hintSpan.textContent += newHint[charIndex];
                    charIndex++;
                    setTimeout(typeLetter, 100);
                } else {
                    hintsContainer.innerHTML = buildHintHTML(hints.slice(0, hintIndex + 1));
                    updateHintFade(hintsContainer, hints.slice(0, hintIndex + 1));
                    console.log("Revealed hint:", newHint);
                }
            }
            typeLetter();
            console.log("Revealing hint:", newHint);
        }
        updateHintCountdown();
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
            score = calculateScore();
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
            }, 350);

            if (guessCount % 5 === 0 && hintIndex < hints.length - 1) {
                revealHint();
            } else {
                updateHintCountdown();
            }
        }
    }

    function calculateScore() {
        console.log("Calculating score, guessCount:", guessCount);
        if (guessCount <= 1) return 100;
        if (guessCount <= 3) return 80;
        if (guessCount <= 5) return 60;
        if (guessCount <= 7) return 40;
        if (guessCount <= 10) return 20;
        return 10;
    }

    function saveGameResult(gameType, gameNumber, secretWord, guesses) {
        console.log("Saving game result", { gameType, gameNumber, secretWord, guesses });
        const resultsKey = gameType === "pineapple" ? "pineappleResults" : "privatePineappleResults";
        const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
        results[gameNumber] = { secretWord, guesses };
        localStorage.setItem(resultsKey, JSON.stringify(results));
        console.log("Game result saved:", results);
    }

    function endGame(won, gaveUp = false) {
        console.log("Ending game", { won, gaveUp, score, guessCount, secretWord });
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;

        resetScreenDisplays();
        gameOverScreen.style.display = "flex";
        adjustBackground();

        const todaysWord = document.getElementById("todays-word");
        const shareScore = document.getElementById("share-score");
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");

        if (todaysWord) todaysWord.textContent = secretWord;
        if (shareScore) shareScore.textContent = gaveUp ? "Gave Up" : score.toString();
        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }

        let shareMessage = `Wordy ${currentGameNumber}\n`;
        if (gaveUp) {
            shareMessage += `I gave up after ${guessCount} guesses 😔\n`;
        } else {
            shareMessage += `Score: ${score}/100 in ${guessCount} guesses 🎉\n`;
        }
        shareMessage += `Secret Word: ${secretWord}\n`;
        shareMessage += "Play at: https://wordy.bigbraingames.net";

        if (shareText) {
            shareText.innerHTML = shareMessage.replace(/\n/g, "<br>");
        }

        const shareButtons = {
            whatsapp: document.getElementById("share-whatsapp"),
            telegram: document.getElementById("share-telegram"),
            twitter: document.getElementById("share-twitter")
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

        if (won) {
            startPineappleRain();
        }
    }

    function startPineappleRain() {
        console.log("Starting pineapple rain animation");
        const rainContainer = document.createElement("div");
        rainContainer.className = "pineapple-rain";
        document.body.appendChild(rainContainer);

        const pieces = Array(30).fill("🍍");
        pieces.forEach(() => {
            const piece = document.createElement("div");
            piece.className = "pineapple-piece";
            piece.textContent = "🍍";
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.animationDuration = `${Math.random() * 2 + 1}s`;
            piece.style.fontSize = `${Math.random() * 2 + 1}vh`;
            rainContainer.appendChild(piece);
        });

        setTimeout(() => {
            rainContainer.remove();
            console.log("Pineapple rain animation ended");
        }, 3000);
    }

    function resetGame() {
        console.log("Resetting game state");
        score = 0;
        gameOver = false;
        secretWord = "";
        hints = [];
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        gaveUp = false;
        guesses = [];
        isProcessingGuess = false;
        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
            guessInput.focus();
        }
        if (guessBtn) {
            guessBtn.disabled = false;
        }
        if (guessesLink) guessesLink.textContent = "Guesses: 0";
        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) {
            hintsContainer.innerHTML = "";
            hintsContainer.style.display = "block";
            hintsContainer.classList.add('lines-0');
        }
        updateHintCountdown();
    }

    function loadGame(game) {
        console.log("Loading game:", game);
        resetGame();
        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"]?.toUpperCase() || "",
            game["Hint 2"]?.toUpperCase() || "",
            game["Hint 3"]?.toUpperCase() || "",
            game["Hint 4"]?.toUpperCase() || "",
            game["Hint 5"]?.toUpperCase() || ""
        ].filter(hint => hint);
        console.log("Loaded hints:", hints);

        currentGameNumber = game["Display Name"] || `Game #${game["Game Number"]}${game["Game Name"] ? " - Private" : ""}`;
        const gameNumberDisplay = document.getElementById("game-number-display");
        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }

        const background = game["Background"] || defaultBackground;
        [gameScreen, gameOverScreen, gameSelectScreen, createForm].forEach(screen => {
            if (screen) {
                screen.style.backgroundImage = `url('${background}')`;
                screen.style.backgroundSize = "100% 100%";
            }
        });

        setupHints();
        updateHintCountdown();

        if (guessInput) {
            guessInput.disabled = false;
            guessInput.readOnly = true;
            guessInput.focus();
            activeInput = guessInput;
        }
        if (guessBtn) {
            guessBtn.disabled = false;
            guessBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Guess button clicked:", { gameOver, disabled: guessInput.disabled, isProcessingGuess });
                if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                    const guess = guessInput.value.trim().toUpperCase();
                    if (guess) {
                        console.log("Guess submitted via button:", guess);
                        handleGuess(guess);
                    }
                }
            };
        }

        setupKeyboardListeners();
    }

    await fetchGameData();
    await fetchPrivateGames();
    displayGameList();
});