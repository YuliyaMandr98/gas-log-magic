import { useEffect, useState } from 'react';

export function useInitialFuel() {
  const [initialFuel, setInitialFuel] = useState<{ main: number; ref: number }>({ main: 0, ref: 0 });
  useEffect(() => {
    const raw = localStorage.getItem('initialFuelState');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setInitialFuel({ main: Number(parsed.main) || 0, ref: Number(parsed.ref) || 0 });
      } catch {}
    }
  }, []);
  return initialFuel;
}
