// lib/workflows/article-publish.workflow.ts

import { eventFlow } from '@/lib/workflow';
import { RecordDAL } from '@/lib/dal/record.dal';
import { RecordService } from '@/lib/services/record.service';
import OpenAI from 'openai';
import { z } from 'zod';

// ==========================================
// OpenAI Client Setup
// ==========================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==========================================
// Zod Schemas for OpenAI Response Parsing
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
// AI Content Processing Service using OpenAI
// ==========================================
class AIContentProcessor {
  private static getModel() {
    return process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  }

  /**
   * Scan and fix content errors using OpenAI
   */
  static async scanAndFixContent(content: string, title: string): Promise<{
    fixedContent: string;
    corrections: ContentCorrection[];
    summary: string;
  }> {
    try {
      console.log('🤖 Using OpenAI to process content...');
      
      const completion = await openai.chat.completions.create({
        model: this.getModel(),
        messages: [
          {
            role: 'system',
            content: `You are an expert editor. Analyze and fix the following article content.
            
Please:
1. Fix all grammar, spelling, and punctuation errors
2. Improve sentence structure and clarity
3. Maintain the original meaning and tone
4. Ensure consistency in formatting

Respond with a JSON object that matches this schema:
{
  "fixedContent": "The corrected version of the content",
  "corrections": [
    {
      "type": "grammar|spelling|punctuation|style",
      "original": "original text",
      "fixed": "fixed text", 
      "explanation": "why this was changed"
    }
  ],
  "summary": "Brief summary of changes made"
}`
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nContent:\n${content}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      const parsedResult = JSON.parse(responseText);
      const validatedResult = AIProcessingResultSchema.parse(parsedResult);

      console.log(`   ✓ OpenAI processed content successfully`);
      console.log(`   ✓ Found and fixed ${validatedResult.corrections.length} issues`);

      return {
        fixedContent: validatedResult.fixedContent,
        corrections: validatedResult.corrections,
        summary: validatedResult.summary,
      };
    } catch (error) {
      console.error('OpenAI content processing error:', error);
      // Fallback: return original content if AI fails
      return {
        fixedContent: content,
        corrections: [],
        summary: 'AI processing unavailable, using original content',
      };
    }
  }

  /**
   * Generate enhanced quality analysis using OpenAI
   */
  static async generateEnhancedQualityReport(
    content: string, 
    title: string
  ): Promise<QualityReport> {
    try {
      const basicMetrics = this.calculateBasicMetrics(content);
      
      const completion = await openai.chat.completions.create({
        model: this.getModel(),
        messages: [
          {
            role: 'system',
            content: `Analyze the article for quality and provide specific recommendations to improve it. 
            Focus on content structure, readability, SEO optimization, and engagement.
            Return ONLY a JSON array of recommendation strings.`
          },
          {
            role: 'user',
            content: `Title: ${title}
Word Count: ${basicMetrics.wordCount}
Paragraphs: ${basicMetrics.paragraphs}

Content:
${content.substring(0, 2000)}... ${content.length > 2000 ? '(truncated)' : ''}

Provide 3-5 specific recommendations as a JSON array of strings.`
          }
        ],
        temperature: 0.5,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0]?.message?.content;
      let aiRecommendations: string[] = [];

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          // Handle different possible response structures
          if (Array.isArray(parsed.recommendations)) {
            aiRecommendations = parsed.recommendations;
          } else if (Array.isArray(parsed)) {
            aiRecommendations = parsed;
          } else {
            // Try to extract array from object
            const values = Object.values(parsed);
            if (values.length > 0 && Array.isArray(values[0])) {
              aiRecommendations = values[0] as string[];
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse OpenAI recommendations:', parseError);
        }
      }

      return {
        ...basicMetrics,
        score: this.calculateQualityScore(basicMetrics.wordCount, basicMetrics.paragraphs),
        recommendations: aiRecommendations.length > 0 
          ? aiRecommendations 
          : this.generateBasicRecommendations(basicMetrics),
      };
    } catch (error) {
      console.error('OpenAI quality report error:', error);
      const basicMetrics = this.calculateBasicMetrics(content);
      return {
        ...basicMetrics,
        score: this.calculateQualityScore(basicMetrics.wordCount, basicMetrics.paragraphs),
        recommendations: this.generateBasicRecommendations(basicMetrics),
      };
    }
  }

  /**
   * Generate SEO-optimized summary using OpenAI
   */
  static async generateSEOSummary(content: string, title: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: this.getModel(),
        messages: [
          {
            role: 'system',
            content: `Create a concise, SEO-optimized summary (150-160 characters) that is engaging, 
            click-worthy, includes relevant keywords naturally, and accurately represents the content.`
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nContent:\n${content.substring(0, 1500)}...`
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      const summary = completion.choices[0]?.message?.content?.trim() || '';
      
      // Fallback if summary is too long or short
      if (summary && summary.length >= 50 && summary.length <= 200) {
        return summary;
      } else {
        return content.substring(0, 157) + '...';
      }
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
// Type Definitions (unchanged)
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
// Publishing Workflow (unchanged except for console logs)
// ==========================================
eventFlow.createFunction(
  {
    id: 'publish-article-workflow',
    name: 'Article Publishing Workflow with OpenAI Processing',
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
    console.log(`   OpenAI Model: ${process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'}\n`);

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
    // STEP 2: AI Content Scanning & Fixing (OpenAI)
    // ==========================================
    const aiProcessing = await step.run(
      'ai-content-processing',
      async () => {
        console.log('🤖 Scanning content with OpenAI for errors...');
        
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
    // STEP 3: Generate Enhanced Quality Report (OpenAI)
    // ==========================================
    const qualityReport = await step.run('generate-quality-report', async () => {
      console.log('📊 Generating enhanced quality report with OpenAI...');
      
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
    // STEP 4: Generate SEO Summary (OpenAI)
    // ==========================================
    const seoSummary = await step.run('generate-seo-summary', async () => {
      console.log('🎯 Generating SEO-optimized summary with OpenAI...');
      
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
            provider: 'openai'
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