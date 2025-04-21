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

    // Debounce function to limit key press frequency
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

    // Keyboard input handler
    function handleKeyInput(key, inputElement) {
        if (key === "ENTER") {
            // Trigger form submission or guess button if applicable
            if (inputElement.id === "guess-input" && guessBtn) {
                guessBtn.click();
            }
        } else if (key === "BACKSPACE") {
            inputElement.value = inputElement.value.slice(0, -1);
        } else {
            // Allow letters and spaces (for game name and hints)
            if (/^[A-Za-z\s]$/.test(key)) {
                inputElement.value += key.toUpperCase();
            }
        }
    }

    // Setup keyboard for game screen
    function setupGameKeyboard() {
        const input = document.getElementById("guess-input");
        if (!input) {
            console.error("guess-input not found in DOM");
            return;
        }
        input.readOnly = true; // Prevent native keyboard

        // Remove existing listeners to prevent duplicates
        const keys = document.querySelectorAll("#game-screen .key");
        keys.forEach(key => {
            // Clone node to remove all existing listeners
            const newKey = key.cloneNode(true);
            key.parentNode.replaceChild(newKey, key);
        });

        // Add new listeners with debouncing
        const debouncedHandleKey = debounce((keyValue) => {
            handleKeyInput(keyValue, input);
        }, 100);

        document.querySelectorAll("#game-screen .key").forEach(key => {
            const keyValue = key.id === "key-enter" ? "ENTER" : key.id === "key-backspace" ? "BACKSPACE" : key.textContent;
            key.addEventListener("click", () => {
                debouncedHandleKey(keyValue);
            });
        });
    }

    // Setup keyboard for create form
    function setupFormKeyboard() {
        const inputs = [
            document.getElementById("game-name-input"),
            document.getElementById("secret-word"),
            document.getElementById("hint-1"),
            document.getElementById("hint-2"),
            document.getElementById("hint-3"),
            document.getElementById("hint-4"),
            document.getElementById("hint-5")
        ];

        inputs.forEach(input => {
            if (input) {
                input.readOnly = true; // Prevent native keyboard
                input.addEventListener("focus", () => {
                    currentInput = input; // Track active input
                });
            }
        });

        // Remove existing listeners to prevent duplicates
        const keys = document.querySelectorAll("#create-form .key");
        keys.forEach(key => {
            const newKey = key.cloneNode(true);
            key.parentNode.replaceChild(newKey, key);
        });

        // Add new listeners with debouncing
        let currentInput = inputs[0] || document.getElementById("game-name-input");
        const debouncedHandleKey = debounce((keyValue) => {
            if (currentInput) {
                handleKeyInput(keyValue, currentInput);
            }
        }, 100);

        document.querySelectorAll("#create-form .key").forEach(key => {
            const keyValue = key.id === "key-enter" ? "ENTER" : key.id === "key-backspace" ? "BACKSPACE" : key.textContent;
            key.addEventListener("click", () => {
                debouncedHandleKey(keyValue);
            });
        });
    }

    if (hamburgerBtn) {
        console.log("Hamburger button found:", hamburgerBtn);
    }

    const input = document.getElementById("guess-input");

    if (input) {
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
            setupFormKeyboard();
            adjustBackground();
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

    if (formBackBtn) {
        formBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form Back button clicked");
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

    if (confirmBtn) {
        confirmBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Confirm button clicked");

            const gameNameInput = document.getElementById("game-name-input");
            const secretWordInput = document.getElementById("secret-word");
            const hint1Input = document.getElementById("hint-1");
            const hint2Input = document.getElementById("hint-2");
            const hint3Input = document.getElementById("hint-3");
            const hint4Input = document.getElementById("hint-4");
            const hint5Input = document.getElementById("hint-5");

            const gameName = gameNameInput.value.trim();
            const secretWord = secretWordInput.value.trim().toUpperCase();
            const hint1 = hint1Input.value.trim();
            const hint2 = hint2Input.value.trim();
            const hint3 = hint3Input.value.trim();
            const hint4 = hint4Input.value.trim();
            const hint5 = hint5Input.value.trim();

            if (!gameName || !secretWord || !hint1 || !hint2 || !hint3 || !hint4 || !hint5) {
                alert("Please fill in all fields.");
                return;
            }

            if (!/^[A-Z\s]+$/.test(secretWord)) {
                alert("Secret word must contain only letters and spaces.");
                return;
            }

            const formData = new FormData();
            formData.append("Game Name", gameName);
            formData.append("Secret Word", secretWord);
            formData.append("Hint 1", hint1);
            formData.append("Hint 2", hint2);
            formData.append("Hint 3", hint3);
            formData.append("Hint 4", hint4);
            formData.append("Hint 5", hint5);

            try {
                console.log("Submitting form data", { gameName, secretWord, hint1, hint2, hint3, hint4, hint5 });
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    body: formData,
                });

                if (response.ok) {
                    console.log("Game created successfully");
                    gameNameInput.value = "";
                    secretWordInput.value = "";
                    hint1Input.value = "";
                    hint2Input.value = "";
                    hint3Input.value = "";
                    hint4Input.value = "";
                    hint5Input.value = "";
                    resetScreenDisplays();
                    gameSelectScreen.style.display = "flex";
                    privateTab.classList.add("active");
                    officialTab.classList.remove("active");
                    privateContent.classList.add("active");
                    privateContent.style.display = "flex";
                    officialContent.classList.remove("active");
                    officialContent.style.display = "none";
                    if (createForm) createForm.style.display = "none";
                    await loadPrivateGames();
                    displayGameList();
                    adjustBackground();
                } else {
                    console.error("Failed to create game:", response.statusText);
                    alert("Failed to create game. Please try again.");
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                alert("An error occurred. Please try again.");
            }
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

    if (giveUpLink && giveUpDialog && giveUpYesBtn && giveUpNoBtn) {
        giveUpLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up link clicked");
            if (!gameOver) {
                giveUpDialog.style.display = "flex";
            }
        });

        giveUpYesBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up Yes button clicked");
            gaveUp = true;
            giveUpDialog.style.display = "none";
            showGameOverScreen();
        });

        giveUpNoBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up No button clicked");
            giveUpDialog.style.display = "none";
        });
    }

    if (guessesLink && guessesScreen && guessesCloseBtn) {
        guessesLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses link clicked");
            showGuessesScreen();
        });

        guessesCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses Close button clicked");
            guessesScreen.style.display = "none";
        });
    }

    async function loadOfficialGames() {
        try {
            console.log("Loading official games from:", officialUrl);
            const response = await fetch(officialUrl);
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                complete: (result) => {
                    allGames = result.data.filter(row => row["Game Number"] && row["Secret Word"]);
                    console.log("Official games loaded:", allGames.length);
                },
                error: (error) => {
                    console.error("Error parsing official games CSV:", error);
                }
            });
        } catch (error) {
            console.error("Error fetching official games:", error);
        }
    }

    async function loadPrivateGames() {
        try {
            console.log("Loading private games from:", privateUrl);
            const response = await fetch(privateUrl);
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                complete: (result) => {
                    privateGames = result.data.filter(row => row["Game Number"] && row["Secret Word"]);
                    console.log("Private games loaded:", privateGames.length);
                },
                error: (error) => {
                    console.error("Error parsing private games CSV:", error);
                }
            });
        } catch (error) {
            console.error("Error fetching private games:", error);
        }
    }

    function resetScreenDisplays() {
        console.log("Resetting screen displays");
        gameScreen.style.display = "none";
        gameOverScreen.style.display = "none";
        gameSelectScreen.style.display = "none";
        if (createForm) createForm.style.display = "none";
        guessesScreen.style.display = "none";
        giveUpDialog.style.display = "none";
    }

    function adjustBackground() {
        console.log("Adjusting background");
        document.body.style.background = `url('${defaultBackground}') no-repeat center center fixed`;
        document.body.style.backgroundSize = "100% 100%";
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
                    <span>${game["Secret Word"] || "-"}</span>
                    <span>${game["Guesses"] || "-"}</span>
                `;
                row.addEventListener("click", () => {
                    console.log("Official game selected:", game["Game Number"]);
                    loadGame(game);
                    resetScreenDisplays();
                    gameScreen.style.display = "flex";
                    adjustBackground();
                });
                officialList.appendChild(row);
            });
        }

        if (privateList) {
            privateList.innerHTML = "";
            privateGames.forEach(game => {
                const row = document.createElement("div");
                row.className = "game-list-row";
                row.innerHTML = `
                    <span>${game["Game Name"] || game["Game Number"]}</span>
                    <span>${game["Secret Word"] || "-"}</span>
                    <span>${game["Guesses"] || "-"}</span>
                `;
                row.addEventListener("click", () => {
                    console.log("Private game selected:", game["Game Number"]);
                    loadGame(game, true);
                    resetScreenDisplays();
                    gameScreen.style.display = "flex";
                    adjustBackground();
                });
                privateList.appendChild(row);
            });
        }
    }

    function loadGame(game, isPrivate = false) {
        console.log("Loading game", { gameNumber: game["Game Number"], isPrivate });
        isLoadingGame = true;
        gameOver = false;
        score = 0;
        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"],
            game["Hint 2"],
            game["Hint 3"],
            game["Hint 4"],
            game["Hint 5"]
        ].filter(hint => hint);
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        gaveUp = false;
        guesses = [];
        currentGameNumber = isPrivate ? `${game["Game Number"]} - Private` : `Game #${game["Game Number"]}`;

        const gameNumberDisplay = document.querySelectorAll(".game-number-display");
        gameNumberDisplay.forEach(display => {
            display.textContent = currentGameNumber;
        });

        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) {
            hintsContainer.innerHTML = "";
            hintsContainer.className = "hints-inline lines-0";
        }

        const hintCountdown = document.querySelector(".hint-countdown");
        if (hintCountdown) {
            hintCountdown.style.display = "none";
        }

        const countdownSpan = document.getElementById("countdown");
        if (countdownSpan) {
            countdownSpan.textContent = "5";
        }

        if (input) {
            input.value = "";
            input.disabled = false;
        }

        if (guessesLink) {
            guessesLink.textContent = "Guesses: 0";
        }

        setupGameKeyboard();

        let currentIndex;
        let gameList = isPrivate ? privateGames : allGames;
        if (isPrivate) {
            currentIndex = privateGames.findIndex(g => g["Game Number"] === game["Game Number"]);
        } else {
            currentIndex = allGames.findIndex(g => g["Game Number"] === game["Game Number"]);
        }
        updateArrowStates(currentIndex, gameList);

        isLoadingGame = false;
        console.log("Game loaded successfully", { currentGameNumber, secretWord, hints });
    }

    function handleGuess(guess) {
        console.log("Handling guess:", guess);
        if (isProcessingGuess || gameOver) {
            console.log("Guess ignored:", { isProcessingGuess, gameOver });
            return;
        }

        isProcessingGuess = true;
        guessCount++;
        guesses.push(guess);
        firstGuessMade = true;

        const guessContainer = document.getElementById("guess-input-container");
        const hintsContainer = document.getElementById("hints-container");
        const hintCountdown = document.querySelector(".hint-countdown");
        const countdownSpan = document.getElementById("countdown");

        if (guessesLink) {
            guessesLink.textContent = `Guesses: ${guessCount}`;
        }

        if (guess === secretWord) {
            console.log("Correct guess!");
            score = calculateScore();
            gameOver = true;
            showGameOverScreen();
            isProcessingGuess = false;
            return;
        } else {
            console.log("Incorrect guess, triggering animation");
            guessContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessContainer.classList.remove("wrong-guess");
                input.style.opacity = "1";
                input.style.visibility = "visible";
                input.style.color = "#000000";
                input.value = "";
                isProcessingGuess = false;
                animationTimeout = null;
                console.log("Animation complete, state reset");
            }, 350);
        }

        if (hintCountdown && countdownSpan) {
            let guessesUntilNextHint = parseInt(countdownSpan.textContent) - 1;
            countdownSpan.textContent = guessesUntilNextHint;

            if (guessesUntilNextHint <= 0 && hintIndex < hints.length) {
                console.log("Revealing hint:", hints[hintIndex]);
                const hintElement = document.createElement("div");
                hintElement.textContent = hints[hintIndex];
                hintsContainer.appendChild(hintElement);
                hintIndex++;
                guessesUntilNextHint = 5;
                countdownSpan.textContent = guessesUntilNextHint;

                const lines = hintsContainer.childElementCount;
                hintsContainer.className = `hints-inline lines-${Math.min(lines, 2)}`;

                if (hintIndex >= hints.length) {
                    hintCountdown.style.display = "none";
                } else {
                    hintCountdown.style.display = "block";
                }
            } else {
                hintCountdown.style.display = guessesUntilNextHint > 0 && hintIndex < hints.length ? "block" : "none";
            }
        }

        isProcessingGuess = false;
    }

    function calculateScore() {
        console.log("Calculating score", { guessCount, gaveUp });
        if (gaveUp) return 0;
        const baseScore = 100;
        const guessPenalty = guessCount * 10;
        const hintPenalty = hintIndex * 20;
        return Math.max(0, baseScore - guessPenalty - hintPenalty);
    }

    function showGameOverScreen() {
        console.log("Showing game over screen", { score, gaveUp, secretWord });
        resetScreenDisplays();
        gameOverScreen.style.display = "flex";

        const todaysWord = document.getElementById("todays-word");
        const shareScore = document.getElementById("share-score");
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number");
        const shareGameNumber = document.getElementById("share-game-number");

        if (todaysWord) {
            todaysWord.textContent = gaveUp ? secretWord : secretWord;
        }
        if (shareScore) {
            shareScore.textContent = score;
        }
        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }
        if (shareGameNumber) {
            shareGameNumber.textContent = currentGameNumber;
        }
        if (shareText) {
            shareText.innerHTML = `
                <span class="small-game-number">${currentGameNumber}</span><br>
                <span class="big-score">${score}</span><br>
                <span class="italic">Can you beat my score?</span>
            `;
        }

        adjustBackground();
    }

    function showGuessesScreen() {
        console.log("Showing guesses screen", { guesses });
        guessesScreen.style.display = "flex";
        const guessesList = document.getElementById("guesses-list");
        if (guessesList) {
            guessesList.innerHTML = guesses.map((guess, index) => {
                return `${index + 1}. ${guess}${index < guesses.length - 1 ? '<span class="separator"> | </span>' : ''}`;
            }).join("");
        }
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
        adjustBackground();
    }

    // Initialize the game
    console.log("Initializing game");
    await loadOfficialGames();
    await loadPrivateGames();

    if (allGames.length > 0) {
        console.log("Loading latest official game");
        loadGame(allGames[0]);
        resetScreenDisplays();
        gameScreen.style.display = "flex";
        adjustBackground();
    } else {
        console.error("No official games loaded, showing game select screen");
        showGameSelectScreen();
    }
});