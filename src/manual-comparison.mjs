const fields = [
  ['price', 'Purchase price', 'Coins'],
  ['luck', 'Listed luck', '%'],
  ['speed', 'Listed speed', '%'],
  ['weight', 'Capacity', 'kg'],
];

export function manualDifference(a, b) {
  const parse = raw => {
    if (raw === null || raw === undefined || String(raw).trim() === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 && n <= 1e12 ? n : null;
  };
  const left = parse(a), right = parse(b);
  return left === null || right === null ? null : Math.round((right - left) * 1e6) / 1e6;
}

const fieldsFor=mode=>mode==='gear'?[...fields.map(([key,label,unit])=>[key,'Rod '+label.toLowerCase(),unit]),['baitPrice','Bait purchase price','currency'],['baitLuck','Bait listed luck','%']]:fields;
const supportedCurrencies=['Coins','Robux','Candy','Tix'];
const currencyKeysFor=mode=>mode==='gear'?['price','baitPrice']:['price'];
export function manualComparisonRows(mode,values,currencies={}){return fieldsFor(mode).map(([key,label,unit])=>{const price=currencyKeysFor(mode).includes(key);const currency=currencies[key];const confirmed=!price||supportedCurrencies.includes(currency);const delta=confirmed?manualDifference(values['a-'+key],values['b-'+key]):null;const outputUnit=unit==='%'?'percentage points':price?currency:unit;const text=!confirmed?'Confirm the same currency on both cards':delta===null?'Enter both values to compare':delta===0?'No change':`${Math.abs(delta).toLocaleString('en-US',{maximumFractionDigits:6})} ${outputUnit} ${delta>0?'higher':'lower'}`;return {key,label,delta,text};});}

const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function normalizedManualState(mode,values,currencies={}){
 if(!['rods','gear'].includes(mode)||!isObject(values)||!isObject(currencies))return null;
 const allowed=fieldsFor(mode).flatMap(([key])=>['a-'+key,'b-'+key]);
 if(Object.keys(values).some(key=>!allowed.includes(key)))return null;
 const cleaned={};
 for(const key of allowed){
  const raw=values[key]??'';
  if(typeof raw!=='string'||raw.length>32)return null;
  if(raw.trim()===''){cleaned[key]='';continue;}
  if(!/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim()))return null;
  const number=Number(raw);if(!Number.isFinite(number)||number<0||number>1e12)return null;
  cleaned[key]=String(number);
 }
 const currencyKeys=currencyKeysFor(mode);
 if(Object.keys(currencies).some(key=>!currencyKeys.includes(key)))return null;
 const sameCurrency={};for(const key of currencyKeys){const value=currencies[key]??'';if(value!==''&&!supportedCurrencies.includes(value))return null;sameCurrency[key]=value;}
 return {version:2,mode,values:cleaned,currencies:sameCurrency};
}
export function encodeManualState(mode,values,currencies={}){
 const state=normalizedManualState(mode,values,currencies);if(!state)throw Error('Enter valid values before creating a link.');
 return JSON.stringify(state);
}
export function decodeManualState(search,mode){
 const raw=new URLSearchParams(search).get('manual');if(!raw||raw.length>4096)return null;
 try{
  const data=JSON.parse(raw);if(!isObject(data)||![1,2].includes(data.version)||data.mode!==mode)return null;
  // Old rod forms explicitly labelled prices Coins and did not serialize currency.
  // Preserve those links visibly; a new link without confirmation must stay unknown.
  const legacyCoins=data.version===1&&mode==='rods';
  if(legacyCoins&&data.currencies!==undefined&&(!isObject(data.currencies)||Object.keys(data.currencies).length))return null;
  const state=normalizedManualState(mode,data.values,legacyCoins?{price:'Coins'}:data.currencies);
  return state&&legacyCoins?{...state,legacyPriceCurrency:true}:state;
 }catch{return null;}
}

