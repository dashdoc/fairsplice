export function hash(file: string) {
  return String(Bun.hash(file));
}
