import {execFileSync} from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import {guides} from '../src/data.mjs';
import {guideHtml,guidePage,pageDefinitions} from '../src/views.mjs';
test('retained guides distinguish real historical summaries from demo walkthroughs',()=>{
 assert.equal(guides.length,73);assert.equal(new Set(guides.map(g=>g.id)).size,73);
 const game=guides.filter(g=>g.kind==='game-guide');assert.equal(game.length,68);
 for(const guide of game){assert.equal(guide.historical,true);assert.equal(guide.verifiedAt,null);assert.equal(guide.version,null);assert.ok(guide.sources.length);assert.ok(guide.sections.length>=3);assert.match(guidePage(guide),/Dated reference, not current-game verification/);}
 const ghost=guides.find(g=>g.id==='ghostfinn-quest-reference');
 assert.match(ghost.sections.map(s=>s[1]).join(' '),/300 Rare\/Epic/);
 assert.match(ghost.sections.map(s=>s[1]).join(' '),/not yet verified/);
});
test('guide renderer keeps lists and attribution but rejects executable markup',()=>{
 const rendered=guideHtml('<ol onclick="bad()"><li>Step</li></ol><script>bad()</script><a href="javascript:bad()" onfocus="bad()">Unsafe</a><a href="https://example.org/source">Source</a>');
 assert.match(rendered,/<ol><li>Step<\/li><\/ol>/);assert.ok(!/<script|onclick=|onfocus=|href="javascript:/.test(rendered));assert.match(rendered,/href="https:\/\/example.org\/source"/);
 const pages=pageDefinitions();assert.equal(new Set(pages.map(p=>p.route)).size,pages.length);
 assert.ok(pages.find(p=>p.route==='/').html.includes('/guides/ghostfinn-quest-reference/'));
});

test('browser entry imports resolve and initialize with no page-specific controls',()=>{
 execFileSync(process.execPath,['--input-type=module','-e',`globalThis.document={getElementById:()=>null,querySelectorAll:()=>[],addEventListener(){}};globalThis.window={addEventListener(){}};globalThis.localStorage={getItem:()=>null,setItem(){}};await import('./src/client.mjs');`],{cwd:process.cwd(),stdio:'pipe'});
});
