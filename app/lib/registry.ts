/**
 * Fetches graph_break_registry.json with edge-cache revalidation.
 * The URL is *not* hard-coded—set it with an env var:
 *
 *   NEXT_PUBLIC_REGISTRY_URL=https://raw.githubusercontent.com/pytorch/pytorch/main/tools/dynamo/graph_break_registry.json
 *
 * `REVALIDATE_SEC` controls the edge-cache TTL (default 300 s).
 */

const FALLBACK_URL =
  'https://raw.githubusercontent.com/pytorch/pytorch/main/torch/_dynamo/graph_break_registry.json';

export const REGISTRY_URL =
  process.env.NEXT_PUBLIC_REGISTRY_URL || FALLBACK_URL;

const TTL = parseInt(process.env.REVALIDATE_SEC ?? '300');

type Entry = {
  Gb_type: string;
  Context?: string;
  Explanation?: string;
  Hints: string[];
  Additional_Info?: string[];
};

export async function getRegistry() {
  const res = await fetch(REGISTRY_URL, { next: { revalidate: TTL } });
  if (!res.ok) throw new Error('Failed to fetch registry JSON');
  return res.json() as Promise<Record<string, Entry[]>>;
}
