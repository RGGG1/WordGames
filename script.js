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

    // Initialize cursor
    function initializeCursor() {
        const cursor = document.querySelector(".cursor");
        if (!cursor || !guessInput) {
            console.error("Cursor or guess-input not found in DOM");
            return;
        }

        function updateCursorVisibility() {
            // Cursor is visible only when input is empty and not disabled
            const isEmpty = guessInput.value.trim() === "";
            const isEnabled = !guessInput.disabled;
            cursor.style.display = isEmpty && isEnabled ? "inline-block" : "none";
        }

        updateCursorVisibility();

        // Update on input changes
        guessInput.addEventListener("input", updateCursorVisibility);

        // Update when disabled state changes
        const observer = new MutationObserver(updateCursorVisibility);
        observer.observe(guessInput, { attributes: true, attributeFilter: ["disabled"] });
    }

    if (hamburgerBtn) {
        console.log("Hamburger button found:", hamburgerBtn);
    }

    if (guessInput) {
        guessInput.readOnly = isMobile;
        guessInput.disabled = false;
        guessInput.addEventListener("input", (e) => {
            console.log("Guess input value changed:", guessInput.value);
            if (animationTimeout) {
                clearTimeout(animationTimeout);
                animationTimeout = null;
                const guessContainer = document.getElementById("guess-input-container");
                guessContainer.classList.remove("wrong-guess");
                guessInput.style.opacity = "1";
                guessInput.style.visibility = "visible";
                guessInput.style.color = "#000000";
                guessInput.value = e.target.value.toUpperCase();
                isProcessingGuess = false;
                console.log("Animation cancelled and state reset due to typing");
            }
        });
        guessInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !gameOver && !guessInput.disabled && !isProcessingGuess) {
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Guess submitted via Enter key:", guess);
                    handleGuess(guess);
                }
            }
        });
        guessInput.focus();
        activeInput = guessInput;
    } else {
        console.error("guess-input not found in DOM");
    }

    if (guessArea) {
        guessArea.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
                console.log("Guess area clicked, input focused");
            }
        });
        guessArea.addEventListener("touchstart", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
                console.log("Guess area touched, input focused");
            }
        });
    }

    if (guessBtn) {
        guessBtn.disabled = false;
        guessBtn.removeEventListener("click", guessBtn._clickHandler);
        guessBtn.removeEventListener("touchstart", guessBtn._touchHandler);
        
        const clickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guess button triggered:", { gameOver, disabled: guessInput.disabled, isProcessingGuess, guess: guessInput.value });
            if (!gameOver && !guessInput.disabled && !isProcessingGuess) {
                const guess = guessInput.value.trim().toUpperCase();
                if (guess) {
                    console.log("Submitting guess:", guess);
                    handleGuess(guess);
                    guessInput.focus();
                } else {
                    console.log("No guess entered");
                }
            } else {
                console.log("Guess button ignored due to state");
            }
        };
        
        guessBtn._clickHandler = clickHandler;
        guessBtn._touchHandler = (e) => {
            e.preventDefault();
            clickHandler(e);
        };
        
        guessBtn.addEventListener("click", clickHandler);
        guessBtn.addEventListener("touchstart", guessBtn._touchHandler);
    } else {
        console.error("guess-btn not found in DOM");
    }

    const formInputs = [
        document.getElementById("game-name-input"),
        document.getElementById("secret-word"),
        document.getElementById("hint-1"),
        document.getElementById("hint-2"),
        document.getElementById("hint-3"),
        document.getElementById("hint-4"),
        document.getElementById("hint-5")
    ].filter(input => input);

    formInputs.forEach(input => {
        input.readOnly = false;
        input.disabled = false;
        input.addEventListener("click", () => {
            activeInput = input;
            input.focus();
            console.log("Form input selected:", input.id);
        });
        input.addEventListener("touchstart", (e) => {
            e.preventDefault();
            activeInput = input;
            input.focus();
            console.log("Form input touched:", input.id);
        });
        input.addEventListener("input", () => {
            console.log("Form input updated:", input.id, input.value);
            input.value = input.value.toUpperCase();
        });
    });

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, 50);
        };
    }

    function setupKeyboardListeners() {
        if (!isMobile) {
            console.log("Skipping on-screen keyboard setup on desktop");
            return;
        }
        const keys = document.querySelectorAll("#keyboard-content .key");
        console.log("Setting up keyboard listeners, found keys:", keys.length);
        keys.forEach(key => {
            if (key._clickHandler) {
                key.removeEventListener("click", key._clickHandler);
                key.removeEventListener("touchstart", key._touchHandler);
            }
            const clickHandler = debounce(() => {
                console.log("Key clicked:", key.textContent, { gameOver, isProcessingGuess, activeInput: activeInput?.id });
                if (gameOver || isProcessingGuess || !activeInput || activeInput.disabled) {
                    console.log("Key click ignored due to state");
                    return;
                }
                const keyValue = key.textContent;
                if (key.id === "key-enter") {
                    if (activeInput === guessInput) {
                        const guess = guessInput.value.trim().toUpperCase();
                        if (guess) {
                            console.log("Guess submitted via on-screen Enter:", guess);
                            handleGuess(guess);
                        }
                    }
                } else if (key.id === "key-backspace") {
                    activeInput.value = activeInput.value.slice(0, -1);
                    console.log("Backspace pressed, new value:", activeInput.value);
                } else {
                    activeInput.value += keyValue;
                    console.log("Key added, new value:", activeInput.value);
                }
                activeInput.focus();
            }, 50);
            key._clickHandler = clickHandler;
            key._touchHandler = (e) => {
                e.preventDefault();
                clickHandler();
            };
            key.addEventListener("click", clickHandler);
            key.addEventListener("touchstart", key._touchHandler);
        });
    }

    // Function to show keyboard and hide alternate content
    function showKeyboard() {
        if (keyboardContainer && keyboardContent && keyboardGuessesContent && keyboardGiveUpContent && keyboardBackBtn) {
            keyboardContainer.classList.remove("show-alternate", "show-guesses", "show-give-up");
            keyboardContent.style.display = "block";
            keyboardGuessesContent.style.display = "none";
            keyboardGiveUpContent.style.display = "none";
            keyboardBackBtn.style.display = "none";
            console.log("Showing keyboard");
            if (guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
            if (isMobile) {
                setupKeyboardListeners();
            }
        }
    }

    // Back button handler
    if (keyboardBackBtn) {
        keyboardBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Keyboard back button clicked");
            showKeyboard();
        });
        keyboardBackBtn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            console.log("Keyboard back button touched");
            showKeyboard();
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
            if (keyboardContainer) keyboardContainer.style.display = "none";
            displayGameList();
            setupKeyboardListeners();
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
            if (keyboardContainer) keyboardContainer.style.display = "none";
            displayGameList();
            setupKeyboardListeners();
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
                showKeyboard();
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
                showKeyboard();
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
            if (keyboardContainer) keyboardContainer.style.display = "none";
            displayGameList();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    if (createPineappleBtn && createForm) {
        createPineappleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Create a Wordy clicked");
            resetScreenDisplays();
            createForm.style.display = "flex";
            if (keyboardContainer) keyboardContainer.style.display = "none";
            activeInput = document.getElementById("game-name-input");
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
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
            if (keyboardContainer) keyboardContainer.style.display = "none";
            displayGameList();
            adjustBackground();
            setupKeyboardListeners();
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
            if (keyboardContainer) keyboardContainer.style.display = "none";
            displayGameList();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    if (officialBackBtn) {
        officialBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Official Back button clicked");
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            if (keyboardContainer) keyboardContainer.style.display = isMobile ? "flex" : "none";
            showKeyboard();
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    if (privateBackBtn) {
        privateBackBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Private Back button clicked");
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            if (keyboardContainer) keyboardContainer.style.display = isMobile ? "flex" : "none";
            showKeyboard();
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    if (confirmBtn) {
        confirmBtn.removeEventListener("click", confirmBtn._clickHandler);
        const clickHandler = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Confirm button clicked");
            const secretWordInput = document.getElementById("secret-word").value.trim();
            if (secretWordInput.includes(" ") || secretWordInput === "") {
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Secret Word must be one word (no spaces) and cannot be empty.";
                    formErrorDialog.style.display = "flex";
                    activeInput = document.getElementById("secret-word");
                }
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

            if (!formData.gameName || !formData.secretWord || !formData.hint1 || !formData.hint2 || !formData.hint3 || !formData.hint4 || !formData.hint5) {
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Please fill in Game Name, Secret Word, and all Hints (1–5).";
                    formErrorDialog.style.display = "flex";
                    activeInput = formData.gameName ? (formData.secretWord ? null : document.getElementById("secret-word")) : document.getElementById("game-name-input");
                }
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
                formInputs.forEach(input => (input.value = ""));
                createForm.style.display = "none";
                resetScreenDisplays();
                gameSelectScreen.style.display = "flex";
                privateTab.classList.add("active");
                officialTab.classList.remove("active");
                privateContent.classList.add("active");
                privateContent.style.display = "flex";
                officialContent.classList.remove("active");
                officialContent.style.display = "none";
                if (keyboardContainer) keyboardContainer.style.display = "none";
                await fetchPrivateGames();
                displayGameList();
                adjustBackground();
                setupKeyboardListeners();
            } catch (error) {
                console.error("Error submitting form:", error);
                if (formErrorDialog && formErrorMessage) {
                    formErrorMessage.textContent = "Failed to create game: " + error.message;
                    formErrorDialog.style.display = "flex";
                }
            }
        };
        
        confirmBtn._clickHandler = clickHandler;
        confirmBtn.addEventListener("click", clickHandler);
        confirmBtn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            clickHandler(e);
        });
    }

    if (formErrorDialog && formErrorOkBtn && formErrorMessage) {
        formErrorOkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Form Error OK button clicked");
            formErrorDialog.style.display = "none";
            if (activeInput) activeInput.focus();
            setupKeyboardListeners();
        });

        formErrorDialog.addEventListener("click", (e) => {
            if (e.target === formErrorDialog) {
                console.log("Clicked outside form error dialog");
                formErrorDialog.style.display = "none";
                if (activeInput) activeInput.focus();
                setupKeyboardListeners();
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
            if (keyboardContainer) keyboardContainer.style.display = isMobile ? "flex" : "none";
            showKeyboard();
            activeInput = guessInput;
            if (activeInput) activeInput.focus();
            adjustBackground();
            setupKeyboardListeners();
        });
    }

    if (guessesCloseBtn) {
        guessesCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses close button clicked");
            if (isMobile) {
                showKeyboard();
            } else {
                guessesScreen.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
        });
        guessesCloseBtn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            console.log("Guesses close button touched");
            if (isMobile) {
                showKeyboard();
            } else {
                guessesScreen.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
        });
    }

    if (giveUpLink && giveUpYesBtn && giveUpNoBtn) {
        giveUpLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up link clicked");
            if (isMobile) {
                if (keyboardContainer && keyboardContent && keyboardGiveUpContent && keyboardBackBtn) {
                    keyboardContainer.classList.add("show-alternate", "show-give-up");
                    keyboardContent.style.display = "none";
                    keyboardGuessesContent.style.display = "none";
                    keyboardGiveUpContent.style.display = "flex";
                    keyboardBackBtn.style.display = "block";
                    console.log("Showing give-up content in keyboard container");
                }
            } else {
                if (giveUpDialog) {
                    giveUpDialog.style.display = "flex";
                    console.log("Showing give-up dialog");
                }
            }
        });

        giveUpYesBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up Yes button clicked");
            gaveUp = true;
            let normalizedGameNumber;
            let gameType;
            if (currentGameNumber.includes("- Private")) {
                const currentNum = parseInt(currentGameNumber.split(" - ")[0]);
                normalizedGameNumber = String(currentNum);
                gameType = "privatePineapple";
            } else {
                normalizedGameNumber = currentGameNumber.replace("Game #", "");
                gameType = "pineapple";
            }
            saveGameResult(gameType, normalizedGameNumber, secretWord, "Gave Up");
            if (isMobile) {
                showKeyboard();
            } else {
                if (giveUpDialog) giveUpDialog.style.display = "none";
            }
            endGame(false, true);
        });

        giveUpNoBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Give Up No button clicked");
            if (isMobile) {
                showKeyboard();
            } else {
                if (giveUpDialog) giveUpDialog.style.display = "none";
            }
            if (guessInput && !gameOver && !isProcessingGuess) {
                guessInput.focus();
                activeInput = guessInput;
            }
        });
    }

    if (guessesLink && guessesScreen) {
        guessesLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Guesses link clicked");
            const guessesList = document.getElementById("guesses-list");
            console.log("Current guesses array:", guesses);
            if (isMobile) {
                if (keyboardContainer && keyboardContent && keyboardGuessesContent && keyboardBackBtn) {
                    guessesList.innerHTML = guesses.length > 0 
                        ? guesses.join(' <span class="separator yellow">|</span> ')
                        : "No guesses yet!";
                    keyboardContainer.classList.add("show-alternate", "show-guesses");
                    keyboardContent.style.display = "none";
                    keyboardGuessesContent.style.display = "flex";
                    keyboardGiveUpContent.style.display = "none";
                    keyboardBackBtn.style.display = "block";
                    console.log("Showing guesses content in keyboard container");
                }
            } else {
                guessesList.innerHTML = guesses.length > 0 
                    ? guesses.join(' <span class="separator yellow">|</span> ')
                    : "No guesses yet!";
                guessesScreen.style.display = "flex";
                console.log("Showing guesses screen");
            }
        });

        // Handle clicks outside guesses screen (desktop only)
        guessesScreen.addEventListener("click", (e) => {
            if (e.target === guessesScreen && !isMobile) {
                console.log("Clicked outside guesses screen");
                guessesScreen.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
        });

        // Handle touch outside guesses screen (desktop only)
        guessesScreen.addEventListener("touchstart", (e) => {
            if (e.target === guessesScreen && !isMobile) {
                e.preventDefault();
                console.log("Touched outside guesses screen");
                guessesScreen.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
        });
    }

    if (giveUpDialog) {
        giveUpDialog.addEventListener("click", (e) => {
            if (e.target === giveUpDialog && !isMobile) {
                console.log("Clicked outside give-up dialog");
                giveUpDialog.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }
        });

        giveUpDialog.addEventListener("touchstart", (e) => {
            if (e.target === giveUpDialog && !isMobile) {
                e.preventDefault();
                console.log("Touched outside give-up dialog");
                giveUpDialog.style.display = "none";
                if (guessInput && !gameOver && !isProcessingGuess) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
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
        if (keyboardContainer) keyboardContainer.style.display = "none";
        displayGameList();
        adjustBackground();
        setupKeyboardListeners();
    }

    function resetScreenDisplays() {
        if (gameScreen) gameScreen.style.display = "none";
        if (gameOverScreen) gameOverScreen.style.display = "none";
        if (gameSelectScreen) gameSelectScreen.style.display = "none";
        if (createForm) createForm.style.display = "none";
        if (formErrorDialog) formErrorDialog.style.display = "none";
        if (guessesScreen) guessesScreen.style.display = "none";
        if (giveUpDialog) giveUpDialog.style.display = "none";
        if (keyboardContainer && keyboardContent && keyboardGuessesContent && keyboardGiveUpContent && keyboardBackBtn) {
            keyboardContainer.classList.remove("show-alternate", "show-guesses", "show-give-up");
            keyboardContent.style.display = "block";
            keyboardGuessesContent.style.display = "none";
            keyboardGiveUpContent.style.display = "none";
            keyboardBackBtn.style.display = "none";
        }
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
            console.log("Fetch response status:", response.status);
            if (!response.ok) {
                console.error("Fetch failed with status:", response.status, response.statusText);
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            console.log("Official CSV fetched, length:", text.length);
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
            console.log("Loading latest game:", latestGame);
            loadGame(latestGame);
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            if (createForm) createForm.style.display = "none";
            if (keyboardContainer) keyboardContainer.style.display = isMobile ? "flex" : "none";
            showKeyboard();
            adjustBackground();
            setupEventListeners();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
        } catch (error) {
            console.error("Error fetching official games:", error);
            allGames = [
                { "Game Number": "1", "Secret Word": "TEST", "Hint 1": "SAMPLE", "Hint 2": "WORD", "Hint 3": "GAME", "Hint 4": "PLAY", "Hint 5": "FUN", "Background": "testbackground.png" }
            ];
            console.log("Using hardcoded game with background:", allGames);
            loadGame(allGames[0]);
            resetScreenDisplays();
            gameScreen.style.display = "flex";
            if (createForm) createForm.style.display = "none";
            if (keyboardContainer) keyboardContainer.style.display = isMobile ? "flex" : "none";
            showKeyboard();
            adjustBackground();
            setupEventListeners();
            setupKeyboardListeners();
            updateArrowStates(0, allGames);
            if (formErrorDialog && formErrorMessage) {
                formErrorMessage.textContent = "Failed to load official games data. Using hardcoded game.";
                formErrorDialog.style.display = "flex";
            }
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
            console.log("Fetch response status:", response.status);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log("Private CSV fetched, length:", text.length);

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
            const gameNameElement = document.getElementById("game-name");
            if (gameNameElement) {
                gameNameElement.textContent = "WORDY";
            }
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
                    let guessesDisplay = '-';
                    if (pastResult) {
                        if (pastResult.guesses === "Gave Up") {
                            guessesDisplay = "Gave Up";
                        } else if (pastResult.guesses === "X") {
                            guessesDisplay = "X";
                        } else if (pastResult.secretWord === secretWord) {
                            guessesDisplay = pastResult.guesses;
                        }
                    }
                    const showSecretWord = pastResult && (pastResult.guesses === "Gave Up" || pastResult.guesses === "X" || pastResult.secretWord === secretWord);
                    const displayWord = showSecretWord ? secretWord : "Play Now";

                    const gameItem = document.createElement("div");
                    gameItem.className = "game-list-row";
                    gameItem.innerHTML = `
                        <span>${gameNumber}</span>
                        <span class="${displayWord === 'Play Now' ? 'play-now' : ''}">${displayWord}</span>
                        <span>${guessesDisplay}</span>
                    `;
                    gameItem.addEventListener("click", () => {
                        console.log("Clicked official game:", game);
                        loadGame(game);
                        resetScreenDisplays();
                        gameScreen.style.display = "flex";
                        if (keyboardContainer) keyboardContainer.style.display = isMobile ? "flex" : "none";
                        showKeyboard();
                        activeInput = guessInput;
                        if (activeInput) activeInput.focus();
                        adjustBackground();
                        setupKeyboardListeners();
                        const currentIndex = allGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                        updateArrowStates(currentIndex, allGames);
                    });
                    officialList.appendChild(gameItem);
                    console.log(`Rendered official game ${gameNumber}: ${secretWord}, Guesses: ${guessesDisplay}`);
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
                    let guessesDisplay = '-';
                    if (pastResult) {
                        if (pastResult.guesses === "Gave Up") {
                            guessesDisplay = "Gave Up";
                        } else if (pastResult.guesses === "X") {
                            guessesDisplay = "X";
                        } else if (pastResult.secretWord === secretWord) {
                            guessesDisplay = pastResult.guesses;
                        }
                    }
                    const showSecretWord = pastResult && (pastResult.guesses === "Gave Up" || pastResult.guesses === "X" || pastResult.secretWord === secretWord);
                    const displayWord = showSecretWord ? secretWord : "Play Now";

                    const gameItem = document.createElement("div");
                    gameItem.className = "game-list-row";
                    gameItem.innerHTML = `
                        <span>${gameName}</span>
                        <span class="${displayWord === 'Play Now' ? 'play-now' : ''}">${displayWord}</span>
                        <span>${guessesDisplay}</span>
                    `;
                    gameItem.addEventListener("click", () => {
                        console.log("Clicked private game:", game);
                        loadGame(game);
                        resetScreenDisplays();
                        gameScreen.style.display = "flex";
                        if (keyboardContainer) keyboardContainer.style.display = isMobile ? "flex" : "none";
                        showKeyboard();
                        activeInput = guessInput;
                        if (activeInput) activeInput.focus();
                        adjustBackground();
                        setupKeyboardListeners();
                        const currentIndex = privateGames.findIndex(g => g["Game Number"] === game["Game Number"]);
                        updateArrowStates(currentIndex, privateGames);
                    });
                    privateList.appendChild(gameItem);
                    console.log(`Rendered private game ${gameNumber}: ${gameName}, Secret Word: ${displayWord}, Guesses: ${guessesDisplay}`);
                });
            }
        }
    }

    function setupEventListeners() {
        document.querySelectorAll("#game-name").forEach(name => {
            name.addEventListener("click", () => {
                resetGame();
                loadGame(allGames[0]);
                resetScreenDisplays();
                gameScreen.style.display = "flex";
                if (keyboardContainer) keyboardContainer.style.display = isMobile ? "flex" : "none";
                showKeyboard();
                activeInput = guessInput;
                if (activeInput) activeInput.focus();
                adjustBackground();
                setupKeyboardListeners();
                updateArrowStates(0, allGames);
            });
        });

        guessInput.addEventListener("focus", () => {
            console.log("Guess input focused");
            activeInput = guessInput;
        });
    }

    function calculateHintLines(hintsArray) {
        const tempContainer = document.createElement("div");
        tempContainer.style.fontSize = "3.25vh";
        tempContainer.style.fontFamily = "'Luckiest Guy', cursive";
        tempContainer.style.position = "absolute";
        tempContainer.style.visibility = "hidden";
        tempContainer.style.maxWidth = "82.5vw";
        tempContainer.style.whiteSpace = "normal";
        tempContainer.style.lineHeight = "1.2";
        tempContainer.style.display = "inline-block";
        tempContainer.style.wordBreak = "break-word";
        tempContainer.textContent = hintsArray.join(" | ");
        document.body.appendChild(tempContainer);
        
        const height = tempContainer.offsetHeight;
        const lineHeight = 3.25 * 1.2;
        const lines = Math.ceil(height / lineHeight);
        
        document.body.removeChild(tempContainer);
        return lines;
    }

    function updateHintFade(hintsContainer, visibleHints) {
        const lines = calculateHintLines(visibleHints);
        hintsContainer.classList.remove('lines-1', 'lines-2');
        if (lines === 1) {
            hintsContainer.classList.add('lines-1');
        } else if (lines >= 2) {
            hintsContainer.classList.add('lines-2');
        }
    }

    function buildHintHTML(hintsArray) {
        if (hintsArray.length === 0) return "";
        
        const htmlParts = [];
        hintsArray.forEach((hint, index) => {
            htmlParts.push(hint);
            if (index < hintsArray.length - 1) {
                htmlParts.push(' <span class="separator yellow">|</span> ');
            }
        });
        
        return htmlParts.join("");
    }

    function setupHints() {
        const hintsContainer = document.getElementById("hints-container");
        if (!hintsContainer) {
            console.error("hints-container element not found");
            return;
        }
        console.log("Setting up hints:", hints, "hintIndex:", hintIndex);
        hintsContainer.innerHTML = "";
        const visibleHints = hints.slice(0, hintIndex + 1);
        if (visibleHints.length > 0) {
            hintsContainer.innerHTML = buildHintHTML(visibleHints);
            hintsContainer.style.display = "block";
            updateHintFade(hintsContainer, visibleHints);
            console.log("Hints displayed:", visibleHints);
        } else {
            hintsContainer.style.display = "block";
            hintsContainer.classList.add('lines-0');
            console.log("No hints to display yet, reserving space");
        }
    }

    function adjustBackground() {
        console.log("Adjusting background for all screens, using currentBackground:", currentBackground);
        const screens = [gameScreen, gameOverScreen, gameSelectScreen, createForm];
        screens.forEach(screen => {
            if (screen) {
                screen.style.background = `url('${currentBackground}') no-repeat center top fixed`;
                screen.style.backgroundSize = screen.id === "game-select-screen" ? "cover" : screen.id === "create-form" ? "cover" : "100% calc(100% - 24vh)";
                screen.offsetHeight;
                console.log(`Set background for ${screen.id} to ${currentBackground}`);
            }
        });
        const img = new Image();
        img.src = currentBackground;
        img.onload = () => {
            console.log(`Background image ${currentBackground} loaded successfully`);
        };
        img.onerror = () => {
            console.error(`Failed to load background image ${currentBackground}, falling back to default`);
            if (currentBackground !== defaultBackground) {
                currentBackground = defaultBackground;
                adjustBackground();
            }
        };
        window.dispatchEvent(new Event('resize'));
    }

    window.addEventListener("resize", adjustBackground);

    function revealHint() {
        hintIndex++;
        console.log("Revealing hint, new hintIndex:", hintIndex, "total hints:", hints.length);
        if (hintIndex < hints.length) {
            const hintsContainer = document.getElementById("hints-container");
            if (!hintsContainer) {
                console.error("hints-container element not found in revealHint");
                return;
            }
            const visibleHints = hints.slice(0, hintIndex);
            const newHint = hints[hintIndex];
            hintsContainer.innerHTML = buildHintHTML(visibleHints);
            hintsContainer.style.display = "block";

            const hintSpan = document.createElement("span");
            hintSpan.className = "hint-text";
            hintSpan.textContent = "";
            hintsContainer.appendChild(hintSpan);

            let charIndex = 0;
            function typeLetter() {
                if (charIndex < newHint.length) {
                    hintSpan.textContent += newHint[charIndex];
                    charIndex++;
                    setTimeout(typeLetter, 100);
                } else {
                    hintsContainer.innerHTML = buildHintHTML(hints.slice(0, hintIndex + 1));
                    updateHintFade(hintsContainer, hints.slice(0, hintIndex + 1));
                    console.log("Revealed hint:", newHint);
                }
            }
            typeLetter();
            console.log("Revealing hint:", newHint);
        }
    }

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
            saveGameResult(currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple", currentGameNumber, secretWord, guessCount);
            endGame(true);
        } else {
            console.log("Incorrect guess, animating...");
            guessContainer.classList.add("wrong-guess");
            animationTimeout = setTimeout(() => {
                guessContainer.classList.remove("wrong-guess");
                guessInput.style.opacity = "1";
                guessInput.style.visibility = "visible";
                guessInput.style.color = "#000000";
                isProcessingGuess = false;
                console.log("Animation completed, input reset");
                if (guessInput) {
                    guessInput.focus();
                    activeInput = guessInput;
                }
            }, 350);

            if (guessCount === 5) {
                console.log("Max guesses (5) reached, ending game");
                saveGameResult(currentGameNumber.includes("- Private") ? "privatePineapple" : "pineapple", currentGameNumber, secretWord, "X");
                endGame(false, false, true);
            } else if (hintIndex < hints.length - 1) {
                revealHint();
            }
        }
    }

    function saveGameResult(gameType, gameNumber, secretWord, guesses) {
        console.log("Saving game result", { gameType, gameNumber, secretWord, guesses });
        const resultsKey = gameType === "pineapple" ? "pineappleResults" : "privatePineappleResults";
        let normalizedGameNumber = gameNumber;
        if (gameType === "pineapple") {
            normalizedGameNumber = gameNumber.replace("Game #", "");
        } else {
            normalizedGameNumber = gameNumber.split(" - ")[0];
        }
        const results = JSON.parse(localStorage.getItem(resultsKey) || "{}");
        results[normalizedGameNumber] = { secretWord, guesses };
        localStorage.setItem(resultsKey, JSON.stringify(results));
        console.log("Game result saved:", results);
    }

    function endGame(won, gaveUp = false, failed = false) {
        console.log("Ending game", { won, gaveUp, failed, guessCount, secretWord });
        gameOver = true;
        guessInput.disabled = true;
        guessBtn.disabled = true;

        resetScreenDisplays();
        gameOverScreen.style.display = "flex";
        if (keyboardContainer) keyboardContainer.style.display = "none";
        adjustBackground();
        setupKeyboardListeners();

        const todaysWord = document.getElementById("todays-word");
        const shareText = document.getElementById("share-text");
        const gameNumberDisplay = document.getElementById("game-number-display");
        const hardLuckLabel = document.getElementById("hard-luck-label");
        const wellDoneLabel = document.getElementById("well-done-label");

        if (todaysWord) todaysWord.textContent = secretWord;
        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }
        if (hardLuckLabel) {
            hardLuckLabel.style.display = (failed || gaveUp) ? "block" : "none";
        }
        if (wellDoneLabel) {
            wellDoneLabel.style.display = won ? "block" : "none";
        }

        let shareMessage;
        if (gaveUp || failed) {
            shareMessage = `Play WORDY`;
        } else {
            shareMessage = `${currentGameNumber}\nI solved WORDY in\n<span class="guess-count">${guessCount}</span>\n${guessCount === 1 ? 'guess' : 'guesses'}`;
        }

        if (shareText) {
            shareText.innerHTML = shareMessage.replace(/\n/g, "<br>");
        }

        const shareButtons = {
            whatsapp: document.getElementById("share-whatsapp"),
            telegram: document.getElementById("share-telegram"),
            twitter: document.getElementById("share-twitter")
        };

        if (shareButtons.whatsapp) {
            shareButtons.whatsapp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage.replace(/<[^>]+>/g, ''))}`;
        }
        if (shareButtons.telegram) {
            shareButtons.telegram.href = `https://t.me/share/url?url=${encodeURIComponent("https://wordy.bigbraingames.net")}&text=${encodeURIComponent(shareMessage.replace(/<[^>]+>/g, ''))}`;
        }
        if (shareButtons.twitter) {
            shareButtons.twitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage.replace(/<[^>]+>/g, ''))}`;
        }

        if (won) {
            startPineappleRain();
        }
    }

    function startPineappleRain() {
        console.log("Starting pineapple rain animation");
        const rainContainer = document.createElement("div");
        rainContainer.className = "pineapple-rain";
        document.body.appendChild(rainContainer);

        function createWave(waveNumber) {
            const pieces = Array(40).fill("🍍");
            PHENOMENAL
            pieces.forEach(() => {
                const piece = document.createElement("div");
                piece.className = "pineapple-piece";
                piece.textContent = "🍍";
                piece.style.left = `${Math.random() * 100}vw`;
                piece.style.animationDuration = `${Math.random() * 3.5 + 2.5}s`;
                piece.style.fontSize = `${Math.random() * 1.5 + 0.8}vh`;
                piece.style.animationDelay = `${waveNumber * 0.2 + Math.random() * 0.15}s`;
                piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
                piece.style.setProperty('--drift', `${Math.random() * 2 - 1}`);
                rainContainer.appendChild(piece);
            });
        }

        const waveCount = isMobile ? 6 : 5;
        for (let i = 0; i < waveCount; i++) {
            createWave(i);
        }

        setTimeout(() => {
            rainContainer.remove();
            console.log("Pineapple rain animation ended");
        }, 13500);
    }

    function resetGame() {
        console.log("Resetting game state");
        gameOver = false;
        secretWord = "";
        hints = [];
        hintIndex = 0;
        firstGuessMade = false;
        guessCount = 0;
        gaveUp = false;
        guesses = [];
        isProcessingGuess = false;
        if (guessInput) {
            guessInput.value = "";
            guessInput.disabled = false;
            guessInput.focus();
            activeInput = guessInput;
        }
        if (guessBtn) {
            guessBtn.disabled = false;
        }
        if (guessesLink) guessesLink.textContent = "Guesses: 0";
        const hintsContainer = document.getElementById("hints-container");
        if (hintsContainer) {
            hintsContainer.innerHTML = "";
            hintsContainer.style.display = "block";
            hintsContainer.classList.add('lines-0');
        }
        showKeyboard();
        setupKeyboardListeners();
    }

    function loadGame(game) {
        console.log("Loading game:", game);
        resetGame();
        secretWord = game["Secret Word"].toUpperCase();
        hints = [
            game["Hint 1"]?.toUpperCase() || "",
            game["Hint 2"]?.toUpperCase() || "",
            game["Hint 3"]?.toUpperCase() || "",
            game["Hint 4"]?.toUpperCase() || "",
            game["Hint 5"]?.toUpperCase() || ""
        ].filter(hint => hint);
        console.log("Loaded hints:", hints);

        currentGameNumber = game["Display Name"] || `Game #${game["Game Number"]}${game["Game Name"] ? " - Private" : ""}`;
        const newGameNumberDisplay = document.getElementById("new-game-number-display");
        const gameNumberDisplay = document.getElementById("game-number-display");
        if (newGameNumberDisplay) {
            newGameNumberDisplay.textContent = currentGameNumber;
        }
        if (gameNumberDisplay) {
            gameNumberDisplay.textContent = currentGameNumber;
        }

        currentBackground = game["Background"] && game["Background"].trim() !== "" ? game["Background"] : defaultBackground;
        console.log("Setting currentBackground to:", currentBackground);

        adjustBackground();

        setupHints();

        if (guessInput) {
            guessInput.disabled = false;
            guessInput.readOnly = isMobile;
            guessInput.focus();
            activeInput = guessInput;
        }
        if (guessBtn) {
            guessBtn.disabled = false;
        }

        if (keyboardContainer) keyboardContainer.style.display = isMobile ? "flex" : "none";
        showKeyboard();
        setupKeyboardListeners();
    }

    // Initialize cursor before fetching games
    initializeCursor();

    await fetchGameData();
    await fetchPrivateGames();
    displayGameList();
});