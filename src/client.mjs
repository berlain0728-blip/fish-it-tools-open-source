import {rods} from './data.mjs';
import {catalogue, recordCard, plannerInputDefaults, plannerResult, comparisonResult, goalsContent} from './views.mjs';
import {decodeState, encodeState} from './planner.mjs';
import {mountManualComparison} from './manual-comparison.mjs';
import {readSaved, writeSaved, assertReadableSaved, toggleFavorite, setCollection, removeSavedTarget, clearSaved} from './storage.mjs';
import {mountGoalBackup} from './goal-backup.mjs';

const byId = id => document.getElementById(id);
const status = message => {const field = byId('action-status'); if (field) field.textContent = message;};
const storage = () => globalThis.localStorage;
const selectedCheckboxes = name => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);

function syncSavedControls() {
 let saved;
 try {assertReadableSaved(storage()); saved = readSaved(storage());}
 catch (error) {status(error.message || 'Local storage is unavailable. Existing data has not been changed.'); return;}
 for (const button of document.querySelectorAll('[data-favorite]')) {
  const selected = saved.favorites.includes(button.dataset.favorite);
  button.setAttribute('aria-pressed', String(selected));
  button.classList.toggle('selected', selected);
 }
 for (const field of document.querySelectorAll('[data-collection]')) field.value = saved.collection[field.dataset.collection] || 'none';
}

function renderGoals() {
 if (!byId('goal-list')) return;
 try {
  assertReadableSaved(storage());
  const view = goalsContent(readSaved(storage()), byId('goal-filter')?.value || 'all');
  byId('goal-list').innerHTML = view.html;
  byId('goal-summary').textContent = view.summary;
 } catch (error) {byId('goal-summary').textContent = error.message || 'Local storage is unavailable.'; byId('goal-list').textContent = 'Your existing saved data has not been changed.';}
}

function showShareLink(fieldId, labelId, url, messageId) {
 const field = byId(fieldId), label = byId(labelId);
 field.value = url; field.hidden = false; label.hidden = false; field.focus(); field.select();
 if (byId(messageId)) byId(messageId).textContent = 'Link ready. Select and copy it. It contains only the displayed tool inputs.';
}

function mountPlanner() {
 const form = byId('planner-form'); if (!form) return;
 const initial = {...plannerInputDefaults(), ...decodeState(location.search, rods)};
 const params = new URLSearchParams(location.search);
 if (!params.has('reference')) initial.includeCommunity = true;
 if (!params.has('reserve')) initial.reserve = plannerInputDefaults().reserve;
 byId('planner-rod').value = initial.currentId;
 byId('planner-budget').value = initial.budget;
 byId('planner-reserve').value = initial.reserve;
 byId('planner-goal').value = initial.goal;
 byId('planner-weight').value = initial.minWeight;
 byId('planner-reference').checked = initial.includeCommunity;
 for (const field of form.querySelectorAll('input[name="owned"]')) field.checked = initial.ownedIds.includes(field.value);
 for (const field of form.querySelectorAll('input[name="unlocks"]')) field.checked = initial.unlockedIds.includes(field.value);
 const read = () => ({currentId:byId('planner-rod').value, budget:Number(byId('planner-budget').value), reserve:Number(byId('planner-reserve').value), goal:byId('planner-goal').value, minWeight:Number(byId('planner-weight').value), ownedIds:selectedCheckboxes('owned'), unlockedIds:selectedCheckboxes('unlocks'), includeCommunity:byId('planner-reference').checked});
 const serialize = input => encodeState({rod:input.currentId, budget:input.budget, reserve:input.reserve, goal:input.goal, weight:input.minWeight, owned:input.ownedIds, unlocks:input.unlockedIds, reference:input.includeCommunity});
 const render = () => {const input = read(); byId('planner-result').innerHTML = plannerResult(input); return input;};
 render();
 form.addEventListener('submit', event => {
  event.preventDefault(); const input = render();
  try {const data = readSaved(storage()); if (!writeSaved(storage(), {...data, recent:input})) status('Calculation is ready. Local inputs could not be saved.');} catch {status('Calculation is ready. Local storage is unavailable.');}
  byId('planner-status').textContent = 'Demo calculation updated. No game data or external service was used.';
 });
 form.addEventListener('input', () => {byId('planner-status').textContent = 'Inputs changed. Find demo upgrades to update the result.'; byId('planner-share').hidden = true; byId('planner-share-label').hidden = true;});
 byId('share-planner').addEventListener('click', () => {if (!form.reportValidity()) return; const input = render(); const url = new URL(location.href); url.search = serialize(input); url.hash = ''; showShareLink('planner-share', 'planner-share-label', url.href, 'planner-status');});
}

