// Every id gets its own eight-fold engraving, like the rosette of a banknote.
export function hashOf(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function engrave(value: string, rings = 11, steps = 192): string[] {
  const hash = hashOf(value);
  const depth = 0.1 + (hash % 9) / 100;
  const twist = 0.08 + ((hash >>> 4) % 10) / 50;
  const harmonic = [16, 24, 32][(hash >>> 9) % 3];
  const ripple = 0.025 + ((hash >>> 12) % 6) / 200;

  return Array.from({ length: rings }, (_, ring) => {
    const radius = 86 - (ring * 62) / rings;
    const phase = ring * twist * Math.PI;
    const points: string[] = [];
    for (let step = 0; step < steps; step++) {
      const angle = (step / steps) * 2 * Math.PI;
      const r = radius * (1 + depth * Math.cos(8 * angle + phase) + ripple * Math.sin(harmonic * angle - phase));
      points.push(`${(100 + r * Math.cos(angle)).toFixed(1)} ${(100 + r * Math.sin(angle)).toFixed(1)}`);
    }
    return `M${points.join('L')}Z`;
  });
}
