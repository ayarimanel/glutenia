// Standard GS1 check-digit algorithm — shared by EAN-8, UPC-A, EAN-13, and
// GTIN-14. Rejects most fabricated/typo'd barcodes: a random digit string
// only has a 1-in-10 chance of passing by accident.
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
