/** Restore only a bounded display count; this never changes the catalogue. */
export function displayLimit(search,total,batch=12){
 const raw=new URLSearchParams(search).get('limit');
 if(raw===null)return Math.min(batch,total);
 const n=Number(raw);
 return Number.isFinite(n)&&Number.isInteger(n)&&n>0?Math.min(total,Math.max(batch,n)):Math.min(batch,total);
}

// These are a community source's categories, never proof of current availability.
export const sourceCategories=['Permanent','Event / limited','Unobtainable'];
export const sourceCategory=value=>sourceCategories.includes(value)?value:'';
export const matchesSourceCategory=(item,value)=>!sourceCategory(value)||item.reportedScope===value;

// Image presence is a preview reference, not complete artwork or public-use approval.
export const rodKind=value=>['rod','skin'].includes(value)?value:'';
export const matchesRodKind=(item,value)=>!rodKind(value)||(value==='skin'?item.itemKind==='cosmetic-reference':item.itemKind!=='cosmetic-reference');
export const hasReferenceImage=(item,assets)=>assets.some(a=>a.reviewStatus==='approved'&&(a.id===item.image||a.objectId===item.id));
export const matchesReferenceImage=(item,only,assets)=>!only||hasReferenceImage(item,assets);

// The fish directory holds fish plus a few related records. Fish is the default view;
// collection objects, quest items, unclassified index entries and the unresolved task target are never counted as fish.
export const fishItemTypes=[['fish','Fish'],['collection','Collection items'],['quest','Quest items & task targets'],['unclassified','Unclassified index entries'],['all','All fish-related records']];
export const fishItemType=value=>['collection','quest','unclassified','all'].includes(value)?value:'fish';
export function fishRecordType(item){
 const category=item?.catchCategory;
 return category==='collection-reference'?'collection':category==='quest-item'?'quest':category==='quest-target-reference'?'task':category==='unclassified-reference'?'unclassified':'fish';
}
export const fishRecordTypeLabel=item=>({fish:'Fish',collection:'Collection item',quest:'Quest item',task:'Unresolved task target',unclassified:'Unclassified index entry'})[fishRecordType(item)];
export function matchesFishItemType(item,value){
 const selected=fishItemType(value),type=fishRecordType(item);
 return selected==='all'||(selected==='quest'?type==='quest'||type==='task':type===selected);
}
export function fishRecordTypeCounts(list){
 const counts={fish:0,collection:0,quest:0,task:0,unclassified:0};
 for(const item of list)counts[fishRecordType(item)]++;
 return counts;
}
// Stored values stay 'wanted' / 'caught' for every record so existing saved data keeps working;
// only the visible wording follows the record type.
export function collectionStateLabels(item,{archived=false}={}){
 const [want,done]={fish:['Want to catch','Caught'],collection:['Want to collect','Collected'],quest:['Want to obtain','Obtained'],task:['Want to find','Found'],unclassified:['Want to get','Got']}[fishRecordType(item)];
 return {none:'Not tracked',wanted:archived?want+' if available again':want,caught:done};
}
