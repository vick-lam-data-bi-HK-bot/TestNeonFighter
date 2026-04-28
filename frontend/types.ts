export enum GameStatus {
  START_SCREEN,
  MODE_SELECT,
  CHARACTER_SELECT,
  PLAYING,
  ROUND_OVER,
  GAME_OVER
}

export enum GameMode {
  VS_CPU,
  VS_P2
}

export interface CharacterDef {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  skinColor: string;
  speed: number;
  damageMult: number;
  maxHealth: number;
  description: string;
}

export interface FighterState {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  isJumping: boolean;
  isCrouching: boolean;
  isBlocking: boolean;
  isAttacking: boolean;
  attackType: 'light' | 'heavy' | 'kick' | 'special' | null;
  attackTimer: number;
  facingRight: boolean;
  wins: number;
  hitstun: number;
  charDef: CharacterDef;
  animFrame: number;
}

export interface GameConfig {
  width: number;
  height: number;
  gravity: number;
  groundY: number;
}

export const CONFIG: GameConfig = {
  width: 800,
  height: 450,
  gravity: 0.6,
  groundY: 380,
};

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  light: boolean;
  heavy: boolean;
  kick: boolean;
  special: boolean;
  block: boolean;
}
