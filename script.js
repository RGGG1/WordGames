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

    let meatballScore = 0;
    let meatballGameOver = false;
    let meatballFirstGuess = false;
    let meatballSecretWord = "";
    let meatballAnagram = "";
    let allAnagramGames = [];
    let meatballHintIndex = 0;
    let meatballGuessCount = 0;

    console.log("Pineapple & Meatball Version");

    async function fetchGameData() {
        const spreadsheetId = "2PACX-1vThRLyZdJhT8H1_VEHQ1OuFi9tOB6QeRDIDD0PZ9PddetHpLybJG8mAjMxTtFsDpxWBx7v4eQOTaGyI";
        const pineappleUrl = `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub?gid=0&single=true&output=csv`; // Sheet1
        const anagramUrl = `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub?gid=187602849&single=true&output=csv`; // anagrams

        try {
            // Fetch Pineapple games (Sheet1)
            console.log("Fetching Pineapple data from:", pineappleUrl);
            const pineResponse = await fetch(pineappleUrl);
            if (!pineResponse.ok) throw new Error(`Pineapple fetch failed: ${pineResponse.status}`);
            const pineText = await pineResponse.text();
            console.log("Raw Pineapple CSV:", pineText);
            const pineRows = pineText.split("\n").map(row => row.split(","));
            const pineHeaders = pineRows[0];
            console.log("Pineapple Headers:", pineHeaders);
            allGames = pineRows.slice(1).map((row) => {
                let obj = {};
                pineHeaders.forEach((header, i) => obj[header.trim()] = row[i] ? row[i].trim() : "");
                return obj;
            }).sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            console.log("Parsed Pineapple Games:", allGames);
            const latestPineGame = allGames[0];
            loadGame(latestPineGame);
            document.getElementById("game-screen").style.display = "flex";
            document.getElementById("guess-input").focus();

            // Fetch Anagram games (anagrams)
            console.log("Fetching Anagram data from:", anagramUrl);
            const anagramResponse = await fetch(anagramUrl);
            if (!anagramResponse.ok) throw new Error(`Anagram fetch failed: ${anagramResponse.status}`);
            const anagramText = await anagramResponse.text();
            console.log("Raw Anagram CSV:", anagramText);
            const anagramRows = anagramText.split("\n").map(row => row.split(","));
            const anagramHeaders = anagramRows[0];
            console.log("Anagram Headers:", anagramHeaders);
            allAnagramGames = anagramRows.slice(1).map((row) => {
                let obj = {};
                anagramHeaders.forEach((header, i) => obj[header.trim()] = row[i] ? row[i].trim() : "");
                return obj;
            }).sort((a, b) => Number(b["Game Number"]) - Number(a["Game Number"]));
            console.log("Parsed Anagram Games:", allAnagramGames);
            const latestAnagramGame = allAnagramGames[0];
            loadMeatballGame(latestAnagramGame);
        } catch (error) {
            console.error("Failed to fetch game data:", error);
            console.log("Using fallback data due to error.");
            allGames = [{ "Game Number": 1, "Secret Word": "ERROR", "Hint 1": "UNABLE", "Hint 2": "TO", "Hint 3": "LOAD", "Hint 4": "HINTS", "Hint 5": "FROM", "Hint 6": "SHEET", "Hint 7": "CHECK" }];
            loadGame(allGames[0]);
            document.getElementById("game-screen").style.display = "flex";
            allAnagramGames = [{ "Game Number": 1, "Anagram": "RELATING", "Solution": "TRIANGLE" }];
            loadMeatballGame(allAnagramGames[0]);
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
        const guessBackground = document.getElementById("guess-background");
        const guessLine = document.getElementById("guess-line");
        const hintBtn = document.getElementById("hint-btn");
        const meatballScreen = document.getElementById("meatball-screen");
        const meatballInput = document.getElementById("meatball-guess-input");
        const meatballGuessBackground = document.getElementById("meatball-guess-background");
        const meatballHintBtn = document.getElementById("meatball-hint-btn");

        // Mode toggle
        document.querySelectorAll("#mode-toggle").forEach(button => {
            button.addEventListener("click", () => {
                document.body.classList.toggle("dark-mode");
                document.querySelectorAll("#mode-toggle").forEach(btn => {
                    btn.innerHTML = document.body.classList.contains("dark-mode") ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
                });
                adjustBackground();
            });
        });

        // Focus input on click
        document.addEventListener("click", (e) => {
            if (!gameOver && gameScreen.style.display === "flex" && pauseScreen.style.display === "none" && !e.target.closest("button") && e.target.id !== "game-name") {
                input.focus();
            }
            if (!meatballGameOver && meatballScreen.style.display === "flex") {
                meatballInput.focus();
            }
        });

        // Game name reset
        document.querySelectorAll("#game-name").forEach(name => {
            name.addEventListener("click", () => {
                resetGame();
                document.querySelectorAll(".screen").forEach(screen => screen.style.display = "none");
                gameScreen.style.display = "flex";
                input.focus();
                adjustBackground();
            });
        });

        // Previous games
        document.getElementById("previous-games-btn").addEventListener("click", (e) => {
            e.preventDefault();
            displayGameList();
            gameScreen.style.display = "none";
            gameSelectScreen.style.display = "flex";
            adjustBackground();
        });

        // Back to game
        document.getElementById("back-to-game-btn").addEventListener("click", () => {
            gameSelectScreen.style.display = "none";
            gameScreen.style.display = "flex";
            input.focus();
            adjustBackground();
        });

        // Give up (Pineapple)
        document.getElementById("give-up-btn").addEventListener("click", (e) => {
            e.preventDefault();
            endGame(false, true);
        });

        // Pineapple input
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

        // Pineapple hint
        hintBtn.addEventListener("click", () => {
            if (!gameOver && hintIndex < hints.length - 1 && guessCount >= 3) {
                revealHintOnClick();
                input.focus(); // Focus input after hint
            }
        });

        // Meatball input
        meatballInput.addEventListener("input", (e) => {
            if (!meatballGameOver && e.data && e.inputType === "insertReplacementText") {
                handleMeatballGuess(meatballInput.value.trim());
            }
        });

        meatballInput.addEventListener("keydown", (e) => {
            if ((e.key === "Enter" || e.key === "NumpadEnter") && !meatballGameOver) {
                handleMeatballGuess(meatballInput.value.trim());
            }
        });

        // Meatball hint
        meatballHintBtn.addEventListener("click", () => {
            if (!meatballGameOver && meatballHintIndex < meatballSecretWord.length && meatballGuessCount >= 3) {
                revealMeatballHint();
                meatballInput.focus(); // Focus input after hint
            }
        });

        // Meatball give up
        document.getElementById("meatball-give-up-btn").addEventListener("click", (e) => {
            e.preventDefault();
            endMeatballGame(false, true);
        });

        // Resume
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

        // End screen links
        document.getElementById("end-hungry-shark").addEventListener("click", (e) => {
            e.preventDefault();
            displayGameList();
            go.style.display = "none";
            gameSelectScreen.style.display = "flex";
            adjustBackground();
        });

        document.getElementById("end-meatball").addEventListener("click", (e) => {
            e.preventDefault();
            meatballScreen.style.display = "flex";
            meatballScore = 0;
            meatballGameOver = false;
            meatballFirstGuess = false;
            meatballHintIndex = 0;
            meatballGuessCount = 0;
            document.getElementById("meatball-score").textContent = "0";
            document.getElementById("meatball-guess-input").value = "";
            document.getElementById("meatball-instruction").style.display = "block";
            document.getElementById("meatball-hint-text").textContent = "";
            document.getElementById("meatball-hint-btn").disabled = true;
            document.getElementById("meatball-hint-btn").style.display = "block";
            loadMeatballGame(allAnagramGames[0]);
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

    function displayGameList() {
        const gameList = document.getElementById("game-list");
        gameList.innerHTML = "";
        allGames.forEach(game => {
            const gameItem = document.createElement("div");
            gameItem.className = "game-item";
            gameItem.textContent = `Game #${game["Game Number"]}`;
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
            span.style.visibility = index === 0 ? "visible" : "hidden"; // First hint visible
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
            document.getElementById("how-to-play-3").style.display = "none";
            document.querySelectorAll(".hint-line.spacer").forEach(spacer => spacer.style.display = "none");
            adjustHintsAfterGuess();
        }

        guessCount++;
        score += 1; // Increment score by 1 based on previous score
        document.querySelectorAll("#score").forEach(scoreDisplay => {
            scoreDisplay.textContent = `${score}`;
        });

        // Enable hint button after 3 guesses
        if (guessCount >= 3) {
            document.getElementById("hint-btn").disabled = false;
        }

        if (guess.toUpperCase() === secretWord) {
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
        score *= 2; // Double the current score
        document.querySelectorAll("#score").forEach(scoreDisplay => {
            scoreDisplay.textContent = `${score}`;
        });
        const allHints = document.querySelectorAll(".hint-line span");
        if (hintIndex < allHints.length && allHints[hintIndex].textContent) {
            allHints[hintIndex].style.visibility = "visible";
            allHints[hintIndex].classList.add("pulse-hint");
            setTimeout(() => {
                allHints[hintIndex].classList.remove("pulse-hint");
            }, 2000);
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

        document.getElementById("game-screen").style.display = "none";
        document.getElementById("game-over").style.display = "flex";
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

    function handleMeatballGuess(guess) {
        const guessDisplay = document.getElementById("meatball-guess-input");
        const guessBackground = document.getElementById("meatball-guess-background");
        guessDisplay.value = guess.toUpperCase();
        guessDisplay.classList.remove("wrong-guess", "correct-guess");
        guessDisplay.style.opacity = "1";
        void guessDisplay.offsetWidth;

        if (!meatballFirstGuess) {
            meatballFirstGuess = true;
            document.getElementById("meatball-instruction").style.display = "none";
        }

        meatballGuessCount++;
        meatballScore += 1; // Increment score by 1 based on previous score
        document.getElementById("meatball-score").textContent = `${meatballScore}`;

        // Enable hint button after 3 guesses
        if (meatballGuessCount >= 3) {
            document.getElementById("meatball-hint-btn").disabled = false;
        }

        if (guess.toUpperCase() === meatballSecretWord) {
            guessBackground.classList.add("flash-green");
            setTimeout(() => {
                guessBackground.classList.remove("flash-green");
                endMeatballGame(true);
            }, 1500);
        } else {
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

    function revealMeatballHint() {
        meatballHintIndex++;
        meatballScore *= 2; // Double the current score
        document.getElementById("meatball-score").textContent = `${meatballScore}`;
        document.getElementById("meatball-hint-text").textContent = meatballSecretWord.substring(0, meatballHintIndex);
        document.getElementById("meatball-hint-text").classList.add("pulse-hint");
        setTimeout(() => {
            document.getElementById("meatball-hint-text").classList.remove("pulse-hint");
        }, 2000);
        if (meatballHintIndex >= meatballSecretWord.length) {
            document.getElementById("meatball-hint-btn").style.display = "none";
        }
    }

    function endMeatballGame(won, gaveUp = false) {
        meatballGameOver = true;
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

        document.getElementById("meatball-screen").style.display = "none";
        document.getElementById("game-over").style.display = "flex";
        document.getElementById("meatball-guess-input").blur();

        const totalGuesses = meatballScore;
        todaysWordLabel.textContent = `Game #${allAnagramGames[0]["Game Number"]}\nSecret Word`;
        todaysWord.textContent = meatballSecretWord;
        gameNumberSpan.textContent = allAnagramGames[0]["Game Number"];

        if (won) {
            endGraphic.src = "pineapple_gif.gif"; // Replace with meatball-specific graphic if available
            endGraphic.style.display = "block";
            const guessText = totalGuesses === 1 ? "guess" : "guesses";
            shareText.innerHTML = `I solved today's meatball in\n<span class="big-score">${totalGuesses}</span>\n${guessText}\nGame #${allAnagramGames[0]["Game Number"]}`;
            shareGameNumber.style.display = "none";
            shareScore.style.display = "none";
        } else if (gaveUp) {
            endGraphic.src = document.body.classList.contains("dark-mode") ? "sad_pineapple_dark.png" : "sad_pineapple_light.png";
            endGraphic.style.display = "block";
            shareText.innerHTML = 'PLAY MEATBALL\n<span class="italic">The Anagram Word Game</span>';
            shareGameNumber.style.display = "none"; // Remove Game #X
            shareScore.style.display = "none";
        } else {
            endGraphic.src = document.body.classList.contains("dark-mode") ? "sad_pineapple_dark.png" : "sad_pineapple_light.png";
            endGraphic.style.display = "block";
            shareText.textContent = "I didn’t solve today’s meatball";
            shareGameNumber.textContent = `Game #${allAnagramGames[0]["Game Number"]}`;
            shareScore.textContent = `${totalGuesses}`;
        }

        const shareMessage = gaveUp
            ? `PLAY MEATBALL\nThe Anagram Word Game\nCan you beat my score? Click here: https://your-game-url.com/meatball`
            : won
            ? `I solved today's meatball in\n${totalGuesses}\n${totalGuesses === 1 ? "guess" : "guesses"}\nGame #${allAnagramGames[0]["Game Number"]}\nCan you beat my score? Click here: https://your-game-url.com/meatball`
            : `${shareText.textContent}\nGame #${allAnagramGames[0]["Game Number"]}\nScore: ${totalGuesses}\nCan you beat my score? Click here: https://your-game-url.com/meatball`;
        shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://your-game-url.com/meatball")}&text=${encodeURIComponent(shareMessage)}`;
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
        document.getElementById("how-to-play-3").style.display = "block";
        document.querySelectorAll(".hint-line.spacer").forEach(spacer => spacer.style.display = "block");
        document.getElementById("hint-btn").disabled = true;
        document.getElementById("hint-btn").style.display = "block";
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

    function loadMeatballGame(game) {
        meatballSecretWord = game["Solution"].toUpperCase();
        meatballAnagram = game["Anagram"].toUpperCase();
        document.getElementById("meatball-relating").textContent = meatballAnagram;
    }

    fetchGameData();
});