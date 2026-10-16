import {readSaved,writeSaved,assertReadableSaved} from './storage.mjs';
const reference=/^(fish|rods|baits|locations):[a-z0-9-]{1,100}$/;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function parseGoalBackup(text){
 if(typeof text!=='string'||text.length>65536)throw Error('Backup must be at most 64 KB.');
 let data;try{data=JSON.parse(text);}catch{throw Error('Paste valid backup JSON.');}
 if(!object(data)||data.format!=='fish-it-goals'||data.version!==1||!Array.isArray(data.favorites)||!object(data.collection))throw Error('This is not a supported Fish It goals backup.');
 if(data.favorites.length>5000||Object.keys(data.collection).length>5000)throw Error('This backup contains too many records.');
 if(data.favorites.some(id=>typeof id!=='string'||!reference.test(id)))throw Error('Backup contains an invalid saved item.');
 if(Object.entries(data.collection).some(([id,state])=>!/^fish:[a-z0-9-]{1,100}$/.test(id)||!['wanted','caught'].includes(state)))throw Error('Backup contains invalid fish progress.');
 return {favorites:[...new Set(data.favorites)],collection:{...data.collection}};
}
export function exportGoals(storage){
 // Read storage directly first: unavailable storage is not an empty collection.
 assertReadableSaved(storage);
 const data=readSaved(storage);
 return JSON.stringify({format:'fish-it-goals',version:1,favorites:data.favorites,collection:data.collection},null,2);
}
export function importGoals(storage,text){
 const imported=parseGoalBackup(text);
 assertReadableSaved(storage);
 const current=readSaved(storage);
 const merged={...current,favorites:[...new Set([...current.favorites,...imported.favorites])],collection:{...imported.collection,...current.collection}};
 if(!writeSaved(storage,merged))throw Error('Storage is unavailable; no goals were imported.');
 return merged;
}
export function mountGoalBackup({document,storage,onChange=()=>{}}){
 const field=document.getElementById('goal-backup'),feedback=document.getElementById('backup-status');
 if(!field||!feedback)return;
 document.getElementById('export-goals')?.addEventListener('click',()=>{
  try{field.value=exportGoals(storage());field.focus();field.select();feedback.textContent='Backup ready. Copy the text and save it somewhere you can find again.';}catch(e){feedback.textContent=e instanceof Error&&e.message.startsWith('Existing saved data')?e.message:'Storage is unavailable; a backup could not be created.';}
 });
 document.getElementById('import-goals')?.addEventListener('click',()=>{
  try{importGoals(storage(),field.value);onChange();feedback.textContent='Goals imported. Existing fish progress was kept; saved items were combined.';}catch(e){feedback.textContent=e.message;}
 });
}
