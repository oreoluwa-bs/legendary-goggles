/**
 * Map number x from range [a, b] to [c, d]
 *
 * The map function is a mathematical function that takes a number within a given range (x) and maps it to a new range. It takes five arguments:
 * x: The number you want to map
 * a and b: The original range that x is in
 * c and d: The new range that you want to map x to
 *
 *
 */
export const map = (x: number, a: number, b: number, c: number, d: number) =>
  ((x - a) * (d - c)) / (b - a) + c;

// Linear interpolation
export const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;

export const calcWinsize = () => {
  return { width: window.innerWidth, height: window.innerHeight };
};

// Gets the mouse position
export const getMousePos = (e: MouseEvent) => {
  return {
    x: e.clientX,
    y: e.clientY,
  };
};

export const clamp = (num: number, min: number, max: number) =>
  num <= min ? min : num >= max ? max : num;
