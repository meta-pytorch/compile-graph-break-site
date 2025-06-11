import { getRegistry } from '@/app/lib/registry';
import { NextResponse } from 'next/server';

export async function GET() {
  const registry = await getRegistry();
  return NextResponse.json(registry);
}
