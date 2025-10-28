// lib/inngest/functions.ts
import { inngest } from "./client";
import { RecordDAL } from "@/lib/dal/record.dal";
import { UserDAL } from "@/lib/dal/user.dal";
import { CreateRecordDTO, UpdateRecordDTO } from "@/lib/dtos/record.dto";

/**
 * Article submission Inngest function
 * Handles creation and updates of records with full DAL integration
 */
export const articleSubmissionFunction = inngest.createFunction(
  { 
    id: "article-submission",
    name: "Process Article Submission",
  },
  { event: "article/submitted" },
  async ({ event, step }) => {
    const { data } = event;

    // Step 1: Validate the article content and user
    const validatedData = await step.run("validate-article", async () => {
      console.log(`🔍 Validating article: ${data.title}`);
      
      // Validate required fields
      if (!data.content || !data.title || !data.created_by) {
        throw new Error("Invalid article data: missing required fields");
      }

      // Validate user exists
      const user = await UserDAL.findById(data.created_by);
      if (!user) {
        throw new Error(`User not found: ${data.created_by}`);
      }

      // If updating, validate article exists
      if (data.articleId) {
        const existingArticle = await RecordDAL.findById(data.articleId);
        if (!existingArticle) {
          throw new Error(`Article not found: ${data.articleId}`);
        }
      }
      
      return {
        ...data,
        username: user.user_handler,
      };
    });

    // Step 2: Save or update the article in the database using DAL
    const article = await step.run("save-article", async () => {
      console.log(`💾 Saving article: ${validatedData.title}`);
      
      if (validatedData.articleId) {
        // Update existing article
        const updateDTO: UpdateRecordDTO = {
          title: validatedData.title,
          content: validatedData.content,
          summary: validatedData.summary,
          categories: validatedData.categories,
          tags: validatedData.tags,
          references: validatedData.references,
          externalLinks: validatedData.externalLinks,
          infobox: validatedData.infobox,
          editSummary: validatedData.editSummary || "Article updated via submission",
          isMinorEdit: validatedData.isMinorEdit || false,
        };

        const updatedArticle = await RecordDAL.updateRecord(
          validatedData.articleId,
          updateDTO,
          validatedData.created_by,
          validatedData.username
        );

        if (!updatedArticle) {
          throw new Error(`Failed to update article: ${validatedData.articleId}`);
        }

        return updatedArticle;
      } else {
        // Create new article
        const createDTO: CreateRecordDTO = {
          title: validatedData.title,
          content: validatedData.content,
          summary: validatedData.summary || "",
          categories: validatedData.categories || [],
          tags: validatedData.tags || [],
          references: validatedData.references || [],
          externalLinks: validatedData.externalLinks || [],
          infobox: validatedData.infobox,
        };

        const newArticle = await RecordDAL.createRecord(
          createDTO,
          validatedData.created_by,
          validatedData.username
        );

        return newArticle;
      }
    });

    // Step 3: Update article status if needed
    await step.run("update-status", async () => {
      console.log(`📊 Updating status for article: ${article._id}`);
      
      if (validatedData.shouldPublish) {
        await RecordDAL.updateStatus(article._id.toString(), {
          status: "PUBLISHED",
          reason: "Published via submission"
        });
      }

      return { statusUpdated: true };
    });

    // Step 4: Update quality ratings if provided
    await step.run("update-quality", async () => {
      console.log(`⭐ Updating quality ratings for article: ${article._id}`);
      
      if (validatedData.qualityRating || validatedData.importanceRating) {
        await RecordDAL.updateQuality(article._id.toString(), {
          qualityRating: validatedData.qualityRating,
          importanceRating: validatedData.importanceRating,
        });
      }

      return { qualityUpdated: true };
    });

    // Step 5: Manage watchers
    await step.run("manage-watchers", async () => {
      console.log(`👁️ Managing watchers for article: ${article._id}`);
      
      // Auto-watch for creator
      if (!validatedData.articleId) {
        await RecordDAL.addWatcher(
          article._id.toString(),
          validatedData.created_by
        );
      }

      // Add additional watchers if specified
      if (validatedData.additionalWatchers?.length > 0) {
        for (const watcherId of validatedData.additionalWatchers) {
          await RecordDAL.addWatcher(article._id.toString(), watcherId);
        }
      }

      return { watchersAdded: true };
    });

    // Step 6: Increment view count for existing articles
    if (validatedData.articleId) {
      await step.run("update-view-count", async () => {
        console.log(`👀 Updating view count for article: ${article._id}`);
        await RecordDAL.incrementViewCount(article._id.toString());
        return { viewCountUpdated: true };
      });
    }

    // Step 7: Update user's last login timestamp
    await step.run("update-user-activity", async () => {
      console.log(`🕒 Updating user activity: ${validatedData.created_by}`);
      await UserDAL.updateLastLogin(validatedData.created_by);
      return { userActivityUpdated: true };
    });

    // Step 8: Post-processing and notifications
    await step.run("post-processing", async () => {
      console.log(`🔔 Running post-processing for article: ${article._id}`);
      
      // Get article statistics
      const stats = await RecordDAL.getRecordStats(article._id.toString());
      
      // Get related articles for recommendation
      const relatedArticles = await RecordDAL.getRelatedRecords(
        article._id.toString(),
        5
      );

      console.log(`📈 Article stats:`, stats);
      console.log(`🔗 Related articles found: ${relatedArticles.length}`);
      
      // You can add:
      // - Search index updates
      // - Email notifications to watchers
      // - Cache invalidation
      // - Analytics tracking
      // - Social media sharing
      
      return { 
        success: true,
        stats,
        relatedCount: relatedArticles.length,
      };
    });

    console.log(`✅ Article processing completed: ${article._id}`);
    
    return {
      articleId: article._id.toString(),
      slug: article.slug,
      title: article.title,
      status: article.status,
      revisionCount: article.revisions?.length || 0,
      createdAt: article.created_at,
    };
  }
);

