const gameArea = document.getElementById('gameArea');
const ball = document.getElementById('ball');
const goal = document.getElementById('goal');
const timerElement = document.getElementById('timer');

const bounceSound = document.getElementById('bounce-sound');
const goalSound = document.getElementById('goal-sound');
const gameoverSound = document.getElementById('gameover-sound');
const backgroundSound = document.getElementById('background-sound');

let ballX = gameArea.offsetWidth / 2;
let ballY = gameArea.offsetHeight - 50;
let ballSpeedX = 2;
let ballSpeedY = 2;
let gameOver = false;
let isGameStarted = false;
let baseSpeed = 5; // Base speed of triangles
let maxSpeed = 25;  // Max speed when the ball is near the goal

let mouseX = gameArea.offsetWidth / 2;
let mouseY = gameArea.offsetHeight - 50;

// Timer
let timeLeft = 30; // 2 minutes in seconds

// Show the rules popup on page load
document.addEventListener('DOMContentLoaded', function() {
    showPopup('Règles du jeu', 'Modifiez la trajectoire de la balle et survivez 20 secondes, en vous tenant à distance des obstacles, puis rejoignez le plus rapidement possible le BUT.', 'Démarrer le jeu', startGame);
});

// Handle page visibility changes
document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        // Mute the background music when the page is not visible
        backgroundSound.muted = true;
    } else {
        // Unmute the background music when the page becomes visible again
        backgroundSound.muted = false;
    }
});

