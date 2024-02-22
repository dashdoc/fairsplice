export function average(numbers: number[]) {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}
