// A historical source saying "removed" is not a current availability check.
// The field must point to a registered, versioned source verified in the same
// observation, and the item must actually reference that source.
const unavailableReasons=new Set(['ended-event','retired','unavailable']);
const text=value=>typeof value==='string'?value.trim():'';
const validDate=value=>{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value))return false;
 const date=new Date(value);return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value.slice(0,10);
};
const validUrl=value=>{try{return ['https:','http:'].includes(new URL(value).protocol);}catch{return false;}};
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

export function availabilityState(item,sourceRecords=[],{version=null}={}){
 const unknown={status:'unverified',confirmed:false,archived:false,source:null,verifiedAt:null,version:null,note:'',reason:null};
 const field=item?.fields?.availability;
 if(!field||!['available','unobtainable'].includes(field.value)||item.availability!==field.value||field.status!=='verified')return unknown;
 if(!validDate(field.verifiedAt)||!text(field.version)||!text(field.source))return unknown;
 if(version!==null&&field.version!==version)return unknown;
 if(item.version&&item.version!==field.version)return unknown;
 const source=Array.isArray(sourceRecords)?sourceRecords.find(record=>record.id===field.source):null;
 if(!source||!Array.isArray(item.sourceIds)||!item.sourceIds.includes(source.id)||!validUrl(source.url)||source.verifiedAt!==field.verifiedAt||source.version!==field.version)return unknown;
 if(field.value==='unobtainable'&&(!unavailableReasons.has(field.reason)||!text(field.note)))return unknown;
 return {status:field.value,confirmed:true,archived:field.value==='unobtainable',source,verifiedAt:field.verifiedAt,version:field.version,note:text(field.note),reason:field.reason??null};
}

export function availabilitySummary(item,sourceRecords=[],options={}){
 const state=availabilityState(item,sourceRecords,options);
 if(!state.confirmed)return 'Not verified';
 const label=state.archived?'Not currently obtainable':'Available in the verified version';
 return `<b>${label}</b>${state.note?`<br>${esc(state.note)}`:''}<br><span class="small">Verified ${esc(state.verifiedAt)} · version ${esc(state.version)} · <a href="${esc(state.source.url)}" target="_blank" rel="noopener">${esc(state.source.title??state.source.id)}</a></span>`;
}

export function availabilityNotice(item,sourceRecords=[],options={}){
 const state=availabilityState(item,sourceRecords,options);
 return `<div class="availability-status${state.archived?' notice':' small'}" data-availability="${state.status}"><p>Current availability: ${availabilitySummary(item,sourceRecords,options)}.</p>${state.archived?'<p>Archived reference. This record does not offer a current purchase, catch or arrival route.</p>':''}</div>`;
}
