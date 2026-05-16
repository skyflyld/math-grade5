// === 共享交互组件 v3 ===
(function(){
'use strict';

// 进度管理（localStorage）
function saveProgress(data){
  try{
    const key='math5_progress';
    const cur=JSON.parse(localStorage.getItem(key)||'{}');
    const merged=deepMerge(cur,data);
    localStorage.setItem(key,JSON.stringify(merged));
  }catch(e){console.warn('saveProgress:',e);}
}
function getProgress(){try{return JSON.parse(localStorage.getItem('math5_progress')||'{}');}catch{return{};}}
function deepMerge(a,b){
  const o={...a};
  for(const k in b){
    if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')
      o[k]=deepMerge(a[k],b[k]);
    else o[k]=b[k];
  }
  return o;
}

// 庆祝效果
function celebrate(el){
  if(!el)return;
  el.classList.remove('celebrate');
  void el.offsetWidth;
  el.classList.add('celebrate');
}

// 渐进显示
function revealSteps(containerId){
  const c=document.getElementById(containerId);
  if(!c)return;
  const steps=c.querySelectorAll('.reveal-step');
  let i=0;
  const showNext=()=>{if(i<steps.length){steps[i].classList.add('visible');i++;}};
  showNext();
  return {showNext,allShown:()=>i>=steps.length};
}

// 带动画的跳转
function showFeedback(id, type, msg){
  const el=document.getElementById(id);
  if(!el)return;
  el.className='feedback show '+type;
  el.innerHTML=msg;
}
function clearFeedback(id){
  const el=document.getElementById(id);
  if(el)el.className='feedback';
}
  function escapeHTML(value){
    return String(value==null?'':value).replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a||1;};
  const lcm=(a,b)=>Math.abs(a*b)/(gcd(a,b)||1);
  const ratioText=(n,d)=>d?`${n}/${d}`:'0';
  function roundedRect(ctx,x,y,w,h,r){
    const radius=Math.min(r,w/2,h/2);
    if(ctx.roundRect){ctx.roundRect(x,y,w,h,radius);ctx.closePath();return;}
    ctx.moveTo(x+radius,y);
    ctx.lineTo(x+w-radius,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+radius);
    ctx.lineTo(x+w,y+h-radius);
    ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);
    ctx.lineTo(x+radius,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-radius);
    ctx.lineTo(x,y+radius);
    ctx.quadraticCurveTo(x,y,x+radius,y);
    ctx.closePath();
  }
  function stripHTML(value){
  return String(value==null?'':value).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}
function getCurrentConceptNames(){
  return (document.body?.dataset?.concept || '')
    .split(/[,，]/)
    .map(s=>s.trim())
    .filter(Boolean);
}

// === 错题本（P2） ===
const MISTAKE_KEY='math5_mistake_book';
function hashText(value){
  let h=2166136261;
  const s=String(value||'');
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return (h>>>0).toString(36);
}
function normalizeMistakeBook(raw){
  const book = raw && typeof raw==='object' ? raw : {};
  const items = Array.isArray(book.items) ? book.items : [];
  return {version:2,updatedAt:book.updatedAt||'',items};
}
function getMistakeBook(){
  try{return normalizeMistakeBook(JSON.parse(localStorage.getItem(MISTAKE_KEY)||'{}'));}catch{return normalizeMistakeBook({});}
}
function saveMistakeBook(book){
  const clean=normalizeMistakeBook(book);
  clean.updatedAt=new Date().toISOString();
  clean.items=clean.items.slice(-220);
  localStorage.setItem(MISTAKE_KEY,JSON.stringify(clean));
  window.dispatchEvent(new CustomEvent('math5MistakeBookChanged',{detail:clean}));
  setTimeout(()=>{try{renderMistakeReviewSections();}catch(e){}},0);
  return clean;
}
function mistakeIdFor(payload){
  const concepts=(payload.concepts||getCurrentConceptNames()).join('|');
  return hashText([concepts,payload.type||'练习',stripHTML(payload.question||'')].join('::'));
}
function recordMistake(payload){
  const concepts=(payload.concepts||getCurrentConceptNames()).filter(Boolean);
  if(!concepts.length)return null;
  const question=stripHTML(payload.question||'');
  if(!question)return null;
  const book=getMistakeBook();
  const id=payload.id||mistakeIdFor({...payload,concepts,question});
  const now=new Date().toISOString();
  let item=book.items.find(x=>x.id===id);
  if(item){
    item.resolved=false;
    item.attempts=(item.attempts||0)+1;
    item.lastAt=now;
    item.userAnswer=stripHTML(payload.userAnswer||item.userAnswer||'');
    item.expected=stripHTML(payload.expected||item.expected||'');
    item.hint=stripHTML(payload.hint||item.hint||'');
  }else{
    item={
      id,
      concepts,
      primary:concepts[0],
      type:payload.type||'练习',
      question,
      userAnswer:stripHTML(payload.userAnswer||''),
      expected:stripHTML(payload.expected||''),
      hint:stripHTML(payload.hint||''),
      source:payload.source||document.title||location.pathname,
      attempts:1,
      resolved:false,
      firstAt:now,
      lastAt:now
    };
    book.items.push(item);
  }
  saveMistakeBook(book);
  return item;
}
function resolveMistake(payload){
  const concepts=(payload.concepts||getCurrentConceptNames()).filter(Boolean);
  const id=payload.id||mistakeIdFor({...payload,concepts});
  const book=getMistakeBook();
  const item=book.items.find(x=>x.id===id);
  if(item && !item.resolved){
    item.resolved=true;
    item.resolvedAt=new Date().toISOString();
    saveMistakeBook(book);
  }
}
function getUnresolvedMistakes(concepts){
  const names=new Set((concepts||getCurrentConceptNames()).filter(Boolean));
  return getMistakeBook().items.filter(item=>{
    if(item.resolved)return false;
    return (item.concepts||[]).some(name=>names.has(name));
  }).sort((a,b)=>(b.lastAt||'').localeCompare(a.lastAt||''));
}
function markMistakeResolved(id){
  const book=getMistakeBook();
  const item=book.items.find(x=>x.id===id);
  if(!item)return;
  item.resolved=true;
  item.resolvedAt=new Date().toISOString();
  saveMistakeBook(book);
  renderMistakeReviewSections();
}
function clearConceptMistakes(concepts){
  const names=new Set((concepts||getCurrentConceptNames()).filter(Boolean));
  const book=getMistakeBook();
  let changed=false;
  book.items.forEach(item=>{
    if(!item.resolved && (item.concepts||[]).some(name=>names.has(name))){
      item.resolved=true;
      item.resolvedAt=new Date().toISOString();
      changed=true;
    }
  });
  if(changed)saveMistakeBook(book);
  renderMistakeReviewSections();
}

// 滚动进度条
function initScrollProgress(){
  const bar=document.createElement('div');
  bar.className='scroll-progress';bar.id='scroll-bar';
  document.body.prepend(bar);
  window.addEventListener('scroll',()=>{
    const h=document.documentElement.scrollHeight-window.innerHeight;
    bar.style.width=h>0?Math.min((window.scrollY/h)*100,100)+'%':'0%';
  },{passive:true});
}

// === 前置门控 ===
function createGate(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const q=opts.questions||[];
  c.innerHTML=`<div class="gate">
    <h3>🔑 前置检查</h3>
    <p style="color:var(--text-muted);font-size:14px;margin-bottom:16px;">通过后才能进入本课——确保你准备好了</p>
    <div class="gate-questions"></div>
    <button class="btn btn-primary" id="gate-submit">检查</button>
    <div class="gate-result" id="gate-result"></div>
  </div>`;
  const qc=c.querySelector('.gate-questions');
  q.forEach((qItem,i)=>{
    const d=document.createElement('div');
    d.style.cssText='margin:10px 0;display:flex;align-items:center;gap:8px;justify-content:center;flex-wrap:wrap;';
    d.dataset.questionIndex=String(i);
    d.innerHTML=`<span>${i+1}. ${qItem.label}</span>`;
    if(qItem.inputs){
      const inputGroup=document.createElement('span');
      inputGroup.style.cssText='display:inline-flex;align-items:center;gap:4px;';
      qItem.inputs.forEach((inp,j)=>{
        if(j>0)inputGroup.innerHTML+='<span style="color:var(--text-muted)">, </span>';
        const el=document.createElement('input');
        el.className='input-field';
        el.style.width=(inp.width||50)+'px';
        el.type='text';el.placeholder=inp.placeholder||'';
        el.dataset.key=inp.key;
        el.dataset.questionIndex=String(i);
        el.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('gate-submit').click();});
        inputGroup.appendChild(el);
      });
      d.appendChild(inputGroup);
    }
    qc.appendChild(d);
  });
  document.getElementById('gate-submit').addEventListener('click',()=>{
    const r=document.getElementById('gate-result');
    let allCorrect=true;
    q.forEach((qItem,i)=>{
      let answer={};
      const questionEl=qc.querySelector(`[data-question-index="${i}"]`);
      if(qItem.inputs){
        qItem.inputs.forEach(inp=>{
          const found=questionEl?questionEl.querySelector(`.input-field[data-key="${inp.key}"]`):null;
          if(found)answer[inp.key]=found.value.trim();
        });
      }
      const correct=qItem.check(answer);
      if(!correct){
        allCorrect=false;
        recordMistake({
          concepts:getCurrentConceptNames(),
          type:'前置检查',
          question:qItem.label||qItem.q||`前置检查 ${i+1}`,
          userAnswer:Object.values(answer).join(', '),
          expected:qItem.answer||qItem.expected||'回到前置知识再试',
          hint:qItem.hint||'先确认进入本课必须具备的旧知识。'
        });
        if(qItem.inputs){
          qItem.inputs.forEach(inp=>{
            const found=questionEl?questionEl.querySelector(`.input-field[data-key="${inp.key}"]`):null;
            if(found)found.className='input-field wrong';
          });
        }
      }else{
        resolveMistake({
          concepts:getCurrentConceptNames(),
          type:'前置检查',
          question:qItem.label||qItem.q||`前置检查 ${i+1}`
        });
        if(qItem.inputs){
          qItem.inputs.forEach(inp=>{
            const found=questionEl?questionEl.querySelector(`.input-field[data-key="${inp.key}"]`):null;
            if(found)found.className='input-field correct';
          });
        }
      }
    });
    if(allCorrect){
      r.innerHTML='✅ 全部正确！进入课程...';
      r.className='gate-result success';
      celebrate(r);
      setTimeout(()=>{if(opts.onPass)opts.onPass();},600);
    }else{
      r.innerHTML='❌ 有题目回答错误，请改正后再试';
      r.className='gate-result fail';
    }
  });
}

// === 分层练习 ===
function createExerciseSet(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const conceptNames = opts.conceptNames || getCurrentConceptNames();
  const exs=enrichPracticeExercises(opts.exercises||[], conceptNames, opts.minExercises || 3);
  let state=exs.map(()=>({status:'pending',answer:''}));
  let attemptedCount=0,correctCount=0;

  function render(){
    let html='';
    exs.forEach((ex,i)=>{
      const s=state[i];
      const borderColor=s.status==='correct'?'var(--success)':s.status==='wrong'?'var(--danger)':'var(--border)';
      html+=`<div class="exercise-item" style="border-color:${borderColor}">
        <span class="q-num">${i+1}</span> ${ex.question}
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          ${ex.inputs?ex.inputs.map((inp,j)=>{
            return (j>0?' <span style="color:var(--text-muted);font-size:13px;">, </span>':'')+
              `<input class="input-field" id="ex-${opts.containerId}-${i}-${inp.key}" type="text" style="width:${inp.width||60}px;" value="${s.answer||''}" ${s.status!=='pending'?'disabled':''}>`;
          }).join(''):`<input class="input-field" id="ex-${opts.containerId}-${i}" type="text" style="width:${ex.width||60}px;" value="${s.answer||''}" ${s.status!=='pending'?'disabled':''}>`}
          <button class="btn btn-primary btn-sm" data-ex="${i}" ${s.status!=='pending'?'disabled':''}>提交</button>
          ${s.status==='correct'?'<span style="color:var(--success);font-size:18px;">✅</span>':s.status==='wrong'?'<span style="color:var(--danger);font-size:18px;">❌</span>':''}
        </div>
        ${s.status==='wrong'&&ex.hint?`<div style="margin-top:6px;font-size:13px;color:var(--warning);">💡 ${ex.hint}</div>`:''}
      </div>`;
    });
    c.innerHTML=html;

    c.querySelectorAll('[data-ex]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const i=parseInt(btn.dataset.ex);
        const ex=exs[i];
        if(state[i].status!=='pending')return;
        let userAnswer={};
        if(ex.inputs){
          ex.inputs.forEach(inp=>{
            const el=document.getElementById(`ex-${opts.containerId}-${i}-${inp.key}`);
            if(el)userAnswer[inp.key]=el.value.trim();
          });
        }else{
          const el=document.getElementById(`ex-${opts.containerId}-${i}`);
          if(el)userAnswer={a:el.value.trim()};
        }
        const correct=ex.check(userAnswer);
        state[i].status=correct?'correct':'wrong';
        state[i].answer=ex.inputs?ex.inputs.map(inp=>userAnswer[inp.key]||'').join(', '):userAnswer.a;
        const question=stripHTML(ex.question||`练习 ${i+1}`);
        if(correct){
          resolveMistake({concepts:conceptNames,type:'练习',question});
        }else{
          recordMistake({
            concepts:conceptNames,
            type:'练习',
            question,
            userAnswer:state[i].answer,
            expected:ex.expected||ex.answer||'查看提示并重新理解',
            hint:ex.hint||'先回到概念模型，再判断单位和条件。'
          });
        }
        attemptedCount++;
        if(correct)correctCount++;
        render();
        checkComplete();
      });
    });
  }

  function checkComplete(){
    const attempted=state.filter(s=>s.status!=='pending').length;
    if(attempted===exs.length){
      const rate=correctCount/exs.length;
      if(rate>=(opts.passThreshold||0.7)&&opts.onPass){
        const doneEl=document.getElementById('done');
        if(doneEl)celebrate(doneEl);
        opts.onPass();
      }
    }
  }

  render();
}

