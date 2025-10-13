import { ParticlePool } from '../utils/ObjectPool.js';

/**
 * Advanced Particle System for Visual Effects
 * High-performance particle rendering with multiple effect types
 */
export class ParticleSystem {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        
        // Initialize particle pools for different effect types
        this.pools = {
            explosion: new ParticlePool(30),
            trail: new ParticlePool(50),
            sparkle: new ParticlePool(40),
            collect: new ParticlePool(20),
            powerup: new ParticlePool(25)
        };
        
        this.activeParticles = [];
        this.gravity = 0.1;
        this.airResistance = 0.99;
        
        // Pre-computed values for performance
        this.PI2 = Math.PI * 2;
        this.tempCanvas = document.createElement('canvas');
        this.tempCanvas.width = width;
        this.tempCanvas.height = height;
        this.tempCtx = this.tempCanvas.getContext('2d');
        
        // Effect presets
        this.presets = {
            coinCollect: {
                count: 8,
                speedRange: [1, 3],
                sizeRange: [2, 6],
                lifeRange: [0.5, 1.0],
                colors: ['#62ffbd', '#4ad8a0', '#ffffff'],
                gravity: -0.05,
                spread: Math.PI
            },
            shieldActivate: {
                count: 12,
                speedRange: [2, 5],
                sizeRange: [3, 8],
                lifeRange: [0.8, 1.5],
                colors: ['#4d79ff', '#62c9ff', '#ffffff'],
                gravity: 0,
                spread: Math.PI * 2
            },
            explosion: {
                count: 15,
                speedRange: [3, 8],
                sizeRange: [2, 10],
                lifeRange: [0.6, 1.2],
                colors: ['#ff6b6b', '#ff9f43', '#ffffff'],
                gravity: 0.05,
                spread: Math.PI * 2
            },
            trail: {
                count: 1,
                speedRange: [0, 0],
                sizeRange: [1, 3],
                lifeRange: [0.3, 0.6],
                colors: ['#62c9ff'],
                gravity: 0,
                spread: 0
            }
        };
    }
    
    /**
     * Create particle effect at specified location
     */
    createEffect(type, x, y, preset = null) {
        const config = preset || this.presets[type] || this.presets.explosion;
        const pool = this.pools[type] || this.pools.explosion;
        
        for (let i = 0; i < config.count; i++) {
            const angle = Math.random() * config.spread - config.spread / 2;
            const speed = config.speedRange[0] + Math.random() * 
                (config.speedRange[1] - config.speedRange[0]);
            const size = config.sizeRange[0] + Math.random() * 
                (config.sizeRange[1] - config.sizeRange[0]);
            const life = config.lifeRange[0] + Math.random() * 
                (config.lifeRange[1] - config.lifeRange[0]);
            const color = config.colors[Math.floor(Math.random() * config.colors.length)];
            
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const particle = pool.spawn(x, y, vx, vy, size, life * 1000, color);
            particle.gravity = config.gravity;
            particle.type = type;
            
            this.activeParticles.push(particle);
        }
    }
    
    /**
     * Create trail effect (for moving objects)
     */
    createTrail(x, y, vx, vy, color = '#62c9ff', intensity = 1) {
        if (Math.random() < 0.3 * intensity) {
            const particle = this.pools.trail.spawn(
                x + (Math.random() - 0.5) * 10,
                y + (Math.random() - 0.5) * 10,
                vx * 0.1 + (Math.random() - 0.5) * 2,
                vy * 0.1 + (Math.random() - 0.5) * 2,
                1 + Math.random() * 2,
                300 + Math.random() * 300,
                color
            );
            particle.gravity = 0;
            particle.type = 'trail';
            this.activeParticles.push(particle);
        }
    }
    
    /**
     * Create sparkle effect for background ambiance
     */
    createSparkle() {
        if (Math.random() < 0.02) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const particle = this.pools.sparkle.spawn(
                x, y, 0, 0,
                0.5 + Math.random() * 1.5,
                1000 + Math.random() * 2000,
                '#ffffff'
            );
            particle.gravity = 0;
            particle.type = 'sparkle';
            particle.twinkle = Math.random() * Math.PI * 2;
            this.activeParticles.push(particle);
        }
    }
    
    /**
     * Update all particles
     */
    update(deltaTime) {
        const dt = deltaTime / 16.67; // Normalize to 60fps
        
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            
            // Update physics
            particle.vy += particle.gravity * dt;
            particle.vx *= this.airResistance;
            particle.vy *= this.airResistance;
            
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            
            // Update life and alpha
            particle.life -= deltaTime;
            particle.alpha = Math.max(0, particle.life / particle.maxLife);
            
            // Special effects per type
            if (particle.type === 'sparkle') {
                particle.twinkle += 0.1 * dt;
                particle.alpha *= 0.5 + 0.5 * Math.sin(particle.twinkle);
            }
            
            // Remove dead particles
            if (particle.life <= 0 || particle.alpha <= 0 || 
                particle.x < -50 || particle.x > this.width + 50 ||
                particle.y < -50 || particle.y > this.height + 50) {
                
                const pool = this.pools[particle.type];
                if (pool) pool.release(particle);
                this.activeParticles.splice(i, 1);
            }
        }
        
        // Automatically create ambient sparkles
        this.createSparkle();
    }
    
    /**
     * Render all particles with optimization
     */
    render() {
        if (this.activeParticles.length === 0) return;
        
        this.ctx.save();
        
        // Group particles by type for batch rendering
        const particlesByType = {};
        for (const particle of this.activeParticles) {
            if (!particlesByType[particle.type]) {
                particlesByType[particle.type] = [];
            }
            particlesByType[particle.type].push(particle);
        }
        
        // Render each type with optimized settings
        for (const [type, particles] of Object.entries(particlesByType)) {
            this.renderParticleType(type, particles);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Optimized rendering for specific particle types
     */
    renderParticleType(type, particles) {
        this.ctx.save();
        
        switch (type) {
            case 'trail':
                this.ctx.globalCompositeOperation = 'screen';
                break;
            case 'sparkle':
                this.ctx.globalCompositeOperation = 'lighter';
                break;
            default:
                this.ctx.globalCompositeOperation = 'source-over';
        }
        
        for (const particle of particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            
            // Apply glow effect for certain types
            if (type === 'collect' || type === 'powerup') {
                this.ctx.shadowColor = particle.color;
                this.ctx.shadowBlur = particle.size * 2;
            }
            
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            
            if (type === 'sparkle') {
                // Draw sparkle as cross shape
                const size = particle.size;
                this.ctx.fillRect(particle.x - size/2, particle.y - 0.5, size, 1);
                this.ctx.fillRect(particle.x - 0.5, particle.y - size/2, 1, size);
            } else {
                // Draw as circle
                this.ctx.arc(particle.x, particle.y, particle.size, 0, this.PI2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Create custom effect with full control
     */
    createCustomEffect(config) {
        const {
            x, y, count = 10, type = 'explosion',
            speedMin = 1, speedMax = 5,
            sizeMin = 2, sizeMax = 6,
            lifeMin = 500, lifeMax = 1500,
            colors = ['#ffffff'],
            gravity = 0.1,
            angle = 0, spread = Math.PI * 2
        } = config;
        
        const pool = this.pools[type] || this.pools.explosion;
        
        for (let i = 0; i < count; i++) {
            const particleAngle = angle + (Math.random() - 0.5) * spread;
            const speed = speedMin + Math.random() * (speedMax - speedMin);
            const size = sizeMin + Math.random() * (sizeMax - sizeMin);
            const life = lifeMin + Math.random() * (lifeMax - lifeMin);
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const particle = pool.spawn(
                x, y,
                Math.cos(particleAngle) * speed,
                Math.sin(particleAngle) * speed,
                size, life, color
            );
            particle.gravity = gravity;
            particle.type = type;
            this.activeParticles.push(particle);
        }
    }
    
    /**
     * Clear all particles
     */
    clear() {
        for (const particle of this.activeParticles) {
            const pool = this.pools[particle.type];
            if (pool) pool.release(particle);
        }
        this.activeParticles.length = 0;
    }
    
    /**
     * Get performance statistics
     */
    getStats() {
        const stats = { activeParticles: this.activeParticles.length };
        for (const [type, pool] of Object.entries(this.pools)) {
            stats[type] = pool.getStats();
        }
        return stats;
    }
}
