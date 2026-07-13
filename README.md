# B2B Rizz - Resources site (resources.b2brizz.com)

A static site (plain HTML) for publishing SEO articles independently of the main Statamic site.

## Structure
- index.html ............................ landing page (lists articles)
- top-6-linkedin-ads-agencies-b2b-saas/ . the article (clean URL, no .html)
- assets/ ............................... shared stylesheet, fonts, logo, mascot
- robots.txt ............................ allows all crawlers incl. AI engines
- sitemap.xml ........................... for Google Search Console
- netlify.toml .......................... hosting config

## Deploy
Two options (see chat for step-by-step):
1. Netlify drag-and-drop: drag this whole folder onto app.netlify.com/drop
2. GitHub + Netlify: push this folder to a repo, connect it in Netlify (auto-deploys on push)

Then in Netlify: add custom domain `resources.b2brizz.com`, and in GoDaddy add the
CNAME record Netlify gives you.

## Before promoting the article
Fill in the real copy for agencies #2-#6 (currently only the one-line overview is in place).
