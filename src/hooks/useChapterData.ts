import { useEffect, useState } from 'react';
import { watchBrothers } from '../data/brothers';
import { watchPnms } from '../data/pnms';
import type { Brother, Pnm } from '../types/models';

/**
 * One shared subscription to the two collections the whole app reads.
 *
 * A rush class is a few hundred PNMs at most, so the list is held in memory
 * and every search/filter runs client-side. That keeps filtering instant and
 * avoids a composite index per filter combination. If a chapter ever outgrows
 * this, the queries in data/pnms.ts are where paging would go.
 */
export function useChapterData() {
  const [pnms, setPnms] = useState<Pnm[]>([]);
  const [brothers, setBrothers] = useState<Brother[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubPnms = watchPnms(
      (next) => {
        setPnms(next);
        setLoading(false);
      },
      () => {
        setError('Could not load PNMs. Check your access with exec.');
        setLoading(false);
      },
    );
    const unsubBrothers = watchBrothers(setBrothers);
    return () => {
      unsubPnms();
      unsubBrothers();
    };
  }, []);

  return { pnms, brothers, loading, error };
}
