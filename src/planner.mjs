import {hasDirectPriceReference} from './direct-price-reference.mjs';
import {currentFieldEvidence,currentPurchaseEvidence,currentBaselineEvidence} from './current-evidence.mjs';
/** @template {{itemKind?:string,includeInEquipmentTools?:boolean}} T @param {T[]} items */
export const comparableRods=items=>items.filter(item=>item.itemKind!=='cosmetic-reference'&&item.itemKind!=='identity-reference'&&item.includeInEquipmentTools!==false);
export const MAX_COINS=1e12;
/** @param {import('./types.js').Rod} rod */
const knownPrice=rod=>{if(rod.fields.price.value===null)throw new Error('Price not verified.');return rod.fields.price.value;};
/** @param {import('./types.js').Rod[]} catalogue @param {import('./types.js').PlannerInput} input @param {import('./types.js').EvidenceContext} evidenceContext */
export function planUpgrade(catalogue,input,evidenceContext={}){
 catalogue=comparableRods(catalogue);
 const {currentId,budget,reserve=0,goal='luck',ownedIds=[],unlockedIds=[],includeCommunity=false,minWeight=0}=input;
 if(!['luck','speed','weight'].includes(goal))throw new Error('Choose a listed attribute.');
 if(![budget,reserve,minWeight].every(x=>Number.isFinite(x)&&x>=0&&x<=MAX_COINS))throw new Error('Enter a number from 0 to 1,000,000,000,000.');
 if(!Array.isArray(ownedIds)||!Array.isArray(unlockedIds))throw new Error('Invalid ownership or unlock selection.');
 const rodIds=new Set(catalogue.map(r=>r.id)),unlockIds=new Set(catalogue.flatMap(r=>r.requirements.map(q=>q.id)));
 if(ownedIds.some(id=>!rodIds.has(id))||unlockedIds.some(id=>!unlockIds.has(id)))throw new Error('Choose listed ownership and unlock options.');
 if(typeof includeCommunity!=='boolean')throw new Error('Invalid reference-data selection.');
 const current=catalogue.find(r=>r.id===currentId);if(!current)throw new Error('Choose your current rod.');
 if(current.fields[goal].status==='conflicting')throw new Error('The current rod’s selected attribute is disputed. Check its sources before using it as a planning baseline.');
 const spendable=Math.max(0,budget-reserve),excluded=[],valid=[];
 for(const r of catalogue){let reason;
  if(r.id===currentId||ownedIds.includes(r.id))reason='Already owned';
  else if(r.availability==='unobtainable')reason='No longer obtainable';
  else if(r.currency!=='coins')reason='Different currency';
  else if(r.fields.price.unit!=='coins'||r.fields.weight.unit!=='kg'||r.fields[goal].unit!==current.fields[goal].unit)reason='Different or unverified units';
  else if(r.acquisition==='quest'||r.acquisition==='reward')reason='Separate quest or reward';
  else if(r.fields.price.value===null)reason='Price not verified';
  else if(r.requirements.some(q=>!unlockedIds.includes(q.id)))reason='Unlock or stock not confirmed';
  else if(r.status==='conflicting'||['price',goal,'weight'].some(k=>r.fields[k].status==='conflicting'))reason='Source conflict';
  else if(!includeCommunity&&!currentPurchaseEvidence(r,evidenceContext).confirmed)reason='Current purchase evidence not verified';
  else if(!includeCommunity&&[goal,'weight'].some(k=>!currentFieldEvidence(r,k,evidenceContext).confirmed))reason='Current game data not verified';
  else if(r.fields[goal].value===null||current.fields[goal].value===null||r.fields.weight.value===null)reason='Comparison value not verified';
  else if(!includeCommunity&&!currentBaselineEvidence(current,goal,evidenceContext).confirmed)reason='Current rod baseline not verified';
  else if(r.fields.weight.value<minWeight)reason='Below required capacity';
  else if(r.fields[goal].value<=current.fields[goal].value)reason='No improvement in selected attribute';
  if(reason)excluded.push({id:r.id,name:r.name,reason});else valid.push(r);
 }
 const ranked=valid.filter(r=>knownPrice(r)<=spendable).sort((a,b)=>b.fields[goal].value-a.fields[goal].value||knownPrice(a)-knownPrice(b)||a.id.localeCompare(b.id));
 const saving=valid.filter(r=>knownPrice(r)>spendable).sort((a,b)=>knownPrice(a)-knownPrice(b)||a.id.localeCompare(b.id))[0]??null;
 const options=ranked.slice(0,3).map(r=>({rod:r,remaining:budget-knownPrice(r),gap:0,changes:Object.fromEntries(compareRods([current,r]).rows.filter(row=>row.key!=='price').map(row=>[row.key,!includeCommunity&&(!currentBaselineEvidence(current,row.key,evidenceContext).confirmed||!currentFieldEvidence(r,row.key,evidenceContext).confirmed)?null:row.deltas[1]]))}));
 return {current,spendable,options,saving:saving?{rod:saving,gap:saving.fields.price.value-spendable}:null,excluded,referenceOnly:includeCommunity};
}
/** @param {import('./types.js').Rod[]} list */
export function compareRods(list){
 if(!Array.isArray(list)||list.length<2||list.length>3)throw new Error('Choose two or three rods.');
 if(list.some(r=>r.itemKind==='cosmetic-reference'))throw new Error('Skins are excluded from equipment stat comparison.');
 if(list.some(r=>r.itemKind==='identity-reference'||r.includeInEquipmentTools===false))throw new Error('Unresolved item references are excluded from equipment stat comparison.');
 const keys=/** @type {('price'|'luck'|'speed'|'weight')[]} */ (['price','luck','speed','weight']);
 const rows=keys.map(key=>{
  const fields=list.map(r=>r.fields[key]);
  const units=fields.map(f=>f.unit);
  const values=fields.map(f=>f.value);
  const priceApplicable=r=>hasDirectPriceReference(r)&&r.fields.pricingMode?.status!=='conflicting'&&r.fields.pricingMode?.value!=='not-directly-sold';
  const comparable=fields.map((f,i)=>units[i]===units[0]&&(key!=='price'||(list[i].currency===list[0].currency&&priceApplicable(list[i])&&priceApplicable(list[0])))&&Number.isFinite(f.value)&&Number.isFinite(fields[0].value)&&f.status!=='conflicting'&&fields[0].status!=='conflicting');
  return {key,unit:fields[0].unit,units,values,comparable,different:values.some((v,i)=>v!==values[0]||units[i]!==units[0]||fields[i].status!==fields[0].status||(key==='price'&&list[i].currency!==list[0].currency)),deltas:values.map((v,i)=>comparable[i]?Number(v)-Number(values[0]):null)};
 });
 return {same:list.every(r=>r.id===list[0].id),rows};
}
export function encodeState(input){const p=new URLSearchParams();for(const [k,v] of Object.entries(input)){if(v!==''&&v!==null&&v!==undefined)p.set(k,Array.isArray(v)?v.join(','):String(v));}return p.toString();}
export function decodeState(search,catalogue){catalogue=comparableRods(catalogue);const p=new URLSearchParams(search);const ids=new Set(catalogue.map(r=>r.id)),unlocks=new Set(catalogue.flatMap(r=>r.requirements.map(q=>q.id)));const currentId=ids.has(p.get('rod'))?p.get('rod'):catalogue[0].id;const validNum=(key,fallback=0)=>{if(!p.has(key))return fallback;const n=Number(p.get(key));return Number.isFinite(n)&&n>=0&&n<=MAX_COINS?n:fallback;};return {currentId,budget:validNum('budget',1500),reserve:validNum('reserve'),minWeight:validNum('weight'),goal:['luck','speed','weight'].includes(p.get('goal')??'')?p.get('goal'):'luck',ownedIds:(p.get('owned')??'').split(',').filter(x=>ids.has(x)),unlockedIds:(p.get('unlocks')??'').split(',').filter(x=>unlocks.has(x)),includeCommunity:p.get('reference')==='true'};}