export function manualComparisonForm(mode='rods') {
 const gear=mode==='gear',selectedFields=fieldsFor(mode),sideLabel=gear?'Setup':'Rod';
  return `<details class="manual-comparison panel section"><summary>Have different numbers in your game? Compare your own values</summary><p>${gear?'Enter the rod and bait values shown on each setup’s cards.':'Enter the numbers shown on two rod cards.'} Confirm matching currency for each price pair; different currencies cannot be compared here. Leave anything you cannot confirm blank. Use the same units for the two cards; convert capacity to kg first.</p><form id="manual-compare-form" data-manual-mode="${mode}"><div class="manual-input-grid"><span aria-hidden="true">Attribute</span><strong>${sideLabel} A · current<span data-manual-name="a"></span></strong><strong>${sideLabel} B · candidate<span data-manual-name="b"></span></strong>${selectedFields.map(([key,label,unit])=>`<span class="manual-field-label">${label}<small>${currencyKeysFor(mode).includes(key)?`<label class="sr-only" for="manual-currency-${key}">${label}: same currency on both cards</label><select id="manual-currency-${key}"><option value="">Currency not confirmed / differs</option>${supportedCurrencies.map(currency=>`<option value="${currency}">Both ${currency}</option>`).join('')}</select>`:unit}</small></span>${['a','b'].map(side=>`<div><label class="sr-only" for="manual-${side}-${key}">${sideLabel} ${side.toUpperCase()} ${label} (${currencyKeysFor(mode).includes(key)?'selected currency':unit})</label><input id="manual-${side}-${key}" type="number" min="0" max="1000000000000" step="any" inputmode="decimal" placeholder="Unknown"></div>`).join('')}`).join('')}</div><p class="small">These entries do not update the catalogue. Create a separate link to share them; anyone with that link can read the entered values. No account or cloud backup is involved.</p><div class="actions"><button class="button primary" type="submit">Compare my values</button><button class="button" type="reset">Clear my values</button><button class="button" id="share-manual" type="button" disabled>Create link to these values</button></div></form><label id="manual-share-label" for="manual-share-link" hidden>Manual comparison link · select and copy</label><input id="manual-share-link" type="text" readonly hidden><div id="manual-compare-result" role="status" class="section"></div></details>`;
}

