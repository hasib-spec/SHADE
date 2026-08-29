/**
 * Formatters for UI display
 */

export const formatTemp = (celsius, withUnit = true) => {
  if (celsius === null || celsius === undefined || isNaN(Number(celsius))) return '--';
  const num = Number(celsius);
  return `${num.toFixed(1)}${withUnit ? ' °C' : ''}`;
};

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
};

export const formatCoords = (lat, lng) => {
  const numLat = Number(lat) || 0;
  const numLng = Number(lng) || 0;
  return `${numLat.toFixed(5)}° N, ${Math.abs(numLng).toFixed(5)}° W`;
};

export const formatPopulation = (num) => {
  const n = Number(num) || 0;
  return new Intl.NumberFormat('en-US').format(Math.round(n));
};
