import { NextRequest, NextResponse } from 'next/server';
import { scrapeDarwinexStats } from '@/lib/darwinex-scraper';

/**
 * API Route to fetch Darwinex trading statistics
 * GET /api/darwinex-stats?code=WLE
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const darwinCode = searchParams.get('code');

    if (!darwinCode) {
      return NextResponse.json(
        { error: 'Missing required parameter: code' },
        { status: 400 }
      );
    }

    // Validate DARWIN code format (typically 3 uppercase letters)
    if (!/^[A-Z]{3}$/.test(darwinCode)) {
      return NextResponse.json(
        { error: 'Invalid DARWIN code format. Expected 3 uppercase letters.' },
        { status: 400 }
      );
    }

    const stats = await scrapeDarwinexStats(darwinCode);

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching Darwinex stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Darwinex statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
