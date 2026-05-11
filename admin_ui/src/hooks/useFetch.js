import { useState, useEffect, useRef, useCallback } from 'react';

export const AUTO_REFRESH_INTERVAL = 15_000;

export function useFetch(fetcher, deps = [], { interval } = {}) {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef                   = useRef(null);
  const fetcherRef                    = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    return fetcherRef.current()
      .then(d  => { setData(d); setLastUpdated(Date.now()); if (!silent) setLoading(false); })
      .catch(e => { if (!silent) { setError(e.message || 'Failed to load data'); setLoading(false); } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) run(false);

    if (interval) {
      intervalRef.current = setInterval(() => { if (!cancelled) run(true); }, interval);
    }

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, lastUpdated };
}
