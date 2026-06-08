/**
 * Format a number as Indian Rupees.
 * formatCurrency(50000) → "₹50,000"
 * formatCurrency(50000.5) → "₹50,000.50"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';

  const num = Number(amount);
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return `₹${formatted}`;
}

/**
 * Format a percentage value.
 * formatPercent(85.5) → "85.5%"
 */
export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${Number(value).toFixed(1)}%`;
}

/**
 * Format a date string to locale format.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
