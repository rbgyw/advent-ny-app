import type { SearchBounds } from '../utils/podzhik';

// The Figma scene still contains its original skiers. Place the supplied Podzhik
// artwork in the crowd without changing or cropping the winter illustration.
export const podzhikBounds: SearchBounds = {
  left: 0.55,
  top: 0.628,
  right: 0.61,
  bottom: 0.628 + (0.06 * 626 * 159 / 104) / 838,
};