// === 对抗挑战 ===
function createAdversarialChallenge(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const conceptNames = opts.conceptNames || getCurrentConceptNames();
  const challenges=enrichAdversarialChallenges(opts.challenges||[], conceptNames, opts.minChallenges || 4);
  const state=challenges.map(()=>({correct:false,last:null}));

  function render(){
    const done=state.filter(s=>s.correct).length;
    c.innerHTML=`<div class="adversary-root">
      <div class="adversary-top">
        <div>
          <div class="adversary-kicker">错误说法挑战</div>
          <p>先判断，再找理由。真正理解一个概念，要能说清它什么时候不能用。</p>
        </div>
        <div class="adversary-progress">${done}/${challenges.length}</div>
      </div>
      <div class="adversary-list"></div>
      <div class="adversary-complete" style="${done===challenges.length&&challenges.length?'display:block;':'display:none;'}">✅ 已完成本课对抗挑战</div>
    </div>`;
    const list=c.querySelector('.adversary-list');
    challenges.forEach((challenge,i)=>{
      const s=state[i];
      const card=document.createElement('div');
      card.className='adversary-card '+(s.correct?'correct':s.last?'wrong':'');
      card.innerHTML=`<div class="adversary-meta">
          <span class="tag tag-orange">${escapeHTML(challenge.tag||'概念辨析')}</span>
          <span>挑战 ${i+1}</span>
        </div>
        <div class="adversary-statement">${escapeHTML(challenge.statement)}</div>
        <div class="adversary-actions">
          <button class="btn btn-outline btn-sm" data-choice="agree" data-index="${i}" ${s.correct?'disabled':''}>同意</button>
          <button class="btn btn-primary btn-sm" data-choice="refute" data-index="${i}" ${s.correct?'disabled':''}>反驳</button>
        </div>
        <div class="adversary-feedback ${s.correct?'show success':s.last?'show hint':''}">
          ${s.correct?renderSuccess(challenge):s.last?renderHint(challenge):''}
        </div>`;
      list.appendChild(card);
    });

    c.querySelectorAll('[data-choice]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const i=parseInt(btn.dataset.index,10);
        const choice=btn.dataset.choice;
        const answer=challenges[i].answer||'refute';
        if(choice===answer){
          state[i].correct=true;
          state[i].last=choice;
          resolveMistake({concepts:conceptNames,type:'对抗挑战',question:challenges[i].statement});
        }else{
          state[i].last=choice;
          recordMistake({
            concepts:conceptNames,
            type:'对抗挑战',
            question:challenges[i].statement,
            userAnswer:choice==='agree'?'同意':'反驳',
            expected:answer==='agree'?'同意':'反驳',
            hint:challenges[i].hint||'检查这句话是否少条件，或者能否举反例。'
          });
        }
        render();
        if(state.every(s=>s.correct)){
          const complete=c.querySelector('.adversary-complete');
          if(complete)celebrate(complete);
          if(opts.onComplete)opts.onComplete();
        }
      });
    });
  }

  function renderSuccess(challenge){
    const verdict=challenge.answer==='agree'?'这句话成立。':'这句话有漏洞。';
    const explanation=challenge.explanation?`<div><b>${verdict}</b>${escapeHTML(challenge.explanation)}</div>`:`<div><b>${verdict}</b></div>`;
    const counterexample=challenge.counterexample?`<div class="adversary-counter"><b>反例/条件：</b>${escapeHTML(challenge.counterexample)}</div>`:'';
    return explanation+counterexample;
  }
  function renderHint(challenge){
    return `<b>再想一次：</b>${escapeHTML(challenge.hint||'检查这句话有没有少条件，或者能不能举出一个反例。')}`;
  }

  render();
}

// === 费曼填空 ===
function createFeynmanFill(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const conceptNames = opts.conceptNames || getCurrentConceptNames();
  const tpl=opts.template;
  const ans=opts.answer||[];
  let blanks=tpl.match(/___/g);
  if(!blanks)return;
  let parts=tpl.split('___');
  let userInputs=new Array(blanks.length).fill('');

  function render(){
    let html='<div class="feynman-card">';
    html+='<div class="feynman-kicker">用自己的话复述，不背口诀</div><div class="feynman-fill">';
    parts.forEach((p,i)=>{
      html+=p;
      if(i<blanks.length){
        html+=`<input class="input-field" id="feyn-${i}" type="text" style="width:${Math.max(60,20+30*(ans[i]||'').length)}px;margin:0 2px;" value="${userInputs[i]}">`;
      }
    });
    html+='</div>';
    html+=`<div style="text-align:center;margin-top:16px;">
      <button class="btn btn-success" id="feyn-submit">检查答案</button>
      <button class="btn btn-outline btn-sm" id="feyn-reset" style="margin-left:8px;">重置</button>
    </div><div class="feedback" id="feyn-result"></div>
    <div class="feynman-reflection" id="feyn-reflection" hidden>
      <label>再用一句话讲给低年级同学听</label>
      <textarea rows="2" placeholder="例如：我会先看单位是否相同，再决定能不能直接计算。"></textarea>
    </div></div>`;
    c.innerHTML=html;

    // Enter key
    document.querySelectorAll('[id^="feyn-"]').forEach(el=>{
      if(el.id!=='feyn-submit'&&el.id!=='feyn-reset'){
        el.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('feyn-submit').click();});
      }
    });

    document.getElementById('feyn-submit').addEventListener('click',()=>{
      let correct=true;
      for(let i=0;i<ans.length;i++){
        const el=document.getElementById(`feyn-${i}`);
        if(!el)continue;
        const v=el.value.trim();
        userInputs[i]=v;
        if(v===ans[i])el.className='input-field correct';
        else{el.className='input-field wrong';correct=false;}
      }
      const r=document.getElementById('feyn-result');
      if(correct){
        resolveMistake({concepts:conceptNames,type:'费曼输出',question:tpl});
        r.className='feedback show success';
        r.innerHTML='🎉 完美！你理解得很透彻！';
        const reflection=document.getElementById('feyn-reflection');
        if(reflection)reflection.hidden=false;
        celebrate(r);
        if(opts.onComplete)opts.onComplete();
      }else{
        recordMistake({
          concepts:conceptNames,
          type:'费曼输出',
          question:tpl,
          userAnswer:userInputs.join(' / '),
          expected:ans.join(' / '),
          hint:'费曼输出卡住时，说明概念还需要回到图形或例子重新讲一遍。'
        });
        r.className='feedback show error';
        const wrongCount=ans.filter((a,i)=>userInputs[i]!==a).length;
        r.innerHTML=`有${wrongCount}个填空不正确，再想想看。`;
      }
    });

    document.getElementById('feyn-reset').addEventListener('click',()=>{
      for(let i=0;i<ans.length;i++){
        const el=document.getElementById(`feyn-${i}`);
        if(el){el.value='';el.className='input-field';}
        userInputs[i]='';
      }
      const r=document.getElementById('feyn-result');
      r.className='feedback';
      r.innerHTML='';
    });
  }
  render();
}