export function mountManualComparison({document=globalThis.document,location=globalThis.location,history=globalThis.history}={}) {
 const form=document.getElementById('manual-compare-form');if(!form)return;
 const result=document.getElementById('manual-compare-result'),button=document.getElementById('share-manual'),link=document.getElementById('manual-share-link'),label=document.getElementById('manual-share-label');
 const mode=form.dataset.manualMode??'rods';
 const read=()=>({values:Object.fromEntries(fieldsFor(mode).flatMap(([key])=>['a','b'].map(side=>[side+'-'+key,document.getElementById(`manual-${side}-${key}`).value]))),currencies:Object.fromEntries(currencyKeysFor(mode).map(key=>[key,document.getElementById(`manual-currency-${key}`).value]))});
 let legacyCurrencyNote=false;
 const hideLink=()=>{link.hidden=true;label.hidden=true;link.value='';};
 const clearSharedState=()=>{if(!history?.replaceState||!location?.href)return;try{const url=new URL(location.href);if(url.searchParams.has('manual')){url.searchParams.delete('manual');history.replaceState(null,'',url.href);}}catch{/* Manual editing still works if browser history is unavailable. */}};
 const render=()=>{
  const {values,currencies}=read();
  const rows=manualComparisonRows(mode,values,currencies).map(({label,text})=>`<li><strong>${label}:</strong> ${text}</li>`);
  result.innerHTML=`<h3>${mode==='gear'?'Setup':'Rod'} B compared with ${mode==='gear'?'Setup':'Rod'} A</h3>${legacyCurrencyNote?'<p class="notice small">This older link labels purchase prices in Coins. Check that both cards use Coins before comparing.</p>':''}<ul class="comparison-summary">${rows.join('')}</ul><p class="small">Calculated from your entries, not independently verified. Purchase-price difference is not the cost of upgrading: buying B still costs its full price unless the game explicitly gives credit for A. Rod and bait luck stay separate; neither is added or converted to catch odds or earnings. Different currencies are not converted.</p>`;
  button.disabled=!normalizedManualState(mode,values,currencies);hideLink();
 };
 form.addEventListener('submit',event=>{event.preventDefault();render();});
 form.addEventListener('input',()=>{legacyCurrencyNote=false;clearSharedState();if(result.textContent)result.textContent='Values changed. Compare again to update the result.';button.disabled=true;hideLink();});
 form.addEventListener('reset',()=>{legacyCurrencyNote=false;clearSharedState();result.textContent='Your values have been cleared.';button.disabled=true;hideLink();});
 button.addEventListener('click',()=>{
  try{const {values,currencies}=read(),url=new URL(location.href);url.searchParams.set('manual',encodeManualState(mode,values,currencies));link.value=url.href;link.hidden=false;label.hidden=false;link.focus();link.select();}
  catch{button.disabled=true;hideLink();result.textContent='Enter valid values and compare again before sharing.';}
 });
 const restored=decodeManualState(location.search,mode);
 if(restored){
  for(const [key,value] of Object.entries(restored.values))document.getElementById('manual-'+key).value=value;
  for(const [key,value] of Object.entries(restored.currencies))document.getElementById('manual-currency-'+key).value=value;
  legacyCurrencyNote=restored.legacyPriceCurrency===true;
  form.closest('details').open=true;render();
 }else if(new URLSearchParams(location.search).has('manual')){form.closest('details').open=true;result.textContent='This manual comparison link is invalid or for another tool. No values were restored.';}
 // Selector changes outside the form move or clear the entries, so no number is shown under the wrong rod.
 const sideLabel=mode==='gear'?'Setup':'Rod';
 const field=(side,key)=>document.getElementById(`manual-${side}-${key}`);
 const hasEntries=side=>fieldsFor(mode).some(([key])=>field(side,key).value!=='');
 const hasCurrency=()=>currencyKeysFor(mode).some(key=>document.getElementById('manual-currency-'+key).value!=='');
 const invalidate=message=>{legacyCurrencyNote=false;clearSharedState();result.textContent=message;button.disabled=true;hideLink();};
 return {
  swapSides(){
   if(!hasEntries('a')&&!hasEntries('b')&&!result.textContent)return false;
   for(const [key] of fieldsFor(mode)){const a=field('a',key).value;field('a',key).value=field('b',key).value;field('b',key).value=a;}
   invalidate(`${sideLabel} A and ${sideLabel} B were swapped, and your entered values moved with them. Compare again to update the result.`);return true;
  },
  clearSide(side){
   const own=side.toUpperCase(),other=side==='a'?'B':'A';
   if(!hasEntries(side)&&!hasCurrency()&&!result.textContent)return false;
   for(const [key] of fieldsFor(mode))field(side,key).value='';
   for(const key of currencyKeysFor(mode))document.getElementById('manual-currency-'+key).value='';
   invalidate(`${sideLabel} ${own} changed, so its entered values and the price-currency confirmation were cleared. ${sideLabel} ${other} values are kept. Enter the new ${sideLabel.toLowerCase()}’s card values and compare again.`);return true;
  },
  clearAll(){
   if(!hasEntries('a')&&!hasEntries('b')&&!hasCurrency()&&!result.textContent)return false;
   for(const [key] of fieldsFor(mode))for(const side of ['a','b'])field(side,key).value='';
   for(const key of currencyKeysFor(mode))document.getElementById('manual-currency-'+key).value='';
   invalidate('Both equipment selections changed, so your entered values and price-currency confirmations were cleared. Compare again with the new cards.');return true;
  }
 };
}
