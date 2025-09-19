import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Fuel, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  mainCapacity: number;
  refCapacity: number;
}

export const FuelTankManager = () => {
  const [tankStatus, setTankStatus] = useState<TankStatus>({
    main: 609, // Начальное значение из документа
    ref: 235,  // Начальное значение из документа
    mainCapacity: 1000,
    refCapacity: 300,
  });
  
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [transactionType, setTransactionType] = useState<'refuel' | 'consumption'>('refuel');
  const [amount, setAmount] = useState('');
  const [tankType, setTankType] = useState<'main' | 'ref'>('main');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

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

    // Обновляем уровень топлива в баках
    setTankStatus(prev => {
      const newStatus = { ...prev };
      
      if (transactionType === 'refuel') {
        if (tankType === 'main') {
          newStatus.main = Math.min(prev.main + amountValue, prev.mainCapacity);
        } else {
          newStatus.ref = Math.min(prev.ref + amountValue, prev.refCapacity);
        }
      } else {
        if (tankType === 'main') {
          newStatus.main = Math.max(prev.main - amountValue, 0);
        } else {
          newStatus.ref = Math.max(prev.ref - amountValue, 0);
        }
      }
      
      return newStatus;
    });

    setTransactions(prev => [newTransaction, ...prev]);
    
    // Очищаем форму
    setAmount('');
    setDescription('');
    
    toast({
      title: transactionType === 'refuel' ? "Заправка добавлена" : "Расход учтен",
      description: `${tankType === 'main' ? 'Основной бак' : 'Бак рефрижератора'}: ${transactionType === 'refuel' ? '+' : '-'}${amountValue} л`,
    });
  };

  const getMainTankPercentage = () => (tankStatus.main / tankStatus.mainCapacity) * 100;
  const getRefTankPercentage = () => (tankStatus.ref / tankStatus.refCapacity) * 100;
  
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
                <span>{getMainTankPercentage().toFixed(1)}%</span>
                <span>{tankStatus.mainCapacity} л</span>
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
                <span>{getRefTankPercentage().toFixed(1)}%</span>
                <span>{tankStatus.refCapacity} л</span>
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