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

    // --- Comet animation array must be declared before any function uses it ---
    let comets = [];
    
    // --- Shield power-up variables ---
    let shieldActive = false;
    let shieldTimeLeft = 0;
    const SHIELD_DURATION = 5000; // Shield lasts for 5 seconds
    const SHIELD_SPAWN_CHANCE = 0.1; // 10% chance to spawn a shield power-up
    
    // --- Combo system variables ---
    let comboCount = 0;
    let comboTimeLeft = 0;
    const COMBO_DURATION = 3000; // 3 seconds to maintain combo
    const comboDisplay = document.getElementById('combo-display');
    const comboContainer = document.getElementById('combo-container');
    
    // --- Slow motion effect variables ---
    let slowMotionActive = false;
    let slowMotionFactor = 1.0;
    const SLOW_MOTION_FACTOR = 0.5; // 50% slower
    const SLOW_MOTION_DISTANCE = 100; // Distance to trigger slow motion
    const SLOW_MOTION_TRANSITION_SPEED = 0.05; // How fast to transition

    console.log('Game elements loaded:', { 
        canvas: canvas, 
        startButton: startButton, 
        restartButton: restartButton,
        starryBackground: starryBackground
    });

    // Game field dimensions (standard size)
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    
    // Night mode toggle
    const nightModeBtn = document.getElementById('night-mode-toggle');
    function setNightMode(on) {
        if (on) {
            document.body.classList.add('night-mode');
            nightModeBtn.textContent = '☀️ Day Mode';
        } else {
            document.body.classList.remove('night-mode');
            nightModeBtn.textContent = '🌙 Night Mode';
        }
        // recreate starry background with brighter stars in night mode
        while (starryBackground.firstChild) starryBackground.removeChild(starryBackground.firstChild);
        createStarryBackground();
    }
    nightModeBtn.addEventListener('click', function() {
        const isNight = !document.body.classList.contains('night-mode');
        setNightMode(isNight);
        localStorage.setItem('nightMode', isNight ? '1' : '0');
    });
    // On load, restore night mode
    if (localStorage.getItem('nightMode') === '1') setNightMode(true);

    // --- Comet animation ---
    function spawnComet() {
        const isNight = document.body.classList.contains('night-mode');
        const startY = Math.random() * (starryBackground.clientHeight * 0.5);
        const length = Math.random() * 80 + 80;
        comets.push({
            x: -50,
            y: startY,
            vx: Math.random() * 4 + 6,
            vy: Math.random() * 1.5 + 2,
            length: length,
            alpha: isNight ? 1 : 0.7,
            life: 0,
            maxLife: Math.random() * 40 + 60
        });
    }
    function updateComets(bgCtx) {
        for (let i = comets.length - 1; i >= 0; i--) {
            const c = comets[i];
            c.x += c.vx;
            c.y += c.vy;
            c.life++;
            // Draw tail
            const grad = bgCtx.createLinearGradient(c.x, c.y, c.x - c.length, c.y - c.length * 0.3);
            grad.addColorStop(0, `rgba(255,255,255,${c.alpha})`);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            bgCtx.save();
            bgCtx.globalAlpha = c.alpha;
            bgCtx.strokeStyle = grad;
            bgCtx.lineWidth = 3;
            bgCtx.shadowColor = '#fffbe6';
            bgCtx.shadowBlur = 16;
            bgCtx.beginPath();
            bgCtx.moveTo(c.x, c.y);
            bgCtx.lineTo(c.x - c.length, c.y - c.length * 0.3);
            bgCtx.stroke();
            bgCtx.restore();
            if (c.life > c.maxLife || c.x > starryBackground.clientWidth + 100 || c.y > starryBackground.clientHeight + 100) {
                comets.splice(i, 1);
            }
        }
    }
    // Модифицировать createStarryBackground для комет
    function createStarryBackground() {
        const bgCanvas = document.createElement('canvas');
        const bgCtx = bgCanvas.getContext('2d');
        bgCanvas.width = starryBackground.clientWidth;
        bgCanvas.height = starryBackground.clientHeight;
        const bgGradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
        bgGradient.addColorStop(0, getComputedStyle(document.body).getPropertyValue('--star-bg'));
        bgGradient.addColorStop(1, getComputedStyle(document.body).getPropertyValue('--star-bg'));
        bgCtx.fillStyle = bgGradient;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        const starCount = Math.floor(bgCanvas.width * bgCanvas.height / 1000);
        const isNight = document.body.classList.contains('night-mode');
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * bgCanvas.width;
            const y = Math.random() * bgCanvas.height;
            const radius = Math.random() * (isNight ? 2.2 : 1.5);
            const opacity = Math.random() * (isNight ? 1 : 0.8) + 0.2;
            bgCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            bgCtx.beginPath();
            bgCtx.arc(x, y, radius, 0, Math.PI * 2);
            bgCtx.fill();
        }
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * bgCanvas.width;
            const y = Math.random() * bgCanvas.height;
            const radius = Math.random() * (bgCanvas.width / 8) + (bgCanvas.width / 16);
            const gradient = bgCtx.createRadialGradient(x, y, 0, x, y, radius);
            const hue = Math.random() * 60 + 200;
            gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, ${isNight ? 0.25 : 0.15})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            bgCtx.fillStyle = gradient;
            bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        }
        // Draw comets
        updateComets(bgCtx);
        starryBackground.style.background = 'none';
        starryBackground.appendChild(bgCanvas);
    }
    // Анимация комет
    setInterval(() => {
        if (Math.random() < 0.18) spawnComet();
        // Перерисовать только фон
        if (starryBackground.firstChild) {
            const bgCanvas = starryBackground.firstChild;
            const bgCtx = bgCanvas.getContext('2d');
            // Clear
            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            // Redraw bg
            const bgGradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
            bgGradient.addColorStop(0, getComputedStyle(document.body).getPropertyValue('--star-bg'));
            bgGradient.addColorStop(1, getComputedStyle(document.body).getPropertyValue('--star-bg'));
            bgCtx.fillStyle = bgGradient;
            bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
            // Redraw stars
            const starCount = Math.floor(bgCanvas.width * bgCanvas.height / 1000);
            const isNight = document.body.classList.contains('night-mode');
            for (let i = 0; i < starCount; i++) {
                const x = Math.random() * bgCanvas.width;
                const y = Math.random() * bgCanvas.height;
                const radius = Math.random() * (isNight ? 2.2 : 1.5);
                const opacity = Math.random() * (isNight ? 1 : 0.8) + 0.2;
                bgCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                bgCtx.beginPath();
                bgCtx.arc(x, y, radius, 0, Math.PI * 2);
                bgCtx.fill();
            }
            for (let i = 0; i < 5; i++) {
                const x = Math.random() * bgCanvas.width;
                const y = Math.random() * bgCanvas.height;
                const radius = Math.random() * (bgCanvas.width / 8) + (bgCanvas.width / 16);
                const gradient = bgCtx.createRadialGradient(x, y, 0, x, y, radius);
                const hue = Math.random() * 60 + 200;
                gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, ${isNight ? 0.25 : 0.15})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                bgCtx.fillStyle = gradient;
                bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
            }
            // Draw comets
            updateComets(bgCtx);
        }
    }, 60);
    
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
    let shields = []; // Array to store shield power-ups
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

    // --- Bird glow effect ---
    let birdGlow = 0.4; // базовая интенсивность
    let birdGlowTarget = 0.4;
    let birdGlowPulse = 0;

    // Модифицировать Bird.draw()
    const origBirdDraw = Bird.prototype.draw;
    Bird.prototype.draw = function() {
        // Пульсация
        birdGlowPulse += 0.08;
        birdGlowTarget = 0.4 + 0.15 * Math.sin(birdGlowPulse);
        // Плавное затухание к целевому
        birdGlow += (birdGlowTarget - birdGlow) * 0.15;
        ctx.save();
        ctx.shadowColor = `rgba(255,255,180,${birdGlow})`;
        ctx.shadowBlur = 32 + 32 * birdGlow;
        origBirdDraw.call(this);
        ctx.restore();
    };

    // Усиливать glow при сборе монеты или прохождении трубы
    function boostBirdGlow() {
        birdGlowTarget = 1.0;
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

    // --- Override playCollectEffect to boost bird glow on coin collection ---
    const origPlayCollectEffect = playCollectEffect;
    playCollectEffect = function(x, y) {
        boostBirdGlow();
        origPlayCollectEffect(x, y);
    };

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
            // Returns true if the pipe is completely off the left edge of the screen
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
            // Returns true if the coin is completely off the left edge of the screen
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
            // Returns true if the obstacle is completely off the left edge of the screen
            return this.x + this.width < 0;
        }
    }

    // Shield power-up class
    class Shield {
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
            this.rotation += 0.02;
            this.oscillation += 0.03;
            // Add gentle floating motion
            this.y += Math.sin(this.oscillation) * 0.5;
        }

        draw() {
            if (this.collected) return;
            
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation);
            
            // Draw shield icon
            ctx.fillStyle = '#4d79ff'; // Blue shield
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            
            // Draw shield symbol
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-this.width/4, 0);
            ctx.lineTo(0, -this.height/4);
            ctx.lineTo(this.width/4, 0);
            ctx.lineTo(0, this.height/4);
            ctx.closePath();
            ctx.fill();
            
            // Add glow
            ctx.shadowColor = '#4d79ff';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();
        }

        isOffScreen() {
            return this.x + this.width < 0;
        }
    }

    // Update shields
    function updateShields() {
        for (let i = shields.length - 1; i >= 0; i--) {
            shields[i].update();
            
            if (!shields[i].collected) {
                shields[i].draw();
                
                // Check shield collection
                if (bird.checkCollision(shields[i])) {
                    shields[i].collected = true;
                    activateShield();
                    
                    // Shield collection effect
                    playShieldEffect(shields[i].x, shields[i].y);
                }
            }
            
            // Remove shields that are off screen
            if (shields[i].isOffScreen()) {
                shields.splice(i, 1);
            }
        }
    }

    // Shield collection effect
    function playShieldEffect(x, y) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#4d79ff';
        ctx.shadowBlur = 15;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SHIELD!', x, y - 20);
        ctx.restore();
    }

    // Activate shield
    function activateShield() {
        shieldActive = true;
        shieldTimeLeft = SHIELD_DURATION;
        console.log('Shield activated!');
    }

    // Update shield status
    function updateShieldStatus(deltaTime) {
        if (shieldActive) {
            shieldTimeLeft -= deltaTime;
            if (shieldTimeLeft <= 0) {
                shieldActive = false;
                console.log('Shield deactivated!');
            }
        }
    }

    // Draw shield effect around bird
    function drawShieldEffect() {
        if (shieldActive) {
            const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 200);
            const radius = bird.width * 0.8 * (1 + 0.2 * pulseIntensity);
            
            ctx.save();
            ctx.globalAlpha = 0.3 + 0.2 * pulseIntensity;
            ctx.beginPath();
            ctx.arc(bird.x + bird.width/2, bird.y + bird.height/2, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(77, 121, 255, ${0.3 + 0.2 * pulseIntensity})`;
            ctx.fill();
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + 0.4 * pulseIntensity})`;
            ctx.stroke();
            ctx.restore();
        }
    }

    // Update combo system
    function updateCombo(deltaTime) {
        if (comboCount > 0) {
            comboTimeLeft -= deltaTime;
            
            // Update combo display
            if (comboContainer) {
                comboContainer.style.display = 'block';
                const percentage = Math.max(0, comboTimeLeft / COMBO_DURATION * 100);
                document.getElementById('combo-bar-fill').style.width = percentage + '%';
                document.getElementById('combo-count').textContent = comboCount + 'x';
            }
            
            if (comboTimeLeft <= 0) {
                resetCombo();
            }
        }
    }
    
    // Reset combo
    function resetCombo() {
        comboCount = 0;
        comboTimeLeft = 0;
        if (comboContainer) {
            comboContainer.style.display = 'none';
        }
    }
    
    // Add to combo
    function addToCombo() {
        comboCount++;
        comboTimeLeft = COMBO_DURATION;
        
        // Show combo effect
        if (comboContainer) {
            comboContainer.style.display = 'block';
            comboContainer.classList.add('combo-pulse');
            setTimeout(() => {
                comboContainer.classList.remove('combo-pulse');
            }, 300);
        }
        
        // Add bonus points based on combo
        const bonusPoints = comboCount - 1; // No bonus for first coin
        if (bonusPoints > 0) {
            score += bonusPoints;
            showComboText(bonusPoints);
        }
    }
    
    // Show combo bonus text
    function showComboText(bonusPoints) {
        const comboText = document.createElement('div');
        comboText.className = 'combo-text';
        comboText.textContent = `+${bonusPoints} COMBO!`;
        document.querySelector('.game-container').appendChild(comboText);
        
        // Position near the bird
        comboText.style.left = (bird.x + bird.width/2) + 'px';
        comboText.style.top = (bird.y - 30) + 'px';
        
        // Remove after animation
        setTimeout(() => {
            comboText.remove();
        }, 1000);
    }
    
    // Check for slow motion trigger
    function checkSlowMotion() {
        let shouldActivate = false;
        
        // Check proximity to obstacles
        for (const obstacle of obstacles) {
            const dx = obstacle.x - bird.x;
            if (dx > 0 && dx < SLOW_MOTION_DISTANCE) {
                shouldActivate = true;
                break;
            }
        }
        
        // Check proximity to pipes
        for (const pipe of pipes) {
            const dx = pipe.x - bird.x;
            if (dx > 0 && dx < SLOW_MOTION_DISTANCE) {
                // Check if bird is near the gap edges
                const gapTop = pipe.topHeight;
                const gapBottom = pipe.bottomY;
                
                // If bird is within 30px of edge, activate slow motion
                if (Math.abs(bird.y - gapTop) < 30 || Math.abs(bird.y + bird.height - gapBottom) < 30) {
                    shouldActivate = true;
                    break;
                }
            }
        }
        
        // Gradually transition to target slow motion factor
        const targetFactor = shouldActivate ? SLOW_MOTION_FACTOR : 1.0;
        slowMotionFactor += (targetFactor - slowMotionFactor) * SLOW_MOTION_TRANSITION_SPEED;
        
        // Update visual effects based on slow motion
        if (slowMotionFactor < 0.9) {
            document.body.classList.add('slow-motion');
            const intensity = 1 - slowMotionFactor; // 0 to 0.5
            document.documentElement.style.setProperty('--slow-motion-intensity', intensity);
        } else {
            document.body.classList.remove('slow-motion');
        }
    }

    // Update coins - modified to include combo system
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
                    
                    // Add to combo
                    addToCombo();
                    
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

    // Check collisions - modified to account for shield
    function checkCollisions() {
        // Skip collision detection if shield is active
        if (shieldActive) return;
        
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
        
        // Dispatch gameOver event for high score tracking
        document.dispatchEvent(new CustomEvent('gameOver', {
            detail: {
                score: score,
                ethCollected: ethCollected,
                distance: Math.floor(distanceTraveled)
            }
        }));
    }

    // Main game loop - modified to include combo and slow motion
    function gameLoop() {
        if (!gameActive) return;
        
        // Calculate delta time for smooth animations
        const now = Date.now();
        const deltaTime = now - (lastTime || now);
        lastTime = now;
        
        // Apply slow motion to delta time
        const adjustedDeltaTime = deltaTime * slowMotionFactor;
        
        // Clear canvas
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        
        // Draw game background (transparent to let the starry background show)
        ctx.drawImage(backgroundCanvas, 0, 0);
        
        // Update frame counter
        frameCount++;
        
        // Check for slow motion
        checkSlowMotion();
        
        // Create new pipes
        if (frameCount % PIPE_SPAWN_INTERVAL === 0) {
            pipes.push(new Pipe());
            
            // Random coin creation
            if (Math.random() < COIN_SPAWN_CHANCE) {
                const randomY = Math.random() * (HEIGHT - 100) + 50;
                coins.push(new Coin(WIDTH, randomY));
            }
            
            // Random shield creation
            if (Math.random() < SHIELD_SPAWN_CHANCE) {
                const randomY = Math.random() * (HEIGHT - 100) + 50;
                shields.push(new Shield(WIDTH, randomY));
            }
            
            // Random obstacle creation
            if (Math.random() < 0.2) {
                obstacles.push(new Obstacle());
            }
            
            // Increase score and distance
            score++;
            distanceTraveled += PIPE_SPEED * PIPE_SPAWN_INTERVAL;
            updateScore();
            boostBirdGlow();
        }
        
        // Update shield status
        updateShieldStatus(adjustedDeltaTime);
        
        // Update combo
        updateCombo(adjustedDeltaTime);
        
        // Update and draw bird
        bird.update();
        bird.draw();
        
        // Draw shield effect if active
        drawShieldEffect();
        
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
        
        // Update and draw shields
        updateShields();
        
        // Update and draw obstacles
        updateObstacles();
        
        // Check collisions
        checkCollisions();
        
        // Continue game loop
        if (gameActive) {
            requestAnimationFrame(gameLoop);
        }
    }

    // Game initialization function - modified to reset combo and slow motion
    function initGame() {
        console.log('Initializing game...');
        bird = new Bird();
        pipes = [];
        coins = [];
        obstacles = [];
        shields = [];
        score = 0;
        ethCollected = 0;
        distanceTraveled = 0;
        frameCount = 0;
        shieldActive = false;
        shieldTimeLeft = 0;
        comboCount = 0;
        comboTimeLeft = 0;
        slowMotionFactor = 1.0;
        lastTime = null;
        
        updateScore();
        resetCombo();
        
        gameOver.style.display = 'none';
        
        gameActive = true;
        
        // Start game loop
        requestAnimationFrame(gameLoop);
    }

    // Add lastTime variable for delta time calculation
    let lastTime = null;

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
