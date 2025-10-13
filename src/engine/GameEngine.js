import { ObjectPool, PerformanceMonitor } from '../utils/ObjectPool.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { AudioManager } from '../audio/AudioManager.js';

/**
 * Advanced Game Engine with Modern Architecture
 * Provides high-performance game loop, entity management, and system coordination
 */
export class GameEngine {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Engine configuration
        this.config = {
            targetFPS: 60,
            maxDeltaTime: 50, // Prevent spiral of death
            enableVSync: true,
            enablePerformanceMonitoring: true,
            enableObjectPooling: true,
            enableParticleSystem: true,
            enableAudioSystem: true,
            ...options
        };
        
        // Core systems
        this.systems = {};
        this.entities = [];
        this.entityPools = new Map();
        
        // Timing
        this.isRunning = false;
        this.lastTime = 0;
        this.accumulator = 0;
        this.frameId = null;
        
        // Performance monitoring
        if (this.config.enablePerformanceMonitoring) {
            this.performanceMonitor = new PerformanceMonitor();
        }
        
        // Initialize systems
        this.initializeSystems();
        
        // Input system
        this.input = {
            keys: new Set(),
            mouse: { x: 0, y: 0, buttons: new Set() },
            touch: { active: false, x: 0, y: 0 }
        };
        this.setupInputHandlers();
        
        // Scene management
        this.currentScene = null;
        this.scenes = new Map();
        
        // Asset management
        this.assets = {
            textures: new Map(),
            sounds: new Map(),
            loaded: false
        };
        
