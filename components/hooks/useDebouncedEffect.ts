import { useEffect } from 'react';

export function useDebouncedEffect(fn: () => void, delay: number, deps: React.DependencyList) {
  useEffect(() => {
    const timer = setTimeout(fn, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}