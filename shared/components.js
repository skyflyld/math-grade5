/* === 数学课件共享组件 === */

// ====== 进度管理 ======
const PROGRESS_KEY = 'math5_progress';

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProgress(patch) {
  const current = loadProgress();
  const merged = deepMerge(current, patch);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));
}

function deepMerge(a, b) {
  const res = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      res[k] = deepMerge(a[k] || {}, v);
    } else {
      res[k] = v;
    }
  }
  return res;
}

// ====== 门控组件 ======
function createGate({ questions, onPass, onFail }) {
  const container = document.getElementById('gate-root');
  if (!container) return;

  let answers = {};
  let submitted = false;

  function render() {
    container.innerHTML = `
      <div class="gate">
        <h3>🔑 前置检查</h3>
        <p style="color: var(--text-muted); margin-bottom: 12px;">在继续之前，确认两件事：</p>
        <div class="gate-questions">
          ${questions.map((q, i) => `
            <div style="margin: 12px 0; text-align: left;">
              <p style="font-weight: 600; margin-bottom: 4px;">${q.label}</p>
              ${q.inputs.map(inp => `
                <input class="input-field" 
                       data-q="${i}" data-key="${inp.key}"
                       placeholder="${inp.placeholder || ''}"
                       style="width: ${inp.width || 80}px; margin: 4px;"
                       ${submitted ? 'disabled' : ''}>
              `).join('')}
              ${submitted ? `<span style="margin-left: 8px; font-size: 14px;">${q.feedback || ''}</span>` : ''}
            </div>
          `).join('')}
        </div>
        ${!submitted ? '<button class="btn btn-primary" onclick="window._gateSubmit()">提交</button>' : ''}
        <div class="gate-result" id="gate-result"></div>
      </div>
    `;

    if (!submitted) {
      container.querySelectorAll('.input-field').forEach(el => {
        el.addEventListener('input', () => {
          const q = parseInt(el.dataset.q);
          const key = el.dataset.key;
          if (!answers[q]) answers[q] = {};
          answers[q][key] = el.value;
        });
      });
    }
  }

  window._gateSubmit = function() {
    submitted = true;
    let allCorrect = true;
    const results = questions.map((q, i) => {
      const user = answers[i] || {};
      const correct = q.check(user);
      if (!correct) allCorrect = false;
      return { ...q, user, correct };
    });
    
    render();
    // Update feedback
    results.forEach((r, i) => {
      const span = container.querySelector(`[data-q="${i}"]`)?.parentElement?.querySelector('span');
      if (span) {
        span.textContent = r.correct ? '✅' : `❌ 正确答案: ${r.answer || ''}`;
      }
    });

    const resultEl = document.getElementById('gate-result');
    if (allCorrect) {
      resultEl.innerHTML = '<span style="color: var(--success);">✅ 地基扎实，进入小数乘法的世界</span>';
      setTimeout(onPass, 1500);
    } else {
      resultEl.innerHTML = '<span style="color: var(--warning);">🔄 别急，我们复习一下再试</span>';
      setTimeout(() => { submitted = false; answers = {}; render(); }, 2000);
    }
  };

  render();
}

// ====== 交互实验室：数轴拖拽器 ======
function createNumberLineDrag(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.parentElement.clientWidth - 40;
  const H = canvas.height = 300;

  const margin = { left: 40, right: 40, top: 40, bottom: 40 };
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;

  let mode = config.mode || 'tenths'; // 'tenths' or 'ones'
  let blocks = config.blocks || [{ val: 0.4, color: '#3b82f6' }, { val: 0.4, color: '#3b82f6' }, { val: 0.4, color: '#3b82f6' }];
  let accumulated = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    
    // Title
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.title || '', W/2, 24);

    // Number line
    const y = margin.top + plotH / 2;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(W - margin.right, y);
    ctx.stroke();

    // Ticks
    const maxVal = mode === 'tenths' ? 3 : 30;
    const step = mode === 'tenths' ? 0.2 : 2;
    const pixelsPerUnit = plotW / maxVal;

    for (let v = 0; v <= maxVal; v += step) {
      const x = margin.left + v * pixelsPerUnit;
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x, y + 8);
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      const label = mode === 'tenths' ? v.toFixed(1) : v.toString();
      ctx.fillText(label, x, y + 22);
    }

    // Accumulated blocks
    let accX = margin.left;
    accumulated = 0;
    blocks.forEach((b, i) => {
      const blockW = b.val * pixelsPerUnit;
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(accX, y - 25, blockW, 50);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 2;
      ctx.strokeRect(accX, y - 25, blockW, 50);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.val.toString(), accX + blockW/2, y + 3);
      
      accumulated += b.val;
      accX += blockW;
    });

    // Result
    const endX = margin.left + accumulated * pixelsPerUnit;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(endX, y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`= ${accumulated.toFixed(1)}`, endX, y - 35);

    // Mode toggle button area
    ctx.fillStyle = '#2563eb';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`[ 单位: ${mode === 'tenths' ? '0.1' : '1'} — 点击切换 ]`, W - margin.right, H - 10);
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    if (clickY > H - 30) {
      mode = mode === 'tenths' ? 'ones' : 'tenths';
      draw();
    }
  });

  draw();
}

