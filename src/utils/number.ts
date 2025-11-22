export const formatNumberInput = (value: string | number): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) {
    return '';
  }
  return num.toLocaleString();
};

export const parseNumberInput = (value: string): number | '' => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const num = parseFloat(value.replace(/,/g, ''));
  return isNaN(num) ? '' : num;
};

export const formatCurrency = (value: number): string => `¥${Math.round(value).toLocaleString()}`;
export const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

