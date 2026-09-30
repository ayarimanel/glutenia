const VALID_LENGTHS = [8, 12, 13, 14];

function isValidBarcodeChecksum(barcode) {
  if (typeof barcode !== "string" || !/^\d+$/.test(barcode)) return false;
  if (!VALID_LENGTHS.includes(barcode.length)) return false;

  const digits = barcode.split("").map(Number);
  const checkDigit = digits.pop();

  let sum = 0;
  digits.reverse().forEach((digit, i) => {
    sum += digit * (i % 2 === 0 ? 3 : 1);
  });

  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return calculatedCheckDigit === checkDigit;
}

module.exports = { isValidBarcodeChecksum };
