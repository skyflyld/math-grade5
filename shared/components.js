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
        if(qItem.inputs){
          qItem.inputs.forEach(inp=>{
            const found=questionEl?questionEl.querySelector(`.input-field[data-key="${inp.key}"]`):null;
            if(found)found.className='input-field wrong';
          });
        }
      }else{
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
  const exs=opts.exercises||[];
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
  const challenges=opts.challenges||[];
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
        }else{
          state[i].last=choice;
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
  const tpl=opts.template;
  const ans=opts.answer||[];
  let blanks=tpl.match(/___/g);
  if(!blanks)return;
  let parts=tpl.split('___');
  let userInputs=new Array(blanks.length).fill('');

  function render(){
    let html='<div style="background:linear-gradient(145deg,#f0fdf4,#fff);border:2px solid #86efac;border-radius:var(--radius);padding:20px 24px;text-align:left;line-height:2.2;">';
    parts.forEach((p,i)=>{
      html+=p;
      if(i<blanks.length){
        html+=`<input class="input-field" id="feyn-${i}" type="text" style="width:${Math.max(60,20+30*(ans[i]||'').length)}px;margin:0 2px;" value="${userInputs[i]}">`;
      }
    });
    html+=`<div style="text-align:center;margin-top:16px;">
      <button class="btn btn-success" id="feyn-submit">检查答案</button>
      <button class="btn btn-outline btn-sm" id="feyn-reset" style="margin-left:8px;">重置</button>
    </div><div class="feedback" id="feyn-result"></div></div>`;
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
        r.className='feedback show success';
        r.innerHTML='🎉 完美！你理解得很透彻！';
        celebrate(r);
        if(opts.onComplete)opts.onComplete();
      }else{
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
  const min=opts.min||0, max=opts.max||10, initial=opts.initial||5;
  const step=opts.step||1, unit=opts.unit||'';
  let value=initial;
  const canvas=document.createElement('canvas');
  canvas.width=Math.min(600,c.clientWidth-24||560);
  canvas.height=100;
  canvas.style.cssText='max-width:100%;cursor:pointer;border-radius:8px;background:#fff;';
  const label=document.createElement('div');
  label.style.cssText='text-align:center;font-size:20px;font-weight:800;margin:6px 0;color:var(--accent-deep);';
  label.textContent=value+unit;
  c.innerHTML='';
  c.append(canvas,label);

  function draw(){
    const ctx=canvas.getContext('2d'), w=canvas.width, h=canvas.height;
    const pad=40, lw=w-2*pad, cy=55;
    ctx.clearRect(0,0,w,h);
    // Base line
    ctx.strokeStyle='#cbd5e1';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(pad,cy);ctx.lineTo(w-pad,cy);ctx.stroke();
    // Ticks + labels
    const ticks=Math.round((max-min)/step);
    ctx.fillStyle='#94a3b8';ctx.font='11px sans-serif';ctx.textAlign='center';
    for(let i=0;i<=ticks;i++){
      const x=pad+i*lw/ticks, v=min+i*step;
      ctx.strokeStyle='#cbd5e1';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,cy-6);ctx.lineTo(x,cy+6);ctx.stroke();
      ctx.fillStyle='#64748b';ctx.fillText(String(v),x,cy+20);
    }
    // Drag handle
    const pos=pad+(value-min)/(max-min)*lw;
    ctx.fillStyle='#f59e0b';ctx.strokeStyle='#d97706';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(pos,cy-18);ctx.lineTo(pos-10,cy-6);ctx.lineTo(pos+10,cy-6);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#92400e';ctx.font='14px sans-serif';ctx.textAlign='center';
    ctx.fillText('▼',pos,cy-22);
  }
  function getValueFromX(x){
    const rect=canvas.getBoundingClientRect(), pad=40, lw=canvas.width-2*pad;
    const ratio=Math.max(0,Math.min(1,(x-rect.left-pad)/lw));
    const raw=min+ratio*(max-min);
    return Math.round(raw/step)*step;
  }
  function setValue(v){
    value=Math.max(min,Math.min(max,v));
    label.textContent=value+unit;
    draw();
    if(opts.onChange)opts.onChange(value);
  }

  canvas.addEventListener('mousedown',e=>{
    const onMove=(ev)=>setValue(getValueFromX(ev.clientX));
    const onUp=()=>{document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);};
    document.addEventListener('mousemove',onMove);
    document.addEventListener('mouseup',onUp);
    setValue(getValueFromX(e.clientX));
  });
  canvas.addEventListener('touchstart',e=>{
    e.preventDefault();
    const t=e.changedTouches[0];
    const onMove=(ev)=>setValue(getValueFromX(ev.changedTouches[0].clientX));
    const onEnd=()=>{document.removeEventListener('touchmove',onMove);document.removeEventListener('touchend',onEnd);};
    document.addEventListener('touchmove',onMove,{passive:true});
    document.addEventListener('touchend',onEnd);
    setValue(getValueFromX(t.clientX));
  });
  draw();
  return {getValue:()=>value,setValue};
}

