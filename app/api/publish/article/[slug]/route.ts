import { NextRequest, NextResponse } from 'next/server';
import { eventFlow } from '@/lib/workflow';

// Mock session data for testing
const mockSession = {
  user: {
    id: 'user_12345',
    username: 'testuser',
    email: 'test@example.com',
    role: 'author'
  }
};

// Mock article data
const mockArticles = {
  'test-article': {
    id: 'article_12345',
    slug: 'test-article',
    title: 'Test Article Title',
    content: `
      <html>
        <head>
          <title>Test Article</title>
          <script>console.log('test script')</script>
        </head>
        <body>
          <h1>Welcome to My Test Article</h1>
          <p>This is a test article content with some <strong>bold text</strong> and <em>italic text</em>.</p>
          <p>Artificail intelligence is revolutonizing the world with inovative solutions.</p>
          <img src="/test-image.jpg" alt="Test image">
          <p>Some content that might need review for quality and safety.</p>
        </body>
      </html>
    `,
    status: 'DRAFT',
    createdBy: 'user_12345',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'published-article': {
    id: 'article_67890',
    slug: 'published-article',
    title: 'Already Published Article',
    content: '<p>This article is already published</p>',
    status: 'PUBLISHED',
    createdBy: 'user_12345',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'other-user-article': {
    id: 'article_99999',
    slug: 'other-user-article',
    title: 'Other User Article',
    content: '<p>This belongs to another user</p>',
    status: 'DRAFT',
    createdBy: 'user_99999', // Different user
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

// Mock RecordService
const MockRecordService = {
  getRecordBySlug: async (slug: string, includeDrafts: boolean = false) => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB delay
    
    const article = mockArticles[slug as keyof typeof mockArticles];
    
    if (!article) {
      return null;
    }
    
    // If not including drafts and article is draft, return null
    if (!includeDrafts && article.status === 'DRAFT') {
      return null;
    }
    
    return article;
  }
};

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Use mock session instead of real auth
    const session = mockSession;
    
    // For demo purposes, you can optionally still check for auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader && process.env.NODE_ENV === 'production') {
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

    // Get the article using mock service
    const article = await MockRecordService.getRecordBySlug(slug, true); // Include drafts
    
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to publish
    if (article.createdBy !== session.user.id) {
      // For demo, allow admin role to publish any article
      if (session.user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to publish this article' },
          { status: 403 }
        );
      }
    }

    // Check if article is in draft status
    if (article.status !== 'DRAFT') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Article is already ${article.status.toLowerCase()}`,
          currentStatus: article.status
        },
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
      htmlContent: article.content, // Added for AI processing
      author: session.user.username,
      userId: session.user.id,
      category: 'technology', // Default category
      timestamp: new Date().toISOString()
    });

    // Check workflow results
    const hasErrors = workflowResults.some(result => result.error);
    
    if (hasErrors) {
      const errors = workflowResults.filter(r => r.error).map(r => ({
        function: r.functionId,
        error: r.error?.message
      }));
      
      console.error('❌ Publishing workflow errors:', errors);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Publishing workflow encountered errors',
          details: errors
        },
        { status: 500 }
      );
    }

    // Get the final result from the workflow
    const publishResult = workflowResults[workflowResults.length - 1]; // Last result

    return NextResponse.json({
      success: true,
      message: 'Article published successfully',
      data: {
        articleId: article.id,
        slug: article.slug,
        title: article.title,
        publishedAt: new Date().toISOString(),
        workflow: {
          steps: workflowResults.length,
          results: publishResult?.result || {}
        }
      },
    });

  } catch (error: any) {
    console.error('❌ Article publishing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to publish article',
        message: error.message,
        // Include stack trace only in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

// Add GET method for testing
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  
  // Return article info for testing
  const article = await MockRecordService.getRecordBySlug(slug, true);
  
  if (!article) {
    return NextResponse.json(
      { success: false, error: 'Article not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      status: article.status,
      createdBy: article.createdBy,
      canPublish: article.status === 'DRAFT' && article.createdBy === mockSession.user.id
    }
  });
}

// Optional: Add examples of how to test this endpoint
/*
Example test requests:

1. Test with valid draft article:
   POST /api/articles/test-article/publish

2. Test with non-existent article:
   POST /api/articles/non-existent/publish

3. Test with already published article:
   POST /api/articles/published-article/publish

4. Test with other user's article:
   POST /api/articles/other-user-article/publish

5. Get article info:
   GET /api/articles/test-article/publish
*/import { NextRequest, NextResponse } from 'next/server';
import { eventFlow } from '@/lib/workflow';

// Mock session data for testing
const mockSession = {
  user: {
    id: 'user_12345',
    username: 'testuser',
    email: 'test@example.com',
    role: 'author'
  }
};

// Mock article data
const mockArticles = {
  'test-article': {
    id: 'article_12345',
    slug: 'test-article',
    title: 'Test Article Title',
    content: `
      <html>
        <head>
          <title>Test Article</title>
          <script>console.log('test script')</script>
        </head>
        <body>
          <h1>Welcome to My Test Article</h1>
          <p>This is a test article content with some <strong>bold text</strong> and <em>italic text</em>.</p>
          <p>Artificail intelligence is revolutonizing the world with inovative solutions.</p>
          <img src="/test-image.jpg" alt="Test image">
          <p>Some content that might need review for quality and safety.</p>
        </body>
      </html>
    `,
    status: 'DRAFT',
    createdBy: 'user_12345',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'published-article': {
    id: 'article_67890',
    slug: 'published-article',
    title: 'Already Published Article',
    content: '<p>This article is already published</p>',
    status: 'PUBLISHED',
    createdBy: 'user_12345',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'other-user-article': {
    id: 'article_99999',
    slug: 'other-user-article',
    title: 'Other User Article',
    content: '<p>This belongs to another user</p>',
    status: 'DRAFT',
    createdBy: 'user_99999', // Different user
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

// Mock RecordService
const MockRecordService = {
  getRecordBySlug: async (slug: string, includeDrafts: boolean = false) => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB delay
    
    const article = mockArticles[slug as keyof typeof mockArticles];
    
    if (!article) {
      return null;
    }
    
    // If not including drafts and article is draft, return null
    if (!includeDrafts && article.status === 'DRAFT') {
      return null;
    }
    
    return article;
  }
};

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Use mock session instead of real auth
    const session = mockSession;
    
    // For demo purposes, you can optionally still check for auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader && process.env.NODE_ENV === 'production') {
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

    // Get the article using mock service
    const article = await MockRecordService.getRecordBySlug(slug, true); // Include drafts
    
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to publish
    if (article.createdBy !== session.user.id) {
      // For demo, allow admin role to publish any article
      if (session.user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to publish this article' },
          { status: 403 }
        );
      }
    }

    // Check if article is in draft status
    if (article.status !== 'DRAFT') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Article is already ${article.status.toLowerCase()}`,
          currentStatus: article.status
        },
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
      htmlContent: article.content, // Added for AI processing
      author: session.user.username,
      userId: session.user.id,
      category: 'technology', // Default category
      timestamp: new Date().toISOString()
    });

    // Check workflow results
    const hasErrors = workflowResults.some(result => result.error);
    
    if (hasErrors) {
      const errors = workflowResults.filter(r => r.error).map(r => ({
        function: r.functionId,
        error: r.error?.message
      }));
      
      console.error('❌ Publishing workflow errors:', errors);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Publishing workflow encountered errors',
          details: errors
        },
        { status: 500 }
      );
    }

    // Get the final result from the workflow
    const publishResult = workflowResults[workflowResults.length - 1]; // Last result

    return NextResponse.json({
      success: true,
      message: 'Article published successfully',
      data: {
        articleId: article.id,
        slug: article.slug,
        title: article.title,
        publishedAt: new Date().toISOString(),
        workflow: {
          steps: workflowResults.length,
          results: publishResult?.result || {}
        }
      },
    });

  } catch (error: any) {
    console.error('❌ Article publishing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to publish article',
        message: error.message,
        // Include stack trace only in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}

// Add GET method for testing
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  
  // Return article info for testing
  const article = await MockRecordService.getRecordBySlug(slug, true);
  
  if (!article) {
    return NextResponse.json(
      { success: false, error: 'Article not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      status: article.status,
      createdBy: article.createdBy,
      canPublish: article.status === 'DRAFT' && article.createdBy === mockSession.user.id
    }
  });
}

// Optional: Add examples of how to test this endpoint
/*
Example test requests:

1. Test with valid draft article:
   POST /api/articles/test-article/publish

2. Test with non-existent article:
   POST /api/articles/non-existent/publish

3. Test with already published article:
   POST /api/articles/published-article/publish

4. Test with other user's article:
   POST /api/articles/other-user-article/publish

5. Get article info:
   GET /api/articles/test-article/publish
*/