import data from './tarot-cards.json';
import sun from '../assets/tarot/figma-sun.png';
const images = import.meta.glob<string>('../assets/tarot/cards/*.png', { eager: true, query: '?url', import: 'default' });
export const tarotCards = data.map(card => ({ ...card, image: card.id === 19 ? sun : images[`../assets/tarot/cards/card-${String(card.id).padStart(2, '0')}.png`]! }));