        // Debug information
        this.debug = {
            enabled: false,
            showFPS: true,
            showEntityCount: true,
            showPoolStats: true,
            showParticleCount: true
        };
    }
    
    /**
     * Initialize all engine systems
     */
    initializeSystems() {
        // Object pooling system
        if (this.config.enableObjectPooling) {
            this.systems.pools = {
                pipes: new ObjectPool(
                    () => this.createPipeObject(),
                    (pipe) => this.resetPipeObject(pipe),
                    5
                ),
                coins: new ObjectPool(
                    () => this.createCoinObject(),
                    (coin) => this.resetCoinObject(coin),
                    10
                ),
                obstacles: new ObjectPool(
                    () => this.createObstacleObject(),
                    (obstacle) => this.resetObstacleObject(obstacle),
                    8
                ),
                powerups: new ObjectPool(
                    () => this.createPowerupObject(),
                    (powerup) => this.resetPowerupObject(powerup),
                    6
                )
            };
        }
        
        // Particle system
        if (this.config.enableParticleSystem) {
            this.systems.particles = new ParticleSystem(this.ctx, this.width, this.height);
        }
        
        // Audio system
        if (this.config.enableAudioSystem) {
            this.systems.audio = new AudioManager();
        }
        
        // Collision system with spatial partitioning
        this.systems.collision = new SpatialCollisionSystem(this.width, this.height, 64);
        
        // Tween system for smooth animations
        this.systems.tween = new TweenSystem();
        
        // State management system
        this.systems.state = new StateManager();
    }
    
    /**
     * Setup input event handlers
     */
    setupInputHandlers() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.input.keys.add(e.code);
            this.onInput('keydown', { code: e.code, event: e });
        });
        
        document.addEventListener('keyup', (e) => {
            this.input.keys.delete(e.code);
            this.onInput('keyup', { code: e.code, event: e });
        });
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.input.mouse.buttons.add(e.button);
            this.updateMousePosition(e);
            this.onInput('mousedown', { button: e.button, ...this.input.mouse });
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.input.mouse.buttons.delete(e.button);
            this.updateMousePosition(e);
            this.onInput('mouseup', { button: e.button, ...this.input.mouse });
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
            this.onInput('mousemove', this.input.mouse);
        });
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.input.touch = {
                active: true,
                x: touch.clientX - this.canvas.offsetLeft,
                y: touch.clientY - this.canvas.offsetTop
            };
            this.onInput('touchstart', this.input.touch);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.input.touch.active = false;
            this.onInput('touchend', this.input.touch);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.input.touch.x = touch.clientX - this.canvas.offsetLeft;
                this.input.touch.y = touch.clientY - this.canvas.offsetTop;
                this.onInput('touchmove', this.input.touch);
            }
        });
    }
    
    /**
     * Update mouse position relative to canvas
     */
    updateMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.input.mouse.x = event.clientX - rect.left;
        this.input.mouse.y = event.clientY - rect.top;
    }
    
    /**
     * Input event handler (override in scenes)
     */
    onInput(type, data) {
        if (this.currentScene && this.currentScene.onInput) {
            this.currentScene.onInput(type, data);
        }
    }
    
    /**
     * Add entity to the game world
     */
    addEntity(entity) {
        entity.id = entity.id || this.generateEntityId();
        this.entities.push(entity);
        
        if (entity.onAdded) {
            entity.onAdded(this);
        }
        
        return entity;
    }
    
    /**
     * Remove entity from the game world
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            if (entity.onRemoved) {
                entity.onRemoved(this);
            }
            this.entities.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * Find entities by predicate function
     */
    findEntities(predicate) {
        return this.entities.filter(predicate);
    }
    
    /**
     * Generate unique entity ID
     */
    generateEntityId() {
        return 'entity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Main game loop with fixed timestep
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = Math.min(currentTime - this.lastTime, this.config.maxDeltaTime);
        this.lastTime = currentTime;
        
        // Update performance monitor
        if (this.performanceMonitor) {
            this.performanceMonitor.update();
        }
        
        // Fixed timestep update
        this.accumulator += deltaTime;
        const fixedDeltaTime = 1000 / this.config.targetFPS;
        
        while (this.accumulator >= fixedDeltaTime) {
            this.update(fixedDeltaTime);
            this.accumulator -= fixedDeltaTime;
        }
        
        // Interpolated rendering
        const interpolation = this.accumulator / fixedDeltaTime;
        this.render(interpolation);
        
        // Schedule next frame
        this.frameId = requestAnimationFrame((time) => this.gameLoop(time));
        
        // Auto-optimize pools periodically
        if (this.config.enableObjectPooling && currentTime % 5000 < deltaTime) {
            this.optimizePools();
        }
    }
    
    /**
     * Update game logic
     */
    update(deltaTime) {
        // Update current scene
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(deltaTime);
        }
        
        // Update all systems
        for (const [name, system] of Object.entries(this.systems)) {
            if (system.update) {
                system.update(deltaTime);
            }
        }
        
        // Update entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity.update) {
                entity.update(deltaTime);
            }
            
            // Remove dead entities
            if (entity.shouldRemove) {
                this.removeEntity(entity);
            }
        }
    }
    
    /**
     * Render game graphics
     */
    render(interpolation) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Render current scene
        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(this.ctx, interpolation);
        }
        
        // Render entities
        for (const entity of this.entities) {
            if (entity.render && entity.visible !== false) {
                this.ctx.save();
                entity.render(this.ctx, interpolation);
                this.ctx.restore();
            }
        }
        
        // Render particles
        if (this.systems.particles) {
            this.systems.particles.render();
        }
        
        // Render debug information
        if (this.debug.enabled) {
            this.renderDebugInfo();
        }
    }
    
    /**
     * Render debug information
     */
    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px monospace';
        
        let y = 20;
        const lineHeight = 18;
        
        if (this.debug.showFPS && this.performanceMonitor) {
            const metrics = this.performanceMonitor.getMetrics();
            this.ctx.fillText(`FPS: ${metrics.fps} (${metrics.avgFrameTime}ms)`, 10, y);
            y += lineHeight;
        }
        
        if (this.debug.showEntityCount) {
            this.ctx.fillText(`Entities: ${this.entities.length}`, 10, y);
            y += lineHeight;
        }
        
        if (this.debug.showParticleCount && this.systems.particles) {
            const particleStats = this.systems.particles.getStats();
            this.ctx.fillText(`Particles: ${particleStats.activeParticles}`, 10, y);
            y += lineHeight;
        }
        
        if (this.debug.showPoolStats && this.systems.pools) {
            for (const [name, pool] of Object.entries(this.systems.pools)) {
                const stats = pool.getStats();
                this.ctx.fillText(`${name}: ${stats.activeCount}/${stats.poolSize} (${stats.efficiency})`, 10, y);
                y += lineHeight;
            }
        }
        
        this.ctx.restore();
    }
    
    /**
     * Start the game engine
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        
        // Resume audio context if needed
        if (this.systems.audio && this.systems.audio.context) {
            this.systems.audio.context.resume();
        }
        
        this.frameId = requestAnimationFrame((time) => this.gameLoop(time));
        
        console.log('Game engine started');
    }
    
    /**
     * Stop the game engine
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        
        console.log('Game engine stopped');
    }
    
    /**
     * Pause the game engine
     */
    pause() {
        this.stop();
    }
    
    /**
     * Resume the game engine
     */
    resume() {
        this.start();
    }
    
    /**
     * Switch to a different scene
     */
    setScene(sceneName, ...args) {
        const scene = this.scenes.get(sceneName);
        if (!scene) {
            console.warn(`Scene '${sceneName}' not found`);
            return false;
        }
        
        // Exit current scene
        if (this.currentScene && this.currentScene.onExit) {
            this.currentScene.onExit();
        }
        
        // Clear entities if scene requests it
        if (scene.clearEntitiesOnEnter !== false) {
            this.entities.length = 0;
        }
        
        // Enter new scene
        this.currentScene = scene;
        if (scene.onEnter) {
            scene.onEnter(this, ...args);
        }
        
        return true;
    }
    
    /**
     * Register a scene
     */
    registerScene(name, scene) {
        this.scenes.set(name, scene);
        scene.engine = this;
    }
    
    /**
     * Optimize object pools
     */
    optimizePools() {
        if (!this.systems.pools) return;
        
        for (const pool of Object.values(this.systems.pools)) {
            pool.optimize();
        }
    }
    
    /**
     * Get system by name
     */
    getSystem(name) {
        return this.systems[name];
    }
    
    /**
     * Play sound effect
     */
    playSFX(soundName, options) {
        if (this.systems.audio) {
            return this.systems.audio.playSFX(soundName, options);
        }
    }
    
    /**
     * Create particle effect
     */
    createParticleEffect(type, x, y, config) {
        if (this.systems.particles) {
            return this.systems.particles.createEffect(type, x, y, config);
        }
    }
    
    /**
     * Dispose of engine resources
     */
    dispose() {
        this.stop();
        
        // Dispose systems
        for (const system of Object.values(this.systems)) {
            if (system.dispose) {
                system.dispose();
            }
        }
        
        // Clear entities
        this.entities.length = 0;
        this.scenes.clear();
        
        console.log('Game engine disposed');
    }
    
    // Factory methods for pooled objects (to be implemented by game-specific code)
    createPipeObject() { return { type: 'pipe', active: false }; }
    resetPipeObject(pipe) { pipe.active = false; }
    
    createCoinObject() { return { type: 'coin', active: false, collected: false }; }
    resetCoinObject(coin) { coin.active = false; coin.collected = false; }
    
    createObstacleObject() { return { type: 'obstacle', active: false }; }
    resetObstacleObject(obstacle) { obstacle.active = false; }
    
    createPowerupObject() { return { type: 'powerup', active: false, collected: false }; }
    resetPowerupObject(powerup) { powerup.active = false; powerup.collected = false; }
}

