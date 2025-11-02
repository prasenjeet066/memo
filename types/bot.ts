/**
 * Type definitions for Perplexity-style Article Intelligence
 */

/**
 * Article event structure
 */
export interface ArticleEvent {
  data: {
    slug: string;
    userid: string;
    username: string;
  };
}

/**
 * Image metadata with full attribution
 */
export interface ImageResult {
  url: string;
  caption ? : string;
  size ? : string;
  author ? : string;
  source ? : string;
}

/**
 * Crawl result with enhanced metadata
 */
export interface CrawlResult {
  plainText ? : string;
  author ? : string;
  date ? : string;
  url ? : string;
  query ? : string;
  title ? : string;
  error ? : string;
}

/**
 * Search metadata from search API
 */
export interface SearchMetadata {
  url: string;
  title: string;
  snippet: string;
}

/**
 * Search result with crawled content
 */
export interface SearchResult {
  query: string;
  crawl ? : CrawlResult[];
  searchMetadata ? : SearchMetadata[];
  results ? : any[];
  error ? : string;
}

/**
 * Research result with source attribution
 */
export interface ResearchResult {
  RevisedName: string;
  articleCategory: string;
  SearchQuerys: string[];
  KeyFacts: string[];
  Sources: string[];
  ResearchSummary: string;
}

/**
 * Reference with citation index
 */
export interface Reference {
  title: string;
  url ? : string;
  source ? : string;
  index ? : number;
}

/**
 * Schema.org markup
 */
export interface SchemaOrg {
  "@context": string;
  "@type": string;
  name: string;
  [key: string]: any;
}

/**
 * Article result with citations
 */
export interface ArticleResult {
  ImagesUrls: ImageResult[];
  Sections: string;
  ReferenceList: Reference[];
  SchemaOrg: SchemaOrg;
  Summary: string;
}

/**
 * Database save result
 */
export interface DatabaseResult {
  success ? : boolean;
  recordId ? : string;
  slug ? : string;
  error ? : string;
}

/**
 * Complete workflow result
 */
export interface WorkflowResult {
  slug: string;
  searchQueries: string[];
  research: ResearchResult;
  searchResults: SearchResult[];
  images: ImageResult[];
  article: ArticleResult;
  database: DatabaseResult;
}