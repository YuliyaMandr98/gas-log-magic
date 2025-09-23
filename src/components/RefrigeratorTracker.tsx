// --- Функции для корректировки бака рефрижератора ---
function addToRefTank(amount: number) {
  try {
    const LS_TANK_STATUS = 'fuelTankManager_status';
    const raw = localStorage.getItem(LS_TANK_STATUS);
    if (!raw) return;
    const status = JSON.parse(raw);
    status.ref = (status.ref || 0) + amount;
    localStorage.setItem(LS_TANK_STATUS, JSON.stringify(status));
  } catch {}
}
import React, { useState } from 'react';
// --- Функция для синхронизации с баком рефрижератора ---
function subtractFromRefTank(amount: number) {
  try {
    const LS_TANK_STATUS = 'fuelTankManager_status';
    const raw = localStorage.getItem(LS_TANK_STATUS);
    if (!raw) return;
    const status = JSON.parse(raw);
    status.ref = (status.ref || 0) - amount; // разрешаем минус
    localStorage.setItem(LS_TANK_STATUS, JSON.stringify(status));
  } catch {}
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Clock, Fuel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { recalculateAllTanks } from '@/lib/recalculateAllTanks';

// Функция для форматирования даты в русском формате
const formatRussianDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = [
    'янв', 'фев', 'мар', 'апр', 'май', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
  ];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

interface RefSession {
  id: string;
  startDate: string;
  endDate?: string;
  duration: number; // в часах
  fuelConsumed: number;
  status: 'active' | 'completed';
}

export const RefrigeratorTracker = () => {
  // --- localStorage keys ---
  const LS_SESSIONS = 'refrigeratorTracker_sessions';
  const LS_CURRENT = 'refrigeratorTracker_current';
  const LS_FORM = 'refrigeratorTracker_form';

  const [sessions, setSessions] = useState<RefSession[]>(() => {
    const saved = localStorage.getItem(LS_SESSIONS);
    return saved ? JSON.parse(saved) : [];
  });
  const [isRunning, setIsRunning] = useState(() => {
    const saved = localStorage.getItem(LS_CURRENT);
    return saved ? JSON.parse(saved).isRunning || false : false;
  });
  const [currentSession, setCurrentSession] = useState<RefSession | null>(() => {
    const saved = localStorage.getItem(LS_CURRENT);
    return saved ? JSON.parse(saved).currentSession || null : null;
  });
  const [startTime, setStartTime] = useState(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).startTime || '' : '';
  });
  const [endTime, setEndTime] = useState(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).endTime || '' : '';
  });
  const [manualDuration, setManualDuration] = useState(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).manualDuration || '' : '';
  });

  // Автоматический расчет длительности в часах по датам
  const getAutoDuration = () => {
    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        return ((end - start) / (1000 * 60 * 60));
      }
    }
    return null;
  };
  const autoDuration = getAutoDuration();
  // fuelAmount больше не нужен, расход считается автоматически
  const { toast } = useToast();

  // --- редактирование ---
  const [editId, setEditId] = useState<string | null>(null);
  const [editSession, setEditSession] = useState<RefSession | null>(null);

  const startEdit = (session: RefSession) => {
    setEditId(session.id);
    setEditSession({ ...session });
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditSession(null);
  };
  const saveEdit = () => {
    if (!editSession) return;
    let { startDate, endDate } = editSession;
    let duration = editSession.duration;
    let fuelConsumed = editSession.fuelConsumed;
    // Если заданы обе даты, пересчитать duration и fuelConsumed
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        duration = (end - start) / (1000 * 60 * 60);
        fuelConsumed = duration * 2;
      }
    }
    const updatedSession = { ...editSession, duration, fuelConsumed };
    setSessions(prev => prev.map(s => s.id === editSession.id ? updatedSession : s));
    setTimeout(recalculateAllTanks, 0);
    setEditId(null);
    setEditSession(null);
    toast({ title: 'Сессия обновлена' });
  };
  const handleEditChange = (field: keyof RefSession, value: any) => {
    if (!editSession) return;
    let updated = { ...editSession, [field]: value };
    // Если меняется дата включения или выключения, пересчитать duration и fuelConsumed
    if (field === 'startDate' || field === 'endDate') {
      const { startDate, endDate } = updated;
      if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) {
          const duration = (end - start) / (1000 * 60 * 60);
          const fuelConsumed = duration * 2;
          updated = { ...updated, duration, fuelConsumed };
        }
      }
    }
    setEditSession(updated);
  };

  // --- удаление ---
  const deleteSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) addToRefTank(session.fuelConsumed);
    setSessions(prev => prev.filter(s => s.id !== id));
    setTimeout(recalculateAllTanks, 0);
    toast({ title: 'Сессия удалена' });
  };
  React.useEffect(() => {
    localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  // --- save current session/isRunning to localStorage ---
  React.useEffect(() => {
    localStorage.setItem(
      LS_CURRENT,
      JSON.stringify({ currentSession, isRunning })
    );
  }, [currentSession, isRunning]);

  // --- save form to localStorage ---
  React.useEffect(() => {
    localStorage.setItem(
      LS_FORM,
      JSON.stringify({ startTime, endTime, manualDuration })
    );
  }, [startTime, endTime, manualDuration]);

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
    let duration = autoDuration !== null ? autoDuration : (manualDuration ? parseFloat(manualDuration) : 0);
    if (duration < 0) duration = 0;
    const fuel = duration * 2; // 2 литра в час
    const completedSession: RefSession = {
      ...currentSession,
      endDate: endTime,
      duration,
      fuelConsumed: fuel,
      status: 'completed',
    };
  setSessions(prev => [completedSession, ...prev]);
  setTimeout(recalculateAllTanks, 0);
    setCurrentSession(null);
    setIsRunning(false);
    // Очищаем форму
    setStartTime('');
    setEndTime('');
    setManualDuration('');
    toast({
      title: "Сессия завершена",
      description: `Длительность: ${duration.toFixed(2)}ч, Расход: ${fuel.toFixed(2)}л (2 л/ч)`,
    });
  };

  const addManualSession = () => {
    if (!startTime || !endTime) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }
    let duration = autoDuration !== null ? autoDuration : (manualDuration ? parseFloat(manualDuration) : 0);
    if (duration < 0) duration = 0;
    const fuel = duration * 2; // 2 литра в час
    const newSession: RefSession = {
      id: Date.now().toString(),
      startDate: startTime,
      endDate: endTime,
      duration,
      fuelConsumed: fuel,
      status: 'completed',
    };
  setSessions(prev => [newSession, ...prev]);
  setTimeout(recalculateAllTanks, 0);
    // Очищаем форму
    setStartTime('');
    setEndTime('');
    setManualDuration('');
    toast({
      title: "Сессия добавлена",
      description: `Длительность: ${duration.toFixed(2)}ч, Расход: ${fuel.toFixed(2)}л (2 л/ч)`,
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
                value={autoDuration !== null ? autoDuration.toFixed(2) : manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                disabled={autoDuration !== null}
              />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <span className="text-muted-foreground text-sm">Расход: {(autoDuration !== null ? autoDuration * 2 : (manualDuration ? parseFloat(manualDuration) * 2 : 0)).toFixed(2)} л (2 л/ч)</span>
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
                    editId === session.id && editSession ? (
                      <tr key={session.id} className="border-b bg-muted/40">
                        <td className="py-2">
                          <Input type="datetime-local" value={editSession.startDate}
                            onChange={e => handleEditChange('startDate', e.target.value)} />
                        </td>
                        <td className="py-2">
                          <Input type="datetime-local" value={editSession.endDate ?? ''}
                            onChange={e => handleEditChange('endDate', e.target.value)} />
                        </td>
                        <td className="py-2 font-medium">
                          <Input type="number" value={editSession.duration}
                            onChange={e => handleEditChange('duration', parseFloat(e.target.value) || 0)} /> ч
                        </td>
                        <td className="py-2 font-medium">
                          <Input type="number" value={editSession.fuelConsumed}
                            onChange={e => handleEditChange('fuelConsumed', parseFloat(e.target.value) || 0)} /> л
                        </td>
                        <td className="py-2 flex gap-2">
                          <Button size="sm" variant="success" onClick={saveEdit}>Сохранить</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Отмена</Button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={session.id} className="border-b">
                        <td className="py-2">
                          {new Date(session.startDate).toLocaleString('ru-RU')}
                        </td>
                        <td className="py-2">
                          {session.endDate ? new Date(session.endDate).toLocaleString('ru-RU') : '-'}
                        </td>
                        <td className="py-2 font-medium">{session.duration}ч</td>
                        <td className="py-2 font-medium">{session.fuelConsumed.toFixed(2)} л</td>
                        <td className="py-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(session)}>Редактировать</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteSession(session.id)}>Удалить</Button>
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
  );
};