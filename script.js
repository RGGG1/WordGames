document.addEventListener("DOMContentLoaded", () => {
    // URLs for spreadsheets
    const officialUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiz6IVPR4cZB9JlbNPC1Km5Jls5wsW3i-G9WYLppmnfPDz2kxb0I-g1BY50wFzuJ0aYgYdyub6VpCd/pub?output=csv";
    const defaultBackground = "newbackground.png";

    // State
    let games = [];
    let currentGame = null;
    let guessCount = 0;
    let hintIndex = 0;
    let gameOver = false;
    let guesses = [];

    // DOM elements
    const guessInput = document.getElementById("guess-input");
    const guessBtn = document.getElementById("guess-btn");
    const hintsList = document.getElementById("hints-list");
    const guessCountDisplay = document.getElementById("guess-count");
    const shareBtn = document.getElementById("share-btn");
    const backgroundHeader = document.getElementById("background-header");
    const errorDialog = document.getElementById("error-dialog");
    const errorMessage = document.getElementById("error-message");
    const errorOkBtn = document.getElementById("error-ok-btn");

    // Fallback game data
    const fallbackGames = [
        { id: "1", secretWord: "APPLE", hints: ["FRUIT", "RED", "JUICY", "TREE", "PIE"], background: defaultBackground },
        { id: "2", secretWord: "BEACH", hints: ["SAND", "OCEAN", "SUN", "WAVES", "RELAX"], background: defaultBackground },
    ];

    // Preload background image
    function preloadBackground(url) {
        return new Promise((resolve) => {
            if (!url || url.trim() === "") {
                console.warn(`Invalid background URL: ${url}, using default: ${defaultBackground}`);
                url = defaultBackground;
            }
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(url);
            img.onerror = () => resolve(defaultBackground);
        });
    }

    // Fetch games
    async function fetchGames() {
        try {
            const response = await fetch(officialUrl);
            if (!response.ok) throw new Error("Failed to fetch games.");
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    games = result.data.map(game => ({
                        id: game["Game Number"],
                        secretWord: game["Secret Word"]?.trim().toUpperCase() || "",
                        hints: [
                            game["Hint 1"]?.trim().toUpperCase() || "",
                            game["Hint 2"]?.trim().toUpperCase() || "",
                            game["Hint 3"]?.trim().toUpperCase() || "",
                            game["Hint 4"]?.trim().toUpperCase() || "",
                            game["Hint 5"]?.trim().toUpperCase() || ""
                        ].filter(hint => hint),
                        background: game["Background"]?.trim() || defaultBackground
                    }));
                    games.sort((a, b) => parseInt(b.id) - parseInt(a.id));
                    console.log("Games fetched:", games.length);
                    loadLatestGame();
                },
                error: (error) => {
                    console.error("Error parsing CSV:", error);
                    showError("Failed to load games.");
                }
            });
        } catch (error) {
            console.error("Error fetching games:", error.message);
            showError("Failed to load games.");
        }
    }

    // Show error dialog
    function showError(message) {
        errorMessage.textContent = message;
        errorDialog.style.display = "flex";
        games = fallbackGames; // Use fallback data
        loadLatestGame();
    }

    // Initialize game
    async function initGame() {
        guessCount = 0;
        hintIndex = 0;
        gameOver = false;
        guesses = [];
        guessInput.value = "";
        guessInput.disabled = false;
        guessBtn.disabled = false;
        guessCountDisplay.textContent = "Guesses: 0/5";
        shareBtn.style.display = "none";
        hintsList.innerHTML = "";
        const backgroundUrl = await preloadBackground(currentGame.background);
        backgroundHeader.style.backgroundImage = `url('${backgroundUrl}')`;
        displayHint();
        guessInput.focus();
    }

    // Load latest game
    function loadLatestGame() {
        if (games.length > 0) {
            currentGame = games[0];
            initGame();
        } else {
            showError("No games available.");
        }
    }

    // Display hint
    function displayHint() {
        if (hintIndex < currentGame.hints.length) {
            const hintElement = document.createElement("div");
            hintElement.textContent = currentGame.hints[hintIndex];
            hintsList.appendChild(hintElement);
            hintIndex++;
        }
    }

    // Handle guess
    function handleGuess() {
        if (gameOver || !guessInput.value.trim()) return;
        const guess = guessInput.value.trim().toUpperCase();

        if (!/^[A-Z\s]+$/.test(guess)) {
            guessInput.classList.add("wrong-guess");
            setTimeout(() => {
                guessInput.classList.remove("wrong-guess");
                guessInput.focus();
            }, 300);
            return;
        }

        guessCount++;
        guesses.push(guess);
        guessCountDisplay.textContent = `Guesses: ${guessCount}/5`;

        if (guess === currentGame.secretWord) {
            endGame(true);
        } else {
            guessInput.classList.add("wrong-guess");
            setTimeout(() => {
                guessInput.classList.remove("wrong-guess");
                if (guessCount >= 5) {
                    endGame(false);
                } else {
                    displayHint();
                }
                guessInput.focus();
            }, 300);
        }
    }

    // End game
    function endGame(won) {
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;
        shareBtn.style.display = "block";

        const shareMessage = won
            ? `I solved WORDY #${currentGame.id} in ${guessCount}/5! 🥳\nPlay at: https://wordy.bigbraingames.net`
            : `I couldn't solve WORDY #${currentGame.id} 😔\nPlay at: https://wordy.bigbraingames.net`;

        shareBtn.onclick = () => {
            navigator.clipboard.writeText(shareMessage).then(() => {
                alert("Result copied to clipboard!");
            });
        };

        if (won) {
            const rain = document.createElement("div");
            rain.className = "pineapple-rain";
            document.body.appendChild(rain);
            for (let i = 0; i < 10; i++) {
                const piece = document.createElement("div");
                piece.className = "pineapple-piece";
                piece.textContent = "🍍";
                piece.style.left = `${Math.random() * 100}%`;
                piece.style.animationDuration = `${Math.random() * 1 + 1}s`;
                rain.appendChild(piece);
            }
            setTimeout(() => rain.remove(), 2000);
        }
    }

    // Event listeners
    guessBtn.addEventListener("click", handleGuess);
    guessInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleGuess();
    });
    errorOkBtn.addEventListener("click", () => {
        errorDialog.style.display = "none";
        guessInput.focus();
    });

    // Start game
    fetchGames();
});