// === 数轴组件 ===
function createNumberLine(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const min=Number(opts.min??0), max=Number(opts.max??10);
  const step=Math.max(Number(opts.step??1),0.000001), unit=opts.unit||'';
  const initial=clamp(Number(opts.initial??opts.initialValue??min),min,max);
  const title=opts.title||'数轴操作台';
  const description=opts.description||'拖动游标，观察数的位置、方向和移动距离。';
  const accent=opts.color||'#3b82f6';
  const decimals=Math.min(4,String(step).includes('.')?String(step).split('.')[1].length:0);
  const canvas=document.createElement('canvas');
  canvas.className='number-line-canvas';
  canvas.setAttribute('aria-label',title);
  const info=document.createElement('div');
  info.className='number-line-info';
  const controls=document.createElement('div');
  controls.className='number-line-controls';
  const jumps=(opts.jumps||opts.jumpSteps||[]).map(v=>Number(v)).filter(Number.isFinite);
  controls.innerHTML='<button class="btn btn-outline btn-sm" type="button" data-nl-reset>回到起点</button>'+
    jumps.map(v=>`<button class="btn btn-outline btn-sm" type="button" data-nl-jump="${v}">${v>0?'+':''}${formatStatic(v)}</button>`).join('');
  let value=initial;
  c.innerHTML=`<div class="component-card number-line-card">
    <div class="component-card-head">
      <div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(description)}</p></div>
    </div>
    <div class="number-line-stage"></div>
  </div>`;
  const stage=c.querySelector('.number-line-stage');
  stage.append(canvas,info,controls);

  function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,Number.isFinite(v)?v:lo));}
  function formatStatic(v){
    const fixed=decimals?Number(v).toFixed(decimals):String(Math.round(v));
    return fixed.includes('.')?fixed.replace(/\.?0+$/,''):fixed;
  }
  function fractionLabel(v){
    const denominator=Number(opts.denominator||opts.fractionDenominator||10);
    if(!opts.fractionTicks || !Number.isFinite(denominator) || denominator<=0)return null;
    const n=Math.round(v*denominator);
    if(Math.abs(n/denominator-v)>1e-6)return null;
    if(n===0)return '0';
    if(n===denominator)return '1';
    const g=gcd(n,denominator);
    return `${n/g}/${denominator/g}`;
  }
  function formatValue(v){
    const frac=fractionLabel(v);
    if(frac)return frac;
    const fixed=decimals?Number(v).toFixed(decimals):String(Math.round(v));
    return fixed.includes('.')?fixed.replace(/\.?0+$/,''):fixed;
  }
  function snap(v){
    if(v>=max-step/2)return max;
    if(v<=min+step/2)return min;
    const snapped=min+Math.round((v-min)/step)*step;
    return clamp(Number(snapped.toFixed(Math.max(decimals,3))),min,max);
  }

  function draw(){
    const ctx=canvas.getContext('2d'), w=canvas.width, h=canvas.height;
    const pad=Math.max(36,Math.min(56,w*.1)), lw=w-2*pad, cy=Math.round(h*.56);
    const range=max-min||1;
    const anchorPos=pad+(initial-min)/range*lw;
    const pos=pad+(value-min)/range*lw;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#cbd5e1';ctx.lineWidth=3;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(pad,cy);ctx.lineTo(w-pad,cy);ctx.stroke();

    const tickCount=Math.min(10,Math.max(2,Math.ceil((max-min)/step)));
    ctx.font='12px sans-serif';ctx.textAlign='center';
    for(let i=0;i<=tickCount;i++){
      const ratio=i/tickCount, x=pad+ratio*lw, v=min+ratio*(max-min);
      ctx.strokeStyle=i===0||i===tickCount?'#94a3b8':'#cbd5e1';ctx.lineWidth=i===0||i===tickCount?2:1;
      ctx.beginPath();ctx.moveTo(x,cy-8);ctx.lineTo(x,cy+8);ctx.stroke();
      ctx.fillStyle='#64748b';ctx.fillText(formatValue(v),x,cy+26);
    }
    (opts.markers||[]).forEach(marker=>{
      const mv=Number(typeof marker==='number'?marker:marker.value);
      if(!Number.isFinite(mv)||mv<min||mv>max)return;
      const mx=pad+(mv-min)/range*lw;
      ctx.fillStyle=(marker.color||'#10b981')+'22';
      ctx.beginPath();ctx.arc(mx,cy,18,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=marker.color||'#10b981';
      ctx.beginPath();ctx.arc(mx,cy,6,0,Math.PI*2);ctx.fill();
      ctx.font='800 12px sans-serif';ctx.textAlign='center';
      ctx.fillText(marker.label||formatValue(mv),mx,cy-26);
    });

    ctx.strokeStyle='#f59e0b';ctx.lineWidth=2;ctx.setLineDash([5,5]);
    ctx.beginPath();ctx.moveTo(anchorPos,cy-28);ctx.lineTo(anchorPos,cy+8);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#92400e';ctx.font='800 12px sans-serif';ctx.fillText('起点 '+formatValue(initial),anchorPos,cy-36);

    if(Math.abs(value-initial)>step/1000){
      const left=Math.min(anchorPos,pos), right=Math.max(anchorPos,pos), mid=(left+right)/2;
      const arcH=Math.max(28,Math.min(70,(right-left)*.32));
      ctx.strokeStyle=accent;ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(anchorPos,cy-18);
      ctx.quadraticCurveTo(mid,cy-18-arcH,pos,cy-18);
      ctx.stroke();
      ctx.fillStyle=accent;
      ctx.beginPath();
      if(pos>=anchorPos){
        ctx.moveTo(pos,cy-18);ctx.lineTo(pos-10,cy-23);ctx.lineTo(pos-8,cy-11);
      }else{
        ctx.moveTo(pos,cy-18);ctx.lineTo(pos+10,cy-23);ctx.lineTo(pos+8,cy-11);
      }
      ctx.closePath();ctx.fill();
    }

    ctx.fillStyle='rgba(59,130,246,.12)';
    ctx.beginPath();ctx.arc(pos,cy,22,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=accent;ctx.strokeStyle='#fff';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(pos,cy,13,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='800 12px sans-serif';ctx.textAlign='center';
    ctx.fillText(formatValue(value),pos,cy+4);

    const delta=value-initial;
    const deltaText=Math.abs(delta)<step/1000?'没有移动':(delta>0?'向右移动 ':'向左移动 ')+formatValue(Math.abs(delta))+unit;
    info.innerHTML=`<strong>${formatValue(value)}${escapeHTML(unit)}</strong><span>当前值</span><b>${escapeHTML(deltaText)}</b><em>每格 ${formatValue(step)}${escapeHTML(unit)}</em>`;
  }
  function getValueFromX(x){
    const rect=canvas.getBoundingClientRect(), pad=Math.max(36,Math.min(56,canvas.width*.1)), lw=canvas.width-2*pad;
    const ratio=Math.max(0,Math.min(1,((x-rect.left)*(canvas.width/rect.width)-pad)/lw));
    return snap(min+ratio*(max-min));
  }
  function setValue(v,notify=true){
    value=snap(v);
    draw();
    if(notify&&opts.onChange)opts.onChange(value);
  }
  function animateTo(target,duration=520){
    const from=value,to=snap(target),start=performance.now();
    function frame(now){
      const t=Math.min(1,(now-start)/duration);
      const eased=1-Math.pow(1-t,3);
      value=snap(from+(to-from)*eased);
      draw();
      if(t<1)requestAnimationFrame(frame);
      else setValue(to);
    }
    requestAnimationFrame(frame);
  }

  let dragging=false;
  canvas.addEventListener('pointerdown',e=>{dragging=true;canvas.setPointerCapture?.(e.pointerId);setValue(getValueFromX(e.clientX));});
  canvas.addEventListener('pointermove',e=>{if(dragging)setValue(getValueFromX(e.clientX));});
  canvas.addEventListener('pointerup',()=>{dragging=false;});
  canvas.addEventListener('pointercancel',()=>{dragging=false;});
  controls.addEventListener('click',e=>{
    if(e.target?.dataset?.nlReset!==undefined)setValue(initial);
    if(e.target?.dataset?.nlJump!==undefined)animateTo(value+Number(e.target.dataset.nlJump));
  });
  function resize(){
    canvas.width=Math.max(280,Math.min(680,c.clientWidth-32||620));
    canvas.height=170;
    draw();
  }
  resize();
  window.addEventListener('resize',resize);
  return {getValue:()=>value,setValue,animateTo,jump:delta=>animateTo(value+Number(delta||0)),draw,render:draw,destroy:()=>window.removeEventListener('resize',resize)};
}

// === 面积模型组件 ===
function createAreaModel(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const cols=Math.max(1,opts.cols||5), rows=Math.max(1,opts.rows||3);
  let highlightCols=opts.highlightCols==null?Math.min(cols,2):Math.max(0,Math.min(cols,opts.highlightCols));
  let highlightRows=opts.highlightRows==null?Math.min(rows,2):Math.max(0,Math.min(rows,opts.highlightRows));
  const title=opts.title||'面积模型';
  const description=opts.description||'拖动或点击方格，观察面积如何由“单位格”累积而成。';
  const fillColor=opts.color||'#3b82f6';
  const canvas=document.createElement('canvas');
  canvas.className='area-model-canvas';
  canvas.setAttribute('aria-label',title);
  const info=document.createElement('div');
  info.className='area-model-info';
  const controls=document.createElement('div');
  controls.className='area-model-controls';
  controls.innerHTML='<button class="btn btn-outline btn-sm" type="button" data-area-action="full">选满</button><button class="btn btn-outline btn-sm" type="button" data-area-action="clear">清空</button>';
  c.innerHTML=`<div class="component-card area-model-card">
    <div class="component-card-head">
      <div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(description)}</p></div>
    </div>
    <div class="area-model-stage"></div>
  </div>`;
  const stage=c.querySelector('.area-model-stage');
  stage.append(canvas,info,controls);

  const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a||1;};
  function fractionText(part,total){
    if(total<=0)return '';
    const g=gcd(part,total);
    return `${part/g}/${total/g}`;
  }
  function emit(){
    const selected=highlightCols*highlightRows;
    const total=cols*rows;
    if(opts.onChange)opts.onChange({cols:highlightCols,rows:highlightRows,total:selected,all:total,fraction:fractionText(selected,total)});
  }

  function draw(){
    const ctx=canvas.getContext('2d'), w=canvas.width, h=canvas.height;
    const pad=36;
    const gridW=w-pad*2, gridH=h-pad*2-24;
    const cell=Math.max(18,Math.min(gridW/cols,gridH/rows));
    const totalW=cell*cols, totalH=cell*rows;
    const ox=(w-totalW)/2, oy=28;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#1e293b';ctx.font='800 14px sans-serif';ctx.textAlign='center';
    ctx.fillText(`${cols} 列 × ${rows} 行`,w/2,18);
    for(let r=0;r<rows;r++){
      for(let ct=0;ct<cols;ct++){
        const x=ox+ct*cell, y=oy+r*cell, hl=ct<highlightCols&&r<highlightRows;
        ctx.fillStyle=hl?hexToRGBA(fillColor,.32):'rgba(148,163,184,0.10)';
        ctx.fillRect(x,y,cell,cell);
        ctx.strokeStyle=hl?fillColor:'#cbd5e1';
        ctx.lineWidth=hl?2:1;
        ctx.strokeRect(x,y,cell,cell);
        if(hl&&cell>28){
          ctx.fillStyle=fillColor;ctx.globalAlpha=.95;
          ctx.beginPath();ctx.arc(x+cell/2,y+cell/2,Math.min(4,cell*.13),0,Math.PI*2);ctx.fill();
          ctx.globalAlpha=1;
        }
      }
    }
    if(highlightCols>0&&highlightRows>0){
      ctx.strokeStyle='#f59e0b';ctx.lineWidth=3;ctx.setLineDash([8,5]);
      ctx.strokeRect(ox,oy,highlightCols*cell,highlightRows*cell);
      ctx.setLineDash([]);
      ctx.fillStyle='#92400e';ctx.font='800 13px sans-serif';ctx.textAlign='left';
      ctx.fillText(`${highlightCols} × ${highlightRows}`,ox+8,oy+Math.min(22,highlightRows*cell-6));
    }
    const selected=highlightCols*highlightRows;
    const total=cols*rows;
    info.innerHTML=`<strong>${selected}</strong><span>/ ${total} 个单位格</span><b>${highlightCols} × ${highlightRows} = ${selected}</b><em>占整体 ${fractionText(selected,total)}</em>`;
  }

  function hexToRGBA(hex,alpha){
    const v=String(hex).replace('#','');
    if(!/^[0-9a-fA-F]{6}$/.test(v))return `rgba(59,130,246,${alpha})`;
    const r=parseInt(v.slice(0,2),16), g=parseInt(v.slice(2,4),16), b=parseInt(v.slice(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  function setFromPoint(clientX,clientY){
    const rect=canvas.getBoundingClientRect();
    const scaleX=canvas.width/rect.width, scaleY=canvas.height/rect.height;
    const x=(clientX-rect.left)*scaleX, y=(clientY-rect.top)*scaleY;
    const pad=36;
    const gridW=canvas.width-pad*2, gridH=canvas.height-pad*2-24;
    const cell=Math.max(18,Math.min(gridW/cols,gridH/rows));
    const ox=(canvas.width-cell*cols)/2, oy=28;
    if(x<ox||y<oy||x>ox+cols*cell||y>oy+rows*cell)return;
    const ct=Math.min(cols-1,Math.floor((x-ox)/cell)), rw=Math.min(rows-1,Math.floor((y-oy)/cell));
    highlightCols=ct+1;highlightRows=rw+1;
    draw();
    emit();
  }
  let dragging=false;
  canvas.addEventListener('pointerdown',e=>{dragging=true;canvas.setPointerCapture?.(e.pointerId);setFromPoint(e.clientX,e.clientY);});
  canvas.addEventListener('pointermove',e=>{if(dragging)setFromPoint(e.clientX,e.clientY);});
  canvas.addEventListener('pointerup',()=>{dragging=false;});
  canvas.addEventListener('pointercancel',()=>{dragging=false;});
  controls.addEventListener('click',e=>{
    const action=e.target?.dataset?.areaAction;
    if(!action)return;
    if(action==='full'){highlightCols=cols;highlightRows=rows;}
    if(action==='clear'){highlightCols=0;highlightRows=0;}
    draw();emit();
  });
  function resize(){
    const width=Math.max(280,Math.min(680,c.clientWidth-32||620));
    canvas.width=width;
    canvas.height=Math.max(220,Math.min(420,rows*44+92));
    draw();
  }
  resize();
  window.addEventListener('resize',resize);
  emit();
  return {
    getDimensions:()=>({cols:highlightCols,rows:highlightRows,total:highlightCols*highlightRows,all:cols*rows,fraction:fractionText(highlightCols*highlightRows,cols*rows)}),
    reset:(cl,rw)=>{highlightCols=Math.max(0,Math.min(cols,cl||0));highlightRows=Math.max(0,Math.min(rows,rw||0));draw();emit();},
    setSelection:(cl,rw)=>{highlightCols=Math.max(0,Math.min(cols,cl||0));highlightRows=Math.max(0,Math.min(rows,rw||0));draw();emit();},
    draw
  };
}

// === 分数条组件：Canvas 等值变形/通分/约分底座 ===
function createFractionBar(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const maxDen=Math.max(2,opts.maxDenominator||36);
  const title=opts.title||'分数条操作台';
  const description=opts.description||'拖动分子和分母，观察分数值如何在等值变形中保持不变。';
  const baseBars=(opts.bars&&opts.bars.length?opts.bars:[{
    label:opts.label||'分数',
    numerator:opts.numerator??1,
    denominator:opts.denominator||4,
    color:opts.color||'#3b82f6'
  }]).map((bar,index)=>({
    label:bar.label||`分数 ${index+1}`,
    numerator:Math.max(0,Number(bar.numerator??1)),
    denominator:Math.max(1,Number(bar.denominator||4)),
    color:bar.color||['#3b82f6','#f59e0b','#16a34a','#8b5cf6'][index%4],
    originalNumerator:Math.max(0,Number(bar.numerator??1)),
    originalDenominator:Math.max(1,Number(bar.denominator||4))
  }));
  let bars=baseBars.map(bar=>({...bar,displayDenominator:bar.denominator}));
  let activeIndex=0;
  let showCommon=false;
  c.innerHTML=`<div class="component-card fraction-bar-card fraction-canvas-card">
    <div class="component-card-head">
      <div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(description)}</p></div>
    </div>
    <canvas class="fraction-bar-canvas" aria-label="${escapeHTML(title)}"></canvas>
    <div class="fraction-bar-readout"></div>
    <div class="fraction-bar-controls">
      <label>分子 <input class="fraction-num" type="range" min="0" max="${bars[0].denominator}" value="${bars[0].numerator}"><span data-fb-num>${bars[0].numerator}</span></label>
      <label>分母 <input class="fraction-den" type="range" min="1" max="${maxDen}" value="${bars[0].denominator}"><span data-fb-den>${bars[0].denominator}</span></label>
    </div>
    <div class="component-toolbar">
      <button type="button" data-fraction-action="common">通分到公分母</button>
      <button type="button" data-fraction-action="simplify">约成最简</button>
      <button type="button" data-fraction-action="double">等值放大 ×2</button>
      <button type="button" data-fraction-action="reset">还原</button>
    </div>
    <div class="fraction-bar-equivalents"></div>
  </div>`;
  const canvas=c.querySelector('.fraction-bar-canvas');
  const ctx=canvas.getContext('2d');
  const readout=c.querySelector('.fraction-bar-readout');
  const eqBar=c.querySelector('.fraction-bar-equivalents');
  const numInput=c.querySelector('.fraction-num');
  const denInput=c.querySelector('.fraction-den');
  const numText=c.querySelector('[data-fb-num]');
  const denText=c.querySelector('[data-fb-den]');

  function commonDenominator(){
    return bars.reduce((acc,bar)=>lcm(acc,bar.denominator),1);
  }
  function displayNumerator(bar){
    return Math.round(bar.numerator*(bar.displayDenominator/bar.denominator));
  }
  function emit(){
    if(opts.onChange)opts.onChange({
      bars:bars.map(bar=>({label:bar.label,numerator:bar.numerator,denominator:bar.denominator,displayNumerator:displayNumerator(bar),displayDenominator:bar.displayDenominator,value:bar.numerator/bar.denominator})),
      commonDenominator:commonDenominator()
    });
  }
  function resize(){
    const width=Math.max(300,Math.min(720,c.clientWidth-32||640));
    const height=Math.max(190,92+bars.length*58);
    const ratio=window.devicePixelRatio||1;
    canvas.style.width=width+'px';
    canvas.style.height=height+'px';
    canvas.width=Math.round(width*ratio);
    canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    draw();
  }
  function drawBar(bar,index,width){
    const left=34, right=34;
    const top=42+index*58;
    const h=26;
    const w=width-left-right;
    const d=clamp(bar.displayDenominator,1,maxDen);
    const n=clamp(displayNumerator(bar),0,d);
    ctx.fillStyle='#f8fafc';
    ctx.strokeStyle='#cbd5e1';
    ctx.lineWidth=1.5;
    ctx.beginPath();
    roundedRect(ctx,left,top,w,h,8);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    roundedRect(ctx,left,top,w,h,8);
    ctx.clip();
    ctx.fillStyle=bar.color;
    ctx.globalAlpha=.88;
    ctx.fillRect(left,top,w*(n/d),h);
    ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(15,23,42,.22)';
    ctx.lineWidth=1;
    for(let i=1;i<d;i++){
      const x=left+w*i/d;
      ctx.beginPath();
      ctx.moveTo(x,top);
      ctx.lineTo(x,top+h);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle='#1e293b';
    ctx.font='800 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`${bar.label}: ${ratioText(bar.numerator,bar.denominator)} → ${ratioText(n,d)}`,left,top-10);
    ctx.fillStyle='#64748b';
    ctx.font='12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`值保持 ${Math.round((bar.numerator/bar.denominator)*100)}%`,left+w-94,top-10);
  }
  function draw(){
    const width=canvas.clientWidth||640;
    const height=canvas.clientHeight||220;
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle='#64748b';
    ctx.font='12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(showCommon?'同一把尺子：所有分数都切到共同等份':'每条分数条长度代表分数值，刻度代表分母',34,22);
    bars.forEach((bar,index)=>drawBar(bar,index,width));
    const active=bars[activeIndex]||bars[0];
    numInput.max=active.denominator;
    numInput.value=active.numerator;
    denInput.value=active.denominator;
    numText.textContent=active.numerator;
    denText.textContent=active.denominator;
    const summaries=bars.map(bar=>{
      const dn=displayNumerator(bar), dd=bar.displayDenominator;
      return `<span><b>${escapeHTML(bar.label)}</b> ${ratioText(bar.numerator,bar.denominator)}${dd!==bar.denominator?` = ${ratioText(dn,dd)}`:''}</span>`;
    }).join('');
    readout.innerHTML=summaries;
    if(opts.showEquivalents!==false){
      const activeG=gcd(active.numerator,active.denominator);
      const sn=active.numerator/activeG, sd=active.denominator/activeG;
      const common=commonDenominator();
      eqBar.innerHTML=`<span>等值观察</span><span>公分母 <b>${common}</b></span><span>当前最简 <b>${ratioText(sn,sd)}</b></span>`;
    }
  }
  function setSingle(n,d){
    const bar=bars[activeIndex]||bars[0];
    bar.denominator=clamp(Number(d)||bar.denominator,1,maxDen);
    bar.numerator=clamp(Number(n)||0,0,bar.denominator);
    bar.displayDenominator=showCommon?commonDenominator():bar.denominator;
    draw();emit();
  }
  function update(){
    setSingle(parseInt(numInput.value)||0,parseInt(denInput.value)||1);
  }
  function applyCommon(value){
    const common=Math.max(1,Math.min(maxDen,value||commonDenominator()));
    bars.forEach(bar=>{bar.displayDenominator=common%bar.denominator===0?common:bar.denominator;});
    showCommon=true;draw();emit();
  }
  function simplifyActive(){
    const bar=bars[activeIndex]||bars[0];
    const g=gcd(bar.numerator,bar.denominator);
    bar.numerator/=g;bar.denominator/=g;bar.displayDenominator=bar.denominator;showCommon=false;draw();emit();
  }
  function reset(){
    bars=baseBars.map(bar=>({...bar,displayDenominator:bar.denominator}));
    showCommon=false;activeIndex=0;draw();emit();
  }
  numInput.addEventListener('input',update);
  denInput.addEventListener('input',()=>setSingle(Math.min(parseInt(numInput.value)||0,parseInt(denInput.value)||1),parseInt(denInput.value)||1));
  c.querySelector('.component-toolbar').addEventListener('click',event=>{
    const action=event.target?.dataset?.fractionAction;
    if(!action)return;
    if(action==='common')applyCommon();
    if(action==='simplify')simplifyActive();
    if(action==='double'){
      bars.forEach(bar=>{if(bar.denominator*2<=maxDen){bar.numerator*=2;bar.denominator*=2;bar.displayDenominator=bar.denominator;}});
      showCommon=false;draw();emit();
    }
    if(action==='reset')reset();
  });
  resize();
  window.addEventListener('resize',resize);
  emit();
  return {
    getValue:()=>{const bar=bars[activeIndex]||bars[0];return {n:bar.numerator,d:bar.denominator,numerator:bar.numerator,denominator:bar.denominator,value:bar.numerator/bar.denominator};},
    getBars:()=>bars.map(bar=>({...bar,displayNumerator:displayNumerator(bar),value:bar.numerator/bar.denominator})),
    setValue:(n,d)=>setSingle(n,d),
    setBars:(nextBars)=>{bars=nextBars.map((bar,index)=>({label:bar.label||`分数 ${index+1}`,numerator:Math.max(0,Number(bar.numerator||0)),denominator:Math.max(1,Number(bar.denominator||1)),displayDenominator:Math.max(1,Number(bar.displayDenominator||bar.denominator||1)),color:bar.color||['#3b82f6','#f59e0b','#16a34a','#8b5cf6'][index%4],originalNumerator:Number(bar.numerator||0),originalDenominator:Number(bar.denominator||1)}));resize();emit();},
    commonDenominator:applyCommon,
    simplify:simplifyActive,
    reset,
    draw
  };
}

// === 竖式除法组件：逐步推进 + 循环节高亮 ===
function createLongDivision(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  let dividend=Number(opts.dividend||1);
  let divisor=Math.max(1,Number(opts.divisor||3));
  const maxSteps=Math.max(4,opts.maxSteps||14);
  let stepIndex=0;
  let steps=[], integerPart=0, cycleStart=-1, cycleEnd=-1, terminated=false;
  c.innerHTML=`<div class="component-card long-division-card">
    <div class="component-card-head"><div><h4>${escapeHTML(opts.title||'竖式除法：发现循环节')}</h4><p>${escapeHTML(opts.description||'逐步做除法：每次余数乘10，如果某个余数再次出现，小数就开始循环。')}</p></div></div>
    <canvas class="long-division-canvas"></canvas>
    <div class="component-readout"></div>
    <div class="component-toolbar">
      <button type="button" data-ld-action="prev">上一步</button>
      <button type="button" data-ld-action="next">下一步</button>
      <button type="button" data-ld-action="finish">看到循环</button>
      <button type="button" data-ld-action="reset">重置</button>
    </div>
  </div>`;
  const canvas=c.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  const readout=c.querySelector('.component-readout');
  function compute(){
    integerPart=Math.floor(dividend/divisor);
    let rem=dividend%divisor;
    const seen=new Map();
    steps=[];cycleStart=-1;cycleEnd=-1;terminated=false;
    for(let i=0;i<maxSteps;i++){
      if(rem===0){terminated=true;break;}
      if(seen.has(rem)){cycleStart=seen.get(rem);cycleEnd=i;break;}
      seen.set(rem,i);
      const before=rem;
      const work=before*10;
      const digit=Math.floor(work/divisor);
      const next=work%divisor;
      steps.push({before,work,digit,next});
      rem=next;
    }
    stepIndex=Math.min(stepIndex,steps.length);
  }
  function decimalText(limit=stepIndex){
    const digits=steps.slice(0,limit).map(s=>s.digit).join('');
    if(!digits)return String(integerPart);
    if(cycleStart>=0 && limit>=cycleEnd){
      return `${integerPart}.${digits.slice(0,cycleStart)}(${digits.slice(cycleStart,cycleEnd)})`;
    }
    return `${integerPart}.${digits}`;
  }
  function resize(){
    const width=Math.max(300,Math.min(720,c.clientWidth-32||640));
    const height=Math.max(330,126+Math.max(6,Math.min(maxSteps,steps.length))*32);
    const ratio=window.devicePixelRatio||1;
    canvas.style.width=width+'px';canvas.style.height=height+'px';
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    draw();
  }
  function draw(){
    const width=canvas.clientWidth||640;
    const height=canvas.clientHeight||330;
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
    ctx.fillStyle='#1e293b';ctx.font='800 22px var(--font-mono), monospace';
    ctx.fillText(`${dividend} ÷ ${divisor} = ${decimalText()}`,28,42);
    ctx.strokeStyle='#cbd5e1';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(90,82);ctx.lineTo(width-34,82);ctx.stroke();
    ctx.fillStyle='#64748b';ctx.font='13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('余数轨迹：相同余数再次出现 → 后面的商会重复',28,70);
    const visible=steps.slice(0,stepIndex);
    visible.forEach((s,i)=>{
      const y=112+i*32;
      const inCycle=cycleStart>=0 && i>=cycleStart && i<cycleEnd && stepIndex>=cycleEnd;
      if(inCycle){
        ctx.fillStyle='rgba(245,158,11,.16)';
        ctx.fillRect(22,y-20,width-44,27);
      }
      ctx.fillStyle=inCycle?'#b45309':'#334155';
      ctx.font='700 14px var(--font-mono), monospace';
      ctx.fillText(`余数 ${s.before} × 10 = ${s.work}`,34,y);
      ctx.fillText(`${s.work} ÷ ${divisor} = ${s.digit} 余 ${s.next}`,230,y);
    });
    if(cycleStart>=0 && stepIndex>=cycleEnd){
      const noteY=height-46;
      ctx.fillStyle='#fff7ed';ctx.strokeStyle='#f59e0b';
      ctx.beginPath();roundedRect(ctx,28,noteY,width-56,34,10);ctx.fill();ctx.stroke();
      ctx.fillStyle='#92400e';ctx.font='800 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`循环节：${steps.slice(cycleStart,cycleEnd).map(s=>s.digit).join('')}，因为余数 ${steps[cycleStart]?.before} 重复出现。`,44,noteY+22);
    }
    const next=steps[stepIndex];
    readout.innerHTML=next
      ? `<strong>下一步</strong><span>把余数 ${next.before} 乘 10，再除以 ${divisor}。</span>`
      : `<strong>${cycleStart>=0?'发现循环':'除法结束'}</strong><span>${cycleStart>=0?'同一个余数重复，商的小数部分会循环。':'余数为 0，是有限小数。'}</span>`;
  }
  function next(){stepIndex=clamp(stepIndex+1,0,steps.length);draw();}
  function prev(){stepIndex=clamp(stepIndex-1,0,steps.length);draw();}
  function reset(){stepIndex=0;draw();}
  function finish(){stepIndex=steps.length;draw();}
  function setNumbers(nextDividend,nextDivisor){
    dividend=Number(nextDividend||dividend);
    divisor=Math.max(1,Number(nextDivisor||divisor));
    stepIndex=0;compute();draw();
  }
  c.querySelector('.component-toolbar').addEventListener('click',event=>{
    const action=event.target?.dataset?.ldAction;
    if(action==='next')next();
    if(action==='prev')prev();
    if(action==='reset')reset();
    if(action==='finish')finish();
  });
  compute();resize();window.addEventListener('resize',resize);
  return {next,prev,reset,finish,setNumbers,getState:()=>({dividend,divisor,stepIndex,steps:[...steps],cycleStart,cycleEnd,terminated,result:decimalText(steps.length)}),draw};
}

// === 折线统计图组件：拖拽数据点 + 实时重绘 ===
function createLineChartInteract(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const title=opts.title||'折线统计图操作台';
  const description=opts.description||'拖动数据点，观察折线的升降、陡缓和趋势。';
  let data=(opts.data||[8,11,9,14,18,16]).map((v,i)=>typeof v==='number'?{label:String(i+1),value:v}:{label:String(v.label??i+1),value:Number(v.value||0)});
  let min=Number.isFinite(opts.min)?opts.min:Math.min(0,...data.map(d=>d.value));
  let max=Number.isFinite(opts.max)?opts.max:Math.max(10,...data.map(d=>d.value));
  if(min===max){max=min+10;}
  let dragging=-1;
  c.innerHTML=`<div class="component-card line-chart-card">
    <div class="component-card-head"><div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(description)}</p></div></div>
    <canvas class="line-chart-canvas"></canvas>
    <div class="component-readout"></div>
  </div>`;
  const canvas=c.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  const readout=c.querySelector('.component-readout');
  function resize(){
    const width=Math.max(300,Math.min(720,c.clientWidth-32||640));
    const height=330;
    const ratio=window.devicePixelRatio||1;
    canvas.style.width=width+'px';canvas.style.height=height+'px';
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    draw();
  }
  function bounds(){
    const width=canvas.clientWidth||640, height=canvas.clientHeight||330;
    return {left:54,right:24,top:26,bottom:50,width,height,plotW:width-78,plotH:height-76};
  }
  function pointFor(index){
    const b=bounds();
    const x=b.left+(data.length===1?0.5:index/(data.length-1))*b.plotW;
    const y=b.top+(max-data[index].value)/(max-min)*b.plotH;
    return {x,y};
  }
  function valueFromY(y){
    const b=bounds();
    const ratio=clamp((b.top+b.plotH-y)/b.plotH,0,1);
    return Math.round((min+ratio*(max-min))*10)/10;
  }
  function draw(){
    const b=bounds();
    ctx.clearRect(0,0,b.width,b.height);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,b.width,b.height);
    ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1;
    ctx.fillStyle='#64748b';ctx.font='12px -apple-system, BlinkMacSystemFont, sans-serif';
    for(let i=0;i<=4;i++){
      const y=b.top+b.plotH*i/4;
      const value=max-(max-min)*i/4;
      ctx.beginPath();ctx.moveTo(b.left,y);ctx.lineTo(b.left+b.plotW,y);ctx.stroke();
      ctx.fillText(String(Math.round(value*10)/10),10,y+4);
    }
    ctx.strokeStyle='#334155';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(b.left,b.top);ctx.lineTo(b.left,b.top+b.plotH);ctx.lineTo(b.left+b.plotW,b.top+b.plotH);ctx.stroke();
    ctx.strokeStyle='#3b82f6';ctx.lineWidth=3;ctx.beginPath();
    data.forEach((_,i)=>{const p=pointFor(i);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});
    ctx.stroke();
    data.forEach((d,i)=>{
      const p=pointFor(i);
      ctx.fillStyle=i===dragging?'#f59e0b':'#3b82f6';
      ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1e293b';ctx.font='800 12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(String(d.value),p.x-10,p.y-14);
      ctx.fillStyle='#64748b';ctx.font='12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(d.label,p.x-8,b.top+b.plotH+24);
    });
    const diffs=data.slice(1).map((d,i)=>d.value-data[i].value);
    const up=diffs.filter(v=>v>0).length, down=diffs.filter(v=>v<0).length;
    readout.innerHTML=`<strong>${up>=down?'整体上升':'整体下降或波动'}</strong><span>${escapeHTML(opts.xLabel||'横轴')}：${data.map(d=>d.label).join('、')}</span><em>${escapeHTML(opts.yLabel||'数据')}：${data.map(d=>d.value).join('、')}</em>`;
  }
  function eventPoint(event){
    const rect=canvas.getBoundingClientRect();
    const p=event.touches?.[0]||event;
    return {x:p.clientX-rect.left,y:p.clientY-rect.top};
  }
  function nearest(pt){
    let best=-1,bestD=Infinity;
    data.forEach((_,i)=>{const p=pointFor(i),d=Math.hypot(pt.x-p.x,pt.y-p.y);if(d<bestD){bestD=d;best=i;}});
    return bestD<28?best:-1;
  }
  function emit(){if(opts.onChange)opts.onChange(data.map(d=>({...d})));}
  canvas.addEventListener('pointerdown',event=>{dragging=nearest(eventPoint(event));if(dragging>=0){canvas.setPointerCapture?.(event.pointerId);draw();}});
  canvas.addEventListener('pointermove',event=>{if(dragging<0)return;data[dragging].value=valueFromY(eventPoint(event).y);draw();emit();});
  canvas.addEventListener('pointerup',()=>{dragging=-1;draw();});
  canvas.addEventListener('pointercancel',()=>{dragging=-1;draw();});
  resize();window.addEventListener('resize',resize);
  return {getData:()=>data.map(d=>({...d})),setData:(next)=>{data=next.map((v,i)=>typeof v==='number'?{label:String(i+1),value:v}:{label:String(v.label??i+1),value:Number(v.value||0)});resize();emit();},draw};
}

// === 多边形切割组件：拖拽切割线 + 面积守恒 ===
function createPolygonCut(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const title=opts.title||'组合图形切割操作台';
  const description=opts.description||'拖动切割线，把复杂图形拆成容易计算的部分，观察总面积不变。';
  const vertices=(opts.vertices||[[0,0],[6,0],[6,2],[3,2],[3,5],[0,5]]).map(p=>({x:Number(p[0]??p.x),y:Number(p[1]??p.y)}));
  const xs=vertices.map(p=>p.x), ys=vertices.map(p=>p.y);
  const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
  let cutX=Number.isFinite(opts.cutX)?opts.cutX:(minX+maxX)/2;
  let dragging=false;
  c.innerHTML=`<div class="component-card polygon-cut-card">
    <div class="component-card-head"><div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(description)}</p></div></div>
    <canvas class="polygon-cut-canvas"></canvas>
    <div class="component-readout"></div>
  </div>`;
  const canvas=c.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  const readout=c.querySelector('.component-readout');
  function area(poly){
    if(poly.length<3)return 0;
    let sum=0;
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length];
      sum+=a.x*b.y-b.x*a.y;
    }
    return Math.abs(sum)/2;
  }
  function clip(poly,keepLeft){
    const inside=p=>keepLeft?p.x<=cutX:p.x>=cutX;
    const intersect=(a,b)=>{
      const t=(cutX-a.x)/(b.x-a.x||1e-9);
      return {x:cutX,y:a.y+(b.y-a.y)*t};
    };
    const out=[];
    for(let i=0;i<poly.length;i++){
      const cur=poly[i],prev=poly[(i+poly.length-1)%poly.length];
      const curIn=inside(cur),prevIn=inside(prev);
      if(curIn){
        if(!prevIn)out.push(intersect(prev,cur));
        out.push(cur);
      }else if(prevIn){
        out.push(intersect(prev,cur));
      }
    }
    return out;
  }
  function resize(){
    const width=Math.max(300,Math.min(720,c.clientWidth-32||640));
    const height=360;
    const ratio=window.devicePixelRatio||1;
    canvas.style.width=width+'px';canvas.style.height=height+'px';
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    draw();
  }
  function mapper(){
    const width=canvas.clientWidth||640,height=canvas.clientHeight||360;
    const pad=48;
    const scale=Math.min((width-pad*2)/(maxX-minX),(height-pad*2)/(maxY-minY));
    return {
      width,height,scale,
      x:x=>pad+(x-minX)*scale,
      y:y=>pad+(y-minY)*scale,
      mx:px=>minX+(px-pad)/scale
    };
  }
  function drawPoly(poly,fill,stroke){
    if(!poly.length)return;
    const m=mapper();
    ctx.beginPath();
    poly.forEach((p,i)=>{const x=m.x(p.x),y=m.y(p.y);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
    ctx.closePath();
    ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.fill();ctx.stroke();
  }
  function draw(){
    const m=mapper();
    ctx.clearRect(0,0,m.width,m.height);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,m.width,m.height);
    ctx.strokeStyle='#eef2f7';ctx.lineWidth=1;
    for(let x=Math.ceil(minX);x<=maxX;x++){ctx.beginPath();ctx.moveTo(m.x(x),m.y(minY));ctx.lineTo(m.x(x),m.y(maxY));ctx.stroke();}
    for(let y=Math.ceil(minY);y<=maxY;y++){ctx.beginPath();ctx.moveTo(m.x(minX),m.y(y));ctx.lineTo(m.x(maxX),m.y(y));ctx.stroke();}
    const left=clip(vertices,true),right=clip(vertices,false);
    drawPoly(left,'rgba(59,130,246,.28)','#3b82f6');
    drawPoly(right,'rgba(245,158,11,.28)','#f59e0b');
    const cx=m.x(cutX);
    ctx.strokeStyle='#ef4444';ctx.lineWidth=3;ctx.setLineDash([7,6]);
    ctx.beginPath();ctx.moveTo(cx,m.y(minY)-20);ctx.lineTo(cx,m.y(maxY)+20);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(cx,m.y(minY)-18,7,0,Math.PI*2);ctx.fill();
    const aTotal=area(vertices),aLeft=area(left),aRight=area(right);
    readout.innerHTML=`<strong>总面积 ${aTotal.toFixed(1)}</strong><span>左侧 ${aLeft.toFixed(1)} + 右侧 ${aRight.toFixed(1)}</span><em>差值 ${(Math.abs(aTotal-aLeft-aRight)).toFixed(2)}</em>`;
  }
  function eventPoint(event){
    const rect=canvas.getBoundingClientRect();
    const p=event.touches?.[0]||event;
    return {x:p.clientX-rect.left,y:p.clientY-rect.top};
  }
  canvas.addEventListener('pointerdown',event=>{
    const m=mapper();
    if(Math.abs(eventPoint(event).x-m.x(cutX))<24){dragging=true;canvas.setPointerCapture?.(event.pointerId);}
  });
  canvas.addEventListener('pointermove',event=>{
    if(!dragging)return;
    const m=mapper();
    cutX=clamp(m.mx(eventPoint(event).x),minX+.1,maxX-.1);
    draw();
    if(opts.onChange)opts.onChange({cutX,total:area(vertices),left:area(clip(vertices,true)),right:area(clip(vertices,false))});
  });
  canvas.addEventListener('pointerup',()=>{dragging=false;});
  canvas.addEventListener('pointercancel',()=>{dragging=false;});
  resize();window.addEventListener('resize',resize);
  return {setCut:(x)=>{cutX=clamp(Number(x)||cutX,minX+.1,maxX-.1);draw();},getAreas:()=>({cutX,total:area(vertices),left:area(clip(vertices,true)),right:area(clip(vertices,false))}),draw};
}

// === 天平组件 ===
function createBalance(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const leftLabel=opts.leftLabel||'?', rightLabel=opts.rightLabel||'☐';
  const title=opts.title||'天平模型';
  const description=opts.description||'方程两边像天平：两边同时做同一件事，平衡才不会被破坏。';
  let leftVal=opts.leftValue??0, rightVal=opts.rightValue??0;
  let target=opts.target||'';
  const canvas=document.createElement('canvas');
  canvas.className='balance-canvas';
  canvas.setAttribute('aria-label',title);
  const answerRow=document.createElement('div');
  answerRow.className='balance-controls';
  answerRow.innerHTML=`
    <span class="balance-equation">${escapeHTML(leftLabel)} = ${escapeHTML(rightLabel)}</span>
    <label>x =
    <input id="bal-ans" type="text" class="input-field" style="width:60px;">
    </label>
    <button class="btn btn-primary btn-sm" id="bal-submit">验证</button>
    <div class="feedback" id="bal-fb"></div>
  `;
  c.innerHTML=`<div class="component-card balance-card">
    <div class="component-card-head">
      <div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(description)}</p></div>
    </div>
    <div class="balance-stage"></div>
  </div>`;
  const stage=c.querySelector('.balance-stage');
  stage.append(canvas,answerRow);

  function draw(){
    const ctx=canvas.getContext('2d');
    const w=canvas.width,h=canvas.height,cx=w/2,top=56;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    const tilt=Math.max(-10,Math.min(10,(leftVal-rightVal)*1.4));
    ctx.strokeStyle='#cbd5e1';ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(cx,top);ctx.lineTo(cx,h-24);ctx.moveTo(cx-44,h-24);ctx.lineTo(cx+44,h-24);ctx.stroke();
    ctx.save();ctx.translate(cx,top);ctx.rotate(tilt*Math.PI/180);
    ctx.strokeStyle='#64748b';ctx.lineWidth=6;
    ctx.beginPath();ctx.moveTo(-Math.min(170,w*.34),0);ctx.lineTo(Math.min(170,w*.34),0);ctx.stroke();
    drawPan(ctx,-Math.min(150,w*.3),leftLabel,'#3b82f6');
    drawPan(ctx,Math.min(150,w*.3),rightLabel,'#16a34a');
    ctx.restore();
    ctx.fillStyle='#1e293b';ctx.font='800 15px sans-serif';ctx.textAlign='center';
    ctx.fillText(leftVal===rightVal?'平衡：两边相等':leftVal>rightVal?'左边更重：需要让两边相等':'右边更重：需要找到合适的 x',cx,h-8);
  }
  function drawPan(ctx,x,label,color){
    ctx.strokeStyle=color;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,44);ctx.moveTo(x-42,50);ctx.quadraticCurveTo(x,66,x+42,50);ctx.stroke();
    ctx.fillStyle=color+'22';
    ctx.beginPath();ctx.moveTo(x-42,50);ctx.quadraticCurveTo(x,76,x+42,50);ctx.lineTo(x+32,70);ctx.quadraticCurveTo(x,82,x-32,70);ctx.closePath();ctx.fill();
    ctx.fillStyle=color;ctx.font='800 20px sans-serif';ctx.textAlign='center';
    ctx.fillText(label,x,62);
  }

  document.getElementById('bal-submit').addEventListener('click',()=>{
    const ans=document.getElementById('bal-ans').value.trim();
    const fb=document.getElementById('bal-fb');
    if(ans===String(target)){
      leftVal=rightVal;draw();
      fb.className='feedback show success';fb.innerHTML='✅ 正确！天平平衡！';celebrate(fb);
      if(opts.onSolve)opts.onSolve(ans);
    }else{
      fb.className='feedback show error';fb.innerHTML='❌ 再想想，天平要平衡两边必须相等';}
  });
  function resize(){
    canvas.width=Math.max(280,Math.min(620,c.clientWidth-32||560));
    canvas.height=230;
    draw();
  }
  resize();
  window.addEventListener('resize',resize);
  return {setValues:(l,r)=>{leftVal=l;rightVal=r;draw();},draw};
}

// === Sprint 4：长方体 3D 视图 ===
function createCuboid3D(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const title=opts.title||'长方体 3D 视图';
  const description=opts.description||'旋转长方体，观察长、宽、高和单位立方体如何组成体积。';
  const dims={x:Number(opts.length||opts.x||4),y:Number(opts.width||opts.y||3),z:Number(opts.height||opts.z||2)};
  let rotY=Number(opts.rotateY||-28)*Math.PI/180;
  let rotX=Number(opts.rotateX||20)*Math.PI/180;
  let cubeMode=!!(opts.cubeMode||opts.mode==='cubes');
  c.innerHTML=`<div class="component-card cuboid3d-card">
    <div class="component-card-head"><div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(description)}</p></div></div>
    <canvas class="cuboid3d-canvas" aria-label="${escapeHTML(title)}"></canvas>
    <div class="component-toolbar">
      <button class="btn btn-outline btn-sm" data-cuboid-action="left">向左转</button>
      <button class="btn btn-outline btn-sm" data-cuboid-action="right">向右转</button>
      <button class="btn btn-outline btn-sm" data-cuboid-action="up">抬高视角</button>
      <button class="btn btn-outline btn-sm" data-cuboid-action="toggle">${cubeMode?'显示外形':'显示单位块'}</button>
    </div>
    <div class="component-readout"></div>
  </div>`;
  const canvas=c.querySelector('canvas'), ctx=canvas.getContext('2d'), readout=c.querySelector('.component-readout');
  function project(x,y,z){
    const cy=Math.cos(rotY),sy=Math.sin(rotY),cx=Math.cos(rotX),sx=Math.sin(rotX);
    const rx=x*cy-z*sy, rz=x*sy+z*cy, ry=y*cx-rz*sx;
    return {x:rx,y:ry,z:y*sx+rz*cx};
  }
  function screen(p,scale,w,h){return {x:w/2+p.x*scale,y:h*.56-p.y*scale};}
  function drawFace(points,fill,stroke){
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
    ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1.4;ctx.stroke();
  }
  function cuboidFaces(x0,y0,z0,x1,y1,z1){
    const pts=[
      [x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],
      [x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]
    ].map(p=>project(p[0],p[1],p[2]));
    return [
      {idx:[0,1,2,3],color:'rgba(147,197,253,.72)'},{idx:[4,7,6,5],color:'rgba(59,130,246,.46)'},
      {idx:[0,4,5,1],color:'rgba(191,219,254,.76)'},{idx:[3,2,6,7],color:'rgba(37,99,235,.26)'},
      {idx:[1,5,6,2],color:'rgba(96,165,250,.62)'},{idx:[0,3,7,4],color:'rgba(14,165,233,.34)'}
    ].map(face=>({...face,depth:face.idx.reduce((s,i)=>s+pts[i].z,0)/face.idx.length,pts}));
  }
  function drawCuboid(x0,y0,z0,x1,y1,z1,scale,w,h,alpha=1){
    cuboidFaces(x0,y0,z0,x1,y1,z1).sort((a,b)=>a.depth-b.depth).forEach(face=>{
      drawFace(face.idx.map(i=>screen(face.pts[i],scale,w,h)),face.color.replace(/[\d.]+\)$/,(.18+alpha*.58)+')'),'#2563eb');
    });
  }
  function draw(){
    const w=canvas.clientWidth||640,h=canvas.clientHeight||360;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    const scale=Math.min(w/(dims.x+dims.z+4),h/(dims.y+dims.z+4))*1.45;
    if(cubeMode){
      for(let x=0;x<dims.x;x++)for(let y=0;y<dims.y;y++)for(let z=0;z<dims.z;z++){
        drawCuboid(x-dims.x/2,y-dims.y/2,z-dims.z/2,x+1-dims.x/2,y+1-dims.y/2,z+1-dims.z/2,scale,w,h,.48);
      }
    }else{
      drawCuboid(-dims.x/2,-dims.y/2,-dims.z/2,dims.x/2,dims.y/2,dims.z/2,scale,w,h,1);
    }
    ctx.fillStyle='#1e293b';ctx.font='800 15px sans-serif';ctx.textAlign='center';
    ctx.fillText(`长 ${dims.x} × 宽 ${dims.y} × 高 ${dims.z}`,w/2,28);
    readout.innerHTML=`<strong>${dims.x*dims.y*dims.z}</strong><span>个单位立方体</span><em>${cubeMode?'堆叠模式：体积来自逐层计数':'外形模式：先识别长、宽、高'}</em>`;
  }
  function resize(){
    const width=Math.max(300,Math.min(720,c.clientWidth-32||640)),height=360,ratio=window.devicePixelRatio||1;
    canvas.style.width=width+'px';canvas.style.height=height+'px';canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();
  }
  c.querySelector('.component-toolbar').addEventListener('click',e=>{
    const a=e.target?.dataset?.cuboidAction;if(!a)return;
    if(a==='left')rotY-=Math.PI/12;if(a==='right')rotY+=Math.PI/12;if(a==='up')rotX=clamp(rotX+Math.PI/18,-.2,1.05);
    if(a==='toggle'){cubeMode=!cubeMode;e.target.textContent=cubeMode?'显示外形':'显示单位块';}
    draw();
  });
  resize();window.addEventListener('resize',resize);
  return {render:draw,draw,setMode:mode=>{cubeMode=mode==='cubes';draw();},setRotation:(x,y)=>{rotX=x;rotY=y;draw();},destroy:()=>window.removeEventListener('resize',resize)};
}

// === Sprint 4：展开图动画 ===
function createNetUnfold(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const title=opts.title||'长方体展开图';
  const description=opts.description||'拖动展开进度，观察 6 个面如何从立体外壳展开成平面图。';
  let progress=Number(opts.progress||0);
  c.innerHTML=`<div class="component-card net-unfold-card">
    <div class="component-card-head"><div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(description)}</p></div></div>
    <canvas class="net-unfold-canvas" aria-label="${escapeHTML(title)}"></canvas>
    <div class="component-toolbar">
      <button class="btn btn-outline btn-sm" data-net="fold">折叠</button>
      <input type="range" min="0" max="1" step="0.01" value="${progress}" class="net-slider" aria-label="展开进度">
      <button class="btn btn-outline btn-sm" data-net="open">展开</button>
    </div>
    <div class="component-readout"></div>
  </div>`;
  const canvas=c.querySelector('canvas'),ctx=canvas.getContext('2d'),slider=c.querySelector('.net-slider'),readout=c.querySelector('.component-readout');
  function face(ctx,x,y,w,h,label,color,angle=0){
    ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(angle);ctx.translate(-w/2,-h/2);
    ctx.fillStyle=color;ctx.strokeStyle='#64748b';ctx.lineWidth=2;ctx.fillRect(0,0,w,h);ctx.strokeRect(0,0,w,h);
    ctx.fillStyle='#0f172a';ctx.font='800 13px sans-serif';ctx.textAlign='center';ctx.fillText(label,w/2,h/2+4);
    ctx.restore();
  }
  function draw(){
    const w=canvas.clientWidth||640,h=canvas.clientHeight||340;ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    const fw=Math.min(118,w/6),fh=74,cx=w/2,cy=h/2+12,t=progress;
    const lift=(1-t)*44;
    face(ctx,cx-fw/2,cy-fh/2,fw,fh,'底面','#dbeafe');
    face(ctx,cx-fw/2-fw*t,cy-fh/2,fw,fh,'左面','#bfdbfe',-(1-t)*.8);
    face(ctx,cx+fw*(t-.5),cy-fh/2,fw,fh,'右面','#93c5fd',(1-t)*.8);
    face(ctx,cx-fw/2,cy-fh/2-fh*t,fw,fh,'后面','#fed7aa',-(1-t)*.65);
    face(ctx,cx-fw/2,cy-fh/2+fh*t,fw,fh,'前面','#fef3c7',(1-t)*.65);
    face(ctx,cx-fw/2,cy-fh/2-fh*(1+t)-lift,fw,fh,'上面','#bbf7d0',(1-t)*.25);
    ctx.fillStyle='#475569';ctx.font='13px sans-serif';ctx.textAlign='center';
    ctx.fillText(t<.5?'折叠状态：面围成外壳':'展开状态：6 个面都能单独计算面积',w/2,h-18);
    readout.innerHTML=`<strong>${Math.round(t*100)}%</strong><span>展开进度</span><em>表面积 = 6 个面的面积之和</em>`;
  }
  function setProgress(v){progress=clamp(Number(v)||0,0,1);slider.value=progress;draw();if(opts.onChange)opts.onChange(progress);}
  function resize(){const width=Math.max(300,Math.min(720,c.clientWidth-32||640)),height=340,ratio=window.devicePixelRatio||1;canvas.style.width=width+'px';canvas.style.height=height+'px';canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
  slider.addEventListener('input',e=>setProgress(e.target.value));
  c.querySelector('.component-toolbar').addEventListener('click',e=>{if(e.target?.dataset?.net==='fold')setProgress(0);if(e.target?.dataset?.net==='open')setProgress(1);});
  resize();window.addEventListener('resize',resize);
  return {render:draw,setProgress,destroy:()=>window.removeEventListener('resize',resize)};
}

// === Sprint 4：对称与旋转画板 ===
function createSymmetryBoard(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const title=opts.title||'对称与旋转画板';
  const description=opts.description||'拖动镜像轴或改变旋转角，观察图形变换前后哪些量不变。';
  let mode=opts.mode||'mirror',axis=0.5,angle=Number(opts.angle||90),dragging=false;
  c.innerHTML=`<div class="component-card symmetry-board-card">
    <div class="component-card-head"><div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(description)}</p></div></div>
    <canvas class="symmetry-board-canvas" aria-label="${escapeHTML(title)}"></canvas>
    <div class="component-toolbar">
      <button class="btn btn-outline btn-sm" data-sym="mirror">镜像</button>
      <button class="btn btn-outline btn-sm" data-sym="rotate">旋转</button>
      <label style="display:inline-flex;gap:6px;align-items:center;">角度 <input class="sym-angle" type="range" min="0" max="360" step="15" value="${angle}"></label>
    </div>
    <div class="component-readout"></div>
  </div>`;
  const canvas=c.querySelector('canvas'),ctx=canvas.getContext('2d'),angleInput=c.querySelector('.sym-angle'),readout=c.querySelector('.component-readout');
  const poly=[[-90,-36],[-20,-70],[-8,-16],[72,-20],[34,48],[-58,40]];
  function point(p,cx,cy,scale=1){return {x:cx+p[0]*scale,y:cy+p[1]*scale};}
  function drawPoly(points,color){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#1e40af';ctx.lineWidth=2;ctx.stroke();}
  function drawGrid(w,h){ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1;for(let x=30;x<w;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=30;y<h;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}}
  function draw(){
    const w=canvas.clientWidth||640,h=canvas.clientHeight||340,cx=w/2,cy=h/2;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);drawGrid(w,h);
    const original=poly.map(p=>point(p,cx-80,cy));
    drawPoly(original,'rgba(59,130,246,.42)');
    if(mode==='mirror'){
      const ax=axis*w;
      ctx.strokeStyle='#f97316';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(ax,24);ctx.lineTo(ax,h-24);ctx.stroke();ctx.setLineDash([]);
      const mirrored=original.map(p=>({x:2*ax-p.x,y:p.y}));
      drawPoly(mirrored,'rgba(34,197,94,.38)');
      readout.innerHTML=`<strong>镜像轴 x=${Math.round(ax)}</strong><span>对应点到轴距离相等</span><em>拖动橙色轴改变对称位置</em>`;
    }else{
      const rad=angle*Math.PI/180;
      ctx.strokeStyle='#f97316';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,8,0,Math.PI*2);ctx.stroke();
      const rotated=poly.map(p=>({x:cx+(p[0]*Math.cos(rad)-p[1]*Math.sin(rad)),y:cy+(p[0]*Math.sin(rad)+p[1]*Math.cos(rad))}));
      drawPoly(rotated,'rgba(249,115,22,.38)');
      readout.innerHTML=`<strong>${angle}°</strong><span>绕中心旋转</span><em>形状和大小不变，方向改变</em>`;
    }
  }
  function pos(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
  canvas.addEventListener('pointerdown',e=>{if(mode==='mirror'){dragging=true;canvas.setPointerCapture?.(e.pointerId);axis=clamp(pos(e).x/(canvas.clientWidth||1),.08,.92);draw();}});
  canvas.addEventListener('pointermove',e=>{if(dragging){axis=clamp(pos(e).x/(canvas.clientWidth||1),.08,.92);draw();}});
  canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
  angleInput.addEventListener('input',e=>{angle=Number(e.target.value);mode='rotate';draw();});
  c.querySelector('.component-toolbar').addEventListener('click',e=>{const m=e.target?.dataset?.sym;if(m){mode=m;draw();}});
  function resize(){const width=Math.max(300,Math.min(720,c.clientWidth-32||640)),height=340,ratio=window.devicePixelRatio||1;canvas.style.width=width+'px';canvas.style.height=height+'px';canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
  resize();window.addEventListener('resize',resize);
  return {render:draw,setMode:m=>{mode=m;draw();},setAngle:a=>{angle=Number(a)||0;angleInput.value=angle;mode='rotate';draw();},destroy:()=>window.removeEventListener('resize',resize)};
}

// === Sprint 4：通用天平秤 ===
function createBalanceScale(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const title=opts.title||'天平秤实验';
  const description=opts.description||'向两边添加或拿走同样的重量，观察平衡是否保持。';
  let left=Number(opts.left||opts.leftValue||3),right=Number(opts.right||opts.rightValue||3);
  const unit=opts.unit||'块';
  c.innerHTML=`<div class="component-card balance-scale-card">
    <div class="component-card-head"><div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(description)}</p></div></div>
    <canvas class="balance-scale-canvas" aria-label="${escapeHTML(title)}"></canvas>
    <div class="component-toolbar">
      <button class="btn btn-outline btn-sm" data-bal="left-plus">左 +1</button>
      <button class="btn btn-outline btn-sm" data-bal="right-plus">右 +1</button>
      <button class="btn btn-outline btn-sm" data-bal="both-plus">两边 +1</button>
      <button class="btn btn-outline btn-sm" data-bal="both-minus">两边 -1</button>
      <button class="btn btn-outline btn-sm" data-bal="reset">重置</button>
    </div>
    <div class="component-readout"></div>
  </div>`;
  const canvas=c.querySelector('canvas'),ctx=canvas.getContext('2d'),readout=c.querySelector('.component-readout');
  function drawPan(cx,cy,label,count,color){
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy-54);ctx.lineTo(cx,cy-8);ctx.moveTo(cx-55,cy);ctx.quadraticCurveTo(cx,cy+30,cx+55,cy);ctx.stroke();
    ctx.fillStyle=color+'22';ctx.beginPath();ctx.moveTo(cx-55,cy);ctx.quadraticCurveTo(cx,cy+44,cx+55,cy);ctx.lineTo(cx+44,cy+22);ctx.quadraticCurveTo(cx,cy+34,cx-44,cy+22);ctx.closePath();ctx.fill();
    for(let i=0;i<Math.min(count,10);i++){ctx.fillStyle=color;ctx.fillRect(cx-42+(i%5)*18,cy-18-Math.floor(i/5)*18,13,13);}
    ctx.fillStyle='#0f172a';ctx.font='800 14px sans-serif';ctx.textAlign='center';ctx.fillText(`${label} ${count}${unit}`,cx,cy+58);
  }
  function draw(){
    const w=canvas.clientWidth||640,h=canvas.clientHeight||300,cx=w/2,top=76,tilt=clamp((left-right)*2,-12,12);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#64748b';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx,top);ctx.lineTo(cx,h-42);ctx.moveTo(cx-42,h-42);ctx.lineTo(cx+42,h-42);ctx.stroke();
    ctx.save();ctx.translate(cx,top);ctx.rotate(tilt*Math.PI/180);
    ctx.strokeStyle='#475569';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-190,0);ctx.lineTo(190,0);ctx.stroke();
    drawPan(-150,78,'左',left,'#3b82f6');drawPan(150,78,'右',right,'#16a34a');
    ctx.restore();
    const state=left===right?'平衡':left>right?'左边重':'右边重';
    readout.innerHTML=`<strong>${state}</strong><span>左 ${left}${unit} · 右 ${right}${unit}</span><em>${left===right?'等式保持成立':'两边数量不同，关系被破坏'}</em>`;
    if(opts.onChange)opts.onChange({left,right,state});
  }
  function setValues(l,r){left=Math.max(0,Number(l)||0);right=Math.max(0,Number(r)||0);draw();}
  c.querySelector('.component-toolbar').addEventListener('click',e=>{
    const a=e.target?.dataset?.bal;if(!a)return;
    if(a==='left-plus')left++;if(a==='right-plus')right++;if(a==='both-plus'){left++;right++;}if(a==='both-minus'){left=Math.max(0,left-1);right=Math.max(0,right-1);}if(a==='reset'){left=Number(opts.left||opts.leftValue||3);right=Number(opts.right||opts.rightValue||3);}
    draw();
  });
  function resize(){const width=Math.max(300,Math.min(720,c.clientWidth-32||640)),height=300,ratio=window.devicePixelRatio||1;canvas.style.width=width+'px';canvas.style.height=height+'px';canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
  resize();window.addEventListener('resize',resize);
  return {render:draw,setValues,getState:()=>({left,right}),destroy:()=>window.removeEventListener('resize',resize)};
}

// === Sprint 4：概率模拟器 ===
function createProbabilitySim(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const title=opts.title||'概率模拟器';
  const description=opts.description||'多次试验后，观察频率怎样逐渐接近可能性。';
  const mode=opts.mode||'spinner';
  const labels=opts.labels||['红','蓝','黄','绿'];
  const colors=opts.colors||['#ef4444','#3b82f6','#f59e0b','#22c55e','#8b5cf6','#14b8a6'];
  let counts=labels.map(()=>0),total=0,last=0;
  c.innerHTML=`<div class="component-card probability-sim-card">
    <div class="component-card-head"><div><h4>${escapeHTML(title)}</h4><p>${escapeHTML(description)}</p></div></div>
    <canvas class="probability-sim-canvas" aria-label="${escapeHTML(title)}"></canvas>
    <div class="component-toolbar">
      <button class="btn btn-outline btn-sm" data-prob="one">试 1 次</button>
      <button class="btn btn-outline btn-sm" data-prob="twenty">试 20 次</button>
      <button class="btn btn-outline btn-sm" data-prob="hundred">试 100 次</button>
      <button class="btn btn-outline btn-sm" data-prob="reset">清空</button>
    </div>
    <div class="component-readout"></div>
  </div>`;
  const canvas=c.querySelector('canvas'),ctx=canvas.getContext('2d'),readout=c.querySelector('.component-readout');
  function trial(n){
    for(let i=0;i<n;i++){
      last=Math.floor(Math.random()*labels.length);
      counts[last]++;total++;
    }
    draw();
    if(opts.onChange)opts.onChange({counts:[...counts],total,last:labels[last]});
  }
  function drawSpinner(cx,cy,r){
    let start=-Math.PI/2;
    labels.forEach((label,i)=>{
      const end=start+Math.PI*2/labels.length;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,end);ctx.closePath();ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();
      const mid=(start+end)/2;ctx.fillStyle='#fff';ctx.font='800 13px sans-serif';ctx.textAlign='center';ctx.fillText(label,cx+Math.cos(mid)*r*.58,cy+Math.sin(mid)*r*.58+4);start=end;
    });
    const mid=-Math.PI/2+(last+.5)*Math.PI*2/labels.length;
    ctx.strokeStyle='#0f172a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(mid)*r*.78,cy+Math.sin(mid)*r*.78);ctx.stroke();
  }
  function drawBars(x,y,w,h){
    const maxCount=Math.max(1,...counts);
    labels.forEach((label,i)=>{
      const barH=h*(counts[i]/maxCount),bx=x+i*w/labels.length+w*.12,bw=w/labels.length*.68;
      ctx.fillStyle=colors[i%colors.length]+'33';ctx.fillRect(bx,y+h-barH,bw,barH);ctx.strokeStyle=colors[i%colors.length];ctx.strokeRect(bx,y+h-barH,bw,barH);
      ctx.fillStyle='#334155';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(label,bx+bw/2,y+h+18);ctx.fillText(String(counts[i]),bx+bw/2,y+h-barH-6);
    });
  }
  function draw(){
    const w=canvas.clientWidth||640,h=canvas.clientHeight||340;ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    if(mode==='dice'){
      const size=110,x=w*.24-size/2,y=72;ctx.fillStyle='#f8fafc';ctx.strokeStyle='#334155';ctx.lineWidth=3;ctx.fillRect(x,y,size,size);ctx.strokeRect(x,y,size,size);ctx.fillStyle='#ef4444';ctx.font='800 48px sans-serif';ctx.textAlign='center';ctx.fillText(labels[last]||'1',x+size/2,y+70);
    }else drawSpinner(w*.25,140,92);
    drawBars(w*.48,54,w*.42,210);
    const pct=total?Math.round(counts[last]/total*100):0;
    readout.innerHTML=`<strong>${total}</strong><span>次试验</span><em>最近结果：${escapeHTML(labels[last])}，当前频率约 ${pct}%</em>`;
  }
  c.querySelector('.component-toolbar').addEventListener('click',e=>{const a=e.target?.dataset?.prob;if(a==='one')trial(1);if(a==='twenty')trial(20);if(a==='hundred')trial(100);if(a==='reset'){counts=labels.map(()=>0);total=0;last=0;draw();}});
  function resize(){const width=Math.max(300,Math.min(720,c.clientWidth-32||640)),height=340,ratio=window.devicePixelRatio||1;canvas.style.width=width+'px';canvas.style.height=height+'px';canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
  resize();window.addEventListener('resize',resize);
  return {render:draw,trial,reset:()=>{counts=labels.map(()=>0);total=0;draw();},getState:()=>({counts:[...counts],total,last:labels[last]}),destroy:()=>window.removeEventListener('resize',resize)};
}

// === 三视图积木投影 ===
function createThreeViewDemo(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const shapes=[
    {name:'阶梯积木',cubes:[[0,0,0],[1,0,0],[2,0,0],[2,1,0],[2,1,1]]},
    {name:'L 形积木',cubes:[[0,0,0],[1,0,0],[2,0,0],[0,1,0],[0,1,1]]},
    {name:'小长方体',cubes:[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]]}
  ];
  let index=0;
  c.innerHTML=`<div class="interactive-area">
    <canvas class="visual-canvas" id="${opts.containerId}-canvas" aria-label="三视图积木投影"></canvas>
    <div class="visual-controls" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px;"></div>
    <div id="${opts.containerId}-hint" style="margin-top:8px;color:var(--text-muted);font-size:14px;">同一个积木，正面、上面、左面看到的是三个不同投影。</div>
  </div>`;
  const canvas=document.getElementById(`${opts.containerId}-canvas`);
  const controls=c.querySelector('.visual-controls');
  shapes.forEach((shape,i)=>{
    const btn=document.createElement('button');
    btn.className='btn '+(i===0?'btn-primary':'btn-outline')+' btn-sm';
    btn.textContent=shape.name;
    btn.addEventListener('click',()=>{index=i;[...controls.children].forEach((b,j)=>b.className='btn '+(j===i?'btn-primary':'btn-outline')+' btn-sm');draw();});
    controls.appendChild(btn);
  });
  function resize(){
    const w=Math.min(720,c.clientWidth-32||720);
    canvas.width=w;canvas.height=w<520?420:310;
    draw();
  }
  function drawGrid(ctx,origin,label,cells,color){
    const size=22, gap=2;
    ctx.fillStyle='#1e293b';ctx.font='700 13px sans-serif';ctx.textAlign='left';
    ctx.fillText(label,origin.x,origin.y-10);
    ctx.strokeStyle='#cbd5e1';ctx.lineWidth=1;
    for(let r=0;r<4;r++)for(let col=0;col<4;col++){
      const x=origin.x+col*(size+gap), y=origin.y+r*(size+gap);
      ctx.fillStyle='rgba(148,163,184,.12)';ctx.fillRect(x,y,size,size);ctx.strokeRect(x,y,size,size);
    }
    cells.forEach(([col,r])=>{
      const x=origin.x+col*(size+gap), y=origin.y+r*(size+gap);
      ctx.fillStyle=color;ctx.fillRect(x+2,y+2,size-4,size-4);
    });
  }
  function project(cubes,view){
    const set=new Set();
    cubes.forEach(([x,y,z])=>{
      if(view==='front')set.add(`${x},${2-z}`);
      if(view==='top')set.add(`${x},${y}`);
      if(view==='left')set.add(`${y},${2-z}`);
    });
    return [...set].map(v=>v.split(',').map(Number));
  }
  function cube(ctx,x,y,s){
    ctx.beginPath();ctx.moveTo(x,y-s*.45);ctx.lineTo(x+s*.55,y-s*.75);ctx.lineTo(x+s*1.1,y-s*.45);ctx.lineTo(x+s*.55,y-s*.15);ctx.closePath();ctx.fillStyle='#dbeafe';ctx.fill();ctx.strokeStyle='#60a5fa';ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,y-s*.45);ctx.lineTo(x+s*.55,y-s*.15);ctx.lineTo(x+s*.55,y+s*.5);ctx.lineTo(x,y+s*.2);ctx.closePath();ctx.fillStyle='#93c5fd';ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+s*1.1,y-s*.45);ctx.lineTo(x+s*.55,y-s*.15);ctx.lineTo(x+s*.55,y+s*.5);ctx.lineTo(x+s*1.1,y+s*.2);ctx.closePath();ctx.fillStyle='#3b82f6';ctx.fill();ctx.stroke();
  }
  function draw(){
    const ctx=canvas.getContext('2d'), w=canvas.width, h=canvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    const shape=shapes[index], cubes=[...shape.cubes].sort((a,b)=>(a[0]+a[1]+a[2])-(b[0]+b[1]+b[2]));
    const baseX=w<520?55:70, baseY=w<520?130:170, s=w<520?34:38;
    ctx.fillStyle='#334155';ctx.font='800 15px sans-serif';ctx.textAlign='left';ctx.fillText(shape.name+'：立体积木',baseX,28);
    cubes.forEach(([x,y,z])=>cube(ctx,baseX+(x-y)*s*.58,baseY+(x+y)*s*.24-z*s*.68,s));
    const topY=w<520?210:62, left=w<520?34:360;
    drawGrid(ctx,{x:left,y:topY},'正视图：前面看',project(shape.cubes,'front'),'rgba(59,130,246,.72)');
    drawGrid(ctx,{x:left+(w<520?0:120),y:topY+(w<520?105:0)},'俯视图：上面看',project(shape.cubes,'top'),'rgba(245,158,11,.72)');
    drawGrid(ctx,{x:left+(w<520?0:240),y:topY+(w<520?210:0)},'左视图：左面看',project(shape.cubes,'left'),'rgba(34,197,94,.72)');
  }
  resize();
  window.addEventListener('resize',resize);
  return {draw,setShape:i=>{index=Math.max(0,Math.min(shapes.length-1,i));draw();}};
}

