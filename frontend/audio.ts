class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private isPlayingMusic = false;
  private currentTrack = 0;
  private musicInterval: number | null = null;

  private tracks = [
    { name: "Neon Streets", tempo: 120, notes: [220, 220, 330, 220, 261.63, 220, 196, 220] },
    { name: "Cyber Brawl", tempo: 140, notes: [110, 110, 146.83, 110, 164.81, 110, 130.81, 146.83] },
    { name: "Final Round", tempo: 160, notes: [329.63, 261.63, 329.63, 392, 329.63, 261.63, 220, 261.63] }
  ];

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, val));
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol = 1) {
    if (!this.ctx || !this.masterGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playHit() {
    this.playTone(150, 'square', 0.1, 0.5);
    setTimeout(() => this.playTone(100, 'sawtooth', 0.1, 0.5), 50);
  }

  playBlock() {
    this.playTone(400, 'sine', 0.1, 0.3);
  }

  playAttack(type: string) {
    if (type === 'light') this.playTone(600, 'triangle', 0.1, 0.2);
    if (type === 'heavy') this.playTone(300, 'square', 0.15, 0.3);
    if (type === 'kick') this.playTone(200, 'sawtooth', 0.15, 0.3);
    if (type === 'special') {
      this.playTone(800, 'sine', 0.1, 0.4);
      setTimeout(() => this.playTone(1200, 'sine', 0.2, 0.4), 100);
    }
  }

  playJump() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playKO() {
    this.playTone(200, 'sawtooth', 0.5, 0.8);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.8, 0.8), 200);
    setTimeout(() => this.playTone(100, 'square', 1.5, 0.8), 500);
  }

  // Simple Music Sequencer
  toggleMusic() {
    if (this.isPlayingMusic) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  startMusic() {
    this.init();
    if (!this.ctx || this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    
    const track = this.tracks[this.currentTrack];
    let step = 0;
    const stepTime = (60 / track.tempo) / 2; // 8th notes

    const playStep = () => {
      if (!this.isPlayingMusic) return;
      const freq = track.notes[step % track.notes.length];
      this.playTone(freq, 'square', stepTime * 0.8, 0.1);
      
      // Add a simple bass drum on downbeats
      if (step % 4 === 0) {
         this.playTone(50, 'sine', 0.1, 0.3);
      }
      
      step++;
      this.musicInterval = window.setTimeout(playStep, stepTime * 1000);
    };
    
    playStep();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  nextTrack() {
    const wasPlaying = this.isPlayingMusic;
    this.stopMusic();
    this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
    if (wasPlaying) this.startMusic();
  }

  getTrackName() {
    return this.tracks[this.currentTrack].name;
  }
  
  isMusicPlaying() {
      return this.isPlayingMusic;
  }
}

export const audio = new AudioSystem();
