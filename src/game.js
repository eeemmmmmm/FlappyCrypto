import { GameEngine } from './engine/GameEngine.js';
import { ParticleSystem } from './effects/ParticleSystem.js';
import { AudioManager } from './audio/AudioManager.js';

// Wait for DOM to fully load before executing code
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Initializing Enhanced FlappyCrypto Game Engine...');
    
    // Main game variables
    const canvas = document.getElementById('game-canvas');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const gameOver = document.getElementById('game-over');
    const scoreDisplay = document.getElementById('score');
    const ethDisplay = document.getElementById('eth');
    const finalScoreDisplay = document.getElementById('final-score');
    const ethCollectedDisplay = document.getElementById('eth-collected');
    const distanceTraveledDisplay = document.getElementById('distance-traveled');
    const starryBackground = document.getElementById('starry-background');

    // Initialize advanced game engine
    const gameEngine = new GameEngine(canvas, {
        enablePerformanceMonitoring: true,
        enableObjectPooling: true,
        enableParticleSystem: true,
        enableAudioSystem: true,
        targetFPS: 60
    });

    // Enhanced comet system with performance optimization
    let comets = [];
    let cometPool = [];
    
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
    
    // --- Double points power-up variables ---
    let doublePointsActive = false;
    let doublePointsTimeLeft = 0;
    const DOUBLE_POINTS_DURATION = 10000; // 10 seconds of double points
    const DOUBLE_POINTS_SPAWN_CHANCE = 0.05; // 5% chance to spawn double points power-up
    const doublePointsContainer = document.getElementById('double-points-container');

    console.log('Game elements loaded:', { 
        canvas: canvas, 
        startButton: startButton, 
        restartButton: restartButton,
        starryBackground: starryBackground
    });

    // Game field dimensions (standard size)
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    
    // Enhanced physics configuration
    const PHYSICS = {
        gravity: 0.25,
        flapPower: -6,
        terminalVelocity: 12,
        airResistance: 0.02,
        windForce: 0.1
    };
    
    // Enhanced game configuration
    const CONFIG = {
        pipeSpeed: 1.5,
        pipeSpawnInterval: 180,
        pipeGap: 200,
        coinSpawnChance: 0.5,
        difficultyIncrease: 0.001,
        maxDifficulty: 2.0
    };
    
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
    let doublePoints = []; // Array to store double points power-ups
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

    // Enhanced Bird class with advanced physics and effects
    class EnhancedBird {
        constructor() {
            this.x = WIDTH / 4;
            this.y = HEIGHT / 2;
            this.velocity = 0;
            this.width = 40;
            this.height = 30;
            this.alive = true;
            this.rotation = 0;
            
            // Enhanced physics
            this.acceleration = 0;
            this.maxVelocity = PHYSICS.terminalVelocity;
            this.horizontalVelocity = 0;
            
            // Visual enhancements
            this.scale = 1.0;
            this.targetScale = 1.0;
            this.glowIntensity = 0.4;
            this.targetGlow = 0.4;
            this.pulsePhase = 0;
            
            // Trail effect
            this.trailPositions = [];
            this.maxTrailLength = 8;
            
            // Animation state
            this.animationFrame = 0;
            this.wingPhase = 0;
            
            // Physics state
            this.isFlapping = false;
            this.flapCooldown = 0;
            
            // Stats tracking
            this.stats = {
                totalFlaps: 0,
                airTime: 0,
                maxAltitude: HEIGHT
            };
        }

        flap() {
            if (this.alive && this.flapCooldown <= 0) {
                this.velocity = PHYSICS.flapPower;
                this.acceleration = 0;
                this.isFlapping = true;
                this.flapCooldown = 100; // ms
                
                // Visual effects
                this.targetScale = 1.2;
                this.targetGlow = 1.0;
                
                // Create flap particles
                gameEngine.createParticleEffect('trail', 
                    this.x - 10, this.y + this.height/2, 
                    {
                        count: 3,
                        speedRange: [-2, 0],
                        sizeRange: [1, 3],
                        lifeRange: [200, 400],
                        colors: ['#62c9ff', '#ffffff']
                    }
                );
                
                // Play flap sound
                gameEngine.playSFX('flap', { 
                    pitch: 0.8 + Math.random() * 0.4,
                    volume: 0.7 
                });
                
                this.stats.totalFlaps++;
            }
        }

        update(deltaTime) {
            // Update cooldowns
            this.flapCooldown = Math.max(0, this.flapCooldown - deltaTime);
            
            // Enhanced physics
            if (!this.isFlapping) {
                this.acceleration += PHYSICS.gravity * (deltaTime / 16.67);
            }
            
            // Apply air resistance
            this.velocity *= (1 - PHYSICS.airResistance * (deltaTime / 16.67));
            
            // Update velocity
            this.velocity += this.acceleration * (deltaTime / 16.67);
            this.velocity = Math.min(this.velocity, this.maxVelocity);
            
            // Update position
            this.y += this.velocity * (deltaTime / 16.67);
            
            // Horizontal drift (wind effect)
            this.horizontalVelocity += (Math.random() - 0.5) * PHYSICS.windForce;
            this.horizontalVelocity *= 0.95; // Damping
            this.x += this.horizontalVelocity * (deltaTime / 16.67);
            
            // Keep bird in horizontal bounds with slight elasticity
            if (this.x < 20) {
                this.x = 20;
                this.horizontalVelocity = Math.abs(this.horizontalVelocity) * 0.5;
            }
            if (this.x > WIDTH - this.width - 20) {
                this.x = WIDTH - this.width - 20;
                this.horizontalVelocity = -Math.abs(this.horizontalVelocity) * 0.5;
            }
            
            // Boundary checks
            if (this.y < 0) {
                this.y = 0;
                this.velocity = Math.max(0, this.velocity);
            }
            
            if (this.y + this.height > HEIGHT) {
                this.y = HEIGHT - this.height;
                this.alive = false;
            }
            
            // Update rotation based on velocity and horizontal movement
            const targetRotation = Math.min(Math.PI/4, Math.max(-Math.PI/4, 
                this.velocity * 0.06 + this.horizontalVelocity * 0.1));
            this.rotation += (targetRotation - this.rotation) * 0.1;
            
            // Update visual effects
            this.pulsePhase += 0.08 * (deltaTime / 16.67);
            this.targetGlow = 0.4 + 0.15 * Math.sin(this.pulsePhase);
            this.glowIntensity += (this.targetGlow - this.glowIntensity) * 0.15;
            
            // Scale animation
            this.scale += (this.targetScale - this.scale) * 0.2;
            this.targetScale += (1.0 - this.targetScale) * 0.1;
            
            // Wing animation
            this.wingPhase += 0.3 * (deltaTime / 16.67);
            
            // Trail effect
            this.updateTrail();
            
            // Update stats
            this.stats.airTime += deltaTime;
            this.stats.maxAltitude = Math.min(this.stats.maxAltitude, this.y);
            
            // Reset flapping state
            this.isFlapping = false;
            
            // Create trail particles when moving fast
            if (Math.abs(this.velocity) > 3) {
                gameEngine.getSystem('particles').createTrail(
                    this.x + this.width/2, this.y + this.height/2,
                    -this.velocity * 0.2, this.horizontalVelocity,
                    '#62c9ff', Math.abs(this.velocity) / 10
                );
            }
        }

        updateTrail() {
            // Add current position to trail
            this.trailPositions.push({
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                time: Date.now()
            });
            
            // Remove old trail positions
            const now = Date.now();
            this.trailPositions = this.trailPositions.filter(pos => 
                now - pos.time < 500 && this.trailPositions.length <= this.maxTrailLength
            );
        }

        render(ctx) {
            // Draw trail
            this.drawTrail(ctx);
            
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(this.scale, this.scale);
            ctx.rotate(this.rotation);
            
            // Enhanced glow effect
            ctx.shadowColor = `rgba(98, 201, 255, ${this.glowIntensity})`;
            ctx.shadowBlur = 20 + 20 * this.glowIntensity;
            
            // Wing animation
            const wingOffset = Math.sin(this.wingPhase) * 3;
            
            // Draw ETH symbol with wing animation
            ctx.fillStyle = '#62c9ff';
            ctx.beginPath();
            ctx.moveTo(-this.width/2, wingOffset);
            ctx.lineTo(0, -this.height/2 - wingOffset);
            ctx.lineTo(this.width/2, wingOffset);
            ctx.lineTo(0, this.height/2 + wingOffset);
            ctx.closePath();
            ctx.fill();
            
            // Add details with wing animation
            ctx.fillStyle = '#3ab0ff';
            ctx.beginPath();
            ctx.moveTo(-this.width/2, wingOffset);
            ctx.lineTo(0, this.height/4 + wingOffset);
            ctx.lineTo(this.width/2, wingOffset);
            ctx.closePath();
            ctx.fill();
            
            // Enhanced outline
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 + 0.3 * this.glowIntensity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Speed lines when moving fast
            if (Math.abs(this.velocity) > 5) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${Math.abs(this.velocity) / 15})`;
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const offset = (i + 1) * 8;
                    ctx.beginPath();
                    ctx.moveTo(-this.width/2 - offset, -2 + i * 2);
                    ctx.lineTo(-this.width/2 - offset - 10, -2 + i * 2);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        }
        
        drawTrail(ctx) {
            if (this.trailPositions.length < 2) return;
            
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            
            for (let i = 1; i < this.trailPositions.length; i++) {
                const pos = this.trailPositions[i];
                const prevPos = this.trailPositions[i - 1];
                const age = (Date.now() - pos.time) / 500;
                const alpha = (1 - age) * 0.3;
                
                if (alpha <= 0) continue;
                
                ctx.strokeStyle = `rgba(98, 201, 255, ${alpha})`;
                ctx.lineWidth = (1 - age) * 3;
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                ctx.moveTo(prevPos.x, prevPos.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }
            
            ctx.restore();
        }

        checkCollision(object) {
            // Enhanced collision detection with rotation
            const hitboxShrink = 3; // More forgiving
            const centerX = this.x + this.width/2;
            const centerY = this.y + this.height/2;
            
            // Rotated bounding box collision (simplified)
            const cos = Math.cos(-this.rotation);
            const sin = Math.sin(-this.rotation);
            
            // Check object corners against rotated bird bounds
            const corners = [
                { x: object.x, y: object.y },
                { x: object.x + object.width, y: object.y },
                { x: object.x, y: object.y + object.height },
                { x: object.x + object.width, y: object.y + object.height }
            ];
            
            for (const corner of corners) {
                // Rotate corner relative to bird center
                const dx = corner.x - centerX;
                const dy = corner.y - centerY;
                const rotX = dx * cos - dy * sin;
                const rotY = dx * sin + dy * cos;
                
                // Check if rotated corner is inside bird bounds
                if (Math.abs(rotX) < (this.width/2 - hitboxShrink) && 
                    Math.abs(rotY) < (this.height/2 - hitboxShrink)) {
                    return true;
                }
            }
            
            return false;
        }
        
        getStats() {
            return {
                ...this.stats,
                currentAltitude: HEIGHT - this.y,
                efficiency: this.stats.totalFlaps > 0 ? 
                    (this.stats.airTime / this.stats.totalFlaps).toFixed(1) + 'ms/flap' : 'N/A'
            };
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

    // Double Points power-up class
    class DoublePoints {
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
            this.rotation += 0.04;
            this.oscillation += 0.03;
            // Add gentle floating motion
            this.y += Math.sin(this.oscillation) * 0.5;
        }

        draw() {
            if (this.collected) return;
            
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation);
            
            // Draw double points icon (x2)
            ctx.fillStyle = '#ff3366';
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            
            // Draw x2 text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('x2', 0, 0);
            
            // Add glow
            ctx.shadowColor = '#ff3366';
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

    // Update double points power-ups
    function updateDoublePoints() {
        for (let i = doublePoints.length - 1; i >= 0; i--) {
            doublePoints[i].update();
            
            if (!doublePoints[i].collected) {
                doublePoints[i].draw();
                
                // Check double points collection
                if (bird.checkCollision(doublePoints[i])) {
                    doublePoints[i].collected = true;
                    activateDoublePoints();
                    
                    // Double points collection effect
                    playDoublePointsEffect(doublePoints[i].x, doublePoints[i].y);
                }
            }
            
            // Remove double points that are off screen
            if (doublePoints[i].isOffScreen()) {
                doublePoints.splice(i, 1);
            }
        }
    }

    // Double points collection effect
    function playDoublePointsEffect(x, y) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = 15;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DOUBLE POINTS!', x, y - 20);
        ctx.restore();
    }

    // Activate double points
    function activateDoublePoints() {
        doublePointsActive = true;
        doublePointsTimeLeft = DOUBLE_POINTS_DURATION;
        console.log('Double points activated!');
        
        // Show double points indicator
        if (doublePointsContainer) {
            doublePointsContainer.style.display = 'block';
            doublePointsContainer.classList.add('power-up-pulse');
            setTimeout(() => {
                doublePointsContainer.classList.remove('power-up-pulse');
            }, 500);
        }
    }

    // Update double points status
    function updateDoublePointsStatus(deltaTime) {
        if (doublePointsActive) {
            doublePointsTimeLeft -= deltaTime;
            
            // Update UI if container exists
            if (doublePointsContainer) {
                const secondsLeft = Math.ceil(doublePointsTimeLeft / 1000);
                document.getElementById('double-points-time').textContent = secondsLeft + 's';
                
                // Update progress bar
                const percentage = Math.max(0, doublePointsTimeLeft / DOUBLE_POINTS_DURATION * 100);
                document.getElementById('double-points-bar-fill').style.width = percentage + '%';
            }
            
            if (doublePointsTimeLeft <= 0) {
                doublePointsActive = false;
                console.log('Double points deactivated!');
                
                // Hide double points indicator
                if (doublePointsContainer) {
                    doublePointsContainer.style.display = 'none';
                }
            }
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
            
            // Random double points creation
            if (Math.random() < DOUBLE_POINTS_SPAWN_CHANCE) {
                const randomY = Math.random() * (HEIGHT - 100) + 50;
                doublePoints.push(new DoublePoints(WIDTH, randomY));
            }
            
            // Random obstacle creation
            if (Math.random() < 0.2) {
                obstacles.push(new Obstacle());
            }
            
            // Increase score and distance
            // Apply double points if active
            const pointsToAdd = doublePointsActive ? 2 : 1;
            score += pointsToAdd;
            
            // Show double points effect if active
            if (doublePointsActive) {
                const doubleText = document.createElement('div');
                doubleText.className = 'double-points-text';
                doubleText.textContent = '+2';
                document.querySelector('.game-container').appendChild(doubleText);
                
                // Position near the bird
                doubleText.style.left = (bird.x + bird.width/2) + 'px';
                doubleText.style.top = (bird.y - 50) + 'px';
                
                // Remove after animation
                setTimeout(() => {
                    doubleText.remove();
                }, 1000);
            }
            
            distanceTraveled += PIPE_SPEED * PIPE_SPAWN_INTERVAL;
            updateScore();
            boostBirdGlow();
        }
        
        // Update shield status
        updateShieldStatus(adjustedDeltaTime);
        
        // Update double points status
        updateDoublePointsStatus(adjustedDeltaTime);
        
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
        
        // Update and draw double points
        updateDoublePoints();
        
        // Update and draw obstacles
        updateObstacles();
        
        // Check collisions
        checkCollisions();
        
        // Continue game loop
        if (gameActive) {
            requestAnimationFrame(gameLoop);
        }
    }

    // Enhanced Game Scene with Modern Architecture
    class GameScene {
        constructor() {
            this.reset();
        }
        
        reset() {
            // Core game state
            this.bird = null;
            this.gameEntities = {
                pipes: [],
                coins: [],
                obstacles: [],
                shields: [],
                powerups: []
            };
            
            // Game statistics
            this.gameStats = {
                score: 0,
                ethCollected: 0,
                distanceTraveled: 0,
                frameCount: 0,
                startTime: Date.now(),
                gameTime: 0
            };
            
            // Power-up states
            this.powerUpStates = {
                shield: { active: false, timeLeft: 0, duration: 5000 },
                doublePoints: { active: false, timeLeft: 0, duration: 10000 },
                combo: { count: 0, timeLeft: 0, duration: 3000 }
            };
            
            // Game configuration (dynamic difficulty)
            this.difficulty = {
                current: 1.0,
                increase: CONFIG.difficultyIncrease,
                max: CONFIG.maxDifficulty
            };
            
            // Performance tracking
            this.performanceStats = {
                avgFPS: 60,
                frameSkips: 0,
                lastOptimization: Date.now()
            };
            
            this.isActive = false;
            this.isPaused = false;
        }
        
        onEnter(engine) {
            console.log('🎮 Starting Enhanced FlappyCrypto Game...');
            
            this.engine = engine;
            this.reset();
            
            // Create enhanced bird
            this.bird = new EnhancedBird();
            engine.addEntity(this.bird);
            
            // Initialize UI
            this.updateUI();
            this.hideGameOver();
            this.hidePowerUpIndicators();
            
            this.isActive = true;
            
            // Play start sound
            engine.playSFX('powerup', { pitch: 1.2, volume: 0.5 });
            
            // Create start particle effect
            engine.createParticleEffect('sparkle', WIDTH/2, HEIGHT/2, {
                count: 20,
                speedRange: [2, 6],
                sizeRange: [2, 8],
                colors: ['#62c9ff', '#62ffbd', '#ffffff']
            });
        }
        
        onExit() {
            this.isActive = false;
            this.cleanup();
        }
        
        onInput(type, data) {
            if (!this.isActive || this.isPaused) return;
            
            // Handle flap inputs
            if ((type === 'keydown' && data.code === 'Space') ||
                type === 'mousedown' || type === 'touchstart') {
                
                if (data.event) data.event.preventDefault();
                
                if (this.bird && this.bird.alive) {
                    this.bird.flap();
                }
            }
            
            // Debug controls (dev mode)
            if (type === 'keydown') {
                switch (data.code) {
                    case 'KeyD':
                        this.engine.debug.enabled = !this.engine.debug.enabled;
                        break;
                    case 'KeyP':
                        this.togglePause();
                        break;
                    case 'KeyR':
                        if (!this.bird.alive) this.restart();
                        break;
                }
            }
        }
        
        update(deltaTime) {
            if (!this.isActive || this.isPaused) return;
            
            // Update game time
            this.gameStats.gameTime = Date.now() - this.gameStats.startTime;
            
            // Update difficulty over time
            this.updateDifficulty();
            
            // Spawn new entities
            this.spawnEntities();
            
            // Update power-up states
            this.updatePowerUps(deltaTime);
            
            // Update game entities using pools
            this.updateEntities(deltaTime);
            
            // Check collisions with spatial partitioning
            this.checkCollisions();
            
            // Update UI
            this.updateUI();
            
            // Performance monitoring
            this.updatePerformance();
            
            // Check game over condition
            if (this.bird && !this.bird.alive) {
                this.endGame();
            }
        }
        
        render(ctx, interpolation) {
            // Background is already rendered by starry background system
            
            // Render entities with interpolation
            for (const [type, entities] of Object.entries(this.gameEntities)) {
                for (const entity of entities) {
                    if (entity.render && entity.active !== false) {
                        ctx.save();
                        entity.render(ctx, interpolation);
                        ctx.restore();
                    }
                }
            }
            
            // Render power-up effects
            this.renderPowerUpEffects(ctx);
            
            // Render UI overlays
            this.renderUIOverlays(ctx);
        }
        
        updateDifficulty() {
            const timeFactor = this.gameStats.gameTime / 60000; // Increase every minute
            this.difficulty.current = Math.min(
                1.0 + timeFactor * this.difficulty.increase,
                this.difficulty.max
            );
        }
        
        spawnEntities() {
            this.gameStats.frameCount++;
            
            // Adjusted spawn rate based on difficulty
            const spawnInterval = Math.max(
                CONFIG.pipeSpawnInterval / this.difficulty.current,
                120 // Minimum interval
            );
            
            if (this.gameStats.frameCount % Math.floor(spawnInterval) === 0) {
                this.spawnPipe();
                this.spawnCollectibles();
                this.incrementScore();
            }
        }
        
        spawnPipe() {
            const pipe = this.engine.getSystem('pools').pipes.acquire();
            this.initializePipe(pipe);
            this.gameEntities.pipes.push(pipe);
        }
        
        spawnCollectibles() {
            // Spawn coin
            if (Math.random() < CONFIG.coinSpawnChance) {
                const coin = this.engine.getSystem('pools').coins.acquire();
                this.initializeCoin(coin);
                this.gameEntities.coins.push(coin);
            }
            
            // Spawn power-ups based on difficulty and chance
            if (Math.random() < 0.1 * this.difficulty.current) {
                this.spawnRandomPowerUp();
            }
            
            // Spawn obstacles
            if (Math.random() < 0.2 * this.difficulty.current) {
                const obstacle = this.engine.getSystem('pools').obstacles.acquire();
                this.initializeObstacle(obstacle);
                this.gameEntities.obstacles.push(obstacle);
            }
        }
        
        spawnRandomPowerUp() {
            const powerUpType = Math.random() < 0.7 ? 'shield' : 'doublePoints';
            const powerUp = this.engine.getSystem('pools').powerups.acquire();
            this.initializePowerUp(powerUp, powerUpType);
            this.gameEntities.shields.push(powerUp); // Using shields array for compatibility
        }
        
        initializePipe(pipe) {
            pipe.x = WIDTH;
            pipe.width = 60;
            pipe.passed = false;
            pipe.active = true;
            
            const minTopHeight = 50;
            const maxTopHeight = HEIGHT - CONFIG.pipeGap - 50;
            pipe.topHeight = minTopHeight + Math.random() * (maxTopHeight - minTopHeight);
            pipe.bottomY = pipe.topHeight + CONFIG.pipeGap;
            pipe.bottomHeight = HEIGHT - pipe.bottomY;
            
            pipe.update = function(deltaTime) {
                this.x -= CONFIG.pipeSpeed * (deltaTime / 16.67);
            };
            
            pipe.render = function(ctx) {
                // Enhanced pipe rendering with gradients
                const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
                gradient.addColorStop(0, '#ff4d4d');
                gradient.addColorStop(0.5, '#cc0000');
                gradient.addColorStop(1, '#ff4d4d');
                
                ctx.fillStyle = gradient;
                
                // Top pipe
                ctx.fillRect(this.x, 0, this.width, this.topHeight);
                // Bottom pipe
                ctx.fillRect(this.x, this.bottomY, this.width, this.bottomHeight);
                
                // Enhanced pipe caps
                ctx.fillStyle = '#ff6666';
                ctx.fillRect(this.x - 5, this.topHeight - 20, this.width + 10, 20);
                ctx.fillRect(this.x - 5, this.bottomY, this.width + 10, 20);
            };
            
            pipe.isOffScreen = function() {
                return this.x + this.width < 0;
            };
        }
        
        initializeCoin(coin) {
            coin.x = WIDTH;
            coin.y = Math.random() * (HEIGHT - 100) + 50;
            coin.width = 30;
            coin.height = 30;
            coin.active = true;
            coin.collected = false;
            coin.rotation = 0;
            coin.oscillation = 0;
            
            coin.update = function(deltaTime) {
                this.x -= CONFIG.pipeSpeed * (deltaTime / 16.67);
                this.rotation += 0.03 * (deltaTime / 16.67);
                this.oscillation += 0.03 * (deltaTime / 16.67);
                this.y += Math.sin(this.oscillation) * 0.5;
            };
            
            coin.render = function(ctx) {
                if (this.collected) return;
                
                ctx.save();
                ctx.translate(this.x + this.width/2, this.y + this.height/2);
                ctx.rotate(this.rotation);
                
                // Enhanced coin with better glow
                ctx.shadowColor = '#62ffbd';
                ctx.shadowBlur = 15;
                
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
            };
            
            coin.isOffScreen = function() {
                return this.x + this.width < 0;
            };
        }
        
        initializeObstacle(obstacle) {
            obstacle.x = WIDTH;
            obstacle.y = Math.random() * (HEIGHT - 100) + 50;
            obstacle.width = 40;
            obstacle.height = 40;
            obstacle.active = true;
            obstacle.type = Math.random() < 0.5 ? 'bear' : 'bug';
            obstacle.rotation = 0;
            obstacle.rotationSpeed = (Math.random() - 0.5) * 0.01;
            
            obstacle.update = function(deltaTime) {
                this.x -= CONFIG.pipeSpeed * 1.1 * (deltaTime / 16.67);
                this.rotation += this.rotationSpeed * (deltaTime / 16.67);
            };
            
            obstacle.render = function(ctx) {
                ctx.save();
                ctx.translate(this.x + this.width/2, this.y + this.height/2);
                ctx.rotate(this.rotation);
                
                if (this.type === 'bear') {
                    ctx.shadowColor = '#ff6b6b';
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = '#ff6b6b';
                    
                    // Bear ears
                    ctx.beginPath();
                    ctx.arc(-this.width/4, -this.height/4, this.width/4, 0, Math.PI * 2);
                    ctx.arc(this.width/4, -this.height/4, this.width/4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Bear face
                    ctx.beginPath();
                    ctx.arc(0, this.height/5, this.width/3, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.shadowColor = '#4d79ff';
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = '#4d79ff';
                    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                    
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('!', 0, 0);
                }
                
                ctx.restore();
            };
            
            obstacle.isOffScreen = function() {
                return this.x + this.width < 0;
            };
        }
        
        initializePowerUp(powerUp, type) {
            powerUp.x = WIDTH;
            powerUp.y = Math.random() * (HEIGHT - 100) + 50;
            powerUp.width = 30;
            powerUp.height = 30;
            powerUp.active = true;
            powerUp.collected = false;
            powerUp.type = type;
            powerUp.rotation = 0;
            powerUp.oscillation = 0;
            
            powerUp.update = function(deltaTime) {
                this.x -= CONFIG.pipeSpeed * (deltaTime / 16.67);
                this.rotation += 0.04 * (deltaTime / 16.67);
                this.oscillation += 0.03 * (deltaTime / 16.67);
                this.y += Math.sin(this.oscillation) * 0.5;
            };
            
            powerUp.render = function(ctx) {
                if (this.collected) return;
                
                ctx.save();
                ctx.translate(this.x + this.width/2, this.y + this.height/2);
                ctx.rotate(this.rotation);
                
                const color = this.type === 'shield' ? '#4d79ff' : '#ff3366';
                ctx.shadowColor = color;
                ctx.shadowBlur = 15;
                ctx.fillStyle = color;
                
                ctx.beginPath();
                ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.type === 'shield' ? '🛡️' : 'x2', 0, 0);
                
                ctx.restore();
            };
            
            powerUp.isOffScreen = function() {
                return this.x + this.width < 0;
            };
        }
        
        updateEntities(deltaTime) {
            // Update all entity types
            for (const [type, entities] of Object.entries(this.gameEntities)) {
                for (let i = entities.length - 1; i >= 0; i--) {
                    const entity = entities[i];
                    
                    if (entity.update) {
                        entity.update(deltaTime);
                    }
                    
                    // Remove off-screen entities and return to pool
                    if (entity.isOffScreen && entity.isOffScreen()) {
                        const pool = this.engine.getSystem('pools')[type];
                        if (pool) {
                            pool.release(entity);
                        }
                        entities.splice(i, 1);
                    }
                }
            }
        }
        
        updatePowerUps(deltaTime) {
            // Update shield
            if (this.powerUpStates.shield.active) {
                this.powerUpStates.shield.timeLeft -= deltaTime;
                if (this.powerUpStates.shield.timeLeft <= 0) {
                    this.deactivateShield();
                }
                this.updateShieldUI();
            }
            
            // Update double points
            if (this.powerUpStates.doublePoints.active) {
                this.powerUpStates.doublePoints.timeLeft -= deltaTime;
                if (this.powerUpStates.doublePoints.timeLeft <= 0) {
                    this.deactivateDoublePoints();
                }
                this.updateDoublePointsUI();
            }
            
            // Update combo
            if (this.powerUpStates.combo.count > 0) {
                this.powerUpStates.combo.timeLeft -= deltaTime;
                if (this.powerUpStates.combo.timeLeft <= 0) {
                    this.resetCombo();
                }
                this.updateComboUI();
            }
        }
        
        checkCollisions() {
            if (!this.bird || !this.bird.alive) return;
            
            // Skip if shield is active
            if (this.powerUpStates.shield.active) return;
            
            // Check pipe collisions
            for (const pipe of this.gameEntities.pipes) {
                if (this.bird.checkCollision({ x: pipe.x, y: 0, width: pipe.width, height: pipe.topHeight }) ||
                    this.bird.checkCollision({ x: pipe.x, y: pipe.bottomY, width: pipe.width, height: pipe.bottomHeight })) {
                    this.handleCollision('pipe');
                    return;
                }
            }
            
            // Check obstacle collisions
            for (const obstacle of this.gameEntities.obstacles) {
                if (this.bird.checkCollision(obstacle)) {
                    this.handleCollision('obstacle');
                    return;
                }
            }
            
            // Check collectible interactions
            this.checkCollectibleCollisions();
        }
        
        checkCollectibleCollisions() {
            // Check coin collection
            for (const coin of this.gameEntities.coins) {
                if (!coin.collected && this.bird.checkCollision(coin)) {
                    this.collectCoin(coin);
                }
            }
            
            // Check power-up collection
            for (const powerUp of this.gameEntities.shields) {
                if (!powerUp.collected && this.bird.checkCollision(powerUp)) {
                    this.collectPowerUp(powerUp);
                }
            }
        }
        
        collectCoin(coin) {
            coin.collected = true;
            this.gameStats.ethCollected++;
            this.addToCombo();
            
            // Effects
            this.engine.createParticleEffect('collect', coin.x + coin.width/2, coin.y + coin.height/2);
            this.engine.playSFX('collect', { pitch: 1.0 + this.powerUpStates.combo.count * 0.1 });
        }
        
        collectPowerUp(powerUp) {
            powerUp.collected = true;
            
            if (powerUp.type === 'shield') {
                this.activateShield();
            } else if (powerUp.type === 'doublePoints') {
                this.activateDoublePoints();
            }
            
            // Effects
            this.engine.createParticleEffect('powerup', powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
            this.engine.playSFX('powerup');
        }
        
        handleCollision(type) {
            this.bird.alive = false;
            
            // Collision effects
            this.engine.createParticleEffect('explosion', 
                this.bird.x + this.bird.width/2, 
                this.bird.y + this.bird.height/2,
                {
                    count: 25,
                    speedRange: [3, 10],
                    colors: ['#ff6b6b', '#ff9f43', '#ffffff']
                }
            );
            
            this.engine.playSFX('collision', { volume: 0.8 });
        }
        
        incrementScore() {
            const basePoints = 1;
            const multiplier = this.powerUpStates.doublePoints.active ? 2 : 1;
            const comboBonus = this.powerUpStates.combo.count > 1 ? this.powerUpStates.combo.count - 1 : 0;
            
            const totalPoints = (basePoints + comboBonus) * multiplier;
            this.gameStats.score += totalPoints;
            this.gameStats.distanceTraveled += CONFIG.pipeSpeed * CONFIG.pipeSpawnInterval;
            
            // Show score effect if bonus applied
            if (totalPoints > 1) {
                this.showScoreBonus(totalPoints - 1);
            }
        }
        
        showScoreBonus(bonus) {
            // Create floating score text effect
            this.engine.createParticleEffect('sparkle', 
                this.bird.x + this.bird.width/2, 
                this.bird.y - 30,
                {
                    count: bonus,
                    speedRange: [0.5, 2],
                    colors: ['#ffaa00']
                }
            );
        }
        
        activateShield() {
            this.powerUpStates.shield.active = true;
            this.powerUpStates.shield.timeLeft = this.powerUpStates.shield.duration;
            this.showShieldUI();
        }
        
        deactivateShield() {
            this.powerUpStates.shield.active = false;
            this.hideShieldUI();
        }
        
        activateDoublePoints() {
            this.powerUpStates.doublePoints.active = true;
            this.powerUpStates.doublePoints.timeLeft = this.powerUpStates.doublePoints.duration;
            this.showDoublePointsUI();
        }
        
        deactivateDoublePoints() {
            this.powerUpStates.doublePoints.active = false;
            this.hideDoublePointsUI();
        }
        
        addToCombo() {
            this.powerUpStates.combo.count++;
            this.powerUpStates.combo.timeLeft = this.powerUpStates.combo.duration;
            this.showComboUI();
        }
        
        resetCombo() {
            this.powerUpStates.combo.count = 0;
            this.powerUpStates.combo.timeLeft = 0;
            this.hideComboUI();
        }
        
        updateUI() {
            scoreDisplay.textContent = this.gameStats.score;
            ethDisplay.textContent = this.gameStats.ethCollected;
            document.getElementById('distance').textContent = Math.floor(this.gameStats.distanceTraveled);
        }
        
        updateShieldUI() {
            const container = document.getElementById('shield-status-container');
            if (container && this.powerUpStates.shield.active) {
                container.style.display = 'flex';
                const timeElement = document.getElementById('shield-time');
                if (timeElement) {
                    timeElement.textContent = Math.ceil(this.powerUpStates.shield.timeLeft / 1000) + 's';
                }
            }
        }
        
        updateDoublePointsUI() {
            const container = document.getElementById('double-points-container');
            if (container && this.powerUpStates.doublePoints.active) {
                container.style.display = 'block';
                const timeElement = document.getElementById('double-points-time');
                const barElement = document.getElementById('double-points-bar-fill');
                
                if (timeElement) {
                    timeElement.textContent = Math.ceil(this.powerUpStates.doublePoints.timeLeft / 1000) + 's';
                }
                if (barElement) {
                    const percentage = (this.powerUpStates.doublePoints.timeLeft / this.powerUpStates.doublePoints.duration) * 100;
                    barElement.style.width = percentage + '%';
                }
            }
        }
        
        updateComboUI() {
            const container = document.getElementById('combo-container');
            if (container && this.powerUpStates.combo.count > 0) {
                container.style.display = 'block';
                const countElement = document.getElementById('combo-count');
                const barElement = document.getElementById('combo-bar-fill');
                
                if (countElement) {
                    countElement.textContent = this.powerUpStates.combo.count + 'x';
                }
                if (barElement) {
                    const percentage = (this.powerUpStates.combo.timeLeft / this.powerUpStates.combo.duration) * 100;
                    barElement.style.width = percentage + '%';
                }
            }
        }
        
        showShieldUI() {
            const container = document.getElementById('shield-status-container');
            if (container) container.style.display = 'flex';
        }
        
        hideShieldUI() {
            const container = document.getElementById('shield-status-container');
            if (container) container.style.display = 'none';
        }
        
        showDoublePointsUI() {
            const container = document.getElementById('double-points-container');
            if (container) {
                container.style.display = 'block';
                container.classList.add('power-up-pulse');
                setTimeout(() => container.classList.remove('power-up-pulse'), 500);
            }
        }
        
        hideDoublePointsUI() {
            const container = document.getElementById('double-points-container');
            if (container) container.style.display = 'none';
        }
        
        showComboUI() {
            const container = document.getElementById('combo-container');
            if (container) {
                container.style.display = 'block';
                container.classList.add('combo-pulse');
                setTimeout(() => container.classList.remove('combo-pulse'), 300);
            }
        }
        
        hideComboUI() {
            const container = document.getElementById('combo-container');
            if (container) container.style.display = 'none';
        }
        
        hidePowerUpIndicators() {
            this.hideShieldUI();
            this.hideDoublePointsUI();
            this.hideComboUI();
        }
        
        hideGameOver() {
        gameOver.style.display = 'none';
        }
        
        renderPowerUpEffects(ctx) {
            // Render shield effect
            if (this.powerUpStates.shield.active && this.bird) {
                const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 200);
                const radius = this.bird.width * 0.8 * (1 + 0.2 * pulseIntensity);
                
                ctx.save();
                ctx.globalAlpha = 0.3 + 0.2 * pulseIntensity;
                ctx.fillStyle = `rgba(77, 121, 255, ${0.3 + 0.2 * pulseIntensity})`;
                ctx.beginPath();
                ctx.arc(this.bird.x + this.bird.width/2, this.bird.y + this.bird.height/2, radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.lineWidth = 2;
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + 0.4 * pulseIntensity})`;
                ctx.stroke();
                ctx.restore();
            }
        }
        
        renderUIOverlays(ctx) {
            // Additional UI overlays can be rendered here
        }
        
        updatePerformance() {
            // Monitor and optimize performance
            if (this.engine.performanceMonitor) {
                const metrics = this.engine.performanceMonitor.getMetrics();
                this.performanceStats.avgFPS = metrics.fps;
                
                // Auto-adjust quality based on performance
                if (metrics.fps < 45 && Date.now() - this.performanceStats.lastOptimization > 5000) {
                    this.optimizePerformance();
                    this.performanceStats.lastOptimization = Date.now();
                }
            }
        }
        
        optimizePerformance() {
            console.log('🔧 Auto-optimizing game performance...');
            
            // Reduce particle counts if performance is poor
            const particleSystem = this.engine.getSystem('particles');
            if (particleSystem) {
                // Reduce active particles by 25%
                const currentParticles = particleSystem.activeParticles;
                const reduceCount = Math.floor(currentParticles.length * 0.25);
                for (let i = 0; i < reduceCount; i++) {
                    if (currentParticles[i]) {
                        currentParticles[i].life = 0; // Mark for removal
                    }
                }
            }
            
            // Optimize pools
            this.engine.optimizePools();
        }
        
        endGame() {
            this.isActive = false;
            
            // Update final score display
            finalScoreDisplay.textContent = this.gameStats.score;
            ethCollectedDisplay.textContent = this.gameStats.ethCollected;
            distanceTraveledDisplay.textContent = Math.floor(this.gameStats.distanceTraveled);
            
            // Show game over screen
            gameOver.style.display = 'block';
            
            // Dispatch game over event
            document.dispatchEvent(new CustomEvent('gameOver', {
                detail: {
                    score: this.gameStats.score,
                    ethCollected: this.gameStats.ethCollected,
                    distance: Math.floor(this.gameStats.distanceTraveled),
                    gameTime: this.gameStats.gameTime,
                    difficulty: this.difficulty.current,
                    birdStats: this.bird.getStats()
                }
            }));
            
            console.log('🏁 Game Over! Final Stats:', {
                score: this.gameStats.score,
                eth: this.gameStats.ethCollected,
                distance: this.gameStats.distanceTraveled,
                time: (this.gameStats.gameTime / 1000).toFixed(1) + 's',
                difficulty: this.difficulty.current.toFixed(2)
            });
        }
        
        restart() {
            console.log('🔄 Restarting game...');
            this.engine.setScene('game');
        }
        
        togglePause() {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                console.log('⏸️ Game paused');
            } else {
                console.log('▶️ Game resumed');
            }
        }
        
        cleanup() {
            // Clean up resources
            for (const [type, entities] of Object.entries(this.gameEntities)) {
                const pool = this.engine.getSystem('pools')[type];
                if (pool) {
                    pool.releaseAll(entities);
                }
                entities.length = 0;
            }
            
            this.hidePowerUpIndicators();
        }
    }

    // Initialize game scene
    const gameScene = new GameScene();
    gameEngine.registerScene('game', gameScene);

    // Add lastTime variable for delta time calculation
    let lastTime = null;

    // Enhanced Event Listeners with Engine Integration
    if (startButton) {
        console.log('🎮 Setting up enhanced game controls...');
        startButton.addEventListener('click', function() {
            console.log('🚀 Start button clicked - Launching Enhanced Game!');
            gameEngine.start();
            gameEngine.setScene('game');
        });
    } else {
        console.error('❌ Start button not found!');
    }
    
    // Custom event listener for game start from sidebar button
    document.addEventListener('startGame', function() {
        console.log('🎮 Start game event received');
        gameEngine.start();
        gameEngine.setScene('game');
    });

    if (restartButton) {
        restartButton.addEventListener('click', function() {
            console.log('🔄 Restart button clicked');
            gameScene.restart();
        });
    } else {
        console.error('❌ Restart button not found!');
    }

    // Enhanced keyboard controls with debug features
    document.addEventListener('keydown', (event) => {
        // Game engine will handle input through onInput
        // This is just for starting the game when not active
        if (event.code === 'Space' && !gameEngine.isRunning) {
            event.preventDefault();
            console.log('🚀 Starting game with space key');
            gameEngine.start();
            gameEngine.setScene('game');
        }
        
        // Global debug controls
        if (event.code === 'F1') {
            event.preventDefault();
            gameEngine.debug.enabled = !gameEngine.debug.enabled;
            console.log('🐛 Debug mode:', gameEngine.debug.enabled ? 'ON' : 'OFF');
        }
        
        if (event.code === 'F2') {
            event.preventDefault();
            const stats = gameEngine.getSystem('particles')?.getStats();
            const poolStats = {};
            for (const [name, pool] of Object.entries(gameEngine.getSystem('pools') || {})) {
                poolStats[name] = pool.getStats();
            }
            console.log('📊 Performance Stats:', {
                fps: gameEngine.performanceMonitor?.getMetrics(),
                particles: stats,
                pools: poolStats
            });
        }
    });

    // Touch screen handling - delegated to engine
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (!gameEngine.isRunning) {
            console.log('🚀 Starting game with touch');
            gameEngine.start();
            gameEngine.setScene('game');
        }
        // Else handled by engine input system
    });

    // Mouse click handling - delegated to engine
    canvas.addEventListener('click', (event) => {
        if (!gameEngine.isRunning) {
            console.log('🚀 Starting game with canvas click');
            gameEngine.start();
            gameEngine.setScene('game');
        }
        // Else handled by engine input system
    });

    // Initial enhanced game field setup
    const ctx = gameEngine.ctx;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(backgroundCanvas, 0, 0);
    
    // Draw enhanced initial message with effects
    ctx.save();
    ctx.fillStyle = '#62c9ff';
    ctx.shadowColor = '#62c9ff';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    
    // Animated glow effect
    const glowIntensity = 0.7 + 0.3 * Math.sin(Date.now() / 1000);
    ctx.shadowBlur = 15 + 10 * glowIntensity;
    
    ctx.fillText('🚀 Enhanced FlappyCrypto Ready!', WIDTH / 2, HEIGHT / 2 - 40);
    
    ctx.font = '18px Arial';
    ctx.fillStyle = '#62ffbd';
    ctx.shadowColor = '#62ffbd';
    ctx.shadowBlur = 10;
    ctx.fillText('Press "Start Game" or Space to begin', WIDTH / 2, HEIGHT / 2);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 8;
    ctx.fillText('F1: Debug • F2: Performance Stats • P: Pause', WIDTH / 2, HEIGHT / 2 + 30);
    ctx.restore();
    
    // Show initialization complete message
    console.log('✨ Enhanced FlappyCrypto Game System Initialized!');
    console.log('🎯 Features Enabled:');
    console.log('   • Advanced Physics Engine');
    console.log('   • High-Performance Object Pooling');
    console.log('   • Procedural Audio System');
    console.log('   • Particle Effects System');
    console.log('   • Adaptive Difficulty Scaling');
    console.log('   • Performance Monitoring & Auto-Optimization');
    console.log('   • Debug Tools (F1: Toggle, F2: Stats)');
    console.log('🎮 Ready to play! Click Start Game or press Space.');
    
    // Performance monitoring display
    setInterval(() => {
        if (gameEngine.debug.enabled && gameEngine.performanceMonitor) {
            const metrics = gameEngine.performanceMonitor.getMetrics();
            if (metrics.status === 'poor') {
                console.warn('⚠️ Performance Warning: FPS below optimal. Auto-optimization may trigger.');
            }
        }
    }, 5000);
});
