import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InitialFuelState } from './InitialFuelWidget';

// Функция для форматирования даты в русском формате
const formatRussianDate = (dateString: string) => {
    const months = [
        'янв', 'фев', 'мар', 'апр', 'май', 'июн',
        'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
    ];

    // Если дата уже в русском формате, возвращаем как есть
    if (months.some(m => dateString.includes(`-${m}-`))) {
        return dateString;
    }

    // Обрабатываем формат дд.мм.гггг
    const ruMatch = dateString.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (ruMatch) {
        const [_, day, month, year] = ruMatch;
        const monthIndex = parseInt(month) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            return `${day.padStart(2, '0')}-${months[monthIndex]}-${year}`;
        }
    }

    // Обрабатываем другие форматы через Date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString;
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

// Универсальный парсер дат: поддерживает ISO, ru-RU (дд.мм.гггг), русский формат (дд-ммм-гггг)
function parseDateAny(dateStr: string): Date {
    if (!dateStr) return new Date('Invalid');

    // Русский формат: 23-сен-2025
    const ruMonths = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const ruMatch = dateStr.match(/(\d{1,2})-(\w{3})-(\d{4})/);
    if (ruMatch) {
        const [_, day, monthStr, year] = ruMatch;
        const monthIndex = ruMonths.indexOf(monthStr);
        if (monthIndex !== -1) {
            return new Date(parseInt(year), monthIndex, parseInt(day));
        }
    }

    // ISO формат
    if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);

    // ru-RU с временем: 23.09.2025, 12:34:56
    const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (match) {
        const [_, d, m, y] = match;
        const time = dateStr.split(',')[1]?.trim() || '00:00:00';
        return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${time}`);
    }

    return new Date(dateStr);
}

function inPeriod(date: string, from: Date, to: Date) {
    const d = parseDateAny(date);
    // Сравниваем только дату (без времени)
    const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    return dDay >= fromDay && dDay <= toDay;
}
const LS_REPORTS = 'fuelReports';



const LS_VIEW_REPORT = 'report_viewReport';
const Report = () => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [mainCurrent, setMainCurrent] = useState('');
    const [refCurrent, setRefCurrent] = useState('');
    const [initialFuel, setInitialFuel] = useState<InitialFuelState | null>(null);
    const [result, setResult] = useState<any>(null);
    const [dataVersion, setDataVersion] = useState(0);
    const [savedReports, setSavedReports] = useState<any[]>(() => {
        const saved = localStorage.getItem(LS_REPORTS);
        return saved ? JSON.parse(saved) : [];
    });
    const [viewReport, setViewReportState] = useState<any | null>(() => {
        const saved = localStorage.getItem(LS_VIEW_REPORT);
        return saved ? JSON.parse(saved) : null;
    });

    // Сохранять выбранный отчет в localStorage
    const setViewReport = (report: any | null) => {
        setViewReportState(report);
        if (report) {
            localStorage.setItem(LS_VIEW_REPORT, JSON.stringify(report));
        } else {
            localStorage.removeItem(LS_VIEW_REPORT);
        }
    };

    // Получаем начальные данные при монтировании
    React.useEffect(() => {
        const initialFuelData = localStorage.getItem('initialFuelState');
        if (initialFuelData) {
            try {
                const parsed = JSON.parse(initialFuelData);
                setInitialFuel(parsed);
            } catch { }
        }
    }, []);

    // Обновляем данные при монтировании компонента
    React.useEffect(() => {
        const interval = setInterval(() => {
            setDataVersion(prev => prev + 1);
        }, 1000); // Обновляем каждую секунду
        return () => clearInterval(interval);
    }, []);

    function saveReport() {
        if (!result) return;
        const newReports = [result, ...savedReports];
        setSavedReports(newReports);
        localStorage.setItem(LS_REPORTS, JSON.stringify(newReports));
    }

    function deleteReport(idx: number) {
        const newReports = savedReports.filter((_, i) => i !== idx);
        setSavedReports(newReports);
        localStorage.setItem(LS_REPORTS, JSON.stringify(newReports));
    }

    function getData() {
        const trips = JSON.parse(localStorage.getItem('fuelCalc_trips') || '[]');
        const refSessions = JSON.parse(localStorage.getItem('refrigeratorTracker_sessions') || '[]');
        const transactions = JSON.parse(localStorage.getItem('fuelTankManager_transactions') || '[]');
        const cargoOperations = JSON.parse(localStorage.getItem('fuelCalc_cargo') || '{"operations": []}').operations || [];
        return { trips, refSessions, transactions, cargoOperations };
    }

    function calculate() {
        if (!from || !to) return;
        const fromDate = new Date(from);
        const toDate = new Date(to);

        // Принудительно обновляем данные
        const { trips, refSessions, transactions, cargoOperations } = getData();

        // Отладочная информация
        console.log('Данные для отчета:', {
            trips: trips.length,
            refSessions: refSessions.length,
            transactions: transactions.length,
            cargoOperations: cargoOperations.length
        });

        const tripsInPeriod = trips.filter((t: any) => inPeriod(t.date, fromDate, toDate));
        const refInPeriod = refSessions.filter((s: any) => inPeriod(s.startDate, fromDate, toDate));
        const txInPeriod = transactions.filter((tx: any) => inPeriod(tx.date, fromDate, toDate));
        const cargoInPeriod = cargoOperations.filter((op: any) => inPeriod(op.date, fromDate, toDate));

        console.log('Данные в периоде:', {
            tripsInPeriod: tripsInPeriod.length,
            refInPeriod: refInPeriod.length,
            txInPeriod: txInPeriod.length,
            cargoInPeriod: cargoInPeriod.length,
            period: `${from} - ${to}`
        });

        const tripFact = tripsInPeriod.reduce((sum: number, t: any) => sum + (t.actualFuel ?? t.expectedFuel), 0);
        const tripKm = tripsInPeriod.reduce((sum: number, t: any) => sum + (t.distance || 0), 0);
        const refFact = refInPeriod.reduce((sum: number, s: any) => sum + s.fuelConsumed, 0);
        const totalFact = tripFact + refFact;
        let mainIn = 0, mainOut = 0, refIn = 0, refOut = 0;
        txInPeriod.forEach((tx: any) => {
            if (tx.tankType === 'main') {
                if (tx.type === 'refuel') mainIn += tx.amount;
                else mainOut += tx.amount;
            } else if (tx.tankType === 'ref') {
                if (tx.type === 'refuel') refIn += tx.amount;
                else refOut += tx.amount;
            }
        });

        // Учитываем начальные остатки, если есть
        const initialMain = initialFuel ? Number(initialFuel.main) : 0;
        const initialRef = initialFuel ? Number(initialFuel.ref) : 0;
        const mainCalc = initialMain + mainIn - mainOut - tripFact;
        const refCalc = initialRef + refIn - refOut - refFact;
        const mainCurrentNum = parseFloat(mainCurrent) || 0;
        const refCurrentNum = parseFloat(refCurrent) || 0;
        const mainDiff = mainCurrentNum - mainCalc;
        const refDiff = refCurrentNum - refCalc;

        setResult({
            trips: tripsInPeriod,
            refSessions: refInPeriod,
            transactions: txInPeriod,
            cargoOperations: cargoInPeriod,
            mainIn,
            mainOut,
            refIn,
            refOut,
            tripFact,
            tripKm,
            refFact,
            totalFact,
            mainCalc,
            refCalc,
            mainCurrent: mainCurrentNum,
            refCurrent: refCurrentNum,
            mainDiff,
            refDiff,
            from,
            to,
            date: new Date().toISOString(),
        });
    }

    return (
        <>
            <Card className="shadow-card mt-8">
                <CardHeader>
                    <CardTitle>Отчет за период</CardTitle>
                    {initialFuel && (
                        <div className="text-xs text-muted-foreground mt-1">Начальные остатки: {initialFuel.date} — основной бак: {initialFuel.main} л, реф: {initialFuel.ref} л</div>
                    )}
                </CardHeader>
                <CardContent>
                    {viewReport ? (
                        <>
                            <Button onClick={() => setViewReport(null)} variant="outline" className="mb-4">Назад к отчетам</Button>
                            <div><b>Период:</b> {viewReport.from} — {viewReport.to}</div>
                            <div><b>Общий километраж:</b> {viewReport.tripKm} км</div>
                            <div><b>Суммарный расход по поездкам <span style={{ textDecoration: 'underline' }}>должен быть</span>:</b> {viewReport.tripKm > 0 ? (viewReport.trips.reduce((sum: number, t: any) => sum + (t.expectedFuel || 0), 0)).toFixed(2) : '0.00'} л</div>
                            <div><b>Суммарный расход по рефрижератору <span style={{ textDecoration: 'underline' }}>должен быть</span>:</b> {viewReport.refSessions.reduce((sum: number, s: any) => sum + (s.duration ? s.duration * 2 : 0), 0).toFixed(2)} л</div>
                            <div><b>Общий расход (поездки + реф) <span style={{ textDecoration: 'underline' }}>должен быть</span>:</b> {viewReport.totalFact.toFixed(2)} л</div>
                            <div><b>По расчету должно быть в основном баке:</b> {viewReport.mainCalc.toFixed(2)} л</div>
                            <div><b>По расчету должно быть в баке рефрижератора:</b> {viewReport.refCalc.toFixed(2)} л</div>
                            <div><b>Фактически в основном баке:</b> {viewReport.mainCurrent.toFixed(2)} л</div>
                            <div><b>Фактически в баке рефрижератора:</b> {viewReport.refCurrent.toFixed(2)} л</div>
                            <div><b>Разница по основному баку:</b> {viewReport.mainDiff >= 0 ? (
                                <span>
                                    +{viewReport.mainDiff.toFixed(2)} л (<b style={{ color: 'green' }}>перелив</b>)
                                </span>
                            ) : (
                                <span>
                                    {viewReport.mainDiff.toFixed(2)} л (<b style={{ color: 'red' }}>недостача</b>)
                                </span>
                            )}
                            </div>
                            <div><b>Разница по баку рефрижератора:</b> {viewReport.refDiff >= 0 ? (
                                <span>
                                    +{viewReport.refDiff.toFixed(2)} л (<b style={{ color: 'green' }}>перелив</b>)
                                </span>
                            ) : (
                                <span>
                                    {viewReport.refDiff.toFixed(2)} л (<b style={{ color: 'red' }}>недостача</b>)
                                </span>
                            )}
                            </div>
                            {(() => {
                                const totalDiff = viewReport.mainDiff + viewReport.refDiff;
                                if (totalDiff > 0) {
                                    return <div><b>Общий перелив:</b> <span style={{ color: 'green' }}>+{totalDiff.toFixed(2)} л</span></div>;
                                } else if (totalDiff < 0) {
                                    return <div><b>Общий пережог:</b> <span style={{ color: 'red' }}>{totalDiff.toFixed(2)} л</span></div>;
                                } else {
                                    return <div><b>Общий пережог/перелив:</b> 0.00 л</div>;
                                }
                            })()}
                            <div><b>Все операции с топливом за период:</b>
                                <ul className="list-disc ml-6">
                                    <li>Заправка основной бак: {viewReport.mainIn.toFixed(2)} л</li>
                                    <li>Заправка рефрижератор: {viewReport.refIn.toFixed(2)} л</li>
                                </ul>
                            </div>
                            <div><b>Детализация поездок:</b>
                                <ul className="list-disc ml-6">
                                    {viewReport.trips.map((t: any) => {
                                        let details = `${t.date}: ${t.distance} км, `;
                                        let per100km = 0;
                                        if (t.distance && t.expectedFuel) {
                                            per100km = t.expectedFuel / t.distance * 100;
                                        }
                                        if (t.loadType === 'loaded') {
                                            // Ищем операцию загрузки для этой поездки
                                            const loadOperation = viewReport.cargoOperations?.find((op: any) =>
                                                op.type === 'load' && op.date === t.date
                                            );
                                            const weight = loadOperation?.weight || t.weight || 0;
                                            details += `груз ${weight} кг, коэф. ${t.coefficient}, `;
                                        } else if (t.loadType === 'head') {
                                            details += 'голова (без прицепа), ';
                                        } else {
                                            details += 'пустой, ';
                                        }
                                        details += `расход ${(t.actualFuel ?? t.expectedFuel).toFixed(2)} л, `;
                                        details += `норма: ${per100km.toFixed(2)} л/100км`;
                                        return <li key={t.id}>{details}</li>;
                                    })}
                                </ul>
                            </div>
                            <div><b>Детализация работы рефрижератора:</b>
                                <ul className="list-disc ml-6">
                                    {viewReport.refSessions.map((s: any) => (
                                        <li key={s.id}>{s.startDate}: {s.duration} ч, расход {s.fuelConsumed} л</li>
                                    ))}
                                </ul>
                            </div>
                            {viewReport.cargoOperations && viewReport.cargoOperations.length > 0 && (
                                <div><b>Операции с грузом:</b>
                                    <ul className="list-disc ml-6">
                                        {viewReport.cargoOperations.map((op: any) => (
                                            <li key={op.id}>
                                                {op.date}: {op.type === 'load' ? 'Загрузка' : 'Выгрузка'} {op.weight} кг
                                                {op.description && ` (${op.description})`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label>С даты</Label>
                                    <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
                                </div>
                                <div>
                                    <Label>По дату</Label>
                                    <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
                                </div>
                                <div>
                                    <Label>Текущее топливо в основном баке (л)</Label>
                                    <Input type="number" value={mainCurrent} onChange={e => setMainCurrent(e.target.value)} placeholder="0" />
                                </div>
                                <div>
                                    <Label>Текущее топливо в баке рефрижератора (л)</Label>
                                    <Input type="number" value={refCurrent} onChange={e => setRefCurrent(e.target.value)} placeholder="0" />
                                </div>
                                <Button onClick={calculate} className="self-end">Сформировать отчет</Button>
                            </div>
                            {result && (
                                <>
                                    <Button onClick={saveReport} variant="success">Сохранить отчет</Button>
                                    <div><b>Период:</b> {result.from} — {result.to}</div>
                                    <div><b>Общий километраж:</b> {result.tripKm} км</div>
                                    <div><b>Суммарный расход по поездкам:</b> {result.tripFact.toFixed(2)} л</div>
                                    <div><b>Суммарный расход по рефрижератору:</b> {result.refFact.toFixed(2)} л</div>
                                    <div><b>Общий расход (поездки + реф):</b> {result.totalFact.toFixed(2)} л</div>
                                    <div><b>По расчету должно быть в основном баке:</b> {result.mainCalc.toFixed(2)} л</div>
                                    <div><b>По расчету должно быть в баке рефрижератора:</b> {result.refCalc.toFixed(2)} л</div>
                                    <div><b>Фактически в основном баке:</b> {result.mainCurrent.toFixed(2)} л</div>
                                    <div><b>Фактически в баке рефрижератора:</b> {result.refCurrent.toFixed(2)} л</div>
                                    <div><b>Разница по основному баку:</b> {result.mainDiff >= 0 ? `+${result.mainDiff.toFixed(2)} л (перелив)` : `${result.mainDiff.toFixed(2)} л (недостача)`}</div>
                                    <div><b>Разница по баку рефрижератора:</b> {result.refDiff >= 0 ? `+${result.refDiff.toFixed(2)} л (перелив)` : `${result.refDiff.toFixed(2)} л (недостача)`}</div>
                                    <div><b>Все операции с топливом за период:</b>
                                        <ul className="list-disc ml-6">
                                            <li>Заправка основной бак: {result.mainIn.toFixed(2)} л</li>
                                            <li>Списание основной бак: {result.mainOut.toFixed(2)} л</li>
                                            <li>Заправка рефрижератор: {result.refIn.toFixed(2)} л</li>
                                            <li>Списание рефрижератор: {result.refOut.toFixed(2)} л</li>
                                        </ul>
                                    </div>
                                    <div><b>Детализация поездок:</b>
                                        <ul className="list-disc ml-6">
                                            {result.trips.map((t: any) => (
                                                <li key={t.id}>{t.date}: {t.distance} км, расход {(t.actualFuel ?? t.expectedFuel).toFixed(2)} л</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div><b>Детализация работы рефрижератора:</b>
                                        <ul className="list-disc ml-6">
                                            {result.refSessions.map((s: any) => (
                                                <li key={s.id}>{s.startDate}: {s.duration} ч, расход {s.fuelConsumed} л</li>
                                            ))}
                                        </ul>
                                    </div>
                                    {result.cargoOperations && result.cargoOperations.length > 0 && (
                                        <div><b>Операции с грузом:</b>
                                            <ul className="list-disc ml-6">
                                                {result.cargoOperations.map((op: any) => (
                                                    <li key={op.id}>
                                                        {op.date}: {op.type === 'load' ? 'Загрузка' : 'Выгрузка'} {op.weight} кг
                                                        {op.description && ` (${op.description})`}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}
                            {savedReports.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="font-bold mb-2">Сохраненные отчеты</h3>
                                    <ul className="space-y-2">
                                        {savedReports.map((r, idx) => (
                                            <li key={r.date} className="border rounded p-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition"
                                                onClick={() => setViewReport(r)}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <b>Период:</b> {r.from} — {r.to} | <b>Км:</b> {r.tripKm} | <b>Расход:</b> {r.totalFact.toFixed(2)} л | <b>Недостача/перелив (бак):</b> {r.mainDiff.toFixed(2)} л | <b>Недостача/перелив (реф):</b> {r.refDiff.toFixed(2)} л
                                                    </div>
                                                    <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); deleteReport(idx); }}>Удалить</Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </>
    );
};

export default Report;
