document.addEventListener("DOMContentLoaded", () => {
    let score = 0;
    let gameOver = false;
    let secretWord = "";
    let hints = [];
    let hintIndex = 0;
    let firstGuessMade = false;
    let allGames = [];
    let currentGameNumber = null;
    let guessCount = 0;

    let smoothbrainScore = 0;
    let smoothbrainGameOver = false;
    let smoothbrainFirstGuess = false;
    let smoothbrainSecretWord = "";
    let smoothbrainAnagram = "";
    let allAnagramGames = [];
    let smoothbrainHintIndex = 0;
    let smoothbrainGuessCount = 0;

    console.log("Pineapple & smoothbrain Version");

    async function fetchGameData() {
        const spreadsheetId = "2PACX-1vThRLyZdJhT8H1_VEHQ1OuFi9tOB6QeRDIDD0PZ9PddetHpLybJG8mAjMxTtFsDpxWBx7v4eQOTaGyI";
        const pineappleUrl = `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub?gid=0&single=true&output=csv`;
        const anagramUrl = `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub?gid=187602849&single=true&output=csv`;

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
            document.getElementById("game-screen").style.display = "flex";
            document.getElementById("guess-input").focus();

            const anagramResponse = await fetch(anagramUrl);
            if (!anagramResponse.ok) throw new Error(`Anagram fetch failed: ${anagramResponse.status}`);
            const anagramText = await anagramResponse.text();
            const anagramRows = anagramText.split("\n").map(row => row.split(","));
            const anagramHeaders = anagramRows[0];
            allAnagramGames = anagramRows.slice(1).map((row) => {
                let obj = {};
                anagramHeaders.forEach((header, i) => obj[header.trim()] = row[i] ? row[i].trim() : "");
                return obj;
            }).sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            const latestAnagramGame = allAnagramGames[0];
            loadSmoothbrainGame(latestAnagramGame);
        } catch (error) {
            console.error("Failed to fetch game data:", error);
            allGames = [{ "Game Number": 1, "Secret Word": "ERROR", "Hint 1": "UNABLE", "Hint 2": "TO", "Hint 3": "LOAD", "Hint 4": "HINTS", "Hint 5": "FROM", "Hint 6": "SHEET", "Hint 7": "CHECK" }];
            loadGame(allGames[0]);
            document.getElementById("game-screen").style.display = "flex";
            allAnagramGames = [{ "Game Number": 1, "Anagram": "RELATING", "Solution": "TRIANGLE" }];
            loadSmoothbrainGame(allAnagramGames[0]);
        }
        adjustBackground();
        setupEventListeners();
    }

    function setupEventListeners() {
        const gameScreen = document.getElementById("game-screen");
        const go = document.getElementById("game-over");
        const pauseScreen = document.getElementById("pause-screen");
        const gameSelectScreen = document.getElementById("game-select-screen");
        const input = document.getElementById("guess-input");
        const smoothbrainScreen = document.getElementById("smoothbrain-screen");
        const smoothbrainInput = document.getElementById("smoothbrain-guess-input");
        const smoothbrainHintBtn = document.getElementById("smoothbrain-hint-btn");

        document.querySelectorAll("#mode-toggle").forEach(button => {
            button.addEventListener("click", () => {
                document.body.classList.toggle("dark-mode");
                document.querySelectorAll("#mode-toggle").forEach(btn => {
                    btn.innerHTML = document.body.classList.contains("dark-mode") ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
                });
                adjustBackground();
            });
        });

        document.addEventListener("click", (e) => {
            if (!gameOver && gameScreen.style.display === "flex" && pauseScreen.style.display === "none" && !e.target.closest("button") && e.target.id !== "game-name") {
                input.focus();
            }
            if (!smoothbrainGameOver && smoothbrainScreen.style.display === "flex") {
                smoothbrainInput.focus();
            }
        });

        document.querySelectorAll("#game-name").forEach(name => {
            name.addEventListener("click", () => {
                resetGame();
                document.querySelectorAll(".screen").forEach(screen => screen.style.display = "none");
                gameScreen.style.display = "flex";
                input.focus();
                adjustBackground();
            });
        });

        document.getElementById("previous-games-btn").addEventListener("click", (e) => {
            e.preventDefault();
            displayGameList("pineapple");
            gameScreen.style.display = "none";
            gameSelectScreen.style.display = "flex";
            adjustBackground();
        });

        document.getElementById("smoothbrain-previous-games-btn").addEventListener("click", (e) => {
            e.preventDefault();
            displayGameList("smoothbrain");
            smoothbrainScreen.style.display = "none";
            gameSelectScreen.style.display = "flex";
            adjustBackground();
        });

        document.getElementById("back-to-game-btn").addEventListener("click", () => {
            gameSelectScreen.style.display = "none";
            if (document.getElementById("game-screen").style.display === "flex") {
                gameScreen.style.display = "flex";
                input.focus();
            } else {
                smoothbrainScreen.style.display = "flex";
                smoothbrainInput.focus();
            }
            adjustBackground();
        });

        document.getElementById("give-up-btn").addEventListener("click", (e) => {
            e.preventDefault();
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

        smoothbrainInput.addEventListener("input", (e) => {
            if (!smoothbrainGameOver && e.data && e.inputType === "insertReplacementText") {
                handleSmoothbrainGuess(smoothbrainInput.value.trim());
            }
        });

        smoothbrainInput.addEventListener("keydown", (e) => {
            if ((e.key === "Enter" || e.key === "NumpadEnter") && !smoothbrainGameOver) {
                handleSmoothbrainGuess(smoothbrainInput.value.trim());
            }
        });

        smoothbrainHintBtn.addEventListener("click", () => {
            if (!smoothbrainGameOver) {
                revealSmoothbrainHint();
            }
        });

        document.getElementById("smoothbrain-give-up-btn").addEventListener("click", (e) => {
            e.preventDefault();
            endSmoothbrainGame(false, true);
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
                    if (!gameOver) input.focus();
                }
            }, 1000);
        });

        document.getElementById("end-hungry-shark").addEventListener("click", (e) => {
            e.preventDefault();
            displayGameList("pineapple");
            go.style.display = "none";
            gameSelectScreen.style.display = "flex";
            adjustBackground();
        });

        document.getElementById("end-meatball").addEventListener("click", (e) => {
            e.preventDefault();
            smoothbrainScreen.style.display = "flex";
            smoothbrainScore = 0;
            smoothbrainGameOver = false;
            smoothbrainFirstGuess = false;
            smoothbrainHintIndex = 0;
            smoothbrainGuessCount = 0;
            document.getElementById("smoothbrain-score").textContent = "0";
            document.getElementById("smoothbrain-guess-input").value = "";
            document.getElementById("smoothbrain-instruction").style.display = "block";
            document.getElementById("smoothbrain-hint-text").textContent = "";
            document.getElementById("smoothbrain-hint-btn").style.display = "block";
            loadSmoothbrainGame(allAnagramGames[0]);
            adjustBackground();
        });

        document.getElementById("ad-link").addEventListener("click", (e) => {
            e.preventDefault();
        });

        document.querySelectorAll(".home-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (btn.textContent === "Play Again") {
                    displayGameList("pineapple");
                    go.style.display = "none";
                    gameSelectScreen.style.display = "flex";
                } else {
                    resetGame();
                    gameScreen.style.display = "flex";
                    go.style.display = "none";
                    document.querySelectorAll(".screen").forEach(screen => screen.style.display = "none");
                    adjustBackground();
                    input.focus();
                }
            });
        });
    }

    function displayGameList(gameType) {
        const gameList = document.getElementById("game-list");
        gameList.innerHTML = "";
        const games = gameType === "pineapple" ? allGames : allAnagramGames;
        document.getElementById("game-name").textContent = gameType === "pineapple" ? "PINEAPPLE" : "smoothbrain";
        games.forEach(game => {
            const gameItem = document.createElement("div");
            gameItem.className = "game-item";
            gameItem.textContent = `Game #${game["Game Number"]}`;
            gameItem.addEventListener("click", () => {
                if (gameType === "pineapple") {
                    loadGame(game);
                    document.getElementById("game-select-screen").style.display = "none";
                    document.getElementById("game-screen").style.display = "flex";
                    document.getElementById("guess-input").focus();
                } else {
                    loadSmoothbrainGame(game);
                    document.getElementById("game-select-screen").style.display = "none";
                    document.getElementById("smoothbrain-screen").style.display = "flex";
                    document.getElementById("smoothbrain-guess-input").focus();
                }
            });
            gameList.appendChild(gameItem);
        });
    }

    function setupHints() {
        const hintElements = [
            document.getElementById("hint-row-1").children[0],
            document.getElementById("hint-row-2").children[0],
            document.getElementById("hint-row-3").children[0],
            document.getElementById("hint-row-4").children[0],
            document.getElementById("hint-row-5").children[0],
            document.getElementById("hint-row-6").children[0],
            document.getElementById("hint-row-7").children[0]
        ];
        hintElements.forEach((span, index) => {
            span.textContent = hints[index] || "";
            span.style.visibility = index === 0 ? "visible" : "hidden";
        });
    }

    function adjustBackground() {
        const screens = [document.getElementById("game-screen"), document.getElementById("smoothbrain-screen"), document.getElementById("game-over"), document.getElementById("pause-screen"), document.getElementById("create-game-screen"), document.getElementById("game-select-screen")];
        screens.forEach(screen => {
            if (screen.style.display !== "none") {
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
            allHints[hintIndex].classList.add("pulse-hint");
            setTimeout(() => {
                allHints[hintIndex].classList.remove("pulse-hint");
            }, 2000);
        }
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
        const guessBackground = document.getElementById("guess-background");
        const guessLine = document.getElementById("guess-line");
        guessDisplay.value = guess.toUpperCase();
        guessDisplay.classList.remove("wrong-guess", "correct-guess");
        guessDisplay.style.opacity = "1";
        void guessDisplay.offsetWidth;

        if (!firstGuessMade) {
            firstGuessMade = true;
            document.getElementById("how-to-play-1").style.display = "none";
            document.getElementById("how-to-play-2").style.display = "none";
            document.querySelectorAll(".hint-line.spacer").forEach(spacer => spacer.style.display = "none");
            adjustHintsAfterGuess();
        }

        guessCount++;
        score += 1;
        document.querySelectorAll("#score").forEach(scoreDisplay => {
            scoreDisplay.textContent = `${score}`;
        });

        if (guessCount % 5 === 0 && hintIndex < hints.length - 1) {
            revealHint();
        }

        if (guess.toUpperCase() === secretWord) {
            guessDisplay.classList.add("correct-guess");
            rainConfetti();
            guessLine.style.opacity = "0";
            setTimeout(() => {
                guessDisplay.classList.remove("correct-guess");
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
            document.getElementById("hint-row-1").children[0],
            document.getElementById("hint-row-2").children[0],
            document.getElementById("hint-row-3").children[0],
            document.getElementById("hint-row-4").children[0],
            document.getElementById("hint-row-5").children[0],
            document.getElementById("hint-row-6").children[0],
            document.getElementById("hint-row-7").children[0]
        ];
        hintElements.forEach((span, index) => {
            span.style.visibility = index <= hintIndex ? "visible" : "hidden";
        });
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

        document.getElementById("game-screen").style.display = "none";
        document.getElementById("game-over").style.display = "flex";
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
            shareText.innerHTML = '<span class="big">PLAY PINEAPPLE</span>\n<span class="italic">The Big Brain Word Game</span>';
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
            ? `PLAY PINEAPPLE\nThe Big Brain Word Game\nGame #${currentGameNumber}\nCan you beat my score? Click here: https://your-game-url.com`
            : won
            ? `I solved the pineapple in\n${score}\n${score === 1 ? "guess" : "guesses"}\nGame #${currentGameNumber}\nCan you beat my score? Click here: https://your-game-url.com`
            : `${shareText.textContent}\nGame #${currentGameNumber}\nScore: ${score}\nCan you beat my score? Click here: https://your-game-url.com`;
        shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://your-game-url.com")}&text=${encodeURIComponent(shareMessage)}`;
        shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
        adjustBackground();
    }

    function handleSmoothbrainGuess(guess) {
        const guessDisplay = document.getElementById("smoothbrain-guess-input");
        const guessBackground = document.getElementById("smoothbrain-guess-background");
        guessDisplay.value = guess.toUpperCase();
        guessDisplay.classList.remove("wrong-guess", "correct-guess");
        guessDisplay.style.opacity = "1";
        void guessDisplay.offsetWidth;

        if (!smoothbrainFirstGuess) {
            smoothbrainFirstGuess = true;
            document.getElementById("smoothbrain-instruction").style.display = "none";
        }

        smoothbrainGuessCount++;
        smoothbrainScore += 1;
        document.getElementById("smoothbrain-score").textContent = `${smoothbrainScore}`;

        if (guess.toUpperCase() === smoothbrainSecretWord) {
            guessDisplay.classList.add("correct-guess");
            rainConfetti();
            setTimeout(() => {
                guessDisplay.classList.remove("correct-guess");
                endSmoothbrainGame(true);
            }, 1500);
        } else {
            guessDisplay.classList.add("wrong-guess");
            setTimeout(() => {
                guessDisplay.classList.remove("wrong-guess");
                guessDisplay.style.opacity = "1";
                guessDisplay.style.color = document.body.classList.contains("dark-mode") ? "#FFFFFF" : "#000000";
                guessDisplay.value = "";
                if (!smoothbrainGameOver) guessDisplay.focus();
            }, 500);
        }
    }

    function revealSmoothbrainHint() {
        smoothbrainHintIndex++;
        smoothbrainScore *= 2;
        document.getElementById("smoothbrain-score").textContent = `${smoothbrainScore}`;
        document.getElementById("smoothbrain-hint-text").textContent = smoothbrainSecretWord.substring(0, smoothbrainHintIndex);
        document.getElementById("smoothbrain-hint-text").classList.add("pulse-hint");
        setTimeout(() => {
            document.getElementById("smoothbrain-hint-text").classList.remove("pulse-hint");
        }, 2000);
        if (smoothbrainHintIndex >= smoothbrainSecretWord.length) {
            endSmoothbrainGame(false, true);
        }
    }

    function endSmoothbrainGame(won, gaveUp = false) {
        smoothbrainGameOver = true;
        const shareText = document.getElementById("share-text");
        const shareGameNumber = document.getElementById("share-game-number");
        const shareScore = document.getElementById("share-score");
        const shareWhatsApp = document.getElementById("share-whatsapp");
        const shareTelegram = document.getElementById("share-telegram");
        const shareTwitter = document.getElementById("share-twitter");
        const endGraphic = document.getElementById("end-graphic");
        const todaysWord = document.getElementById("todays-word");
        const todaysWordLabel = document.getElementById("todays-word-label");
        const gameNumberSpan = document.getElementById("game-number");

        document.getElementById("smoothbrain-screen").style.display = "none";
        document.getElementById("game-over").style.display = "flex";
        document.getElementById("smoothbrain-guess-input").blur();
        document.getElementById("game-name").textContent = "smoothbrain";

        const totalGuesses = smoothbrainScore;
        todaysWordLabel.textContent = `Game #${allAnagramGames[0]["Game Number"]}\nSecret Word`;
        todaysWord.textContent = smoothbrainSecretWord;
        gameNumberSpan.textContent = allAnagramGames[0]["Game Number"];

        if (won) {
            endGraphic.src = "smoothbrain_win.png";
            endGraphic.style.display = "block";
            const guessText = totalGuesses === 1 ? "guess" : "guesses";
            shareText.innerHTML = `I solved the smoothbrain in\n<span class="big-score">${totalGuesses}</span>\n${guessText}\nGame #${allAnagramGames[0]["Game Number"]}`;
            shareGameNumber.style.display = "none";
            shareScore.style.display = "none";
        } else if (gaveUp) {
            endGraphic.src = document.body.classList.contains("dark-mode") ? "smoothbrain_lose.png" : "smoothbrain_lose.png";
            endGraphic.style.display = "block";
            shareText.innerHTML = '<span class="big">PLAY smoothbrain</span>\n<span class="italic">The Anagram Word Game</span>';
            shareGameNumber.style.display = "none";
            shareScore.style.display = "none";
        } else {
            endGraphic.src = document.body.classList.contains("dark-mode") ? "smoothbrain_lose.png" : "smoothbrain_lose.png";
            endGraphic.style.display = "block";
            shareText.textContent = "I didn’t solve the smoothbrain";
            shareGameNumber.textContent = `Game #${allAnagramGames[0]["Game Number"]}`;
            shareScore.textContent = `${totalGuesses}`;
        }

        const shareMessage = gaveUp
            ? `PLAY smoothbrain\nThe Anagram Word Game\nCan you beat my score? Click here: https://your-game-url.com/smoothbrain`
            : won
            ? `I solved the smoothbrain in\n${totalGuesses}\n${totalGuesses === 1 ? "guess" : "guesses"}\nGame #${allAnagramGames[0]["Game Number"]}\nCan you beat my score? Click here: https://your-game-url.com/smoothbrain`
            : `${shareText.textContent}\nGame #${allAnagramGames[0]["Game Number"]}\nScore: ${totalGuesses}\nCan you beat my score? Click here: https://your-game-url.com/smoothbrain`;
        shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://your-game-url.com/smoothbrain")}&text=${encodeURIComponent(shareMessage)}`;
        shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
        adjustBackground();
    }

    function resetGame() {
        score = 0;
        gameOver = false;
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        document.querySelectorAll("#score").forEach(scoreDisplay => {
            scoreDisplay.textContent = `${score}`;
        });
        document.getElementById("guess-input").value = "";
        document.getElementById("guess-line").style.opacity = "1";
        document.getElementById("how-to-play-1").style.display = "block";
        document.getElementById("how-to-play-2").style.display = "block";
        document.querySelectorAll(".hint-line.spacer").forEach(spacer => spacer.style.display = "block");
        setupHints();
    }

    function loadGame(game) {
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

    function loadSmoothbrainGame(game) {
        smoothbrainSecretWord = game["Solution"].toUpperCase();
        smoothbrainAnagram = game["Anagram"].toUpperCase();
        document.getElementById("smoothbrain-relating").textContent = smoothbrainAnagram;
    }

    fetchGameData();
});