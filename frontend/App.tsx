import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameStatus, GameMode, FighterState, CONFIG, PlayerInput, CharacterDef } from './types';
import { GameEngine } from './engine';
import { audio } from './audio';
import { CHARACTERS } from './characters';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  
  const [status, setStatus] = useState<GameStatus>(GameStatus.START_SCREEN);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.VS_CPU);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  const [p1State, setP1State] = useState<Partial<FighterState>>({ health: 100, wins: 0 });
  const [p2State, setP2State] = useState<Partial<FighterState>>({ health: 100, wins: 0 });
  const [roundWinner, setRoundWinner] = useState<number | null>(null);
  const [musicTrack, setMusicTrack] = useState<string>("Stopped");
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const [p1CharIndex, setP1CharIndex] = useState<number>(0);
  const [p2CharIndex, setP2CharIndex] = useState<number>(1);
  const [selectingPlayer, setSelectingPlayer] = useState<1 | 2>(1);

  const p1InputRef = useRef<PlayerInput>({
    left: false, right: false, up: false, down: false,
    light: false, heavy: false, kick: false, special: false, block: false
  });
  const p2InputRef = useRef<PlayerInput>({
    left: false, right: false, up: false, down: false,
    light: false, heavy: false, kick: false, special: false, block: false
  });

  const handleStateChange = useCallback((p1: FighterState, p2: FighterState) => {
    setP1State({ health: p1.health, maxHealth: p1.maxHealth, wins: p1.wins, charDef: p1.charDef });
    setP2State({ health: p2.health, maxHealth: p2.maxHealth, wins: p2.wins, charDef: p2.charDef });
  }, []);

  const handleRoundEnd = useCallback((winner: 1 | 2 | 0) => {
    setRoundWinner(winner);
    setStatus(GameStatus.ROUND_OVER);
    
    setTimeout(() => {
      if (engineRef.current) {
        if (engineRef.current.p1.wins >= 2 || engineRef.current.p2.wins >= 2) {
           setStatus(GameStatus.GAME_OVER);
        } else {
           engineRef.current.resetRound();
           setStatus(GameStatus.PLAYING);
           engineRef.current.start();
        }
      }
    }, 3000);
  }, []);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new GameEngine(canvasRef.current, handleStateChange, handleRoundEnd);
      engineRef.current['draw'](); 
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === GameStatus.CHARACTER_SELECT) {
         if (selectingPlayer === 1) {
           if (e.code === 'ArrowLeft') setP1CharIndex(prev => (prev > 0 ? prev - 1 : CHARACTERS.length - 1));
           if (e.code === 'ArrowRight') setP1CharIndex(prev => (prev < CHARACTERS.length - 1 ? prev + 1 : 0));
           if (e.code === 'ArrowUp') setP1CharIndex(prev => (prev >= 5 ? prev - 5 : prev));
           if (e.code === 'ArrowDown') setP1CharIndex(prev => (prev < 5 ? prev + 5 : prev));
           if (e.code === 'KeyA' || e.code === 'Space' || e.code === 'Enter') confirmCharacterSelection();
         } else if (selectingPlayer === 2) {
           if (e.code === 'KeyJ') setP2CharIndex(prev => (prev > 0 ? prev - 1 : CHARACTERS.length - 1));
           if (e.code === 'KeyL') setP2CharIndex(prev => (prev < CHARACTERS.length - 1 ? prev + 1 : 0));
           if (e.code === 'KeyI') setP2CharIndex(prev => (prev >= 5 ? prev - 5 : prev));
           if (e.code === 'KeyK') setP2CharIndex(prev => (prev < 5 ? prev + 5 : prev));
           if (e.code === 'KeyZ' || e.code === 'Enter') confirmCharacterSelection();
         }
         return;
      }

      if (status !== GameStatus.PLAYING) return;
      
      // P1 Controls (Arrows + ASD Space Shift)
      const p1 = p1InputRef.current;
      switch (e.code) {
        case 'ArrowLeft': p1.left = true; break;
        case 'ArrowRight': p1.right = true; break;
        case 'ArrowUp': p1.up = true; break;
        case 'ArrowDown': p1.down = true; break;
        case 'KeyA': p1.light = true; break;
        case 'KeyS': p1.heavy = true; break;
        case 'KeyD': p1.kick = true; break;
        case 'Space': p1.special = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': p1.block = true; break;
      }

      // P2 Controls (IJKL + ZXCVB)
      const p2 = p2InputRef.current;
      switch (e.code) {
        case 'KeyJ': p2.left = true; break;
        case 'KeyL': p2.right = true; break;
        case 'KeyI': p2.up = true; break;
        case 'KeyK': p2.down = true; break;
        case 'KeyZ': p2.light = true; break;
        case 'KeyX': p2.heavy = true; break;
        case 'KeyC': p2.kick = true; break;
        case 'KeyV': p2.special = true; break;
        case 'KeyB': p2.block = true; break;
      }

      if (engineRef.current) engineRef.current.updateInput(p1InputRef.current, p2InputRef.current);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const p1 = p1InputRef.current;
      switch (e.code) {
        case 'ArrowLeft': p1.left = false; break;
        case 'ArrowRight': p1.right = false; break;
        case 'ArrowUp': p1.up = false; break;
        case 'ArrowDown': p1.down = false; break;
        case 'KeyA': p1.light = false; break;
        case 'KeyS': p1.heavy = false; break;
        case 'KeyD': p1.kick = false; break;
        case 'Space': p1.special = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': p1.block = false; break;
      }

      const p2 = p2InputRef.current;
      switch (e.code) {
        case 'KeyJ': p2.left = false; break;
        case 'KeyL': p2.right = false; break;
        case 'KeyI': p2.up = false; break;
        case 'KeyK': p2.down = false; break;
        case 'KeyZ': p2.light = false; break;
        case 'KeyX': p2.heavy = false; break;
        case 'KeyC': p2.kick = false; break;
        case 'KeyV': p2.special = false; break;
        case 'KeyB': p2.block = false; break;
      }

      if (engineRef.current) engineRef.current.updateInput(p1InputRef.current, p2InputRef.current);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (status !== GameStatus.PLAYING) return;
      // Only trigger if clicking on the canvas to avoid triggering attacks when clicking UI buttons
      if (e.target !== canvasRef.current) return;

      const p1 = p1InputRef.current;
      if (e.button === 0) p1.light = true; // Left click
      if (e.button === 2) p1.heavy = true; // Right click
      if (e.button === 1) p1.special = true; // Middle click (scroll press)
      
      if (engineRef.current) engineRef.current.updateInput(p1InputRef.current, p2InputRef.current);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const p1 = p1InputRef.current;
      if (e.button === 0) p1.light = false;
      if (e.button === 2) p1.heavy = false;
      if (e.button === 1) p1.special = false;
      
      if (engineRef.current) engineRef.current.updateInput(p1InputRef.current, p2InputRef.current);
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Prevent right-click menu from appearing over the game canvas
      if (status === GameStatus.PLAYING && e.target === canvasRef.current) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      if (engineRef.current) engineRef.current.stop();
    };
  }, [status, selectingPlayer, handleStateChange, handleRoundEnd]);

  const initAudio = () => {
    audio.init();
    audio.resume();
    if (!audio.isMusicPlaying()) {
        audio.startMusic();
        setIsMusicPlaying(true);
        setMusicTrack(audio.getTrackName());
    }
  };

  const goToModeSelect = () => {
    initAudio();
    setStatus(GameStatus.MODE_SELECT);
  };

  const selectMode = (mode: GameMode) => {
    setGameMode(mode);
    if (engineRef.current) engineRef.current.setMode(mode);
    setSelectingPlayer(1);
    setStatus(GameStatus.CHARACTER_SELECT);
  };

  const confirmCharacterSelection = () => {
    if (gameMode === GameMode.VS_P2 && selectingPlayer === 1) {
      setSelectingPlayer(2);
    } else {
      const p1Char = CHARACTERS[p1CharIndex];
      const p2Char = gameMode === GameMode.VS_CPU 
        ? CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
        : CHARACTERS[p2CharIndex];
      
      if (engineRef.current) {
        engineRef.current.setCharacters(p1Char, p2Char);
        engineRef.current.p1.wins = 0;
        engineRef.current.p2.wins = 0;
        engineRef.current.resetRound();
        setIsPaused(false);
        setStatus(GameStatus.PLAYING);
        engineRef.current.start();
      }
    }
  };

  const toggleGamePause = () => {
    setIsPaused(prev => {
      const next = !prev;
      if (engineRef.current) engineRef.current.isPaused = next;
      return next;
    });
  };

  const returnToMenu = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.isPaused = false;
    }
    setIsPaused(false);
    setStatus(GameStatus.START_SCREEN);
  };

  const toggleMusic = () => {
      audio.toggleMusic();
      setIsMusicPlaying(audio.isMusicPlaying());
      setMusicTrack(audio.isMusicPlaying() ? audio.getTrackName() : "Stopped");
  };

  const nextTrack = () => {
      audio.nextTrack();
      setMusicTrack(audio.getTrackName());
      setIsMusicPlaying(true);
  };

  const getHealthPercent = (health?: number, maxHealth?: number) => {
    if (health === undefined || maxHealth === undefined) return 100;
    return Math.max(0, (health / maxHealth) * 100);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-arcade-dark font-retro text-white p-4">
      
      <div className="relative p-8 bg-gray-900 rounded-3xl border-4 border-gray-700 shadow-[0_0_50px_rgba(0,255,255,0.2)]">
        
        <div className="absolute top-0 left-0 w-full h-16 bg-black rounded-t-2xl flex flex-col items-center justify-center border-b-4 border-neon-cyan overflow-hidden">
           <h1 className="text-neon-pink text-2xl tracking-widest animate-pulse-fast drop-shadow-[0_0_10px_rgba(255,0,255,0.8)]">NEON FIGHTERS '98</h1>
           <span className="text-[10px] text-neon-yellow mt-1 tracking-widest">24-BIT SYSTEM • 12MHz • 16/32</span>
        </div>

        <div className="relative mt-12 border-8 border-black rounded-xl overflow-hidden crt screen-curve bg-black shadow-[0_0_20px_rgba(0,0,0,1)]">
          
          {status === GameStatus.PLAYING && (
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-40 pointer-events-none">
              <div className="w-2/5">
                <div className="flex justify-between mb-1 text-xs" style={{ color: p1State.charDef?.primaryColor || '#00ffff' }}>
                  <span>{p1State.charDef?.name || 'PLAYER 1'}</span>
                  <span>WINS: {p1State.wins}</span>
                </div>
                <div className="h-6 bg-red-900 border-2 border-white p-0.5">
                  <div 
                    className="h-full transition-all duration-200 ease-out"
                    style={{ 
                      width: `${getHealthPercent(p1State.health, p1State.maxHealth)}%`,
                      backgroundColor: p1State.charDef?.primaryColor || '#00ffff'
                    }}
                  />
                </div>
              </div>

              <div className="text-neon-yellow text-2xl font-bold mt-2 drop-shadow-[0_0_5px_rgba(255,255,0,1)]">
                VS
              </div>

              <div className="w-2/5">
                <div className="flex justify-between mb-1 text-xs" style={{ color: p2State.charDef?.primaryColor || '#ff00ff' }}>
                  <span>WINS: {p2State.wins}</span>
                  <span>{p2State.charDef?.name || (gameMode === GameMode.VS_CPU ? 'CPU' : 'PLAYER 2')}</span>
                </div>
                <div className="h-6 bg-red-900 border-2 border-white p-0.5 flex justify-end">
                  <div 
                    className="h-full transition-all duration-200 ease-out"
                    style={{ 
                      width: `${getHealthPercent(p2State.health, p2State.maxHealth)}%`,
                      backgroundColor: p2State.charDef?.primaryColor || '#ff00ff'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {status === GameStatus.PLAYING && (
            <div className="absolute bottom-4 right-4 z-50 flex space-x-4">
              <button 
                onClick={toggleGamePause}
                className="px-4 py-2 bg-black/80 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-colors font-retro text-[10px]"
              >
                {isPaused ? 'RESUME' : 'PAUSE'}
              </button>
              <button 
                onClick={returnToMenu}
                className="px-4 py-2 bg-black/80 border-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black transition-colors font-retro text-[10px]"
              >
                RETURN
              </button>
            </div>
          )}

          {status === GameStatus.PLAYING && isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40 pointer-events-none">
              <h2 className="text-4xl text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">PAUSED</h2>
            </div>
          )}

          {status === GameStatus.START_SCREEN && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-40">
              <h2 className="text-4xl text-neon-cyan mb-8 animate-pulse drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">INSERT COIN</h2>
              <button 
                onClick={goToModeSelect}
                className="px-6 py-3 bg-transparent border-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black transition-colors text-sm"
              >
                PRESS START
              </button>
            </div>
          )}

          {status === GameStatus.MODE_SELECT && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-40">
              <h2 className="text-3xl text-neon-yellow mb-12 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]">SELECT MODE</h2>
              <div className="flex space-x-8">
                <button 
                  onClick={() => selectMode(GameMode.VS_CPU)}
                  className="px-8 py-6 bg-black border-4 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-colors text-lg flex flex-col items-center"
                >
                  <span>1 PLAYER</span>
                  <span className="text-xs mt-2 opacity-80">VS CPU</span>
                </button>
                <button 
                  onClick={() => selectMode(GameMode.VS_P2)}
                  className="px-8 py-6 bg-black border-4 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black transition-colors text-lg flex flex-col items-center"
                >
                  <span>2 PLAYERS</span>
                  <span className="text-xs mt-2 opacity-80">LOCAL VS</span>
                </button>
              </div>
            </div>
          )}

          {status === GameStatus.CHARACTER_SELECT && (
            <div className="absolute inset-0 flex flex-col items-center justify-start bg-gray-900 z-40 p-6">
              <h2 className="text-xl text-neon-yellow mb-4 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]">
                {selectingPlayer === 1 ? 'PLAYER 1 SELECT' : 'PLAYER 2 SELECT'}
              </h2>
              
              <div className="grid grid-cols-5 gap-4 mb-6">
                {CHARACTERS.map((char, idx) => {
                  const isP1Selected = p1CharIndex === idx;
                  const isP2Selected = gameMode === GameMode.VS_P2 && p2CharIndex === idx;
                  
                  let borderClass = 'border-gray-600 opacity-50';
                  if (isP1Selected && isP2Selected) borderClass = 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.8)]';
                  else if (isP1Selected) borderClass = 'border-neon-cyan scale-110 shadow-[0_0_15px_rgba(0,255,255,0.8)] opacity-100';
                  else if (isP2Selected) borderClass = 'border-neon-pink scale-110 shadow-[0_0_15px_rgba(255,0,255,0.8)] opacity-100';

                  return (
                    <div 
                      key={char.id}
                      onClick={() => {
                        if (selectingPlayer === 1) setP1CharIndex(idx);
                        else setP2CharIndex(idx);
                      }}
                      className={`relative w-20 h-24 border-4 flex flex-col items-center justify-center cursor-pointer transition-all ${borderClass}`}
                      style={{ backgroundColor: char.secondaryColor }}
                    >
                      {isP1Selected && <span className="absolute -top-3 -left-3 bg-neon-cyan text-black text-[8px] px-1">P1</span>}
                      {isP2Selected && <span className="absolute -top-3 -right-3 bg-neon-pink text-black text-[8px] px-1">P2</span>}
                      
                      <div className="w-8 h-8 mb-1" style={{ backgroundColor: char.skinColor }}>
                         <div className="w-full h-3" style={{ backgroundColor: char.primaryColor }}></div>
                      </div>
                      <div className="w-12 h-10" style={{ backgroundColor: char.primaryColor }}></div>
                    </div>
                  );
                })}
              </div>

              <div className="w-full max-w-lg bg-black border-2 border-gray-700 p-4 text-center h-28 flex flex-col justify-center">
                <h3 className="text-lg mb-1" style={{ color: CHARACTERS[selectingPlayer === 1 ? p1CharIndex : p2CharIndex].primaryColor }}>
                  {CHARACTERS[selectingPlayer === 1 ? p1CharIndex : p2CharIndex].name}
                </h3>
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  {CHARACTERS[selectingPlayer === 1 ? p1CharIndex : p2CharIndex].description}
                </p>
                <div className="mt-2 flex justify-center space-x-4 text-[10px] text-gray-400">
                  <span>SPD: {CHARACTERS[selectingPlayer === 1 ? p1CharIndex : p2CharIndex].speed}</span>
                  <span>DMG: {CHARACTERS[selectingPlayer === 1 ? p1CharIndex : p2CharIndex].damageMult}x</span>
                  <span>HP: {CHARACTERS[selectingPlayer === 1 ? p1CharIndex : p2CharIndex].maxHealth}</span>
                </div>
              </div>

              <button 
                onClick={confirmCharacterSelection}
                className="mt-4 px-6 py-2 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black transition-colors text-sm animate-pulse"
              >
                {selectingPlayer === 1 && gameMode === GameMode.VS_P2 ? 'NEXT (P2)' : 'FIGHT!'}
              </button>
            </div>
          )}

          {status === GameStatus.ROUND_OVER && (
            <div className="absolute inset-0 flex items-center justify-center z-40">
              <h2 className="text-6xl text-neon-yellow animate-flicker drop-shadow-[0_0_20px_rgba(255,255,0,1)]">
                {roundWinner === 1 ? 'P1 WINS' : roundWinner === 2 ? (gameMode === GameMode.VS_CPU ? 'CPU WINS' : 'P2 WINS') : 'DRAW'}
              </h2>
            </div>
          )}

          {status === GameStatus.GAME_OVER && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-40">
              <h2 className="text-5xl text-neon-pink mb-8 drop-shadow-[0_0_15px_rgba(255,0,255,1)]">GAME OVER</h2>
              <p className="text-xl text-white mb-8">
                {p1State.wins && p1State.wins >= 2 ? 'PLAYER 1 IS THE CHAMPION!' : (p2State.wins && p2State.wins >= 2 ? (gameMode === GameMode.VS_CPU ? 'CPU WINS...' : 'PLAYER 2 IS THE CHAMPION!') : 'DRAW')}
              </p>
              <button 
                onClick={goToModeSelect}
                className="px-6 py-3 bg-transparent border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-colors text-sm"
              >
                RESTART
              </button>
            </div>
          )}

          <canvas 
            ref={canvasRef} 
            width={CONFIG.width} 
            height={CONFIG.height}
            className="block"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="mt-6 flex justify-between items-center bg-gray-800 p-4 rounded-lg border-2 border-gray-600">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] text-gray-400">24-BIT AUDIO SYS</span>
          </div>
          
          <div className="flex items-center space-x-4 text-xs">
            <span className="text-neon-cyan">BGM: {musicTrack}</span>
            <button onClick={toggleMusic} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded">
              {isMusicPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button onClick={nextTrack} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded">
              NEXT
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
