export const CUSTOM_PERIOD = 'custom';

export function getMetricsQueryParams({ period, dateFrom, dateTo }) {
  if (period === CUSTOM_PERIOD && dateFrom && dateTo) {
    return {
      fecha_desde: dateFrom,
      fecha_hasta: dateTo,
    };
  }

  return { periodo: period };
}

export function hasInvalidCustomRange(period, customRange) {
  return period === CUSTOM_PERIOD
    && Boolean(customRange.from && customRange.to)
    && customRange.from > customRange.to;
}

export function isCustomRangeComplete(period, customRange) {
  return period !== CUSTOM_PERIOD
    || Boolean(customRange.from && customRange.to && customRange.from <= customRange.to);
}
