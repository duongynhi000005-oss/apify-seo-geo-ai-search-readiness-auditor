import { Actor } from 'apify';
import * as cheerio from 'cheerio';

await Actor.init();

const input = (await Actor.getInput()) || {};
const startUrls = Array.isArray(input.startUrls) && input.startUrls.length > 0
    ? input.startUrls
    : [{ url: 'https://apify.com' }];

async function fetchStatusAndText(url, timeoutMs = 10000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: ctrl.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEO-GEO-AI-Auditor/1.0)' }
        });
        return { ok: res.ok, status: res.status, text: res.ok ? await res.text() : '' };
    } catch {
        return { ok: false, status: 0, text: '' };
    } finally {
        clearTimeout(timer);
    }
}

for (const item of startUrls) {
    const rawUrl = typeof item === 'string' ? item : item?.url;
    if (!rawUrl) continue;
    const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        continue;
    }

    const origin = parsed.origin;
    const [pageRes, robotsRes, llmsRes, sitemapRes] = await Promise.all([
        fetchStatusAndText(url, 12000),
        fetchStatusAndText(`${origin}/robots.txt`, 6000),
        fetchStatusAndText(`${origin}/llms.txt`, 6000),
        fetchStatusAndText(`${origin}/sitemap.xml`, 6000)
    ]);

    const $ = cheerio.load(pageRes.text || '');
    const title = $('title').first().text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const canonical = $('link[rel="canonical"]').attr('href') || null;
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const totalImages = $('img').length;
    const imagesMissingAlt = $('img:not([alt]), img[alt=""]').length;

    const schemaTypes = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const d = JSON.parse($(el).html() || '{}');
            const nodes = Array.isArray(d) ? d : (d['@graph'] || [d]);
            for (const n of nodes) {
                if (n && n['@type']) schemaTypes.push(n['@type']);
            }
        } catch {}
    });

    const robotsTxt = robotsRes.text || '';
    const blocksGptBot = /User-agent:\s*GPTBot[\s\S]*?Disallow:\s*\/\s*$/im.test(robotsTxt);
    const blocksClaudeBot = /User-agent:\s*ClaudeBot[\s\S]*?Disallow:\s*\/\s*$/im.test(robotsTxt);
    const blocksPerplexity = /User-agent:\s*PerplexityBot[\s\S]*?Disallow:\s*\/\s*$/im.test(robotsTxt);

    const issues = [];
    if (!title) issues.push('Missing <title> tag');
    else if (title.length < 15 || title.length > 70) issues.push(`Suboptimal title length (${title.length} chars)`);
    if (!metaDesc) issues.push('Missing meta description');
    if (!canonical) issues.push('Missing canonical link tag');
    if (h1Count === 0) issues.push('Missing H1 heading');
    if (h1Count > 1) issues.push(`Multiple H1 headings found (${h1Count})`);
    if (imagesMissingAlt > 0) issues.push(`${imagesMissingAlt}/${totalImages} images missing alt attributes`);
    if (!llmsRes.ok) issues.push('Missing /llms.txt for AI Search / GEO agents');

    const seoScore = Math.max(
        0,
        100 -
        (!title ? 20 : 0) -
        (!metaDesc ? 15 : 0) -
        (!canonical ? 10 : 0) -
        (h1Count !== 1 ? 10 : 0) -
        (schemaTypes.length === 0 ? 15 : 0) -
        (!sitemapRes.ok ? 10 : 0) -
        (!llmsRes.ok ? 10 : 0)
    );

    await Actor.pushData({
        url,
        domain: parsed.hostname,
        httpStatus: pageRes.status,
        seoAndGeoScore: seoScore,
        title,
        titleLength: title.length,
        metaDescription: metaDesc,
        metaDescriptionLength: metaDesc.length,
        canonicalUrl: canonical,
        h1Count,
        h2Count,
        totalImages,
        imagesMissingAlt,
        schemaOrgTypes: schemaTypes,
        hasSitemapXml: sitemapRes.ok,
        hasRobotsTxt: robotsRes.ok,
        hasLlmsTxt: llmsRes.ok,
        aiCrawlerAccess: {
            gptBotAllowed: !blocksGptBot,
            claudeBotAllowed: !blocksClaudeBot,
            perplexityBotAllowed: !blocksPerplexity
        },
        auditIssues: issues,
        scrapedAt: new Date().toISOString()
    });
}

await Actor.exit();
