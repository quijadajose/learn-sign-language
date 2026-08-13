/**
 * Remuestreo lineal temporal de secuencias de landmarks.
 * Escala N frames capturados a S frames uniformes (sin duplicar el último frame).
 */
export function resampleSequence(
  sequence: number[][],
  targetLength: number,
): number[][] {
  const sourceLength = sequence.length;
  if (sourceLength === 0) return [];
  if (sourceLength === 1) {
    return Array.from({ length: targetLength }, () => [...sequence[0]]);
  }
  if (sourceLength === targetLength) return sequence;

  const resampled: number[][] = [];
  for (let i = 0; i < targetLength; i++) {
    const rawIndex = (i * (sourceLength - 1)) / (targetLength - 1);
    const lowIndex = Math.floor(rawIndex);
    const highIndex = Math.ceil(rawIndex);
    const weight = rawIndex - lowIndex;

    if (lowIndex === highIndex) {
      resampled.push([...sequence[lowIndex]]);
    } else {
      const interpolatedFrame = sequence[lowIndex].map((val, idx) => {
        return val + weight * (sequence[highIndex][idx] - val);
      });
      resampled.push(interpolatedFrame);
    }
  }
  return resampled;
}
