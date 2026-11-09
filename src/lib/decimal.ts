export function countDecimalPlaces(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const [coefficient, exponentText] = Math.abs(value).toString().toLowerCase().split("e");
  const fractionDigits = coefficient.split(".")[1]?.length ?? 0;
  const exponent = exponentText ? Number.parseInt(exponentText, 10) : 0;

  return Math.max(0, fractionDigits - exponent);
}
