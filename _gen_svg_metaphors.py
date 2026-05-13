#!/usr/bin/env python3
"""Generate SVG visual metaphors for all 51 math concepts.
No API needed — pure deterministic SVG generation."""
import os, json

CONCEPTS = [
  # (filename, name, svg_type, params)
  # svg_type: numberline, grid, pie, bar, shape, blocks, balance, venn, chart, coordinate
  ('int-add-sub', '整数加减法', 'numberline', {'from':-5,'to':10,'mark':[3,5,8],'label':'3+5=8'}),
  ('int-multiply', '整数乘法', 'grid', {'cols':4,'rows':3,'highlight':'all','label':'4×3=12'}),
  ('int-division', '整数除法', 'blocks', {'total':12,'groups':3,'label':'12÷3=4'}),
  ('place-value', '位置值', 'numberline', {'from':0,'to':1000,'marks':[1,10,100,1000],'label':'十进制进位'}),
  ('dec-meaning', '小数的意义', 'numberline', {'from':0,'to':1,'marks':[0,0.1,0.2,0.5,1],'label':'0.1=1/10'}),
  ('four-ops', '整数四则运算', 'balance', {'left':'3×5','right':'15','label':'运算顺序'}),
  ('rect-area', '矩形面积', 'grid', {'cols':5,'rows':3,'highlight':'all','label':'面积=5×3=15'}),
  ('equality', '等式的性质', 'balance', {'left':'x+3=7','right':'→x=4','label':'天平平衡'}),
  ('shape-cog', '图形认知', 'shape', {'type':'polygon','label':'边和角'}),
  ('fraction-basics', '分数基础', 'pie', {'parts':4,'fill':1,'label':'1/4'}),
  ('data-collect', '数据收集', 'chart', {'type':'bar','label':'整理数据'}),
  ('unit-convert', '单位换算', 'numberline', {'from':0,'to':100,'marks':[0,10,100],'label':'×10阶梯'}),

  # 上册
  ('dec-multiply', '小数乘法', 'grid', {'cols':10,'rows':10,'highlight':'partial','label':'0.3×0.2=0.06'}),
  ('dec-division', '小数除法', 'numberline', {'from':0,'to':5,'marks':[0,0.5,1,2,5],'label':'商不变'}),
  ('factors-multiples', '因数和倍数', 'blocks', {'total':12,'groups':None,'label':'12的因数'}),
  ('divisibility-235', '235的倍数特征', 'grid', {'cols':10,'rows':3,'highlight':'pattern','label':'2的倍数个位02468'}),
  ('recurring-dec', '循环小数', 'numberline', {'from':0,'to':1,'marks':[0,0.333,0.666,1],'label':'0.3̅=1/3'}),
  ('observe-objects', '观察物体', 'shape', {'type':'cube3d','label':'三视图'}),
  ('prime-composite', '质数与合数', 'blocks', {'total':None,'groups':None,'label':'质数=数字原子'}),
  ('simple-equation', '简易方程', 'balance', {'left':'2x+3=11','right':'x=4','label':'解方程'}),
  ('cuboid', '长方体和正方体', 'shape', {'type':'cuboid3d','label':'面·棱·顶点'}),
  ('para-area', '平行四边形面积', 'shape', {'type':'para-cut','label':'剪拼→长方形'}),
  ('volume-unit', '体积和体积单位', 'blocks', {'cols':4,'rows':3,'depth':2,'label':'4×3×2=24cm³'}),
  ('tri-area', '三角形面积', 'shape', {'type':'tri-double','label':'底×高÷2'}),
  ('cuboid-volume', '长方体体积', 'grid', {'cols':4,'rows':3,'depth':2,'label':'底面积×高'}),
  ('trap-area', '梯形面积', 'shape', {'type':'trap-double','label':'(上底+下底)×高÷2'}),
  ('comb-area', '组合图形面积', 'shape', {'type':'composite','label':'分割+添补'}),
  ('capacity', '容积和容积单位', 'shape', {'type':'container','label':'1L=1dm³'}),

  # 下册
  ('fraction-meaning', '分数的意义', 'pie', {'parts':8,'fill':3,'label':'3/8=单位1的3份'}),
  ('proper-improper', '真分数和假分数', 'pie', {'parts':4,'fill':5,'label':'5/4>1 假分数'}),
  ('probability', '可能性', 'pie', {'parts':6,'fill':2,'label':'2/6=1/3'}),
  ('tree-planting', '植树问题', 'numberline', {'from':0,'to':5,'marks':[0,1,2,3,4,5],'label':'间隔数+1=棵数'}),
  ('frac-property', '分数的基本性质', 'pie', {'parts':[2,4,8],'fill':[1,2,4],'label':'1/2=2/4=4/8'}),
  ('reduction', '约分', 'pie', {'parts':12,'fill':8,'label':'8/12=2/3÷最大公因数'}),
  ('common-denom', '通分', 'numberline', {'from':0,'to':1,'marks':[0,1/3,1/4,1],'label':'找LCM做同分母'}),
  ('frac-add-sub', '分数加减法', 'pie', {'parts':[4,4],'fill':[1,2],'label':'1/4+2/4=3/4'}),
  ('frac-dec-convert', '分数与小数互化', 'numberline', {'from':0,'to':1,'marks':[0,0.25,0.5,0.75,1],'label':'1/4=0.25'}),
  ('line-chart', '折线统计图', 'chart', {'type':'line','label':'变化趋势'}),
  ('find-faulty', '找次品', 'balance', {'left':'3=3','right':'称量','label':'三等分策略'}),
  ('coordinates', '用数对确定位置', 'grid', {'cols':5,'rows':5,'highlight':'point','point':(3,2),'label':'(3,2)'}),
  ('dec-approx', '小数近似数', 'numberline', {'from':0,'to':5,'marks':[0,3.14,3.1416,5],'label':'3.1416≈3.14'}),
  ('irregular-area', '不规则图形面积估算', 'grid', {'cols':6,'rows':6,'highlight':'irregular','label':'数格法'}),
  ('odd-even', '奇数和偶数', 'blocks', {'total':8,'groups':2,'label':'8=偶数(2人一组无剩余)'}),
  ('gcf', '公因数和最大公因数', 'venn', {'a':[1,2,3,6],'b':[1,2,4,8],'intersect':[1,2],'label':'GCF=2'}),
  ('lcm', '公倍数和最小公倍数', 'venn', {'a':[4,8,12,16],'b':[6,12,18,24],'intersect':[12],'label':'LCM=12'}),
  ('surface-area', '长方体正方体表面积', 'shape', {'type':'cuboid-net','label':'6面展开→2(lw+lh+wh)'}),
  ('frac-division', '分数与除法的关系', 'pie', {'parts':4,'fill':3,'label':'3÷4=3/4'}),
  ('frac-mixed-ops', '分数加减混合运算', 'chart', {'type':'bar','label':'通分→计算→化简'}),
  ('rotation', '旋转三要素', 'shape', {'type':'rotate-demo','label':'中心·方向·角度'}),
  ('dual-line', '复式折线统计图', 'chart', {'type':'dual-line','label':'多组数据对比'}),
]

