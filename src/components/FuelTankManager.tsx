import React, { useState, useEffect, useCallback } from 'react';
import { recalculateAllTanks } from '@/lib/recalculateAllTanks';

// Типы для транзакций и статуса баков
interface FuelTransaction {
  id: string;
  type: 'refuel' | 'consumption';
  amount: number;
  tankType: 'main' | 'ref';
  date: string;
  description?: string;
}

interface TankStatus {
  main: number;
  ref: number;
}


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Fuel, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Функция для форматирования даты в русском формате
const formatRussianDate = (date: Date) => {
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

export const FuelTankManager = () => {

  const { toast } = useToast();
  // --- capacities ---
  const MAIN_CAPACITY = 1000;
  const REF_CAPACITY = 300;
  // --- localStorage keys ---
  const LS_TANK_STATUS = 'fuelTankManager_status';
  const LS_TRANSACTIONS = 'fuelTankManager_transactions';
  const LS_FORM = 'fuelTankManager_form';

  const [tankStatus, setTankStatus] = useState<TankStatus>(() => {
    const saved = localStorage.getItem(LS_TANK_STATUS);
    return saved ? JSON.parse(saved) : {
      main: 0,
      ref: 0,
    };
  });
  const [transactions, setTransactions] = useState<FuelTransaction[]>(() => {
    const saved = localStorage.getItem(LS_TRANSACTIONS);
    return saved ? JSON.parse(saved) : [];
  });
  const [transactionType, setTransactionType] = useState<'refuel' | 'consumption'>(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).transactionType || 'refuel' : 'refuel';
  });
  const [amount, setAmount] = useState(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).amount || '' : '';
  });
  const [tankType, setTankType] = useState<'main' | 'ref'>(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).tankType || 'main' : 'main';
  });
  const [description, setDescription] = useState(() => {
    const saved = localStorage.getItem(LS_FORM);
    return saved ? JSON.parse(saved).description || '' : '';
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editTx, setEditTx] = useState<FuelTransaction | null>(null);


  // --- синхронизация tankStatus с localStorage после любого изменения ---
  const syncTankStatus = () => {
    const raw = localStorage.getItem(LS_TANK_STATUS);
    if (raw) setTankStatus(JSON.parse(raw));
  };

  const startEdit = (tx: FuelTransaction) => {
    setEditId(tx.id);
    setEditTx({ ...tx });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTx(null);
  };

  const saveEdit = () => {
    if (!editTx) return;
    const newTxs = transactions.map(tx => tx.id === editTx.id ? editTx : tx);
  setTransactions(newTxs);
    setEditId(null);
    setEditTx(null);
    toast({ title: 'Операция обновлена' });
  };

  const deleteTx = (id: string) => {
    const newTxs = transactions.filter(t => t.id !== id);
  setTransactions(newTxs);
    toast({ title: 'Операция удалена' });
  };

  // --- save tankStatus to localStorage ---
  React.useEffect(() => {
    localStorage.setItem(LS_TANK_STATUS, JSON.stringify(tankStatus));
  }, [tankStatus]);

  // --- save transactions to localStorage и пересчёт бака ---
  React.useEffect(() => {
    localStorage.setItem(LS_TRANSACTIONS, JSON.stringify(transactions));
    recalculateAllTanks();
    setTimeout(syncTankStatus, 0);
  }, [transactions]);

  // --- save form to localStorage ---
  React.useEffect(() => {
    localStorage.setItem(
      LS_FORM,
      JSON.stringify({ transactionType, amount, tankType, description })
    );
  }, [transactionType, amount, tankType, description]);

  const addTransaction = () => {
    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите корректное количество топлива",
        variant: "destructive",
      });
      return;
    }
    const newTransaction: FuelTransaction = {
      id: Date.now().toString(),
      type: transactionType,
      amount: amountValue,
      tankType,
      date: new Date().toLocaleString('ru-RU'),
      description: description.trim() || undefined,
    };
    const newTxs = [newTransaction, ...transactions];
    setTransactions(newTxs);
    recalculateAllTanks();
    setTimeout(syncTankStatus, 0);
    setAmount('');
    setDescription('');
    toast({
      title: transactionType === 'refuel' ? "Заправка добавлена" : "Расход учтен",
      description: `${tankType === 'main' ? 'Основной бак' : 'Бак рефрижератора'}: ${transactionType === 'refuel' ? '+' : '-'}${amountValue} л`,
    });
  };

  const getMainTankPercentage = () => (tankStatus.main / MAIN_CAPACITY) * 100;
  const getRefTankPercentage = () => (tankStatus.ref / REF_CAPACITY) * 100;
  
  const getTankStatusColor = (percentage: number) => {
    if (percentage <= 20) return 'text-destructive';
    if (percentage <= 40) return 'text-warning';
    return 'text-success';
  };

  const getTankStatusVariant = (percentage: number) => {
    if (percentage <= 20) return 'destructive';
    if (percentage <= 40) return 'warning';
    return 'success';
  };

  return (
    <div className="space-y-6">
      {/* Текущий уровень топлива */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-primary" />
              Основной бак
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Уровень топлива</span>
                <span className={`text-2xl font-bold ${getTankStatusColor(getMainTankPercentage())}`}>
                  {tankStatus.main.toFixed(1)} л
                </span>
              </div>
              <Progress value={getMainTankPercentage()} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 л</span>
              </div>
            </div>
            
            {getMainTankPercentage() <= 20 && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">Низкий уровень топлива!</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-secondary" />
              Бак рефрижератора
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Уровень топлива</span>
                <span className={`text-2xl font-bold ${getTankStatusColor(getRefTankPercentage())}`}>
                  {tankStatus.ref.toFixed(1)} л
                </span>
              </div>
              <Progress value={getRefTankPercentage()} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 л</span>
              </div>
            </div>
            
            {getRefTankPercentage() <= 20 && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">Низкий уровень топлива!</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Форма для добавления транзакций */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Учет топлива</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="transactionType">Тип операции</Label>
              <Select value={transactionType} onValueChange={(value: 'refuel' | 'consumption') => setTransactionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="refuel">Заправка</SelectItem>
                  <SelectItem value="consumption">Расход</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tankType">Тип бака</Label>
              <Select value={tankType} onValueChange={(value: 'main' | 'ref') => setTankType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Основной бак</SelectItem>
                  <SelectItem value="ref">Бак рефрижератора</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Количество (л)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Литры"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание (опционально)</Label>
            <Input
              id="description"
              placeholder="Заправка на АЗС, расход на поездку и т.д."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button onClick={addTransaction} className="w-full" variant="transport">
            {transactionType === 'refuel' ? (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Добавить заправку
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 mr-2" />
                Учесть расход
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* История операций */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>История операций с топливом</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Операции не добавлены
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Дата</th>
                    <th className="text-left py-2">Тип</th>
                    <th className="text-left py-2">Бак</th>
                    <th className="text-left py-2">Количество</th>
                    <th className="text-left py-2">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    editId === transaction.id && editTx ? (
                      <tr key={transaction.id} className="border-b bg-muted/40">
                        <td className="py-2">{transaction.date}</td>
                        <td className="py-2">
                          <Select value={editTx.type} onValueChange={v => setEditTx(e => e ? { ...e, type: v as any } : e)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="refuel">Заправка</SelectItem>
                              <SelectItem value="consumption">Расход</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2">
                          <Select value={editTx.tankType} onValueChange={v => setEditTx(e => e ? { ...e, tankType: v as any } : e)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="main">Основной</SelectItem>
                              <SelectItem value="ref">Рефрижератор</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 font-medium">
                          <Input type="number" value={editTx.amount}
                            onChange={e => setEditTx(et => et ? { ...et, amount: parseFloat(e.target.value) || 0 } : et)} />
                        </td>
                        <td className="py-2">
                          <Input value={editTx.description ?? ''}
                            onChange={e => setEditTx(et => et ? { ...et, description: e.target.value } : et)} />
                        </td>
                        <td className="py-2 flex gap-2">
                          <Button size="sm" variant="success" onClick={saveEdit}>Сохранить</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Отмена</Button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-2">{transaction.date}</td>
                        <td className="py-2">
                          <Badge variant={transaction.type === 'refuel' ? 'success' : 'secondary'}>
                            <div className="flex items-center gap-1">
                              {transaction.type === 'refuel' ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {transaction.type === 'refuel' ? 'Заправка' : 'Расход'}
                            </div>
                          </Badge>
                        </td>
                        <td className="py-2">
                          {transaction.tankType === 'main' ? 'Основной' : 'Рефрижератор'}
                        </td>
                        <td className="py-2 font-medium">
                          <span className={transaction.type === 'refuel' ? 'text-success' : 'text-warning'}>
                            {transaction.type === 'refuel' ? '+' : '-'}{transaction.amount} л
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {transaction.description || '-'}
                        </td>
                        <td className="py-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(transaction)}>Редактировать</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteTx(transaction.id)}>Удалить</Button>
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
