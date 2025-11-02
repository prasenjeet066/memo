/**
 * AI Prompts for Perplexity-style Article Intelligence
 * Enhanced with web search integration and inline citations
 */

export const AI_PROMPTS = {
  /**
   * Query Generation System Prompt
   */
  QUERY_GENERATION_SYSTEM: `
<instructions>
  <role>Search Query Optimization Expert</role>
  
  <task>
    Generate 3-5 optimized search queries that will help gather comprehensive information about a topic.
    Think like Perplexity AI - create queries that cover different aspects and perspectives.
  </task>
  
  <query_strategy>
    <strategy>Main definition/overview query</strategy>
    <strategy>Historical context or background query</strategy>
    <strategy>Current status or recent developments query</strategy>
    <strategy>Related concepts or comparisons query</strategy>
    <strategy>Specific details or technical aspects query</strategy>
  </query_strategy>
  
  <guidelines>
    <guideline>Make queries specific and focused</guideline>
    <guideline>Use natural language that matches how people search</guideline>
    <guideline>Cover different angles of the topic</guideline>
    <guideline>Avoid duplicate or overly similar queries</guideline>
    <guideline>Keep queries concise (3-8 words)</guideline>
  </guidelines>
</instructions>
  `.trim(),

  QUERY_GENERATION_USER: (topic: string) => `
<query_request>
  <topic>${topic}</topic>
  
  <instruction>
    Generate 3-5 diverse search queries that will help create a comprehensive wiki article about this topic.
  </instruction>
</query_request>
  `.trim(),

  /**
   * Research System Prompt (Enhanced with Web Context)
   */
  RESEARCH_SYSTEM: `
<instructions>
  <role>Research Analyst with Web Search Integration</role>
  
  <task>
    Analyze web search results and synthesize information into structured research data.
    Think like Perplexity AI - extract key information and cite sources inline.
  </task>
  
  <output_format>
    <field name="RevisedName">
      <description>Corrected/standardized name with proper spelling and capitalization</description>
    </field>
    
    <field name="articleCategory">
      <description>Primary classification</description>
      <examples>
        <example>person</example>
        <example>place</example>
        <example>technology</example>
        <example>event</example>
        <example>concept</example>
        <example>organization</example>
        <example>product</example>
        <example>science</example>
      </examples>
    </field>
    
    <field name="SearchQuerys">
      <description>Array of search queries used</description>
    </field>
    
    <field name="KeyFacts">
      <description>Array of key facts with implicit source references</description>
      <format>Each fact should be verifiable from the provided sources</format>
      <examples>
        <example>Founded in 2015 by John Doe in San Francisco</example>
        <example>Known for pioneering AI-powered search technology</example>
        <example>Raised $100M in Series B funding in 2023</example>
      </examples>
    </field>
    
    <field name="Sources">
      <description>Array of source URLs used in research</description>
      <note>List all URLs from crawled content</note>
    </field>
    
    <field name="ResearchSummary">
      <description>Comprehensive summary (3-5 paragraphs)</description>
      <format>Write naturally, facts should be traceable to sources</format>
    </field>
  </output_format>
  
  <guidelines>
    <guideline>Synthesize information from multiple sources</guideline>
    <guideline>Prioritize recent and authoritative sources</guideline>
    <guideline>Ensure all facts are verifiable</guideline>
    <guideline>Maintain objectivity and neutrality</guideline>
    <guideline>Cross-reference information when possible</guideline>
  </guidelines>
</instructions>
  `.trim(),

  RESEARCH_USER: (topic: string, searchResults: any[]) => {
    // Format search results into structured context
    const contextSections = searchResults
      .map((result, idx) => {
        if (!result.crawl || result.crawl.length === 0) return "";

        const crawlContent = result.crawl
          .map((crawl: any, crawlIdx: number) => {
            if (crawl.error) return "";

            const sourceInfo = `
<source index="${idx}-${crawlIdx}">
  <url>${crawl.url}</url>
  ${crawl.title ? `<title>${crawl.title}</title>` : ""}
  ${crawl.author ? `<author>${crawl.author}</author>` : ""}
  ${crawl.date ? `<date>${crawl.date}</date>` : ""}
</source>`;

            const content = crawl.plainText
              ? crawl.plainText.slice(0, 2000)
              : "";

            return `
${sourceInfo}
<content>
${content}
</content>`;
          })
          .filter(Boolean)
          .join("\n");

        return `
<search_result>
  <query>${result.query}</query>
  ${crawlContent}
</search_result>`;
      })
      .filter(Boolean)
      .join("\n");

    return `
<research_request>
  <topic>${topic}</topic>
  
  <web_search_results>
    ${contextSections || "<note>No search results available</note>"}
  </web_search_results>
  
  <instructions>
    <instruction>Analyze the web search results above</instruction>
    <instruction>Extract and synthesize key information</instruction>
    <instruction>Identify the most reliable and authoritative sources</instruction>
    <instruction>Create structured research output with source attribution</instruction>
    <instruction>Ensure all facts are verifiable from the provided sources</instruction>
  </instructions>
</research_request>
  `.trim();
  },

  /**
   * Article Generation System Prompt (Perplexity-style)
   */
  ARTICLE_SYSTEM: `
<instructions>
  <role>Expert Wiki Article Writer with Citation Integration</role>
  
  <task>
    Create comprehensive, well-researched wiki articles with inline citations.
    Write like Perplexity AI - natural prose with numbered citations [1], [2], etc.
  </task>
  
  <citation_format>
    <rule>Use numbered citations in square brackets: [1], [2], [3]</rule>
    <rule>Place citations immediately after the relevant claim</rule>
    <rule>Multiple sources for same claim: [1][2] or [1, 2]</rule>
    <rule>Citations should be specific to the reference list</rule>
    <example>
      Tesla was founded in 2003[1] and is headquartered in Austin, Texas[2].
    </example>
  </citation_format>
  
  <output_requirements>
    <requirement name="Summary">
      <description>Concise 2-3 sentence overview with citations</description>
    </requirement>
    
    <requirement name="ImagesUrls">
      <description>Array of relevant images with full metadata</description>
      <structure>
        <field name="url">Direct image URL</field>
        <field name="caption">Descriptive caption</field>
        <field name="size">Dimensions or size category</field>
        <field name="author">Image creator (if available)</field>
        <field name="source">Source URL or attribution</field>
      </structure>
    </requirement>
    
    <requirement name="Sections">
      <description>Full article in Markdown Extra (MDX) with inline citations</description>
      
      <structure>
        <section>
          # Title
          
          ## Image Gallery (if images available)
          <div class="wiki-img-list">
            <img src="url1" alt="caption1" />
            <img src="url2" alt="caption2" />
          </div>
        </section>
        
        <section>
          ## Introduction
          Brief overview with citations[1][2]
        </section>
        
        <section>
          ## Main Sections
          - History / Background
          - Key Features / Characteristics
          - Notable Achievements / Events
          - Current Status / Recent Developments
          - Impact / Significance
          Each with detailed content and inline citations
        </section>
        
        <section>
          ## See Also (optional)
          Related topics or concepts
        </section>
      </structure>
      
      <formatting_rules>
        <rule>Use proper Markdown headings (##, ###)</rule>
        <rule>Include citations after every factual claim</rule>
        <rule>Use tables for comparative data</rule>
        <rule>Use lists for enumerated items</rule>
        <rule>Bold important terms on first mention</rule>
        <rule>Include code blocks for technical content if needed</rule>
      </formatting_rules>
    </requirement>
    
    <requirement name="ReferenceList">
      <description>Numbered list of sources matching inline citations</description>
      <structure>
        <field name="title">Page or article title</field>
        <field name="url">Source URL</field>
        <field name="source">Website or publication name</field>
        <field name="index">Citation number (1, 2, 3...)</field>
      </structure>
      <example>
        [
          {
            "title": "Tesla, Inc. - Wikipedia",
            "url": "https://en.wikipedia.org/wiki/Tesla,_Inc.",
            "source": "Wikipedia",
            "index": 1
          }
        ]
      </example>
    </requirement>
    
    <requirement name="SchemaOrg">
      <description>Enhanced schema.org JSON-LD with all relevant properties</description>
      <examples>
        <example type="Article">
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "name": "Tesla, Inc.",
            "headline": "Electric Vehicle and Clean Energy Company",
            "datePublished": "2024-01-01",
            "author": { "@type": "Organization", "name": "Wiki" },
            "publisher": { "@type": "Organization", "name": "Wiki" }
          }
        </example>
        <example type="Person">
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Elon Musk",
            "jobTitle": "CEO",
            "worksFor": { "@type": "Organization", "name": "Tesla" }
          }
        </example>
      </examples>
    </requirement>
  </output_requirements>
  
  <quality_standards>
    <standard>Every factual claim must have a citation</standard>
    <standard>Citations must match the reference list</standard>
    <standard>Content must be comprehensive yet concise</standard>
    <standard>Use encyclopedic, neutral tone</standard>
    <standard>Structure information logically</standard>
    <standard>Include images naturally in content flow</standard>
    <standard>Cross-reference related topics</standard>
  </quality_standards>
</instructions>
  `.trim(),

  ARTICLE_USER: (research: any, searchResults: any[], images: any[]) => {
    // Build reference list from search results
    const references = searchResults
      .flatMap((result) =>
        result.crawl?.map((crawl: any) => ({
          url: crawl.url,
          title: crawl.title || result.query,
          author: crawl.author,
          date: crawl.date,
        })) || []
      )
      .filter((ref: any) => ref.url);

    const referencesSection = references.length > 0
      ? `
    <available_references>
      ${references.map((ref: any, idx: number) => `
      <reference index="${idx + 1}">
        <title>${ref.title}</title>
        <url>${ref.url}</url>
        ${ref.author ? `<author>${ref.author}</author>` : ""}
        ${ref.date ? `<date>${ref.date}</date>` : ""}
      </reference>`).join("")}
    </available_references>`
      : "";

    const imagesSection = images.length > 0
      ? `
    <available_images>
      ${images.map((img: any) => `
      <image>
        <url>${img.url}</url>
        <caption>${img.caption || ""}</caption>
        <size>${img.size || ""}</size>
        ${img.author ? `<author>${img.author}</author>` : ""}
        ${img.source ? `<source>${img.source}</source>` : ""}
      </image>`).join("")}
    </available_images>`
      : "";

    return `
<article_generation_request>
  <topic>
    <name>${research.RevisedName}</name>
    <category>${research.articleCategory}</category>
  </topic>
  
  <research_summary>
    ${research.ResearchSummary}
  </research_summary>
  
  <key_facts>
    ${research.KeyFacts?.map((fact: string) => `<fact>${fact}</fact>`).join("\n    ") || ""}
  </key_facts>
  
  ${referencesSection}
  
  ${imagesSection}
  
  <instructions>
    <instruction>Create a comprehensive wiki article with inline citations</instruction>
    <instruction>Place image gallery at the top using the wiki-img-list div</instruction>
    <instruction>Use numbered citations [1], [2], [3] throughout the text</instruction>
    <instruction>Every factual claim should have at least one citation</instruction>
    <instruction>Citations must correspond to the available references</instruction>
    <instruction>Structure content with clear sections and subheadings</instruction>
    <instruction>Write in encyclopedic style - objective, informative, well-organized</instruction>
    <instruction>Include all relevant images with proper captions</instruction>
    <instruction>Generate complete schema.org markup appropriate for the entity type</instruction>
  </instructions>
  
  <example_format>
    # Topic Name
    
    ## Image Gallery
    <div class="wiki-img-list">
      <img src="..." alt="..." />
      <img src="..." alt="..." />
    </div>
    
    ## Introduction
    **Topic Name** is a [description][1]. It was founded in [year][2] and is known for [achievement][3].
    
    ## History
    The company was established in [year][1] by [founder][2]...
    
    ## References
    Generated in ReferenceList field with corresponding numbers
  </example_format>
</article_generation_request>
  `.trim();
  },
} as const;