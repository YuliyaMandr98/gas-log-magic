// При монтировании компонента всегда пересчитываем баки по всем данным
import { useEffect } from 'react';
// --- Функции для синхронизации с основным баком ---
function subtractFromMainTank(amount: number) {
  try {
    const LS_TANK_STATUS = 'fuelTankManager_status';
    const raw = localStorage.getItem(LS_TANK_STATUS);
    if (!raw) return;
    const status = JSON.parse(raw);
    status.main = (status.main || 0) - amount; // разрешаем минус
    localStorage.setItem(LS_TANK_STATUS, JSON.stringify(status));
  } catch { }
}
function addToMainTank(amount: number) {
  try {
    const LS_TANK_STATUS = 'fuelTankManager_status';
    const raw = localStorage.getItem(LS_TANK_STATUS);
    if (!raw) return;
    const status = JSON.parse(raw);
    status.main = (status.main || 0) + amount;
    localStorage.setItem(LS_TANK_STATUS, JSON.stringify(status));
  } catch { }
}
import React, { useState } from 'react';
import { useInitialFuel } from '@/hooks/use-initial-fuel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Truck, Fuel, Calculator } from 'lucide-react';
import { recalculateAllTanks } from '@/lib/recalculateAllTanks';
import InitialFuelWidget from './InitialFuelWidget';

