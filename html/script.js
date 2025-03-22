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

// Log to confirm version
console.log("YKYK Version: Swimmer corrected to swimmer_dark_bk_gif.gif for dark mode, light mode unchanged");

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

// Auto-focus input on page load
window.onload = () => {
    document.getElementById("guess-input").focus();
};

// Dark mode toggle
const modeButton = document.getElementById("dark-mode-btn");
const modeIcon = document.getElementById("mode-icon");
const sharkIcon = document.getElementById("shark-icon");
const swimmerIcon = document.getElementById("man-icon");

modeButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
        modeIcon.classList.remove("fa-moon");
        modeIcon.classList.add("fa-sun");
        sharkIcon.src = "shark_dark_bk_gif.gif";
        swimmerIcon.src = "swimmer_dark_bk_gif.gif"; // GIF for dark mode
    } else {
        modeIcon.classList.remove("fa-sun");
        modeIcon.classList.add("fa-moon");
        sharkIcon.src = "shark_light_bk.png";
        swimmerIcon.src = "swimmer_light_bk.png"; // PNG for light mode
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

// Reveal hint in its final position
function revealHint(index) {
    const allHints = document.querySelectorAll(".hint-line span");
    const visibleHints = Array.from(allHints).filter(span => span.textContent);
    visibleHints[index].style.visibility = "visible";
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
    if (!decayStarted) {
        decayStarted = true;
        decayStartTime = Date.now();
    }

    if (guess.toUpperCase() === secretWord) {
        guessDisplay.classList.add("correct-guess");
        guessBackground.classList.add("flash-green");
        guessLine.style.opacity = "0"; // Hide underline
        shark.classList.add("shrink"); // Shrink and move shark
        setTimeout(() => {
            guessDisplay.classList.remove("correct-guess");
            guessBackground.classList.remove("flash-green");
            shark.classList.remove("shrink");
            endGame(true);
        }, 1000);
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
            guessDisplay.focus();
            isTypingNewWord = false;
        }, 500);
    }
}

// Update shark position and size
function updateGraphic() {
    const shark = document.getElementById("shark-icon");
    const graphic = document.getElementById("graphic");
    const graphicWidth = graphic.offsetWidth;
    const graphicHeight = graphic.offsetHeight;
    const sharkWidth = shark.offsetWidth;
    const sharkHeight = shark.offsetHeight;

    if (decayStarted && !shark.classList.contains("shrink")) { // Skip if shrinking
        const elapsed = (Date.now() - decayStartTime) / 1000;
        const progress = Math.min(elapsed / 100, 1);

        // Diagonal movement: top-left (0, 0) to bottom-right (width - sharkWidth, height - sharkHeight)
        const sharkMaxX = graphicWidth - sharkWidth;
        const sharkMaxY = graphicHeight - sharkHeight;
        const sharkX = progress * sharkMaxX;
        const sharkY = progress * sharkMaxY;
        shark.style.left = `${sharkX}px`;
        shark.style.top = `${sharkY}px`;

        // Size increase: 45px (75% of 60px) to 300px (500% of 60px)
        const sharkSize = 45 + (progress * (300 - 45));
        shark.style.width = `${sharkSize}px`;
    }
}

// End game logic
function endGame(won) {
    gameOver = true;
    const go = document.getElementById("game-over");
    go.classList.add(won ? "win" : "lose");
    go.style.display = "flex";
    document.getElementById("secret-word").textContent = `Secret Word: ${secretWord}`;
    document.getElementById("final-score").textContent = `Your Score: ${score}`;
    document.getElementById("next-game").textContent = `Next game begins in ${60 - new Date().getMinutes()} minutes`;
    document.getElementById("share-btn").onclick = () => {
        const shareText = `YKYK, Player123, "I found the secret word!", Score: ${score}`;
        alert(`Share: ${shareText}`);
    };
}