import type { SearchBounds, SearchCircle } from '../utils/podzhik';

// User-provided coordinates in the 4096 × 3102 reference panorama:
// 1200 px from the left and 462 px from the bottom, with a 30 px hit radius.
export const podzhikTarget: SearchCircle = {
  x: 1200,
  y: 3102 - 462,
  radius: 30,
  width: 4096,
  height: 3102,
};

const centerX = podzhikTarget.x / podzhikTarget.width;
const centerY = podzhikTarget.y / podzhikTarget.height;
const characterWidth = 60 / podzhikTarget.width;
const characterHeight = (60 * 159 / 104) / podzhikTarget.height;

// Keep the character overlay centered on the user-provided hit point.
export const podzhikBounds: SearchBounds = {
  left: centerX - characterWidth / 2,
  top: centerY - characterHeight / 2,
  right: centerX + characterWidth / 2,
  bottom: centerY + characterHeight / 2,
};
