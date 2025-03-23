// Game state
let score = 100;
let decayStarted = false;
let gameOver = false;
let decayStartTime = null;
const secretWord = "BANANA";
const hints = ["FRUIT", "YELLOW", "CURVED", "6-LETTERS", "SWEET", "_ A _ A _ A", "MONKEY", "SLIP", "YUMYUM"];
let hintIndex = 0;
let lastHintScore = 100;
let isTypingNewWord = false;
let lastGuess = "";
let firstGuessMade = false; // Track if the first guess has been made

// Log to confirm version
console.log("YKYK Version: Fixed hint pulse animation, updated share box colors for light/dark mode");

// Initial setup with all positions predefined
document.getElementById("hint-row-1").children[0].textContent = hints[0];
document.getElementById("hint-row-2").children[0].textContent = hints[1];
document.getElementById("hint-row-2").children[2].textContent = hints[2];
document.getElementById("hint-row-3").children[0].textContent = hints[3];
document.getElementById("hint-row-4").children[0].textContent = hints[4];
document.getElementById("hint-row-4").children[2].textContent = hints[5];
document.getElementById("hint-row-5").children[0].textContent = hints[6];

// Hide all hints except the first one initially
document.querySelectorAll(".hint-line span").forEach((span, index) => {
    if (index > 0 && span.textContent) span.style.visibility = "hidden";
});

// Start Screen Logic
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const playNowBtn = document.getElementById("play-now-btn");

playNowBtn.addEventListener("click", () => {
    startScreen.style.display = "none";
    gameScreen.style.display = "flex";
    document.getElementById("guess-input").focus();
});

// Dark mode toggle for all screens
const startModeButton = document.getElementById("start-dark-mode-btn");
const startModeIcon = document.getElementById("start-mode-icon");
const gameModeButton = document.getElementById("dark-mode-btn");
const gameModeIcon = document.getElementById("mode-icon");
const endModeButton = document.getElementById("end-dark-mode-btn");
const endModeIcon = document.getElementById("end-mode-icon");
const sharkIcon = document.getElementById("shark-icon");
const swimmerIcon = document.getElementById("man-icon");

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    
    // Update start screen icon
    if (isDarkMode) {
        startModeIcon.classList.remove("fa-moon");
        startModeIcon.classList.add("fa-sun");
    } else {
        startModeIcon.classList.remove("fa-sun");
        startModeIcon.classList.add("fa-moon");
    }

    // Update game screen icon and icons
    if (isDarkMode) {
        gameModeIcon.classList.remove("fa-moon");
        gameModeIcon.classList.add("fa-sun");
        sharkIcon.src = "shark_dark_bk.png";
        swimmerIcon.src = "swimmer_dark_bk.png";
    } else {
        gameModeIcon.classList.remove("fa-sun");
        gameModeIcon.classList.add("fa-moon");
        sharkIcon.src = "shark_light_bk.png";
        swimmerIcon.src = "swimmer_light_bk.png";
    }

    // Update end screen icon
    if (isDarkMode) {
        endModeIcon.classList.remove("fa-moon");
        endModeIcon.classList.add("fa-sun");
    } else {
        endModeIcon.classList.remove("fa-sun");
        endModeIcon.classList.add("fa-moon");
    }
}

startModeButton.addEventListener("click", toggleDarkMode);
gameModeButton.addEventListener("click", toggleDarkMode);
endModeButton.addEventListener("click", toggleDarkMode);

// Global click handler to keep input focused
document.addEventListener("click", () => {
    const input = document.getElementById("guess-input");
    if (!gameOver && gameScreen.style.display !== "none") {
        input.focus();
    }
});

// Score decay and movement
setInterval(() => {
    if (decayStarted && score > 0 && !gameOver) {
        const elapsed = (Date.now() - decayStartTime) / 1000;
        score = Math.max(0, Math.floor(100 - elapsed));
        document.getElementById("score").textContent = `Score: ${score}`;
        updateGraphic();

        if (score < 100 && score % 10 === 0 && score < lastHintScore && hintIndex < hints.length - 1) {
            hintIndex++;
            revealHint(hintIndex);
            lastHintScore = score;
        }

        if (score <= 0) endGame(false);
    }
}, 50);

// Reveal hint in its final position with delayed pulse effect
function revealHint(index) {
    const allHints = document.querySelectorAll(".hint-line span");
    const visibleHints = Array.from(allHints).filter(span => span.textContent);
    
    // Make the hint visible
    visibleHints[index].style.visibility = "visible";
    
    // Force a reflow to ensure the visibility change is applied before the animation
    void visibleHints[index].offsetWidth;

    // Apply the pulse animation after a 0.1-second delay
    setTimeout(() => {
        requestAnimationFrame(() => {
            visibleHints[index].classList.add("hint-pulse");
        });
    }, 100); // 0.1-second delay
}

