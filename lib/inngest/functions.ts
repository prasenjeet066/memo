// lib/inngest/functions.ts
import { inngest } from "./client";
import { db } from "@/lib/db"; // Your database client

// Define the article submission function
export const articleSubmissionFunction = inngest.createFunction(
  { 
    id: "article-submission",
    name: "Process Article Submission",
  },
  { event: "article/submitted" },
  async ({ event, step }) => {
    const { data } = event;

    // Step 1: Validate the article content
    const validatedData = await step.run("validate-article", async () => {
      console.log(`🔍 Validating article: ${data.title}`);
      
      // Add your validation logic here
      if (!data.htmlContent || !data.title) {
        throw new Error("Invalid article data");
      }
      
      return data;
    });

    // Step 2: Save or update the article in the database
    const article = await step.run("save-article", async () => {
      console.log(`💾 Saving article: ${data.title}`);
      
      if (data.articleId) {
        // Update existing article
        return await db.article.update({
          where: { id: data.articleId },
          data: {
            title: validatedData.title,
            content: validatedData.htmlContent,
            summary: validatedData.summary,
            categories: validatedData.categories,
            tags: validatedData.tags,
            references: validatedData.references,
            externalLinks: validatedData.externalLinks,
            infobox: validatedData.infobox,
            slug: validatedData.slug,
            updated_by: validatedData.created_by,
            updated_at: new Date(),
          },
        });
      } else {
        // Create new article
        return await db.article.create({
          data: {
            title: validatedData.title,
            content: validatedData.htmlContent,
            summary: validatedData.summary,
            categories: validatedData.categories,
            tags: validatedData.tags,
            references: validatedData.references,
            externalLinks: validatedData.externalLinks,
            infobox: validatedData.infobox,
            slug: validatedData.slug,
            author: validatedData.author,
            created_by: validatedData.created_by,
            created_at: new Date(),
          },
        });
      }
    });

    // Step 3: Create revision history
    await step.run("create-revision", async () => {
      console.log(`📝 Creating revision for article: ${article.id}`);
      
      return await db.articleRevision.create({
        data: {
          articleId: article.id,
          content: validatedData.htmlContent,
          editSummary: validatedData.editSummary || "Article created/updated",
          isMinorEdit: validatedData.isMinorEdit,
          created_by: validatedData.created_by,
          created_by_username: validatedData.created_by_username,
          created_at: new Date(),
        },
      });
    });

    // Step 4: Optional - Send notifications, update search index, etc.
    await step.run("post-processing", async () => {
      console.log(`🔔 Running post-processing for article: ${article.id}`);
      
      // Add any additional processing:
      // - Update search index
      // - Send notifications
      // - Update related articles
      // - Generate preview images
      
      return { success: true };
    });

    console.log(`✅ Article processing completed: ${article.id}`);
    
    return {
      articleId: article.id,
      slug: article.slug,
      status: "published",
    };
  }
);