// Функция для форматирования даты в русском формате
const formatRussianDate = (date: Date) => {
  const months = [
    'янв', 'фев', 'мар', 'апр', 'май', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
  ];

  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

interface Trip {
  id: string;
  distance: number;
  weight: number;
  loadType: 'empty' | 'loaded' | 'head';
  coefficient?: string;
  expectedFuel: number;
  actualFuel?: number;
  date: string;
}

interface LoadOperation {
  id: string;
  type: 'load' | 'unload';
  date: string;
  weight: number;
  description?: string;
}

interface CargoState {
  currentWeight: number;
  operations: LoadOperation[];
}

const BASE_CONSUMPTION = 25; // л/100км для пустого!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const HEAD_CONSUMPTION = 23; // л/100км для головы (без прицепа)


export const FuelCalculator = () => {
  // Получаем стартовое топливо из localStorage
  const { main: initialMain } = useInitialFuel();
  // Синхронизация бака при первом рендере (на случай старых поездок)
  useEffect(() => {
    recalculateAllTanks();
  }, []);
  // --- localStorage keys ---
  const LS_TRIPS = 'fuelCalc_trips';
  const LS_FORM = 'fuelCalc_form';

  // --- state ---
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem(LS_TRIPS);
    return saved ? JSON.parse(saved) : [];
  });
  const [distance, setDistance] = useState(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).distance || '' : '';
  });
  const [weight, setWeight] = useState(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).weight || '' : '';
  });
  const [loadType, setLoadType] = useState<'empty' | 'loaded' | 'head'>(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).loadType || 'empty' : 'empty';
  });
  const [coefficient, setCoefficient] = useState(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).coefficient || '0.35' : '0.35';
  });
  const [actualFuel, setActualFuel] = useState(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).actualFuel || '' : '';
  });

  // --- редактирование ---
  const [editId, setEditId] = useState<string | null>(null);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);

  // --- состояние груза ---
  const [cargoState, setCargoState] = useState<CargoState>(() => {
    const saved = localStorage.getItem('fuelCalc_cargo');
    if (saved) {
      return JSON.parse(saved);
    }

    // Если нет сохраненных данных, проверяем начальный вес
    const initialFuel = localStorage.getItem('initialFuelState');
    if (initialFuel) {
      try {
        const parsed = JSON.parse(initialFuel);
        const initialWeight = parsed.cargoWeight || 0;
        return { currentWeight: initialWeight, operations: [] };
      } catch { }
    }

    return { currentWeight: 0, operations: [] };
  });
  const [loadDate, setLoadDate] = useState('');
  const [loadWeight, setLoadWeight] = useState('');
  const [unloadWeight, setUnloadWeight] = useState('');
  const [unloadType, setUnloadType] = useState<'all' | 'partial'>('all');
  const [loadDescription, setLoadDescription] = useState('');

  const startEdit = (trip: Trip) => {
    setEditId(trip.id);
    setEditTrip({ ...trip });
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditTrip(null);
  };
  const saveEdit = () => {
    if (!editTrip) return;
    // Пересчитать expectedFuel
    let consumptionPer100km = BASE_CONSUMPTION;
    if (editTrip.loadType === 'head') {
      consumptionPer100km = HEAD_CONSUMPTION;
    } else if (editTrip.loadType === 'loaded' && editTrip.weight > 0 && editTrip.coefficient) {
      const additional = Math.round((editTrip.weight * parseFloat(editTrip.coefficient as any || '0.35') / 1000) * 100) / 100;
      consumptionPer100km = BASE_CONSUMPTION + additional;
    }
    const expectedFuel = Math.round((editTrip.distance * consumptionPer100km) / 100 * 100) / 100;
    // Корректировка бака: вернуть старое, вычесть новое
    setTrips(prev => {
      const updated = prev.map(t => t.id === editTrip.id ? { ...editTrip, expectedFuel } : t);
      setTimeout(recalculateAllTanks, 0);
      return updated;
    });
    setEditId(null);
    setEditTrip(null);
    // toast({ title: 'Поездка обновлена' });
  };
  const handleEditChange = (field: keyof Trip, value: any) => {
    if (!editTrip) return;
    // Если меняется тип, сбрасываем коэффициент для пустого и головы
    if (field === 'loadType' && (value === 'empty' || value === 'head')) {
      setEditTrip({ ...editTrip, loadType: value, coefficient: '0.35', weight: 0 });
    } else {
      setEditTrip({ ...editTrip, [field]: value });
    }
  };

  // --- удаление ---
  const deleteTrip = (id: string) => {
    setTrips(prev => {
      const updated = prev.filter(t => t.id !== id);
      setTimeout(recalculateAllTanks, 0);
      return updated;
    });
    // toast({ title: 'Поездка удалена' });
  };

  // --- save trips to localStorage ---
  React.useEffect(() => {
    localStorage.setItem(LS_TRIPS, JSON.stringify(trips));
  }, [trips]);

  // --- save form to localStorage ---
  React.useEffect(() => {
    localStorage.setItem(
      LS_FORM,
      JSON.stringify({ distance, weight, loadType, coefficient, actualFuel })
    );
  }, [distance, weight, loadType, coefficient, actualFuel]);

  // --- save cargo state to localStorage ---
  React.useEffect(() => {
    localStorage.setItem('fuelCalc_cargo', JSON.stringify(cargoState));
  }, [cargoState]);

  // --- автоматическое заполнение формы поездки на основе текущего груза ---
  React.useEffect(() => {
    if (cargoState.currentWeight > 0) {
      setLoadType('loaded');
      setWeight(cargoState.currentWeight.toString());
    } else if (cargoState.currentWeight === 0 && loadType === 'loaded') {
      setLoadType('empty');
      setWeight('');
    }
  }, [cargoState]);

  // --- обновление веса груза при изменении начальных данных ---
  React.useEffect(() => {
    const handleStorageChange = () => {
      const savedCargo = localStorage.getItem('fuelCalc_cargo');

      if (savedCargo) {
        try {
          const parsed = JSON.parse(savedCargo);
          setCargoState(parsed);
        } catch { }
      } else {
        const initialFuel = localStorage.getItem('initialFuelState');
        if (initialFuel) {
          try {
            const parsed = JSON.parse(initialFuel);
            const initialWeight = parsed.cargoWeight || 0;
            setCargoState({ currentWeight: initialWeight, operations: [] });
          } catch { }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const calculateExpectedFuel = () => {
    const dist = parseFloat(distance);
    const wt = parseFloat(weight) || 0;
    const coeff = parseFloat(coefficient) || 0;

    if (!dist || dist <= 0) return 0;

    let consumptionPer100km = BASE_CONSUMPTION;

    if (loadType === 'head') {
      consumptionPer100km = HEAD_CONSUMPTION;
    } else if (loadType === 'loaded' && wt > 0) {
      // Для груженой поездки добавляем к базовому расходу (вес × коэффициент ÷ 1000)
      const additionalConsumption = Math.round((wt * coeff / 1000) * 100) / 100; // округляем до сотых
      consumptionPer100km = BASE_CONSUMPTION + additionalConsumption;
    }

    return (dist * consumptionPer100km) / 100;
  };

  const addTrip = () => {
    const dist = distance.trim();
    const wt = weight.trim();
    const distNum = parseFloat(dist);
    const wtNum = parseFloat(wt) || 0;
    if (!distNum || distNum <= 0) {
      // toast({
      //   title: "Ошибка",
      //   description: "Введите корректное расстояние",
      //   variant: "destructive",
      // });
      return;
    }
    if (loadType === 'loaded' && (!wtNum || wtNum <= 0)) {
      // toast({
      //   title: "Ошибка",
      //   description: "Для гружёной поездки обязательно укажите вес груза",
      //   variant: "destructive",
      // });
      return;
    }
    const expected = Math.round(calculateExpectedFuel() * 100) / 100;
    const actual = actualFuel ? parseFloat(actualFuel) : undefined;
    const newTrip: Trip = {
      id: Date.now().toString(),
      distance: distNum, // сохраняем как число, без округления
      weight: wtNum,
      loadType,
      coefficient,
      expectedFuel: expected,
      actualFuel: actual,
      date: new Date().toLocaleDateString('ru-RU'),
    };
    setTrips(prev => {
      const updated = [newTrip, ...prev];
      setTimeout(recalculateAllTanks, 0);
      return updated;
    });
    setDistance('');
    setWeight('');
    setActualFuel('');
    // toast({
    //   title: "Поездка добавлена",
    //   description: `Ожидаемый расход: ${expected.toFixed(2)} л`,
    // });
  };

  const getTotalExpected = () => trips.reduce((sum, trip) => sum + trip.expectedFuel, 0);
  const getTotalActual = () => trips.reduce((sum, trip) => sum + (trip.actualFuel || 0), 0);
  // Разница = актуальное количество топлива в баке (по всем операциям и поездкам)
  const getDifference = () => {
    const statusRaw = localStorage.getItem('fuelTankManager_status');
    if (!statusRaw) return 0;
    try {
      const status = JSON.parse(statusRaw);
      return status.main;
    } catch {
      return 0;
    }
  };
  const getTotalDistance = () => trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);

  const addLoadOperation = () => {
    const weightNum = parseFloat(loadWeight);
    if (!loadDate || !weightNum || weightNum <= 0) return;

    const newOperation: LoadOperation = {
      id: Date.now().toString(),
      type: 'load',
      date: loadDate,
      weight: weightNum,
      description: loadDescription.trim() || undefined
    };

    setCargoState(prev => ({
      currentWeight: prev.currentWeight + weightNum,
      operations: [newOperation, ...prev.operations]
    }));

    setLoadDate('');
    setLoadWeight('');
    setLoadDescription('');
  };

  const addUnloadOperation = () => {
    if (!loadDate) {
      alert('Укажите дату выгрузки');
      return;
    }

    const weightNum = unloadType === 'all' ? cargoState.currentWeight : parseFloat(unloadWeight);

    if (cargoState.currentWeight === 0) {
      alert('Нет груза для выгрузки');
      return;
    }

    if (unloadType === 'partial' && (!weightNum || weightNum <= 0 || weightNum > cargoState.currentWeight)) {
      alert('Некорректный вес для выгрузки');
      return;
    }

    const newOperation: LoadOperation = {
      id: Date.now().toString(),
      type: 'unload',
      date: loadDate,
      weight: weightNum,
      description: loadDescription.trim() || undefined
    };

    setCargoState(prev => ({
      currentWeight: Math.max(0, prev.currentWeight - weightNum),
      operations: [newOperation, ...prev.operations]
    }));

    setLoadDate('');
    setUnloadWeight('');
    setUnloadType('all');
    setLoadDescription('');
  };

  const deleteLoadOperation = (id: string) => {
    const operation = cargoState.operations.find(op => op.id === id);
    if (!operation) return;

    setCargoState(prev => {
      const newWeight = operation.type === 'load'
        ? prev.currentWeight - operation.weight
        : prev.currentWeight + operation.weight;

      return {
        currentWeight: Math.max(0, newWeight),
        operations: prev.operations.filter(op => op.id !== id)
      };
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="relative py-8 bg-gradient-hero rounded-lg shadow-elevated">
          <div className="absolute -top-1 right-4">
            <InitialFuelWidget />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              <Truck className="w-10 h-10" />
              Калькулятор расхода топлива
            </h1>
            <p className="text-white/90 text-lg">Учет и расчет расхода топлива для грузового автомобиля</p>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Общий километраж</p>
                  <p className="text-2xl font-bold text-accent">{getTotalDistance().toFixed(1)} км</p>
                </div>
                <Truck className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Расчетный расход</p>
                  <p className="text-2xl font-bold text-primary">{getTotalExpected().toFixed(2)} л</p>
                </div>
                <Calculator className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Фактический расход</p>
                  <p className="text-2xl font-bold text-secondary">{getTotalActual().toFixed(2)} л</p>
                </div>
                <Fuel className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Разница</p>
                  <p className={`text-2xl font-bold ${getDifference() > 0 ? 'text-warning' : 'text-success'}`}>
                    {getDifference() > 0 ? '+' : ''}{getDifference().toFixed(2)} л
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getDifference() > 0 ? 'bg-warning/20' : 'bg-success/20'
                  }`}>
                  <span className={`text-sm font-bold ${getDifference() > 0 ? 'text-warning' : 'text-success'}`}>
                    {getDifference() > 0 ? '↑' : '↓'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Учет груза */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-secondary" />
              Учет груза
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-6">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Текущий вес груза:</div>
                <div className="text-xl font-bold">{cargoState.currentWeight} кг</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loadDate">Дата</Label>
                <Input
                  id="loadDate"
                  type="date"
                  value={loadDate}
                  onChange={(e) => setLoadDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loadDescription">Описание</Label>
                <Input
                  id="loadDescription"
                  placeholder="Описание груза"
                  value={loadDescription}
                  onChange={(e) => setLoadDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Загрузка</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Вес (кг)"
                    value={loadWeight}
                    onChange={(e) => setLoadWeight(e.target.value)}
                  />
                  <Button onClick={addLoadOperation} variant="success" size="sm">
                    Загрузить
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Выгрузка</Label>
                <Select value={unloadType} onValueChange={(value: 'all' | 'partial') => setUnloadType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Выгрузить всё ({cargoState.currentWeight} кг)</SelectItem>
                    <SelectItem value="partial">Частичная выгрузка</SelectItem>
                  </SelectContent>
                </Select>
                {unloadType === 'partial' && (
                  <Input
                    type="number"
                    placeholder="Вес выгрузки (кг)"
                    value={unloadWeight}
                    onChange={(e) => setUnloadWeight(e.target.value)}
                    max={cargoState.currentWeight}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Действие</Label>
                <Button
                  onClick={addUnloadOperation}
                  variant="destructive"
                  size="sm"
                  disabled={cargoState.currentWeight === 0}
                  className="w-full"
                >
                  Выгрузить {unloadType === 'all' ? 'всё' : ''}
                </Button>
              </div>
            </div>

            {cargoState.operations.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Последние операции:</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {cargoState.operations.slice(0, 5).map((op) => (
                    <div key={op.id} className="flex justify-between items-center text-xs p-2 bg-muted/50 rounded">
                      <span>
                        {op.date} - {op.type === 'load' ? '+' : '-'}{op.weight}кг
                        {op.description && ` (${op.description})`}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => deleteLoadOperation(op.id)}>×</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Форма новой поездки */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Новая поездка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-6">
              <div className="space-y-2">
                <Label htmlFor="distance">Расстояние (км)</Label>
                <Input
                  id="distance"
                  type="number"
                  placeholder="Введите расстояние"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Вес груза (кг)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder={loadType === 'loaded' ? 'Обязательно' : 'Не требуется'}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={loadType === 'empty' || loadType === 'head'}
                  required={loadType === 'loaded'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loadType">Тип поездки</Label>
                <Select value={loadType} onValueChange={(value: 'empty' | 'loaded' | 'head') => setLoadType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty">Пустой</SelectItem>
                    <SelectItem value="loaded">Груженый</SelectItem>
                    <SelectItem value="head">Голова</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coefficient">Коэффициент</Label>
                <Input
                  id="coefficient"
                  type="number"
                  step="0.01"
                  placeholder="Коэффициент"
                  value={coefficient}
                  onChange={(e) => setCoefficient(e.target.value)}
                  disabled={loadType === 'empty' || loadType === 'head'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualFuel">Фактический расход (л)</Label>
                <Input
                  id="actualFuel"
                  type="number"
                  placeholder="Реальный расход"
                  value={actualFuel}
                  onChange={(e) => setActualFuel(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Действие</Label>
                <Button onClick={addTrip} className="w-full" variant="transport">
                  Добавить поездку
                </Button>
              </div>
            </div>

            {distance && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Fuel className="w-4 h-4 text-accent" />
                  <span className="font-medium">Расчетный расход:</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {calculateExpectedFuel().toFixed(2)} л
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {loadType === 'empty'
                    ? `${BASE_CONSUMPTION} л/100км`
                    : loadType === 'head'
                      ? `${HEAD_CONSUMPTION} л/100км (без прицепа)`
                      : `${BASE_CONSUMPTION} + (${parseFloat(weight) || 0} × ${coefficient} ÷ 1000) = ${(BASE_CONSUMPTION + Math.round(((parseFloat(weight) || 0) * (parseFloat(coefficient) || 0) / 1000) * 100) / 100).toFixed(2)} л/100км`
                  }
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Таблица поездок */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>История поездок</CardTitle>
          </CardHeader>
          <CardContent>
            {trips.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Поездки не добавлены
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Дата</th>
                      <th className="text-left py-2">Расстояние</th>
                      <th className="text-left py-2">Вес</th>
                      <th className="text-left py-2">Тип</th>
                      <th className="text-left py-2">Расчет</th>
                      <th className="text-left py-2">Факт</th>
                      <th className="text-left py-2">Разница</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip) => (
                      editId === trip.id && editTrip ? (
                        <tr key={trip.id} className="border-b bg-muted/40">
                          <td className="py-2">{trip.date}</td>
                          <td className="py-2">
                            <Input type="number" value={editTrip.distance}
                              onChange={e => handleEditChange('distance', parseFloat(e.target.value) || 0)} /> км
                          </td>
                          <td className="py-2">
                            <Input type="number" value={editTrip.weight}
                              onChange={e => handleEditChange('weight', parseFloat(e.target.value) || 0)}
                              disabled={editTrip.loadType === 'empty' || editTrip.loadType === 'head'} /> кг
                          </td>
                          <td className="py-2">
                            <Select value={editTrip.loadType} onValueChange={v => handleEditChange('loadType', v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="empty">Пустой</SelectItem>
                                <SelectItem value="loaded">Груженый</SelectItem>
                                <SelectItem value="head">Голова</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2">
                            <Input type="number" value={editTrip.coefficient ?? '0.35'}
                              onChange={e => handleEditChange('coefficient', e.target.value)}
                              disabled={editTrip.loadType === 'empty' || editTrip.loadType === 'head'}
                            />
                          </td>
                          <td className="py-2 font-medium">
                            <Input type="number" value={editTrip.expectedFuel}
                              readOnly
                            /> л
                          </td>
                          <td className="py-2 font-medium">
                            <Input type="number" value={editTrip.actualFuel ?? ''}
                              onChange={e => handleEditChange('actualFuel', e.target.value ? parseFloat(e.target.value) : undefined)} /> л
                          </td>
                          <td className="py-2 flex gap-2">
                            <Button size="sm" variant="success" onClick={saveEdit}>Сохранить</Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>Отмена</Button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={trip.id} className="border-b">
                          <td className="py-2">{trip.date}</td>
                          <td className="py-2">{trip.distance} км</td>
                          <td className="py-2">{trip.weight || '-'} кг</td>
                          <td className="py-2">
                            <Badge variant={trip.loadType === 'empty' ? 'secondary' : trip.loadType === 'head' ? 'outline' : 'default'}>
                              {trip.loadType === 'empty' ? 'Пустой' : trip.loadType === 'head' ? 'Голова' : 'Груженый'}
                            </Badge>
                          </td>
                          <td className="py-2 font-medium">{trip.expectedFuel.toFixed(2)} л</td>
                          <td className="py-2 font-medium">
                            {trip.actualFuel ? `${trip.actualFuel.toFixed(2)} л` : '-'}
                          </td>
                          <td className="py-2 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(trip)}>Редактировать</Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteTrip(trip.id)}>Удалить</Button>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};