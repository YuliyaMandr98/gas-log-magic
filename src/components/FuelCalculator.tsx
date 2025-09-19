import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Truck, Fuel, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Trip {
  id: string;
  distance: number;
  weight: number;
  loadType: 'empty' | 'loaded';
  expectedFuel: number;
  actualFuel?: number;
  date: string;
}

const BASE_CONSUMPTION = 25.5; // л/100км для пустого

export const FuelCalculator = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [distance, setDistance] = useState('');
  const [weight, setWeight] = useState('');
  const [loadType, setLoadType] = useState<'empty' | 'loaded'>('empty');
  const [coefficient, setCoefficient] = useState('0.35');
  const [actualFuel, setActualFuel] = useState('');
  const { toast } = useToast();

  const calculateExpectedFuel = () => {
    const dist = parseFloat(distance);
    const wt = parseFloat(weight) || 0;
    const coeff = parseFloat(coefficient) || 0;
    
    if (!dist || dist <= 0) return 0;

    let consumptionPer100km = BASE_CONSUMPTION;
    
    // Для груженой поездки добавляем к базовому расходу (вес × коэффициент ÷ 1000)
    if (loadType === 'loaded' && wt > 0) {
      const additionalConsumption = Math.round((wt * coeff / 1000) * 100) / 100; // округляем до сотых
      consumptionPer100km = BASE_CONSUMPTION + additionalConsumption;
    }

    return (dist * consumptionPer100km) / 100;
  };

  const addTrip = () => {
    const dist = parseFloat(distance);
    const wt = parseFloat(weight) || 0;
    
    if (!dist || dist <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректное расстояние",
        variant: "destructive",
      });
      return;
    }

    const expected = calculateExpectedFuel();
    const actual = actualFuel ? parseFloat(actualFuel) : undefined;
    
    const newTrip: Trip = {
      id: Date.now().toString(),
      distance: dist,
      weight: wt,
      loadType,
      expectedFuel: expected,
      actualFuel: actual,
      date: new Date().toLocaleDateString('ru-RU'),
    };

    setTrips(prev => [newTrip, ...prev]);
    
    // Очищаем форму
    setDistance('');
    setWeight('');
    setActualFuel('');
    
    toast({
      title: "Поездка добавлена",
      description: `Ожидаемый расход: ${expected.toFixed(2)} л`,
    });
  };

  const getTotalExpected = () => trips.reduce((sum, trip) => sum + trip.expectedFuel, 0);
  const getTotalActual = () => trips.reduce((sum, trip) => sum + (trip.actualFuel || 0), 0);
  const getDifference = () => getTotalActual() - getTotalExpected();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="text-center py-8 bg-gradient-hero rounded-lg shadow-elevated">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Truck className="w-10 h-10" />
            Калькулятор расхода топлива
          </h1>
          <p className="text-white/90 text-lg">Учет и расчет расхода топлива для грузового автомобиля</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Форма расчета */}
          <Card className="lg:col-span-1 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Новая поездка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  placeholder="Вес груза (если есть)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loadType">Тип поездки</Label>
                <Select value={loadType} onValueChange={(value: 'empty' | 'loaded') => setLoadType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty">Пустой</SelectItem>
                    <SelectItem value="loaded">Груженый</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coefficient">Коэффициент</Label>
                <Input
                  id="coefficient"
                  type="number"
                  step="0.01"
                  placeholder="Введите коэффициент"
                  value={coefficient}
                  onChange={(e) => setCoefficient(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualFuel">Фактический расход (л)</Label>
                <Input
                  id="actualFuel"
                  type="number"
                  placeholder="Реальный расход (опционально)"
                  value={actualFuel}
                  onChange={(e) => setActualFuel(e.target.value)}
                />
              </div>

              {distance && (
                <div className="p-4 bg-muted rounded-lg">
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
                      : `${BASE_CONSUMPTION} + (${parseFloat(weight) || 0} × ${coefficient} ÷ 1000) = ${(BASE_CONSUMPTION + Math.round(((parseFloat(weight) || 0) * (parseFloat(coefficient) || 0) / 1000) * 100) / 100).toFixed(2)} л/100км`
                    }
                  </div>
                </div>
              )}

              <Button onClick={addTrip} className="w-full" variant="transport">
                Добавить поездку
              </Button>
            </CardContent>
          </Card>

          {/* Статистика */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      getDifference() > 0 ? 'bg-warning/20' : 'bg-success/20'
                    }`}>
                      <span className={`text-sm font-bold ${getDifference() > 0 ? 'text-warning' : 'text-success'}`}>
                        {getDifference() > 0 ? '↑' : '↓'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                          <tr key={trip.id} className="border-b">
                            <td className="py-2">{trip.date}</td>
                            <td className="py-2">{trip.distance} км</td>
                            <td className="py-2">{trip.weight || '-'} кг</td>
                            <td className="py-2">
                              <Badge variant={trip.loadType === 'empty' ? 'secondary' : 'default'}>
                                {trip.loadType === 'empty' ? 'Пустой' : 'Груженый'}
                              </Badge>
                            </td>
                            <td className="py-2 font-medium">{trip.expectedFuel.toFixed(2)} л</td>
                            <td className="py-2 font-medium">
                              {trip.actualFuel ? `${trip.actualFuel.toFixed(2)} л` : '-'}
                            </td>
                            <td className="py-2">
                              {trip.actualFuel ? (
                                <span className={`font-medium ${
                                  (trip.actualFuel - trip.expectedFuel) > 0 ? 'text-warning' : 'text-success'
                                }`}>
                                  {((trip.actualFuel - trip.expectedFuel) > 0 ? '+' : '') + 
                                   (trip.actualFuel - trip.expectedFuel).toFixed(2)} л
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};