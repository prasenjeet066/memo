import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { eventFlow } from '@/lib/workflow';
import { RecordService } from '@/lib/services/record.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const slug = params.slug;
    
    // Validate slug
    if (!slug || slug.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Invalid article slug' },
        { status: 400 }
      );
    }

    // Get the article
    const article = await RecordService.getRecordBySlug(slug, false);
    
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to publish
    if (article.createdBy !== session.user.id) {
      // TODO: Add role-based permission check for admins/editors
      return NextResponse.json(
        { success: false, error: 'You do not have permission to publish this article' },
        { status: 403 }
      );
    }

    // Check if article is in draft status
    if (article.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: `Article is already ${article.status}` },
        { status: 400 }
      );
    }

    // Trigger the publishing workflow
    console.log(`🚀 Starting publishing workflow for article: ${slug}`);
    
    const workflowResults = await eventFlow.send('article.publish.requested', {
      articleId: article.id,
      slug: article.slug,
      title: article.title,
      content: article.content,
      userId: session.user.id,
      username: session.user.username,
    });

    // Check workflow results
    const hasErrors = workflowResults.some(result => result.error);
    
    if (hasErrors) {
      return NextResponse.json(
        {
          success: false,
          error: 'Publishing workflow encountered errors',
          details: workflowResults.filter(r => r.error).map(r => ({
            function: r.functionId,
            error: r.error?.message
          }))
        },
        { status: 500 }
      );
    }

    // Get the final result from the workflow
    const publishResult = workflowResults.find(
      r => r.functionId === 'publish-article-workflow'
    );

    return NextResponse.json({
      success: true,
      message: 'Article published successfully',
      data: publishResult?.result || {},
    });

  } catch (error: any) {
    console.error('❌ Article publishing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to publish article',
        message: error.message
      },
      { status: 500 }
    );
  }
}