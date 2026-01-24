/**
 * Exchange Rates API Endpoints
 *
 * Handles TCMB (Central Bank of Turkey) exchange rate operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Exchange rate entity
 */
export interface ExchangeRate {
  currency_code: string;
  currency_name: string;
  currency_name_tr: string;
  rate_date: string;
  unit: number;
  forex_buying: number;
  forex_selling: number;
  banknote_buying: number;
  banknote_selling: number;
  cross_rate_usd?: number;
  cross_rate_other?: number;
}

/**
 * Current rate response (simplified)
 */
interface CurrentRateResponse {
  success: boolean;
  rate: number;
  currency: string;
}

/**
 * Latest rate response (detailed)
 */
interface LatestRateResponse {
  success: boolean;
  data: ExchangeRate;
}

/**
 * All latest rates response
 */
interface AllLatestRatesResponse {
  success: boolean;
  rate_date: string;
  data: ExchangeRate[];
}

/**
 * Get current exchange rate (selling rate)
 * Returns the selling rate for immediate use (handles weekends/holidays)
 */
export async function getCurrentRate(currency: string): Promise<number> {
  try {
    const response = await api.get<CurrentRateResponse>(
      `/exchange-rates/current/${currency.toUpperCase()}`
    );
    return response.data.rate;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get latest detailed exchange rate
 */
export async function getLatestRate(
  currencyCode: string
): Promise<ExchangeRate> {
  try {
    const response = await api.get<LatestRateResponse>(
      `/exchange-rates/latest/${currencyCode.toUpperCase()}`
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get all latest exchange rates
 */
export async function getAllLatestRates(): Promise<{
  rates: ExchangeRate[];
  rateDate: string;
}> {
  try {
    const response = await api.get<AllLatestRatesResponse>(
      '/exchange-rates/latest'
    );
    return {
      rates: response.data.data,
      rateDate: response.data.rate_date,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get exchange rate for specific currencies
 * Returns a map of currency code to selling rate
 */
export async function getExchangeRates(
  currencies: string[]
): Promise<Record<string, number>> {
  try {
    const rates: Record<string, number> = {};

    // TRY is always 1
    if (currencies.includes('TRY')) {
      rates.TRY = 1;
    }

    // Fetch rates for other currencies
    const otherCurrencies = currencies.filter((c) => c !== 'TRY');

    await Promise.all(
      otherCurrencies.map(async (currency) => {
        try {
          const rate = await getCurrentRate(currency);
          rates[currency] = rate;
        } catch (error) {
          console.error(`Failed to get rate for ${currency}:`, error);
          // Set a default rate if API fails (should not happen in production)
          rates[currency] = 0;
        }
      })
    );

    return rates;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}
