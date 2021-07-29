import { Document } from 'mongoose';
export enum typeOfCurrency {
  Sale = 'sales',
  Purchase = 'purchase',
}
export interface Currency extends Document {
  name: string;
  // readonly rate: number;
  readonly currencySymbol: string;
  symbol: string;
  currencyRate: CurrencyRate[];
  latestRate: number;
}
export interface CurrencyRate {
  date: Date;
  rate: number;
  type: typeOfCurrency;
}
