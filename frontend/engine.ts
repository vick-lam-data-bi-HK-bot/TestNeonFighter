import { FighterState, CONFIG, PlayerInput, CharacterDef, GameMode } from './types';
import { audio } from './audio';
import { CHARACTERS } from './characters';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number = 0;
  private lastTime: number = 0;
  
  public p1!: FighterState;
  public p2!: FighterState;
  private particles: Particle[] = [];
  
  private onStateChange: (p1: FighterState, p2: FighterState) => void;
  private onRoundEnd: (winner: 1 | 2 | 0) => void;
  
  private isRunning = false;
  public isPaused = false;
  private roundTimer = 99;
  private timerInterval: number | null = null;
  private cameraX = 0;
  private gameMode: GameMode = GameMode.VS_CPU;

  // Store current input state to apply every frame
  private p1Input: PlayerInput = { left: false, right: false, up: false, down: false, light: false, heavy: false, kick: false, special: false, block: false };
  private p2Input: PlayerInput = { left: false, right: false, up: false, down: false, light: false, heavy: false, kick: false, special: false, block: false };

  constructor(
    canvas: HTMLCanvasElement, 
    onStateChange: (p1: FighterState, p2: FighterState) => void,
    onRoundEnd: (winner: 1 | 2 | 0) => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Could not get 2d context");
    this.ctx = context;
    this.onStateChange = onStateChange;
    this.onRoundEnd = onRoundEnd;
    
    this.setCharacters(CHARACTERS[0], CHARACTERS[1]);
  }

  public setMode(mode: GameMode) {
    this.gameMode = mode;
  }

  public setCharacters(p1Char: CharacterDef, p2Char: CharacterDef) {
    this.p1 = this.createFighter(150, p1Char, true);
    this.p2 = this.createFighter(CONFIG.width - 200, p2Char, false);
    this.onStateChange({...this.p1}, {...this.p2});
  }

  private createFighter(x: number, charDef: CharacterDef, facingRight: boolean): FighterState {
    return {
      x, y: CONFIG.groundY - 100, width: 50, height: 100,
      vx: 0, vy: 0,
      health: charDef.maxHealth, maxHealth: charDef.maxHealth,
      isJumping: false, isCrouching: false, isBlocking: false, isAttacking: false,
      attackType: null, attackTimer: 0,
      facingRight, wins: 0, hitstun: 0,
      charDef, animFrame: 0
    };
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
    
    this.timerInterval = window.setInterval(() => {
      if (this.isPaused) return;
      if (this.roundTimer > 0) {
        this.roundTimer--;
      } else {
        this.endRound(this.p1.health > this.p2.health ? 1 : (this.p2.health > this.p1.health ? 2 : 0));
      }
    }, 1000);
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  public resetRound() {
    this.p1.health = this.p1.charDef.maxHealth;
    this.p1.x = 150;
    this.p1.y = CONFIG.groundY - 100;
    this.p1.hitstun = 0;
    this.p1.isAttacking = false;
    this.p1.vx = 0;
    this.p1.vy = 0;
    
    this.p2.health = this.p2.charDef.maxHealth;
    this.p2.x = CONFIG.width - 200;
    this.p2.y = CONFIG.groundY - 100;
    this.p2.hitstun = 0;
    this.p2.isAttacking = false;
    this.p2.vx = 0;
    this.p2.vy = 0;
    
    this.roundTimer = 99;
    this.particles = [];
    this.cameraX = 0;
    this.onStateChange({...this.p1}, {...this.p2});
  }

  public updateInput(p1Input: PlayerInput, p2Input: PlayerInput) {
    this.p1Input = { ...p1Input };
    this.p2Input = { ...p2Input };
  }

  private applyInputToFighter(fighter: FighterState, input: PlayerInput) {
    if (fighter.hitstun > 0) return;

    const speed = fighter.charDef.speed;
    
    if (!fighter.isAttacking && !fighter.isBlocking) {
      if (!fighter.isJumping) {
        if (input.left) fighter.vx = -speed;
        else if (input.right) fighter.vx = speed;
        else fighter.vx = 0;

        if (input.up) {
          fighter.vy = -13;
          fighter.isJumping = true;
          audio.playJump();
        }
      }
      
      fighter.isCrouching = input.down && !fighter.isJumping;
      if (fighter.isCrouching) fighter.vx = 0;
    }

    fighter.isBlocking = input.block && !fighter.isJumping && !fighter.isAttacking;
    if (fighter.isBlocking) fighter.vx = 0;

    if (!fighter.isAttacking && !fighter.isBlocking && !fighter.isJumping) {
      if (input.light) this.startAttack(fighter, 'light');
      else if (input.heavy) this.startAttack(fighter, 'heavy');
      else if (input.kick) this.startAttack(fighter, 'kick');
      else if (input.special) this.startAttack(fighter, 'special');
    }
  }

  private startAttack(fighter: FighterState, type: 'light' | 'heavy' | 'kick' | 'special') {
    fighter.isAttacking = true;
    fighter.attackType = type;
    fighter.vx = 0;
    
    let duration = 15;
    if (type === 'heavy') duration = 25;
    if (type === 'special') duration = 35;
    
    fighter.attackTimer = duration;
    audio.playAttack(type);
  }

  private updateAI() {
    if (this.p2.hitstun > 0 || this.p2.isAttacking) return;

    const dist = this.p1.x - this.p2.x;
    const absDist = Math.abs(dist);
    const speed = this.p2.charDef.speed * 0.8;

    this.p2.facingRight = dist > 0;

    if (absDist > 100) {
      this.p2.vx = this.p2.facingRight ? speed : -speed;
      this.p2.isBlocking = false;
    } else {
      this.p2.vx = 0;
      
      // CPU only attacks when timer is 90 or below
      if (this.roundTimer <= 90) {
        if (this.p1.isAttacking && Math.random() < 0.7) {
          this.p2.isBlocking = true;
        } else if (Math.random() < 0.06) {
          this.p2.isBlocking = false;
          const attacks: ('light'|'heavy'|'kick'|'special')[] = ['light', 'heavy', 'kick', 'special'];
          this.startAttack(this.p2, attacks[Math.floor(Math.random() * attacks.length)]);
        } else {
           this.p2.isBlocking = false;
        }
      } else {
        this.p2.isBlocking = false;
      }
    }
  }

  private updatePhysics(fighter: FighterState) {
    fighter.animFrame++;
    fighter.vy += CONFIG.gravity;
    fighter.x += fighter.vx;
    fighter.y += fighter.vy;

    if (fighter.y + fighter.height >= CONFIG.groundY) {
      fighter.y = CONFIG.groundY - fighter.height;
      fighter.vy = 0;
      fighter.isJumping = false;
    }

    const stageWidth = 1200;
    if (fighter.x < 0) fighter.x = 0;
    if (fighter.x + fighter.width > stageWidth) fighter.x = stageWidth - fighter.width;

    if (fighter.hitstun > 0) {
      fighter.hitstun--;
      fighter.vx = fighter.facingRight ? -2 : 2; 
    } else if (!fighter.isJumping && !fighter.isAttacking && !fighter.isBlocking && fighter.vx !== 0) {
       fighter.vx *= 0.8;
       if (Math.abs(fighter.vx) < 0.5) fighter.vx = 0;
    }

    if (fighter.isAttacking) {
      fighter.attackTimer--;
      if (fighter.attackTimer <= 0) {
        fighter.isAttacking = false;
        fighter.attackType = null;
      }
    }
  }

  private checkCollisions() {
    if (!this.p1.isAttacking && !this.p2.isAttacking) {
      this.p1.facingRight = this.p1.x < this.p2.x;
      this.p2.facingRight = this.p2.x < this.p1.x;
    }

    if (Math.abs(this.p1.x - this.p2.x) < 40 && !this.p1.isJumping && !this.p2.isJumping) {
       if (this.p1.x < this.p2.x) {
           this.p1.x = this.p2.x - 40;
       } else {
           this.p1.x = this.p2.x + 40;
       }
    }

    this.checkHit(this.p1, this.p2);
    this.checkHit(this.p2, this.p1);
  }

  private checkHit(attacker: FighterState, defender: FighterState) {
    if (!attacker.isAttacking || attacker.attackTimer < 5 || attacker.attackTimer > 15) return;

    let ax = attacker.x + (attacker.facingRight ? attacker.width : -40);
    let ay = attacker.y + 20;
    let aw = 40;
    let ah = 20;

    if (attacker.attackType === 'kick') { ay += 40; }
    if (attacker.attackType === 'heavy') { aw = 60; }
    if (attacker.attackType === 'special') { aw = 80; ah = 40; }

    let dx = defender.x;
    let dy = defender.y + (defender.isCrouching ? 40 : 0);
    let dw = defender.width;
    let dh = defender.height - (defender.isCrouching ? 40 : 0);

    if (ax < dx + dw && ax + aw > dx && ay < dy + dh && ay + ah > dy) {
      if (defender.hitstun === 0) {
        let baseDamage = 5;
        if (attacker.attackType === 'heavy') baseDamage = 10;
        if (attacker.attackType === 'special') baseDamage = 15;
        
        let damage = baseDamage * attacker.charDef.damageMult;

        if (defender.isBlocking) {
          damage = Math.floor(damage / 4);
          audio.playBlock();
          this.spawnParticles(ax + aw/2, ay + ah/2, '#ffffff', 5, 3);
        } else {
          audio.playHit();
          defender.hitstun = 20;
          this.spawnParticles(ax + aw/2, ay + ah/2, attacker.charDef.primaryColor, 15, 5);
          this.spawnParticles(ax + aw/2, ay + ah/2, '#ff0000', 10, 4);
        }

        defender.health = Math.max(0, defender.health - damage);
        attacker.attackTimer = 0;

        this.onStateChange({...this.p1}, {...this.p2});

        if (defender.health <= 0) {
          this.endRound(attacker === this.p1 ? 1 : 2);
        }
      }
    }
  }

  private spawnParticles(x: number, y: number, color: string, count: number, size: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 20 + Math.random() * 15,
        maxLife: 35,
        color,
        size: Math.random() * size + 2
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private updateCamera() {
    const midX = (this.p1.x + this.p2.x) / 2;
    let targetCamX = midX - CONFIG.width / 2;
    targetCamX = Math.max(0, Math.min(targetCamX, 1200 - CONFIG.width));
    this.cameraX += (targetCamX - this.cameraX) * 0.1;
  }

  private endRound(winner: 1 | 2 | 0) {
    this.isRunning = false;
    audio.playKO();
    if (winner === 1) this.p1.wins++;
    if (winner === 2) this.p2.wins++;
    this.onStateChange({...this.p1}, {...this.p2});
    this.onRoundEnd(winner);
  }

  private draw() {
    this.updateCamera();
    const cx = this.cameraX;

    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, CONFIG.groundY);
    skyGrad.addColorStop(0, '#0a051a');
    skyGrad.addColorStop(0.5, '#2a0b3e');
    skyGrad.addColorStop(1, '#6a154b');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, CONFIG.width, CONFIG.groundY);

    this.ctx.fillStyle = '#1a0b2d';
    for(let i=0; i<15; i++) {
      let bx = (i * 100) - (cx * 0.15);
      this.ctx.fillRect(bx, 120 + Math.sin(i)*30, 60, 280);
    }

    this.ctx.fillStyle = '#10051a';
    for(let i=0; i<10; i++) {
      let bx = (i * 180) - (cx * 0.4);
      this.ctx.fillRect(bx, 180, 100, 220);
      this.ctx.fillStyle = '#00ffff22';
      this.ctx.fillRect(bx + 10, 200, 15, 15);
      this.ctx.fillRect(bx + 70, 240, 15, 15);
      this.ctx.fillStyle = '#10051a';
    }

    const floorGrad = this.ctx.createLinearGradient(0, CONFIG.groundY, 0, CONFIG.height);
    floorGrad.addColorStop(0, '#331144');
    floorGrad.addColorStop(1, '#000000');
    this.ctx.fillStyle = floorGrad;
    this.ctx.fillRect(0, CONFIG.groundY, CONFIG.width, CONFIG.height - CONFIG.groundY);
    
    this.ctx.strokeStyle = '#ff00ff44';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    for(let i=0; i<5; i++) {
      let y = CONFIG.groundY + Math.pow(i, 1.6) * 8;
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CONFIG.width, y);
    }
    for(let i=-15; i<35; i++) {
        let startX = (i * 60) - cx;
        let endX = startX + ((startX - CONFIG.width/2) * 1.8);
        this.ctx.moveTo(startX, CONFIG.groundY);
        this.ctx.lineTo(endX, CONFIG.height);
    }
    this.ctx.stroke();

    this.ctx.save();
    this.ctx.translate(-cx, 0);

    this.drawShadow(this.p1);
    this.drawShadow(this.p2);

    this.drawFighter(this.p1);
    this.drawFighter(this.p2);

    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life / p.maxLife;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    this.ctx.globalAlpha = 1.0;

    this.ctx.restore();

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px "Press Start 2P"';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#000';
    this.ctx.fillText(this.roundTimer.toString(), CONFIG.width / 2 + 2, 52);
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(this.roundTimer.toString(), CONFIG.width / 2, 50);
  }

  private drawShadow(f: FighterState) {
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.beginPath();
    this.ctx.ellipse(f.x + f.width/2, CONFIG.groundY, f.width/1.5, 8, 0, 0, Math.PI*2);
    this.ctx.fill();
  }

  private drawFighter(f: FighterState) {
    this.ctx.save();
    
    const dir = f.facingRight ? 1 : -1;
    const cx = f.x + f.width / 2;
    let yOffset = f.isCrouching ? 30 : 0;
    if (f.isJumping) yOffset -= 10;

    const isHit = f.hitstun > 0 && Math.floor(Date.now() / 50) % 2 === 0;
    
    const primary = isHit ? '#ffffff' : f.charDef.primaryColor;
    const secondary = isHit ? '#dddddd' : f.charDef.secondaryColor;
    const skin = isHit ? '#ffffff' : f.charDef.skinColor;

    this.ctx.fillStyle = secondary;
    if (f.isBlocking) {
      this.ctx.fillRect(cx - 10*dir, f.y + yOffset + 20, 15, 30);
    } else {
      this.ctx.fillRect(cx - 5*dir, f.y + yOffset + 25, 15, 35);
    }

    this.ctx.fillStyle = secondary;
    let legOffset = Math.sin(f.animFrame * 0.2) * (f.vx !== 0 && !f.isJumping ? 15 : 0);
    this.ctx.fillRect(cx - 10*dir + legOffset, f.y + yOffset + 60, 18, 40 - yOffset);

    const torsoGrad = this.ctx.createLinearGradient(cx - 20, f.y + yOffset + 20, cx + 20, f.y + yOffset + 60);
    torsoGrad.addColorStop(0, primary);
    torsoGrad.addColorStop(1, secondary);
    this.ctx.fillStyle = torsoGrad;
    this.ctx.fillRect(cx - 20, f.y + yOffset + 20, 40, 45);
    
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(cx - 22, f.y + yOffset + 55, 44, 10);

    this.ctx.fillStyle = skin;
    this.ctx.fillRect(cx - 15, f.y + yOffset - 10, 30, 30);
    this.ctx.fillStyle = primary;
    this.ctx.fillRect(cx - 18, f.y + yOffset - 15, 36, 12);
    if (dir === 1) this.ctx.fillRect(cx - 25, f.y + yOffset - 10, 10, 15);
    else this.ctx.fillRect(cx + 15, f.y + yOffset - 10, 10, 15);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(cx + 5*dir, f.y + yOffset - 2, 10, 6);
    this.ctx.fillStyle = primary;
    this.ctx.fillRect(cx + 8*dir, f.y + yOffset - 1, 4, 4);

    this.ctx.fillStyle = primary;
    this.ctx.fillRect(cx + 5*dir - legOffset, f.y + yOffset + 60, 20, 40 - yOffset);

    this.ctx.fillStyle = skin;
    
    if (f.isAttacking) {
      let reach = 0;
      let armY = f.y + yOffset + 25;
      let armW = 15;
      let armH = 15;
      
      if (f.attackType === 'light') { reach = 30; }
      if (f.attackType === 'heavy') { reach = 50; armH = 20; }
      if (f.attackType === 'kick') { 
        reach = 40; armY += 30; 
        this.ctx.fillStyle = primary;
      }
      if (f.attackType === 'special') { 
        reach = 70; armH = 30; armY -= 10;
        this.ctx.fillStyle = primary;
        this.ctx.shadowColor = primary;
        this.ctx.shadowBlur = 15;
      }

      if (dir === 1) {
        this.ctx.fillRect(cx + 10, armY, reach, armH);
      } else {
        this.ctx.fillRect(cx - 10 - reach, armY, reach, armH);
      }
      this.ctx.shadowBlur = 0;
      
    } else if (f.isBlocking) {
      this.ctx.fillRect(cx + 10*dir, f.y + yOffset + 15, 15, 35);
      this.ctx.strokeStyle = primary;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(cx + 20*dir, f.y + yOffset + 30, 40, dir===1 ? -Math.PI/4 : Math.PI*0.75, dir===1 ? Math.PI/4 : Math.PI*1.25);
      this.ctx.stroke();
    } else {
      this.ctx.fillRect(cx + 5*dir, f.y + yOffset + 25, 15, 35);
    }

    this.ctx.restore();
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;
    
    if (!this.isPaused) {
      this.applyInputToFighter(this.p1, this.p1Input);
      
      if (this.gameMode === GameMode.VS_P2) {
        this.applyInputToFighter(this.p2, this.p2Input);
      } else {
        this.updateAI();
      }
      
      this.updatePhysics(this.p1);
      this.updatePhysics(this.p2);
      this.checkCollisions();
      this.updateParticles();
    }
    
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}
