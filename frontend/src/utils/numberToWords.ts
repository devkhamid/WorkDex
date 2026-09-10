// Raqamni Ruscha so'zga aylantirish (UZS uchun)
export function numberToWordsRu(num: number): string {
  if (num === 0) return 'ноль сумов';
  if (isNaN(num)) return '';

  const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
    'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
    'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  const thousands_m = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
    'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
    'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];

  function convertThreeDigits(n: number, isFemale: boolean = false): string {
    if (n === 0) return '';
    let result = '';
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    if (h > 0) result += hundreds[h] + ' ';
    if (remainder < 20) {
      if (remainder > 0) result += (isFemale ? thousands_m[remainder] : ones[remainder]) + ' ';
    } else {
      const t = Math.floor(remainder / 10);
      const o = remainder % 10;
      result += tens[t] + ' ';
      if (o > 0) result += (isFemale ? thousands_m[o] : ones[o]) + ' ';
    }
    return result;
  }

  function thousandsSuffix(n: number): string {
    const mod100 = n % 100;
    const mod10 = n % 10;
    if (mod100 >= 11 && mod100 <= 19) return 'тысяч';
    if (mod10 === 1) return 'тысяча';
    if (mod10 >= 2 && mod10 <= 4) return 'тысячи';
    return 'тысяч';
  }

  function millionsSuffix(n: number): string {
    const mod100 = n % 100;
    const mod10 = n % 10;
    if (mod100 >= 11 && mod100 <= 19) return 'миллионов';
    if (mod10 === 1) return 'миллион';
    if (mod10 >= 2 && mod10 <= 4) return 'миллиона';
    return 'миллионов';
  }

  function billionsSuffix(n: number): string {
    const mod100 = n % 100;
    const mod10 = n % 10;
    if (mod100 >= 11 && mod100 <= 19) return 'миллиардов';
    if (mod10 === 1) return 'миллиард';
    if (mod10 >= 2 && mod10 <= 4) return 'миллиарда';
    return 'миллиардов';
  }

  let n = Math.floor(num);
  let result = '';

  const billions = Math.floor(n / 1_000_000_000);
  n %= 1_000_000_000;
  const millions = Math.floor(n / 1_000_000);
  n %= 1_000_000;
  const thousands = Math.floor(n / 1_000);
  n %= 1_000;

  if (billions > 0) {
    result += convertThreeDigits(billions) + billionsSuffix(billions) + ' ';
  }
  if (millions > 0) {
    result += convertThreeDigits(millions) + millionsSuffix(millions) + ' ';
  }
  if (thousands > 0) {
    result += convertThreeDigits(thousands, true) + thousandsSuffix(thousands) + ' ';
  }
  if (n > 0) {
    result += convertThreeDigits(n);
  }

  return result.trim() + ' сумов';
}

export const MONTHS_RU = [
  '', 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];