// === 轴对称与旋转变换演示 ===
function createTransformDemo(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  let angle=90, mode='rotate';
  c.innerHTML=`<div class="interactive-area">
    <canvas class="visual-canvas" id="${opts.containerId}-canvas" aria-label="轴对称与旋转演示"></canvas>
    <div style="display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;margin-top:12px;">
      <button class="btn btn-primary btn-sm" id="${opts.containerId}-rotate">旋转</button>
      <button class="btn btn-outline btn-sm" id="${opts.containerId}-mirror">轴对称</button>
      <label style="font-size:13px;color:var(--text-muted);">角度 <input id="${opts.containerId}-angle" type="range" min="0" max="180" step="15" value="90"></label>
      <b id="${opts.containerId}-label" style="color:var(--accent-deep);">90°</b>
    </div>
  </div>`;
  const canvas=document.getElementById(`${opts.containerId}-canvas`);
  const label=document.getElementById(`${opts.containerId}-label`);
  function resize(){canvas.width=Math.min(640,c.clientWidth-32||640);canvas.height=300;draw();}
  function polyPoints(cx,cy){
    return [[-42,-28],[18,-28],[18,-55],[54,0],[18,55],[18,28],[-42,28]].map(([x,y])=>[cx+x,cy+y]);
  }
  function drawPoly(ctx,pts,fill,stroke){
    ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=2.4;ctx.stroke();
  }
  function transformPoint([x,y],cx,cy){
    if(mode==='mirror')return [2*cx-x,y];
    const rad=angle*Math.PI/180, dx=x-cx, dy=y-cy;
    return [cx+dx*Math.cos(rad)-dy*Math.sin(rad),cy+dx*Math.sin(rad)+dy*Math.cos(rad)];
  }
  function draw(){
    const ctx=canvas.getContext('2d'), w=canvas.width, h=canvas.height, cx=w/2, cy=h/2+8;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1;
    for(let x=20;x<w;x+=24){ctx.beginPath();ctx.moveTo(x,20);ctx.lineTo(x,h-20);ctx.stroke();}
    for(let y=20;y<h;y+=24){ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(w-20,y);ctx.stroke();}
    ctx.setLineDash([6,4]);ctx.strokeStyle=mode==='mirror'?'#f59e0b':'#94a3b8';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(cx,30);ctx.lineTo(cx,h-28);ctx.stroke();ctx.setLineDash([]);
    const origin=polyPoints(cx-70,cy), moved=origin.map(p=>mode==='mirror'?transformPoint(p,cx,cy):transformPoint(p,cx-70,cy));
    drawPoly(ctx,origin,'rgba(59,130,246,.3)','#3b82f6');
    drawPoly(ctx,moved,mode==='mirror'?'rgba(245,158,11,.35)':'rgba(34,197,94,.32)',mode==='mirror'?'#f59e0b':'#16a34a');
    ctx.fillStyle='#1e293b';ctx.font='800 14px sans-serif';ctx.textAlign='center';
    ctx.fillText('原图形',cx-70,34);ctx.fillText(mode==='mirror'?'镜像后':'旋转后',mode==='mirror'?cx+70:cx-70, h-34);
    ctx.fillStyle='#64748b';ctx.font='13px sans-serif';
    ctx.fillText(mode==='mirror'?'对称轴两侧到轴距离相等，形状大小不变':'绕中心点转动，形状大小不变',cx,h-10);
  }
  document.getElementById(`${opts.containerId}-angle`).addEventListener('input',e=>{angle=parseInt(e.target.value,10);label.textContent=angle+'°';draw();});
  document.getElementById(`${opts.containerId}-rotate`).addEventListener('click',()=>{mode='rotate';draw();});
  document.getElementById(`${opts.containerId}-mirror`).addEventListener('click',()=>{mode='mirror';draw();});
  resize();
  window.addEventListener('resize',resize);
  return {draw};
}