/**
 * Spatial Collision System for efficient collision detection
 */
class SpatialCollisionSystem {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = [];
        this.clear();
    }
    
    clear() {
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null).map(() => []));
    }
    
    insert(entity) {
        const cells = this.getCells(entity);
        entity.gridCells = cells;
        
        for (const cell of cells) {
            if (this.isValidCell(cell.row, cell.col)) {
                this.grid[cell.row][cell.col].push(entity);
            }
        }
    }
    
    remove(entity) {
        if (entity.gridCells) {
            for (const cell of entity.gridCells) {
                if (this.isValidCell(cell.row, cell.col)) {
                    const entities = this.grid[cell.row][cell.col];
                    const index = entities.indexOf(entity);
                    if (index !== -1) {
                        entities.splice(index, 1);
                    }
                }
            }
        }
    }
    
    getCells(entity) {
        const minCol = Math.floor(entity.x / this.cellSize);
        const maxCol = Math.floor((entity.x + entity.width) / this.cellSize);
        const minRow = Math.floor(entity.y / this.cellSize);
        const maxRow = Math.floor((entity.y + entity.height) / this.cellSize);
        
        const cells = [];
        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                cells.push({ row, col });
            }
        }
        return cells;
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    getNearby(entity) {
        const nearby = new Set();
        const cells = this.getCells(entity);
        
        for (const cell of cells) {
            if (this.isValidCell(cell.row, cell.col)) {
                for (const other of this.grid[cell.row][cell.col]) {
                    if (other !== entity) {
                        nearby.add(other);
                    }
                }
            }
        }
        
        return Array.from(nearby);
    }
    
    update() {
        // Clear and rebuild grid each frame
        this.clear();
    }
}

