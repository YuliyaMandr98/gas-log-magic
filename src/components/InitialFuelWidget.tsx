import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const LS_INITIAL_FUEL = 'initialFuelState';

export type InitialFuelState = {
    date: string;
    main: number;
    ref: number;
    cargoWeight?: number;
};

export default function InitialFuelWidget({ onChange }: { onChange?: (state: InitialFuelState | null) => void }) {
    const [editing, setEditing] = useState(false);
    const [state, setState] = useState<InitialFuelState | null>(null);
    const [form, setForm] = useState<InitialFuelState>({ date: '', main: 0, ref: 0, cargoWeight: 0 });

    // При переходе в режим редактирования — заполняем форму предыдущими значениями
    const startEdit = () => {
        if (state) setForm(state);
        setEditing(true);
    };

    useEffect(() => {
        const raw = localStorage.getItem(LS_INITIAL_FUEL);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                setState(parsed);
                if (onChange) onChange(parsed);
            } catch { }
        }
    }, []);

    const save = () => {
        localStorage.setItem(LS_INITIAL_FUEL, JSON.stringify(form));
        // Обновляем данные о грузе
        const cargoData = { currentWeight: form.cargoWeight || 0, operations: [] };
        localStorage.setItem('fuelCalc_cargo', JSON.stringify(cargoData));
        setState(form);
        setEditing(false);
        if (onChange) onChange(form);
        // Отправляем событие для обновления других компонентов
        window.dispatchEvent(new Event('storage'));
    };

    const remove = () => {
        localStorage.removeItem(LS_INITIAL_FUEL);
        // Также очищаем данные о грузе
        localStorage.setItem('fuelCalc_cargo', JSON.stringify({ currentWeight: 0, operations: [] }));
        setState(null);
        if (onChange) onChange(null);
        // Отправляем событие для обновления других компонентов
        window.dispatchEvent(new Event('storage'));
    };

    if (editing) {
        return (
            <Card className="p-2 text-xs max-w-xs">
                <CardContent>
                    <div>Дата получения машины:</div>
                    <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    <div>Топливо в основном баке (л):</div>
                    <Input type="number" value={form.main} onChange={e => setForm(f => ({ ...f, main: +e.target.value }))} />
                    <div>Топливо в баке рефрижератора (л):</div>
                    <Input type="number" value={form.ref} onChange={e => setForm(f => ({ ...f, ref: +e.target.value }))} />
                    <div>Вес груза при получении (кг):</div>
                    <Input type="number" value={form.cargoWeight || 0} onChange={e => setForm(f => ({ ...f, cargoWeight: +e.target.value }))} />
                    <Button onClick={save} className="mt-2 w-full">Сохранить</Button>
                </CardContent>
            </Card>
        );
    }

    if (!state) {
        return (
            <Card className="p-2 text-xs max-w-xs">
                <CardContent>
                    <div>Нет данных о получении машины</div>
                    <Button onClick={startEdit} className="mt-2 w-full">Добавить данные</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="p-2 text-xs max-w-xs bg-muted/50">
            <CardContent>
                <div>Дата получения машины: <b>{state.date}</b></div>
                <div>В основном баке было: <b>{state.main} л</b></div>
                <div>В баке рефрижератора было: <b>{state.ref} л</b></div>
                <div>Вес груза при получении: <b>{state.cargoWeight || 0} кг</b></div>
                <Button size="sm" variant="outline" className="mt-2 mr-2" onClick={startEdit}>Изменить</Button>
                <Button size="sm" variant="destructive" className="mt-2" onClick={remove}>Удалить</Button>
            </CardContent>
        </Card>
    );
}