// === 平行四边形剪拼演示 ===
function createParallelogramCutDemo(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  let state=0;
  c.innerHTML=`<div class="interactive-area">
    <canvas class="visual-canvas" id="${opts.containerId}-canvas" aria-label="平行四边形剪拼演示"></canvas>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px;">
      <button class="btn btn-primary btn-sm" data-state="1">剪开</button>
      <button class="btn btn-primary btn-sm" data-state="2">平移</button>
      <button class="btn btn-primary btn-sm" data-state="3">拼成矩形</button>
      <button class="btn btn-outline btn-sm" data-state="0">重置</button>
    </div>
    <div id="${opts.containerId}-caption" style="margin-top:8px;color:var(--text-muted);font-size:14px;"></div>
  </div>`;
  const canvas=document.getElementById(`${opts.containerId}-canvas`);
  const caption=document.getElementById(`${opts.containerId}-caption`);
  function resize(){canvas.width=Math.min(620,c.clientWidth-32||620);canvas.height=240;draw();}
  function drawShape(ctx,pts,fill,stroke){
    ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=2.4;ctx.stroke();
  }
  function draw(){
    const ctx=canvas.getContext('2d'), w=canvas.width, h=canvas.height, cx=w/2, cy=h/2+6;
    const base=Math.min(230,w*.5), high=92, shift=Math.min(72,w*.16);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    const left=cx-base/2, right=cx+base/2, top=cy-high/2, bottom=cy+high/2;
    if(state<3){
      drawShape(ctx,[[left+shift,top],[right+shift,top],[right,bottom],[left,bottom]],'rgba(59,130,246,.24)','#3b82f6');
      ctx.setLineDash([6,4]);ctx.strokeStyle='#ef4444';ctx.lineWidth=2.2;
      ctx.beginPath();ctx.moveTo(left+shift,top);ctx.lineTo(left+shift,bottom);ctx.stroke();ctx.setLineDash([]);
      if(state>=1){
        const off=state===1?0:shift;
        drawShape(ctx,[[left+shift-off,top],[left+shift-off,bottom],[left-off,bottom]],'rgba(239,68,68,.38)','#ef4444');
      }
      if(state===0)caption.textContent='平行四边形是“歪”的，但底和高已经决定了面积。';
      if(state===1)caption.textContent='沿高剪开，剪下一个三角形。';
      if(state===2)caption.textContent='把三角形平移到另一边，面积没有变。';
    }else{
      drawShape(ctx,[[left,top],[right,top],[right,bottom],[left,bottom]],'rgba(34,197,94,.24)','#16a34a');
      drawShape(ctx,[[left,top],[left+shift,top],[left,bottom]],'rgba(245,158,11,.36)','#f59e0b');
      caption.textContent='拼成矩形：长=底，宽=高，所以面积=底×高。';
    }
    ctx.fillStyle='#1e293b';ctx.font='800 14px sans-serif';ctx.textAlign='center';ctx.fillText('底',cx,bottom+24);
    ctx.fillStyle='#ef4444';ctx.fillText('高',left+shift-16,cy);
  }
  c.querySelectorAll('[data-state]').forEach(btn=>btn.addEventListener('click',()=>{state=parseInt(btn.dataset.state,10);draw();}));
  resize();
  window.addEventListener('resize',resize);
  return {setState:s=>{state=s;draw();},draw};
}

