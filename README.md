# B2B Rizz - Resources site (resources.b2brizz.com)

A static site (plain HTML) for publishing SEO articles independently of the main Statamic site.

## Structure
- index.html ............................ landing page (lists articles)
- top-6-linkedin-ads-agencies-b2b-saas/ . the article (clean URL, no .html)
- tme-waitlist/ ......................... The Marketer's Exit community waitlist
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

## Waitlist form
`/tme-waitlist/` is a self-contained static page. Its form is named `waitlist`
(`data-netlify="true"`, hidden `form-name`, honeypot `bot-field`) and submits
with `fetch` POST to `/`. Because `publish = "."` and there is no build step,
that form is in the HTML Netlify deploys, which is what form detection scans.
After a deploy, submissions show up in the Netlify site dashboard under Forms
(and in the form notification email, if one is set). If the form does not
appear there, turn form detection on under Site configuration → Forms and
redeploy.

## Before promoting the article
Fill in the real copy for agencies #2-#6 (currently only the one-line overview is in place).
