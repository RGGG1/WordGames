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
    let revealedHints = new Set();

    let meatballScore = 0;
    let meatballGameOver = false;
    let meatballFirstGuess = false;
    const meatballSecretWord = "TRIANGLE";

    console.log("Pineapple & Meatball Version");

    async function fetchGameData() {
        const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vThRLyZdJhT8H1_VEHQ1OuFi9tOB6QeRDIDD0PZ9PddetHpLybJG8mAjMxTtFsDpxWBx7v4eQOTaGyI/pub?gid=0&single=true&output=csv";
        try {
            const response = await fetch(csvUrl);
            const text = await response.text();
            const rows = text.split("\n").map(row => row.split(","));
            const headers = rows[0];
            allGames = rows.slice(1).map((row, index) => {
                let obj = { gameNumber: index + 1 };
                headers.forEach((header, i) => obj[header.trim()] = row[i] ? row[i].trim() : "");
                return obj;
            });

            const latestGame = allGames[allGames.length - 1];
            loadGame(latestGame);
            document.getElementById("game-screen").style.display = "flex";
            document.getElementById("guess-input").focus();
            adjustBackground();
        } catch (error) {
            console.error("Failed to fetch game data:", error);
            allGames = [{ gameNumber: 1, "Secret Word": "ERROR", "Hint 1": "UNABLE", "Hint 2": "TO", "Hint 3": "LOAD", "Hint 4": "HINTS", "Hint 5": "FROM", "Hint 6": "SHEET", "Hint 7": "CHECK" }];
            loadGame(allGames[0]);
            document.getElementById("game-screen").style.display = "flex";
        }
    }

    function displayGameList() {
        const gameList = document.getElementById("game-list");
        gameList.innerHTML = "";
        const sortedGames = [...allGames].sort((a, b) => b.gameNumber - a.gameNumber);
        sortedGames.forEach(game => {
            const gameItem = document.createElement("div");
            gameItem.className = "game-item";
            gameItem.textContent = `Game #${game.gameNumber}`; // Removed date
            gameItem.addEventListener("click", () => {
                loadGame(game);
                document.getElementById("game-select-screen").style.display = "none";
                document.getElementById("game-screen").style.display = "flex";
                document.getElementById("guess-input").focus();
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
            if (index > 0 && span.textContent) span.style.visibility = "hidden";
        });
    }

    function adjustBackground() {
        const screens = [document.getElementById("game-screen"), document.getElementById("meatball-screen"), document.getElementById("game-over"), document.getElementById("pause-screen"), document.getElementById("create-game-screen"), document.getElementById("game-select-screen")];
        const viewportHeight = window.innerHeight;
        screens.forEach(screen => {
            if (screen.style.display !== "none") {
                const contentHeight = screen.offsetHeight;
                if (viewportHeight < contentHeight + 100) {
                    screen.style.minHeight = `${viewportHeight}px`;
                }
            }
        });
    }

    window.addEventListener("resize", adjustBackground);

    function setupMeatballGame() {
        const meatballScreen = document.getElementById("meatball-screen");
        const meatballInput = document.getElementById("meatball-guess-input");
        const meatballGuessBackground = document.getElementById("meatball-guess-background");

        meatballInput.addEventListener("keydown", (e) => {
            if ((e.key === "Enter" || e.key === "NumpadEnter") && !meatballGameOver) {
                handleMeatballGuess(meatballInput.value);
            }
        });

        function handleMeatballGuess(guess) {
            const guessDisplay = meatballInput;
            guessDisplay.value = guess.toUpperCase();
            guessDisplay.classList.remove("wrong-guess", "correct-guess");
            guessDisplay.style.opacity = "1";
            void guessDisplay.offsetWidth;

            if (!meatballFirstGuess) {
                meatballFirstGuess = true;
                document.getElementById("meatball-instruction").style.display = "none";
            }

            if (guess.toUpperCase() === meatballSecretWord) {
                meatballGuessBackground.classList.add("flash-green");
                setTimeout(() => {
                    meatballGuessBackground.classList.remove("flash-green");
                    endMeatballGame(true);
                }, 1500);
            } else {
                meatballScore++;
                document.getElementById("meatball-score").textContent = `${meatballScore}`;
                guessDisplay.classList.add("wrong-guess");
                setTimeout(() => {
                    guessDisplay.classList.remove("wrong-guess");
                    guessDisplay.style.opacity = "1";
                    guessDisplay.style.color = document.body.classList.contains("dark-mode") ? "#FFFFFF" : "#000000";
                    guessDisplay.value = "";
                    if (!meatballGameOver) guessDisplay.focus();
                }, 500);
            }
        }

        function endMeatballGame(won) {
            meatballGameOver = true;
            const shareText = document.getElementById("share-text");
            const shareGameNumber = document.getElementById("share-game-number");
            const shareScore = document.getElementById("share-score");
            const shareWhatsApp = document.getElementById("share-whatsapp");
            const shareTelegram = document.getElementById("share-telegram");
            const shareTwitter = document.getElementById("share-twitter");

            meatballScreen.style.display = "none";
            document.getElementById("game-over").style.display = "flex";
            meatballInput.blur();

            const totalGuesses = meatballScore + 1;
            shareText.textContent = `I got today's meatball in ${totalGuesses} guesses`;
            shareGameNumber.textContent = "Game #1";
            shareScore.textContent = `${totalGuesses}`;

            const shareMessage = `${shareText.textContent}\nGame #1\nScore: ${totalGuesses}\nCan you beat my score? Click here: https://your-game-url.com/meatball`;
            shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
            shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://your-game-url.com/meatball")}&text=${encodeURIComponent(shareMessage)}`;
            shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
            adjustBackground();
        }

        document.addEventListener("click", () => {
            if (!meatballGameOver && meatballScreen.style.display === "flex") {
                meatballInput.focus();
            }
        });
    }

    fetchGameData().then(() => {
        const gameScreen = document.getElementById("game-screen");
        const go = document.getElementById("game-over");
        const pauseScreen = document.getElementById("pause-screen");
        const gameSelectScreen = document.getElementById("game-select-screen");

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
            const input = document.getElementById("guess-input");
            if (!gameOver && gameScreen.style.display === "flex" && pauseScreen.style.display === "none" && !e.target.closest("button") && e.target.id !== "game-name") {
                input.focus();
            }
        });

        document.querySelectorAll("#game-name").forEach(name => {
            name.addEventListener("click", () => {
                resetGame();
                document.querySelectorAll(".screen").forEach(screen => screen.style.display = "none");
                gameScreen.style.display = "flex";
                document.getElementById("guess-input").focus();
                adjustBackground();
            });
        });

        document.getElementById("previous-games-btn").addEventListener("click", (e) => {
            e.preventDefault();
            displayGameList();
            gameScreen.style.display = "none";
            gameSelectScreen.style.display = "flex";
            adjustBackground();
        });

        document.getElementById("back-to-game-btn").addEventListener("click", () => {
            gameSelectScreen.style.display = "none";
            gameScreen.style.display = "flex";
            document.getElementById("guess-input").focus();
            adjustBackground();
        });

        document.getElementById("give-up-btn").addEventListener("click", (e) => {
            e.preventDefault();
            endGame(false, true);
        });

        const input = document.getElementById("guess-input");
        const guessBackground = document.getElementById("guess-background");
        const guessLine = document.getElementById("guess-line");
        const hintBtn = document.getElementById("hint-btn");

        input.addEventListener("keydown", (e) => {
            if ((e.key === "Enter" || e.key === "NumpadEnter") && !gameOver) {
                handleGuess(input.value);
            }
        });

        hintBtn.addEventListener("click", () => {
            if (!gameOver && hintIndex < hints.length - 1) {
                revealHintOnClick();
            }
        });

        function handleGuess(guess) {
            const guessDisplay = input;
            const trimmedGuess = guess.trim();
            if (!firstGuessMade) {
                firstGuessMade = true;
                document.getElementById("how-to-play-1").style.display = "none";
                document.getElementById("how-to-play-2").style.display = "none";
                document.getElementById("how-to-play-3").style.display = "none";
                document.querySelectorAll(".hint-line.spacer").forEach(spacer => spacer.style.display = "none");
                adjustHintsAfterGuess();
            }

            guessCount++;
            score = guessCount;
            if (revealedHints.size > 0) {
                score = guessCount * Math.pow(2, revealedHints.size);
            }
            document.querySelectorAll("#score").forEach(scoreDisplay => {
                scoreDisplay.textContent = `${score}`;
            });

            guessDisplay.value = trimmedGuess.toUpperCase();
            guessDisplay.classList.remove("wrong-guess", "correct-guess");
            guessDisplay.style.opacity = "1";
            void guessDisplay.offsetWidth;

            if (trimmedGuess.toUpperCase() === secretWord) {
                guessDisplay.classList.add("correct-guess");
                guessBackground.classList.add("flash-green");
                guessLine.style.opacity = "0";
                setTimeout(() => {
                    guessDisplay.classList.remove("correct-guess");
                    guessBackground.classList.remove("flash-green");
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

        function revealHintOnClick() {
            hintIndex++;
            if (revealedHints.size === 0 && guessCount < 3) {
                score = 5;
            } else {
                score = score * 2;
            }
            revealedHints.add(hintIndex);
            document.querySelectorAll("#score").forEach(scoreDisplay => {
                scoreDisplay.textContent = `${score}`;
            });
            const allHints = document.querySelectorAll(".hint-line span");
            if (hintIndex < allHints.length && allHints[hintIndex].textContent && !revealedHints.has(hintIndex)) {
                allHints[hintIndex].style.visibility = "visible";
                setTimeout(() => {
                    allHints[hintIndex].classList.add("pulse-hint");
                    setTimeout(() => {
                        allHints[hintIndex].classList.remove("pulse-hint");
                    }, 2000);
                }, 200);
            }
            if (hintIndex >= 6) {
                document.getElementById("hint-btn").style.display = "none";
            }
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

            gameScreen.style.display = "none";
            go.style.display = "flex";
            document.getElementById("guess-input").blur();

            gameNumberSpan.textContent = currentGameNumber;
            todaysWord.textContent = secretWord;

            if (won) {
                endGraphic.src = "pineapple_gif.gif";
                endGraphic.style.display = "block";
                const guessText = score === 1 ? "guess" : "guesses";
                shareText.innerHTML = `I solved today's pineapple in\n<span class="big-score">${score}</span>\n${guessText}\nGame #${currentGameNumber}`;
                shareGameNumber.style.display = "none";
                shareScoreLabel.style.display = "none";
                shareScore.style.display = "none";
            } else if (gaveUp) {
                endGraphic.src = document.body.classList.contains("dark-mode") ? "sad_pineapple_dark.png" : "sad_pineapple_light.png";
                endGraphic.style.display = "block";
                shareText.innerHTML = 'PLAY PINEAPPLE\n<span class="italic">The Big Brain Word Game</span>';
                shareGameNumber.textContent = `Game #${currentGameNumber}`;
                shareScoreLabel.style.display = "none";
                shareScore.style.display = "none";
            } else {
                endGraphic.src = document.body.classList.contains("dark-mode") ? "sad_pineapple_dark.png" : "sad_pineapple_light.png";
                endGraphic.style.display = "block";
                shareText.textContent = "I didn’t solve today’s pineapple";
                shareGameNumber.textContent = `Game #${currentGameNumber}`;
                shareScore.textContent = `${score}`;
            }

            const shareMessage = gaveUp
                ? `PLAY PINEAPPLE\nThe Big Brain Word Game\nGame #${currentGameNumber}\nCan you beat my score? Click here: https://your-game-url.com`
                : won
                ? `I solved today's pineapple in\n${score}\n${score === 1 ? "guess" : "guesses"}\nGame #${currentGameNumber}\nCan you beat my score? Click here: https://your-game-url.com`
                : `${shareText.textContent}\nGame #${currentGameNumber}\nScore: ${score}\nCan you beat my score? Click here: https://your-game-url.com`;
            shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
            shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://your-game-url.com")}&text=${encodeURIComponent(shareMessage)}`;
            shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
            adjustBackground();
        }

        const resumeBtn = document.getElementById("resume-btn");
        const countdown = document.getElementById("countdown");

        resumeBtn.addEventListener("click", () => {
            resumeBtn.style.display = "none";
            countdown.style.display = "block";
            let timeLeft = 5;
            countdown.textContent = timeLeft;
            const interval = setInterval(() => {
                timeLeft--;
                countdown.textContent = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    pauseScreen.style.display = "none";
                    if (!gameOver) document.getElementById("guess-input").focus();
                }
            }, 1000);
        });

        document.getElementById("end-hungry-shark").addEventListener("click", (e) => {
            e.preventDefault();
            displayGameList();
            go.style.display = "none";
            gameSelectScreen.style.display = "flex";
            adjustBackground();
        });

        document.getElementById("end-meatball").addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("meatball-screen").style.display = "flex";
            meatballScore = 0;
            meatballGameOver = false;
            meatballFirstGuess = false;
            document.getElementById("meatball-score").textContent = "0";
            document.getElementById("meatball-guess-input").value = "";
            document.getElementById("meatball-instruction").style.display = "block";
            adjustBackground();
        });

        document.getElementById("ad-link").addEventListener("click", (e) => {
            e.preventDefault();
        });

        document.querySelectorAll(".home-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (btn.textContent === "Play Again") {
                    displayGameList();
                    go.style.display = "none";
                    document.getElementById("game-select-screen").style.display = "flex";
                } else {
                    resetGame();
                    gameScreen.style.display = "flex";
                    go.style.display = "none";
                    document.querySelectorAll(".screen").forEach(screen => screen.style.display = "none");
                    adjustBackground();
                    document.getElementById("guess-input").focus();
                }
            });
        });

        setupMeatballGame();
    });

    function resetGame() {
        score = 0;
        gameOver = false;
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        revealedHints.clear();
        document.querySelectorAll("#score").forEach(scoreDisplay => {
            scoreDisplay.textContent = `${score}`;
        });
        document.getElementById("guess-input").value = "";
        document.getElementById("guess-line").style.opacity = "1";
        document.getElementById("how-to-play-1").style.display = "block";
        document.getElementById("how-to-play-2").style.display = "block";
        document.getElementById("how-to-play-3").style.display = "block";
        document.querySelectorAll(".hint-line.spacer").forEach(spacer => spacer.style.display = "block");
        document.getElementById("hint-btn").style.display = "block";
        setupHints();
    }

    function loadGame(game) {
        resetGame();
        currentGameNumber = game.gameNumber;
        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"], game["Hint 2"], game["Hint 3"],
            game["Hint 4"], game["Hint 5"], game["Hint 6"],
            game["Hint 7"], game["Hint 8"], game["Hint 9"]
        ].filter(hint => hint).map(hint => hint.toUpperCase());
        while (hints.length < 7) hints.push("");
        setupHints();
    }
});