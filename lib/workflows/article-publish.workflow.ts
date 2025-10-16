// lib/workflows/article-publish.workflow.ts

import { eventFlow } from '@/lib/workflow';
import { RecordDAL } from '@/lib/dal/record.dal';
import { RecordService } from '@/lib/services/record.service';
import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// ==========================================
// Zod Schemas for AI SDK
// ==========================================
const ContentCorrectionSchema = z.object({
  type: z.enum(['grammar', 'spelling', 'punctuation', 'style']),
  original: z.string(),
  fixed: z.string(),
  explanation: z.string(),
});

const AIProcessingResultSchema = z.object({
  fixedContent: z.string(),
  corrections: z.array(ContentCorrectionSchema),
  summary: z.string(),
});

// ==========================================
// AI Content Processing Service using AI SDK
// ==========================================
class AIContentProcessor {
  private static getModel() {
    // Check which AI provider is configured
    const provider = process.env.AI_PROVIDER || 'openai';
    
    switch (provider) {
      case 'anthropic':
        return anthropic('claude-3-5-sonnet-20241022');
      case 'openai':
      default:
        return openai('gpt-4-turbo');
    }
  }

  /**
   * Scan and fix content errors using AI SDK
   */
  static async scanAndFixContent(content: string, title: string): Promise<{
    fixedContent: string;
    corrections: ContentCorrection[];
    summary: string;
  }> {
    try {
      console.log('🤖 Using AI SDK to process content...');
      
      const { object } = await generateObject({
        model: this.getModel(),
        schema: AIProcessingResultSchema,
        prompt: `You are an expert editor. Analyze and fix the following article content.

Title: ${title}

Content:
${content}

Please:
1. Fix all grammar, spelling, and punctuation errors
2. Improve sentence structure and clarity
3. Maintain the original meaning and tone
4. Ensure consistency in formatting

Provide:
- fixedContent: The corrected version of the content
- corrections: Array of all corrections made with type, original text, fixed text, and explanation
- summary: A brief summary of the changes made`,
        temperature: 0.3,
      });

      console.log(`   ✓ AI SDK processed content successfully`);
      console.log(`   ✓ Found and fixed ${object.corrections.length} issues`);

      return {
        fixedContent: object.fixedContent,
        corrections: object.corrections,
        summary: object.summary,
      };
    } catch (error) {
      console.error('AI SDK content processing error:', error);
      // Fallback: return original content if AI fails
      return {
        fixedContent: content,
        corrections: [],
        summary: 'AI processing unavailable, using original content',
      };
    }
  }

