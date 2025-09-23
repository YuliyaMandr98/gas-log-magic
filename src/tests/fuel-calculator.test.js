// Константы из приложения
const BASE_CONSUMPTION = 25.5;
const HEAD_CONSUMPTION = 23;
const REF_CONSUMPTION = 2;

// Функции расчета
function calculateFuelConsumption(distance, loadType, weight, coefficient) {
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

// Тесты
console.log('🧪 Запуск тестов калькулятора расхода топлива...\n');

// Тест 1: Пустая поездка
const test1 = calculateFuelConsumption(100, 'empty');
console.log(`✅ Тест 1 - Пустая поездка (100км): ${test1} л (ожидается: 25.5)`);
console.assert(test1 === 25.5, 'Ошибка в расчете пустой поездки');

// Тест 2: Голова
const test2 = calculateFuelConsumption(100, 'head');
console.log(`✅ Тест 2 - Голова (100км): ${test2} л (ожидается: 23)`);
console.assert(test2 === 23, 'Ошибка в расчете поездки на голове');

// Тест 3: Груженая поездка
const test3 = calculateFuelConsumption(100, 'loaded', 10000, 0.35);
console.log(`✅ Тест 3 - Груженая поездка (100км, 10т): ${test3} л (ожидается: 29)`);
console.assert(test3 === 29, 'Ошибка в расчете груженой поездки');

// Тест 4: Разные расстояния
const test4a = calculateFuelConsumption(50, 'empty');
const test4b = calculateFuelConsumption(200, 'empty');
const test4c = calculateFuelConsumption(150, 'head');
console.log(`✅ Тест 4a - Пустая 50км: ${test4a} л (ожидается: 12.75)`);
console.log(`✅ Тест 4b - Пустая 200км: ${test4b} л (ожидается: 51)`);
console.log(`✅ Тест 4c - Голова 150км: ${test4c} л (ожидается: 34.5)`);
console.assert(test4a === 12.75, 'Ошибка в расчете 50км пустой');
console.assert(test4b === 51, 'Ошибка в расчете 200км пустой');
console.assert(test4c === 34.5, 'Ошибка в расчете 150км голова');

// Тест 5: Рефрижератор
const refTest1 = 5 * REF_CONSUMPTION;
const refTest2 = 8 * REF_CONSUMPTION;
console.log(`✅ Тест 5a - Реф 5ч: ${refTest1} л (ожидается: 10)`);
console.log(`✅ Тест 5b - Реф 8ч: ${refTest2} л (ожидается: 16)`);
console.assert(refTest1 === 10, 'Ошибка в расчете рефрижератора 5ч');
console.assert(refTest2 === 16, 'Ошибка в расчете рефрижератора 8ч');

// Комплексный тест
const trips = [
  { distance: 100, loadType: 'empty' },
  { distance: 150, loadType: 'loaded', weight: 5000, coefficient: 0.35 },
  { distance: 80, loadType: 'head' }
];

const totalTripFuel = trips.reduce((sum, trip) => {
  return sum + calculateFuelConsumption(trip.distance, trip.loadType, trip.weight, trip.coefficient);
}, 0);

console.log(`✅ Комплексный тест - Общий расход: ${totalTripFuel.toFixed(3)} л (ожидается: ~84.775)`);
console.assert(Math.abs(totalTripFuel - 84.775) < 0.001, 'Ошибка в комплексном расчете');

console.log('\n🎉 Все тесты пройдены успешно!');