import { describe, it, expect } from 'vitest';

const BASE_CONSUMPTION = 25.5;
const HEAD_CONSUMPTION = 23;
const REF_CONSUMPTION = 2;

function calculateFuelConsumption(distance: number, loadType: 'empty' | 'loaded' | 'head', weight?: number, coefficient?: number) {
  if (loadType === 'head') {
    return (distance * HEAD_CONSUMPTION) / 100;
  }
  
  let consumptionPer100km = BASE_CONSUMPTION;
  
  if (loadType === 'loaded' && weight && coefficient) {
    const additionalConsumption = (weight * coefficient) / 1000;
    consumptionPer100km = BASE_CONSUMPTION + additionalConsumption;
  }
  
  return (distance * consumptionPer100km) / 100;
}

describe('Калькулятор расхода топлива', () => {
  it('должен правильно рассчитывать расход для пустой поездки', () => {
    expect(calculateFuelConsumption(100, 'empty')).toBe(25.5);
  });

  it('должен правильно рассчитывать расход для головы', () => {
    expect(calculateFuelConsumption(100, 'head')).toBe(23);
  });

  it('должен правильно рассчитывать расход для груженой поездки', () => {
    const expected = calculateFuelConsumption(100, 'loaded', 10000, 0.35);
    expect(expected).toBe(29);
  });

  it('должен правильно рассчитывать расход рефрижератора', () => {
    expect(5 * REF_CONSUMPTION).toBe(10);
  });
});