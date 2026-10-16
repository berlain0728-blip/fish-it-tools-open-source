import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pageDefinitions, syntheticNotice, esc} from './src/views.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
const pages = pageDefinitions();
const routes = new Set();
for (const page of pages) {
 if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*$/.test(page.route) || routes.has(page.route)) throw Error('Unsafe or duplicate route: ' + page.route);
 routes.add(page.route);
}
const navigation = [['/tools/rod-upgrade-planner/','Planner'], ['/tools/rod-comparison/','Compare rods'], ['/tools/gear-comparison/','Compare setups'], ['/search/','Collection'], ['/guides/','Guides'], ['/my-goals/','My goals']];

function render(page) {
 const description = 'Original tools with a fictional demo catalogue and clearly labelled historical game-guide references. Current game data is not verified.';
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(page.title)}</title><meta name="description" content="${description}"><meta name="robots" content="noindex,follow"><meta name="color-scheme" content="dark"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/style.css"><script type="module" src="/client.mjs"></script></head><body data-page="${esc(page.type)}"><a class="skip" href="#main">Skip to content</a><header><div class="topbar source-topbar"><a class="brand" href="/" aria-label="Tide Tools home"><svg class="logo" width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><path d="M3 13c5-7 8 7 13 0s8 7 13 0M3 21c5-7 8 7 13 0s8 7 13 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>TIDE <span>TOOLS</span></a><nav class="source-nav" aria-label="Main">${navigation.map(([href, label]) => `<a href="${href}"${page.route === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav></div></header><main id="main">${syntheticNotice}<noscript><div class="notice section">JavaScript is disabled. Collection records and walkthroughs remain readable; live calculations, filters and local goals need JavaScript.</div></noscript>${page.html}<p id="action-status" class="small section" role="status" aria-live="polite"></p></main><footer class="footer"><div>Tide Tools · Source edition.<br>Originally developed for Fish It! Independent of Fish Atelier and Roblox.</div><div class="footer-links"><a href="/about/">About, privacy &amp; content scope</a><a href="/guides/">Guides &amp; walkthroughs</a><a href="/my-goals/">Local goals &amp; backups</a></div></footer></body></html>`;
}

fs.rmSync(output, {recursive:true, force:true});
fs.mkdirSync(output, {recursive:true});
for (const page of pages) {
 const directory = path.join(output, page.route);
 fs.mkdirSync(directory, {recursive:true});
 fs.writeFileSync(path.join(directory, 'index.html'), render(page));
}
for (const entry of fs.readdirSync(path.join(root, 'src'), {withFileTypes:true})) {
 if (entry.isFile() && /\.(?:mjs|js|css)$/.test(entry.name)) fs.copyFileSync(path.join(root, 'src', entry.name), path.join(output, entry.name));
}
fs.writeFileSync(path.join(output, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#071923"/><path d="M3 13c5-7 8 7 13 0s8 7 13 0M3 21c5-7 8 7 13 0s8 7 13 0" fill="none" stroke="#4de0b3" stroke-width="2.4" stroke-linecap="round"/></svg>\n');
fs.copyFileSync(path.join(output, '404/index.html'), path.join(output, '404.html'));
fs.writeFileSync(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(output, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n');
fs.writeFileSync(path.join(output, '_headers'), '/*\n  X-Robots-Tag: noindex, follow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n');
console.log(`Built ${pages.length} source-edition routes. Fictional catalogue and dated guide references; no game assets, ads, analytics or indexing.`);
