import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Clock, Fuel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RefSession {
  id: string;
  startDate: string;
  endDate?: string;
  duration: number; // в часах
  fuelConsumed: number;
  status: 'active' | 'completed';
}

export const RefrigeratorTracker = () => {
  const [sessions, setSessions] = useState<RefSession[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState<RefSession | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [manualDuration, setManualDuration] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const { toast } = useToast();

  const startSession = () => {
    if (!startTime) {
      toast({
        title: "Ошибка",
        description: "Укажите время включения рефрижератора",
        variant: "destructive",
      });
      return;
    }

    const newSession: RefSession = {
      id: Date.now().toString(),
      startDate: startTime,
      duration: 0,
      fuelConsumed: 0,
      status: 'active',
    };

    setCurrentSession(newSession);
    setIsRunning(true);
    
    toast({
      title: "Рефрижератор включен",
      description: `Начало работы: ${startTime}`,
    });
  };

  const stopSession = () => {
    if (!currentSession || !endTime) {
      toast({
        title: "Ошибка",
        description: "Укажите время выключения рефрижератора",
        variant: "destructive",
      });
      return;
    }

    const duration = manualDuration ? parseFloat(manualDuration) : 0;
    const fuel = fuelAmount ? parseFloat(fuelAmount) : 0;

    const completedSession: RefSession = {
      ...currentSession,
      endDate: endTime,
      duration,
      fuelConsumed: fuel,
      status: 'completed',
    };

    setSessions(prev => [completedSession, ...prev]);
    setCurrentSession(null);
    setIsRunning(false);
    
    // Очищаем форму
    setStartTime('');
    setEndTime('');
    setManualDuration('');
    setFuelAmount('');
    
    toast({
      title: "Сессия завершена",
      description: `Длительность: ${duration}ч, Расход: ${fuel}л`,
    });
  };

  const addManualSession = () => {
    if (!startTime || !endTime || !manualDuration || !fuelAmount) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    const duration = parseFloat(manualDuration);
    const fuel = parseFloat(fuelAmount);

    const newSession: RefSession = {
      id: Date.now().toString(),
      startDate: startTime,
      endDate: endTime,
      duration,
      fuelConsumed: fuel,
      status: 'completed',
    };

    setSessions(prev => [newSession, ...prev]);
    
    // Очищаем форму
    setStartTime('');
    setEndTime('');
    setManualDuration('');
    setFuelAmount('');
    
    toast({
      title: "Сессия добавлена",
      description: `Длительность: ${duration}ч, Расход: ${fuel}л`,
    });
  };

  const getTotalHours = () => sessions.reduce((sum, session) => sum + session.duration, 0);
  const getTotalFuel = () => sessions.reduce((sum, session) => sum + session.fuelConsumed, 0);
  const getAverageConsumption = () => {
    const totalHours = getTotalHours();
    return totalHours > 0 ? getTotalFuel() / totalHours : 0;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-secondary" />
            Учет работы рефрижератора
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">Время включения</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Время выключения</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration">Длительность работы (часы)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="Количество часов"
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel">Расход топлива (литры)</Label>
              <Input
                id="fuel"
                type="number"
                placeholder="Количество литров"
                value={fuelAmount}
                onChange={(e) => setFuelAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {!isRunning ? (
              <>
                <Button onClick={startSession} variant="secondary" className="flex-1">
                  <Clock className="w-4 h-4 mr-2" />
                  Включить рефрижератор
                </Button>
                <Button onClick={addManualSession} variant="outline" className="flex-1">
                  Добавить сессию
                </Button>
              </>
            ) : (
              <Button onClick={stopSession} variant="destructive" className="w-full">
                <Clock className="w-4 h-4 mr-2" />
                Выключить рефрижератор
              </Button>
            )}
          </div>

          {currentSession && (
            <div className="p-4 bg-secondary/20 rounded-lg border border-secondary/30">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Активная сессия</Badge>
              </div>
              <p className="text-sm">
                Рефрижератор работает с: <strong>{new Date(currentSession.startDate).toLocaleString('ru-RU')}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Статистика рефрижератора */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Всего часов</p>
                <p className="text-2xl font-bold text-secondary">{getTotalHours().toFixed(1)}ч</p>
              </div>
              <Clock className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Общий расход</p>
                <p className="text-2xl font-bold text-primary">{getTotalFuel().toFixed(2)} л</p>
              </div>
              <Fuel className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Расход в час</p>
                <p className="text-2xl font-bold text-accent">{getAverageConsumption().toFixed(2)} л/ч</p>
              </div>
              <Thermometer className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* История сессий */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>История работы рефрижератора</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Сессии не добавлены
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Включение</th>
                    <th className="text-left py-2">Выключение</th>
                    <th className="text-left py-2">Длительность</th>
                    <th className="text-left py-2">Расход</th>
                    <th className="text-left py-2">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b">
                      <td className="py-2">
                        {new Date(session.startDate).toLocaleString('ru-RU')}
                      </td>
                      <td className="py-2">
                        {session.endDate ? new Date(session.endDate).toLocaleString('ru-RU') : '-'}
                      </td>
                      <td className="py-2 font-medium">{session.duration}ч</td>
                      <td className="py-2 font-medium">{session.fuelConsumed.toFixed(2)} л</td>
                      <td className="py-2">
                        <Badge variant={session.status === 'active' ? 'secondary' : 'default'}>
                          {session.status === 'active' ? 'Активна' : 'Завершена'}
                        </Badge>
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
  );
};