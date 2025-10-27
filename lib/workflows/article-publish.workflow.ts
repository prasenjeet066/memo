import { memoFlow } from "@/lib/workflow";
import { RecordDAL } from "@/lib/dal/record.dal";

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

    const content = articleData.htmlContent || articleData.content || "";

    // -------------------
    // UPDATE existing article
    // -------------------
    if (articleData.articleId) {
      console.log(`🛠 Updating existing article: ${articleData.articleId}`);

      const updatedRecord = await RecordDAL.updateRecord(
        articleData.articleId,
        {
          title: articleData.title || "",
          content,
          summary: articleData.summary || content.replace(/<[^>]*>/g, '').slice(0, 300),
          categories: Array.isArray(articleData.categories)
            ? articleData.categories
            : [],
          tags: Array.isArray(articleData.tags) ? articleData.tags : [],
          infobox: articleData.infobox || undefined,
          references: Array.isArray(articleData.references)
            ? articleData.references
            : [],
          externalLinks: Array.isArray(articleData.externalLinks)
            ? articleData.externalLinks
            : [],
          editSummary: articleData.editSummary || "Updated via workflow",
          isMinorEdit: !!articleData.isMinorEdit,
        },
        userId,
        username
      );

      if (!updatedRecord) {
        throw new Error(`Article not found: ${articleData.articleId}`);
      }

      // Update status to PUBLISHED after successful edit
      await RecordDAL.updateStatus(updatedRecord._id.toString(), {
        status: "PUBLISHED",
        reason: "Updated via workflow"
      });

      console.log(`✅ Article updated successfully: ${updatedRecord.slug}`);
      return {
        id: updatedRecord._id.toString(),
        slug: updatedRecord.slug,
        url: `/record/${updatedRecord.slug}`,
        status: "PUBLISHED",
      };
    }

    // -------------------
    // CREATE new article
    // -------------------
    console.log(`📝 Creating new article: ${articleData.title}`);
    
    const record = await RecordDAL.createRecord(
      {
        title: articleData.title,
        content,
        summary: articleData.summary || content.replace(/<[^>]*>/g, '').slice(0, 300),
        categories: Array.isArray(articleData.categories)
          ? articleData.categories
          : [],
        tags: Array.isArray(articleData.tags) ? articleData.tags : [],
        infobox: articleData.infobox || undefined,
        references: Array.isArray(articleData.references)
          ? articleData.references
          : [],
        externalLinks: Array.isArray(articleData.externalLinks)
          ? articleData.externalLinks
          : [],
      },
      userId,
      username
    );

    // Set status to PUBLISHED for new articles
    await RecordDAL.updateStatus(record._id.toString(), {
      status: "PUBLISHED",
      reason: "Initial publication"
    });

    console.log(`✅ New article stored successfully: ${record.slug}`);

    return {
      id: record._id.toString(),
      slug: record.slug,
      url: `/record/${record.slug}`,
      status: "PUBLISHED",
    };
  } catch (error: any) {
    console.error("❌ Failed to store article:", error);
    throw new Error(`Storage failed: ${error.message}`);
  }
}

// -------------------
// Workflow Definition
// -------------------
memoFlow.createFunction(
  {
    id: "ai-article-review-workflow",
    name: "Store Article to Database",
    retries: 2,
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
      created_by_username,
      editSummary,
      isMinorEdit,
    } = event.data;

    console.log(`\n🚀 Starting article storage workflow`);
    console.log(`📄 Article: "${title}"`);
    console.log(`👤 Author: ${created_by_username}`);
    console.log(`🆔 Article ID: ${articleId || "NEW"}`);
    console.log(`✏️ Edit Type: ${articleId ? (isMinorEdit ? "Minor Edit" : "Major Edit") : "New Article"}`);

    const storageResult = await step.run(
      "store-article",
      async () =>
        await storeArticle(
          {
            articleId,
            title,
            content,
            htmlContent,
            summary,
            categories,
            tags,
            references,
            externalLinks,
            infobox,
            editSummary,
            isMinorEdit,
          },
          created_by,
          created_by_username
        ),
      { maxRetries: 2 }
    );

    console.log(`\n✅ Workflow completed successfully!`);
    console.log(`🔗 Article URL: ${storageResult.url}`);
    console.log(`📊 Final Status: ${storageResult.status}\n`);

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
        isUpdate: !!articleId,
      },
      timestamp: new Date().toISOString(),
    };
  }
);