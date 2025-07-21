// Wait for DOM to fully load before executing code
document.addEventListener('DOMContentLoaded', function() {
    // Main game variables
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const gameOver = document.getElementById('game-over');
    const scoreDisplay = document.getElementById('score');
    const ethDisplay = document.getElementById('eth');
    const finalScoreDisplay = document.getElementById('final-score');
    const ethCollectedDisplay = document.getElementById('eth-collected');
    const distanceTraveledDisplay = document.getElementById('distance-traveled');
    const starryBackground = document.getElementById('starry-background');

    console.log('Game elements loaded:', { 
        canvas: canvas, 
        startButton: startButton, 
        restartButton: restartButton,
        starryBackground: starryBackground
    });

    // Game field dimensions (standard size)
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    
    // Create starry background
    function createStarryBackground() {
        // Create canvas for starry background
        const bgCanvas = document.createElement('canvas');
        const bgCtx = bgCanvas.getContext('2d');
        
        // Set canvas size to match container
        bgCanvas.width = starryBackground.clientWidth;
        bgCanvas.height = starryBackground.clientHeight;
        
        // Draw gradient background
        const bgGradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
        bgGradient.addColorStop(0, '#000033');
        bgGradient.addColorStop(1, '#000055');
        bgCtx.fillStyle = bgGradient;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        // Add stars
        const starCount = Math.floor(bgCanvas.width * bgCanvas.height / 1000); // Scale based on area
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * bgCanvas.width;
            const y = Math.random() * bgCanvas.height;
            const radius = Math.random() * 1.5;
            const opacity = Math.random() * 0.8 + 0.2;
            
            bgCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            bgCtx.beginPath();
            bgCtx.arc(x, y, radius, 0, Math.PI * 2);
            bgCtx.fill();
        }
        
        // Add some nebula effects
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * bgCanvas.width;
            const y = Math.random() * bgCanvas.height;
            const radius = Math.random() * (bgCanvas.width / 8) + (bgCanvas.width / 16);
            
            const gradient = bgCtx.createRadialGradient(x, y, 0, x, y, radius);
            const hue = Math.random() * 60 + 200; // Blue to purple
            gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.15)`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            bgCtx.fillStyle = gradient;
            bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        }
        
        // Apply the canvas to the background div
        starryBackground.style.background = 'none';
        starryBackground.appendChild(bgCanvas);
    }
    
    // Call once to create the background
    createStarryBackground();
    
    // Recreate on window resize
    window.addEventListener('resize', function() {
        // Clear previous background
        while (starryBackground.firstChild) {
            starryBackground.removeChild(starryBackground.firstChild);
        }
        createStarryBackground();
    });

    // Game settings
    const GRAVITY = 0.25; // Уменьшено с 0.5
    const FLAP_POWER = -6; // Уменьшено с -8
    const PIPE_SPEED = 1.5; // Уменьшено с 2
    const PIPE_SPAWN_INTERVAL = 180; // Увеличено со 120
    const PIPE_GAP = 200; // Увеличено со 150
    const COIN_SPAWN_CHANCE = 0.5; // Увеличено с 0.4

    // Game objects
    let bird;
    let pipes = [];
    let coins = [];
    let obstacles = [];
    let score = 0;
    let ethCollected = 0;
    let distanceTraveled = 0;
    let gameActive = false;
    let frameCount = 0;
    let backgroundCanvas;
    let backgroundCtx;

    // Create game background canvas
    function createBackground() {
        backgroundCanvas = document.createElement('canvas');
        backgroundCanvas.width = WIDTH;
        backgroundCanvas.height = HEIGHT;
        backgroundCtx = backgroundCanvas.getContext('2d');
        
        // Draw transparent background (to show the starry background behind)
        backgroundCtx.clearRect(0, 0, WIDTH, HEIGHT);
        
        // Add a subtle gradient overlay
        const bgGradient = backgroundCtx.createLinearGradient(0, 0, 0, HEIGHT);
        bgGradient.addColorStop(0, 'rgba(0, 0, 51, 0.4)');
        bgGradient.addColorStop(1, 'rgba(0, 0, 102, 0.4)');
        backgroundCtx.fillStyle = bgGradient;
        backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT);
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
            this.rotation = Math.min(Math.PI/6, Math.max(-Math.PI/6, this.velocity * 0.08)); // Сделано плавнее
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
            
            // Add glow effect
            ctx.shadowColor = '#62c9ff';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.stroke();
            
            ctx.restore();
        }

        checkCollision(object) {
            // Уменьшаем хитбокс для более комфортной игры
            const hitboxShrink = 5;
            return (
                this.x + hitboxShrink < object.x + object.width - hitboxShrink &&
                this.x + this.width - hitboxShrink > object.x + hitboxShrink &&
                this.y + hitboxShrink < object.y + object.height - hitboxShrink &&
                this.y + this.height - hitboxShrink > object.y + hitboxShrink
            );
        }
    }

    // Pipe class (obstacles)
    class Pipe {
        constructor() {
            this.width = 60;
            this.x = WIDTH;
            this.passed = false;
            
            // Random height for top pipe, но делаем трубы более предсказуемыми
            const minTopHeight = 50;
            const maxTopHeight = HEIGHT - PIPE_GAP - 50;
            this.topHeight = minTopHeight + Math.random() * (maxTopHeight - minTopHeight);
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
            this.oscillation = 0;
        }

        update() {
            this.x -= PIPE_SPEED;
            this.rotation += 0.03; // Замедлено с 0.05
            this.oscillation += 0.03;
            // Add gentle floating motion
            this.y += Math.sin(this.oscillation) * 0.5;
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
            
            // Add glow
            ctx.shadowColor = '#62ffbd';
            ctx.shadowBlur = 10;
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
            this.rotationSpeed = (Math.random() - 0.5) * 0.01; // Еще замедлено с 0.02
        }

        update() {
            this.x -= PIPE_SPEED * 1.1; // Замедлено с 1.2
            this.rotation += this.rotationSpeed;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation);
            
            if (this.type === 'bear') {
                // Bear market (red)
                ctx.shadowColor = '#ff6b6b';
                ctx.shadowBlur = 10;
                
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
                
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(-this.width/4, -this.height/4, this.width/8, 0, Math.PI * 2);
                ctx.arc(this.width/4, -this.height/4, this.width/8, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                
            } else {
                // Bug (blue)
                ctx.shadowColor = '#4d79ff';
                ctx.shadowBlur = 10;
                
                ctx.fillStyle = '#4d79ff';
                ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                
                ctx.shadowBlur = 0;
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
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#62ffbd';
        ctx.shadowBlur = 10;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+1 ETH', x, y - 20);
        ctx.restore();
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
        document.getElementById('distance').textContent = Math.floor(distanceTraveled);
    }

    // End game
    function endGame() {
        gameActive = false;
        finalScoreDisplay.textContent = score;
        ethCollectedDisplay.textContent = ethCollected;
        distanceTraveledDisplay.textContent = distanceTraveled;
        gameOver.style.display = 'block';
    }

    // Main game loop
    function gameLoop() {
        if (!gameActive) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        
        // Draw game background (transparent to let the starry background show)
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
            
            // Random obstacle creation - снижено с 0.3 до 0.2
            if (Math.random() < 0.2) {
                obstacles.push(new Obstacle());
            }
            
            // Increase score and distance
            score++;
            distanceTraveled += PIPE_SPEED * PIPE_SPAWN_INTERVAL;
            updateScore();
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
        console.log('Initializing game...');
        bird = new Bird();
        pipes = [];
        coins = [];
        obstacles = [];
        score = 0;
        ethCollected = 0;
        distanceTraveled = 0;
        frameCount = 0;
        
        updateScore();
        
        gameOver.style.display = 'none';
        
        gameActive = true;
        
        // Start game loop
        requestAnimationFrame(gameLoop);
    }

    // Event listeners
    if (startButton) {
        console.log('Adding click event to startButton');
        startButton.addEventListener('click', function() {
            console.log('Start button clicked');
            initGame();
        });
    } else {
        console.error('Start button not found!');
    }
    
    // Custom event listener for game start from sidebar button
    document.addEventListener('startGame', function() {
        console.log('Start game event received');
        initGame();
    });

    if (restartButton) {
        console.log('Adding click event to restartButton');
        restartButton.addEventListener('click', function() {
            console.log('Restart button clicked');
            initGame();
        });
    } else {
        console.error('Restart button not found!');
    }

    // Key press handling
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            if (!gameActive) {
                console.log('Starting game with space key');
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
        } else {
            console.log('Starting game with touch');
            initGame();
        }
    });

    // Mouse click handling for in-game flap
    canvas.addEventListener('click', () => {
        if (gameActive) {
            bird.flap();
        } else {
            console.log('Starting game with canvas click');
            initGame();
        }
    });

    // Initial draw to show the game field
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(backgroundCanvas, 0, 0);
    
    // Draw initial message
    ctx.fillStyle = '#62c9ff';
    ctx.shadowColor = '#62c9ff';
    ctx.shadowBlur = 15;
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Нажмите "Start Game"', WIDTH / 2, HEIGHT / 2 - 30);
    ctx.fillText('чтобы начать', WIDTH / 2, HEIGHT / 2 + 10);
});
