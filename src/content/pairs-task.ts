import semavic from '../assets/pairs/semavic.webp';
import sedjaro from '../assets/pairs/sedjaro.webp';
import cortexin from '../assets/pairs/cortexin.webp';
import evodin from '../assets/pairs/evodin.webp';
import recognan from '../assets/pairs/recognan.webp';
import retinalamin from '../assets/pairs/retinalamin.webp';
import memantinol from '../assets/pairs/memantinol.webp';
import rinfast from '../assets/pairs/rinfast.webp';

// Coordinates within the original 73 × 101 card, including transparent image margins.
export const pairProducts = [
  { name: 'Семавик', image: semavic, x: -5, y: 25, width: 82, height: 51 },
  { name: 'Седжаро', image: sedjaro, x: 0, y: 25, width: 72, height: 51 },
  { name: 'Кортексин', image: cortexin, x: -9, y: 17, width: 90, height: 72 },
  { name: 'Эводин', image: evodin, x: 15, y: 33, width: 42, height: 36 },
  { name: 'Рекогнан', image: recognan, x: -5, y: 23, width: 82, height: 58 },
  { name: 'Ретиналамин', image: retinalamin, x: 0, y: 19, width: 79, height: 63 },
  { name: 'Мемантинол', image: memantinol, x: 17, y: 27, width: 39, height: 42 },
  { name: 'РинФаст', image: rinfast, x: -22, y: 8, width: 114, height: 79 },
] as const;
