import { getRegistry } from '@/app/lib/registry';
import ReactMarkdown from 'react-markdown';
import * as React from 'react';

export const dynamicParams = true;
export const revalidate = 0;

function SectionHeader({
  label,
  sub,
}: {
  label: string;
  sub: string;
}) {
  return (
    <p className="font-bold">
      {label}{' '}
      <span className="italic font-normal text-sm text-gray-500">— {sub}</span>
    </p>
  );
}

export default async function GBPage({
  params,
}: {
  params: { gbid: string };
}) {
  const registry = await getRegistry();
  const id = params.gbid.toUpperCase();
  const entry = registry[id]?.[0];

  if (!entry) {
    return (
      <main className="prose mx-auto p-6">
        <h1>GBID {id} not found</h1>
      </main>
    );
  }

  return (
    <main className="prose mx-auto p-6">
      <h1>{id}</h1>

      <SectionHeader
        label="Graph-Break Type"
        sub="short name describing what triggered the graph break"
      />
      <ReactMarkdown>{entry.Gb_type}</ReactMarkdown>

      <SectionHeader
        label="Context"
        sub="values or code snippet captured at the break point"
      />
      {entry.Context ? (
        <pre>{entry.Context}</pre>
      ) : (
        <p className="italic text-gray-500">No context provided.</p>
      )}

      <SectionHeader
        label="Explanation"
        sub="why this specific graph break happened"
      />
      {entry.Explanation ? (
        <ReactMarkdown>{entry.Explanation}</ReactMarkdown>
      ) : (
        <p className="italic text-gray-500">No explanation provided.</p>
      )}

      <SectionHeader
        label="Hints"
        sub="suggestions for fixing or working around the break"
      />
      {entry.Hints?.length ? (
        <ul>
          {entry.Hints.map((h) => (
            <li key={h}>
              <ReactMarkdown components={{ p: React.Fragment }}>
                {h}
              </ReactMarkdown>
            </li>
          ))}
        </ul>
      ) : (
        <p className="italic text-gray-500">No hints provided.</p>
      )}
    </main>
  );
}
