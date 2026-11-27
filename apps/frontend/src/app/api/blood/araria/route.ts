import { NextRequest, NextResponse } from 'next/server';
import type { EraktkoshDistrictData } from '@/lib/blood-availability';
import { fetchLiveArariaAvailability } from '@/lib/eraktkosh-live';

export const dynamic = 'force-dynamic';

const MAX_BACKEND_AGE_MS = 30 * 60 * 1000; // Treat backend snapshots older than 30 min as needing live refresh

async function tryBackendAraria(
  forceRefresh: boolean
): Promise<EraktkoshDistrictData | null> {
  const backendBase = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!backendBase) return null;

  try {
    const base = backendBase.replace(/\/+$/, '');
    const url = forceRefresh ? `${base}/blood/araria?refresh=1` : `${base}/blood/araria`;
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(forceRefresh ? 8_000 : 2_500),
    });

    if (!response.ok) return null;
    const json = (await response.json()) as {
      data?: EraktkoshDistrictData;
    } & Partial<EraktkoshDistrictData>;
    const payload = json?.data ?? (Array.isArray(json?.centers) ? (json as EraktkoshDistrictData) : null);
    if (!payload || !Array.isArray(payload.centers) || payload.centers.length === 0) {
      return null;
    }

    // If backend snapshot is missing `asOf` or older than 30 minutes, fall back to direct live e-RaktKosh fetch
    if (!payload.asOf) return null;
    const ageMs = Date.now() - new Date(payload.asOf).getTime();
    if (!Number.isFinite(ageMs) || ageMs > MAX_BACKEND_AGE_MS) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const refreshParam = request.nextUrl.searchParams.get('refresh');
  const forceRefresh = refreshParam === '1' || refreshParam === 'true';

  try {
    // 1. Prefer fresh backend snapshot if NestJS + Postgres backend is running and current
    const backendData = await tryBackendAraria(forceRefresh);
    if (backendData) {
      return NextResponse.json(
        { success: true, data: backendData, source: 'backend' },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 2. Otherwise fetch live current data directly from official MoHFW e-RaktKosh
    const liveData = await fetchLiveArariaAvailability({ forceRefresh });
    return NextResponse.json(
      { success: true, data: liveData, source: 'eraktkosh-live' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to reach e-RaktKosh blood availability feed';
    return NextResponse.json(
      { success: false, error: { code: 'ERAKTKOSH_UNAVAILABLE', message } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