function showVictoryPopup(title, message, button1Text, button2Text, restartButtonText, button1Callback, button2Callback, restartGameCallback) {
    const popup = document.getElementById('popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupButtonContainer = document.getElementById('popup-buttons');
    const popupButton = document.getElementById('popup-button');

    popupButton.textContent = "";

    // Set title and message
    popupTitle.textContent = title;
    popupMessage.textContent = message;

    // Clear existing buttons
    popupButtonContainer.innerHTML = '';

    // Create the first button (Order Portfolio)
    const popupButton1 = document.createElement('button');
    popupButton1.textContent = button1Text;
    popupButton1.classList.add('popup-button'); // Use existing button class for styling
    popupButton1.onclick = function() {
        popup.style.display = 'none';
        if (button1Callback) button1Callback();
    };

    // Create the second button (Visit Portfolio)
    const popupButton2 = document.createElement('button');
    popupButton2.textContent = button2Text;
    popupButton2.classList.add('popup-button');
    popupButton2.style.margin = "0 10px";
    popupButton2.onclick = function() {
        popup.style.display = 'none';
        if (button2Callback) button2Callback();
    };

    // Create the restart button (Restart Game)
    const restartButton = document.createElement('button');
    restartButton.textContent = restartButtonText;
    restartButton.classList.add('popup-button');
    restartButton.onclick = function() {
        popup.style.display = 'none';
        popupButtonContainer.innerHTML = "";
        if (restartGameCallback) restartGameCallback();
    };

    // Add all buttons to the button container
    popupButtonContainer.appendChild(popupButton1);
    popupButtonContainer.appendChild(popupButton2);
    popupButtonContainer.appendChild(restartButton);

    // Display the popup
    popup.style.display = 'block';
}

function showPopup(title, message, buttonText, callback) {
    const popup = document.getElementById('popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupButton = document.getElementById('popup-button');
    const popupButtonContainer = document.getElementById('popup-buttons');

    popupTitle.textContent = title;
    popupMessage.textContent = message;
    popupButton.textContent = buttonText;
    popup.style.display = 'block';

    if(title = "congratulations"){
        document.querySelectorAll('.h').forEach((h)=>{
            h.style.display = "inline-block";
        });
    }

    // Hide popup when close button or popup button is clicked
    document.querySelector('.close-btn').onclick = function() {
        popup.style.display = 'none';
        popupButtonContainer.innerHTML = "";
        if (callback) callback();
    };
    popupButton.onclick = function() {
        popup.style.display = 'none';
        if (callback) callback(); // Trigger the callback (startGame or resetGame)
    };
}


// Set up triangles
const triangles = Array.from(document.getElementsByClassName('triangle'));
triangles.forEach((triangle, i) => {
    triangle.style.left = `${Math.random() * gameArea.offsetWidth}px`;
    triangle.style.top = `${Math.random() * gameArea.offsetHeight}px`;
});

// Detect if device is mobile
let isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// Track touch or mouse movement
if (isTouchDevice) {
    gameArea.addEventListener('touchmove', handleTouchMove);
} else {
    gameArea.addEventListener('mousemove', handleMouseMove);
}

// Handle mouse movement
function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

// Handle touch movement
function handleTouchMove(e) {
    let touch = e.touches[0];
    mouseX = touch.clientX;
    mouseY = touch.clientY;
}

// Move the ball
function moveBall() {
    if (!isGameStarted || gameOver) return; // Prevent triangle movement if the game hasn't started or game is over

    const angle = Math.atan2(mouseY - ballY, mouseX - ballX);
    ballX += Math.cos(angle) * ballSpeedX;
    ballY += Math.sin(angle) * ballSpeedY;

    // Ball bouncing on borders
    if (ballX < 0 || ballX > gameArea.offsetWidth - 40) {
        ballSpeedX *= -1;
        bounceSound.play();
    }
    if (ballY < 0 || ballY > gameArea.offsetHeight - 40) {
        ballSpeedY *= -1;
        bounceSound.play();
    }

    ball.style.left = `${ballX}px`;
    ball.style.top = `${ballY}px`;

    checkGoal();
    checkCollisions();
}

// Move triangles randomly and become aggressive near the goal
function moveTriangles() {
    if (!isGameStarted || gameOver) return; // Prevent triangle movement if the game hasn't started or game is over

    const goalX = gameArea.offsetWidth / 2;
    const goalY = 0;
    const distanceToGoal = calculateDistance(ballX, ballY, goalX, goalY);

    // Calculate speed increase based on distance to the goal
    let speedMultiplier = Math.max(1, maxSpeed - (distanceToGoal / gameArea.offsetHeight) * maxSpeed);

    triangles.forEach((triangle) => {
        const moveX = (Math.random() - 0.5) * speedMultiplier;
        const moveY = (Math.random() - 0.5) * speedMultiplier;

        let newLeft = triangle.offsetLeft + moveX;
        let newTop = triangle.offsetTop + moveY;

        if (newLeft < 0 || newLeft > gameArea.offsetWidth - 40) newLeft = triangle.offsetLeft;
        if (newTop < 0 || newTop > gameArea.offsetHeight - 40) newTop = triangle.offsetTop;

        triangle.style.left = `${newLeft}px`;
        triangle.style.top = `${newTop}px`;
    });
}

// Check if the ball reaches the goal
function checkGoal() {
    const ballRect = ball.getBoundingClientRect();
    const goalRect = goal.getBoundingClientRect();

    if (
        ballRect.top < goalRect.bottom &&
        ballRect.left > goalRect.left &&
        ballRect.right < goalRect.right &&
        timeLeft <= 10
    ) {
        goalSound.play();
        showVictoryPopup(
            'Victoire !',
            'Félicitations ! Vous avez gagné le jeu et vous bénéficiez d\'une réduction de 50 % sur la création de votre portfolio (de 60 000 à 30 000) !',
            'Commander un portfolio',
            'Visiter mon portfolio',
            'Recommencer le jeu', // Texte pour le bouton de redémarrage
            function() { 
                // Callback pour commander un portfolio
                window.location.href = 'mailto:nesite7@gmail.com?subject=Commande%20de%20Portfolio&body=Bonjour,%20je%20souhaite%20commander%20un%20portefolio%20avec%20la%20réduction%20de%2050%25%20offerte%20suite%20à%20ma%20victoire%20dans%20le%20jeu.';
            },
            function() {
                // Callback pour visiter le portfolio
                window.location.href = 'https://clementoligui.com';
            },
            function() {
                // Callback pour recommencer le jeu
                resetGame();
                gameLoop(); // Redémarrer la boucle du jeu
            }
        );
        isGameStarted = false; // Stop the game after winning
    }
}

// Check if the ball collides with any triangle
function checkCollisions() {
    const ballRect = ball.getBoundingClientRect();

    triangles.forEach((triangle) => {
        const triangleRect = triangle.getBoundingClientRect();

        if (
            ballRect.right > triangleRect.left &&
            ballRect.left < triangleRect.right &&
            ballRect.bottom > triangleRect.top &&
            ballRect.top < triangleRect.bottom
        ) {
            gameoverSound.play();
            showPopup('Game Over', 'Vous avez perdu ! Recommencer ?', 'Recommencer le jeu', resetGame);
            gameOver = true;
            isGameStarted = false; // Stop the game after game over
        }
    });
}

// Update timer every second
function updateTimer() {
    if (!isGameStarted || gameOver) return; // Prevent timer from running if the game hasn't started or game is over

    timeLeft--; // Convert to seconds
    if (timeLeft <= 0) {
        gameoverSound.play();
        showPopup("Temps écoulé !", "Game Over ! Vous avez manqué de temps.", "Recommencer le jeu", resetGame);
        gameOver = true;
        isGameStarted = false;
    } else {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = Math.floor(timeLeft % 60);
        timerElement.innerText = `Time Left: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
        // Change color of game area when 30 seconds are left
        if (timeLeft == 10) {
            goal.textContent = "BUT";
            goal.style.backgroundColor = "#00FF00";
            gameArea.style.backgroundImage = 'none'; // Light red
            triangles.forEach((triangle) => {
                triangle.classList.add('dark');
            });
        }
    }
}

// Utility function to calculate distance
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function startGame() {
    goal.textContent = "";
    goal.style.backgroundColor = "pink";
    isGameStarted = true;
    gameOver = false;
    backgroundSound.play(); // Play background sound when game starts
    gameLoop(); // Start the game loop
}

// Reset game
function resetGame() {
    ballX = gameArea.offsetWidth / 2;
    ballY = gameArea.offsetHeight - 50;
    timeLeft = 30;
    gameOver = false;
    isGameStarted = true; // Prevent game from starting automatically
    backgroundSound.currentTime = 0; // Reset background sound
    gameArea.style.backgroundImage = "url('../images/arcade_back.png')";
    goal.textContent = "";
    goal.style.backgroundColor = "pink";

    // Reset the position of each triangle to a random location
    triangles.forEach((triangle) => {
        triangle.className = 'triangle';
        triangle.style.left = `${Math.random() * (gameArea.offsetWidth - 40)}px`;
        triangle.style.top = `${Math.random() * (gameArea.offsetHeight - 40)}px`;
    });
    gameLoop();
}

// Update the ball's movement every frame
function gameLoop() {
    if (!gameOver) {
        moveBall();
        moveTriangles();
        requestAnimationFrame(gameLoop);
    }
}

setInterval(updateTimer, 1000); // Update the timer every second
