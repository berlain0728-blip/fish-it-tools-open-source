export type EvidenceStatus='verified'|'community-reported'|'conflicting'|'unverified';
export interface NumericField {value:number|null;unit:string;status:EvidenceStatus;source:string|null;verifiedAt:string|null;version:string|null;note:string}
export interface EvidenceContext {sources?:{id:string;url:string;verifiedAt:string|null;version:string|null}[];version?:string|null}
export interface Rod {itemKind?:string;includeInEquipmentTools?:boolean;id:string;slug:string;name:string;image:string|null;currency:string;availability:string;acquisition:string;status:EvidenceStatus;conflict?:string;obtain:string;version?:string|null;verifiedAt?:string|null;sourceIds?:string[];acquisitionVerifiedAt?:string|null;requirements:{id:string;label:string;verified:boolean;source?:string;verifiedAt?:string;version?:string}[];fields:Record<'price'|'luck'|'speed'|'weight',NumericField>&{pricingMode?:{value:string|null;status:EvidenceStatus}}}
export interface PlannerInput {currentId:string;budget:number;reserve?:number;minWeight?:number;goal?:'luck'|'speed'|'weight';ownedIds?:string[];unlockedIds?:string[];includeCommunity?:boolean}
export interface ApprovedAsset {id:string;objectId:string;path:string;width:number;height:number;alt:string;labelNote?:string;displayPath?:string;reviewStatus?:string;previewOnly?:boolean;sourceUrl?:string}

declare global {interface Window {adsbygoogle:Record<string,unknown>[]}}