function mountComparison() {
 const form = byId('comparison-form'); if (!form) return;
 const query = new URLSearchParams(location.search).get('rods');
 if (query) {
  const requested = query.split(',');
  if (requested.length >= 2 && requested.length <= 3 && requested.every(id => rods.some(rod => rod.id === id))) requested.forEach((id, index) => {byId('rod-' + index).value = id;});
  else byId('comparison-status').textContent = 'Invalid comparison IDs were ignored. The default demo pair is shown.';
 }
 const read = () => [0, 1, 2].map(index => rods.find(rod => rod.id === byId('rod-' + index).value)).filter(Boolean);
 const render = () => {const selected = read(); byId('comparison-result').innerHTML = comparisonResult(selected); return selected;};
 render();
 form.addEventListener('submit', event => {event.preventDefault(); render(); byId('comparison-status').textContent = 'Synthetic comparison updated.';});
 form.addEventListener('change', () => {render(); byId('comparison-share').hidden = true; byId('comparison-share-label').hidden = true; byId('comparison-status').textContent = 'Synthetic comparison updated.';});
 byId('share-comparison').addEventListener('click', () => {const selected = render(), url = new URL(location.href); url.search = ''; url.searchParams.set('rods', selected.map(rod => rod.id).join(',')); url.hash = ''; showShareLink('comparison-share', 'comparison-share-label', url.href, 'comparison-status');});
}

function mountCollection() {
 const form = byId('collection-filter'); if (!form) return;
 const fixedType = byId('collection-results').dataset.collectionType;
 const params = new URLSearchParams(location.search);
 byId('collection-search').value = (params.get('q') || '').slice(0, 150);
 if (fixedType === 'all' && Object.hasOwn(catalogue, params.get('type'))) byId('collection-type').value = params.get('type');
 const render = () => {
  const query = byId('collection-search').value.trim().toLocaleLowerCase('en-US');
  const type = fixedType === 'all' ? byId('collection-type').value : fixedType;
  const entries = Object.entries(catalogue).filter(([key]) => type === 'all' || key === type).flatMap(([key, list]) => list.map(item => ({type:key, item})));
  const matches = entries.filter(({item}) => {
   const places = [...(item.locationIds || []), item.locationId].filter(Boolean).flatMap(id => [id, catalogue.locations.find(place => place.id === id)?.name]);
   return [item.name, ...(item.aliases || []), item.description, ...places].filter(Boolean).join(' ').toLocaleLowerCase('en-US').includes(query);
  });
  byId('collection-results').innerHTML = matches.map(({type:recordType, item}) => recordCard(item, recordType)).join('');
  byId('collection-count').textContent = `${matches.length} matching synthetic records`;
  byId('collection-empty').hidden = matches.length > 0;
  syncSavedControls();
 };
 form.addEventListener('submit', event => {event.preventDefault(); render();});
 byId('collection-search').addEventListener('input', render);
 byId('collection-type').addEventListener('change', render);
 byId('clear-search').addEventListener('click', () => {byId('collection-search').value = ''; if (fixedType === 'all') byId('collection-type').value = 'all'; render(); byId('collection-search').focus();});
 render();
}

function mountGuideFilter() {
 const form = byId('guide-filter'); if (!form) return;
 const cards = [...document.querySelectorAll('[data-guide-card]')];
 const render = () => {
  const query = byId('guide-query').value.trim().toLowerCase();
  const kind = byId('guide-kind').value;
  let shown = 0;
  for (const card of cards) {card.hidden = (kind !== 'all' && kind !== card.dataset.guideKind) || !card.dataset.guideSearch.includes(query); if (!card.hidden) shown++;}
  byId('guide-count').textContent = `${shown} matching guides`;
  byId('guide-empty').hidden = shown > 0;
 };
 form.addEventListener('submit', event => {event.preventDefault(); render();});
 byId('guide-query').addEventListener('input', render);
 byId('guide-kind').addEventListener('change', render);
 byId('clear-guide-search').addEventListener('click', () => {byId('guide-query').value = ''; byId('guide-kind').value = 'all'; render(); byId('guide-query').focus();});
}

document.addEventListener('click', event => {
 const target = event.target instanceof Element ? event.target.closest('[data-favorite], [data-remove-goal]') : null;
 if (!target) return;
 try {
  if (target.dataset.favorite) {const result = toggleFavorite(storage(), target.dataset.favorite); if (!result.saved) throw Error('Local storage is unavailable or unreadable. Existing saved data was left unchanged.'); status(result.selected ? 'Saved on this device.' : 'Bookmark removed from this device.');}
  if (target.dataset.removeGoal) {if (!removeSavedTarget(storage(), target.dataset.removeGoal)) throw Error('Could not remove this goal. Existing data was left unchanged.'); status('Goal removed from this device.');}
  syncSavedControls(); renderGoals();
 } catch (error) {status(error.message || 'Local storage is unavailable.');}
});
document.addEventListener('change', event => {
 const target = event.target;
 if (!(target instanceof HTMLSelectElement) || !target.dataset.collection) return;
 try {if (!setCollection(storage(), target.dataset.collection, target.value)) throw Error('Collection progress could not be saved. Existing data was left unchanged.'); status('Collection progress saved on this device.');}
 catch (error) {status(error.message || 'Local storage is unavailable.');}
 syncSavedControls(); renderGoals();
});

byId('goal-filter')?.addEventListener('change', renderGoals);
byId('clear-goals')?.addEventListener('click', () => {try {if (!clearSaved(storage())) throw Error('Could not clear browser data.'); status('This browser’s demo data has been cleared.'); renderGoals(); syncSavedControls();} catch (error) {status(error.message || 'Local storage is unavailable.');}});
window.addEventListener('storage', () => {syncSavedControls(); renderGoals();});
mountPlanner();
mountComparison();
mountManualComparison();
mountCollection();
mountGuideFilter();
mountGoalBackup({document, storage, onChange:() => {renderGoals(); syncSavedControls();}});
syncSavedControls();
renderGoals();