// ====== 分层练习组件 ======
function createExerciseSet({ containerId, exercises, passThreshold, onPass, onFail }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let userAnswers = {};
  let submitted = false;
  let correctCount = 0;

  function render() {
    container.innerHTML = `
      <div class="exercise-tier">
        ${exercises.map((ex, i) => `
          <div class="exercise-item">
            <span class="q-num">${i + 1}</span>
            <span>${ex.question}</span>
            <div style="margin-top: 8px;">
              ${ex.inputs.map(inp => `
                <input class="input-field" 
                       data-ex="${i}" data-key="${inp.key}"
                       placeholder="${inp.placeholder || ''}"
                       style="width: ${inp.width || 80}px;"
                       ${submitted ? 'disabled' : ''}>
              `).join('')}
              ${submitted ? `<span style="margin-left: 8px; font-weight: 600; color: ${userAnswers[i]?.correct ? 'var(--success)' : 'var(--danger)'}">${userAnswers[i]?.correct ? '✅' : '❌ ' + (ex.answer || '')}</span>` : ''}
            </div>
            ${submitted && userAnswers[i]?.hint && !userAnswers[i]?.correct ? `<div class="feedback hint show">💡 ${userAnswers[i].hint}</div>` : ''}
          </div>
        `).join('')}
        ${!submitted ? `<button class="btn btn-primary" onclick="window._exSubmit()">提交</button>` : ''}
        <div id="ex-result" style="margin-top: 16px; font-weight: 700;"></div>
      </div>
    `;

    if (!submitted) {
      container.querySelectorAll('.input-field').forEach(el => {
        el.addEventListener('input', () => {
          const idx = parseInt(el.dataset.ex);
          const key = el.dataset.key;
          if (!userAnswers[idx]) userAnswers[idx] = { values: {} };
          userAnswers[idx].values[key] = el.value;
        });
      });
    }
  }

  window._exSubmit = function() {
    submitted = true;
    correctCount = 0;
    exercises.forEach((ex, i) => {
      const ans = userAnswers[i]?.values || {};
      const isCorrect = ex.check(ans);
      userAnswers[i] = userAnswers[i] || {};
      userAnswers[i].correct = isCorrect;
      userAnswers[i].hint = ex.hint;
      if (isCorrect) correctCount++;
    });
    render();
    
    const ratio = correctCount / exercises.length;
    const resultEl = document.getElementById('ex-result');
    if (ratio >= passThreshold) {
      resultEl.innerHTML = `<span style="color: var(--success);">✅ ${correctCount}/${exercises.length} 正确，通过！</span>`;
      setTimeout(onPass, 1000);
    } else {
      resultEl.innerHTML = `<span style="color: var(--warning);">⚠️ ${correctCount}/${exercises.length} 正确（需 ≥${Math.ceil(passThreshold * exercises.length)}/${exercises.length}）。请检查错题后重试。</span>`;
      setTimeout(() => { submitted = false; render(); }, 2500);
    }
  };

  render();
}

// ====== 费曼填空组件 ======
function createFeynmanFill({ containerId, template, answer, onComplete }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Parse template to find ___ blanks
  const parts = template.split(/_{2,}/g);
  
  let filled = new Array(parts.length - 1).fill('');
  let submitted = false;

  function render() {
    let html = '<div style="line-height: 2.2; padding: 16px;">';
    parts.forEach((part, i) => {
      html += `<span>${part}</span>`;
      if (i < parts.length - 1) {
        html += submitted 
          ? `<span style="color: ${filled[i] === answer[i] ? 'var(--success)' : 'var(--danger)'}; font-weight: 700; border-bottom: 2px solid currentColor; padding: 0 6px;">${filled[i] || '___'}</span>`
          : `<input class="input-field fill-input" data-idx="${i}" style="width: 80px;">`;
      }
    });
    html += '</div>';
    html += !submitted 
      ? '<button class="btn btn-primary" onclick="window._feynSubmit()">提交</button>'
      : `<div style="margin-top: 12px; color: var(--text-muted);">${answer.every((a, i) => a === filled[i]) ? '✅ 解释完全正确！' : '📝 以上是标准答案的对比。看看哪里不同，想想为什么。'}</div>`;
    container.innerHTML = html;

    if (!submitted) {
      container.querySelectorAll('.fill-input').forEach(el => {
        el.addEventListener('input', () => {
          filled[parseInt(el.dataset.idx)] = el.value;
        });
      });
    }
  }

  window._feynSubmit = function() {
    submitted = true;
    render();
    if (onComplete) onComplete(filled);
  };

  render();
}

// ====== 滚动进度条 ======
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  bar.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; z-index: 200; height: 3px; background: transparent; margin: 0;';
  bar.innerHTML = '<div class="fill" style="width: 0%;"></div>';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const pct = Math.min(100, (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    bar.querySelector('.fill').style.width = pct + '%';
  });
}

// ====== 工具函数 ======
function animateValue(el, start, end, duration, prefix = '', suffix = '') {
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out
    const current = start + (end - start) * eased;
    el.textContent = prefix + (Number.isInteger(end) ? Math.round(current) : current.toFixed(1)) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
});