// === 提示按钮（通用） ===
function addHintButton(containerId, hintText, label){
  const c = document.getElementById(containerId);
  if(!c)return;
  const btn = document.createElement('button');
  btn.className = 'hint-toggle';
  btn.innerHTML = '💡 ' + (label || '提示');
  const content = document.createElement('div');
  content.className = 'hint-content';
  content.textContent = hintText;
  btn.addEventListener('click',()=>{
    const open = content.classList.toggle('open');
    btn.innerHTML = open ? '🙈 收起提示' : '💡 ' + (label || '提示');
  });
  c.appendChild(btn);
  c.appendChild(content);
}

// === 推荐下一课 ===
function createNextLessonSuggestion(opts){
  const c = document.getElementById(opts.containerId);
  if(!c)return;
  const names = opts.conceptNames || (document.body?.dataset?.concept || '').split(/[,，]/).map(s=>s.trim()).filter(Boolean);
  const allNext = [];
  const seen = new Set();
  names.forEach(name=>{
    const next = (window.getRecommendedNext && window.getRecommendedNext(name)) || [];
    next.forEach(r=>{
      if(seen.has(r.name))return;
      seen.add(r.name);
      allNext.push(r);
    });
  });
  const rootPrefix = (function(){const s=Array.from(document.scripts).find(s=>/concept-sync/.test(s.getAttribute('src')||''));const src=s?.getAttribute('src')||'';const i=src.indexOf('shared/concept-sync.js');return i>=0?src.slice(0,i):'';})();
  if(!allNext.length){
    const name = names[0] || '';
    const graphHref = rootPrefix + 'index.html' + (name ? '#' + encodeURIComponent(name) : '');
    c.style.display = '';
    c.innerHTML = '<h3>🎯 学完这篇，继续探索</h3><div class="next-lesson-grid">' +
      '<a href="'+escapeHTML(graphHref)+'">🗺️ 回到知识图谱</a>' +
    '</div>';
    return;
  }
  c.style.display = '';
  c.innerHTML = '<h3>🎯 学完这篇，继续探索</h3><div class="next-lesson-grid">' +
    allNext.map(r=>{
      const icon = r.data?.icon || '📘';
      const lessonUrl = r.data?.lesson;
      const href = lessonUrl ? (lessonUrl.href || lessonUrl) : rootPrefix + 'index.html#' + encodeURIComponent(r.name);
      return '<a href="'+escapeHTML(href)+'">'+escapeHTML(icon)+' '+escapeHTML(r.name)+'</a>';
    }).join('') +
  '</div>';
}

