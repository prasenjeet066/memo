import { memoFlow } from "@/lib/workflow";
import { RecordDAL } from '@/lib/dal/record.dal';

// -------------------
// Storage Function
// -------------------
async function storeArticle(
  articleData: any, 
  userId: string, 
  username: string
): Promise<{ id: string; slug: string; url: string; status: string }> {
  try {
    console.log(`💾 Storing article: ${articleData.title}`);
    
    // Extract text content if HTML is provided
    const content = articleData.htmlContent 
      ? articleData.htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      : articleData.content;
    
    // Create record in database
    const record = await RecordDAL.createRecord(
      {
        title: articleData.title,
        content: content,
        summary: articleData.summary || content.slice(0, 300),
        categories: Array.isArray(articleData.categories) ? articleData.categories : [],
        tags: Array.isArray(articleData.tags) ? articleData.tags : [],
        infobox: articleData.infobox,
        references: Array.isArray(articleData.references) ? articleData.references : [],
        externalLinks: Array.isArray(articleData.externalLinks) ? articleData.externalLinks : [],
      },
      userId,
      username
    );

    // Set status to DRAFT initially
    await RecordDAL.updateStatus(record._id.toString(), {
      status: 'DRAFT',
    });

    console.log(`✅ Article stored successfully: ${record.slug} (Status: DRAFT)`);

    return {
      id: record._id.toString(),
      slug: record.slug,
      url: `/record/${record.slug}`,
      status: 'DRAFT',
    };
  } catch (error: any) {
    console.error("❌ Failed to store article:", error);
    throw new Error(`Storage failed: ${error.message}`);
  }
}

// -------------------
// Simple Workflow - Just Store to DB
// -------------------
memoFlow.createFunction(
  { 
    id: "ai-article-review-workflow", 
    name: "Store Article to Database", 
    retries: 2 
  },
  { event: "article.submitted" },
  async ({ event, step }) => {
    const { 
      articleId, 
      htmlContent, 
      content,
      title, 
      summary,
      categories,
      tags,
      references,
      externalLinks,
      infobox,
      created_by,
      created_by_username 
    } = event.data;

    console.log(`\n🚀 Starting article storage workflow`);
    console.log(`📄 Article: "${title}"`);
    console.log(`👤 Author: ${created_by_username}`);
    console.log(`🆔 Article ID: ${articleId}`);

    // Single step: Store article in database
    const storageResult = await step.run(
      "store-article", 
      async () => storeArticle(
        {
          title,
          content,
          htmlContent,
          summary,
          categories,
          tags,
          references,
          externalLinks,
          infobox,
        }, 
        created_by, 
        created_by_username
      ),
      { maxRetries: 2 }
    );

    console.log(`\n✅ Workflow completed successfully!`);
    console.log(`🔗 Article URL: ${storageResult.url}`);
    console.log(`📊 Final Status: ${storageResult.status}\n`);

    // Return result
    return {
      success: true,
      articleId: storageResult.id,
      slug: storageResult.slug,
      url: storageResult.url,
      status: storageResult.status,
      metadata: {
        title,
        summary,
        categories,
        tags,
      },
      timestamp: new Date().toISOString(),
    };
  }
);