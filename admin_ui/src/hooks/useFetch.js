import { useState, useEffect } from 'react';

export function useFetch(fetcher, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then(d  => { if (!cancelled) { setData(d);               setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message || 'Failed to load data'); setLoading(false); } });
    return () => { cancelled = true; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}