SVG_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" style="background:#f8f9fa;border-radius:12px"'

def make_svg(c):
  name, label = c[1], c[-1]['label']
  t = c[2]
  p = c[3]

  if t == 'numberline':
    fr, to = p.get('from',0), p.get('to',10)
    marks = p.get('marks',[])
    return f'''<svg {SVG_ATTRS}>
  <text x="200" y="30" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#555">{name}</text>
  <line x1="30" y1="120" x2="370" y2="120" stroke="#333" stroke-width="2"/>
  <polygon points="370,115 380,120 370,125" fill="#333"/>
  {''.join(f'<line x1="{30+(m-fr)/(to-fr)*340}" y1="115" x2="{30+(m-fr)/(to-fr)*340}" y2="125" stroke="#333" stroke-width="2"/><text x="{30+(m-fr)/(to-fr)*340}" y="145" text-anchor="middle" font-size="11" font-family="sans-serif">{m}</text>' for m in marks)}
  {''.join(f'<circle cx="{30+(m-fr)/(to-fr)*340}" cy="120" r="4" fill="#e85d75"/>' for m in marks[:1])}
  <text x="200" y="200" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''

  if t == 'grid':
    cols, rows = p.get('cols',5), p.get('rows',3)
    cell_w, cell_h = 280//cols, 180//rows
    ox, oy = 60, 30
    hl = p.get('highlight','none')
    pt = p.get('point',None)
    cells = []
    for r in range(rows):
      for col in range(cols):
        fill = '#e8f4f8'
        if hl == 'all': fill = '#d4edda'
        elif hl == 'partial' and col < 2 and r < 2: fill = '#f8d7da'
        elif hl == 'pattern' and col % 2 == 0: fill = '#d4edda'
        elif hl == 'point' and pt and col+1 == pt[0] and r+1 == pt[1]: fill = '#f8d7da'
        elif hl == 'irregular':
          # Create an irregular shape pattern
          if (col+r) % 3 == 0 or (col*rows + r) % 4 == 0:
            fill = '#d4edda'
          else:
            fill = '#e8f4f8'
        x = ox + col * cell_w
        y = oy + r * cell_h
        cells.append(f'<rect x="{x}" y="{y}" width="{cell_w-1}" height="{cell_h-1}" fill="{fill}" stroke="#aaa" stroke-width="0.5"/>')
    return f'''<svg {SVG_ATTRS}>
  <text x="200" y="18" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#555">{name}</text>
  {''.join(cells)}
  <text x="200" y="225" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''

  if t == 'pie':
    parts = p.get('parts',4)
    fill = p.get('fill',1)
    if isinstance(parts, list):
      # Multiple pies
      pies_html = ''
      for i, (n, f) in enumerate(zip(parts, fill)):
        ox = 70 + i * 130
        angle_step = 360 / n
        arcs = []
        for j in range(n):
          a1 = j * angle_step
          a2 = (j+1) * angle_step
          r = 45
          x1 = ox + r * sin_deg(a1)
          y1 = 110 + r * cos_deg(a1)
          x2 = ox + r * sin_deg(a2)
          y2 = 110 + r * cos_deg(a2)
          large = 1 if angle_step > 180 else 0
          is_filled = j < f
          fill_c = '#d4edda' if is_filled else '#e8f4f8'
          arcs.append(f'<path d="M{ox},{110} L{x1},{y1} A{r},{r} 0 {large},1 {x2},{y2} Z" fill="{fill_c}" stroke="#aaa" stroke-width="0.5"/>')
        pies_html += ''.join(arcs)
      return f'''<svg {SVG_ATTRS}>
  <text x="200" y="18" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#555">{name}</text>
  {pies_html}
  <text x="200" y="225" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''
    else:
      angle_step = 360 / parts
      arcs = []
      for j in range(parts):
        a1 = j * angle_step
        a2 = (j+1) * angle_step
        r = 70
        x1 = 200 + r * sin_deg(a1)
        y1 = 115 + r * cos_deg(a1)
        x2 = 200 + r * sin_deg(a2)
        y2 = 115 + r * cos_deg(a2)
        large = 1 if angle_step > 180 else 0
        is_filled = j < fill
        fill_c = '#d4edda' if is_filled else '#e8f4f8'
        arcs.append(f'<path d="M200,115 L{x1},{y1} A{r},{r} 0 {large},1 {x2},{y2} Z" fill="{fill_c}" stroke="#aaa" stroke-width="0.5"/>')
      return f'''<svg {SVG_ATTRS}>
  <text x="200" y="18" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#555">{name}</text>
  {''.join(arcs)}
  <text x="200" y="225" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''

  if t == 'blocks':
    total = p.get('total',12)
    groups = p.get('groups',3)
    cells = []
    cols = min(groups or 4, total) if groups else 4
    rows_v = (total + cols - 1) // cols if total else 3
    cell_size = 30
    ox, oy = 60, 40
    for i in range(total if total else rows_v * cols):
      col = i % cols
      r = i // cols
      x = ox + col * (cell_size + 4)
      y = oy + r * (cell_size + 4)
      fill = '#d4edda'
      if groups and groups > 0:
        g = i % groups
        fills = ['#d4edda','#f8d7da','#fff3cd','#cce5ff','#e8d5f5']
        fill = fills[g % len(fills)]
      cells.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" fill="{fill}" stroke="#aaa" stroke-width="0.5" rx="3"/>')
    return f'''<svg {SVG_ATTRS}>
  <text x="200" y="18" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#555">{name}</text>
  {''.join(cells)}
  <text x="200" y="225" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''

  if t == 'balance':
    return f'''<svg {SVG_ATTRS}>
  <text x="200" y="18" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#555">{name}</text>
  <line x1="50" y1="70" x2="350" y2="70" stroke="#8B4513" stroke-width="4"/>
  <line x1="200" y1="70" x2="200" y2="130" stroke="#8B4513" stroke-width="3"/>
  <polygon points="185,130 200,145 215,130" fill="#8B4513"/>
  <rect x="80" y="30" width="80" height="40" fill="#e8f4f8" stroke="#333" stroke-width="1" rx="4"/>
  <text x="120" y="55" text-anchor="middle" font-size="12" font-family="sans-serif">{p.get('left','')}</text>
  <rect x="240" y="30" width="80" height="40" fill="#e8f4f8" stroke="#333" stroke-width="1" rx="4"/>
  <text x="280" y="55" text-anchor="middle" font-size="12" font-family="sans-serif">{p.get('right','')}</text>
  <text x="200" y="225" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''

  if t == 'shape':
    st = p.get('type','polygon')
    shapes_html = ''
    if st == 'polygon':
      shapes_html = '<polygon points="200,40 320,100 280,200 120,200 80,100" fill="#e8f4f8" stroke="#333" stroke-width="2"/><circle cx="200" cy="40" r="3" fill="#e85d75"/><text x="210" y="45" font-size="10">A</text><circle cx="320" cy="100" r="3" fill="#e85d75"/><text x="325" y="105" font-size="10">B</text><circle cx="280" cy="200" r="3" fill="#e85d75"/><text x="285" y="215" font-size="10">C</text>'
    elif st == 'cube3d':
      shapes_html = '<polygon points="120,80 200,60 280,80 200,100" fill="#cce5ff" stroke="#333" stroke-width="1.5"/><polygon points="120,80 120,170 200,190 200,100" fill="#e8f4f8" stroke="#333" stroke-width="1.5"/><polygon points="200,100 200,190 280,170 280,80" fill="#d4edda" stroke="#333" stroke-width="1.5"/>'
    elif st == 'cuboid3d':
      shapes_html = '<rect x="100" y="70" width="200" height="100" fill="#e8f4f8" stroke="#333" stroke-width="1.5" rx="2"/><line x1="100" y1="70" x2="80" y2="50" stroke="#333" stroke-width="1"/><line x1="300" y1="70" x2="320" y2="50" stroke="#333" stroke-width="1"/><line x1="80" y1="50" x2="320" y2="50" stroke="#333" stroke-width="1"/><rect x="100" y="70" width="200" height="100" fill="#d4edda" opacity="0.5" stroke="#333" stroke-width="1.5" rx="2"/><text x="200" y="135" text-anchor="middle" font-size="11" fill="#555">面·棱·顶点</text>'
    elif st == 'para-cut':
      shapes_html = '<polygon points="100,90 250,90 300,180 150,180" fill="#e8f4f8" stroke="#333" stroke-width="1.5"/><line x1="100" y1="90" x2="100" y2="180" stroke="#e85d75" stroke-dasharray="5,3" stroke-width="1.5"/><polygon points="100,90 250,90 150,180" fill="#d4edda" opacity="0.6" stroke="#333" stroke-width="1.5" stroke-dasharray="4,2"/><text x="200" y="140" text-anchor="middle" font-size="11" fill="#555">剪拼→长方形</text>'
    elif st == 'tri-double':
      shapes_html = '<polygon points="100,80 300,80 200,190" fill="#e8f4f8" stroke="#333" stroke-width="1.5"/><polygon points="100,80 300,80 200,-30" fill="#d4edda" opacity="0.5" stroke="#333" stroke-width="1" stroke-dasharray="4,2"/><text x="200" y="140" text-anchor="middle" font-size="11" fill="#555">底×高÷2</text>'
    elif st == 'trap-double':
      shapes_html = '<polygon points="120,70 280,70 330,190 70,190" fill="#e8f4f8" stroke="#333" stroke-width="1.5"/><line x1="120" y1="70" x2="280" y2="70" stroke="#e85d75" stroke-width="2"/><line x1="70" y1="190" x2="330" y2="190" stroke="#4a90d9" stroke-width="2"/><text x="200" y="45" text-anchor="middle" font-size="10" fill="#e85d75">上底</text><text x="200" y="215" text-anchor="middle" font-size="10" fill="#4a90d9">下底</text>'
    elif st == 'composite':
      shapes_html = '<rect x="100" y="60" width="120" height="100" fill="#cce5ff" stroke="#333" stroke-width="1.5" rx="2"/><polygon points="220,60 320,60 320,160 220,130" fill="#d4edda" stroke="#333" stroke-width="1.5"/><line x1="220" y1="60" x2="220" y2="130" stroke="#e85d75" stroke-dasharray="4,2" stroke-width="1.5"/><text x="210" y="115" text-anchor="middle" font-size="10" fill="#e85d75">分割</text>'
    elif st == 'container':
      shapes_html = '<rect x="120" y="50" width="160" height="130" fill="#e8f4f8" stroke="#333" stroke-width="2" rx="4"/><line x1="140" y1="110" x2="260" y2="110" stroke="#4a90d9" stroke-width="2"/><text x="200" y="105" text-anchor="middle" font-size="11" fill="#4a90d9">1L</text>'
    elif st == 'cuboid-net':
      shapes_html = '<rect x="140" y="20" width="80" height="50" fill="#d4edda" stroke="#333" stroke-width="1"/><rect x="140" y="70" width="80" height="50" fill="#e8f4f8" stroke="#333" stroke-width="1"/><rect x="60" y="70" width="80" height="50" fill="#cce5ff" stroke="#333" stroke-width="1"/><rect x="220" y="70" width="80" height="50" fill="#cce5ff" stroke="#333" stroke-width="1"/><rect x="140" y="120" width="80" height="50" fill="#e8f4f8" stroke="#333" stroke-width="1"/><rect x="140" y="170" width="80" height="50" fill="#d4edda" stroke="#333" stroke-width="1"/><text x="180" y="52" text-anchor="middle" font-size="8" fill="#555">上</text><text x="180" y="95" text-anchor="middle" font-size="8" fill="#555">前/后展开</text>'
    elif st == 'rotate-demo':
      shapes_html = '<rect x="180" y="40" width="60" height="80" fill="#d4edda" stroke="#333" stroke-width="1.5" rx="2"/><circle cx="200" cy="140" r="3" fill="#e85d75"/><text x="205" y="145" font-size="10" fill="#e85d75">中心</text><path d="M210,40 Q280,40 280,100" fill="none" stroke="#e85d75" stroke-dasharray="4,3" stroke-width="1.5"/><polygon points="278,98 280,110 290,100" fill="#e85d75"/><text x="250" y="35" font-size="10" fill="#e85d75">90°</text>'
    return f'''<svg {SVG_ATTRS}>
  <text x="200" y="14" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#555">{name}</text>
  {shapes_html}
  <text x="200" y="225" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''

  if t == 'venn':
    a = p.get('a',[])
    b = p.get('b',[])
    inter = p.get('intersect',[])
    a_only = [str(x) for x in a if x not in inter]
    b_only = [str(x) for x in b if x not in inter]
    inter_s = [str(x) for x in inter]
    return f'''<svg {SVG_ATTRS}>
  <text x="200" y="18" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#555">{name}</text>
  <ellipse cx="160" cy="120" rx="80" ry="70" fill="#cce5ff" opacity="0.6" stroke="#4a90d9" stroke-width="1.5"/>
  <ellipse cx="240" cy="120" rx="80" ry="70" fill="#d4edda" opacity="0.6" stroke="#45c77a" stroke-width="1.5"/>
  <text x="110" y="60" font-size="10" fill="#4a90d9">A</text>
  <text x="280" y="60" font-size="10" fill="#45c77a">B</text>
  <text x="140" y="115" text-anchor="middle" font-size="9" fill="#555">{",".join(a_only[:3])}</text>
  <text x="200" y="115" text-anchor="middle" font-size="9" fill="#e85d75">{",".join(inter_s)}</text>
  <text x="260" y="115" text-anchor="middle" font-size="9" fill="#555">{",".join(b_only[:3])}</text>
  <text x="200" y="225" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''

  if t == 'chart':
    ct = p.get('type','bar')
    if ct == 'bar':
      return f'''<svg {SVG_ATTRS}>
  <text x="200" y="18" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#555">{name}</text>
  <line x1="50" y1="200" x2="350" y2="200" stroke="#333" stroke-width="1.5"/>
  <line x1="50" y1="40" x2="50" y2="200" stroke="#333" stroke-width="1.5"/>
  {''.join(f'<rect x="{60+i*50}" y="{200-v}" width="35" height="{v}" fill="{["#4a90d9","#e85d75","#45c77a","#f0a050","#7b68ee"][i%5]}" rx="2"/>' for i,v in enumerate([120,80,160,100,140,60]))}
  <text x="200" y="225" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''
    elif ct == 'line':
      pts = [(60,160),(160,130),(235,90),(295,120),(350,80)]
      pt_str = ' '.join(f'{x},{y}' for x,y in pts)
      return f'''<svg {SVG_ATTRS}>
  <text x="200" y="18" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#555">{name}</text>
  <line x1="40" y1="200" x2="360" y2="200" stroke="#333" stroke-width="1"/>
  <line x1="40" y1="40" x2="40" y2="200" stroke="#333" stroke-width="1"/>
  <polyline points="{pt_str}" fill="none" stroke="#e85d75" stroke-width="2.5"/>
  {''.join(f'<circle cx="{x}" cy="{y}" r="4" fill="#e85d75"/>' for x,y in pts)}
  <text x="200" y="225" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''
    elif ct == 'dual-line':
      pts1 = [(60,160),(135,130),(210,90),(285,120),(350,100)]
      pts2 = [(60,120),(135,100),(210,140),(285,80),(350,160)]
      s1 = ' '.join(f'{x},{y}' for x,y in pts1)
      s2 = ' '.join(f'{x},{y}' for x,y in pts2)
      return f'''<svg {SVG_ATTRS}>
  <text x="200" y="18" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#555">{name}</text>
  <line x1="40" y1="200" x2="360" y2="200" stroke="#333" stroke-width="1"/>
  <line x1="40" y1="40" x2="40" y2="200" stroke="#333" stroke-width="1"/>
  <polyline points="{s1}" fill="none" stroke="#4a90d9" stroke-width="2.5"/>
  {''.join(f'<circle cx="{x}" cy="{y}" r="3.5" fill="#4a90d9"/>' for x,y in pts1)}
  <polyline points="{s2}" fill="none" stroke="#e85d75" stroke-width="2.5" stroke-dasharray="5,3"/>
  {''.join(f'<circle cx="{x}" cy="{y}" r="3.5" fill="#e85d75"/>' for x,y in pts2)}
  <text x="100" y="215" font-size="9" fill="#4a90d9">甲组</text>
  <text x="150" y="215" font-size="9" fill="#e85d75">乙组</text>
  <text x="200" y="225" text-anchor="middle" font-size="12" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''

  return f'''<svg {SVG_ATTRS}>
  <text x="200" y="120" text-anchor="middle" font-size="16" font-family="sans-serif" fill="#999">{name}</text>
  <text x="200" y="200" text-anchor="middle" font-size="13" font-family="sans-serif" fill="#333" font-weight="bold">{label}</text>
</svg>'''

import math
def sin_deg(d):
  return math.sin(math.radians(d))
def cos_deg(d):
  return math.cos(math.radians(d))

def gen_svg(c):
  svg = make_svg(c)
  # Add gradient defs
  svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
  return svg

# Generate all SVGs
outdir = '/home/gem/workspace/agent/workspace/projects/math-grade5/assets/concepts'
os.makedirs(outdir, exist_ok=True)

for c in CONCEPTS:
  filename = c[0]
  svg = gen_svg(c)
  path = os.path.join(outdir, filename + '.svg')
  with open(path, 'w') as f:
    f.write(svg)
  print(f'  ✅ {filename}.svg — {c[1]}')

print(f'\nGenerated {len(CONCEPTS)} SVG metaphors in {outdir}')
