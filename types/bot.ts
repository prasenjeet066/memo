/**
 * Type definitions for Article Intelligence Function
 */

export interface ScrapedData {
  url: string;
  status_code: number;
  scraped_at: string;
  metadata: {
    title: string | null;
    description: string | null;
    keywords: string[] | null;
    author: string | null;
    published_date: string | null;
    modified_date: string | null;
    canonical_url: string | null;
    language: string | null;
    og_tags: Record<string, any>;
    twitter_tags: Record<string, any>;
    schema_org: any[];
  };
  content: {
    headings: Record<string, string[]>;
    paragraphs: string[];
    lists: any[];
    tables: any[];
    code_blocks: string[];
    quotes: string[];
    text_content: string;
    word_count: number;
  };
  media: Record<string, any>;
  links: Record<string, string[]>;
  structured_data: Record<string, any>;
}

export interface ResearchResult {
  RevisedName: string;
  articleCategory: string;
  SearchQuerys: string[];
  KeyFacts: string[];
  Sources: string[];
  ResearchSummary: string;
}

export interface CrawlResult {
  plainText?: string;
  author?: string;
  date?: string;
  query?: string;
  url?: string;
  error?: string;
}

export interface SearchResult {
  query: string;
  crawl?: CrawlResult[];
  results?: any[];
  error?: string;
}

export interface ImageObject {
  url: string;
  caption?: string;
  size?: string;
}

export interface ReferenceObject {
  title: string;
  url?: string;
  source?: string;
}

export interface SchemaOrgObject {
  "@context": string;
  "@type": string;
  name: string;
  [key: string]: any;
}

export interface ArticleResult {
  ImagesUrls: ImageObject[];
  Sections: string;
  ReferenceList: ReferenceObject[];
  SchemaOrg: SchemaOrgObject;
  Summary: string;
  error?: string;
}

export interface ArticleEvent {
  data: {
    slug: string;
    userid: string;
    username: string;
  };
}

export interface DatabaseResult {
  success?: boolean;
  recordId?: string;
  slug?: string;
  error?: string;
}