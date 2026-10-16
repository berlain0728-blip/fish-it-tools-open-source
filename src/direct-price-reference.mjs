// A reward's historical price label is not a repeatable direct purchase cost.
// This only classifies a reference; it does not verify current stock or prices.
export function hasDirectPriceReference(item){
 return Boolean(item&&item.itemKind!=='cosmetic-reference'&&item.itemKind!=='identity-reference'&&['shop','merchant','gamepass'].includes(item.acquisition));
}
