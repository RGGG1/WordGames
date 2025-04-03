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

    const gameScreen = document.getElementById("game-screen");
    const gameOverScreen = document.getElementById("game-over");
    const gameSelectScreen = document.getElementById("game-select-screen");
    const allGamesBtn = document.getElementById("all-games-btn");
    const homeBtn = document.getElementById("home-btn");
    const backBtn = document.getElementById("back-btn");
    const createPineappleBtn = document.getElementById("create-pineapple");
    const createForm = document.getElementById("create-form");
    const confirmBtn = document.getElementById("confirm-btn");
    const formBackBtn = document.getElementById("form-back-btn");
    const createPineappleLink = document.getElementById("create-pineapple-link");

    const officialTab = document.getElementById("official-tab");
    const privateTab = document.getElementById("private-tab");
    const officialContent = document.getElementById("official-games");
    const privateContent = document.getElementById("private-games");

    const officialUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiz6IVPR4cZB9JlbNPC1Km5Jls5wsW3i-G9WYLppmnfPDz2kxb0I-g1BY50wFzuJ0aYgYdyub6VpCd/pub?output=csv";
    const privateUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIMKVHVz5EaVdJ5YfZJwLW72R9aI1Si9p-LX7kc__5-iAMaXz2itGmffgHu0b05_IRvFFAadH64Z-M/pub?output=csv";
    const webAppUrl = "https://script.google.com/macros/s/AKfycbyFVSK9mHruHEaX_ImhUobprQczd3JOQWQ9QzK9qwN0kgaAtOLZ_wk2u8HkGifd8oS15w/exec";

    fetch(privateUrl)
        .then(response => {
            console.log("Debug private fetch status:", response.status);
            console.log("Debug private fetch ok:", response.ok);
            return response.text();
        })
        .then(text => console.log("Debug private fetch content:", text))
        .catch(error => console.error("Debug private fetch error:", error));

    if (officialTab && privateTab && officialContent && privateContent) {
        officialTab.addEventListener("click", () => {
            console.log("Official tab clicked");
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            privateContent.classList.remove("active");
            if (createForm) createForm.style.display = "none";
            displayGameList();
        });

        privateTab.addEventListener("click", () => {
            console.log("Private tab clicked");
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            officialContent.classList.remove("active");
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

    homeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Home button clicked");
        resetScreenDisplays();
        gameSelectScreen.style.display = "flex";
        officialTab.classList.add("active");
        privateTab.classList.remove("active");
        officialContent.classList.add("active");
        privateContent.classList.remove("active");
        if (createForm) createForm.style.display = "none";
        displayGameList();
        adjustBackground();
    });

    backBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Back button clicked");
        resetScreenDisplays();
        gameScreen.style.display = "flex";
        adjustBackground();
        if (createForm) createForm.style.display = "none";
    });

    if (createPineappleBtn && createForm) {
        createPineappleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create a Pineapple clicked");
            createForm.style.display = "flex";
        });
    }

    if (createPineappleLink) {
        createPineappleLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create Pineapple link clicked");
            resetScreenDisplays();
            gameSelectScreen.style.display = "flex";
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            officialContent.classList.remove("active");
            if (createForm) createForm.style.display = "none";
            displayGameList();
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

            if (!formData.gameName || !formData.secretWord || !formData.hint1) {
                alert("Please fill in Game Name, Secret Word, and at least Hint #1");
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
                officialContent.classList.remove("active");
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
        });
    }

    function showGameSelectScreen() {
        console.log("Showing game select screen");
        resetScreenDisplays();
        gameSelectScreen.style.display = "flex";
        officialTab.classList.add("active");
        privateTab.classList.remove("active");
        officialContent.classList.add("active");
        privateContent.classList.remove("active");
        if (createForm) createForm.style.display = "none";
        displayGameList();
    }

    function resetScreenDisplays() {
        if (gameScreen) gameScreen.style.display = "none";
        if (gameOverScreen) gameOverScreen.style.display = "none";
        if (gameSelectScreen) gameSelectScreen.style.display = "none";
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
            if (!response.ok) {
                console.log("Response status:", response.status);
                console.log("Response headers:", [...response.headers.entries()]);
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            console.log("Official CSV fetched:", text);

            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            allGames = parsed.data
                .filter(game => game["Game Number"] && game["Secret Word"])
                .sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            console.log("Parsed official games:", allGames);

            if (allGames.length === 0) throw new Error("No valid games in CSV");

            const latestGame = allGames[0];
            loadGame(latestGame);
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            updateHintCountdown();
            adjustBackground();
            setupEventListeners();
        } catch (error) {
            console.error("Error fetching official games:", error);
            allGames = [{ "Game Number": "1", "Secret Word": "ERROR", "Hint 1": "UNABLE", "Hint 2": "TO", "Hint 3": "LOAD", "Hint 4": "DATA", "Hint 5": "CHECK" }];
            console.log("Using fallback game:", allGames);
            loadGame(allGames[0]);
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            updateHintCountdown();
            adjustBackground();
            setupEventListeners();
            alert("Failed to load official games data. Using fallback game. Please check the console for details.");
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
            if (!response.ok) {
                console.log("Private response status:", response.status);
                console.log("Private response headers:", [...response.headers.entries()]);
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            console.log("Private CSV fetched:", text);

            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, quoteChar: '"', dynamicTyping: false });
            privateGames = parsed.data
                .filter(game => game["Game Name"] && game["Secret Word"])
                .map((game, index) => ({
                    ...game,
                    "Game Number": index + 1,
                    "Display Name": `Game #${index + 1} - ${game["Game Name"]}` // Used internally
                }))
                .sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            console.log("Parsed private games:", privateGames);
            if (privateGames.length === 0) console.log("No valid private games found in CSV");
        } catch (error) {
            console.error("Error fetching private games:", error);
            privateGames = [];
            console.log("Private games set to empty array due to error");
        }
    }

    function displayGameList() {
        const officialList = document.getElementById("official-list");
        if (officialList) {
            officialList.innerHTML = "";
            document.getElementById("game-name").textContent = "PINEAPPLE";
            console.log("Populating official games list", allGames);

            if (!allGames.length) {
                officialList.innerHTML = "<div>No official games available</div>";
            } else {
                const results = JSON.parse(localStorage.getItem("pineappleResults") || "{}");
                allGames.forEach(game => {
                    const gameNumber = game["Game Number"];
                    const secretWord = game["Secret Word"].toUpperCase();
                    const pastResult = results[gameNumber];
                    const guesses = pastResult && pastResult.guesses !== "Gave Up" ? pastResult.guesses : (pastResult ? "Gave Up" : "-");
                    const isCompleted = pastResult && pastResult.guesses !== "Gave Up" && pastResult.secretWord === secretWord;
                    const displayWord = isCompleted || (pastResult && pastResult.guesses === "Gave Up") ? secretWord : "Play Now";

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
                    });
                    officialList.appendChild(gameItem);
                });
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
                    const gameName = game["Game Name"];
                    const secretWord = game["Secret Word"].toUpperCase();
                    const pastResult = results[gameNumber];
                    const guesses = pastResult && pastResult.guesses !== "Gave Up" ? pastResult.guesses : (pastResult ? "Gave Up" : "-");
                    const isCompleted = pastResult && pastResult.guesses !== "Gave Up" && pastResult.secretWord === secretWord;
                    const displayWord = isCompleted || (pastResult && pastResult.guesses === "Gave Up") ? secretWord : "Play Now";

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
                    });
                    privateList.appendChild(gameItem);
                });
            }
        }
    }

    function setupEventListeners() {
        const input = document.getElementById("guess-input");
        const gameControls = document.getElementById("game-controls");
        let keyboardInitiated = false;

        document.querySelectorAll("#mode-toggle").forEach(button => {
            button.addEventListener("click", () => {
                document.body.classList.toggle("dark-mode");
                document.querySelectorAll("#mode-toggle").forEach(btn => {
                    btn.innerHTML = document.body.classList.contains("dark-mode") ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
                });
                adjustBackground();
            });
        });

        if (gameControls) gameControls.addEventListener("click", (e) => e.stopPropagation());

        document.addEventListener("click", (e) => {
            if (!gameOver && gameScreen.style.display === "flex" && 
                !gameControls.contains(e.target) && !e.target.closest("button") && e.target.id !== "game-name") {
                if (!keyboardInitiated) {
                    input.focus();
                    keyboardInitiated = true;
                }
                if (firstGuessMade && !gameOver) input.focus();
            }
        });

        document.querySelectorAll("#game-name").forEach(name => {
            name.addEventListener("click", () => {
                resetGame();
                loadGame(allGames[0]);
                resetScreenDisplays();
                gameScreen.style.display = "flex";
                adjustBackground();
            });
        });

        document.getElementById("prev-arrow-btn").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentGameNumber.includes("Private")) {
                const currentName = currentGameNumber.replace("Private ", "");
                const currentIndex = privateGames.findIndex(game => game["Game Name"] === currentName);
                if (currentIndex + 1 < privateGames.length) loadGame(privateGames[currentIndex + 1]);
            } else {
                const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
                if (currentIndex + 1 < allGames.length) loadGame(allGames[currentIndex + 1]);
            }
        });

        document.getElementById("next-arrow-btn").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentGameNumber.includes("Private")) {
                const currentName = currentGameNumber.replace("Private ", "");
                const currentIndex = privateGames.findIndex(game => game["Game Name"] === currentName);
                if (currentIndex - 1 >= 0) loadGame(privateGames[currentIndex - 1]);
            } else {
                const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
                if (currentIndex - 1 >= 0) loadGame(allGames[currentIndex - 1]);
            }
        });

        let touchStartX = 0;
        let touchEndX = 0;

        gameScreen.addEventListener("touchstart", e => touchStartX = e.changedTouches[0].screenX);
        gameScreen.addEventListener("touchend", e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            const swipeThreshold = 50;
            if (currentGameNumber.includes("Private")) {
                const currentName = currentGameNumber.replace("Private ", "");
                const currentIndex = privateGames.findIndex(game => game["Game Name"] === currentName);
                if (touchStartX - touchEndX > swipeThreshold && currentIndex - 1 >= 0) {
                    loadGame(privateGames[currentIndex - 1]);
                } else if (touchEndX - touchStartX > swipeThreshold && currentIndex + 1 < privateGames.length) {
                    loadGame(privateGames[currentIndex + 1]);
                }
            } else {
                const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
                if (touchStartX - touchEndX > swipeThreshold && currentIndex - 1 >= 0) {
                    loadGame(allGames[currentIndex - 1]);
                } else if (touchEndX - touchStartX > swipeThreshold && currentIndex + 1 < allGames.length) {
                    loadGame(allGames[currentIndex + 1]);
                }
            }
        }

        document.getElementById("give-up-btn").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            gaveUp = true;
            let originalGameNumber;
            if (currentGameNumber.includes("Private")) {
                const currentName = currentGameNumber.replace("Private ", "");
                const privateGame = privateGames.find(g => g["Game Name"] === currentName);
                originalGameNumber = privateGame ? privateGame["Game Number"] : currentGameNumber;
                console.log("Give Up - Private Game:", { currentGameNumber, originalGameNumber, privateGame });
            } else {
                originalGameNumber = currentGameNumber;
                console.log("Give Up - Official Game:", { currentGameNumber, originalGameNumber });
            }
            const gameType = currentGameNumber.includes("Private") ? "privatePineapple" : "pineapple";
            saveGameResult(gameType, originalGameNumber, secretWord, "Gave Up");
            endGame(false, true);
        });

        input.addEventListener("input", (e) => {
            if (!gameOver && e.data && e.inputType === "insertReplacementText") handleGuess(input.value.trim());
            if (input.value.length > 0) input.placeholder = "";
        });

        input.addEventListener("keydown", (e) => {
            if ((e.key === "Enter" || e.key === "NumpadEnter") && !gameOver) handleGuess(input.value.trim());
        });

        input.addEventListener("focus", () => {
            if (input.value === "") input.placeholder = "type guess here";
        });

        input.addEventListener("blur", () => {
            if (input.value === "") input.placeholder = "type guess here";
            if (firstGuessMade && !gameOver) input.focus();
        });
    }

    function updateHintCountdown() {
        const countdownElement = document.getElementById("hint-countdown");
        if (!countdownElement) return;
        if (hintIndex >= hints.length - 1) {
            countdownElement.textContent = "(All hints are now revealed)";
        } else {
            const guessesUntilNextHint = guessCount === 0 ? 5 : 5 - (guessCount % 5);
            const guessText = guessesUntilNextHint === 1 ? "guess" : "guesses";
            countdownElement.textContent = `(hint revealed after ${guessesUntilNextHint} ${guessText})`;
        }
    }

    function setupHints() {
        const hintElements = [
            document.getElementById("hint-row-1")?.children[0],
            document.getElementById("hint-row-2")?.children[0],
            document.getElementById("hint-row-3")?.children[0],
            document.getElementById("hint-row-4")?.children[0],
            document.getElementById("hint-row-5")?.children[0]
        ].filter(Boolean);
        hintElements.forEach((span, index) => {
            span.textContent = hints[index] || "";
            span.style.visibility = index === 0 ? "visible" : "hidden";
        });
        document.getElementById("current-game-number").textContent = currentGameNumber;
    }

    function adjustBackground() {
        const screens = [gameScreen, gameOverScreen, gameSelectScreen];
        screens.forEach(screen => {
            if (screen && screen.style.display === "flex") {
                screen.style.height = "100vh"; // Fixed height
            }
        });
    }

    window.addEventListener("resize", adjustBackground);

    function revealHint() {
        hintIndex++;
        const allHints = document.querySelectorAll(".hint-line span");
        if (hintIndex < allHints.length && allHints[hintIndex].textContent) {
            allHints[hintIndex].style.visibility = "visible";
        }
        updateHintCountdown();
    }

    function rainConfetti() {
        const confettiContainer = document.createElement("div");
        confettiContainer.className = "confetti";
        document.body.appendChild(confettiContainer);
        for (let i = 0; i < 50; i++) {
            const piece = document.createElement("div");
            piece.className = "confetti-piece";
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
            piece.style.animationDelay = `${Math.random() * 1}s`;
            confettiContainer.appendChild(piece);
        }
        setTimeout(() => confettiContainer.remove(), 2000);
    }

    function handleGuess(guess) {
        const guessDisplay = document.getElementById("guess-input");
        const guessLine = document.getElementById("guess-line");
        guessDisplay.value = guess.toUpperCase();
        guessDisplay.classList.remove("wrong-guess", "correct-guess");
        guessDisplay.style.opacity = "1";
        void guessDisplay.offsetWidth;

        if (!firstGuessMade) {
            firstGuessMade = true;
            document.getElementById("how-to-play-1").remove();
            document.getElementById("how-to-play-2").remove();
            document.querySelectorAll(".hint-line.spacer").forEach(spacer => spacer.remove());
            // Do NOT remove #game-controls
            adjustHintsAfterGuess();
        }

        guessCount++;
        score += 1;
        document.querySelectorAll("#score").forEach(scoreDisplay => scoreDisplay.textContent = `${score}`);

        if (guessCount % 5 === 0 && hintIndex < hints.length - 1) revealHint();
        else updateHintCountdown();

        if (guess.toUpperCase() === secretWord) {
            guessDisplay.classList.add("correct-guess");
            rainConfetti();
            guessLine.style.opacity = "0";
            setTimeout(() => {
                guessDisplay.classList.remove("correct-guess");
                let originalGameNumber;
                if (currentGameNumber.includes("Private")) {
                    const currentName = currentGameNumber.replace("Private ", "");
                    const privateGame = privateGames.find(g => g["Game Name"] === currentName);
                    originalGameNumber = privateGame ? privateGame["Game Number"] : currentGameNumber;
                    console.log("Correct Guess - Private Game:", { currentGameNumber, originalGameNumber, privateGame });
                } else {
                    originalGameNumber = currentGameNumber;
                    console.log("Correct Guess - Official Game:", { currentGameNumber, originalGameNumber });
                }
                const gameType = currentGameNumber.includes("Private") ? "privatePineapple" : "pineapple";
                saveGameResult(gameType, originalGameNumber, secretWord, score);
                endGame(true);
            }, 1500);
        } else {
            guessDisplay.classList.add("wrong-guess");
            setTimeout(() => {
                guessDisplay.classList.remove("wrong-guess");
                guessDisplay.style.opacity = "1";
                guessDisplay.style.color = document.body.classList.contains("dark-mode") ? "#FFFFFF" : "#000000";
                guessDisplay.value = "";
                if (!gameOver) guessDisplay.focus();
            }, 500);
        }
    }

    function adjustHintsAfterGuess() {
        const hintElements = [
            document.getElementById("hint-row-1")?.children[0],
            document.getElementById("hint-row-2")?.children[0],
            document.getElementById("hint-row-3")?.children[0],
            document.getElementById("hint-row-4")?.children[0],
            document.getElementById("hint-row-5")?.children[0]
        ].filter(Boolean);
        hintElements.forEach((span, index) => {
            span.style.visibility = index <= hintIndex ? "visible" : "hidden";
        });
    }

    function saveGameResult(gameType, gameNumber, secretWord, guesses) {
        const key = gameType + "Results";
        const results = JSON.parse(localStorage.getItem(key) || "{}");
        results[gameNumber] = { secretWord, guesses };
        localStorage.setItem(key, JSON.stringify(results));
        console.log(`Saved ${gameType} result for game ${gameNumber}:`, results[gameNumber]);
    }

    function endGame(won, gaveUp = false) {
        gameOver = true;
        const endGraphic = document.getElementById("end-graphic");
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
        document.getElementById("game-name").textContent = "PINEAPPLE";

        gameNumberSpan.textContent = currentGameNumber;
        todaysWord.textContent = secretWord;

        let shareMessage;
        if (won) {
            endGraphic.src = "pineapple_gif.gif";
            endGraphic.style.display = "block";
            const guessText = score === 1 ? "guess" : "guesses";
            const gameNum = currentGameNumber.includes("Private") ? 
                currentGameNumber.replace("Private ", "") : 
                currentGameNumber;
            shareText.innerHTML = `<span class="small-game-number">Game #${gameNum}</span>\nI solved the pineapple in\n<span class="big-score">${score}</span>\n${guessText}`;
            shareGameNumber.style.display = "none";
            shareScoreLabel.style.display = "none";
            shareScore.style.display = "none";
            shareMessage = `Game #${gameNum}\nI solved the pineapple in\n${score}\n${guessText}\nCan you beat my score? Click here: https://your-game-url.com`;
        } else if (gaveUp) {
            endGraphic.src = document.body.classList.contains("dark-mode") ? "sad_pineapple_dark.png" : "sad_pineapple_light.png";
            endGraphic.style.display = "block";
            shareText.innerHTML = '<span class="big">PLAY PINEAPPLE</span>\n\n<span class="italic">The Big Brain Word Game</span>';
            shareGameNumber.textContent = `${currentGameNumber}`;
            shareScoreLabel.style.display = "none";
            shareScore.style.display = "none";
            shareMessage = `PLAY PINEAPPLE\n\nThe Big Brain Word Game\n${currentGameNumber}\nCan you beat my score? Click here: https://your-game-url.com`;
        } else {
            endGraphic.src = document.body.classList.contains("dark-mode") ? "sad_pineapple_dark.png" : "sad_pineapple_light.png";
            endGraphic.style.display = "block";
            shareText.textContent = "I didn’t solve the pineapple";
            shareGameNumber.textContent = `${currentGameNumber}`;
            shareScore.textContent = `${score}`;
            shareMessage = `${shareText.textContent}\n${currentGameNumber}\nScore: ${score}\nCan you beat my score? Click here: https://your-game-url.com`;
        }

        shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://your-game-url.com")}&text=${encodeURIComponent(shareMessage)}`;
        shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;

        if (currentGameNumber.includes("Private")) {
            fetchPrivateGames().then(() => displayGameList());
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
        document.querySelectorAll("#score").forEach(scoreDisplay => scoreDisplay.textContent = `${score}`);
        const guessInput = document.getElementById("guess-input");
        guessInput.value = "";
        guessInput.placeholder = "type guess here";
        document.getElementById("guess-line").style.opacity = "1";
        if (!document.getElementById("how-to-play-1")) {
            const hintsBox = document.getElementById("hints");
            hintsBox.innerHTML = `
                <div class="hint-line" id="hint-row-1"><span></span></div>
                <div class="hint-line spacer"></div>
                <div class="hint-line" id="how-to-play-1"><b>How to Play</b></div>
                <div class="hint-line" id="how-to-play-2">Guess secret word in as few guesses as possible.<br><br>New hints are revealed after every five guesses.</div>
                <div class="hint-line spacer"></div>
                <div class="hint-line spacer"></div>
                <div id="game-controls">
                    <div class="controls-center">
                        <button id="give-up-btn" class="control-btn">Give Up</button>
                        <div class="control-nav">
                            <button id="prev-arrow-btn" class="control-btn arrow-btn"><i class="fas fa-arrow-left"></i></button>
                            <button id="all-games-btn" class="control-btn">All Games</button>
                            <button id="next-arrow-btn" class="control-btn arrow-btn"><i class="fas fa-arrow-right"></i></button>
                        </div>
                    </div>
                </div>
                <div class="hint-line" id="hint-row-2"><span></span></div>
                <div class="hint-line" id="hint-row-3"><span></span></div>
                <div class="hint-line" id="hint-row-4"><span></span></div>
                <div class="hint-line" id="hint-row-5"><span></span></div>
            `;
            setupEventListeners(); // Re-attach event listeners to newly created buttons
        }
        setupHints();
        updateHintCountdown();
    }

    function loadGame(game) {
        resetGame();
        const originalGameNumber = game["Game Number"];
        const privateGame = privateGames.find(g => g["Game Number"] === originalGameNumber);
        if (privateGame) {
            currentGameNumber = `Private ${privateGame["Game Name"]}`; // Display as "Private (Name)"
        } else {
            currentGameNumber = originalGameNumber; // Official game number
        }
        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"], game["Hint 2"], game["Hint 3"],
            game["Hint 4"], game["Hint 5"]
        ].filter(hint => hint).map(hint => hint.toUpperCase());
        console.log("Loaded game:", { currentGameNumber, originalGameNumber, secretWord, hints });
        setupHints();
        return originalGameNumber;
    }

    await Promise.all([fetchGameData(), fetchPrivateGames()]);
    displayGameList();
});