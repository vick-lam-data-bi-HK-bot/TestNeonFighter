import { CharacterDef } from './types';

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'kai', name: 'KAI',
    primaryColor: '#00ffff', secondaryColor: '#0055aa', skinColor: '#ffccaa',
    speed: 5, damageMult: 1.0, maxHealth: 100,
    description: 'Balanced street fighter. Good speed and solid damage.'
  },
  {
    id: 'nova', name: 'NOVA',
    primaryColor: '#ff00ff', secondaryColor: '#aa0055', skinColor: '#ffddcc',
    speed: 7.5, damageMult: 0.75, maxHealth: 85,
    description: 'Lightning fast assassin. Low damage but relentless.'
  },
  {
    id: 'goliath', name: 'GOLIATH',
    primaryColor: '#ffff00', secondaryColor: '#aa5500', skinColor: '#cc9977',
    speed: 3.5, damageMult: 1.5, maxHealth: 130,
    description: 'Cybernetic brute. Slow movement, devastating power.'
  },
  {
    id: 'blade', name: 'BLADE',
    primaryColor: '#ff0000', secondaryColor: '#550000', skinColor: '#ddbbaa',
    speed: 6, damageMult: 1.2, maxHealth: 90,
    description: 'Edgy rogue. High damage output, but fragile.'
  },
  {
    id: 'viper', name: 'VIPER',
    primaryColor: '#00ff00', secondaryColor: '#005500', skinColor: '#aaccff',
    speed: 8, damageMult: 0.6, maxHealth: 80,
    description: 'Toxic mutant. Extremely fast, relies on combos.'
  },
  {
    id: 'cyborg', name: 'UNIT-9',
    primaryColor: '#aaaaaa', secondaryColor: '#444444', skinColor: '#cccccc',
    speed: 4, damageMult: 1.1, maxHealth: 120,
    description: 'Armored machine. High defense and steady strikes.'
  },
  {
    id: 'ninja', name: 'SHINOBI',
    primaryColor: '#4169e1', secondaryColor: '#000080', skinColor: '#ffccaa',
    speed: 7, damageMult: 0.9, maxHealth: 95,
    description: 'Shadow warrior. Excellent mobility and trickery.'
  },
  {
    id: 'phantom', name: 'PHANTOM',
    primaryColor: '#8800ff', secondaryColor: '#330066', skinColor: '#ffffff',
    speed: 6.5, damageMult: 1.3, maxHealth: 75,
    description: 'Spectral entity. Glass cannon with huge burst damage.'
  },
  {
    id: 'rex', name: 'T-REX',
    primaryColor: '#ff8800', secondaryColor: '#883300', skinColor: '#dd9955',
    speed: 4.5, damageMult: 1.4, maxHealth: 115,
    description: 'Wasteland brawler. Grappler stats, hits like a truck.'
  },
  {
    id: 'zero', name: 'ZERO',
    primaryColor: '#ffffff', secondaryColor: '#000000', skinColor: '#ffeecc',
    speed: 5.5, damageMult: 1.1, maxHealth: 105,
    description: 'The mysterious champion. Slightly above average in all.'
  }
];