// === 课件复习卡 ===
const __conceptSummary = {
  '整数加减法':['🔢','加减法是在数轴上移动；进位/退位=相邻数位的满十/借一'],
  '整数乘法':['🔢','乘法=同数连加；因数交换、结合、分配让计算更灵活'],
  '整数除法':['🔢','除法=均分或包含；乘除互为逆运算'],
  '位置值':['🔢','每个数位有自己的值；向左×10，向右÷10'],
  '小数的意义':['🔢','小数=位置值向右延伸；十分位/百分位/千分位'],
  '整数四则运算':['🔢','先乘除后加减；括号改变运算顺序'],
  '矩形面积':['📐','面积=单位正方形个数=长×宽'],
  '等式的性质':['⚖️','等式两边同加减乘除同个数，等式仍成立'],
  '图形认知':['📐','认识平面图形的基本特征：边/角/对称'],
  '分数基础':['🔢','分数=部分/整体；分母=总份数，分子=取几份'],
  '数据收集':['📊','数据收集=问问题+做记录；整理后用图表更好看'],
  '单位换算':['🔢','大→小×进率，小→大÷进率；1m=100cm'],
  '轴对称与旋转':['📐','对称=左右完全一样；旋转=图形绕点转，大小形状不变'],
  '用数对确定位置':['📐','数对=(列,行)；先横向找列，再纵向找行'],
  '小数乘法':['🔢','先按整数乘，再移动小数点；乘<1的数结果会变小'],
  '小数除法':['🔢','利用商不变性质转化为整数除法'],
  '因数和倍数':['🔢','因数×因数=积；倍数=这个数×自然数'],
  '235的倍数特征':['🔢','看个位（2/5）；各位数字和（3）'],
  '循环小数':['🔢','除不尽时小数重复出现；循环节表示'],
  '小数近似数':['🔢','按指定精度取最近刻度；看下一位决定四舍或五入'],
  '观察物体':['📐','从正面/上面/左面看立体，三个视图各不相同'],
  '质数与合数':['🔢','只有两个因数=质数；多于两个=合数；1不是质数也不是合数'],
  '奇数和偶数':['🔢','能被2整除是偶数，否则是奇数；只需看个位'],
  '简易方程':['⚖️','设未知数列等式；用等式的性质求解'],
  '长方体和正方体':['📐','6面/12棱/8顶点；表面积=6个面面积之和'],
  '长方体正方体表面积':['📐','把6个外表面展开再求和；不能只算看得见的面'],
  '平行四边形面积':['📐','剪拼→矩形；面积=底×高'],
  '体积和体积单位':['📐','体积=空间大小；1cm³=棱长1cm的正方体'],
  '长方体体积':['📐','体积=长×宽×高=底面积×高'],
  '三角形面积':['📐','两个全等三角形拼成平行四边形；面积=底×高÷2'],
  '容积和容积单位':['📐','容积=内部空间；1L=1dm³=1000mL'],
  '梯形面积':['📐','两个全等梯形拼成平行四边形；面积=(上底+下底)×高÷2'],
  '组合图形面积':['📐','分割法或添补法，分解为基本图形'],
  '分数的意义':['🔢','单位"1"平均分；分数单位=1/分母'],
  '真分数和假分数':['🔢','真<1<假；假=整数+真（带分数）'],
  '可能性':['🎯','确定/不确定；可能性大小用分数表示'],
  '植树问题':['🎯','间隔数+1=两端都栽；-1=两端不栽'],
  '分数的基本性质':['🔢','分子分母同×÷相同非零数，分数大小不变'],
  '分数与除法的关系':['🔢','a÷b可以写成a/b；分数线就是除号的另一种表示'],
  '约分':['🔢','最大公因数约到最简'],
  '公因数和最大公因数':['🔢','两个数共有的因数叫公因数，最大的用于约分'],
  '通分':['🔢','最小公倍数化同分母'],
  '公倍数和最小公倍数':['🔢','两个数共有的倍数叫公倍数，最小的用于通分'],
  '分数加减法':['🔢','同分母直接算；异分母先通分'],
  '分数加减混合运算':['🔢','分数混合加减遵循从左到右和括号优先，先统一单位更稳'],
  '分数与小数互化':['🔢','10/100/1000直接写小数；其余分子÷分母'],
  '折线统计图':['📊','点=数据，线=变化趋势'],
  '复式折线统计图':['📊','多条折线放在同一图里比较变化趋势和差距'],
  '旋转三要素':['📐','旋转要说清中心、方向和角度；形状大小不变'],
  '不规则图形面积估算':['📐','用数方格或拆补法估算；半格以上通常按一格计'],
  '找次品':['🎯','分成3组最优；天平每次排除2/3'],
};

function primaryConceptName(names){
  const list=Array.isArray(names) ? names.filter(Boolean) : getCurrentConceptNames();
  return list[0] || '本课概念';
}

function conceptSummaryText(name){
  return (__conceptSummary[name] && __conceptSummary[name][1]) || '先看对象、单位和不变量，再决定能否套用规则。';
}

function conceptFlavor(name){
  if(/方程|等式|找次品/.test(name))return 'balance';
  if(/分数|约分|通分|可能性/.test(name))return 'fraction';
  if(/面积|图形|坐标|数对/.test(name))return 'area';
  if(/观察|长方体|正方体|体积|容积|表面积/.test(name))return 'space';
  if(/对称|旋转/.test(name))return 'transform';
  if(/统计|数据|折线/.test(name))return 'stats';
  return 'number';
}

function enrichAdversarialChallenges(base, conceptNames, minCount){
  const challenges=[...base];
  const name=primaryConceptName(conceptNames);
  const flavor=conceptFlavor(name);
  const bank=[
    {tag:name,statement:`学习“${name}”时，只要记住公式，不需要知道公式从哪里来。`,answer:'refute',hint:'公式是结果，理解要回到定义和不变量。',explanation:'只背公式容易在条件变化时误用；要知道每一步为什么合法。',counterexample:'面积公式、分数通分、方程变形都依赖具体条件。'},
    {tag:'条件',statement:`“${name}”的规则在任何题目里都可以直接套用。`,answer:'refute',hint:'找一找规则成立的前提。',explanation:'数学规则总有适用条件，先检查单位、对象、方向或等量关系。',counterexample:'异分母分数不能直接加分子；方程两边要做同一种操作。'},
    {tag:'迁移',statement:'遇到新题，可以先问：它和我学过的哪个结构相同？',answer:'agree',hint:'这是把题目拆回底层模型。',explanation:'把新题还原成已学结构，能减少机械套题。',counterexample:'小数运算回到位置值，面积问题回到单位格计数。'},
    {tag:'表达',statement:`如果能用自己的话解释“${name}”为什么成立，通常比只会算更可靠。`,answer:'agree',hint:'费曼输出检验的是理解。',explanation:'能讲清楚来源、条件和反例，说明不是只记住表面步骤。'}
  ];
  if(flavor==='fraction'){
    bank.unshift({tag:'分数单位',statement:'所有分数都可以直接把分子相加、分母相加。',answer:'refute',hint:'先看分数单位是否相同。',explanation:'只有分数单位一致时才可以直接合并分子；异分母要先通分。',counterexample:'1/2+1/3 不等于 2/5。'});
  }
  if(flavor==='area'){
    bank.unshift({tag:'单位格',statement:'图形看起来更长，面积就一定更大。',answer:'refute',hint:'面积看覆盖了多少单位格。',explanation:'面积由单位面积的个数决定，不能只看长度或外观。',counterexample:'细长图形可能面积小，短宽图形可能面积大。'});
  }
  if(flavor==='balance'){
    bank.unshift({tag:'等量',statement:'方程两边只要随便改一边，也能保持相等。',answer:'refute',hint:'天平为什么会倾斜？',explanation:'等式两边必须做同一种合法操作，平衡关系才保留。',counterexample:'x+3=7，只有左边减3会破坏等式。'});
  }
  if(flavor==='space'){
    bank.unshift({tag:'空间',statement:'看得见的面，就是这个立体的全部表面。',answer:'refute',hint:'还有背面、底面或内部空间。',explanation:'空间概念要区分可见面、全部外表面、占据空间和内部容量。',counterexample:'长方体正面只是一面，表面积要算6个面。'});
  }
  if(flavor==='stats'){
    bank.unshift({tag:'趋势',statement:'折线统计图只看最高点，不需要看线的变化。',answer:'refute',hint:'折线的价值在变化过程。',explanation:'统计图不仅看大小，还要看趋势、增减和比较。',counterexample:'两个数据集最高点相同，变化趋势可能完全不同。'});
  }
  const seen=new Set(challenges.map(ch=>ch.statement));
  for(const item of bank){
    if(challenges.length>=minCount)break;
    if(seen.has(item.statement))continue;
    challenges.push(item);
    seen.add(item.statement);
  }
  return challenges;
}

