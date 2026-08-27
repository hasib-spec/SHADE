/**
 * Formatters for UI display
 */

export const formatTemp = (celsius, withUnit = true) => {
  if (celsius === null || celsius === undefined) return '--';
  return `${celsius.toFixed(1)}${withUnit ? ' °C' : ''}`;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatCoords = (lat, lng) => {
  return `${lat.toFixed(5)}° N, ${Math.abs(lng).toFixed(5)}° W`;
};

export const formatPopulation = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};
