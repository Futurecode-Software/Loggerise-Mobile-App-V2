import api from '../api';

export interface ExchangeRate {
  id: number;
  currency: string;
  forex_buying: string;
  forex_selling: string;
  banknote_buying: string;
  banknote_selling: string;
  date: string;
}

/**
 * Get latest exchange rate for a currency
 */
export const getLatestExchangeRate = async (currencyCode: string): Promise<string> => {
  if (currencyCode === 'TRY') {
    return '1';
  }

  const response = await api.get(`/exchange-rates/latest/${currencyCode}`);
  if (response.data.success && response.data.data) {
    return response.data.data.forex_selling;
  }
  throw new Error('Kur bilgisi alınamadı');
};

/**
 * Alias for getLatestExchangeRate (backward compatibility)
 */
export const getCurrentRate = getLatestExchangeRate;

/**
 * Alias for getLatestExchangeRate (backward compatibility)
 */
export const getLatestRate = getLatestExchangeRate;
