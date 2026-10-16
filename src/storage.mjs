const key='fish-it-tools-v1';
const empty=()=>({version:1,favorites:[],recent:null,collection:{}});
const fishKey=id=>typeof id==='string'&&/^fish:[a-z0-9-]+$/.test(id);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const savedKey=id=>typeof id==='string'&&/^(fish|rods|baits|locations):[a-z0-9-]{1,100}$/.test(id);
export function assertReadableSaved(storage){
 const raw=storage.getItem(key);if(raw==null)return;
 let saved;try{saved=JSON.parse(raw);}catch{throw Error('Existing saved data is unreadable; it was left unchanged.');}
 if(!object(saved)||saved.version!==1)throw Error('Existing saved data uses an unsupported format; it was left unchanged.');
 if(saved.favorites!==undefined&&(!Array.isArray(saved.favorites)||saved.favorites.some(id=>!savedKey(id))))throw Error('Existing saved data contains unreadable saved items; it was left unchanged.');
 if(saved.collection!==undefined&&(!object(saved.collection)||Object.entries(saved.collection).some(([id,state])=>!savedKey(id)||!fishKey(id)||!['wanted','caught'].includes(state))))throw Error('Existing saved data contains unreadable fish progress; it was left unchanged.');
}
export function readSaved(storage){try{const data=JSON.parse(storage.getItem(key));if(!data||data.version!==1)return empty();const collection=Object.fromEntries(Object.entries(data.collection??{}).filter(([id,state])=>fishKey(id)&&['wanted','caught'].includes(String(state))));return {version:1,favorites:Array.isArray(data.favorites)?data.favorites.filter(x=>typeof x==='string'):[],recent:data.recent??null,collection};}catch{return empty();}}
export function writeSaved(storage,data){try{assertReadableSaved(storage);storage.setItem(key,JSON.stringify({...data,version:1}));return true;}catch{return false;}}
export function toggleFavorite(storage,id){const data=readSaved(storage);data.favorites=data.favorites.includes(id)?data.favorites.filter(x=>x!==id):[...data.favorites,id];return {saved:writeSaved(storage,data),selected:data.favorites.includes(id)};}
export function setCollection(storage,id,state){if(!fishKey(id)||!['wanted','caught','none'].includes(state))return false;const data=readSaved(storage);if(state==='none')delete data.collection[id];else data.collection[id]=state;return writeSaved(storage,data);}
export function clearSaved(storage){try{storage.removeItem(key);return true;}catch{return false;}}
export function removeSavedTarget(storage,id){
 if(typeof id!=='string')return false;
 const data=readSaved(storage);data.favorites=data.favorites.filter(key=>key!==id);delete data.collection[id];
 return writeSaved(storage,data);
}
