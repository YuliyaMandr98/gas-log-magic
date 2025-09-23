import { describe, it, expect } from 'vitest';

interface LoadOperation {
  id: string;
  type: 'load' | 'unload';
  date: string;
  weight: number;
  description?: string;
}

function processCargoOperations(operations: LoadOperation[], initialWeight = 0) {
  let currentWeight = initialWeight;
  const processedOps = [];
  
  for (const op of operations) {
    if (op.type === 'load') {
      currentWeight += op.weight;
    } else {
      currentWeight = Math.max(0, currentWeight - op.weight);
    }
    processedOps.push({ ...op, resultingWeight: currentWeight });
  }
  
  return { currentWeight, operations: processedOps };
}

describe('Операции с грузом', () => {
  it('должен правильно обрабатывать загрузку', () => {
    const operations: LoadOperation[] = [
      { id: '1', type: 'load', date: '2024-01-01', weight: 5000 }
    ];
    
    const result = processCargoOperations(operations);
    expect(result.currentWeight).toBe(5000);
  });

  it('должен правильно обрабатывать выгрузку', () => {
    const operations: LoadOperation[] = [
      { id: '1', type: 'load', date: '2024-01-01', weight: 10000 },
      { id: '2', type: 'unload', date: '2024-01-02', weight: 3000 }
    ];
    
    const result = processCargoOperations(operations);
    expect(result.currentWeight).toBe(7000);
  });

  it('не должен допускать отрицательный вес', () => {
    const operations: LoadOperation[] = [
      { id: '1', type: 'load', date: '2024-01-01', weight: 5000 },
      { id: '2', type: 'unload', date: '2024-01-02', weight: 8000 }
    ];
    
    const result = processCargoOperations(operations);
    expect(result.currentWeight).toBe(0);
  });

  it('должен учитывать начальный вес', () => {
    const operations: LoadOperation[] = [
      { id: '1', type: 'load', date: '2024-01-01', weight: 2000 }
    ];
    
    const result = processCargoOperations(operations, 3000);
    expect(result.currentWeight).toBe(5000);
  });
});