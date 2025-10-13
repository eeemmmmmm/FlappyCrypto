/**
 * Professional Audio Manager System
 * Handles all audio effects, music, and sound optimization
 */
export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.musicTracks = new Map();
        this.context = null;
        this.masterVolume = 1.0;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.5;
        this.muted = false;
        
        // Audio pools for performance
        this.audioPools = new Map();
        this.maxPoolSize = 5;
        
        // Web Audio API context
        this.initializeAudioContext();
        
        // Procedural audio generation
        this.oscillators = new Map();
        this.filters = new Map();
        
        // Audio settings
        this.settings = {
            enableSpatialAudio: true,
            enableReverb: true,
            enableCompression: true,
            sampleRate: 44100
        };
        
        // Load default settings from localStorage
        this.loadSettings();
        
        // Initialize procedural sounds
        this.initializeProceduralAudio();
    }
    
    /**
     * Initialize Web Audio API context
     */
    initializeAudioContext() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.setupAudioGraph();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.context = null;
        }
    }
    
    /**
     * Setup audio processing graph
     */
    setupAudioGraph() {
        if (!this.context) return;
        
        // Create master gain node
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = this.masterVolume;
        
        // Create separate gain nodes for different audio categories
        this.sfxGain = this.context.createGain();
        this.sfxGain.gain.value = this.sfxVolume;
        
        this.musicGain = this.context.createGain();
        this.musicGain.gain.value = this.musicVolume;
        
        // Create compressor for dynamic range control
        if (this.settings.enableCompression) {
            this.compressor = this.context.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
            
            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.context.destination);
        } else {
            this.masterGain.connect(this.context.destination);
        }
        
        // Connect category gains to master
        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        
        // Create reverb if enabled
        if (this.settings.enableReverb) {
            this.setupReverb();
        }
    }
    
    /**
     * Setup reverb effect using impulse response
     */
    setupReverb() {
        if (!this.context) return;
        
        this.reverbNode = this.context.createConvolver();
        this.reverbGain = this.context.createGain();
        this.reverbGain.gain.value = 0.2; // Subtle reverb
        
        // Generate impulse response for reverb
        this.generateImpulseResponse();
        
        // Connect reverb to audio graph
        this.sfxGain.connect(this.reverbGain);
        this.reverbGain.connect(this.reverbNode);
        this.reverbNode.connect(this.masterGain);
    }
    
    /**
     * Generate impulse response for reverb effect
     */
    generateImpulseResponse() {
        if (!this.context) return;
        
        const length = this.context.sampleRate * 2; // 2 second reverb
        const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2);
                channelData[i] = (Math.random() * 2 - 1) * decay * 0.5;
            }
        }
        
        this.reverbNode.buffer = impulse;
    }
    
    /**
     * Initialize procedural audio generation
     */
    initializeProceduralAudio() {
        if (!this.context) return;
        
        // Define procedural sound configurations
        this.proceduralSounds = {
            flap: {
                type: 'noise',
                frequency: 800,
                duration: 0.1,
                envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.04 }
            },
            collect: {
                type: 'sine',
                frequency: [523, 659, 784], // C, E, G chord
                duration: 0.3,
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 }
            },
            powerup: {
                type: 'sawtooth',
                frequency: [220, 330, 440, 550], // Ascending notes
                duration: 0.8,
                envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.6 }
            },
            collision: {
                type: 'noise',
                frequency: 150,
                duration: 0.5,
                envelope: { attack: 0.001, decay: 0.1, sustain: 0.2, release: 0.4 }
            },
            shield: {
                type: 'square',
                frequency: [440, 554, 659], // A, C#, E chord
                duration: 0.4,
                envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.25 }
            }
        };
    }
    
    /**
     * Play procedural sound effect
     */
    playProceduralSound(soundName, options = {}) {
        if (!this.context || this.muted) return null;
        
        const config = this.proceduralSounds[soundName];
        if (!config) return null;
        
        const { pitch = 1, volume = 1, pan = 0 } = options;
        
        // Resume audio context if suspended (mobile requirement)
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        
        // Create oscillator or noise generator
        let source;
        if (config.type === 'noise') {
            source = this.createNoiseSource();
        } else {
            source = this.context.createOscillator();
            source.type = config.type;
        }
        
        // Create gain for volume control
        const gainNode = this.context.createGain();
        
        // Create panner for spatial audio
        let pannerNode;
        if (this.settings.enableSpatialAudio && pan !== 0) {
            pannerNode = this.context.createStereoPanner();
            pannerNode.pan.value = Math.max(-1, Math.min(1, pan));
        }
        
        // Setup frequency (for oscillators)
        if (config.type !== 'noise') {
            const frequencies = Array.isArray(config.frequency) ? config.frequency : [config.frequency];
            source.frequency.setValueAtTime(frequencies[0] * pitch, this.context.currentTime);
            
            // Create chord or sequence for multiple frequencies
            if (frequencies.length > 1) {
                frequencies.slice(1).forEach((freq, index) => {
                    const delay = (index + 1) * 0.05; // Slight delay for chord effect
                    source.frequency.setValueAtTime(freq * pitch, this.context.currentTime + delay);
                });
            }
        }
        
        // Apply ADSR envelope
        const now = this.context.currentTime;
        const { attack, decay, sustain, release } = config.envelope;
        const duration = config.duration;
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + attack);
        gainNode.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
        gainNode.gain.setValueAtTime(volume * sustain, now + duration - release);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
        
        // Connect audio graph
        source.connect(gainNode);
        
        if (pannerNode) {
            gainNode.connect(pannerNode);
            pannerNode.connect(this.sfxGain);
        } else {
            gainNode.connect(this.sfxGain);
        }
        
        // Start and stop the sound
        source.start(now);
        if (source.stop) {
            source.stop(now + duration);
        }
        
        return { source, gainNode, pannerNode };
    }
    
    /**
     * Create noise source for percussion-like sounds
     */
    createNoiseSource() {
        if (!this.context) return null;
        
        const bufferSize = this.context.sampleRate * 0.1; // 100ms of noise
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        return source;
    }
    
    /**
     * Play sound effect with options
     */
    playSFX(soundName, options = {}) {
        if (this.muted) return;
        
        const sound = this.playProceduralSound(soundName, options);
        if (sound) return sound;
        
        // Fallback to traditional audio files if available
        return this.playAudioFile(soundName, 'sfx', options);
    }
    
    /**
     * Play background music
     */
    playMusic(trackName, loop = true, fadeIn = true) {
        if (this.muted) return;
        
        return this.playAudioFile(trackName, 'music', { loop, fadeIn });
    }
    
    /**
     * Play audio file (fallback for non-procedural sounds)
     */
    playAudioFile(fileName, category = 'sfx', options = {}) {
        const { volume = 1, loop = false, fadeIn = false, pan = 0 } = options;
        
        // This would load and play actual audio files
        // For now, return procedural sound as fallback
        return this.playProceduralSound(fileName, options);
    }
    
    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
        this.saveSettings();
    }
    
    /**
     * Set SFX volume
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
        this.saveSettings();
    }
    
    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
        this.saveSettings();
    }
    
    /**
     * Toggle mute
     */
    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
        }
        this.saveSettings();
        return this.muted;
    }
    
    /**
     * Save audio settings to localStorage
     */
    saveSettings() {
        const settings = {
            masterVolume: this.masterVolume,
            sfxVolume: this.sfxVolume,
            musicVolume: this.musicVolume,
            muted: this.muted,
            audioSettings: this.settings
        };
        localStorage.setItem('flappyCrypto_audioSettings', JSON.stringify(settings));
    }
    
    /**
     * Load audio settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('flappyCrypto_audioSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.masterVolume = settings.masterVolume || 1.0;
                this.sfxVolume = settings.sfxVolume || 0.7;
                this.musicVolume = settings.musicVolume || 0.5;
                this.muted = settings.muted || false;
                this.settings = { ...this.settings, ...settings.audioSettings };
            }
        } catch (error) {
            console.warn('Could not load audio settings:', error);
        }
    }
    
    /**
     * Create audio visualization data
     */
    getVisualizationData() {
        if (!this.context || !this.analyser) return null;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        return {
            frequencies: dataArray,
            bufferLength: bufferLength,
            sampleRate: this.context.sampleRate
        };
    }
    
    /**
     * Cleanup and dispose resources
     */
    dispose() {
        if (this.context && this.context.state !== 'closed') {
            this.context.close();
        }
        this.sounds.clear();
        this.musicTracks.clear();
        this.audioPools.clear();
    }
}
