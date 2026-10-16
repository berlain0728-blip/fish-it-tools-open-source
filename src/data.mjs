import {gameGuidesA} from './game-guides-part-a.mjs';
import {gameGuidesB} from './game-guides-part-b.mjs';
// SPDX-License-Identifier: MIT
// Catalogue records below are invented demonstrations, not Fish It game values.
// Separately imported game-guide summaries retain their own historical source limits.
const field = (value, unit) => ({value, unit, status:'unverified', source:'fictional-demo', verifiedAt:null, version:null, note:'Invented demonstration value; not gameplay evidence.'});
const common = {demo:true, image:null, currency:'coins', availability:'unverified', status:'unverified', verifiedAt:null, version:null, sourceIds:['fictional-demo'], aliases:[]};
const rod = (id, name, price, luck, speed, weight, requirements=[]) => ({...common,id,slug:id,name,itemKind:'equipment',includeInEquipmentTools:true,acquisition:price===0?'reward':'shop',obtain:'Fictional demo record. No real acquisition route is supplied.',description:'Invented equipment for exercising the source edition.',requirements,fields:{price:field(price,'coins'),luck:field(luck,'%'),speed:field(speed,'%'),weight:field(weight,'kg')}});
export const rods = [
 rod('demo-starter','Demo Starter Rod',0,0,0,10),
 rod('demo-harbor','Demo Harbor Rod',600,20,8,80),
 rod('demo-cove','Demo Cove Rod',1400,35,6,250),
 rod('demo-gated','Demo Gated Rod',900,50,5,180,[{id:'demo-shop',label:'Demo shop unlocked',verified:false}])
];
export const baits = [
 { ...common,id:'demo-basic-bait',slug:'demo-basic-bait',name:'Demo Basic Bait',itemKind:'equipment',acquisition:'shop',obtain:'Fictional demonstration only.',description:'Invented bait, unrelated to real game equipment.',requirements:[],fields:{price:field(50,'coins'),luck:field(5,'%')}},
 { ...common,id:'demo-bright-bait',slug:'demo-bright-bait',name:'Demo Bright Bait',itemKind:'equipment',acquisition:'shop',obtain:'Fictional demonstration only.',description:'A second invented bait for comparison examples.',requirements:[],fields:{price:field(150,'coins'),luck:field(12,'%')}}
];
export const locations = [
 {...common,id:'demo-bay',slug:'demo-bay',name:'Demo Bay',description:'An imaginary sample location. It is not a real game destination.',requirements:[],fishIds:['demo-silverfin','demo-sunfish']},
 {...common,id:'demo-cove-area',slug:'demo-cove-area',name:'Demo Cove',description:'An imaginary second location used to demonstrate cross links.',requirements:[],fishIds:['demo-moonfin']}
];
export const fish = [
 {...common,id:'demo-silverfin',slug:'demo-silverfin',name:'Demo Silverfin',rarity:'Demo common',locationIds:['demo-bay'],catchCategory:'fish-reference',description:'Invented sample fish for wanted and collected states.',conditions:['No real catch conditions are provided.']},
 {...common,id:'demo-sunfish',slug:'demo-sunfish',name:'Demo Sunfish',rarity:'Demo uncommon',locationIds:['demo-bay'],catchCategory:'fish-reference',description:'Invented sample fish for collection search and detail pages.',conditions:['No real catch conditions are provided.']},
 {...common,id:'demo-moonfin',slug:'demo-moonfin',name:'Demo Moonfin',rarity:'Demo rare',locationIds:['demo-cove-area'],catchCategory:'fish-reference',description:'Invented sample fish. Its name and numbers are not sourced from a game.',conditions:['No real catch conditions are provided.']}
];
const toolGuides = [
 {id:'compare-your-own-values',title:'Compare values from your own equipment cards',description:'Enter card values and compare attributes separately.',sections:[['Start with matching units','Open Rod comparison or Gear comparison. Use the same units on both sides. Unknown values stay blank; a blank value is not zero.'],['Compare one change','Enter each card’s price, listed luck, speed and capacity. For gear, enter the bait values separately. Compare the resulting changes without adding rod and bait luck into a supposed catch probability.'],['Keep a share link','After comparing, create a link to your values. The values appear in that URL and can be read by anyone who receives it. Editing a value requires another comparison before sharing.']]},
 {id:'plan-a-budget',title:'Plan a budget without hiding a trade-off',description:'Use the demo planner to see costs, reserves and unlock exclusions.',sections:[['Choose a baseline','Select the item you already have and the attribute you want to compare. All supplied catalogue values are fictional demonstrations.'],['Set a spending limit','Enter your total budget and a reserve. The planner can spend only the budget minus that reserve. Confirm any unlock only if it applies to your own data.'],['Read exclusions and losses','A higher selected attribute does not make every other attribute better. Inspect the comparison and excluded-item reasons. Strict evidence mode has no eligible candidates because this edition supplies no verified game data.']]},
 {id:'save-and-back-up-goals',title:'Save and back up a collection goal',description:'Track a target locally and export it before changing devices.',sections:[['Mark a target','Open a sample fish and mark Want to catch or Caught. You can also save equipment. This stores only a local preference; it does not connect to any game account.'],['Review My goals','Use My goals to see saved records and progress. Demo records and any unrecognized imported references stay distinguishable.'],['Export before moving','Export the JSON backup, copy it and save it privately. Import combines saved records and preserves progress already on this device. No automatic upload or synchronization runs.']]}
];
export const guides=[...toolGuides.map(guide=>({...guide,kind:'site-usage',verifiedAt:null,version:null})),...gameGuidesA,...gameGuidesB];
export const groups={rods,baits,fish,locations};
export const meta={name:'Tide Tools',edition:'Open-source demo',synthetic:true,currentVersion:null,releaseReady:false,completeInventory:false,ads:false,analytics:false};
