// Sizes that shrink with a <Fit> box (it sets --k on itself).
export const px = (n) => `calc(${n}px * var(--k, 1))`;
