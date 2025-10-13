/**
 * Advanced Object Pool System for Performance Optimization
 * Reduces garbage collection overhead by reusing objects
 * @class ObjectPool
 */
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        
        // Pre-populate pool with initial objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
        
        // Performance monitoring
        this.stats = {
            created: initialSize,
            reused: 0,
            maxActive: 0,
            totalRequests: 0
        };
    }
    
    /**
     * Get object from pool or create new one
     * @returns {Object} Pooled object
     */
    acquire() {
        this.stats.totalRequests++;
        
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
            this.stats.reused++;
        } else {
            obj = this.createFn();
            this.stats.created++;
        }
        
        this.active.push(obj);
        this.stats.maxActive = Math.max(this.stats.maxActive, this.active.length);
        
        return obj;
    }
    
    /**
     * Return object to pool for reuse
     * @param {Object} obj - Object to return
     */
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
    
    /**
     * Release multiple objects at once
     * @param {Array} objects - Array of objects to release
     */
    releaseAll(objects) {
        for (const obj of objects) {
            this.release(obj);
        }
    }
    
    /**
     * Clear all objects and reset pool
     */
    clear() {
        this.pool.length = 0;
        this.active.length = 0;
        this.stats = {
            created: 0,
            reused: 0,
            maxActive: 0,
            totalRequests: 0
        };
    }
    
    /**
     * Get performance statistics
     * @returns {Object} Performance stats
     */
    getStats() {
        return {
            ...this.stats,
            poolSize: this.pool.length,
            activeCount: this.active.length,
            efficiency: this.stats.totalRequests > 0 ? 
                (this.stats.reused / this.stats.totalRequests * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    /**
     * Optimize pool size based on usage patterns
     */
    optimize() {
        const targetSize = Math.ceil(this.stats.maxActive * 1.2);
        const currentTotal = this.pool.length + this.active.length;
        
        if (currentTotal > targetSize * 2) {
            // Remove excess objects
            const toRemove = currentTotal - targetSize;
            this.pool.splice(0, Math.min(toRemove, this.pool.length));
        } else if (this.pool.length < targetSize * 0.3) {
            // Add more objects to pool
            const toAdd = Math.ceil(targetSize * 0.5);
            for (let i = 0; i < toAdd; i++) {
                this.pool.push(this.createFn());
            }
            this.stats.created += toAdd;
        }
    }
}

/**
 * Particle Pool for visual effects
 */
export class ParticlePool extends ObjectPool {
    constructor(initialSize = 50) {
        super(
            () => ({
                x: 0, y: 0, vx: 0, vy: 0,
                size: 1, life: 1, maxLife: 1,
                color: 'white', alpha: 1,
                active: false
            }),
            (particle) => {
                particle.active = false;
                particle.life = 1;
                particle.alpha = 1;
            },
            initialSize
        );
    }
    
    /**
     * Spawn particle with parameters
     */
    spawn(x, y, vx, vy, size, life, color) {
        const particle = this.acquire();
        particle.x = x;
        particle.y = y;
        particle.vx = vx;
        particle.vy = vy;
        particle.size = size;
        particle.life = life;
        particle.maxLife = life;
        particle.color = color;
        particle.alpha = 1;
        particle.active = true;
        return particle;
    }
}

/**
 * Performance Monitor for tracking frame performance
 */
export class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.startTime = performance.now();
        this.lastTime = this.startTime;
        this.fps = 60;
        this.frameTime = 0;
        this.avgFrameTime = 0;
        
        this.samples = [];
        this.maxSamples = 60; // 1 second of samples at 60fps
        
        // Performance thresholds
        this.thresholds = {
            good: 16.67,    // 60fps
            ok: 33.33,      // 30fps
            poor: 50        // 20fps
        };
    }
    
    /**
     * Update performance metrics
     */
    update() {
        const now = performance.now();
        this.frameTime = now - this.lastTime;
        this.lastTime = now;
        this.frameCount++;
        
        // Calculate FPS
        const elapsed = now - this.startTime;
        this.fps = Math.round(this.frameCount / (elapsed / 1000));
        
        // Track frame time samples
        this.samples.push(this.frameTime);
        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }
        
        // Calculate average frame time
        this.avgFrameTime = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    }
    
    /**
     * Get performance status
     */
    getStatus() {
        if (this.avgFrameTime <= this.thresholds.good) return 'good';
        if (this.avgFrameTime <= this.thresholds.ok) return 'ok';
        return 'poor';
    }
    
    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            fps: this.fps,
            frameTime: this.frameTime.toFixed(2),
            avgFrameTime: this.avgFrameTime.toFixed(2),
            status: this.getStatus(),
            totalFrames: this.frameCount
        };
    }
    
    /**
     * Check if performance optimization is needed
     */
    shouldOptimize() {
        return this.avgFrameTime > this.thresholds.ok;
    }
}
