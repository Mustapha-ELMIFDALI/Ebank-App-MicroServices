// A number input loses the caret while "1234." is being typed and can turn 1234.56 into 561234.
// Amounts are therefore typed as text and parsed here.
export function parseAmount(text: string): number | null {
  const compact = text.trim().replace(/\s/g, '').replace(',', '.');
  return /^\d{1,12}(\.\d{1,2})?$/.test(compact) ? Number(compact) : null;
}
