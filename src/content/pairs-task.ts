import semavic from '../assets/dec_5/Семавик_русс мокап упаковки и ручки_2 1.png';
import sedjaro from '../assets/dec_5/П Седжаро 5мг+ручка 1.png';
import cortexin from '../assets/dec_5/Кортексин 10 мг_2 2.png';
import evodin from '../assets/dec_5/image 1.png';
import recognan from '../assets/dec_5/ЭГ Рекогнан упаковка+пакетики 1.png';
import retinalamin from '../assets/dec_5/П Ретиналамин 5мг_2+флакон 1.png';
import cortexinOrange from '../assets/dec_5/image 2.png';
import rinfast from '../assets/dec_5/П РинФаст Рин2_1 2.png';

// Supplied PNGs retain their natural proportions inside the original 73 × 101 card.
export const pairProducts = [
  { name: 'Семавик', image: semavic, x: 3.5, y: 30, width: 66, height: 41 },
  { name: 'Седжаро', image: sedjaro, x: -2.5, y: 23.5, width: 78, height: 54 },
  { name: 'Кортексин 10 мг', image: cortexin, x: -11.5, y: 12.5, width: 96, height: 76 },
  { name: 'Эводин', image: evodin, x: 15.5, y: 32.5, width: 42, height: 36 },
  { name: 'Рекогнан', image: recognan, x: -4.5, y: 21.5, width: 82, height: 58 },
  { name: 'Ретиналамин', image: retinalamin, x: .5, y: 14, width: 72, height: 73 },
  { name: 'Кортексин, оранжевая упаковка', image: cortexinOrange, x: 0, y: 11.5, width: 73, height: 78 },
  { name: 'РинФаст', image: rinfast, x: -20.5, y: 11, width: 114, height: 79 },
] as const;
