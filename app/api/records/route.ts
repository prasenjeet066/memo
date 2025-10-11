// app/api/records/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/security/auth/auth.config';
import { RecordService } from '@/lib/services/record.service';

/**
 * GET /api/records
 * Get paginated records with filters
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const status = searchParams.get('status');

    let records;

    // Handle different filter types
    switch (filter) {
      case 'trending':
        records = await RecordService.getTrendingRecords(limit);
        return NextResponse.json({
          records,
          pagination: {
            page: 1,
            limit,
            total: records.length,
            totalPages: 1,
          },
        });

      case 'recent':
        records = await RecordService.getRecentlyUpdated(limit);
        return NextResponse.json({
          records,
          pagination: {
            page: 1,
            limit,
            total: records.length,
            totalPages: 1,
          },
        });

      case 'featured':
        records = await RecordService.getFeaturedRecords(limit);
        return NextResponse.json({
          records,
          pagination: {
            page: 1,
            limit,
            total: records.length,
            totalPages: 1,
          },
        });

      default:
        // Regular paginated results with filters
        const filters: any = {};
        if (search) filters.search = search;
        if (category) filters.category = category;
        if (tag) filters.tag = tag;
        if (status) filters.status = status;

        const result = await RecordService.getPaginatedRecords(page, limit, filters);
        return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Get records error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/records
 * Create a new record
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const result = await RecordService.createRecord(
      body,
      session.user.id,
      session.user.username
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.record, { status: 201 });
  } catch (error) {
    console.error('Create record error:', error);
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    );
  }
}