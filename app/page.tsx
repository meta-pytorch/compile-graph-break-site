import * as React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { getRegistry } from '@/app/lib/registry';

export const revalidate = 0;

export default async function Home() {
  const reg = await getRegistry();

  return (
    <main className="prose mx-auto p-6">
      <h1>Graph-Break Registry</h1>
      <p className="text-sm text-gray-500 mb-4">
        Below are all known graph breaks detected by&nbsp;Dynamo.
      </p>

      <ul>
        {Object.entries(reg).map(([id, versions]) => {
          const type = versions[0].Gb_type;
          return (
            <li key={id}>
              <Link href={`/gb/${id}`}>{id}</Link> —{' '}
              <ReactMarkdown
                components={{
                  // strip the implicit <p> wrapper inside <li>
                  p: ({ node, ...props }) => <>{props.children}</>,
                  // open any inline links in a new tab
                  a: ({ node, ...props }) => (
                    <a target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                }}
              >
                {type}
              </ReactMarkdown>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
