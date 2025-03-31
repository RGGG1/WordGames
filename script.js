document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded");

    let score = 0;
    let gameOver = false;
    let secretWord = "";
    let hints = [];
    let hintIndex = 0;
    let firstGuessMade = false;
    let allGames = [];
    let currentGameNumber = null;
    let guessCount = 0;
    let gaveUp = false;

    const gameScreen = document.getElementById("game-screen");
    const gameOverScreen = document.getElementById("game-over");
    const pauseScreen = document.getElementById("pause-screen");
    const gameSelectScreen = document.getElementById("game-select-screen");
    const allGamesBtn = document.getElementById("all-games-btn");
    const homeBtn = document.getElementById("home-btn");
    const backBtn = document.getElementById("back-btn");

    console.log("Screens:", { gameScreen, gameOverScreen, pauseScreen, gameSelectScreen });
    console.log("Buttons:", { allGamesBtn, homeBtn, backBtn });

    allGamesBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("All Games button clicked");
        showGameSelectScreen();
    });

    homeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Play Again button clicked");
        showGameSelectScreen();
    });

    backBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Back button clicked");
        resetScreenDisplays();
        gameScreen.style.display = "flex";
    });

    function showGameSelectScreen() {
        console.log("Showing game select screen");
        resetScreenDisplays();
        gameSelectScreen.style.display = "flex";
        displayGameList();
    }

    function resetScreenDisplays() {
        console.log("Resetting screen displays");
        if (gameScreen) gameScreen.style.display = "none";
        if (gameOverScreen) gameOverScreen.style.display = "none";
        if (pauseScreen) pauseScreen.style.display = "none";
        if (gameSelectScreen) gameSelectScreen.style.display = "none";
    }

    async function fetchGameData() {
        console.log("Fetching game data");
        const spreadsheetId = "2PACX-1vRMvXgPjexmdAprs9-QpmW22h63q2Fl-tDcCFFSXfMf8JeI4wsmkFERxrIIhYO5g1BhbHnt99B7lbXR";
        const pineappleUrl = `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub?gid=0&single=true&output=csv`;

        try {
            const pineResponse = await fetch(pineappleUrl);
            if (!pineResponse.ok) throw new Error(`Pineapple fetch failed: ${pineResponse.status}`);
            const pineText = await pineResponse.text();
            const pineRows = pineText.split("\n").map(row => row.split(","));
            const pineHeaders = pineRows[0];
            allGames = pineRows.slice(1).map((row) => {
                let obj = {};
                pineHeaders.forEach((header, i) => obj[header.trim()] = row[i] ? row[i].trim() : "");
                return obj;
            }).sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            const latestPineGame = allGames[0];
            loadGame(latestPineGame);
        } catch (error) {
            console.error("Failed to fetch game data:", error);
            allGames = [{ "Game Number": 1, "Secret Word": "ERROR", "Hint 1": "UNABLE", "Hint 2": "TO", "Hint 3": "LOAD", "Hint 4": "HINTS", "Hint 5": "FROM", "Hint 6": "SHEET", "Hint 7": "CHECK" }];
            loadGame(allGames[0]);
        }
        resetScreenDisplays();
        gameScreen.style.display = "flex";
        updateHintCountdown();
        adjustBackground();
        setupEventListeners();
    }

    function displayGameList() {
        console.log("Displaying game list");
        const gameList = document.getElementById("game-list");
        if (!gameList) {
            console.error("Game list element not found");
            return;
        }
        gameList.innerHTML = "";
        document.getElementById("game-name").textContent = "PINEAPPLE";

        if (!allGames || allGames.length === 0) {
            console.warn("No games available to display");
            gameList.innerHTML = "<div>No games available</div>";
            return;
        }

        const results = JSON.parse(localStorage.getItem("pineappleResults") || "{}");
        allGames.forEach(game => {
            const gameNumber = game["Game Number"];
            const secretWord = game["Secret Word"];
            const guesses = results[gameNumber] ? results[gameNumber].guesses : "";
            const gameItem = document.createElement("div");
            gameItem.className = "game-list-row";
            gameItem.innerHTML = `
                <span>${gameNumber.trim()}</span>
                <span>${results[gameNumber] ? secretWord.trim() : "Play Now"}</span>
                <span>${guesses.trim() || ""}</span>
            `;
            if (guesses && guesses !== "Gave Up") {
                const guessCount = parseInt(guesses, 10);
                const colorClass = guessCount <= 5 ? "green" :
                                  guessCount <= 10 ? "yellow" :
                                  guessCount <= 15 ? "orange" :
                                  guessCount <= 20 ? "pink" : "red";
                gameItem.classList.add(colorClass);
            }
            gameItem.addEventListener("click", () => {
                loadGame(game);
                resetScreenDisplays();
                gameScreen.style.display = "flex";
                adjustBackground();
            });
            gameList.appendChild(gameItem);
        });
        console.log("Game list populated");
    }

    function setupEventListeners() {
        console.log("Setting up event listeners");
        const input = document.getElementById("guess-input");
        const footer = document.getElementById("footer");
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

        if (footer) {
            footer.addEventListener("click", (e) => {
                e.stopPropagation();
                console.log("Footer clicked, stopping propagation");
            });
        }

        document.addEventListener("click", (e) => {
            if (!gameOver && 
                gameScreen.style.display === "flex" && 
                pauseScreen.style.display === "none" && 
                !footer.contains(e.target) &&
                !e.target.closest("button") && 
                e.target.id !== "game-name") {
                if (!keyboardInitiated) {
                    input.focus();
                    keyboardInitiated = true;
                }
                if (firstGuessMade && !gameOver) {
                    input.focus();
                }
            }
        });

        document.querySelectorAll("#game-name").forEach(name => {
            name.addEventListener("click", () => {
                console.log("Game name clicked");
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
            const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
            if (currentIndex + 1 < allGames.length) {
                loadGame(allGames[currentIndex + 1]);
            }
        });

        document.getElementById("next-arrow-btn").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
            if (currentIndex - 1 >= 0) {
                loadGame(allGames[currentIndex - 1]);
            }
        });

        let touchStartX = 0;
        let touchEndX = 0;

        gameScreen.addEventListener("touchstart", e => {
            touchStartX = e.changedTouches[0].screenX;
        });

        gameScreen.addEventListener("touchend", e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchStartX - touchEndX > swipeThreshold) {
                const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
                if (currentIndex - 1 >= 0) {
                    loadGame(allGames[currentIndex - 1]);
                }
            } else if (touchEndX - touchStartX > swipeThreshold) {
                const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
                if (currentIndex + 1 < allGames.length) {
                    loadGame(allGames[currentIndex + 1]);
                }
            }
        }

        document.getElementById("give-up-btn").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up button clicked");
            gaveUp = true;
            saveGameResult("pineapple", currentGameNumber, secretWord, "Gave Up");
            endGame(false, true);
        });

        input.addEventListener("input", (e) => {
            if (!gameOver && e.data && e.inputType === "insertReplacementText") {
                handleGuess(input.value.trim());
            }
        });

        input.addEventListener("keydown", (e) => {
            if ((e.key === "Enter" || e.key === "NumpadEnter") && !gameOver) {
                handleGuess(input.value.trim());
            }
        });

        input.addEventListener("focus", () => {
            if (!firstGuessMade && input.value === "") {
                input.placeholder = "type guess here";
            }
            if (firstGuessMade) {
                document.getElementById("footer").style.bottom = "calc(40vh)";
            }
        });

        input.addEventListener("blur", () => {
            if (firstGuessMade && !gameOver) {
                input.focus();
            } else if (!firstGuessMade) {
                document.getElementById("footer").style.bottom = "1vh";
            }
        });

        input.addEventListener("input", () => {
            if (input.value.length > 0) {
                input.placeholder = "";
            }
        });

        document.getElementById("resume-btn").addEventListener("click", () => {
            const countdown = document.getElementById("countdown");
            document.getElementById("resume-btn").style.display = "none";
            countdown.style.display = "block";
            let timeLeft = 5;
            countdown.textContent = timeLeft;
            const interval = setInterval(() => {
                timeLeft--;
                countdown.textContent = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    pauseScreen.style.display = "none";
                    if (!gameOver && firstGuessMade) input.focus();
                }
            }, 1000);
        });
    }

    function updateHintCountdown() {
        console.log("Updating hint countdown");
        const countdownElement = document.getElementById("hint-countdown");
        if (!countdownElement) {
            console.error("Hint countdown element not found");
            return;
        }
        if (hintIndex >= hints.length - 1) {
            countdownElement.textContent = "(All hints are now revealed)";
        } else {
            const guessesUntilNextHint = guessCount === 0 ? 5 : 5 - (guessCount % 5);
            const guessText = guessesUntilNextHint === 1 ? "guess" : "guesses";
            countdownElement.textContent = `(hint revealed after ${guessesUntilNextHint} ${guessText})`;
        }
    }

    function setupHints() {
        console.log("Setting up hints");
        const hintElements = [
            document.getElementById("hint-row-1")?.children[0],
            document.getElementById("hint-row-2")?.children[0],
            document.getElementById("hint-row-3")?.children[0],
            document.getElementById("hint-row-4")?.children[0],
            document.getElementById("hint-row-5")?.children[0],
            document.getElementById("hint-row-6")?.children[0],
            document.getElementById("hint-row-7")?.children[0]
        ].filter(Boolean);
        hintElements.forEach((span, index) => {
            span.textContent = hints[index] || "";
            span.style.visibility = index === 0 ? "visible" : "hidden";
        });
        document.getElementById("current-game-number").textContent = currentGameNumber;
    }

    function adjustBackground() {
        console.log("Adjusting background");
        const screens = [gameScreen, gameOverScreen, pauseScreen, gameSelectScreen];
        screens.forEach(screen => {
            if (screen && screen.style.display === "flex") {
                screen.style.height = "100vh";
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
        console.log("Raining confetti");
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
        console.log("Handling guess:", guess);
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
            document.getElementById("footer").style.bottom = "calc(40vh)";
            adjustHintsAfterGuess();
        }

        guessCount++;
        score += 1;
        document.querySelectorAll("#score").forEach(scoreDisplay => {
            scoreDisplay.textContent = `${score}`;
        });

        if (guessCount % 5 === 0 && hintIndex < hints.length - 1) {
            revealHint();
        } else {
            updateHintCountdown();
        }

        if (guess.toUpperCase() === secretWord) {
            guessDisplay.classList.add("correct-guess");
            rainConfetti();
            guessLine.style.opacity = "0";
            setTimeout(() => {
                guessDisplay.classList.remove("correct-guess");
                saveGameResult("pineapple", currentGameNumber, secretWord, score);
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
        console.log("Adjusting hints after guess");
        const hintElements = [
            document.getElementById("hint-row-1")?.children[0],
            document.getElementById("hint-row-2")?.children[0],
            document.getElementById("hint-row-3")?.children[0],
            document.getElementById("hint-row-4")?.children[0],
            document.getElementById("hint-row-5")?.children[0],
            document.getElementById("hint-row-6")?.children[0],
            document.getElementById("hint-row-7")?.children[0]
        ].filter(Boolean);
        hintElements.forEach((span, index) => {
            span.style.visibility = index <= hintIndex ? "visible" : "hidden";
        });
    }

    function saveGameResult(gameType, gameNumber, secretWord, guesses) {
        console.log("Saving game result:", gameNumber, guesses);
        const key = gameType + "Results";
        const results = JSON.parse(localStorage.getItem(key) || "{}");
        results[gameNumber] = { secretWord, guesses };
        localStorage.setItem(key, JSON.stringify(results));
    }

    function endGame(won, gaveUp = false) {
        console.log("Ending game, won:", won, "gaveUp:", gaveUp);
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

        if (won) {
            endGraphic.src = "pineapple_gif.gif";
            endGraphic.style.display = "block";
            const guessText = score === 1 ? "guess" : "guesses";
            shareText.innerHTML = `I solved the pineapple in\n<span class="big-score">${score}</span>\n${guessText}\nGame #${currentGameNumber}`;
            shareGameNumber.style.display = "none";
            shareScoreLabel.style.display = "none";
            shareScore.style.display = "none";
        } else if (gaveUp) {
            endGraphic.src = document.body.classList.contains("dark-mode") ? "sad_pineapple_dark.png" : "sad_pineapple_light.png";
            endGraphic.style.display = "block";
            shareText.innerHTML = '<span class="big">PLAY PINEAPPLE</span>\n\n<span class="italic">The Big Brain Word Game</span>';
            shareGameNumber.textContent = `Game #${currentGameNumber}`;
            shareScoreLabel.style.display = "none";
            shareScore.style.display = "none";
        } else {
            endGraphic.src = document.body.classList.contains("dark-mode") ? "sad_pineapple_dark.png" : "sad_pineapple_light.png";
            endGraphic.style.display = "block";
            shareText.textContent = "I didn’t solve the pineapple";
            shareGameNumber.textContent = `Game #${currentGameNumber}`;
            shareScore.textContent = `${score}`;
        }

        const shareMessage = gaveUp
            ? `PLAY PINEAPPLE\n\nThe Big Brain Word Game\nGame #${currentGameNumber}\nCan you beat my score? Click here: https://your-game-url.com`
            : won
            ? `I solved the pineapple in\n${score}\n${score === 1 ? "guess" : "guesses"}\nGame #${currentGameNumber}\nCan you beat my score? Click here: https://your-game-url.com`
            : `${shareText.textContent}\nGame #${currentGameNumber}\nScore: ${score}\nCan you beat my score? Click here: https://your-game-url.com`;
        shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://your-game-url.com")}&text=${encodeURIComponent(shareMessage)}`;
        shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
        adjustBackground();
    }

    function resetGame() {
        console.log("Resetting game");
        score = 0;
        gameOver = false;
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        gaveUp = false;
        document.querySelectorAll("#score").forEach(scoreDisplay => {
            scoreDisplay.textContent = `${score}`;
        });
        document.getElementById("guess-input").value = "";
        document.getElementById("guess-line").style.opacity = "1";
        document.getElementById("footer").style.bottom = "1vh";
        if (!document.getElementById("how-to-play-1")) {
            const hintsBox = document.getElementById("hints");
            hintsBox.innerHTML = `
                <div class="hint-line" id="hint-row-1"><span></span></div>
                <div class="hint-line spacer"></div>
                <div class="hint-line spacer"></div>
                <div class="hint-line" id="how-to-play-1"><b>How to Play</b></div>
                <div class="hint-line" id="how-to-play-2">Guess the secret word in as few guesses as possible.<br><br>New hints are revealed after every five guesses.</div>
                <div class="hint-line" id="hint-row-2"><span></span></div>
                <div class="hint-line" id="hint-row-3"><span></span></div>
                <div class="hint-line" id="hint-row-4"><span></span></div>
                <div class="hint-line" id="hint-row-5"><span></span></div>
                <div class="hint-line" id="hint-row-6"><span></span></div>
                <div class="hint-line" id="hint-row-7"><span></span></div>
            `;
        }
        setupHints();
        updateHintCountdown();
    }

    function loadGame(game) {
        console.log("Loading game:", game["Game Number"]);
        resetGame();
        currentGameNumber = game["Game Number"];
        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"], game["Hint 2"], game["Hint 3"],
            game["Hint 4"], game["Hint 5"], game["Hint 6"],
            game["Hint 7"]
        ].filter(hint => hint).map(hint => hint.toUpperCase());
        while (hints.length < 7) hints.push("");
        setupHints();
    }

    fetchGameData();
});