import test from 'node:test';
import assert from 'node:assert/strict';
import {rods,fish,groups,meta} from '../src/data.mjs';
import {planUpgrade,compareRods,encodeState,decodeState} from '../src/planner.mjs';
import {manualDifference,encodeManualState,decodeManualState} from '../src/manual-comparison.mjs';
import {toggleFavorite,setCollection,readSaved,writeSaved} from '../src/storage.mjs';
import {exportGoals,importGoals,parseGoalBackup} from '../src/goal-backup.mjs';
const input={currentId:'demo-starter',budget:1500,reserve:200,goal:'luck',ownedIds:[],unlockedIds:[],includeCommunity:true,minWeight:0};
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};};
test('budget reserve, locked shop and full purchase cost are respected',()=>{
 const result=planUpgrade(rods,input);
 assert.deepEqual(result.options.map(x=>x.rod.id),['demo-harbor']);
 assert.equal(result.options[0].remaining,900);
 assert.equal(result.saving.rod.id,'demo-cove');assert.equal(result.saving.gap,100);
 assert.ok(result.excluded.some(x=>x.id==='demo-gated'&&x.reason==='Unlock or stock not confirmed'));
 const unlocked=planUpgrade(rods,{...input,unlockedIds:['demo-shop']});
 assert.equal(unlocked.options[0].rod.id,'demo-gated');
});
test('fictional data never satisfies strict current evidence',()=>{
 assert.equal(meta.currentVersion,null);
 const result=planUpgrade(rods,{...input,includeCommunity:false});assert.equal(result.options.length,0);
 assert.ok(result.excluded.some(x=>x.reason==='Current purchase evidence not verified'));
});
test('comparison keeps separate trade-offs and unknown capacity',()=>{
 const result=compareRods([rods[1],rods[2]]);
 assert.equal(result.rows.find(x=>x.key==='speed').deltas[1],-2);
 assert.equal(result.rows.find(x=>x.key==='luck').deltas[1],15);
 const missing=structuredClone(rods[2]);missing.fields.weight.value=null;
 assert.equal(compareRods([rods[1],missing]).rows.find(x=>x.key==='weight').deltas[1],null);
 assert.throws(()=>planUpgrade(rods,{...input,budget:-1}));
});
test('planner and manual sharing restore only bounded values',()=>{
 const query=encodeState({rod:'demo-harbor',budget:800,reserve:100,goal:'speed',reference:true});
 assert.equal(decodeState('?'+query,rods).currentId,'demo-harbor');
 assert.equal(decodeState('?budget=Infinity&rod=unknown',rods).budget,1500);
 assert.equal(manualDifference('',20),null);assert.equal(manualDifference(50,55),5);
 const state=encodeManualState('rods',{'a-luck':'50','b-luck':'55'},{price:'Coins'});
 const restored=decodeManualState('?manual='+encodeURIComponent(state),'rods');
 assert.equal(restored.values['b-luck'],'55');
});
test('goals persist, merge without losing progress, and reject malformed imports',()=>{
 const a=memory(),b=memory();toggleFavorite(a,'rods:demo-harbor');setCollection(a,'fish:'+fish[0].id,'wanted');
 const backup=exportGoals(a);setCollection(b,'fish:'+fish[0].id,'caught');importGoals(b,backup);
 assert.deepEqual(readSaved(b).favorites,['rods:demo-harbor']);
 assert.equal(readSaved(b).collection['fish:'+fish[0].id],'caught');
 assert.throws(()=>parseGoalBackup('{"format":"fish-it-goals","version":1,"favorites":["../bad"],"collection":{}}'));
 assert.equal(writeSaved({getItem:()=>'{bad',setItem:()=>assert.fail('must preserve malformed storage')},{}),false);
});
test('fixtures are synthetic and exclude current/third-party asset assertions',()=>{
 for(const rows of Object.values(groups))for(const row of rows){assert.equal(row.demo,true);assert.equal(row.image,null);assert.equal(row.verifiedAt,null);assert.equal(row.version,null);assert.match(row.id,/^demo-/);}
});