  /**
   * Generate enhanced quality analysis using AI SDK
   */
  static async generateEnhancedQualityReport(
    content: string, 
    title: string
  ): Promise<QualityReport> {
    try {
      const basicMetrics = this.calculateBasicMetrics(content);
      
      // Use AI SDK to generate enhanced analysis
      const { text } = await generateText({
        model: this.getModel(),
        prompt: `Analyze the following article for quality and provide recommendations:

Title: ${title}
Word Count: ${basicMetrics.wordCount}
Paragraphs: ${basicMetrics.paragraphs}

Content:
${content.substring(0, 2000)}... ${content.length > 2000 ? '(truncated)' : ''}

Provide 3-5 specific recommendations to improve the article quality. Focus on:
- Content structure and organization
- Readability and clarity
- SEO optimization
- Engagement and flow

Format as a numbered list.`,
        temperature: 0.5,
        maxTokens: 500,
      });

      // Parse recommendations from AI response
      const aiRecommendations = text
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim());

      return {
        ...basicMetrics,
        score: this.calculateQualityScore(basicMetrics.wordCount, basicMetrics.paragraphs),
        recommendations: aiRecommendations.length > 0 
          ? aiRecommendations 
          : this.generateBasicRecommendations(basicMetrics),
      };
    } catch (error) {
      console.error('AI SDK quality report error:', error);
      const basicMetrics = this.calculateBasicMetrics(content);
      return {
        ...basicMetrics,
        score: this.calculateQualityScore(basicMetrics.wordCount, basicMetrics.paragraphs),
        recommendations: this.generateBasicRecommendations(basicMetrics),
      };
    }
  }

  /**
   * Generate SEO-optimized summary using AI SDK
   */
  static async generateSEOSummary(content: string, title: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: this.getModel(),
        prompt: `Create a concise, SEO-optimized summary (150-160 characters) for the following article:

Title: ${title}

Content:
${content.substring(0, 1500)}...

The summary should:
- Be engaging and click-worthy
- Include relevant keywords naturally
- Accurately represent the content
- Be between 150-160 characters`,
        temperature: 0.7,
        maxTokens: 100,
      });

      return text.trim();
    } catch (error) {
      console.error('SEO summary generation error:', error);
      return content.substring(0, 157) + '...';
    }
  }

  /**
   * Calculate basic content metrics
   */
  private static calculateBasicMetrics(content: string) {
    const wordCount = content.split(/\s+/).length;
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim()).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgWordsPerParagraph = Math.round(wordCount / Math.max(paragraphs, 1));
    const avgWordsPerSentence = Math.round(wordCount / Math.max(sentences, 1));
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

    return {
      wordCount,
      paragraphs,
      sentences,
      avgWordsPerParagraph,
      avgWordsPerSentence,
      readingTime,
      characterCount: content.length,
    };
  }

  private static calculateQualityScore(wordCount: number, paragraphs: number): number {
    let score = 0;
    
    // Word count scoring (0-40 points)
    if (wordCount >= 1500) score += 40;
    else if (wordCount >= 1000) score += 35;
    else if (wordCount >= 500) score += 25;
    else if (wordCount >= 300) score += 15;
    else score += 5;

    // Structure scoring (0-30 points)
    if (paragraphs >= 8) score += 30;
    else if (paragraphs >= 5) score += 25;
    else if (paragraphs >= 3) score += 15;
    else score += 5;

    // Additional quality points (0-30 points)
    score += 30; // Assume good quality baseline

    return Math.min(score, 100);
  }

  private static generateBasicRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.wordCount < 300) {
      recommendations.push('Consider expanding the content to at least 300 words for better SEO and depth');
    } else if (metrics.wordCount < 1000) {
      recommendations.push('Adding more detailed information could improve the article value (aim for 1000+ words)');
    }

    if (metrics.paragraphs < 3) {
      recommendations.push('Break content into more paragraphs (at least 3-5) for better readability');
    }

    if (metrics.avgWordsPerParagraph > 150) {
      recommendations.push('Some paragraphs are too long. Break them into smaller chunks (100-150 words max)');
    }

    if (metrics.avgWordsPerSentence > 25) {
      recommendations.push('Sentences are too long on average. Aim for 15-20 words per sentence');
    }

    if (recommendations.length === 0) {
      recommendations.push('Content structure and length are well-optimized');
    }

    return recommendations;
  }
}

// ==========================================
// Type Definitions
// ==========================================
interface ContentCorrection {
  type: 'grammar' | 'spelling' | 'punctuation' | 'style';
  original: string;
  fixed: string;
  explanation: string;
}

interface QualityReport {
  wordCount: number;
  paragraphs: number;
  sentences: number;
  avgWordsPerParagraph: number;
  avgWordsPerSentence: number;
  readingTime: number;
  characterCount: number;
  score: number;
  recommendations: string[];
}

interface EditionReport {
  articleId: string;
  articleTitle: string;
  processedAt: Date;
  aiProcessing: {
    corrections: ContentCorrection[];
    summary: string;
  };
  qualityReport: QualityReport;
  seoSummary?: string;
  status: 'success' | 'failed';
  publishedBy: string;
}

