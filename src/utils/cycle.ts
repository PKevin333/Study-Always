export function sanitizeCycleIndex(currentIndex: number, cycleBlocks: any[]): number {
  if (!cycleBlocks || cycleBlocks.length === 0) return 0;
  if (currentIndex >= cycleBlocks.length) return 0;
  if (currentIndex < 0) return 0;
  return currentIndex;
}
