import type { SearchBounds, SearchCircle } from '../utils/podzhik';

// Coordinates are measured inside the 316 × 419 px illustration in Figma.
export const podzhikTarget: SearchCircle = {
  x: 153,
  y: 65,
  radius: 20,
  width: 316,
  height: 419,
};

const centerX = podzhikTarget.x / podzhikTarget.width;
const centerY = podzhikTarget.y / podzhikTarget.height;
const characterWidth = 0.06;
const characterHeight = (characterWidth * 626 * 159 / 104) / 838;

// Keep the character artwork centered on the accepted point.
export const podzhikBounds: SearchBounds = {
  left: centerX - characterWidth / 2,
  top: centerY - characterHeight / 2,
  right: centerX + characterWidth / 2,
  bottom: centerY + characterHeight / 2,
};
