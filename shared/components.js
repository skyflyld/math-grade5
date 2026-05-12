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
  if(!allNext.length){
    c.style.display = 'none';
    return;
  }
  c.style.display = '';
  const rootPrefix = (function(){const s=Array.from(document.scripts).find(s=>/concept-sync/.test(s.getAttribute('src')||''));const src=s?.getAttribute('src')||'';const i=src.indexOf('shared/concept-sync.js');return i>=0?src.slice(0,i):'';})();
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
  '小数乘法':['🔢','先按整数乘，再移动小数点；乘<1的数结果会变小'],
  '小数除法':['🔢','利用商不变性质转化为整数除法'],
  '因数和倍数':['🔢','因数×因数=积；倍数=这个数×自然数'],
  '235的倍数特征':['🔢','看个位（2/5）；各位数字和（3）'],
  '循环小数':['🔢','除不尽时小数重复出现；循环节表示'],
  '观察物体':['📐','从正面/上面/左面看立体，三个视图各不相同'],
  '质数与合数':['🔢','只有两个因数=质数；多于两个=合数；1不是质数也不是合数'],
  '简易方程':['⚖️','设未知数列等式；用等式的性质求解'],
  '长方体和正方体':['📐','6面/12棱/8顶点；表面积=6个面面积之和'],
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
  '约分':['🔢','最大公因数约到最简'],
  '通分':['🔢','最小公倍数化同分母'],
  '分数加减法':['🔢','同分母直接算；异分母先通分'],
  '分数与小数互化':['🔢','10/100/1000直接写小数；其余分子÷分母'],
  '折线统计图':['📊','点=数据，线=变化趋势'],
  '找次品':['🎯','分成3组最优；天平每次排除2/3'],
};

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
window.createBalance=createBalance;
window.createThreeViewDemo=createThreeViewDemo;
window.createTransformDemo=createTransformDemo;
window.createParallelogramCutDemo=createParallelogramCutDemo;
window.addHintButton=addHintButton;
window.createNextLessonSuggestion=createNextLessonSuggestion;
window.createCourseSummary=createCourseSummary;
window.addExplanation=addExplanation;

// 自动初始化
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initScrollProgress);
else initScrollProgress();

})();
