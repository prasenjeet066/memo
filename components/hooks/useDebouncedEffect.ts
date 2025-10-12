import { useEffect } from 'react';

export function useDebouncedEffect(fn: () => void, delay: number, deps: any[]) {
  useEffect(() => {
    const t = setTimeout(fn, delay);
    return () => clearTimeout(t);
  }, deps);
}