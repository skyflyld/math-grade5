// Injects a knowledge-graph concept card into lesson pages.
(function(){
'use strict';

function escapeHTML(value){
  return String(value==null?'':value).replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}

function inferRootPrefix(){
  const script = Array.from(document.scripts).find(s=>{
    const src = s.getAttribute('src') || '';
    return /shared\/concept-sync\.js(?:\?.*)?$/.test(src);
  });
  const src = script?.getAttribute('src') || '';
  const index = src.indexOf('shared/concept-sync.js');
  return index >= 0 ? src.slice(0,index) : '';
}

function hashConcept(){
  if(!location.hash)return '';
  try{
    return decodeURIComponent(location.hash.slice(1));
  }catch{
    return location.hash.slice(1);
  }
}

function resolveConceptName(api){
  const fromHash = hashConcept();
  if(fromHash && api.get(fromHash))return fromHash;
  const fromBody = document.body?.dataset?.concept || '';
  if(fromBody && api.get(fromBody))return fromBody;
  return fromHash || fromBody;
}

function renderConceptSyncCard(){
  const api = window.MathGrade5Concepts;
  if(!api)return;
  const conceptName = resolveConceptName(api);
  const concept = api.get(conceptName);
  const nav = document.querySelector('.top-nav');
  if(!concept || !nav || document.querySelector('.concept-sync-card'))return;

  const rootPrefix = inferRootPrefix();
  const image = api.assetUrl(concept.image,rootPrefix);
  const graphHref = `${rootPrefix}index.html#${encodeURIComponent(concept.name)}`;
  const graphLink = nav.querySelector('a:first-child');
  if(graphLink)graphLink.setAttribute('href',graphHref);
  const visual = image
    ? `<img class="concept-sync-image" src="${escapeHTML(image)}" alt="${escapeHTML(concept.name)}的视觉模型">`
    : `<div class="concept-sync-symbol">${escapeHTML(concept.icon)}</div>`;

  const card = document.createElement('section');
  card.className = 'concept-sync-card';
  card.setAttribute('aria-label','概念卡同步区');
  card.innerHTML = `
    <div class="concept-sync-visual">${visual}</div>
    <div class="concept-sync-copy">
      <div class="concept-sync-kicker">来自知识图谱的当前概念</div>
      <h2>${escapeHTML(concept.icon)} ${escapeHTML(concept.name)} <span>${escapeHTML(concept.label)}</span></h2>
      <p><strong>视觉模型：</strong>${escapeHTML(concept.metaphor)}</p>
      <a class="concept-sync-link" href="${escapeHTML(graphHref)}">回到图谱节点</a>
    </div>`;
  nav.insertAdjacentElement('afterend',card);
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',renderConceptSyncCard);
}else{
  renderConceptSyncCard();
}
})();
