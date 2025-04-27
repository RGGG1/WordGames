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
    let currentBackground = "newbackground.png";

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
    const guessInputContainer = document.getElementById("guess-input-container");
    const formErrorDialog = document.getElementById("form-error-dialog");
    const formErrorOkBtn = document.getElementById("form-error-ok-btn");
    const formErrorMessage = formErrorDialog?.querySelector(".dialog-message");
    const keyboardContainer = document.getElementById("keyboard-container");
    const keyboardBackBtn = document.getElementById("keyboard-back-btn");
    const keyboardContent = document.getElementById("keyboard-content");
    const keyboardGuessesContent = document.getElementById("keyboard-guesses-content");
    const keyboardGiveUpContent = document.getElementById("keyboard-give-up-content");

    const officialTab = document.getElementById("official-tab");
    const privateTab = document.getElementById("private-tab");
    const officialContent = document.getElementById("official-games");
    const privateContent = document.getElementById("private-games");

    const officialUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiz6IVPR4cZB9JlbNPC1Km5Jls5wsW3i-G9WYLppmnfPDz2kxb0I-g1BY50wFzuJ0aYgYdyub6VpCd/pub?output=csv";
    const privateUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIMKVHVz5EaVdJ5YfZJwLW72R9aI1Si9p-LX7kc__5-iAMaXz2itGmffgHu0b05_IRvFFAadH64Z-M/pub?output=csv";
    const webAppUrl = "https://script.google.com/macros/s/AKfycbyFVSK9mHruHEaX_ImhUobprQczd3JOQWQ9QzK9qwN0kgaAtOLZ_wk2u8HkGifd8oS15w/exec";
    const defaultBackground = "newbackground.png";

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const initializeKeyboard = () => {
        const keys = document.querySelectorAll(".key");
        keys.forEach(key => {
            key.addEventListener("click", () => {
                const letter = key.textContent.toUpperCase();
                if (letter === "ENTER") {
                    handleGuess(guessInput.value.toUpperCase());
                } else if (letter === "") {
                    guessInput.value = guessInput.value.slice(0, -1);
                } else {
                    guessInput.value += letter;
                }
                guessInput.dispatchEvent(new Event("input"));
            });
        });

        if (keyboardBackBtn) {
            keyboardBackBtn.addEventListener("click", () => {
                keyboardContainer.classList.remove("show-guesses", "show-give-up");
                keyboardContent.style.display = "flex";
                keyboardGuessesContent.style.display = "none";
                keyboardGiveUpContent.style.display = "none";
            });
        }

        const keyboardGiveUpYesBtn = document.getElementById("keyboard-give-up-yes-btn");
        const keyboardGiveUpNoBtn = document.getElementById("keyboard-give-up-no-btn");

        if (keyboardGiveUpYesBtn) {
            keyboardGiveUpYesBtn.addEventListener("click", () => {
                gaveUp = true;
                saveGameResult(currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple", currentGameNumber, secretWord, "X");
                endGame(false, false, true);
                keyboardContainer.classList.remove("show-give-up");
                keyboardContent.style.display = "flex";
                keyboardGiveUpContent.style.display = "none";
            });
        }

        if (keyboardGiveUpNoBtn) {
            keyboardGiveUpNoBtn.addEventListener("click", () => {
                keyboardContainer.classList.remove("show-give-up");
                keyboardContent.style.display = "flex";
                keyboardGiveUpContent.style.display = "none";
            });
        }

        const keyboardGuessesCloseBtn = document.getElementById("guesses-close-btn");
        if (keyboardGuessesCloseBtn) {
            keyboardGuessesCloseBtn.addEventListener("click", () => {
                keyboardContainer.classList.remove("show-guesses");
                keyboardContent.style.display = "flex";
                keyboardGuessesContent.style.display = "none";
            });
        }
    };

    const loadCSV = async (url) => {
        try {
            const response = await fetch(url);
            const csvText = await response.text();
            return new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (result) => resolve(result.data),
                    error: (error) => reject(error),
                });
            });
        } catch (error) {
            console.error("Error loading CSV:", error);
            return [];
        }
    };

    const getTodayGameNumber = (games) => {
        const today = new Date();
        const startDate = new Date("2023-11-29");
        const diffTime = Math.abs(today - startDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays % games.length;
    };

    const loadGames = async () => {
        allGames = await loadCSV(officialUrl);
        privateGames = await loadCSV(privateUrl);
        console.log("Loaded games:", allGames.length, "official,", privateGames.length, "private");
    };

    const saveGameResult = (gameType, gameNumber, result, status = null) => {
        const gameResults = JSON.parse(localStorage.getItem(gameType) || "{}");
        gameResults[gameNumber] = { result, status: status || result, timestamp: new Date().toISOString() };
        localStorage.setItem(gameType, JSON.stringify(gameResults));
        console.log(`Saved ${gameType} result for game ${gameNumber}:`, gameResults[gameNumber]);
    };

    const getGameResult = (gameType, gameNumber) => {
        const gameResults = JSON.parse(localStorage.getItem(gameType) || "{}");
        return gameResults[gameNumber] || null;
    };

    const setBackground = (background) => {
        currentBackground = background || defaultBackground;
        gameScreen.style.backgroundImage = `url('${currentBackground}')`;
        gameScreen.style.backgroundSize = "100% calc(100% - 24vh)";
        gameScreen.style.backgroundPosition = "center top";
        gameScreen.style.backgroundAttachment = "fixed";
        gameOverScreen.style.backgroundImage = `url('${currentBackground}')`;
        gameOverScreen.style.backgroundSize = "cover";
        gameOverScreen.style.backgroundPosition = "center center";
        gameOverScreen.style.backgroundAttachment = "fixed";
        gameSelectScreen.style.backgroundImage = `url('${currentBackground}')`;
        gameSelectScreen.style.backgroundSize = "cover";
        gameSelectScreen.style.backgroundPosition = "center center";
        gameSelectScreen.style.backgroundAttachment = "fixed";
        createForm.style.backgroundImage = `url('${currentBackground}')`;
        createForm.style.backgroundSize = "cover";
        createForm.style.backgroundPosition = "center center";
        createForm.style.backgroundAttachment = "fixed";
        console.log("Background set to:", currentBackground);
    };

    const startPineappleRain = () => {
        const container = document.createElement("div");
        container.classList.add("pineapple-rain");
        document.body.appendChild(container);

        const numPieces = 20;
        const emojis = ["🍍", "🌴", "🥥", "🍋", "🍊"];

        for (let i = 0; i < numPieces; i++) {
            const piece = document.createElement("div");
            piece.classList.add("pineapple-piece");
            piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.fontSize = `${Math.random() * 2 + 1}vh`;
            piece.style.animationDuration = `${Math.random() * 3 + 2}s`;
            piece.style.setProperty("--rotation", `${Math.random() * 360 - 180}deg`);
            piece.style.setProperty("--drift", `${Math.random() * 20 - 10}`);
            container.appendChild(piece);
        }

        setTimeout(() => {
            container.remove();
        }, 5000);
    };

    const buildHintHTML = (visibleHints) => {
        return visibleHints.map((hint, idx) => {
            if (idx === 0) return `<span class="hint-text">${hint}</span>`;
            return `<span class="separator"> • </span><span class="hint-text">${hint}</span>`;
        }).join("");
    };

    const updateHintFade = (hintsContainer, visibleHints) => {
        const lines = Math.ceil(hintsContainer.scrollWidth / hintsContainer.offsetWidth);
        hintsContainer.classList.remove("lines-0", "lines-1", "lines-2");
        hintsContainer.classList.add(`lines-${Math.min(lines, 2)}`);
    };

    const revealHint = () => {
        const hintsContainer = document.getElementById("hints-container");
        const visibleHints = hints.slice(0, hintIndex + 1);
        const newHint = hints[hintIndex + 1];
        hintsContainer.innerHTML = buildHintHTML(visibleHints);
        hintsContainer.style.display = "block";

        const hintSpan = document.createElement("span");
        hintSpan.className = "hint-text";
        hintSpan.textContent = "";
        hintsContainer.appendChild(hintSpan);

        let charIndex = 0;
        const typingSpeed = 100;

        function typeLetter() {
            if (charIndex < newHint.length) {
                hintSpan.textContent += newHint[charIndex];
                charIndex++;
                setTimeout(typeLetter, typingSpeed);
            } else {
                hintIndex++;
                hintsContainer.innerHTML = buildHintHTML(hints.slice(0, hintIndex + 1));
                updateHintFade(hintsContainer, hints.slice(0, hintIndex + 1));
            }
        }

        typeLetter();
        console.log("Revealing hint with animation:", newHint);
    };

    const loadGame = async (gameNumber, isPrivate = false) => {
        if (isLoadingGame) return;
        isLoadingGame = true;
        console.log("Loading game:", gameNumber, "Private:", isPrivate);

        const games = isPrivate ? privateGames : allGames;
        const gameType = isPrivate ? "privatePineapple" : "pineapple";
        const game = games.find(g => (isPrivate ? g.name : g.game_number) === gameNumber);

        if (!game) {
            console.error("Game not found:", gameNumber);
            isLoadingGame = false;
            return;
        }

        const savedResult = getGameResult(gameType, gameNumber);
        currentGameNumber = gameNumber;
        secretWord = isPrivate ? game.secret_word.toUpperCase() : game.word.toUpperCase();
        hints = isPrivate
            ? [game.hint_1, game.hint_2, game.hint_3, game.hint_4, game.hint_5].filter(h => h)
            : [game.hint_1, game.hint_2, game.hint_3, game.hint_4, game.hint_5].filter(h => h);
        hintIndex = 0;
        guessCount = 0;
        guesses = [];
        gameOver = false;
        gaveUp = false;
        firstGuessMade = false;
        isProcessingGuess = false;

        if (savedResult && savedResult.status === "X") {
            gaveUp = true;
            endGame(false, false, true);
            isLoadingGame = false;
            return;
        } else if (savedResult && savedResult.status !== "X") {
            guessCount = parseInt(savedResult.status, 10);
            endGame(true);
            isLoadingGame = false;
            return;
        }

        const gameNumberDisplay = document.querySelectorAll(".game-number-display");
        const newGameNumberDisplay = document.getElementById("new-game-number-display");
        const displayText = isPrivate ? `Private Game: ${gameNumber}` : `Game #${gameNumber}`;
        gameNumberDisplay.forEach(display => {
            display.textContent = displayText;
        });
        newGameNumberDisplay.textContent = displayText;

        const hintsContainer = document.getElementById("hints-container");
        hintsContainer.innerHTML = buildHintHTML(hints.slice(0, 1));
        hintsContainer.style.display = "block";
        updateHintFade(hintsContainer, hints.slice(0, 1));

        guessInput.value = "";
        guessInput.disabled = false;
        guessBtn.disabled = false;
        guessesLink.textContent = "Guesses: 0";

        const prevArrow = document.getElementById("prev-game-arrow");
        const nextArrow = document.getElementById("next-game-arrow");
        const currentIndex = games.findIndex(g => (isPrivate ? g.name : g.game_number) === gameNumber);
        prevArrow.classList.toggle("disabled", currentIndex === 0);
        nextArrow.classList.toggle("disabled", currentIndex === games.length - 1);

        setBackground(game.background || defaultBackground);

        gameScreen.style.display = "flex";
        gameOverScreen.style.display = "none";
        gameSelectScreen.style.display = "none";
        createForm.style.display = "none";
        guessesScreen.style.display = "none";

        if (!isMobile) {
            guessInput.focus();
            activeInput = guessInput;
        }

        console.log("Game loaded:", { gameNumber, secretWord, hints });
        isLoadingGame = false;
    };

    const endGame = (won = false, showShare = true, gaveUp = false) => {
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;

        const hardLuckLabel = document.getElementById("hard-luck-label");
        const wellDoneLabel = document.getElementById("well-done-label");
        const todaysWord = document.getElementById("todays-word");
        const shareText = document.getElementById("share-text");
        const shareSection = document.getElementById("share-section");

        hardLuckLabel.style.display = won ? "none" : "block";
        wellDoneLabel.style.display = won ? "block" : "none";
        todaysWord.textContent = gaveUp ? secretWord : (won ? secretWord : "");

        if (showShare) {
            const score = won ? guessCount : "X";
            const gameNumText = currentGameNumber.includes("- Private") ? `Private Game: ${currentGameNumber}` : `Game #${currentGameNumber}`;
            const emoji = won ? "🍍" : "❌";
            const shareMessage = `Wordy ${gameNumText}\n${emoji} Score: ${score}/5\n${won ? "I got it!" : "Better luck next time!"}\n\nPlay at: https://bigbraingames.net/wordy/`;
            shareText.textContent = shareMessage;

            const whatsappLink = document.getElementById("share-whatsapp");
            const telegramLink = document.getElementById("share-telegram");
            const twitterLink = document.getElementById("share-twitter");

            whatsappLink.href = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
            telegramLink.href = `https://t.me/share/url?url=${encodeURIComponent("https://bigbraingames.net/wordy/")}&text=${encodeURIComponent(shareMessage)}`;
            twitterLink.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
            shareSection.style.display = "flex";
        } else {
            shareSection.style.display = "none";
        }

        gameScreen.style.display = "none";
        gameOverScreen.style.display = "flex";
        guessesScreen.style.display = "none";

        if (won) {
            startPineappleRain();
        }

        console.log("Game ended:", { won, guessCount, gaveUp });
    };

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
            saveGameResult(currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple", currentGameNumber, guessCount);
            endGame(true);
        } else {
            console.log("Incorrect guess, animating...");
            const overlay = document.getElementById("wrong-guess-overlay");

            // Step 1: Trigger the red blinking fade for 2 seconds
            overlay.classList.remove("hidden", "white-fade");
            overlay.classList.add("red-fade");

            // Step 2: After 2 seconds, transition to white fade
            setTimeout(() => {
                overlay.classList.remove("red-fade");
                overlay.classList.add("white-fade");

                // Step 3: Reveal the new hint
                if (guessCount === 5) {
                    console.log("Max guesses (5) reached, ending game");
                    saveGameResult(currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple", currentGameNumber, secretWord, "X");
                    endGame(false, false, true);
                    overlay.classList.add("hidden"); // Hide overlay if game ends
                } else if (hintIndex < hints.length - 1) {
                    // Temporarily disable the typing animation for timing control
                    const hintsContainer = document.getElementById("hints-container");
                    const visibleHints = hints.slice(0, hintIndex + 1);
                    const newHint = hints[hintIndex + 1];
                    hintsContainer.innerHTML = buildHintHTML(visibleHints);
                    hintsContainer.style.display = "block";

                    const hintSpan = document.createElement("span");
                    hintSpan.className = "hint-text";
                    hintSpan.textContent = "";
                    hintsContainer.appendChild(hintSpan);

                    let charIndex = 0;
                    const typingSpeed = 100; // 100ms per character
                    function typeLetter() {
                        if (charIndex < newHint.length) {
                            hintSpan.textContent += newHint[charIndex];
                            charIndex++;
                            setTimeout(typeLetter, typingSpeed);
                        } else {
                            // Step 4: Once hint is fully written, remove the white fade
                            hintIndex++;
                            hintsContainer.innerHTML = buildHintHTML(hints.slice(0, hintIndex + 1));
                            updateHintFade(hintsContainer, hints.slice(0, hintIndex + 1));
                            overlay.classList.add("hidden");

                            // Reset input and allow next guess
                            guessContainer.classList.remove("wrong-guess");
                            guessInput.style.opacity = "1";
                            guessInput.style.visibility = "visible";
                            guessInput.style.color = "#000000";
                            isProcessingGuess = false;
                            console.log("Animation and hint reveal completed, input reset");
                            if (guessInput && !isMobile) {
                                guessInput.focus();
                                activeInput = guessInput;
                                guessInput.dispatchEvent(new Event("guessProcessed"));
                            }
                        }
                    }
                    typeLetter();
                    console.log("Revealing hint with animation:", newHint);
                } else {
                    // No new hint to reveal, end the animation
                    overlay.classList.add("hidden");
                    guessContainer.classList.remove("wrong-guess");
                    guessInput.style.opacity = "1";
                    guessInput.style.visibility = "visible";
                    guessInput.style.color = "#000000";
                    isProcessingGuess = false;
                    console.log("No new hint to reveal, animation completed");
                    if (guessInput && !isMobile) {
                        guessInput.focus();
                        activeInput = guessInput;
                        guessInput.dispatchEvent(new Event("guessProcessed"));
                    }
                }
            }, 2000); // 2 seconds for red fade
        }
    }

    const showGameSelectScreen = async () => {
        await loadGames();

        const officialList = document.getElementById("official-list");
        const privateList = document.getElementById("private-list");

        officialList.innerHTML = "";
        privateList.innerHTML = "";

        allGames.forEach(game => {
            const row = document.createElement("div");
            row.classList.add("game-list-row");
            const gameNumber = game.game_number;
            const result = getGameResult("pineapple", gameNumber);
            const word = result && result.status === "X" ? game.word.toUpperCase() : (result ? game.word.toUpperCase() : "???");
            const guesses = result ? result.status : "-";
            const colorClass = result ? (result.status === "X" ? "red" : "green") : "yellow";
            row.innerHTML = `<span>${gameNumber}</span><span class="${colorClass}">${word}</span><span>${guesses}</span>`;
            row.addEventListener("click", () => loadGame(gameNumber));
            officialList.appendChild(row);
        });

        privateGames.forEach(game => {
            const row = document.createElement("div");
            row.classList.add("game-list-row");
            const gameName = game.name;
            const result = getGameResult("privatePineapple", gameName);
            const word = result && result.status === "X" ? game.secret_word.toUpperCase() : (result ? game.secret_word.toUpperCase() : "???");
            const guesses = result ? result.status : "-";
            const colorClass = result ? (result.status === "X" ? "red" : "green") : "yellow";
            row.innerHTML = `<span>${gameName}</span><span class="${colorClass}">${word}</span><span>${guesses}</span>`;
            row.addEventListener("click", () => loadGame(gameName, true));
            privateList.appendChild(row);
        });

        gameScreen.style.display = "none";
        gameOverScreen.style.display = "none";
        gameSelectScreen.style.display = "flex";
        createForm.style.display = "none";
        guessesScreen.style.display = "none";
    };

    const showCreateForm = () => {
        gameScreen.style.display = "none";
        gameOverScreen.style.display = "none";
        gameSelectScreen.style.display = "none";
        createForm.style.display = "flex";
        guessesScreen.style.display = "none";

        document.getElementById("game-name-input").value = "";
        document.getElementById("secret-word").value = "";
        document.getElementById("hint-1").value = "";
        document.getElementById("hint-2").value = "";
        document.getElementById("hint-3").value = "";
        document.getElementById("hint-4").value = "";
        document.getElementById("hint-5").value = "";
    };

    const submitCreateForm = async () => {
        const gameName = document.getElementById("game-name-input").value.trim();
        const secretWord = document.getElementById("secret-word").value.trim().toUpperCase();
        const hint1 = document.getElementById("hint-1").value.trim();
        const hint2 = document.getElementById("hint-2").value.trim();
        const hint3 = document.getElementById("hint-3").value.trim();
        const hint4 = document.getElementById("hint-4").value.trim();
        const hint5 = document.getElementById("hint-5").value.trim();

        if (!gameName || !secretWord || !hint1 || !hint2 || !hint3 || !hint4 || !hint5) {
            formErrorMessage.textContent = "All fields are required!";
            formErrorDialog.style.display = "flex";
            return;
        }

        if (!/^[A-Za-z]+$/.test(secretWord)) {
            formErrorMessage.textContent = "Secret word must contain only letters!";
            formErrorDialog.style.display = "flex";
            return;
        }

        const data = {
            name: gameName,
            secret_word: secretWord,
            hint_1: hint1,
            hint_2: hint2,
            hint_3: hint3,
            hint_4: hint4,
            hint_5: hint5,
        };

        try {
            const response = await fetch(webAppUrl, {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                await loadGames();
                loadGame(gameName, true);
            } else {
                formErrorMessage.textContent = "Failed to create game. Try again!";
                formErrorDialog.style.display = "flex";
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            formErrorMessage.textContent = "An error occurred. Try again!";
            formErrorDialog.style.display = "flex";
        }
    };

    if (guessInput) {
        guessInput.addEventListener("input", () => {
            guessInput.value = guessInput.value.toUpperCase().replace(/[^A-Z]/g, "");
        });

        guessInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !isProcessingGuess && !gameOver) {
                handleGuess(guessInput.value.toUpperCase());
            }
        });

        guessInput.addEventListener("focus", () => {
            activeInput = guessInput;
        });
    }

    if (guessBtn) {
        guessBtn.addEventListener("click", () => {
            if (!isProcessingGuess && !gameOver) {
                handleGuess(guessInput.value.toUpperCase());
            }
        });
    }

    if (guessesLink) {
        guessesLink.addEventListener("click", () => {
            const guessesList = document.getElementById("guesses-list");
            guessesList.innerHTML = guesses.length > 0
                ? guesses.map((guess, idx) => (idx === 0 ? guess : `<span class="separator"> • </span>${guess}`)).join("")
                : "No guesses yet!";

            if (isMobile) {
                keyboardContainer.classList.add("show-guesses");
                keyboardContent.style.display = "none";
                keyboardGuessesContent.style.display = "flex";
            } else {
                guessesScreen.style.display = "flex";
            }
        });
    }

    if (guessesCloseBtn) {
        guessesCloseBtn.addEventListener("click", () => {
            guessesScreen.style.display = "none";
        });
    }

    if (giveUpLink) {
        giveUpLink.addEventListener("click", () => {
            if (gameOver || guessCount === 0) return;
            if (isMobile) {
                keyboardContainer.classList.add("show-give-up");
                keyboardContent.style.display = "none";
                keyboardGiveUpContent.style.display = "flex";
            } else {
                giveUpDialog.style.display = "flex";
            }
        });
    }

    if (giveUpYesBtn) {
        giveUpYesBtn.addEventListener("click", () => {
            gaveUp = true;
            saveGameResult(currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple", currentGameNumber, secretWord, "X");
            endGame(false, false, true);
            giveUpDialog.style.display = "none";
        });
    }

    if (giveUpNoBtn) {
        giveUpNoBtn.addEventListener("click", () => {
            giveUpDialog.style.display = "none";
        });
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener("click", () => {
            const menu = document.getElementById("hamburger-menu");
            menu.style.display = menu.style.display === "block" ? "none" : "block";
        });
    }

    if (homeBtn) {
        homeBtn.addEventListener("click", async () => {
            await loadGames();
            const todayGameNumber = getTodayGameNumber(allGames).toString();
            loadGame(todayGameNumber);
        });
    }

    if (createPineappleBtn) {
        createPineappleBtn.addEventListener("click", showCreateForm);
    }

    if (createPineappleLink) {
        createPineappleLink.addEventListener("click", showCreateForm);
    }

    if (confirmBtn) {
        confirmBtn.addEventListener("click", submitCreateForm);
    }

    if (formBackBtn) {
        formBackBtn.addEventListener("click", showGameSelectScreen);
    }

    if (formErrorOkBtn) {
        formErrorOkBtn.addEventListener("click", () => {
            formErrorDialog.style.display = "none";
        });
    }

    if (allGamesLink) {
        allGamesLink.addEventListener("click", showGameSelectScreen);
    }

    if (officialBackBtn) {
        officialBackBtn.addEventListener("click", async () => {
            await loadGames();
            const todayGameNumber = getTodayGameNumber(allGames).toString();
            loadGame(todayGameNumber);
        });
    }

    if (privateBackBtn) {
        privateBackBtn.addEventListener("click", async () => {
            await loadGames();
            const todayGameNumber = getTodayGameNumber(allGames).toString();
            loadGame(todayGameNumber);
        });
    }

    if (nextGameBtnEnd) {
        nextGameBtnEnd.addEventListener("click", async () => {
            const games = currentGameNumber.includes("- Private") ? privateGames : allGames;
            const currentIndex = games.findIndex(g => (currentGameNumber.includes("- Private") ? g.name : g.game_number) === currentGameNumber);
            if (currentIndex < games.length - 1) {
                const nextGameNumber = currentGameNumber.includes("- Private") ? games[currentIndex + 1].name : games[currentIndex + 1].game_number;
                loadGame(nextGameNumber, currentGameNumber.includes("- Private"));
            }
        });
    }

    if (prevGameArrow) {
        prevGameArrow.addEventListener("click", () => {
            const games = currentGameNumber.includes("- Private") ? privateGames : allGames;
            const currentIndex = games.findIndex(g => (currentGameNumber.includes("- Private") ? g.name : g.game_number) === currentGameNumber);
            if (currentIndex > 0) {
                const prevGameNumber = currentGameNumber.includes("- Private") ? games[currentIndex - 1].name : games[currentIndex - 1].game_number;
                loadGame(prevGameNumber, currentGameNumber.includes("- Private"));
            }
        });
    }

    if (nextGameArrow) {
        nextGameArrow.addEventListener("click", () => {
            const games = currentGameNumber.includes("- Private") ? privateGames : allGames;
            const currentIndex = games.findIndex(g => (currentGameNumber.includes("- Private") ? g.name : g.game_number) === currentGameNumber);
            if (currentIndex < games.length - 1) {
                const nextGameNumber = currentGameNumber.includes("- Private") ? games[currentIndex + 1].name : games[currentIndex + 1].game_number;
                loadGame(nextGameNumber, currentGameNumber.includes("- Private"));
            }
        });
    }

    if (officialTab && privateTab && officialContent && privateContent) {
        officialTab.addEventListener("click", () => {
            officialTab.classList.add("active");
            privateTab.classList.remove("active");
            officialContent.classList.add("active");
            privateContent.classList.remove("active");
        });

        privateTab.addEventListener("click", () => {
            privateTab.classList.add("active");
            officialTab.classList.remove("active");
            privateContent.classList.add("active");
            officialContent.classList.remove("active");
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const menu = document.getElementById("hamburger-menu");
            if (menu.style.display === "block") {
                menu.style.display = "none";
            }
            if (guessesScreen.style.display === "flex") {
                guessesScreen.style.display = "none";
            }
            if (giveUpDialog.style.display === "flex") {
                giveUpDialog.style.display = "none";
            }
            if (formErrorDialog.style.display === "flex") {
                formErrorDialog.style.display = "none";
            }
            if (keyboardContainer.classList.contains("show-guesses") || keyboardContainer.classList.contains("show-give-up")) {
                keyboardContainer.classList.remove("show-guesses", "show-give-up");
                keyboardContent.style.display = "flex";
                keyboardGuessesContent.style.display = "none";
                keyboardGiveUpContent.style.display = "none";
            }
        }
    });

    await loadGames();
    const todayGameNumber = getTodayGameNumber(allGames).toString();
    const urlParams = new URLSearchParams(window.location.search);
    const gameNum = urlParams.get("game");
    const isPrivate = urlParams.get("private") === "true";

    if (gameNum) {
        loadGame(gameNum, isPrivate);
    } else {
        loadGame(todayGameNumber);
    }

    initializeKeyboard();
});