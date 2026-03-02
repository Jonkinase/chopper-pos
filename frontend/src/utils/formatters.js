export const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatQuantity = (amount, tipo) => {
  const num = formatNumber(amount);
  if (tipo === 'liquido') return `${num} litros`;
  if (tipo === 'alimento') return `${num} kg`;
  return `${num} unidades`;
};
