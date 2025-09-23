import { describe, it, expect } from 'vitest';

function parseDateAny(dateStr: string): Date {
  if (!dateStr) return new Date('Invalid');
  
  const ruMonths = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const ruMatch = dateStr.match(/(\d{1,2})-(\w{3})-(\d{4})/);
  if (ruMatch) {
    const [_, day, monthStr, year] = ruMatch;
    const monthIndex = ruMonths.indexOf(monthStr);
    if (monthIndex !== -1) {
      return new Date(parseInt(year), monthIndex, parseInt(day));
    }
  }
  
  if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
  
  const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (match) {
    const [_, d, m, y] = match;
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  }
  
  return new Date(dateStr);
}

function inPeriod(date: string, from: Date, to: Date) {
  const d = parseDateAny(date);
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return dDay >= fromDay && dDay <= toDay;
}

describe('Расчеты отчетов', () => {
  it('должен правильно парсить русские даты', () => {
    const date = parseDateAny('15-янв-2024');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(15);
  });

  it('должен правильно определять попадание в период', () => {
    const from = new Date('2024-01-01');
    const to = new Date('2024-01-31');
    
    expect(inPeriod('15-янв-2024', from, to)).toBe(true);
    expect(inPeriod('2024-01-15', from, to)).toBe(true);
    expect(inPeriod('15.01.2024', from, to)).toBe(true);
    expect(inPeriod('2024-02-01', from, to)).toBe(false);
  });

  it('должен правильно рассчитывать баланс топлива', () => {
    const initialMain = 100;
    const mainIn = 200;
    const mainOut = 50;
    const tripFact = 80;
    
    const mainCalc = initialMain + mainIn - mainOut - tripFact;
    expect(mainCalc).toBe(170);
    
    const mainCurrent = 160;
    const mainDiff = mainCurrent - mainCalc;
    expect(mainDiff).toBe(-10); // недостача
  });
});