// === 面积模型组件 ===
function createAreaModel(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const cols=opts.cols||5, rows=opts.rows||3, cell=opts.cellSize||40;
  let highlightCols=opts.highlightCols||0, highlightRows=opts.highlightRows||0;
  const canvas=document.createElement('canvas');
  const pad=16;
  canvas.width=Math.min(cols*cell+2*pad,c.clientWidth-24||600);
  canvas.height=rows*cell+2*pad+30;
  canvas.style.cssText='max-width:100%;border-radius:8px;background:#f8fafc;cursor:pointer;';
  const info=document.createElement('div');
  info.style.cssText='text-align:center;font-size:18px;font-weight:800;margin:6px 0;color:var(--accent-deep);';
  c.innerHTML='';c.append(canvas,info);

  function draw(){
    const ctx=canvas.getContext('2d'), w=canvas.width, h=canvas.height;
    const ox=pad, oy=pad;
    ctx.clearRect(0,0,w,h);
    const total=cols*rows, shown=(highlightCols||cols)*(highlightRows||rows);
    info.textContent=`${shown} 个格子 (${highlightCols||cols}×${highlightRows||rows} = ${shown})`;
    // Grid
    for(let r=0;r<rows;r++){
      for(let ct=0;ct<cols;ct++){
        const x=ox+ct*cell, y=oy+r*cell, hl=ct<highlightCols&&r<highlightRows;
        ctx.fillStyle=hl?'rgba(59,130,246,0.35)':'rgba(148,163,184,0.1)';
        ctx.fillRect(x,y,cell,cell);
        ctx.strokeStyle=hl?'#3b82f6':'#cbd5e1';
        ctx.lineWidth=hl?2:1;
        ctx.strokeRect(x,y,cell,cell);
        if(hl){ctx.fillStyle='#1e40af';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('■',x+cell/2,y+cell/2);}
      }
    }
    // Highlight border
    if(highlightCols>0&&highlightRows>0){
      ctx.strokeStyle='#f59e0b';ctx.lineWidth=3;ctx.setLineDash([6,4]);
      ctx.strokeRect(ox,oy,highlightCols*cell,highlightRows*cell);
      ctx.setLineDash([]);
    }
    ctx.fillStyle='#64748b';ctx.font='12px sans-serif';ctx.textAlign='center';
    ctx.fillText(`${cols} 列`,ox+cols*cell/2,oy+rows*cell+18);
  }

  canvas.addEventListener('click',e=>{
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left-ox, y=e.clientY-rect.top-oy;
    if(x<0||y<0||x>cols*cell||y>rows*cell)return;
    const ct=Math.floor(x/cell), rw=Math.floor(y/cell);
    highlightCols=ct+1;highlightRows=rw+1;
    draw();
    if(opts.onChange)opts.onChange({cols:highlightCols,rows:highlightRows,total:highlightCols*highlightRows});
  });
  draw();
  return {getDimensions:()=>({cols:highlightCols,rows:highlightRows,total:highlightCols*highlightRows}),reset:(cl,rw)=>{highlightCols=cl||0;highlightRows=rw||0;draw();}};
}

// === 分数条组件 ===
function createFractionBar(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const num=opts.numerator||1, den=opts.denominator||4, maxDen=opts.maxDenominator||12;
  const color=opts.color||'#3b82f6';
  let barW=Math.min(480,c.clientWidth-32||480);
  const segment=document.createElement('div');
  segment.style.cssText='margin:8px 0;';
  const fullBar=document.createElement('div');
  fullBar.style.cssText=`width:${barW}px;max-width:100%;height:44px;background:#e2e8f0;border-radius:8px;position:relative;overflow:hidden;border:2px solid #94a3b8;`;
  const fill=document.createElement('div');
  fill.style.cssText=`height:100%;width:${(num/den)*100}%;background:${color};border-radius:6px 0 0 6px;transition:width 0.3s;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;`;
  fill.textContent=`${num}/${den}`;
  fullBar.append(fill);
  const controls=document.createElement('div');
  controls.style.cssText='display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:10px;';
  controls.innerHTML=`
    <label style="font-size:13px;">分子 <input id="fb-num" type="range" min="0" max="${den}" value="${num}" style="width:80px;"></label>
    <label style="font-size:13px;">分母 <input id="fb-den" type="range" min="1" max="${maxDen}" value="${den}" style="width:80px;"></label>
    <span id="fb-val" style="font-size:24px;font-weight:800;color:var(--accent-deep);">${num}/${den}</span>
  `;
  const eqBar=document.createElement('div');
  eqBar.style.cssText='margin-top:16px;display:none;';
  eqBar.innerHTML=`<div style="font-size:13px;font-weight:700;margin-bottom:4px;color:var(--text-dim);">等值分数</div><div id="fb-eq" style="font-size:18px;font-weight:800;color:var(--accent);"></div>`;
  c.innerHTML='';c.append(segment,fullBar,controls,eqBar);

  function update(){
    const n=parseInt(document.getElementById('fb-num').value);
    const d=parseInt(document.getElementById('fb-den').value);
    document.getElementById('fb-num').max=d;
    fill.style.width=`${(n/d)*100}%`;
    fill.textContent=`${n}/${d}`;
    document.getElementById('fb-val').textContent=`${n}/${d}`;
    // Show equivalent fractions
    if(opts.showEquivalents!==false&&d>0&&n>0){
      const gcd=(a,b)=>b?gcd(b,a%b):a;
      const g=gcd(n,d), sn=n/g, sd=d/g;
      eqBar.style.display='block';
      document.getElementById('fb-eq').textContent=sn===n&&sd===d?'(已是最简)' : `${n}/${d} = ${sn}/${sd}`;
    }
    if(opts.onChange)opts.onChange({numerator:n,denominator:d,value:n/d});
  }
  document.getElementById('fb-num').addEventListener('input',update);
  document.getElementById('fb-den').addEventListener('input',update);
  return {getValue:()=>({n:parseInt(document.getElementById('fb-num').value),d:parseInt(document.getElementById('fb-den').value)})};
}

