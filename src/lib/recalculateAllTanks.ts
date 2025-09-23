// Универсальный пересчет баков по всем данным
export function recalculateAllTanks() {
    const LS_TANK_STATUS = 'fuelTankManager_status';
    const trips = JSON.parse(localStorage.getItem('fuelCalc_trips') || '[]');
    const refSessions = JSON.parse(localStorage.getItem('refrigeratorTracker_sessions') || '[]');
    const transactions = JSON.parse(localStorage.getItem('fuelTankManager_transactions') || '[]');

    // Начальные остатки всегда учитываются
    let main = 0;
    let ref = 0;
    try {
        const raw = localStorage.getItem('initialFuelState');
        if (raw) {
            const parsed = JSON.parse(raw);
            main = Number(parsed.main) || 0;
            ref = Number(parsed.ref) || 0;
        }
    } catch { }

    // Сначала все заправки/расходы
    for (const tx of transactions) {
        if (tx.type === 'refuel') {
            if (tx.tankType === 'main') main += tx.amount;
            else ref += tx.amount;
        } else {
            if (tx.tankType === 'main') main -= tx.amount;
            else ref -= tx.amount;
        }
    }


    // Минус все поездки (факт если есть, иначе расчет) — только из основного бака
    for (const t of trips) {
        main -= t.actualFuel ?? t.expectedFuel;
    }

    // Минус все сессии рефа — только из бака рефа
    for (const s of refSessions) {
        ref -= s.fuelConsumed;
    }

    // main и ref могут быть отрицательными, если перерасход
    localStorage.setItem(LS_TANK_STATUS, JSON.stringify({ main, ref }));
}
