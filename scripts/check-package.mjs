import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const walk=(root)=>fs.readdirSync(root,{withFileTypes:true}).flatMap(e=>e.name==='.git'||e.name==='node_modules'?[]:e.isDirectory()?walk(path.join(root,e.name)):[path.join(root,e.name)]);
const files=walk('.');
for(const file of files){
 assert.ok(!/(?:^|\/)(?:research|local-backups|\.openai|assets|branding)(?:\/|$)/.test(file),'Excluded private/media directory: '+file);
 assert.ok(!/\.(?:png|jpe?g|webp|gif|mp4|zip|bundle|woff2?|ttf|html?\.raw)$/i.test(file),'Unreviewed binary: '+file);
 assert.ok(!/(?:^|\/)\.env(?:\.|$)/.test(file),'Private configuration: '+file);
 const body=fs.readFileSync(file,'utf8');
 // Keep detected values out of logs. Report the offending path only.
 assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[A-Z0-9]{16}/.test(body),'Secret signature: '+file);
 if(!file.endsWith('check-package.mjs')){
  assert.ok(!/\/(?:Users|home)\/[A-Za-z0-9_-]+\/|chan_[A-Za-z0-9]+|cmsg_[A-Za-z0-9]+/.test(body),'Private path or task identifier: '+file);
  assert.ok(!/fetch\s*\(|sendBeacon\s*\(|XMLHttpRequest|@import\s+url/i.test(body),'Unexpected external request or image: '+file);
 }
}
assert.ok(fs.existsSync('LICENSE')&&fs.existsSync('RIGHTS.md')&&fs.existsSync('README.md'));
const html=files.filter(f=>f.startsWith('dist/')&&f.endsWith('.html'));
assert.ok(html.length>15,'Build must include real tool, guide and detail routes.');
for(const f of html){
 const text=fs.readFileSync(f,'utf8');
 assert.match(text,/noindex/i,'Source demo must stay noindex: '+f);
 assert.match(text,/fictional|synthetic/i,'Missing catalogue demo notice: '+f);
 for(const match of text.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)){
  const href=match[1].replaceAll('&amp;','&');if(/^(?:https?:|mailto:|data:)/.test(href))continue;
  const clean=href.split(/[?#]/)[0];if(!clean)continue;
  const target=path.join('dist',clean);
  assert.ok(fs.existsSync(target.endsWith('/')?target+'index.html':target),'Broken local target '+clean+' in '+f);
 }
}
for(const f of files.filter(f=>/^(?:src|dist)\/.*\.(?:mjs|js)$/.test(f))){
 const text=fs.readFileSync(f,'utf8');
 for(const m of text.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))assert.ok(fs.existsSync(path.resolve(path.dirname(f),m[1])),'Missing module dependency in '+f);
}
console.log(`Public package check passed: ${files.length} text files, ${html.length} HTML outputs; no bundled research/media, secret signatures or broken local targets.`);