function enrichPracticeExercises(base, conceptNames, minCount){
  const exercises=[...base];
  const name=primaryConceptName(conceptNames);
  const summary=conceptSummaryText(name);
  const bank=[
    {
      question:`用一句话写出“${escapeHTML(name)}”的核心意思。`,
      inputs:[{key:'a',width:180}],
      check:a=>String(a.a||'').trim().length>=4,
      hint:`可以围绕这句话改写：${summary}`
    },
    {
      question:`写出学习“${escapeHTML(name)}”前必须先检查的一个条件。`,
      inputs:[{key:'a',width:160}],
      check:a=>String(a.a||'').trim().length>=2,
      hint:'想一想：单位相同吗？对象相同吗？等式两边是否同操作？'
    },
    {
      question:`举一个“${escapeHTML(name)}”容易误用的情况。`,
      inputs:[{key:'a',width:180}],
      check:a=>String(a.a||'').trim().length>=4,
      hint:'写出一个反例或一个容易漏掉的条件。'
    }
  ];
  for(const item of bank){
    if(exercises.length>=minCount)break;
    exercises.push(item);
  }
  return exercises;
}

function createLessonRoadmap(){
  if(document.querySelector('.lesson-roadmap'))return;
  const sections=[...document.querySelectorAll('.section')].filter(section=>section.querySelector('.section-header'));
  if(sections.length<3)return;
  sections.forEach((section,i)=>{
    if(!section.id)section.id='lesson-step-'+(i+1);
  });
  const nav=document.createElement('nav');
  nav.className='lesson-roadmap';
  nav.setAttribute('aria-label','本课学习流程');
  nav.innerHTML='<div class="lesson-roadmap-title">学习流程</div><div class="lesson-roadmap-track">'+sections.map((section,i)=>{
    const title=section.querySelector('.section-header')?.textContent.trim().replace(/\s+/g,' ') || `步骤 ${i+1}`;
    return `<a href="#${escapeHTML(section.id)}" data-step="${i}"><span>${i+1}</span>${escapeHTML(title)}</a>`;
  }).join('')+'</div>';
  const anchor=document.querySelector('.concept-sync-card') || document.querySelector('.module-subtitle') || document.querySelector('.module-title');
  if(anchor)anchor.insertAdjacentElement('afterend',nav);
  else document.body.prepend(nav);
  nav.addEventListener('click',e=>{
    const link=e.target.closest('a');
    if(!link)return;
    e.preventDefault();
    const target=document.getElementById(link.getAttribute('href').slice(1));
    if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
  });
  if('IntersectionObserver' in window){
    const links=[...nav.querySelectorAll('a')];
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      links.forEach(link=>link.classList.toggle('active', link.getAttribute('href')==='#'+visible.target.id));
    },{rootMargin:'-20% 0px -60% 0px',threshold:[0.1,0.3,0.6]});
    sections.forEach(section=>observer.observe(section));
    links[0]?.classList.add('active');
  }
}

function ensureCourseSummary(){
  let target=document.getElementById('course-summary');
  if(!target){
    target=document.createElement('div');
    target.id='course-summary';
    insertAfterLastSection(target);
  }
  createCourseSummary({containerId:'course-summary'});
}

function ensureNextLesson(){
  let target=document.getElementById('next-lesson');
  if(!target){
    target=document.createElement('div');
    target.id='next-lesson';
    target.className='next-lesson-card';
    const summary=document.getElementById('course-summary');
    if(summary)summary.insertAdjacentElement('afterend',target);
    else insertAfterLastSection(target);
  }
  createNextLessonSuggestion({containerId:'next-lesson'});
}

function ensureMistakeReview(){
  let target=document.getElementById('mistake-review');
  if(!target){
    target=document.createElement('div');
    target.id='mistake-review';
    const summary=document.getElementById('course-summary');
    if(summary)summary.insertAdjacentElement('beforebegin',target);
    else insertAfterLastSection(target);
  }
  renderMistakeReview('mistake-review');
}

function renderMistakeReview(containerId){
  const c=document.getElementById(containerId);
  if(!c)return;
  const concepts=getCurrentConceptNames();
  const mistakes=getUnresolvedMistakes(concepts);
  const title=concepts.length>1?'本组概念错题本':'本课错题本';
  c.className='mistake-review-card';
  if(!mistakes.length){
    c.innerHTML=`<div class="mistake-review-head"><div><span>📒</span><b>${title}</b></div><em>暂无待复习错题</em></div>
      <p class="mistake-empty">后续练习、前置检查、对抗挑战或费曼输出答错时，会自动收集到这里。</p>`;
    return;
  }
  c.innerHTML=`<div class="mistake-review-head"><div><span>📒</span><b>${title}</b></div><em>${mistakes.length} 条待复习</em></div>
    <div class="mistake-list">${mistakes.slice(0,6).map(item=>`
      <article class="mistake-item">
        <div class="mistake-meta"><span>${escapeHTML(item.type||'练习')}</span><span>尝试 ${item.attempts||1} 次</span></div>
        <b>${escapeHTML(item.question)}</b>
        ${item.userAnswer?`<p>你的答案：${escapeHTML(item.userAnswer)}</p>`:''}
        ${item.expected?`<p>目标方向：${escapeHTML(item.expected)}</p>`:''}
        ${item.hint?`<p class="mistake-hint">提示：${escapeHTML(item.hint)}</p>`:''}
        <button type="button" data-resolve-mistake="${escapeHTML(item.id)}">已理解，移出错题本</button>
      </article>`).join('')}</div>
    <div class="mistake-actions"><button type="button" data-clear-concept-mistakes>本课全部已掌握</button></div>`;
  c.querySelectorAll('[data-resolve-mistake]').forEach(btn=>{
    btn.addEventListener('click',()=>markMistakeResolved(btn.dataset.resolveMistake));
  });
  c.querySelector('[data-clear-concept-mistakes]')?.addEventListener('click',()=>clearConceptMistakes(concepts));
}

function renderMistakeReviewSections(){
  document.querySelectorAll('#mistake-review,.mistake-review-card[id]').forEach(el=>{
    if(el.id)renderMistakeReview(el.id);
  });
}

function insertAfterLastSection(node){
  const sections=[...document.querySelectorAll('.section')];
  const last=sections[sections.length-1] || document.querySelector('.module-subtitle') || document.querySelector('.module-title');
  if(last)last.insertAdjacentElement('afterend',node);
  else document.body.appendChild(node);
}

function hasRichInteractive(){
  return !!document.querySelector('.component-card,.number-line-card,.area-model-card,.fraction-bar-card,.balance-card,.interactive-area canvas,canvas.visual-canvas');
}

function ensureVisualLab(){
  if(document.querySelector('.auto-visual-lab') || hasRichInteractive())return;
  const names=getCurrentConceptNames();
  if(!names.length)return;
  const name=primaryConceptName(names);
  const section=document.createElement('div');
  section.className='section auto-visual-lab';
  section.innerHTML='<div class="section-header"><span class="emoji">🎮</span>可视化操作台</div><div id="auto-visual-lab-root"></div><p class="auto-lab-note">先拖动或切换模型，再回到题目；把抽象规则落到可见结构上。</p>';
  const firstMeaning=[...document.querySelectorAll('.section')].find(section=>/公理|实验|模型|交互/.test(section.textContent));
  if(firstMeaning)firstMeaning.insertAdjacentElement('afterend',section);
  else insertAfterLastSection(section);
  mountConceptVisualLab('auto-visual-lab-root',name);
}

function mountConceptVisualLab(containerId,name){
  const flavor=conceptFlavor(name);
  if(flavor==='fraction'){
    createFractionBar({containerId,title:`${name} · 分数条`,description:'拖动分子和分母，观察同一个整体被平均分成几份。',numerator:1,denominator:4,maxDenominator:12,color:'#3b82f6'});
    return;
  }
  if(flavor==='area'){
    createAreaModel({containerId,title:`${name} · 单位格模型`,description:'拖动选择区域，观察面积如何由单位格累积。',cols:6,rows:4,highlightCols:3,highlightRows:2,color:'#ef476f'});
    return;
  }
  if(flavor==='balance'){
    createBalance({containerId,title:`${name} · 天平模型`,description:'把等量关系看成天平，验证两边必须保持平衡。',leftLabel:'x+3',rightLabel:'9',leftValue:7,rightValue:9,target:'6'});
    return;
  }
  if(flavor==='space'){
    createThreeViewDemo({containerId});
    return;
  }
  if(flavor==='transform'){
    createTransformDemo({containerId});
    return;
  }
  if(flavor==='stats'){
    createNumberLine({containerId,title:`${name} · 趋势刻度`,description:'拖动点位，观察数据从小到大、从低到高的变化方向。',min:0,max:100,step:5,initial:40,unit:'%'});
    return;
  }
  createNumberLine({containerId,title:`${name} · 数轴模型`,description:'拖动游标，观察数值、方向、距离和单位之间的关系。',min:0,max:10,step:0.5,initial:2.5});
}

function createCourseSummary(opts){
  const c = document.getElementById(opts.containerId);
  if(!c)return;
  const names = opts.conceptNames || (document.body?.dataset?.concept || '').split(/[,，]/).map(s=>s.trim()).filter(Boolean);
  const concepts = names.map(n=>({name:n,data:__conceptSummary[n]})).filter(r=>r.data);
  if(!concepts.length){c.style.display='none';return;}
  c.style.display='';
  c.innerHTML = '<div class="course-summary">' +
    '<div class="summary-kicker">📖 你刚才学到了什么</div>' +
    '<div class="summary-grid">' +
    concepts.map(({name,data})=>'<div class="summary-item">' +
      '<span class="summary-icon">'+escapeHTML(data[0])+'</span>' +
      '<div><b>'+escapeHTML(name)+'</b><span>'+escapeHTML(data[1])+'</span></div>' +
    '</div>').join('') +
    '</div></div>';
}

// === 解析按钮 ===
function addExplanation(containerId, explanation){
  const c = document.getElementById(containerId);
  if(!c)return;
  const toggle = document.createElement('button');
  toggle.className = 'explain-toggle';
  toggle.textContent = '📖 解析';
  const content = document.createElement('div');
  content.className = 'explain-content';
  content.textContent = explanation;
  toggle.addEventListener('click',()=>{
    const open = content.classList.toggle('open');
    toggle.textContent = open ? '🙈 收起解析' : '📖 解析';
  });
  c.appendChild(toggle);
  c.appendChild(content);
}

// 暴露到全局
window.saveProgress=saveProgress;
window.getProgress=getProgress;
window.celebrate=celebrate;
window.revealSteps=revealSteps;
window.showFeedback=showFeedback;
window.clearFeedback=clearFeedback;
window.initScrollProgress=initScrollProgress;
window.createGate=createGate;
window.createExerciseSet=createExerciseSet;
window.createAdversarialChallenge=createAdversarialChallenge;
window.createFeynmanFill=createFeynmanFill;
window.createNumberLine=createNumberLine;
window.createAreaModel=createAreaModel;
window.createFractionBar=createFractionBar;
window.createLongDivision=createLongDivision;
window.createLineChartInteract=createLineChartInteract;
window.createPolygonCut=createPolygonCut;
window.createBalance=createBalance;
window.createCuboid3D=createCuboid3D;
window.createNetUnfold=createNetUnfold;
window.createSymmetryBoard=createSymmetryBoard;
window.createBalanceScale=createBalanceScale;
window.createProbabilitySim=createProbabilitySim;
window.createThreeViewDemo=createThreeViewDemo;
window.createTransformDemo=createTransformDemo;
window.createParallelogramCutDemo=createParallelogramCutDemo;
// === 概念进度追踪（Phase C） ===
function saveConceptProgress(conceptNames){
  try{
    const key='math5_concept_progress';
    const cur=JSON.parse(localStorage.getItem(key)||'{}');
    const names=Array.isArray(conceptNames)?conceptNames:[conceptNames];
    names.forEach(name=>{if(name)cur[name]={completed:true,completedAt:Date.now()};});
    localStorage.setItem(key,JSON.stringify(cur));
    return cur;
  }catch(e){console.warn('saveConceptProgress:',e);return{};}
}
function getConceptProgress(){
  try{return JSON.parse(localStorage.getItem('math5_concept_progress')||'{}');}catch{return{};}
}
function isConceptCompleted(name){
  const p=getConceptProgress();
  return !!(p[name]&&p[name].completed);
}
function setupCompletionButton(containerId){
  const c=document.getElementById(containerId);
  if(!c)return;
  const names=(document.body?.dataset?.concept||'').split(/[,，]/).map(s=>s.trim()).filter(Boolean);
  if(!names.length){c.style.display='none';return;}
  
  // Check if any concept already completed
  const anyDone=names.some(n=>isConceptCompleted(n));
  const allDone=names.every(n=>isConceptCompleted(n));
  
  c.style.display='';
  c.innerHTML='<div class="completion-card">'+
    '<h3>📚 学习进度</h3>'+
    '<p class="completion-concepts">涉及概念：'+names.map(n=>'<span class="completion-tag'+(isConceptCompleted(n)?' done':'')+'">'+(isConceptCompleted(n)?'✅':'📖')+' '+n+'</span>').join('')+'</p>'+
    (allDone?'<button class="completion-btn done" disabled>✅ 已完成</button>':
      '<button class="completion-btn" onclick="markConceptsComplete()">🎯 标记完成</button>')+
    '<p class="completion-hint">标记完成后，知识星图上会显示掌握状态</p>'+
  '</div>';
}
function markConceptsComplete(){
  const names=(document.body?.dataset?.concept||'').split(/[,，]/).map(s=>s.trim()).filter(Boolean);
  if(!names.length)return;
  saveConceptProgress(names);
  const c=document.querySelector('.completion-card');
  if(c){
    c.innerHTML='<h3>📚 学习进度</h3>'+
      '<p class="completion-concepts">'+names.map(n=>'<span class="completion-tag done">✅ '+n+'</span>').join('')+'</p>'+
      '<button class="completion-btn done" disabled>✅ 已完成</button>'+
      '<p class="completion-hint">🎉 状态已同步到知识星图</p>';
  }
}

window.addHintButton=addHintButton;
window.createNextLessonSuggestion=createNextLessonSuggestion;
window.createCourseSummary=createCourseSummary;
window.addExplanation=addExplanation;
window.saveConceptProgress=saveConceptProgress;
window.getConceptProgress=getConceptProgress;
window.isConceptCompleted=isConceptCompleted;
window.setupCompletionButton=setupCompletionButton;
window.markConceptsComplete=markConceptsComplete;
window.createLessonRoadmap=createLessonRoadmap;
window.mountConceptVisualLab=mountConceptVisualLab;
window.getMistakeBook=getMistakeBook;
window.recordMistake=recordMistake;
window.resolveMistake=resolveMistake;
window.markMistakeResolved=markMistakeResolved;
window.clearConceptMistakes=clearConceptMistakes;
window.renderMistakeReview=renderMistakeReview;

// 自动初始化
function autoInit(){
  initScrollProgress();
  // Auto-create completion section on lesson pages (not star map)
  const isStarMap=!document.body?.dataset?.concept && !location.hash;
  const hasConcept=!!(document.body?.dataset?.concept||'').trim();
  if(hasConcept){
    createLessonRoadmap();
    ensureVisualLab();
    ensureCourseSummary();
    ensureMistakeReview();
    ensureNextLesson();
  }
  if(hasConcept && !document.getElementById('completion-section')){
    const section=document.createElement('div');
    section.id='completion-section';
    section.style.cssText='margin:32px auto;max-width:min(680px,92vw);padding:0 16px';
    // Insert after the last child or a good spot
    const main=document.querySelector('main,article,.content,.lesson-body') || document.body;
    main.appendChild(section);
    setupCompletionButton('completion-section');
  }else{
    const cb=document.getElementById('completion-section');
    if(cb)setupCompletionButton('completion-section');
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',autoInit);
else autoInit();

})();
