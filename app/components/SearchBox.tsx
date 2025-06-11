'use client';

import { useEffect, useState } from 'react';
import Fuse from 'fuse.js';

type Entry = {
  id: string;
  Gb_type: string;
  Explanation?: string;
  Context?: string;
};

export function useFuzzyRegistrySearch(query: string) {
  const [results, setResults] = useState<Entry[]>([]);

  useEffect(() => {
    async function search() {
      const res = await fetch('/api/registry');
      const registry = await res.json();

      const data = Object.entries(registry).map(([id, entries]: [string, any]) => ({
        id,
        ...entries[0],
      }));

      if (!query) {
        setResults(data);
        return;
      }

      const fuse = new Fuse(data, {
        keys: ['id', 'Gb_type', 'Explanation', 'Context'],
        threshold: 0.3,
      });

      const matches = fuse.search(query).map(res => res.item);
      setResults(matches);
    }

    search();
  }, [query]);

  return results;
}