/**
 * Tween System for smooth animations
 */
class TweenSystem {
    constructor() {
        this.tweens = [];
    }
    
    to(target, properties, duration, easing = 'easeOutQuad') {
        const tween = new Tween(target, properties, duration, easing);
        this.tweens.push(tween);
        return tween;
    }
    
    update(deltaTime) {
        for (let i = this.tweens.length - 1; i >= 0; i--) {
            const tween = this.tweens[i];
            tween.update(deltaTime);
            
            if (tween.isComplete()) {
                this.tweens.splice(i, 1);
            }
        }
    }
}

/**
 * Individual Tween class
 */
class Tween {
    constructor(target, properties, duration, easing) {
        this.target = target;
        this.duration = duration;
        this.elapsed = 0;
        this.easing = this.getEasingFunction(easing);
        this.complete = false;
        
        this.startValues = {};
        this.endValues = properties;
        
        // Store initial values
        for (const prop in properties) {
            this.startValues[prop] = target[prop];
        }
        
        this.onCompleteCallback = null;
    }
    
    update(deltaTime) {
        if (this.complete) return;
        
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1);
        const easedProgress = this.easing(progress);
        
        // Update target properties
        for (const prop in this.endValues) {
            const start = this.startValues[prop];
            const end = this.endValues[prop];
            this.target[prop] = start + (end - start) * easedProgress;
        }
        
        if (progress >= 1) {
            this.complete = true;
            if (this.onCompleteCallback) {
                this.onCompleteCallback();
            }
        }
    }
    
    onComplete(callback) {
        this.onCompleteCallback = callback;
        return this;
    }
    
    isComplete() {
        return this.complete;
    }
    
    getEasingFunction(name) {
        const easings = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
        };
        return easings[name] || easings.easeOutQuad;
    }
}

/**
 * State Manager for game state persistence
 */
class StateManager {
    constructor() {
        this.state = {};
        this.listeners = new Map();
    }
    
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        // Notify listeners
        const keyListeners = this.listeners.get(key);
        if (keyListeners) {
            for (const listener of keyListeners) {
                listener(value, oldValue);
            }
        }
    }
    
    get(key, defaultValue = null) {
        return this.state[key] !== undefined ? this.state[key] : defaultValue;
    }
    
    on(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
    }
    
    off(key, callback) {
        const keyListeners = this.listeners.get(key);
        if (keyListeners) {
            const index = keyListeners.indexOf(callback);
            if (index !== -1) {
                keyListeners.splice(index, 1);
            }
        }
    }
    
    save() {
        try {
            localStorage.setItem('flappyCrypto_gameState', JSON.stringify(this.state));
        } catch (error) {
            console.warn('Could not save game state:', error);
        }
    }
    
    load() {
        try {
            const saved = localStorage.getItem('flappyCrypto_gameState');
            if (saved) {
                this.state = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Could not load game state:', error);
        }
    }
}
