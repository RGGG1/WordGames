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
            if (guessesScreen.style.display === "flex") {
                guessesScreen.style.display = "none";
            } else {
                guessesList.innerHTML = guesses.length > 0 
                    ? guesses.join("   |   ")
                    : "No guesses yet!";
                guessesScreen.style.display = "flex";
            }
        });

        guessesCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button clicked");
            guessesScreen.style.display = "none";
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
                        keepKeyboardOpen();
                    });
                    privateList.appendChild(gameItem);
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

        document.getElementById("prev-arrow-btn").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentGameNumber.includes("Private Game #")) {
                const currentNum = parseInt(currentGameNumber.replace("Private Game #", ""));
                const currentIndex = privateGames.findIndex(game => game["Game Number"] === String(currentNum));
                if (currentIndex + 1 < privateGames.length) loadGame(privateGames[currentIndex + 1]);
            } else {
                const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
                if (currentIndex + 1 < allGames.length) loadGame(allGames[currentIndex + 1]);
            }
            keepKeyboardOpen();
        });

        document.getElementById("next-arrow-btn").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentGameNumber.includes("Private Game #")) {
                const currentNum = parseInt(currentGameNumber.replace("Private Game #", ""));
                const currentIndex = privateGames.findIndex(game => game["Game Number"] === String(currentNum));
                if (currentIndex - 1 >= 0) loadGame(privateGames[currentIndex - 1]);
            } else {
                const currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
                if (currentIndex - 1 >= 0) loadGame(allGames[currentIndex - 1]);
            }
            keepKeyboardOpen();
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
            let currentIndex;
            let gameList;

            if (currentGameNumber.includes("Private Game #")) {
                const currentNum = parseInt(currentGameNumber.replace("Private Game #", ""));
                currentIndex = privateGames.findIndex(game => game["Game Number"] === String(currentNum));
                gameList = privateGames;
            } else {
                currentIndex = allGames.findIndex(game => game["Game Number"] === currentGameNumber);
                gameList = allGames;
            }

            if (touchStartX - touchEndX > swipeThreshold && currentIndex > 0) {
                loadGame(gameList[currentIndex - 1]);
            } else if (touchEndX - touchStartX > swipeThreshold && currentIndex < gameList.length - 1) {
                loadGame(gameList[currentIndex + 1]);
            }
            keepKeyboardOpen();
        }

        document.getElementById("give-up-btn").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            gaveUp = true;
            let originalGameNumber;
            if (currentGameNumber.includes("Private Game #")) {
                const currentNum = parseInt(currentGameNumber.replace("Private Game #", ""));
                const privateGame = privateGames.find(game => game["Game Number"] === String(currentNum));
                originalGameNumber = privateGame ? privateGame["Game Number"] : currentGameNumber;
            } else {
                originalGameNumber = currentGameNumber;
            }
            const gameType = currentGameNumber.includes("Private") ? "privatePineapple" : "pineapple";
            saveGameResult(gameType, originalGameNumber, secretWord, "Gave Up");
            endGame(false, true);
        });

        input.addEventListener("focus", () => {
            console.log("Input focused");
        });
    }

    function keepKeyboardOpen() {
        const input = document.getElementById("guess-input");
        if (!gameOver && gameScreen.style.display === "flex" && !input.disabled) {
            input.focus();
            console.log("Keyboard kept open, input disabled:", input.disabled);
            if (isMobile) {
                setTimeout(() => {
                    if (document.activeElement !== input) {
                        input.focus();
                        console.log("Forced focus on mobile");
                    }
                }, 50);
            }
        } else {
            console.log("Cannot keep keyboard open:", { gameOver, gameScreenDisplay: gameScreen.style.display, inputDisabled: input.disabled });
        }
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
                screen.style.height = "100vh";
            }
        });
    }

    window.addEventListener("resize", adjustBackground);

    function revealHint() {
        hintIndex++;
        const allHintSpan = document.querySelectorAll(".hint-line span");
        if (hintIndex < allHintSpan.length && allHintSpan[hintIndex].textContent) {
            allHintSpan[hintIndex].style.visibility = "visible";
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
                pineapple.style.animationDuration = `${Math.random() * 2 + 2}s`;
                pineapple.style.animationDelay = `${startDelay + Math.random() * 0.5}s`;
                pineappleContainer.appendChild(pineapple);
            }
        }

        createPineappleWave(0);
        createPineappleWave(0.875);
        createPineappleWave(1.75);
        createPineappleWave(2.625);
        
        setTimeout(() => pineappleContainer.remove(), 3500);
    }

    function handleGuess(guess) {
        console.log("handleGuess called, guessCount before:", guessCount);
        const guessDisplay = document.getElementById("guess-input");
        const guessLine = document.getElementById("guess-line");
        guessDisplay.value = guess.toUpperCase();
        guessDisplay.classList.remove("wrong-guess");
        guessDisplay.style.opacity = "1";
        guessDisplay.style.visibility = "visible";
        guessDisplay.style.color = document.body.classList.contains("dark-mode") ? "#FFFFFF" : "#000000";
        void guessDisplay.offsetWidth;

        if (!firstGuessMade) {
            firstGuessMade = true;
            document.getElementById("how-to-play-1").remove();
            document.getElementById("how-to-play-2").remove();
            document.querySelectorAll(".hint-line.spacer").forEach(spacer => spacer.remove());
            adjustHintsAfterGuess();
        }

        const upperGuess = guess.toUpperCase();
        const isRepeatGuess = guesses.includes(upperGuess);

        if (!isRepeatGuess) {
            guesses.push(upperGuess);
            guessCount++;
            score = guessCount;
            document.getElementById("guesses-btn").textContent = `Guesses: ${guessCount}`;
            console.log("guessCount after:", guessCount, "score:", score);

            if (guessCount % 5 === 0 && hintIndex < hints.length - 1) revealHint();
            else updateHintCountdown();
        } else {
            console.log("Repeat guess detected, not counting or adding to guesses:", upperGuess);
            document.getElementById("guesses-btn").textContent = `Guesses: ${guessCount}`;
            updateHintCountdown();
        }

        if (upperGuess === secretWord) {
            guessLine.style.opacity = "0";
            gameOver = true;
            let originalGameNumber;
            if (currentGameNumber.includes("Private Game #")) {
                const currentNum = parseInt(currentGameNumber.replace("Private Game #", ""));
                const privateGame = privateGames.find(game => game["Game Number"] === String(currentNum));
                originalGameNumber = privateGame ? privateGame["Game Number"] : currentGameNumber;
            } else {
                originalGameNumber = currentGameNumber;
            }
            const gameType = currentGameNumber.includes("Private") ? "privatePineapple" : "pineapple";
            saveGameResult(gameType, originalGameNumber, secretWord, score);
            endGame(true);
        } else {
            guessDisplay.classList.add("wrong-guess");
            setTimeout(() => {
                guessDisplay.classList.remove("wrong-guess");
                guessDisplay.style.opacity = "1";
                guessDisplay.style.visibility = "visible";
                guessDisplay.style.color = document.body.classList.contains("dark-mode") ? "#FFFFFF" : "#000000";
                guessDisplay.value = "";
                keepKeyboardOpen();
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

        gameNumberSpan.textContent = currentGameNumber;
        todaysWord.textContent = secretWord;

        let shareMessage;
        if (won) {
            endGraphic.src = "pineapple_gif.gif";
            endGraphic.style.display = "block";
            rainPineapples();
            const guessText = score === 1 ? "guess" : "guesses";
            const shareGamePrefix = currentGameNumber.includes("Private") ? "" : "Game #";
            shareText.innerHTML = `<span class="small-game-number">${shareGamePrefix}${currentGameNumber}</span>\nI solved the pineapple in\n<span class="big-score">${score}</span>\n${guessText}`;
            shareMessage = `${shareGamePrefix}${currentGameNumber}\nI solved the pineapple in\n${score}\n${guessText}\nCan you beat my score? Click here: https://your-game-url.com`;
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
            shareMessage = `PLAY PINEAPPLE\n\nThe Big Brain Word Game\nGame #${currentGameNumber}\nCan you beat my score? Click here: https://your-game-url.com`;
        } else {
            endGraphic.src = document.body.classList.contains("dark-mode") ? "sad_pineapple_dark.png" : "sad_pineapple_light.png";
            endGraphic.style.display = "block";
            shareText.textContent = "I didn’t solve the pineapple";
            shareGameNumber.textContent = currentGameNumber;
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
        guesses = [];
        document.getElementById("guesses-btn").textContent = "Guesses: 0";
        const guessInput = document.getElementById("guess-input");
        guessInput.value = "";
        guessInput.placeholder = "";
        guessInput.disabled = false;
        guessInput.style.opacity = "1";
        guessInput.style.visibility = "visible";
        console.log("resetGame: Input disabled set to false, visibility:", guessInput.style.visibility);

        const guessBtn = document.getElementById("guess-btn");
        if (guessBtn) {
            guessBtn.style.opacity = "1";
            guessBtn.style.visibility = "visible";
            console.log("resetGame: Guess button visibility:", guessBtn.style.visibility);
        }

        document.getElementById("guess-line").style.opacity = "1";
        const hintsBox = document.getElementById("hints");
        hintsBox.innerHTML = `
            <div class="hint-line" id="hint-row-1"><span></span></div>
            <div class="hint-line spacer"></div>
            <div class="hint-line" id="how-to-play-1"><b>How to Play</b></div>
            <div class="hint-line" id="how-to-play-2">Guess secret word in as few guesses as possible.<br><br>New hints are revealed after every five guesses.</div>
            <div class="hint-line spacer"></div>
            <div class="hint-line spacer"></div>
            <div class="hint-line" id="hint-row-2"><span></span></div>
            <div class="hint-line" id="hint-row-3"><span></span></div>
            <div class="hint-line" id="hint-row-4"><span></span></div>
            <div class="hint-line" id="hint-row-5"><span></span></div>
        `;
        setupEventListeners();
        setupHints();
        updateHintCountdown();
        keepKeyboardOpen();
    }

    function loadGame(game) {
        resetGame();
        const originalGameNumber = game["Game Number"];
        const privateGame = privateGames.find(g => g["Game Number"] === originalGameNumber);
        if (privateGame) {
            currentGameNumber = `Private Game #${privateGame["Game Number"]}`;
        } else {
            currentGameNumber = originalGameNumber;
        }
        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"], game["Hint 2"], game["Hint 3"],
            game["Hint 4"], game["Hint 5"]
        ].filter(hint => hint).map(hint => hint.toUpperCase());
        console.log("Loaded game:", { currentGameNumber, originalGameNumber, secretWord, hints });
        setupHints();
        if (isMobile) keepKeyboardOpen();
        return originalGameNumber;
    }

    await Promise.all([fetchGameData(), fetchPrivateGames()]);
    console.log("Initial fetch complete, calling displayGameList");
    displayGameList();
});