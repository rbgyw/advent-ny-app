import flake01 from '../assets/wish/snow-01.svg';
import flake02 from '../assets/wish/snow-02.svg';
import flake03 from '../assets/wish/snow-03.svg';
import flake04 from '../assets/wish/snow-04.svg';
import flake05 from '../assets/wish/snow-05.svg';
import flake06 from '../assets/wish/snow-06.svg';
import flake07 from '../assets/wish/snow-07.svg';
import flake08 from '../assets/wish/snow-08.svg';
import flake09 from '../assets/wish/snow-09.svg';
import flake10 from '../assets/wish/snow-10.svg';
import flake11 from '../assets/wish/snow-11.svg';
import flake12 from '../assets/wish/snow-12.svg';
import flake13 from '../assets/wish/snow-13.svg';
import flake14 from '../assets/wish/snow-14.svg';
import flake15 from '../assets/wish/snow-15.svg';

// Sixteen design slots; the original sixth and ninth flakes share one SVG.
export const wishSnow = [
  { src: flake01, x: 13.67, y: 10.73 }, { src: flake02, x: 71.8, y: 16.27 },
  { src: flake03, x: 25.04, y: 25.44 }, { src: flake04, x: 81.15, y: 27.22 },
  { src: flake05, x: 10.62, y: 35.53 }, { src: flake06, x: 55.94, y: 38.17 },
  { src: flake07, x: 75.25, y: 46.39 }, { src: flake08, x: 16.58, y: 50.45 },
  { src: flake06, x: 44.24, y: 56.46 }, { src: flake09, x: 83.53, y: 58.46 },
  { src: flake10, x: 5.25, y: 65.92 }, { src: flake11, x: 71.83, y: 68.63 },
  { src: flake12, x: 27.64, y: 73.92 }, { src: flake13, x: 86.24, y: 79.33 },
  { src: flake14, x: 12.12, y: 84.78 }, { src: flake15, x: 57.72, y: 89.15 },
].map((flake, index) => {
  const duration = 11 + (index % 6) * 1.3;
  return { ...flake, duration, delay: index * .4, drift: (index % 2 ? 1 : -1) * (8 + index % 4 * 3), turn: index % 2 ? 45 : -40 };
});
