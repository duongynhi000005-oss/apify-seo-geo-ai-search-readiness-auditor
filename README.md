# Technical SEO, Schema.org & AI Search (GEO / llms.txt) Auditor

Audits websites for Google SEO and AI Search (GEO: ChatGPT, Perplexity, Claude). Checks Title, Meta, Canonical, H1/H2, Schema.org JSON-LD, sitemap.xml, /llms.txt, and robots.txt AI crawler rules (GPTBot, ClaudeBot, PerplexityBot).

## Why Use Technical SEO, Schema.org & AI Search (GEO / llms.txt) Auditor?
- **Production-Grade & Zero Maintenance**: Built specifically for automated workflows in **n8n, Make.com, Zapier, Clay, LangChain, and MCP servers**.
- **Pay-Per-Event (PPE) Transparent Pricing**: Only **$0.004 per enriched result** (`$4.00 per 1,000 results`) with structured JSON, CSV, and Excel export.
- **Fast & Lightweight**: Uses high-concurrency HTTP parsing and structured JSON-LD / API discovery without expensive headless browser overhead.

## Key Features
1. **Deep Structured Extraction**: Automatically normalizes every output record against a strict dataset schema.
2. **Plug-and-Play API & Webhook Integration**: Call directly via `POST https://api.apify.com/v2/acts/huynguyen-data-cloud~seo-geo-ai-search-readiness-auditor/run-sync-get-dataset-items`.
3. **Built-in Data Hygiene**: Deduplicates records, filters false positives, and computes actionable scoring metrics.

## Quick Start (cURL / API)
```bash
curl -X POST "https://api.apify.com/v2/acts/huynguyen-data-cloud~seo-geo-ai-search-readiness-auditor/run-sync-get-dataset-items?token=YOUR_APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startUrls": [{"url": "https://apify.com"}]}'
```
