import {fishRecordType} from './list-state.mjs';
// Stored targets outlive catalogue revisions; never silently erase unmatched references.
export function goalState(data,groups,filter='all'){
 const known=Object.entries(groups).flatMap(([type,list])=>list.map(item=>({type,item,key:type+':'+item.id})));
 const byKey=new Map(known.map(entry=>[entry.key,entry]));
 const favorites=new Set(data.favorites);
 const keys=new Set([...favorites,...Object.keys(data.collection)]);
 const selected=entry=>filter==='wanted'?data.collection[entry.key]==='wanted':filter==='caught'?data.collection[entry.key]==='caught':filter==='equipment'?['rods','baits'].includes(entry.type)&&favorites.has(entry.key):true;
 const items=known.filter(entry=>keys.has(entry.key)&&selected(entry));
 const unavailable=[...keys].filter(key=>!byKey.has(key)).map(key=>({key,type:key.split(':')[0],state:data.collection[key]??'saved'})).filter(selected);
 // Collection objects, quest items and the task target are tracked but never counted as fish.
 const tracked=known.filter(entry=>entry.type==='fish'&&fishRecordType(entry.item)==='fish'),related=known.filter(entry=>entry.type==='fish'&&fishRecordType(entry.item)!=='fish');
 const count=(list,state)=>list.filter(entry=>data.collection[entry.key]===state).length;
 return {items,unavailable,counts:{wanted:count(tracked,'wanted'),caught:count(tracked,'caught'),relatedWanted:count(related,'wanted'),relatedCaught:count(related,'caught'),saved:[...favorites].filter(key=>byKey.has(key)).length,unavailable:[...keys].filter(key=>!byKey.has(key)).length}};
}
