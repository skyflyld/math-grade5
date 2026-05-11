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
      if(qItem.inputs){
        qItem.inputs.forEach(inp=>{
          const inputs=qc.querySelectorAll('.input-field');
          let found=null;
          inputs.forEach(el=>{if(el.dataset.key===inp.key)found=el;});
          if(found)answer[inp.key]=found.value.trim();
        });
      }
      const correct=qItem.check(answer);
      if(!correct){
        allCorrect=false;
        if(qItem.inputs){
          qItem.inputs.forEach(inp=>{
            const inputs=qc.querySelectorAll('.input-field');
            inputs.forEach(el=>{if(el.dataset.key===inp.key)el.className='input-field wrong';});
          });
        }
      }else{
        if(qItem.inputs){
          qItem.inputs.forEach(inp=>{
            const inputs=qc.querySelectorAll('.input-field');
            inputs.forEach(el=>{if(el.dataset.key===inp.key)el.className='input-field correct';});
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
window.createFeynmanFill=createFeynmanFill;

// 自动初始化
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initScrollProgress);
else initScrollProgress();

})();