// Handle guess input
const input = document.getElementById("guess-input");
const guessBackground = document.getElementById("guess-background");
const guessLine = document.getElementById("guess-line");
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !gameOver) {
        if (lastGuess) {
            input.classList.remove("wrong-guess");
            input.classList.remove("correct-guess");
            input.style.opacity = "1";
            input.style.color = document.body.classList.contains("dark-mode") ? "#FFFFFF" : "#000000"; // Reset color
            input.value = "";
            lastGuess = "";
            guessLine.style.opacity = "1"; // Reset underline visibility
        }
        handleGuess(input.value);
    } else if (e.key.length === 1 && lastGuess) {
        input.classList.remove("wrong-guess");
        input.classList.remove("correct-guess");
        input.style.opacity = "1";
        input.style.color = document.body.classList.contains("dark-mode") ? "#FFFFFF" : "#000000"; // Reset color
        input.value = "";
        lastGuess = "";
        isTypingNewWord = true;
        guessLine.style.opacity = "1"; // Reset underline visibility
    }
});

function handleGuess(guess) {
    const guessDisplay = input;
    const shark = document.getElementById("shark-icon");
    if (!firstGuessMade) {
        firstGuessMade = true;
        decayStarted = true;
        decayStartTime = Date.now();
    }

    if (guess.toUpperCase() === secretWord) {
        guessDisplay.classList.add("correct-guess");
        guessBackground.classList.add("flash-green");
        guessLine.style.opacity = "0"; // Hide underline

        // Dynamically set the shark's width to 1% of its current size
        const currentWidth = shark.offsetWidth;
        shark.style.width = `${currentWidth}px`; // Set current width explicitly to start the transition
        shark.classList.add("shark-exit");

        setTimeout(() => {
            guessDisplay.classList.remove("correct-guess");
            guessBackground.classList.remove("flash-green");
            shark.classList.remove("shark-exit");
            endGame(true);
        }, 1500); // Transition to end screen after 1.5 seconds
    } else {
        lastGuess = guess;
        guessDisplay.classList.add("wrong-guess");
        setTimeout(() => {
            if (!isTypingNewWord && lastGuess) {
                guessDisplay.classList.remove("wrong-guess");
                guessDisplay.style.opacity = "1";
                guessDisplay.style.color = document.body.classList.contains("dark-mode") ? "#FFFFFF" : "#000000"; // Reset color
                guessDisplay.value = "";
                lastGuess = "";
            }
            if (!gameOver) {
                guessDisplay.focus();
            }
            isTypingNewWord = false;
        }, 500);
    }
}

// Update shark position and size (left-to-right movement)
function updateGraphic() {
    const shark = document.getElementById("shark-icon");
    const graphic = document.getElementById("graphic");
    const graphicWidth = graphic.offsetWidth;
    const sharkWidth = shark.offsetWidth;

    if (decayStarted && !shark.classList.contains("shark-exit")) { // Skip if exiting
        const elapsed = (Date.now() - decayStartTime) / 1000;
        const progress = Math.min(elapsed / 100, 1);

        // Left-to-right movement: left: 0 to right: 0 (graphicWidth - sharkWidth)
        const sharkMaxX = graphicWidth - sharkWidth;
        const sharkX = progress * sharkMaxX;
        shark.style.left = `${sharkX}px`;

        // Size increase: 45px (75% of 60px) to 300px (500% of 60px)
        const sharkSize = 45 + (progress * (300 - 45));
        shark.style.width = `${sharkSize}px`;
    }
}

// End game logic
function endGame(won) {
    gameOver = true;
    const go = document.getElementById("game-over");
    const endMessage = document.getElementById("end-message");
    const shareText = document.getElementById("share-text");
    const shareScore = document.getElementById("share-score");
    const shareLink = document.getElementById("share-link");
    const shareWhatsApp = document.getElementById("share-whatsapp");
    const shareTelegram = document.getElementById("share-telegram");
    const shareTwitter = document.getElementById("share-twitter");

    // Hide the game screen
    gameScreen.style.display = "none";
    go.style.display = "flex";

    // Set end message and share content based on win/lose
    if (won) {
        endMessage.textContent = "You survived the shark";
        shareText.textContent = "I survived the shark";
    } else {
        endMessage.textContent = "You are shark food!\nnhom-nhom!";
        shareText.textContent = "I am shark food";
    }

    shareScore.textContent = `${score}`; // Score below the label, no colon
    shareLink.href = "https://your-game-url.com"; // Replace with your actual game URL

    // Share URLs
    const shareMessage = `${shareText.textContent}\nScore: ${score}\nThink you can beat my score? Play now: https://your-game-url.com`;
    shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://your-game-url.com")}&text=${encodeURIComponent(shareMessage)}`;
    shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;

    // Home button to return to start screen
    document.getElementById("home-btn").onclick = () => {
        // Reset game state
        score = 100;
        decayStarted = false;
        gameOver = false;
        decayStartTime = null;
        hintIndex = 0;
        lastHintScore = 100;
        isTypingNewWord = false;
        lastGuess = "";
        firstGuessMade = false;
        document.getElementById("score").textContent = `Score: ${score}`;
        document.getElementById("guess-input").value = "";
        document.getElementById("guess-line").style.opacity = "1";
        document.getElementById("shark-icon").style.left = "0px";
        document.getElementById("shark-icon").style.width = "45px";
        document.querySelectorAll(".hint-line span").forEach((span, index) => {
            if (index > 0 && span.textContent) span.style.visibility = "hidden";
        });

        // Show start screen, hide game and end screens
        startScreen.style.display = "flex";
        gameScreen.style.display = "none";
        go.style.display = "none";
    };
}