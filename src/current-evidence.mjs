import {availabilityState} from './availability.mjs';

/** @typedef {{sources?:any[],version?:string|null}} CurrentEvidenceContext */
const text=value=>typeof value==='string'&&value.trim().length>0;
const knownVersion=value=>text(value)&&!['unknown','unverified'].includes(value.trim().toLowerCase());
const validDate=value=>{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value))return false;
 const date=new Date(value);
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value.slice(0,10);
};
const validUrl=value=>{try{return ['http:','https:'].includes(new URL(value).protocol);}catch{return false;}};
const valuePresent=value=>value!==null&&value!==undefined&&(typeof value!=='number'||Number.isFinite(value))&&(typeof value!=='string'||text(value));
const rejected=reason=>({confirmed:false,reason,source:null,verifiedAt:null,version:null});
const numericUnits={luck:'%',speed:'%',weight:'kg'};

function currentItemEvidence(item,context){
 const version=context?.version;
 if(!knownVersion(version))return rejected('Current game version is unknown');
 if(!item||!knownVersion(item.version)||item.version!==version)return rejected('Current item version is not confirmed');
 if(!validDate(item.verifiedAt))return rejected('Current item verification date is missing or invalid');
 return {confirmed:true,reason:null,source:null,verifiedAt:item.verifiedAt,version};
}

function observedFieldEvidence(item,field,context){
 const itemEvidence=currentItemEvidence(item,context);
 if(!itemEvidence.confirmed)return itemEvidence;
 if(!field||field.status!=='verified'||!valuePresent(field.value))return rejected('Current field evidence is missing or disputed');
 if(!validDate(field.verifiedAt)||!knownVersion(field.version)||field.version!==itemEvidence.version)return rejected('Current field date or version is not confirmed');
 if(!text(field.source)||!Array.isArray(context?.sources))return rejected('Current field source is not registered');
 const matching=context.sources.filter(source=>source?.id===field.source);
 if(matching.length!==1)return rejected('Current field source is not registered unambiguously');
 const source=matching[0];
 if(!Array.isArray(item.sourceIds)||!item.sourceIds.includes(source.id))return rejected('Current field source is not referenced by this item');
 if(!validUrl(source.url)||source.verifiedAt!==field.verifiedAt||source.version!==field.version)return rejected('Current source date, version or URL does not match the field');
 return {confirmed:true,reason:null,source,verifiedAt:field.verifiedAt,version:field.version};
}

// A status flag, reviewed date or historical source never supplies current proof.
// Context must explicitly name the current version and its registered sources.
/** @param {*} item @param {string} key @param {CurrentEvidenceContext} [context] */
export function currentFieldEvidence(item,key,context={}){
 const field=item?.fields?.[key];
 const proof=observedFieldEvidence(item,field,context);
 if(!proof.confirmed)return proof;
 if(key==='price'||Object.hasOwn(numericUnits,key)){
  const unit=key==='price'?item.currency:numericUnits[key];
  if(!text(unit)||['unknown','unverified'].includes(unit.trim().toLowerCase())||field.unit!==unit||
     !Number.isFinite(field.value)||field.value<0)return rejected('Current numeric value or unit is not confirmed');
 }
 return proof;
}

// A requirement keeps its existing id/label/verified shape and additionally needs
// source, verifiedAt and version. This establishes the recorded requirement, not
// whether the player completed it; the planner must still check unlockedIds.
/** @param {*} item @param {*} requirement @param {CurrentEvidenceContext} [context] */
export function currentRequirementEvidence(item,requirement,context={}){
 if(!requirement||typeof requirement!=='object'||!text(requirement.id)||requirement.verified!==true||
    (requirement.status!==undefined&&requirement.status!=='verified'))return rejected('Current unlock evidence is missing or disputed');
 return observedFieldEvidence(item,{
  value:requirement.id,status:'verified',source:requirement.source,
  verifiedAt:requirement.verifiedAt,version:requirement.version
 },context);
}

// Acquisition type, currency, units, budgets and player unlock selections remain
// planner rules. This gate validates a purchase's current evidence without
// reclassifying a quest/reward as a sale or treating an unknown price as zero.
/** @param {*} item @param {CurrentEvidenceContext} [context] */
export function currentPurchaseEvidence(item,context={}){
 const itemEvidence=currentItemEvidence(item,context);
 if(!itemEvidence.confirmed)return itemEvidence;
 const pricingMode=item.fields?.pricingMode;
 if(pricingMode?.value==='not-directly-sold'||pricingMode?.status==='conflicting')return rejected('Purchase pricing is not applicable or disputed');
 const availabilityProof=currentFieldEvidence(item,'availability',context);
 if(!availabilityProof.confirmed)return rejected('Current purchase availability is not confirmed');
 const availability=availabilityState(item,context?.sources,{version:itemEvidence.version});
 if(!availability.confirmed||availability.status!=='available')return rejected('Current purchase availability is not confirmed');
 const acquisition=currentFieldEvidence(item,'acquisition',context);
 if(!acquisition.confirmed||!text(item.acquisition)||item.fields.acquisition.value!==item.acquisition||
    !validDate(item.acquisitionVerifiedAt)||item.acquisitionVerifiedAt!==acquisition.verifiedAt)return rejected('Current acquisition evidence is missing or mismatched');
 const price=currentFieldEvidence(item,'price',context);
 if(!price.confirmed||!Number.isFinite(item.fields.price.value)||item.fields.price.value<0)return rejected('Current purchase price evidence is missing or disputed');
 if(!Array.isArray(item.requirements))return rejected('Current purchase requirements are not documented');
 const seen=new Set(),requirements=[];
 for(const requirement of item.requirements){
  const proof=currentRequirementEvidence(item,requirement,context);
  if(!proof.confirmed||seen.has(requirement.id))return rejected('Current unlock evidence is missing or disputed');
  seen.add(requirement.id);requirements.push(proof);
 }
 return {confirmed:true,reason:null,source:acquisition.source,verifiedAt:acquisition.verifiedAt,version:itemEvidence.version,availability,acquisition,price,requirements};
}

// A currently held rod may no longer be sold. Its comparison baseline needs the
// selected numeric attribute's current proof, not a current purchase route.
/** @param {*} item @param {string} key @param {CurrentEvidenceContext} [context] */
export function currentBaselineEvidence(item,key,context={}){
 const field=currentFieldEvidence(item,key,context);
 if(!field.confirmed)return field;
 if(!Number.isFinite(item.fields[key].value))return rejected('Current rod baseline value is not numeric');
 return field;
}