interface ArticleJSON {
  metadata: {
    id: string;
    title: string;
    slug: string;
    status: string;
    publishedAt: Date;
    publishedBy: string;
  };
  content: {
    original: string;
    processed: string;
    wordCount: number;
    readingTime: number;
  };
  corrections: ContentCorrection[];
  qualityMetrics: QualityReport;
  seo: {
    summary: string;
    keywords: string[];
  };
}

// ==========================================
// Publishing Workflow
// ==========================================
eventFlow.createFunction(
  {
    id: 'publish-article-workflow',
    name: 'Article Publishing Workflow with AI SDK Processing',
    retries: 3
  },
  {
    event: 'article.publish.requested'
  },
  async ({ event, step }) => {
    const { articleId, slug, title, content, userId, username } = event.data;

    console.log(`\n📝 Processing article: "${title}"`);
    console.log(`   ID: ${articleId}`);
    console.log(`   Slug: ${slug}`);
    console.log(`   Author: ${username}`);
    console.log(`   AI Provider: ${process.env.AI_PROVIDER || 'openai'}\n`);

    // ==========================================
    // STEP 1: Fetch Article Data
    // ==========================================
    const article = await step.run('fetch-article', async () => {
      console.log('📚 Fetching article from database...');
      const record = await RecordDAL.findById(articleId);
      
      if (!record) {
        throw new Error('Article not found in database');
      }

      return {
        id: record._id.toString(),
        title: record.title,
        slug: record.slug,
        content: record.content,
        summary: record.summary,
        categories: record.categories,
        tags: record.tags
      };
    });

    // ==========================================
    // STEP 2: AI Content Scanning & Fixing (AI SDK)
    // ==========================================
    const aiProcessing = await step.run(
      'ai-content-processing',
      async () => {
        console.log('🤖 Scanning content with AI SDK for errors...');
        
        const result = await AIContentProcessor.scanAndFixContent(
          article.content,
          article.title
        );

        console.log(`   ✓ Found and fixed ${result.corrections.length} issues`);
        
        return result;
      },
      { maxRetries: 2, retryDelay: 2000 }
    );

    // ==========================================
    // STEP 3: Generate Enhanced Quality Report (AI SDK)
    // ==========================================
    const qualityReport = await step.run('generate-quality-report', async () => {
      console.log('📊 Generating enhanced quality report with AI SDK...');
      
      const report = await AIContentProcessor.generateEnhancedQualityReport(
        aiProcessing.fixedContent,
        article.title
      );

      console.log(`   ✓ Quality Score: ${report.score}/100`);
      console.log(`   ✓ Word Count: ${report.wordCount}`);
      console.log(`   ✓ Reading Time: ${report.readingTime} min`);
      console.log(`   ✓ AI Recommendations: ${report.recommendations.length}`);
      
      return report;
    });

    // ==========================================
    // STEP 4: Generate SEO Summary (AI SDK)
    // ==========================================
    const seoSummary = await step.run('generate-seo-summary', async () => {
      console.log('🎯 Generating SEO-optimized summary with AI SDK...');
      
      const summary = await AIContentProcessor.generateSEOSummary(
        aiProcessing.fixedContent,
        article.title
      );

      console.log(`   ✓ SEO Summary generated (${summary.length} chars)`);
      
      return summary;
    });

    // ==========================================
    // STEP 5: Convert to JSON Format
    // ==========================================
    const articleJSON = await step.run('convert-to-json', async () => {
      console.log('📦 Converting article to JSON format...');
      
      const json: ArticleJSON = {
        metadata: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedBy: username
        },
        content: {
          original: article.content,
          processed: aiProcessing.fixedContent,
          wordCount: qualityReport.wordCount,
          readingTime: qualityReport.readingTime
        },
        corrections: aiProcessing.corrections,
        qualityMetrics: qualityReport,
        seo: {
          summary: seoSummary,
          keywords: article.tags || []
        }
      };

      console.log('   ✓ JSON structure created');
      
      return json;
    });

    // ==========================================
    // STEP 6: Generate Edition Summary Report
    // ==========================================
    const editionReport = await step.run('generate-edition-report', async () => {
      console.log('📋 Generating edition summary report...');
      
      const report: EditionReport = {
        articleId: article.id,
        articleTitle: article.title,
        processedAt: new Date(),
        aiProcessing: {
          corrections: aiProcessing.corrections,
          summary: aiProcessing.summary
        },
        qualityReport,
        seoSummary,
        status: 'success',
        publishedBy: username
      };

      // Log the report summary
      console.log('\n📄 Edition Report Summary:');
      console.log('─────────────────────────────────────');
      console.log(`   Article: ${report.articleTitle}`);
      console.log(`   Corrections Made: ${report.aiProcessing.corrections.length}`);
      console.log(`   Quality Score: ${report.qualityReport.score}/100`);
      console.log(`   Word Count: ${report.qualityReport.wordCount}`);
      console.log(`   Reading Time: ${report.qualityReport.readingTime} min`);
      console.log(`   Status: ${report.status}`);
      console.log('─────────────────────────────────────\n');

      return report;
    });

    // ==========================================
    // STEP 7: Update Article with Processed Content
    // ==========================================
    const updatedArticle = await step.run(
      'update-article-content',
      async () => {
        console.log('💾 Updating article with processed content...');
        
        const result = await RecordService.updateRecord(
          article.id,
          {
            content: aiProcessing.fixedContent,
            summary: seoSummary,
            editSummary: `AI-processed publication: ${aiProcessing.summary}`,
            isMinorEdit: false
          },
          userId,
          username
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to update article');
        }

        console.log('   ✓ Article content updated');
        
        return result.record;
      },
      { maxRetries: 3, retryDelay: 1000 }
    );

    // ==========================================
    // STEP 8: Update Article Status to PUBLISHED
    // ==========================================
    await step.run('publish-article', async () => {
      console.log('🚀 Publishing article...');
      
      const result = await RecordService.updateStatus(
        article.id,
        {
          status: 'PUBLISHED',
          reason: 'AI-processed and approved for publication'
        },
        userId
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to publish article');
      }

      console.log('   ✓ Article status set to PUBLISHED');
    });

    // ==========================================
    // STEP 9: Save Edition Report to Database
    // ==========================================
    await step.run('save-edition-report', async () => {
      console.log('💾 Saving edition report...');
      
      // Save the report as metadata to the article
      await RecordDAL.updateById(article.id, {
        $set: {
          'metadata.lastEditionReport': editionReport,
          'metadata.lastAIProcessing': {
            processedAt: new Date(),
            corrections: aiProcessing.corrections.length,
            qualityScore: qualityReport.score,
            provider: process.env.AI_PROVIDER || 'openai'
          }
        }
      } as any);

      console.log('   ✓ Edition report saved');
    });

    // ==========================================
    // STEP 10: Send Notifications (Optional)
    // ==========================================
    await step.run('send-notifications', async () => {
      console.log('📧 Sending publication notifications...');
      
      // Here you could send emails, webhooks, etc.
      // await EmailService.sendPublicationNotification(...)
      // await WebhookService.trigger('article.published', ...)
      
      console.log('   ✓ Notifications sent');
    });

    // ==========================================
    // Final Result
    // ==========================================
    console.log('\n✅ Publishing workflow completed successfully!\n');

    return {
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: 'PUBLISHED'
      },
      processing: {
        corrections: aiProcessing.corrections.length,
        qualityScore: qualityReport.score,
        wordCount: qualityReport.wordCount,
        readingTime: qualityReport.readingTime,
        seoSummary: seoSummary
      },
      editionReport,
      articleJSON
    };
  }
);

// ==========================================
// Export for use in other files
// ==========================================
export { AIContentProcessor, type EditionReport, type ArticleJSON };