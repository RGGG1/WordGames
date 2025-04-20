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
    let guesses = [];
    let animationTimeout = null;

    const gameScreen = document.getElementById("game-screen");
    const gameOverScreen = document.getElementById("game-over");
    const gameSelectScreen = document.getElementById("game-select-screen");
    const allGamesBtn = document.getElementById("all-games-btn");
    const homeBtn = document.getElementById("home-btn");
    const createPineappleBtn = document.getElementById("create-pineapple");
    const createForm = document.getElementById("create-form");
    const confirmBtn = document.getElementById("confirm-btn");
    const formBackBtn = document.getElementById("form-back-btn");
    const createPineappleLink = document.getElementById("create-pineapple-end");
    const guessBtn = document.getElementById("guess-btn");
    const guessesBtn = document.getElementById("guesses-btn");
    const guessesScreen = document.getElementById("guesses-screen");
    const guessesCloseBtn = document.getElementById("guesses-close-btn");
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const nextGameBtnEnd = document.getElementById("next-game-btn-end");
    const officialBackBtn = document.getElementById("official-back-btn");

    const officialTab = document.getElementById("official-tab");
    const privateTab = document.getElementById("private-tab");
    const officialContent = document.getElementById("official-games");
    const privateContent = document.getElementById("private-games");

    const officialUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiz6IVPR4cZB9JlbNPC1Km5Jls5wsW3i-G9WYLppmnfPDz2kxb0I-g1BY50wFzuJ0aYgYdyub6VpCd/pub?output=csv";
    const privateUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIMKVHVz5EaVdJ5YfZJwLW72R9aI1Si9p-LX7kc__5-iAMaXz2itGmffgHu0b05_IRvFFAadH64Z-M/pub?output=csv";
    const webAppUrl = "https://script.google.com/macros/s/AKfycbyFVSK9mHruHEaX_ImhUobprQczd3JOQWQ9QzK9qwN0kgaAtOLZ_wk2u8HkGifd8oS15w/exec";

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (hamburgerBtn) {
        console.log("Hamburger button found:", hamburgerBtn);
    }

    const input = document.getElementById("guess-input");
    if (input) {
        input.addEventListener("keydown", (e) => {
            console.log("Keydown event:", e.key, { gameOver, disabled: input.disabled, isProcessingGuess });
            if ((e.key === "Enter" || e.key === "NumpadEnter") && !gameOver && !input.disabled && !isProcessingGuess) {
                e.preventDefault();
                const guess = input.value.trim().toUpperCase();
                if (guess) {
                    console.log("Guess submitted via Enter:", guess);
                    handleGuess(guess);
                }
            }
        });

        input.addEventListener("input", (e) => {
            console.log("Input value changed:", input.value);
            if (animationTimeout) {
                clearTimeout(animationTimeout);
                animationTimeout = null;
                const guessContainer = document.getElementById("guess-input-container");
                guessContainer.classList.remove("wrong-guess");
                input.style.opacity = "1";
                input.style.visibility = "visible";
                input.style.color = "#000000";
                input.value = e.target.value;
                isProcessingGuess = false; // Reset the flag to allow new guesses
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
            console.log("Guess button clicked:", { gameOver, disabled: input.disabled, isProcessingGuess });
            if (!gameOver && !input.disabled && !isProcessingGuess) {
                const guess = input.value.trim().toUpperCase();
                if (guess) {
                    console.log("Guess submitted via button:", guess);
                    handleGuess(guess);
                }
            }
        });
    } else {
        console.error("guess-btn not found in DOM");
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

    if (allGamesBtn) {
        allGamesBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("All Games button clicked");
            showGameSelectScreen();
        });
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
            createForm.style.display = "flex";
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
            keepKeyboardOpen();
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

            // Require all hints to be filled
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
            adjustBackground();
            keepKeyboardOpen();
        });
    }

    if (guessesBtn && guessesScreen && guessesCloseBtn) {
        guessesBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses button clicked");
            const guessesList = document.getElementById("guesses-list");
            console.log("Current guesses array:", guesses);
            if (guessesScreen.style.display === "flex") {
                guessesScreen.style.display = "none";
                gameScreen.style.display = "flex";
                keepKeyboardOpen();
            } else {
                guessesList.innerHTML = guesses.length > 0 
                    ? guesses.join(' <span class="separator">|</span>   ')
                    : "No guesses yet!";
                guessesScreen.style.display = "flex";
                console.log("Guesses screen displayed, content:", guessesList.innerHTML);
            }
        });

        guessesCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button clicked");
            guessesScreen.style.display = "none";
            gameScreen.style.display = "flex";
            keepKeyboardOpen();
        });

        document.addEventListener("click", (e) => {
            if (guessesScreen.style.display === "flex" && 
                !guessesScreen.contains(e.target) && 
                e.target !== guessesBtn) {
                console.log("Clicked outside guesses screen");
                guessesScreen.style.display = "none";
                gameScreen.style.display = "flex";
                keepKeyboardOpen();
            }
        });
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
            console.log("Official CSV fetched:", text);
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
            updateHintCountdown();
            adjustBackground();
            setupEventListeners();
            if (isMobile) keepKeyboardOpen();
        } catch (error) {
            console.error("Error fetching official games:", error);
            allGames = [
                { "Game Number": "1", "Secret Word": "TEST", "Hint 1": "SAMPLE", "Hint 2": "WORD", "Hint 3": "GAME", "Hint 4": "PLAY", "Hint 5": "FUN" }
            ];
            console.log("Using hardcoded game:", allGames);
            loadGame(allGames[0]);
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            updateHintCountdown();
            adjustBackground();
            setupEventListeners();
            if (isMobile) keepKeyboardOpen();
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
            console.log("Private CSV fetched:", text);

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
                        keepKeyboardOpen();
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
                        keepKeyboardOpen();
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
                !gameControls.contains(e.target) &&
                !e.target.closest("button") &&
                e.target.id !== "game-name" &&
                e.target !== input) {
                keepKeyboardOpen();
            }
        });

        document.querySelectorAll("#game-name").forEach(name => {
            name.addEventListener("click", () => {
                resetGame();
                loadGame(allGames[0]);
                resetScreenDisplays();
                gameScreen.style.display = "flex";
                adjustBackground();
                keepKeyboardOpen();
            });
        });

        const giveUpBtn = document.getElementById("give-up-btn");
        if (giveUpBtn) {
            giveUpBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
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
                endGame(false, true);
            });
        }

        const prevGameBtn = document.getElementById("prev-game-btn");
        const nextGameBtn = document.getElementById("next-game-btn");

        if (prevGameBtn) {
            prevGameBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Previous game button clicked, currentGameNumber:", currentGameNumber);
                let currentIndex;
                let gameList;
                if (currentGameNumber.includes("- Private")) {
                    const currentNum = parseInt(currentGameNumber.split(" - ")[0]);
                    currentIndex = privateGames.findIndex(game => game["Game Number"] === String(currentNum));
                    gameList = privateGames;
                } else {
                    currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber.replace("Game #", ""));
                    gameList = allGames;
                }
                if (currentIndex < gameList.length - 1) {
                    loadGame(gameList[currentIndex + 1]);
                    console.log("Loading previous game, new index:", currentIndex + 1);
                }
                keepKeyboardOpen();
            });
        }

        if (nextGameBtn) {
            nextGameBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Next game button clicked, currentGameNumber:", currentGameNumber);
                let currentIndex;
                let gameList;
                if (currentGameNumber.includes("- Private")) {
                    const currentNum = parseInt(currentGameNumber.split(" - ")[0]);
                    currentIndex = privateGames.findIndex(game => game["Game Number"] === String(currentNum));
                    gameList = privateGames;
                } else {
                    currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber.replace("Game #", ""));
                    gameList = allGames;
                }
                if (currentIndex > 0) {
                    loadGame(gameList[currentIndex - 1]);
                    console.log("Loading next game, new index:", currentIndex - 1);
                }
                keepKeyboardOpen();
            });
        }

        input.addEventListener("focus", () => {
            console.log("Input focused");
        });
    }

    function keepKeyboardOpen() {
        if (!gameOver && gameScreen.style.display === "flex" && input && !input.disabled) {
            if (document.activeElement !== input) {
                input.focus();
                console.log("Input focused via keepKeyboardOpen");
            }
        }
    }

    function updateHintCountdown() {
        const countdownElement = document.querySelector(".hint-countdown");
        const countdownSpan = document.getElementById("countdown");
        if (!countdownElement || !countdownSpan) {
            console.error("hint-countdown or countdown span element not found");
            return;
        }
        if (hintIndex >= hints.length) {
            countdownElement.style.display = "none";
        } else {
            const guessesUntilNextHint = guessCount === 0 ? 10 : 10 - (guessCount % 10);
            countdownElement.style.display = "block";
            countdownSpan.textContent = guessesUntilNextHint;
            console.log("Updated hint countdown:", countdownSpan.textContent);
        }
    }

    function setupHints() {
        // Target the individual hint containers
        const hintElements = [
            document.getElementById("hint-1")?.querySelector("span"),
            document.getElementById("hint-2")?.querySelector("span"),
            document.getElementById("hint-3")?.querySelector("span"),
            document.getElementById("hint-4")?.querySelector("span"),
            document.getElementById("hint-5")?.querySelector("span")
        ].filter(Boolean);
        console.log("Hint elements found:", hintElements);
        console.log("Hints array:", hints);
        hintElements.forEach((span, index) => {
            if (span) {
                const hintContainer = span.parentElement;
                span.textContent = hints[index] || "";
                hintContainer.style.display = index <= hintIndex ? "block" : "none";
                console.log(`Hint ${index + 1} set to: "${span.textContent}", display: ${hintContainer.style.display}`);
            } else {
                console.error(`Hint element ${index + 1} not found`);
            }
        });
    }

    function adjustBackground() {
        const screens = [gameScreen, gameOverScreen, gameSelectScreen];
        screens.forEach(screen => {
            if (screen && screen.style.display === "flex") {
                screen.style.height = "100vh";
            }
        });
    }

    window.addEventListener("resize", adjustBackground);

    function revealHint() {
        hintIndex++;
        const hintElements = [
            document.getElementById("hint-1"),
            document.getElementById("hint-2"),
            document.getElementById("hint-3"),
            document.getElementById("hint-4"),
            document.getElementById("hint-5")
        ].filter(Boolean);
        console.log("Revealing hint, hintIndex:", hintIndex, "total hints:", hintElements.length);
        if (hintIndex < hintElements.length) {
            const hintContainer = hintElements[hintIndex];
            const hintSpan = hintContainer.querySelector("span");
            if (hintSpan && hints[hintIndex]) {
                hintContainer.style.display = "block";
                hintSpan.textContent = "";
                const hintText = hints[hintIndex];
                let charIndex = 0;

                function typeLetter() {
                    if (charIndex < hintText.length) {
                        hintSpan.textContent += hintText[charIndex];
                        charIndex++;
                        setTimeout(typeLetter, 100);
                    }
                }

                typeLetter();
            }
        }
        updateHintCountdown();
    }

    function rainPineapples() {
        const pineappleContainer = document.createElement("div");
        pineappleContainer.className = "pineapple-rain";
        document.body.appendChild(pineappleContainer);

        function createPineappleWave(startDelay) {
            for (let i = 0; i < 50; i++) {
                const pineapple = document.createElement("div");
                pineapple.className = "pineapple-piece";
                pineapple.textContent = "🍍";
                pineapple.style.left = `${Math.random() * 100}vw`;
                pineapple.style.fontSize = `${Math.random() * 20 + 10}px`;
                pineapple.style.transform = `rotate(${Math.random() * 360}deg)`;
                const duration = Math.random() * 2 + 2;
                pineapple.style.animationDuration = `${duration}s`;
                pineapple.style.animationDelay = `${startDelay + Math.random() * 0.5}s`;
                pineappleContainer.appendChild(pineapple);

                setTimeout(() => {
                    pineapple.remove();
                }, (duration + startDelay + 0.5) * 1000);
            }
        }

        createPineappleWave(0);
        createPineappleWave(0.875);
        createPineappleWave(1.75);

        setTimeout(() => {
            pineappleContainer.remove();
        }, 6625);
    }

    function handleGuess(guess) {
        if (isProcessingGuess) {
            console.log("Guess ignored: still processing previous guess");
            return;
        }
        isProcessingGuess = true;

        const guessDisplay = document.getElementById("guess-input");
        const guessContainer = document.getElementById("guess-input-container");
        if (!guessDisplay || !guessContainer) {
            console.error("Required elements for handleGuess not found");
            isProcessingGuess = false;
            return;
        }

        guessDisplay.value = guess;
        guessContainer.classList.remove("wrong-guess");
        guessDisplay.style.opacity = "1";
        guessDisplay.style.visibility = "visible";
        guessDisplay.style.color = "#000000";

        // Clear any existing animation timeout
        if (animationTimeout) {
            clearTimeout(animationTimeout);
            animationTimeout = null;
        }

        if (!firstGuessMade) {
            firstGuessMade = true;
            adjustHintsAfterGuess();
        }

        const upperGuess = guess.toUpperCase();
        const isRepeatGuess = guesses.includes(upperGuess);

        if (!isRepeatGuess) {
            guesses.push(upperGuess);
            guessCount++;
            score = guessCount;
            const guessesBtnElement = document.getElementById("guesses-btn");
            if (guessesBtnElement) {
                guessesBtnElement.textContent = `Guesses: ${guessCount}`;
            }
            console.log("Guess processed:", { guessCount, score });

            if (guessCount % 10 === 0 && hintIndex < hints.length - 1) revealHint();
            else updateHintCountdown();
        } else {
            console.log("Repeat guess:", upperGuess);
            updateHintCountdown();
        }

        if (upperGuess === secretWord) {
            gameOver = true;
            let originalGameNumber = currentGameNumber.includes("- Private")
                ? privateGames.find(game => game["Game Number"] === currentGameNumber.split(" - ")[0])?.["Game Number"] || currentGameNumber
                : currentGameNumber.replace("Game #", "");
            const gameType = currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple";
            saveGameResult(gameType, originalGameNumber, secretWord, score);
            endGame(true);
            rainPineapples();
            isProcessingGuess = false; // Ensure flag is reset on game over
        } else {
            guessContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessContainer.classList.remove("wrong-guess");
                guessDisplay.value = "";
                guessDisplay.focus();
                isProcessingGuess = false;
                animationTimeout = null; // Clear the timeout reference
            }, 350);
        }
    }

    function adjustHintsAfterGuess() {
        const hintElements = [
            document.getElementById("hint-1"),
            document.getElementById("hint-2"),
            document.getElementById("hint-3"),
            document.getElementById("hint-4"),
            document.getElementById("hint-5")
        ].filter(Boolean);
        hintElements.forEach((hintContainer, index) => {
            if (hintContainer) {
                hintContainer.style.display = index <= hintIndex ? "block" : "none";
                console.log(`Adjusted hint ${index + 1} display: ${hintContainer.style.display}`);
            }
        });
    }

    function saveGameResult(gameType, gameNumber, secretWord, guesses) {
        const key = gameType + "Results";
        const results = JSON.parse(localStorage.getItem(key) || "{}");
        results[gameNumber] = { secretWord, guesses };
        localStorage.setItem(key, JSON.stringify(results));
        console.log(`Saved ${gameType} result for game ${gameNumber}:`, results[gameNumber]);
        console.log(`Current ${key} in localStorage:`, JSON.parse(localStorage.getItem(key) || "{}"));
    }

    function endGame(won, gaveUp = false) {
        gameOver = true;
        const todaysWord = document.getElementById("todays-word");
        const gameNumberSpan = document.getElementById("game-number");
        const shareText = document.getElementById("share-text");
        const shareGameNumber = document.getElementById("share-game-number");
        const shareScoreLabel = document.getElementById("share-score-label");
        const shareScore = document.getElementById("share-score");
        const shareWhatsApp = document.getElementById("share-whatsapp");
        const shareTelegram = document.getElementById("share-telegram");
        const shareTwitter = document.getElementById("share-twitter");

        resetScreenDisplays();
        gameOverScreen.style.display = "flex";
        document.getElementById("guess-input").blur();

        gameNumberSpan.textContent = currentGameNumber;
        todaysWord.textContent = secretWord;

        const gameUrl = "https://pineapple-game.com";
        let shareMessage;
        if (won) {
            const guessText = score === 1 ? "guess" : "guesses";
            const displayGameNumber = currentGameNumber.includes("- Private") 
                ? `Game #${currentGameNumber}` 
                : `Game #${currentGameNumber.replace("Game #", "")}`;
            shareText.innerHTML = `<span class="small-game-number">${displayGameNumber}</span>\nI solved Wordy in\n<span class="big-score">${score}</span>\n${guessText}`;
            shareMessage = `I solved Wordy ${displayGameNumber} in ${score} ${guessText}! 🍍 Can you beat my score? Play at ${gameUrl}`;
            shareGameNumber.style.display = "none";
            shareScoreLabel.style.display = "none";
            shareScore.style.display = "none";
        } else if (gaveUp) {
            shareText.innerHTML = '<span class="big">PLAY WORDY</span>\n\n<span class="italic">The Big Brain Word Game</span>';
            shareGameNumber.textContent = currentGameNumber;
            shareScoreLabel.style.display = "none";
            shareScore.style.display = "none";
            shareMessage = `I tried Wordy ${currentGameNumber}! 🍍 Can you solve it? Play at ${gameUrl}`;
        } else {
            shareText.textContent = "I didn’t solve Wordy";
            shareGameNumber.textContent = currentGameNumber;
            shareScore.textContent = `${score}`;
            shareMessage = `I tried Wordy ${currentGameNumber} but didn't solve it. 🍍 Can you do better? Play at ${gameUrl}`;
        }

        shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(shareMessage)}`;
        shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;

        if (currentGameNumber.includes("Private")) {
            console.log("Private game ended, ensuring results are saved before display");
            setTimeout(async () => {
                await fetchPrivateGames();
                displayGameList();
            }, 100);
        }
        adjustBackground();
    }

    function resetGame() {
        score = 0;
        gameOver = false;
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        gaveUp = false;
        guesses = [];
        const guessesBtnElement = document.getElementById("guesses-btn");
        if (guessesBtnElement) {
            guessesBtnElement.textContent = "Guesses: 0";
        } else {
            console.error("guesses-btn element not found in resetGame");
        }
        const guessInput = document.getElementById("guess-input");
        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
            guessInput.style.opacity = "1";
            guessInput.style.visibility = "visible";
            console.log("resetGame: Input disabled set to false, visibility:", guessInput.style.visibility);
        }

        const guessBtnElement = document.getElementById("guess-btn");
        if (guessBtnElement) {
            guessBtnElement.style.opacity = "1";
            guessBtnElement.style.visibility = "visible";
            console.log("resetGame: Guess button visibility:", guessBtnElement.style.visibility);
        }

        const guessLine = document.getElementById("guess-line");
        if (guessLine) {
            guessLine.style.opacity = "1";
        }

        // Reset individual hint containers
        const hintElements = [
            document.getElementById("hint-1"),
            document.getElementById("hint-2"),
            document.getElementById("hint-3"),
            document.getElementById("hint-4"),
            document.getElementById("hint-5")
        ].filter(Boolean);
        hintElements.forEach((hintContainer, index) => {
            if (hintContainer) {
                const span = hintContainer.querySelector("span");
                if (span) {
                    span.textContent = hints[index] || "";
                }
                hintContainer.style.display = "none";
            }
        });

        updateHintCountdown();
    }

    function loadGame(game) {
        resetGame();
        currentGameNumber = game["Game Name"] ? `${game["Game Number"]} - Private` : `Game #${game["Game Number"]}`;
        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"]?.toUpperCase(),
            game["Hint 2"]?.toUpperCase(),
            game["Hint 3"]?.toUpperCase(),
            game["Hint 4"]?.toUpperCase(),
            game["Hint 5"]?.toUpperCase()
        ].filter(hint => hint);
        console.log("Loaded game:", { currentGameNumber, secretWord, hints });
        setupHints();
    }

    await fetchGameData();
    await fetchPrivateGames();
    displayGameList();
});