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

function parseConceptList(value){
  return String(value || '')
    .split(/[,，]/)
    .map(item=>item.trim())
    .filter(Boolean);
}

function uniqueConcepts(names){
  return [...new Set(names)];
}

function resolveConcepts(api){
  const fromHash = hashConcept();
  const bodyConcepts = parseConceptList(document.body?.dataset?.concept);
  const knownBodyConcepts = bodyConcepts.filter(name=>api.get(name));
  const concepts = fromHash && api.get(fromHash)
    ? uniqueConcepts([fromHash,...knownBodyConcepts])
    : knownBodyConcepts;
  return concepts;
}

function renderConceptChips(concepts,activeName){
  if(concepts.length <= 1)return '';
  return `<div class="concept-sync-related" aria-label="关联概念">${
    concepts.map(concept=>{
      const href = `${location.pathname.split('/').pop() || 'index.html'}#${encodeURIComponent(concept.name)}`;
      return `<a class="${concept.name === activeName ? 'active' : ''}" href="${escapeHTML(href)}">${escapeHTML(concept.icon)} ${escapeHTML(concept.name)}</a>`;
    }).join('')
  }</div>`;
}

function renderConceptSyncCard(){
  const api = window.MathGrade5Concepts;
  if(!api)return;
  const concepts = resolveConcepts(api).map(name=>api.get(name)).filter(Boolean);
  const concept = concepts[0];
  const nav = document.querySelector('.top-nav');
  const existing = document.querySelector('.concept-sync-card');
  if(existing)existing.remove();
  if(!concept || !nav)return;

  const rootPrefix = inferRootPrefix();
  const image = api.assetUrl(concept.image,rootPrefix);
  const graphHref = `${rootPrefix}index.html#${encodeURIComponent(concept.name)}`;
  const graphLink = nav.querySelector('a:first-child');
  if(graphLink)graphLink.setAttribute('href',graphHref);
  const visual = image
    ? `<img class="concept-sync-image" loading="lazy" src="${escapeHTML(image)}" alt="${escapeHTML(concept.name)}的视觉模型">`
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
      ${renderConceptChips(concepts,concept.name)}
      <a class="concept-sync-link" href="${escapeHTML(graphHref)}">回到图谱节点</a>
    </div>`;
  nav.insertAdjacentElement('afterend',card);
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded',renderConceptSyncCard);
}else{
  renderConceptSyncCard();
}
window.addEventListener('hashchange',renderConceptSyncCard);

// === 推荐下一课映射（基于依赖图自动生成） ===
const __nextConceptMap = {
  "整数加减法":["整数乘法","整数四则运算","分数加减法"],
  "整数乘法":["单位换算","小数乘法","因数和倍数","体积和体积单位"],
  "整数除法":["因数和倍数","分数的意义","植树问题","找次品"],
  "位置值":["小数的意义","整数四则运算","小数乘法","小数除法"],
  "小数的意义":["小数乘法","小数除法","分数与小数互化"],
  "整数四则运算":["简易方程"],
  "矩形面积":["平行四边形面积","体积和体积单位"],
  "等式的性质":["简易方程"],
  "图形认知":["轴对称与旋转","观察物体","长方体和正方体","平行四边形面积"],
  "分数基础":["分数的意义","可能性"],
  "数据收集":["折线统计图"],
  "单位换算":["体积和体积单位","容积和容积单位"],
  "小数乘法":["小数除法"],
  "小数除法":["循环小数"],
  "因数和倍数":["235的倍数特征","质数与合数","约分","通分"],
  "观察物体":["长方体和正方体"],
  "体积和体积单位":["长方体体积"],
  "长方体体积":["容积和容积单位"],
  "平行四边形面积":["三角形面积","梯形面积"],
  "三角形面积":["组合图形面积"],
  "梯形面积":["组合图形面积"],
  "分数的意义":["真分数和假分数","分数的基本性质","分数加减法","分数与小数互化"],
  "分数的基本性质":["约分","通分"],
  "通分":["分数加减法"]
};

function getRecommendedNext(conceptName){
  const nextNames = __nextConceptMap[conceptName];
  if(!nextNames || !nextNames.length)return [];
  const api = window.MathGrade5Concepts;
  if(!api)return nextNames.map(name=>({name}));
  return nextNames.map(name=>({name, data: api.get(name)})).filter(r=>r.data);
}
window.getRecommendedNext = getRecommendedNext;

})();
