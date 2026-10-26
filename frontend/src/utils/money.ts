import { useEffect, useState } from 'react';
import { getCbuRate } from '../api/services';
import type { Currency } from '../types';

export const formatUsd = (amount: number) => {
  const n = Number(amount) || 0;
  return `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

export const formatUzs = (amount: number) =>
  `${Math.round(Number(amount) || 0).toLocaleString('ru-RU')} so'm`;

export const formatMoney = (amount: number, currency: Currency) =>
  currency === 'USD' ? formatUsd(amount) : formatUzs(amount);

export const useCbuRate = () => {
  const [rate, setRate] = useState(0);
  useEffect(() => {
    let active = true;
    getCbuRate().then((r) => {
      if (active) setRate(r);
    });
    return () => {
      active = false;
    };
  }, []);
  return rate;
};

export const toUsd = (amount: number, currency: Currency, rate: number) =>
  currency === 'USD' ? amount : rate > 0 ? amount / rate : 0;

export const toUzs = (amount: number, currency: Currency, rate: number) =>
  currency === 'UZS' ? amount : amount * rate;
