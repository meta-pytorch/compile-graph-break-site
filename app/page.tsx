'use client';

import * as React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useFuzzyRegistrySearch } from '@/app/components/SearchBox';

export default function Home() {
  const [query, setQuery] = React.useState('');
  const results = useFuzzyRegistrySearch(query);

  return (
    <main className="prose mx-auto p-6">
      <h1>Graph-Break Registry</h1>
      <p className="text-sm text-gray-500 mb-4">
        Below are all known graph breaks detected by&nbsp;Dynamo.
      </p>

      <input
        type="text"
        placeholder="Search Graph Breaks"
        className="px-3 py-2 border border-gray-300 rounded w-full max-w-xl mb-4"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <ul>
        {results.map(({ id, Gb_type }) => (
          <li key={id}>
            <Link href={`/gb/${id}`}>{id}</Link> —{' '}
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <>{props.children}</>,
                a: ({ node, ...props }) => (
                  <a target="_blank" rel="noopener noreferrer" {...props} />
                ),
              }}
            >
              {Gb_type}
            </ReactMarkdown>
          </li>
        ))}
      </ul>
    </main>
  );
}
