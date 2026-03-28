import { NextResponse } from 'next/server';
import { deleteAuthCookie } from '@/lib/auth';

export async function POST() {
  await deleteAuthCookie();
  return NextResponse.json({ success: true });
}
