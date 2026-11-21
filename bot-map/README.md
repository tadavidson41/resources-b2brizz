# Live Bot Map (/bot-map/)

Private, unlisted live map of Tim's Grok Bot fleet.

- Map: https://resources.b2brizz.com/bot-map/
- Cards: https://resources.b2brizz.com/bot-map/list.html
- Files here: index.html (map), list.html (cards), app.js, app.css. Static, no build.
- Not indexed: noindex meta tag on both pages, X-Robots-Tag header in netlify.toml
  for /bot-map/*, and a robots.txt Disallow for /bot-map/. Not in sitemap.xml.

## Live feed (no redeploys)
The page reads status.json from a secret GitHub Gist (id c2b47c2bd17738ccf5d7b5aa10207ba4), not from this
repo, so feed updates never trigger a Netlify deploy. It fetches
gist.githubusercontent.com/.../raw/status.json with a cache-busting query every
60s and falls back to the Gist API. The feed holds only bot names, cluster,
a one-sentence role, last-active time, 24h event count and a generic status label.
No message text.

## Refresher (runs on the Grok Bot box)
/workspace/bot-map/refresher.py rebuilds status.json every 90s from bot profiles and
message timestamps only, skips unchanged uploads, and publishes at least every 10 min.
Cluster mapping: /workspace/bot-map/clusters.json (edit it; picked up next cycle).

Restart command (run on the box):

    pkill -f /workspace/bot-map/refresher.py; nohup setsid python3 /workspace/bot-map/refresher.py >> /workspace/bot-map/refresher.log 2>&1 < /dev/null &

Check it: `pgrep -af bot-map/refresher.py` and `tail /workspace/bot-map/refresher.log`.
If the page's LIVE badge says STALE, the refresher stopped (for example after a box restart). Run the restart command.
