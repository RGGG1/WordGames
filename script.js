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
    const createPineappleLink = document.getElementById("create-pineapple-end");
    const guessBtn = document.getElementById("guess-btn");
    const guessesBtn = document.getElementById("guesses-btn");
    const guessesScreen = document.getElementById("guesses-screen");
    const guessesCloseBtn = document.getElementById("guesses-close-btn");

    const officialTab = document.getElementById("official-tab");
    const privateTab = document.getElementById("private-tab");
    const officialContent = document.getElementById("official-games");
    const privateContent = document.getElementById("private-games");

    const officialUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiz6IVPR4cZB9JlbNPC1Km5Jls5wsW3i-G9WYLppmnfPDz2kxb0I-g1BY50wFzuJ0aYgYdyub6VpCd/pub?output=csv";
    const privateUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIMKVHVz5EaVdJ5YfZJwLW72R9aI1Si9p-LX7kc__5-iAMaXz2itGmffgHu0b05_IRvFFAadH64Z-M/pub?output=csv";
    const webAppUrl = "https://script.google.com/macros/s/AKfycbyFVSK9mHruHEaX_ImhUobprQczd3JOQWQ9QzK9qwN0kgaAtOLZ_wk2u8HkGifd8oS15w/exec";

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    let modeToggles = document.querySelectorAll("#mode-toggle");

    if (createPineappleBtn) {
        createPineappleBtn.innerHTML = 'Create a Pineapple<br><span class="tap-here">(tap here)</span><span class="plus">+</span>';
    }

    initializeMode();

    modeToggles.forEach(modeToggle => {
        modeToggle.addEventListener("click", toggleMode);
    });

    function toggleMode(e) {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.toggle("dark-mode");
        const isDarkMode = document.body.classList.contains("dark-mode");
        modeToggles.forEach(btn => {
            btn.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
        localStorage.setItem("pineappleMode", isDarkMode ? "dark" : "light");
        adjustBackground();
        console.log("Toggled to", isDarkMode ? "dark mode" : "light mode");
    }

    const input = document.getElementById("guess-input");
    console.log("guess-input element:", input);
    if (input) {
        input.addEventListener("keydown", function handleGuessKeydown(e) {
            if ((e.key === "Enter" || e.key === "NumpadEnter") && !gameOver && !input.disabled && !isProcessingGuess) {
                e.preventDefault();
                const guess = input.value.trim();
                if (guess) {
                    isProcessingGuess = true;
                    console.log("Guess submitted via Enter:", guess);
                    handleGuess(guess);
                    setTimeout(() => { isProcessingGuess = false; }, 100);
                }
            }
        });

        input.addEventListener("input", (e) => {
            console.log("Input value changed:", input.value);
        });
    } else {
        console.error("guess-input not found in DOM");
    }

    if (guessBtn) {
        console.log("guess-btn element:", guessBtn);
        guessBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (!gameOver && !input.disabled && !isProcessingGuess) {
                const guess = input.value.trim();
                if (guess) {
                    isProcessingGuess = true;
                    console.log("Guess submitted via button:", guess);
                    handleGuess(guess);
                    setTimeout(() => { isProcessingGuess = false; }, 100);
                }
            }
        });
    } else {
        console.error("guess-btn not found in DOM");
    }

    if (input) {
        input.addEventListener("compositionend", (e) => {
            if (!gameOver && !input.disabled && !isProcessingGuess && isMobile) {
                const guess = input.value.trim();
                if (guess) {
                    isProcessingGuess = true;
                    console.log("Guess submitted via mobile autocomplete:", guess);
                    handleGuess(guess);
                    setTimeout(() => { isProcessingGuess = false; }, 100);
                }
            }
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
        officialContent.style.display = "flex";
        privateContent.classList.remove("active");
        privateContent.style.display = "none";
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
        keepKeyboardOpen();
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
            console.log("Create Pineapple end button clicked");
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
                console.log("Sending form data to web app:", formData);
                const response = await fetch(webAppUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({ data: JSON.stringify(formData) }).toString()
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
                // Add a delay to allow the spreadsheet to update
                await new Promise(resolve => setTimeout(resolve, 2000));
                await fetchPrivateGames();
                displayGameList();
                adjustBackground();
            } catch (error) {
                console.error("Error submitting form:", error);
                alert("Failed to create game: " + error.message);
                // Fallback: Add the game to the local privateGames array for the current session
                const newGame = {
                    "Game Name": formData.gameName,
                    "Secret Word": formData.secretWord,
                    "Hint 1": formData.hint1,
                    "Hint 2": formData.hint2,
                    "Hint 3": formData.hint3,
                    "Hint 4": formData.hint4,
                    "Hint 5": formData.hint5,
                    "Game Number": String(privateGames.length + 1),
                    "Display Name": `Game #${privateGames.length + 1} - ${formData.gameName}`
                };
                privateGames.unshift(newGame);
                console.log("Added game to local privateGames as fallback:", newGame);
                createForm.style.display = "none";
                resetScreenDisplays();
                gameSelectScreen.style.display = "flex";
                privateTab.classList.add("active");
                officialTab.classList.remove("active");
                privateContent.classList.add("active");
                privateContent.style.display = "flex";
                officialContent.classList.remove("active");
                officialContent.style.display = "none";
                displayGameList();
                adjustBackground();
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
            if (guessesScreen.style.display === "flex") {
                guessesScreen.style.display = "none";
                gameScreen.style.display = "flex";
                keepKeyboardOpen();
            } else {
                guessesList.innerHTML = guesses.length > 0 
                    ? guesses.join(' <span class="separator">|</span>   ')
                    : "No guesses yet!";
                guessesScreen.style.display = "flex";
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
                { "Game Number": "1", "Secret Word": "ERROR", "Hint 1": "UNABLE", "Hint 2": "TO", "Hint 3": "LOAD", "Hint 4": "DATA", "Hint 5": "CHECK" }
            ];
            console.log("Using fallback game:", allGames);
            loadGame(allGames[0]);
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            updateHintCountdown();
            adjustBackground();
            setupEventListeners();
            if (isMobile) keepKeyboardOpen();
            alert("Failed to load official games data. Using fallback game.");
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
            document.getElementById("game-name").textContent = "PINEAPPLE";
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
                    const guesses = pastResult && pastResult.completed ? (pastResult.guesses !== "Gave Up" ? pastResult.guesses : "Gave Up") : "-";
                    const showSecretWord = pastResult && pastResult.completed;
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
                    console.log(`Checking private game ${gameNumber}: pastResult=`, pastResult);
                    const guesses = pastResult && pastResult.completed ? (pastResult.guesses !== "Gave Up" ? pastResult.guesses : "Gave Up") : "-";
                    const showSecretWord = pastResult && pastResult.completed;
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

    function initializeMode() {
        const savedMode = localStorage.getItem("pineappleMode");
        if (savedMode === "light") {
            document.body.classList.remove("dark-mode");
        } else {
            document.body.classList.add("dark-mode");
        }
        modeToggles.forEach(btn => {
            btn.innerHTML = document.body.classList.contains("dark-mode") ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
        adjustBackground();
    }

    function setupEventListeners() {
        const gameControls = document.getElementById("game-controls");
        let keyboardInitiated = false;

        if (gameControls) gameControls.addEventListener("click", (e) => e.stopPropagation());

        document.addEventListener("click", (e) => {
            if (!gameOver && gameScreen.style.display === "flex" && 
                !gameControls.contains(e.target) && !e.target.closest("button") && e.target.id !== "game-name") {
                if (!keyboardInitiated) {
                    input.focus();
                    keyboardInitiated = true;
                    console.log("Input focused on click");
                }
                if (firstGuessMade && !gameOver) {
                    input.focus();
                    console.log("Input refocused after first guess");
                }
            }
        });
    }

    function loadGame(game) {
        console.log("Loading game:", game);
        currentGameNumber = game["Game Number"];
        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"]?.toUpperCase() || "",
            game["Hint 2"]?.toUpperCase() || "",
            game["Hint 3"]?.toUpperCase() || "",
            game["Hint 4"]?.toUpperCase() || "",
            game["Hint 5"]?.toUpperCase() || ""
        ].filter(hint => hint);
        console.log("Loaded hints:", hints);

        hintIndex = 0;
        guessCount = 0;
        gaveUp = false;
        gameOver = false;
        firstGuessMade = false;
        guesses = [];

        const resultsKey = game["Game Name"] ? "privatePineappleResults" : "pineappleResults";
        const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
        const pastResult = results[currentGameNumber];
        if (pastResult && pastResult.completed) {
            gameOver = true;
            gaveUp = pastResult.guesses === "Gave Up";
            guessCount = pastResult.guesses === "Gave Up" ? 0 : pastResult.guesses;
            console.log("Game already completed:", pastResult);
        }

        updateGameDisplay();
        updateScoreDisplay();
        updateHintCountdown();
        if (input) {
            input.value = "";
            input.disabled = gameOver;
            input.focus();
        }
        if (guessBtn) guessBtn.disabled = gameOver;
    }

    function updateGameDisplay() {
        const hintsBox = document.getElementById("hints-box");
        const gameNumberLabel = document.createElement("div");
        gameNumberLabel.className = "game-number-label";
        gameNumberLabel.textContent = `Game #${currentGameNumber}`;
        if (hintsBox) {
            hintsBox.innerHTML = "";
            hintsBox.appendChild(gameNumberLabel);

            const hintsTitle = document.createElement("div");
            hintsTitle.id = "hints-title";
            hintsTitle.textContent = "Hints";
            hintsBox.appendChild(hintsTitle);

            const hintCountdown = document.createElement("div");
            hintCountdown.className = "hint-countdown";
            hintCountdown.id = "hint-countdown";
            hintsBox.appendChild(hintCountdown);

            const hintsDiv = document.createElement("div");
            hintsDiv.id = "hints";
            hintsBox.appendChild(hintsDiv);

            if (!firstGuessMade) {
                const howToPlay1 = document.createElement("div");
                howToPlay1.id = "how-to-play-1";
                howToPlay1.textContent = "Guess secret word in as few guesses as possible.";
                hintsDiv.appendChild(howToPlay1);

                const howToPlay2 = document.createElement("div");
                howToPlay2.id = "how-to-play-2";
                howToPlay2.textContent = "New hints are revealed after every five guesses.";
                hintsDiv.appendChild(howToPlay2);
            } else {
                for (let i = 0; i <= hintIndex && i < hints.length; i++) {
                    const hintLine = document.createElement("div");
                    hintLine.className = "hint-line";
                    const hintSpan = document.createElement("span");
                    hintSpan.textContent = hints[i];
                    hintLine.appendChild(hintSpan);
                    hintsDiv.appendChild(hintLine);
                }

                if (hintIndex < hints.length - 1) {
                    const spacer = document.createElement("div");
                    spacer.className = "hint-line spacer";
                    hintsDiv.appendChild(spacer);
                }
            }
        }

        const guessCountDisplay = document.getElementById("guess-count");
        if (guessCountDisplay) {
            guessCountDisplay.textContent = `Guesses: ${guessCount}`;
        }

        const giveUpBtn = document.getElementById("give-up-btn");
        if (giveUpBtn) {
            giveUpBtn.disabled = gameOver;
            giveUpBtn.addEventListener("click", () => {
                gaveUp = true;
                gameOver = true;
                saveGameResult("Gave Up");
                showGameOver();
            });
        }

        const prevBtn = document.getElementById("prev-btn");
        const nextBtn = document.getElementById("next-btn");
        if (prevBtn && nextBtn) {
            const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
            prevBtn.disabled = currentIndex === allGames.length - 1;
            nextBtn.disabled = currentIndex === 0;

            prevBtn.onclick = () => {
                const newIndex = currentIndex + 1;
                if (newIndex < allGames.length) {
                    loadGame(allGames[newIndex]);
                    resetScreenDisplays();
                    gameScreen.style.display = "flex";
                    adjustBackground();
                    keepKeyboardOpen();
                }
            };

            nextBtn.onclick = () => {
                const newIndex = currentIndex - 1;
                if (newIndex >= 0) {
                    loadGame(allGames[newIndex]);
                    resetScreenDisplays();
                    gameScreen.style.display = "flex";
                    adjustBackground();
                    keepKeyboardOpen();
                }
            };
        }
    }

    function updateScoreDisplay() {
        const scoreDisplay = document.getElementById("score");
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${score}`;
        }
    }

    function updateHintCountdown() {
        const hintCountdown = document.getElementById("hint-countdown");
        if (hintCountdown) {
            if (!firstGuessMade) {
                hintCountdown.textContent = "(hint revealed after 1 guess)";
            } else if (hintIndex < hints.length - 1) {
                const guessesUntilNextHint = 5 - (guessCount % 5);
                hintCountdown.textContent = `(hint revealed after ${guessesUntilNextHint} guess${guessesUntilNextHint > 1 ? "es" : ""})`;
            } else {
                hintCountdown.textContent = "";
            }
        }
    }

    function handleGuess(guess) {
        guess = guess.toUpperCase();
        console.log("Handling guess:", guess, "Secret word:", secretWord);

        if (!firstGuessMade) {
            firstGuessMade = true;
            updateGameDisplay();
        }

        guessCount++;
        guesses.push(guess);
        updateGameDisplay();
        updateHintCountdown();

        if (guess === secretWord) {
            gameOver = true;
            score += 100 - guessCount;
            updateScoreDisplay();
            saveGameResult(guessCount);
            showGameOver();
        } else {
            input.classList.add("wrong-guess");
            setTimeout(() => {
                input.value = "";
                input.classList.remove("wrong-guess");
                input.focus();
            }, 500);

            if (guessCount % 5 === 0 && hintIndex < hints.length - 1) {
                hintIndex++;
                updateGameDisplay();
            }
        }
    }

    function saveGameResult(guesses) {
        const resultsKey = privateGames.some(game => game["Game Number"] === currentGameNumber) ? "privatePineappleResults" : "pineappleResults";
        const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
        results[currentGameNumber] = {
            guesses: guesses,
            secretWord: secretWord,
            completed: true // Explicitly mark the game as completed
        };
        localStorage.setItem(resultsKey, JSON.stringify(results));
        console.log(`Saved result for game ${currentGameNumber}:`, results[currentGameNumber]);
    }

    function showGameOver() {
        resetScreenDisplays();
        gameOverScreen.style.display = "flex";
        const todaysWord = document.getElementById("todays-word");
        if (todaysWord) todaysWord.textContent = secretWord;

        const shareText = document.getElementById("share-text");
        const shareGameNumber = document.getElementById("share-game-number");
        const shareScore = document.getElementById("share-score");
        if (shareText && shareGameNumber && shareScore) {
            shareGameNumber.textContent = `Game #${currentGameNumber}`;
            shareScore.textContent = gaveUp ? "Gave Up" : guessCount;
            shareText.innerHTML = `I ${gaveUp ? "gave up on" : "solved"} Pineapple Game #${currentGameNumber}!\n` +
                                 `The word was ${secretWord}.\n` +
                                 `${gaveUp ? "I gave up" : `It took me ${guessCount} guess${guessCount === 1 ? "" : "es"}`}\n` +
                                 `Score: ${score}`;
        }

        if (!gaveUp) {
            const pineappleRain = document.createElement("div");
            pineappleRain.className = "pineapple-rain";
            for (let i = 0; i < 20; i++) {
                const piece = document.createElement("div");
                piece.className = "pineapple-piece";
                piece.textContent = "🍍";
                piece.style.left = `${Math.random() * 100}vw`;
                piece.style.animationDuration = `${Math.random() * 3 + 2}s`;
                piece.style.animationDelay = `${Math.random() * 2}s`;
                piece.style.fontSize = `${Math.random() * 2 + 1}vh`;
                pineappleRain.appendChild(piece);
            }
            gameOverScreen.appendChild(pineappleRain);
        }

        adjustBackground();
    }

    function adjustBackground() {
        const adBox = document.getElementById("ad-box");
        if (adBox) {
            adBox.style.display = "flex";
        }
    }

    function keepKeyboardOpen() {
        if (isMobile && input) {
            input.focus();
            console.log("Keeping keyboard open on mobile");
        }
    }

    await fetchGameData();
    await fetchPrivateGames();
    displayGameList();
});