/**
 * Article deletion function
 * Handles soft or hard deletion of articles
 */
export const articleDeletionFunction = inngest.createFunction(
  {
    id: "article-deletion",
    name: "Process Article Deletion",
  },
  { event: "article/deleted" },
  async ({ event, step }) => {
    const { articleId, userId, permanent } = event.data;

    // Step 1: Validate deletion request
    await step.run("validate-deletion", async () => {
      console.log(`🔍 Validating deletion for article: ${articleId}`);
      
      const article = await RecordDAL.findById(articleId);
      if (!article) {
        throw new Error(`Article not found: ${articleId}`);
      }

      const user = await UserDAL.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Check permissions (you can add role checks here)
      if (article.created_by.toString() !== userId && !user.user_role.includes('ADMIN')) {
        throw new Error("Insufficient permissions to delete article");
      }

      return { validated: true };
    });

    // Step 2: Perform deletion
    const result = await step.run("delete-article", async () => {
      console.log(`🗑️ Deleting article: ${articleId}`);
      
      if (permanent) {
        // Hard delete
        const deleted = await RecordDAL.deleteRecordPermanently(articleId);
        return { deleted, type: 'permanent' };
      } else {
        // Soft delete (mark as DELETED)
        await RecordDAL.updateStatus(articleId, {
          status: 'DELETED',
          reason: 'Deleted by user'
        });
        return { deleted: true, type: 'soft' };
      }
    });

    console.log(`✅ Article deletion completed: ${articleId}`);
    return result;
  }
);

/**
 * Bulk article update function
 * Handles batch updates for multiple articles
 */
export const bulkArticleUpdateFunction = inngest.createFunction(
  {
    id: "bulk-article-update",
    name: "Process Bulk Article Updates",
  },
  { event: "article/bulk-update" },
  async ({ event, step }) => {
    const { articleIds, updates, userId } = event.data;

    // Step 1: Validate bulk update request
    const validatedData = await step.run("validate-bulk-update", async () => {
      console.log(`🔍 Validating bulk update for ${articleIds.length} articles`);
      
      const user = await UserDAL.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Verify all articles exist
      const articles = await Promise.all(
        articleIds.map(id => RecordDAL.findById(id))
      );

      const invalidArticles = articles.filter(a => !a);
      if (invalidArticles.length > 0) {
        throw new Error(`Some articles not found`);
      }

      return { articles, user };
    });

    // Step 2: Perform bulk update
    const result = await step.run("bulk-update", async () => {
      console.log(`📝 Updating ${articleIds.length} articles`);
      
      const modifiedCount = await RecordDAL.bulkUpdateRecords(
        articleIds,
        updates
      );

      return { modifiedCount, total: articleIds.length };
    });

    console.log(`✅ Bulk update completed: ${result.modifiedCount}/${result.total} articles updated`);
    return result;
  }
);

/**
 * Article statistics aggregation function
 * Runs periodically to update article statistics
 */
export const articleStatsAggregationFunction = inngest.createFunction(
  {
    id: "article-stats-aggregation",
    name: "Aggregate Article Statistics",
  },
  { cron: "0 0 * * *" }, // Run daily at midnight
  async ({ step }) => {
    // Step 1: Get all published articles
    const articles = await step.run("fetch-published-articles", async () => {
      console.log(`📊 Fetching published articles for stats aggregation`);
      
      const result = await RecordDAL.getPaginatedRecords(1, 1000, {
        status: 'PUBLISHED'
      });

      return result.records;
    });

    // Step 2: Aggregate statistics
    const stats = await step.run("aggregate-stats", async () => {
      console.log(`🔢 Aggregating statistics for ${articles.length} articles`);
      
      const [categoryStats, popularTags] = await Promise.all([
        RecordDAL.getRecordCountByCategory(),
        RecordDAL.getPopularTags(50),
      ]);

      return {
        totalArticles: articles.length,
        categoryStats,
        popularTags,
      };
    });

    console.log(`✅ Statistics aggregation completed`);
    return stats;
  }
);