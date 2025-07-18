// Wait for DOM to fully load before executing code
document.addEventListener('DOMContentLoaded', function() {
    // Main game variables
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const gameIntro = document.getElementById('game-intro');
    const gameOver = document.getElementById('game-over');
    const scoreDisplay = document.getElementById('score');
    const ethDisplay = document.getElementById('eth');
    const finalScoreDisplay = document.getElementById('final-score');
    const ethCollectedDisplay = document.getElementById('eth-collected');

    // Game field dimensions
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    // Game settings
    const GRAVITY = 0.5;
    const FLAP_POWER = -8;
    const PIPE_SPEED = 2;
    const PIPE_SPAWN_INTERVAL = 120;
    const PIPE_GAP = 150;
    const COIN_SPAWN_CHANCE = 0.4;

    // Game objects
    let bird;
    let pipes = [];
    let coins = [];
    let obstacles = [];
    let score = 0;
    let ethCollected = 0;
    let gameActive = false;
    let frameCount = 0;
    let backgroundCanvas;
    let backgroundCtx;

    // Create background canvas
    function createBackground() {
        backgroundCanvas = document.createElement('canvas');
        backgroundCanvas.width = WIDTH;
        backgroundCanvas.height = HEIGHT;
        backgroundCtx = backgroundCanvas.getContext('2d');
        
        // Draw gradient
        const bgGradient = backgroundCtx.createLinearGradient(0, 0, 0, HEIGHT);
        bgGradient.addColorStop(0, '#000033');
        bgGradient.addColorStop(1, '#000066');
        backgroundCtx.fillStyle = bgGradient;
        backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT);
        
        // Add stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * WIDTH;
            const y = Math.random() * HEIGHT;
            const radius = Math.random() * 1.5;
            const opacity = Math.random() * 0.8 + 0.2;
            
            backgroundCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            backgroundCtx.beginPath();
            backgroundCtx.arc(x, y, radius, 0, Math.PI * 2);
            backgroundCtx.fill();
        }
    }

    // Create background on load
    createBackground();

    // Bird class (cryptocurrency token)
    class Bird {
        constructor() {
            this.x = WIDTH / 4;
            this.y = HEIGHT / 2;
            this.velocity = 0;
            this.width = 40;
            this.height = 30;
            this.alive = true;
            this.rotation = 0;
        }

        flap() {
            if (this.alive) {
                this.velocity = FLAP_POWER;
            }
        }

        update() {
            this.velocity += GRAVITY;
            this.y += this.velocity;
            
            // Restrict bird movement within screen boundaries
            if (this.y < 0) {
                this.y = 0;
                this.velocity = 0;
            }
            
            if (this.y + this.height > HEIGHT) {
                this.y = HEIGHT - this.height;
                this.alive = false;
            }
            
            // Update rotation angle based on velocity
            this.rotation = Math.min(Math.PI/4, Math.max(-Math.PI/4, this.velocity * 0.1));
        }

        draw() {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation);
            
            // Draw ETH symbol
            ctx.fillStyle = '#62c9ff';
            ctx.beginPath();
            ctx.moveTo(-this.width/2, 0);
            ctx.lineTo(0, -this.height/2);
            ctx.lineTo(this.width/2, 0);
            ctx.lineTo(0, this.height/2);
            ctx.closePath();
            ctx.fill();
            
            // Add details
            ctx.fillStyle = '#3ab0ff';
            ctx.beginPath();
            ctx.moveTo(-this.width/2, 0);
            ctx.lineTo(0, this.height/4);
            ctx.lineTo(this.width/2, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }

        checkCollision(object) {
            return (
                this.x < object.x + object.width &&
                this.x + this.width > object.x &&
                this.y < object.y + object.height &&
                this.y + this.height > object.y
            );
        }
    }

    // Pipe class (obstacles)
    class Pipe {
        constructor() {
            this.width = 60;
            this.x = WIDTH;
            this.passed = false;
            
            // Random height for top pipe
            this.topHeight = Math.random() * (HEIGHT - PIPE_GAP - 100) + 50;
            this.bottomY = this.topHeight + PIPE_GAP;
            this.bottomHeight = HEIGHT - this.bottomY;
        }

        update() {
            this.x -= PIPE_SPEED;
        }

        draw() {
            // Top pipe
            this.drawPipe(this.x, 0, this.width, this.topHeight, true);
            
            // Bottom pipe
            this.drawPipe(this.x, this.bottomY, this.width, this.bottomHeight, false);
        }
        
        drawPipe(x, y, width, height, isTop) {
            const gradient = ctx.createLinearGradient(x, y, x + width, y);
            gradient.addColorStop(0, '#ff4d4d');
            gradient.addColorStop(1, '#cc0000');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, width, height);
            
            // Pipe edge
            ctx.fillStyle = '#ff6666';
            if (isTop) {
                ctx.fillRect(x - 5, y + height - 20, width + 10, 20);
            } else {
                ctx.fillRect(x - 5, y, width + 10, 20);
            }
            
            // Pipe pattern
            ctx.fillStyle = '#990000';
            for (let i = 0; i < height; i += 40) {
                if (isTop && y + i + 30 > y + height - 20) continue;
                if (!isTop && y + i < y + 20) continue;
                
                ctx.fillRect(x + 10, y + i, width - 20, 15);
            }
        }

        isOffScreen() {
            return this.x + this.width < 0;
        }
    }

    // Coin class (ETH)
    class Coin {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 30;
            this.height = 30;
            this.collected = false;
            this.rotation = 0;
        }

        update() {
            this.x -= PIPE_SPEED;
            this.rotation += 0.05;
        }

        draw() {
            if (this.collected) return;
            
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation);
            
            // Draw ETH coin
            ctx.fillStyle = '#62ffbd';
            ctx.beginPath();
            ctx.moveTo(-this.width/2, 0);
            ctx.lineTo(0, -this.height/2);
            ctx.lineTo(this.width/2, 0);
            ctx.lineTo(0, this.height/2);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();
        }

        isOffScreen() {
            return this.x + this.width < 0;
        }
    }
    
    // Additional obstacles class
    class Obstacle {
        constructor() {
            this.width = 40;
            this.height = 40;
            this.x = WIDTH;
            this.y = Math.random() * (HEIGHT - 100) + 50;
            this.type = Math.random() < 0.5 ? 'bear' : 'bug';
            this.rotation = 0;
        }

        update() {
            this.x -= PIPE_SPEED * 1.2;
            this.rotation += 0.03;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation);
            
            if (this.type === 'bear') {
                // Bear market (red)
                ctx.fillStyle = '#ff6b6b';
                ctx.beginPath();
                ctx.arc(-this.width/4, -this.height/4, this.width/4, 0, Math.PI * 2);
                ctx.arc(this.width/4, -this.height/4, this.width/4, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(0, this.height/5, this.width/3, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(-this.width/4, -this.height/4, this.width/8, 0, Math.PI * 2);
                ctx.arc(this.width/4, -this.height/4, this.width/8, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                
            } else {
                // Bug (blue)
                ctx.fillStyle = '#4d79ff';
                ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('!', 0, 0);
            }
            
            ctx.restore();
        }

        isOffScreen() {
            return this.x + this.width < 0;
        }
    }

    // Update coins
    function updateCoins() {
        for (let i = coins.length - 1; i >= 0; i--) {
            coins[i].update();
            
            if (!coins[i].collected) {
                coins[i].draw();
                
                // Check coin collection
                if (bird.checkCollision(coins[i])) {
                    coins[i].collected = true;
                    ethCollected++;
                    ethDisplay.textContent = ethCollected;
                    
                    // Coin collection effect
                    playCollectEffect(coins[i].x, coins[i].y);
                }
            }
            
            // Remove coins that are off screen
            if (coins[i].isOffScreen()) {
                coins.splice(i, 1);
            }
        }
    }

    // Update obstacles
    function updateObstacles() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].update();
            obstacles[i].draw();
            
            // Remove obstacles that are off screen
            if (obstacles[i].isOffScreen()) {
                obstacles.splice(i, 1);
            }
        }
    }

    // Coin collection effect
    function playCollectEffect(x, y) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+1 ETH', x, y - 20);
    }

    // Check collisions
    function checkCollisions() {
        // Check collisions with pipes
        for (const pipe of pipes) {
            // Top pipe
            if (bird.checkCollision({
                x: pipe.x,
                y: 0,
                width: pipe.width,
                height: pipe.topHeight
            })) {
                endGame();
                return;
            }
            
            // Bottom pipe
            if (bird.checkCollision({
                x: pipe.x,
                y: pipe.bottomY,
                width: pipe.width,
                height: pipe.bottomHeight
            })) {
                endGame();
                return;
            }
        }
        
        // Check collisions with obstacles
        for (const obstacle of obstacles) {
            if (bird.checkCollision(obstacle)) {
                endGame();
                return;
            }
        }
        
        // Check if bird is out of bounds
        if (!bird.alive) {
            endGame();
        }
    }

    // Update score
    function updateScore() {
        scoreDisplay.textContent = score;
        ethDisplay.textContent = ethCollected;
    }

    // End game
    function endGame() {
        gameActive = false;
        finalScoreDisplay.textContent = score;
        ethCollectedDisplay.textContent = ethCollected;
        gameOver.style.display = 'block';
    }

    // Main game loop
    function gameLoop() {
        if (!gameActive) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        
        // Draw background
        ctx.drawImage(backgroundCanvas, 0, 0);
        
        // Update frame counter
        frameCount++;
        
        // Create new pipes
        if (frameCount % PIPE_SPAWN_INTERVAL === 0) {
            pipes.push(new Pipe());
            
            // Random coin creation
            if (Math.random() < COIN_SPAWN_CHANCE) {
                const randomY = Math.random() * (HEIGHT - 100) + 50;
                coins.push(new Coin(WIDTH, randomY));
            }
            
            // Random obstacle creation
            if (Math.random() < 0.3) {
                obstacles.push(new Obstacle());
            }
            
            // Increase score
            score++;
            scoreDisplay.textContent = score;
        }
        
        // Update and draw bird
        bird.update();
        bird.draw();
        
        // Update and draw pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].update();
            pipes[i].draw();
            
            // Remove pipes that are off screen
            if (pipes[i].isOffScreen()) {
                pipes.splice(i, 1);
            }
        }
        
        // Update and draw coins
        updateCoins();
        
        // Update and draw obstacles
        updateObstacles();
        
        // Check collisions
        checkCollisions();
        
        // Continue game loop
        if (gameActive) {
            requestAnimationFrame(gameLoop);
        }
    }

    // Game initialization function
    function initGame() {
        bird = new Bird();
        pipes = [];
        coins = [];
        obstacles = [];
        score = 0;
        ethCollected = 0;
        frameCount = 0;
        
        scoreDisplay.textContent = score;
        ethDisplay.textContent = ethCollected;
        
        gameIntro.style.display = 'none';
        gameOver.style.display = 'none';
        
        gameActive = true;
        
        // Start game loop
        requestAnimationFrame(gameLoop);
    }

    // Event handlers
    startButton.addEventListener('click', initGame);
    restartButton.addEventListener('click', initGame);

    // Key press handling
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            if (!gameActive && gameIntro.style.display === 'none' && gameOver.style.display === 'none') {
                initGame();
            } else if (gameActive) {
                bird.flap();
            }
        }
    });

    // Touch screen handling
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (gameActive) {
            bird.flap();
        } else if (gameIntro.style.display === 'none' && gameOver.style.display === 'none') {
            initGame();
        }
    });

    // Mouse click handling
    canvas.addEventListener('click', () => {
        if (gameActive) {
            bird.flap();
        } else if (gameIntro.style.display === 'none' && gameOver.style.display === 'none') {
            initGame();
        }
    });

    // Initialize start screen
    window.addEventListener('load', () => {
        gameIntro.style.display = 'block';
        gameOver.style.display = 'none';
    });
});