// === 天平组件 ===
function createBalance(opts){
  const c=document.getElementById(opts.containerId);
  if(!c)return;
  const leftLabel=opts.leftLabel||'?', rightLabel=opts.rightLabel||'☐';
  let leftVal=opts.leftValue||0, rightVal=opts.rightValue||0;
  let target=opts.target||'';
  const canvas=document.createElement('canvas');
  const w=Math.min(400,c.clientWidth-24||400), h=180;
  canvas.width=w;canvas.height=h;
  canvas.style.cssText='max-width:100%;border-radius:8px;background:#fff;';
  const answerRow=document.createElement('div');
  answerRow.style.cssText='display:flex;gap:8px;justify-content:center;align-items:center;margin:8px 0;flex-wrap:wrap;';
  answerRow.innerHTML=`
    <span style="font-weight:700;">${leftLabel} = </span>
    <input id="bal-ans" type="text" class="input-field" style="width:60px;">
    <button class="btn btn-primary btn-sm" id="bal-submit">验证</button>
    <div class="feedback" id="bal-fb"></div>
  `;
  c.innerHTML='';c.append(canvas,answerRow);

  function draw(){
    const ctx=canvas.getContext('2d');
    const cx=w/2;ctx.clearRect(0,0,w,h);
    // Stand
    ctx.strokeStyle='#94a3b8';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(cx,45);ctx.lineTo(cx,h);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx-12,h);ctx.lineTo(cx+12,h);ctx.stroke();
    // Beam
    const tilt=leftVal===rightVal?0:leftVal>rightVal?8:-8;
    ctx.save();ctx.translate(cx,45);ctx.rotate(tilt*Math.PI/180);
    ctx.strokeStyle='#64748b';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(-120,0);ctx.lineTo(120,0);ctx.stroke();
    ctx.fillStyle='#92400e';ctx.font='12px sans-serif';ctx.textAlign='center';
    ctx.fillText('⚖️',0,-16);
    // Left pan
    ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-120,0);ctx.lineTo(-120,30);
    ctx.moveTo(-140,35);ctx.lineTo(-100,35);ctx.moveTo(-100,30);ctx.lineTo(-100,35);ctx.stroke();
    ctx.fillStyle='rgba(59,130,246,0.25)';ctx.fillRect(-140,35,40,20);
    ctx.fillStyle='#1e40af';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(leftLabel,-120,50);
    // Right pan
    ctx.strokeStyle='#16a34a';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(120,0);ctx.lineTo(120,30);
    ctx.moveTo(100,35);ctx.lineTo(140,35);ctx.moveTo(140,30);ctx.lineTo(140,35);ctx.stroke();
    ctx.fillStyle='rgba(34,197,94,0.25)';ctx.fillRect(100,35,40,20);
    ctx.fillStyle='#166534';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(rightLabel,120,50);
    ctx.restore();
    // Balance indicator
    ctx.fillStyle='#64748b';ctx.font='13px sans-serif';ctx.textAlign='center';
    ctx.fillText(leftVal===rightVal?'⚖️ 平衡！':leftVal>rightVal?'⬅ 左边重':'右边重 ➡',cx,h-14);
  }
  draw();

  document.getElementById('bal-submit').addEventListener('click',()=>{
    const ans=document.getElementById('bal-ans').value.trim();
    const fb=document.getElementById('bal-fb');
    if(ans===String(target)){
      fb.className='feedback show success';fb.innerHTML='✅ 正确！天平平衡！';celebrate(fb);
      if(opts.onSolve)opts.onSolve(ans);
    }else{
      fb.className='feedback show error';fb.innerHTML='❌ 再想想，天平要平衡两边必须相等';}
  });
  return {setValues:(l,r)=>{leftVal=l;rightVal=r;draw();}};
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
window.createBalance=createBalance;
window.createThreeViewDemo=createThreeViewDemo;
window.createTransformDemo=createTransformDemo;
window.createParallelogramCutDemo=createParallelogramCutDemo;

// 自动初始化
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initScrollProgress);
else initScrollProgress();

})();
