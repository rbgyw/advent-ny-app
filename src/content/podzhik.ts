import type { SearchBounds, SearchCircle } from '../utils/podzhik';

// Matched to the character already embedded in podzic_new.png and the review screenshot.
// In the 4096 × 3102 reference, the landmark is 1200 px from the RIGHT edge.
export const podzhikTarget: SearchCircle = {
  x: 4096 - 1200,
  y: 3102 - 462,
  radius: 30,
  width: 4096,
  height: 3102,
};

// Measured silhouette bounds in search-panorama.webp (2617 × 1982).
// These follow the embedded character, rather than a separately positioned overlay.
export const podzhikBounds: SearchBounds = {
  left: 1832 / 2617,
  top: 1651 / 1982,
  right: 1874 / 2617,
  bottom: 1716 / 1982,
};
