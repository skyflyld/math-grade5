#!/usr/bin/env python3
"""Generate 11 lesson pages for new Phase A concepts."""
import os, json

PAGES = [
  {
    'concept': '用数对确定位置', 'icon': '📍', 'hash': '用数对确定位置',
    'module_title': '用数对确定位置 — 坐标思想入门',
    'subtitle': '方格纸上，(列,行) 唯一确定一个点——这就是坐标的雏形。',
    'nav_title': '位置与坐标 · 用数对确定位置',
    'title': '用数对确定位置 · 五年级',
    'dir': 'modules/04-place-value', 'file': '4-4-coordinates.html',
    'body': '''
<div class="section">
  <div class="section-header"><span class="emoji">🧱</span>拆到公理 · 定位的逻辑</div>
  <div class="visual-step">
    <span class="step-label">问题</span>
    <h4>怎么告诉别人一个点的准确位置？</h4>
    <p>只说"左边一点"或"右上角"太模糊。我们需要两个数来确定。</p>
  </div>
  <div class="visual-step">
    <span class="step-label">约定</span>
    <h4>列在前，行在后</h4>
    <p>数对 <strong>(3, 2)</strong> 表示第 3 列、第 2 行。先从左到右数列，再从下到上数行。<br>
    这个约定让所有人都用同一种语言描述位置。</p>
  </div>
  <div class="visual-step">
    <span class="step-label">扩展</span>
    <h4>负数也能定位</h4>
    <p>在真正的坐标系中，向左/向下可以走负数。数对 <strong>(−3, 2)</strong> 表示第 −3 列（原点左边 3 格）第 2 行。</p>
    <div class="concept-highlight">
      <div class="big-idea">数对 = 两个方向上的"刻度"读数，<span class="highlight">顺序不可颠倒</span></div>
    </div>
  </div>
  <div class="visual-step">
    <span class="step-label">生活链接</span>
    <h4>地图上的网格</h4>
    <p>电影院座位（A排3座）、棋盘（e4格）、地图上的经纬度——都是用一对数来定位。</p>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">✏️</span>练一练</div>
  <div class="cards">
    <div class="card"><h4>🏛️ 地图</h4><p>公园地图上，熊猫馆在 (4, 2)，大象馆在 (6, 3)。哪个离大门更近？</p><p><em>提示：数对中每个数的绝对值越小越近。</em></p></div>
    <div class="card"><h4>🎯 找规律</h4><p>(1, 1), (2, 2), (3, 3), ___ 下一个数对是什么？</p></div>
    <div class="card"><h4>🔍 反推位置</h4><p>如果 (列, 行) = (3, 5)，那么第几列第几行？交换后 (5, 3) 是同一个位置吗？</p></div>
  </div>
</div>
'''
  },

  {
    'concept': '小数近似数', 'icon': '🎯', 'hash': '小数近似数',
    'module_title': '小数近似数 — 四舍五入取接近值',
    'subtitle': '小数太多位数时，用四舍五入法取一个接近的数代替。',
    'nav_title': '小数运算 · 近似数',
    'title': '小数近似数 · 五年级',
    'dir': 'modules/02-dec-division', 'file': '2-3-approximation.html',
    'body': '''
<div class="section">
  <div class="section-header"><span class="emoji">🧱</span>拆到公理 · 四舍五入</div>
  <div class="visual-step">
    <span class="step-label">核心规则</span>
    <h4>看下一位——"四舍"还是"五入"</h4>
    <p>保留到某一位，看它后面一位：<br>
    <strong>≤ 4：</strong>舍去，保留位不变 <em>（3.1416 保留两位 ≈ 3.14）</em><br>
    <strong>≥ 5：</strong>进位，保留位加 1 <em>（3.1416 保留三位 ≈ 3.142）</em></p>
  </div>
  <div class="visual-step">
    <span class="step-label">数轴理解</span>
    <h4>取离得最近的那个数</h4>
    <p>3.1416 保留两位小数，看 3.14 和 3.15 哪个离它更近。<br>
    因为下一位是 1（< 4），所以离 3.14 更近。这就是四舍五入的本质——<strong>取最近值</strong>。</p>
  </div>
  <div class="visual-step">
    <span class="step-label">精确度</span>
    <h4>保留越多位越精确</h4>
    <p>π ≈ 3.14（精确到 0.01）<br>π ≈ 3.1416（精确到 0.0001）<br>
    保留越多位，误差越小——但有时候不需要那么精确。</p>
    <div class="concept-highlight">
      <div class="big-idea">近似数不是"错的数"，是<span class="highlight">在给定精度下的最佳估计</span></div>
    </div>
  </div>
  <div class="visual-step">
    <span class="step-label">实践</span>
    <h4>什么时候用近似？</h4>
    <p>购物总价 ¥19.98 ≈ ¥20.00。测量身高 1.735m ≈ 1.74m。<br>
    生活中不需要无限精确——近似让我们活得没那么累。</p>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">✏️</span>练一练</div>
  <div class="cards">
    <div class="card"><h4>🎯 四舍五入</h4><p>5.6789 保留两位小数是多少？保留三位呢？</p></div>
    <div class="card"><h4>🧮 逆向思考</h4><p>一个数保留一位小数后是 3.6，它原来可能是几？<br><em>可能范围：3.55 ~ 3.64</em></p></div>
  </div>
</div>
'''
  },

  {
    'concept': '不规则图形面积估算', 'icon': '📐', 'hash': '不规则图形面积估算',
    'module_title': '不规则图形面积估算 — 数方格',
    'subtitle': '没有公式的图形怎么算面积？一格一格数。',
    'nav_title': '多边形面积 · 不规则图形估算',
    'title': '不规则图形面积估算 · 五年级',
    'dir': 'modules/06-polygon-area', 'file': '6-4-irregular.html',
    'body': '''
<div class="section">
  <div class="section-header"><span class="emoji">🧱</span>拆到公理 · 数格法</div>
  <div class="visual-step">
    <span class="step-label">方法</span>
    <h4>满格 + 半格以上 = 差不多</h4>
    <p>把不规则图形放在方格纸上：<br>
    <strong>满格计 1</strong>（完全覆盖整格）<br>
    <strong>半格以上计 1</strong>（超过一半的格子）<br>
    <strong>不满半格不计</strong>（只擦了一点边的格子不算）</p>
  </div>
  <div class="visual-step">
    <span class="step-label">为什么这样算</span>
    <h4>误差互补</h4>
    <p>有的格子多算了（半格以上算 1），有的格子少算了（不满半格算 0），<br>
    这种"有舍有入"的方式让误差互相抵消，结果接近真实面积。</p>
    <div class="concept-highlight">
      <div class="big-idea">没有公式时，<span class="highlight">数方格</span>是最直观的估算方法</div>
    </div>
  </div>
  <div class="visual-step">
    <span class="step-label">方格越小越准</span>
    <h4>精度与付出的天平</h4>
    <p>把方格从 1cm² 细分到 0.25cm² 甚至更小，估算会更精确，但工作量也更大。<br>
    用多大的格子 = 在精度和效率之间做选择。</p>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">✏️</span>练一练</div>
  <div class="cards">
    <div class="card"><h4>🍃 树叶面积</h4><p>一片树叶放在 1cm² 方格纸上，满格 8 个，半格以上 6 个。面积大约多少？<br><em>≈ 14cm²</em></p></div>
    <div class="card"><h4>🧩 不规则多边形</h4><p>手画一个不规则形状，用数格法估算它的面积。这样算的结果是精确值还是近似值？</p></div>
  </div>
</div>
'''
  },

  {
    'concept': '奇数和偶数', 'icon': '🔢', 'hash': '奇数和偶数',
    'module_title': '奇数和偶数 — 看个位就够了',
    'subtitle': '能被 2 整除的是偶数，不能的是奇数。决定权在个位。',
    'nav_title': '因数与倍数 · 奇偶',
    'title': '奇数和偶数 · 五年级',
    'dir': 'modules/09-factors', 'file': '9-6-odd-even.html',
    'body': '''
<div class="section">
  <div class="section-header"><span class="emoji">🧱</span>拆到公理 · 个位决定一切</div>
  <div class="visual-step">
    <span class="step-label">定义</span>
    <h4>看个位，不用算除法</h4>
    <p><strong>偶数：</strong>个位是 0, 2, 4, 6, 8 → 一定能被 2 整除<br>
    <strong>奇数：</strong>个位是 1, 3, 5, 7, 9 → 被 2 除会余 1</p>
  </div>
  <div class="visual-step">
    <span class="step-label">奇偶运算的规律</span>
    <h4>三种组合的结果</h4>
    <p><strong>偶 + 偶 = 偶</strong>（2 + 4 = 6，都能被 2 整除）<br>
    <strong>奇 + 奇 = 偶</strong>（3 + 5 = 8，两个余 1 凑成一个 2）<br>
    <strong>奇 + 偶 = 奇</strong>（3 + 4 = 7，一个余 1 始终余 1）<br>
    奇 × 奇 = 奇，偶 × 任何 = 偶</p>
    <div class="concept-highlight">
      <div class="big-idea">奇偶性 = <span class="highlight">对 2 求余数的结果</span>——不是 0 就是 1</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">✏️</span>练一练</div>
  <div class="cards">
    <div class="card"><h4>🧮 判断题</h4><p>两个奇数相加一定是奇数。对吗？<br><em>错！奇+奇=偶</em></p></div>
    <div class="card"><h4>🔍 猜数</h4><p>我是一个三位数，百位是奇数，十位是偶数，个位既是奇数又是质数。最小可能是几？</p></div>
  </div>
</div>
'''
  },

  {
    'concept': '公因数和最大公因数', 'icon': '🔗', 'hash': '公因数和最大公因数',
    'module_title': '公因数和最大公因数 — 共享的因子',
    'subtitle': '两个数公有的因数中，最大的那个就是最大公因数。',
    'nav_title': '因数与倍数 · 最大公因数',
    'title': '公因数和最大公因数 · 五年级',
    'dir': 'modules/09-factors', 'file': '9-7-gcf.html',
    'body': '''
<div class="section">
  <div class="section-header"><span class="emoji">🧱</span>拆到公理 · 最大公因数</div>
  <div class="visual-step">
    <span class="step-label">定义</span>
    <h4>两个因数集的最大交集</h4>
    <p>12 的因数：{1, 2, 3, 4, 6, 12}<br>
    18 的因数：{1, 2, 3, 6, 9, 18}<br>
    公因数：{1, 2, 3, 6} → 最大的是 <strong>6</strong></p>
  </div>
  <div class="visual-step">
    <span class="step-label">快速求法</span>
    <h4>分解质因数 + 取最小指数</h4>
    <p>12 = 2² × 3<br>18 = 2 × 3²<br>
    公有的质因数：2（取指数 min(2,1)=1）和 3（取指数 min(1,2)=1）<br>GCF = 2¹ × 3¹ = 6</p>
  </div>
  <div class="visual-step">
    <span class="step-label">应用</span>
    <h4>约分</h4>
    <p>12/18 = (12÷6)/(18÷6) = 2/3。<br>
    用最大公因数一次约到最简，不需要一步步试。</p>
    <div class="concept-highlight">
      <div class="big-idea">最大公因数 = <span class="highlight">两个数能同时被整除的最大整数</span></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">✏️</span>练一练</div>
  <div class="cards">
    <div class="card"><h4>🧮 求 GCF</h4><p>24 和 36 的最大公因数是多少？（分解：24=2³×3，36=2²×3²，GCF=12）</p></div>
    <div class="card"><h4>🔗 互质</h4><p>两个数的最大公因数是 1，它们叫什么？<br><em>互质，如 8 和 9</em></p></div>
  </div>
</div>
'''
  },

  {
    'concept': '公倍数和最小公倍数', 'icon': '🔗', 'hash': '公倍数和最小公倍数',
    'module_title': '公倍数和最小公倍数 — 共享的倍数',
    'subtitle': '两个数公有的倍数中，最小的那个就是最小公倍数。',
    'nav_title': '因数与倍数 · 最小公倍数',
    'title': '公倍数和最小公倍数 · 五年级',
    'dir': 'modules/09-factors', 'file': '9-8-lcm.html',
    'body': '''
<div class="section">
  <div class="section-header"><span class="emoji">🧱</span>拆到公理 · 最小公倍数</div>
  <div class="visual-step">
    <span class="step-label">定义</span>
    <h4>两个倍数集的最小交集（不含 0）</h4>
    <p>4 的倍数：4, 8, <strong>12</strong>, 16, 20, <strong>24</strong>…<br>
    6 的倍数：6, <strong>12</strong>, 18, <strong>24</strong>, 30…<br>
    公倍数：12, 24, 36… → 最小的是 <strong>12</strong></p>
  </div>
  <div class="visual-step">
    <span class="step-label">快速求法</span>
    <h4>分解质因数 + 取最大指数</h4>
    <p>4 = 2²<br>6 = 2 × 3<br>
    每个质因数取最大指数：2²（指数 2 > 1）和 3¹ → LCM = 4 × 3 = 12</p>
  </div>
  <div class="visual-step">
    <span class="step-label">进阶方法</span>
    <h4>GCF 捷径</h4>
    <p>LCM(a, b) = a × b ÷ GCF(a, b)<br>
    LCM(4, 6) = 4 × 6 ÷ 2 = 24 ÷ 2 = 12</p>
    <div class="concept-highlight">
      <div class="big-idea">通分的本质就是找到两个分母的<span class="highlight">最小公倍数</span></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">✏️</span>练一练</div>
  <div class="cards">
    <div class="card"><h4>🧮 求 LCM</h4><p>6 和 8 的最小公倍数是多少？<br><em>LCM = 24</em></p></div>
    <div class="card"><h4>🔗 通分练习</h4><p>1/6 + 1/8 先找分母的 LCM，再通分相加。结果是？<br><em>4/24 + 3/24 = 7/24</em></p></div>
  </div>
</div>
'''
  },

  {
    'concept': '长方体正方体表面积', 'icon': '📦', 'hash': '长方体正方体表面积',
    'module_title': '长方体正方体表面积 — 展开图',
    'subtitle': '长方体 6 个面的总面积 = 表面积。展开图一看就懂。',
    'nav_title': '立体几何 · 表面积',
    'title': '长方体正方体表面积 · 五年级',
    'dir': 'modules/07-volume', 'file': '7-5-surface-area.html',
    'body': '''
<div class="section">
  <div class="section-header"><span class="emoji">🧱</span>拆到公理 · 表面积</div>
  <div class="visual-step">
    <span class="step-label">定义</span>
    <h4>展开图 = 全部面的和</h4>
    <p>长方体有 6 个面：<br>
    <strong>上下面</strong>：长 × 宽 × 2<br>
    <strong>前后面</strong>：长 × 高 × 2<br>
    <strong>左右面</strong>：宽 × 高 × 2<br><br>
    公式：<strong>S = 2(lw + lh + wh)</strong></p>
  </div>
  <div class="visual-step">
    <span class="step-label">正方体特例</span>
    <h4>6 个一模一样的面</h4>
    <p>正方体的长 = 宽 = 高 = a<br>
    S = 6 × a²（一个面面积 × 6）</p>
  </div>
  <div class="visual-step">
    <span class="step-label">无盖箱子</span>
    <h4>生活中不是总有 6 个面</h4>
    <p>鱼缸没有上盖 → 只算 5 个面<br>
    排水管没有上下底 → 只算 4 个侧面<br>
    包装盒封住 6 面 → 算全部 6 个面</p>
    <div class="concept-highlight">
      <div class="big-idea">表面积 = 6 个矩形面积之和。<span class="highlight">没有新公式，只有加法</span></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">✏️</span>练一练</div>
  <div class="cards">
    <div class="card"><h4>📦 计算</h4><p>长 5cm、宽 3cm、高 4cm 的长方体，表面积是多少？<br><em>2×(15+20+12) = 94cm²</em></p></div>
    <div class="card"><h4>🔍 无盖计算</h4><p>一个长 8cm 宽 6cm 高 5cm 的无盖玻璃鱼缸，需要多少玻璃？<br><em>8×6 + 2×(8×5 + 6×5) = 48 + 2×70 = 188cm²</em></p></div>
  </div>
</div>
'''
  },

  {
    'concept': '分数与除法的关系', 'icon': '➗', 'hash': '分数与除法的关系',
    'module_title': '分数与除法的关系 — a÷b = a/b',
    'subtitle': '分数线和除号本质上是一回事。分子 ÷ 分母 = 分数值。',
    'nav_title': '分数意义 · 分数与除法',
    'title': '分数与除法的关系 · 五年级',
    'dir': 'modules/14-fraction-meaning', 'file': '14-5-fraction-division.html',
    'body': '''
<div class="section">
  <div class="section-header"><span class="emoji">🧱</span>拆到公理 · 分数即除法</div>
  <div class="visual-step">
    <span class="step-label">核心对应</span>
    <h4>分子 ÷ 分母 = 分数线</h4>
    <p><strong>分数 a/b：</strong>把 1 个整体平均分成 b 份，取 a 份<br>
    <strong>除法 a÷b：</strong>把 a 平均分成 b 份<br>
    写法上：<strong>a/b = a ÷ b</strong>（除数 b ≠ 0）</p>
  </div>
  <div class="visual-step">
    <span class="step-label">实例</span>
    <h4>1 ÷ 4 = 1/4</h4>
    <p>一块饼分成 4 份，每人得 1/4。除法就是分东西。<br>
    3 ÷ 4 = 3/4：3 块饼分给 4 个人，每人得 3/4 块。</p>
  </div>
  <div class="visual-step">
    <span class="step-label">分数 = 除法的另一种写法</span>
    <h4>任何除法都能写成分数，反过来也一样</h4>
    <p>7 ÷ 12 = 7/12，12 不是一个整数除法的答案，但分数精确表达了它。<br>
    这就解决了"整数除法不够除"的问题。</p>
    <div class="concept-highlight">
      <div class="big-idea">分数线 = <span class="highlight">除法运算的另一种书写形式</span>，不是新概念</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">✏️</span>练一练</div>
  <div class="cards">
    <div class="card"><h4>🧮 转换</h4><p>把 5 ÷ 8 写成分数，把 13/25 写成除法算式。</p></div>
    <div class="card"><h4>🔍 填空</h4><p>a ÷ b = ___ / ___ (b ≠ 0)。分数线上面的叫___，下面的叫___。</p></div>
  </div>
</div>
'''
  },

  {
    'concept': '分数加减混合运算', 'icon': '➕', 'hash': '分数加减混合运算',
    'module_title': '分数加减混合运算 — 规则同整数',
    'subtitle': '加减混合运算的顺序和整数一样，先通分再计算。',
    'nav_title': '分数运算 · 加减混合',
    'title': '分数加减混合运算 · 五年级',
    'dir': 'modules/10-fraction-ops', 'file': '10-3-mixed-ops.html',
    'body': '''
<div class="section">
  <div class="section-header"><span class="emoji">🧱</span>拆到公理 · 分数混合运算</div>
  <div class="visual-step">
    <span class="step-label">规则</span>
    <h4>和整数完全一样</h4>
    <p><strong>从左到右：</strong>1/2 + 1/3 − 1/4<br>
    <strong>先乘除后加减：</strong>1/2 + 2/3 × 3/4（不过五年级主要学同级运算）<br>
    <strong>括号优先：</strong>1/2 − (1/3 + 1/6)</p>
  </div>
  <div class="visual-step">
    <span class="step-label">关键技巧</span>
    <h4>可以省略通分步骤吗？</h4>
    <p>不能。每次加减前必须保证分母相同。<br>
    但可以一次通分所有项：<br>
    1/2 + 1/3 − 1/4 = 6/12 + 4/12 − 3/12 = 7/12</p>
  </div>
  <div class="visual-step">
    <span class="step-label">运算律也适用</span>
    <h4>交换律、结合律对分数同样有效</h4>
    <p>2/5 + 3/7 + 3/5 = (2/5 + 3/5) + 3/7 = 1 + 3/7 = 1 3/7<br>
    交换律可以帮你创造"同分母配对"，简化计算。</p>
    <div class="concept-highlight">
      <div class="big-idea">分数的运算法则 = <span class="highlight">整数的运算法则 + 通分</span></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">✏️</span>练一练</div>
  <div class="cards">
    <div class="card"><h4>🧮 计算</h4><p>3/4 + 1/6 − 1/3 = ？<br><em>9/12 + 2/12 − 4/12 = 7/12</em></p></div>
    <div class="card"><h4>🎯 巧算</h4><p>用交换律简化：1/3 + 2/7 + 2/3 = ？<br><em>(1/3 + 2/3) + 2/7 = 1 + 2/7 = 1 2/7</em></p></div>
  </div>
</div>
'''
  },

  {
    'concept': '旋转三要素', 'icon': '🔄', 'hash': '旋转三要素',
    'module_title': '旋转三要素 — 中心·方向·角度',
    'subtitle': '图形绕着中心点顺时针或逆时针转一定角度——这就是旋转。',
    'nav_title': '几何变换 · 旋转',
    'title': '旋转三要素 · 五年级',
    'dir': 'modules/08-geometry-intro', 'file': '8-4-rotation.html',
    'body': '''
<div class="section">
  <div class="section-header"><span class="emoji">🧱</span>拆到公理 · 旋转三要素</div>
  <div class="visual-step">
    <span class="step-label">要素一</span>
    <h4>旋转中心</h4>
    <p>整个图形绕哪个点转？中心点不动，其他点绕它画弧。<br>
    绕不同中心，同一图形会转到不同位置。</p>
  </div>
  <div class="visual-step">
    <span class="step-label">要素二</span>
    <h4>旋转方向</h4>
    <p><strong>顺时针：</strong>和钟表指针一个方向（向右转）<br>
    <strong>逆时针：</strong>和钟表指针相反方向（向左转）</p>
  </div>
  <div class="visual-step">
    <span class="step-label">要素三</span>
    <h4>旋转角度</h4>
    <p>转多少？常见：90°（直角）、180°（半圈）、270°（三圈直角）、360°（一整圈回到原位）<br>
    旋转 90° 后，图形从"横着放"变成"竖着放"。</p>
    <div class="concept-highlight">
      <div class="big-idea">三要素缺一不可：<span class="highlight">绕谁转？往哪转？转多少？</span></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">✏️</span>练一练</div>
  <div class="cards">
    <div class="card"><h4>🧩 方向练习</h4><p>一个箭头朝上，顺时针转 90° 指向哪？逆时针转 90° 呢？<br><em>顺时针→右，逆时针→左</em></p></div>
    <div class="card"><h4>🔍 时钟</h4><p>分针从 3 走到 6，绕中心___转___度。<br><em>顺时针，90°</em></p></div>
  </div>
</div>
'''
  },

  {
    'concept': '复式折线统计图', 'icon': '📊', 'hash': '复式折线统计图',
    'module_title': '复式折线统计图 — 多组数据对比',
    'subtitle': '同一张图上画多条折线，不同组的变化趋势一目了然。',
    'nav_title': '统计 · 复式折线图',
    'title': '复式折线统计图 · 五年级',
    'dir': 'modules/11-statistics', 'file': '11-4-dual-line.html',
    'body': '''
<div class="section">
  <div class="section-header"><span class="emoji">🧱</span>拆到公理 · 多折线对比</div>
  <div class="visual-step">
    <span class="step-label">结构</span>
    <h4>一条折线 = 一组数据</h4>
    <p>单式折线图只有一条线，只能看到一个量的变化。<br>
    复式折线图有<strong>两条或以上</strong>的线，不同组用不同颜色/线型区分。<br>
    需要图例（legend）告诉读者哪条线代表什么。</p>
  </div>
  <div class="visual-step">
    <span class="step-label">核心优势</span>
    <h4>并排看，看出差异</h4>
    <p>一条折线上升、另一条下降 → 一组增长、另一组缩减<br>
    两条都在上升但斜率不同 → 增速不同<br>
    两条交叉 → 某时刻两组数值相等</p>
  </div>
  <div class="visual-step">
    <span class="step-label">生活应用</span>
    <h4>比比看就知道</h4>
    <p>今年降水 vs 去年降水、本班成绩 vs 年级平均、两种药品疗效对比——<br>
    放在一张图上比较，远比两张独立图直观。</p>
    <div class="concept-highlight">
      <div class="big-idea">复式折线图 = <span class="highlight">把对比对象放在同一个坐标系里</span></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">✏️</span>练一练</div>
  <div class="cards">
    <div class="card"><h4>📊 解读</h4><p>一条实线（A队）持续上升，一条虚线（B队）先升后降。哪个队更有潜力？</p></div>
    <div class="card"><h4>🎯 设计</h4><p>要比较两个城市同月降雨量，用什么统计图？需要哪些元素？<br><em>复式折线图。需要：标题、图例、横轴（月份）、纵轴（雨量）、两条折线</em></p></div>
  </div>
</div>
'''
  },
]

# Gate questions for each concept
GATES = {
  '用数对确定位置': [{'q':'数对 (3, 2) 中的 3 表示什么？','o':['第 3 行','第 3 列','第 3 格','3 个点'],'a':1}],
  '小数近似数': [{'q':'3.1416 保留两位小数是？','o':['3.14','3.15','3.141','3.1'],'a':0}],
  '不规则图形面积估算': [{'q':'数格法估算面积时，超过一半的方格怎么处理？','o':['不计','计 1','计 0.5','计 2'],'a':1}],
  '奇数和偶数': [{'q':'下面哪个数的个位说明它是奇数？','o':['8','2','0','7'],'a':3}],
  '公因数和最大公因数': [{'q':'12 和 18 的最大公因数是？','o':['3','12','6','36'],'a':2}],
  '公倍数和最小公倍数': [{'q':'4 和 6 的最小公倍数是？','o':['12','24','48','2'],'a':0}],
  '长方体正方体表面积': [{'q':'长方体有几个面？','o':['4 个','8 个','6 个','12 个'],'a':2}],
  '分数与除法的关系': [{'q':'分数 a/b 和除法 a÷b，哪个说法正确？','o':['a/b = a÷b','a÷b > a/b','a/b < a÷b','没有关系'],'a':0}],
  '分数加减混合运算': [{'q':'分数加减混合运算的第一步是？','o':['直接加减','通分','去括号','乘分母'],'a':1}],
  '旋转三要素': [{'q':'旋转三要素包括中心、方向和？','o':['速度','距离','角度','半径'],'a':2}],
  '复式折线统计图': [{'q':'复式折线图和单式的最大区别是？','o':['颜色不同','多条折线','横轴更多','图更小'],'a':1}],
}

# Adversarial challenges
CHALLENGES = {
  '用数对确定位置': [
    {'statement':'数对 (2, 3) 和 (3, 2) 表示同一个位置。','correct':False, 'reason':'数对中列和行的顺序是固定的。(2,3)是第2列第3行，(3,2)是第3列第2行，不是同一个位置。'},
    {'statement':'数对 (a, b) 中 a 和 b 都是正整数就够了。','correct':False, 'reason':'坐标可以是任何实数。如商场在 3 楼半，位置可以写成 (3.5, 2)。'},
  ],
  '小数近似数': [
    {'statement':'4.999 保留一位小数是 4.9。','correct':False, 'reason':'看下一位是 9 (≥5)，要进位。5.0 更接近 4.999 而不是 4.9。'},
    {'statement':'近似数一定比原数小。','correct':False, 'reason':'五入的情况近似数反而变大。3.8≈4，近似数比原数大。'},
  ],
  '不规则图形面积估算': [
    {'statement':'数格法估算的面积一定是精确值。','correct':False, 'reason':'数格法是估算，不是精确测量。格子越细越准，但永远有误差。'},
    {'statement':'大于半格的格子计为 1 格，所以最终结果肯定比实际大。','correct':False, 'reason':'不满半格不计，两种误差互相抵消，结果可能偏大也可能偏小。'},
  ],
  '奇数和偶数': [
    {'statement':'0 既不是奇数也不是偶数。','correct':False, 'reason':'0 ÷ 2 = 0 余 0，能被 2 整除，所以 0 是偶数。'},
    {'statement':'奇数相加的结果是奇数。','correct':False, 'reason':'两个奇数相加总是偶数(3+5=8)。因为两个余数 1 合起来变成了 2。'},
  ],
  '公因数和最大公因数': [
    {'statement':'1 是所有整数的公因数。','correct':True, 'reason':'1 确实能整除任何整数，所以是公因数。这道是对的。'},
    {'statement':'两个数的最大公因数一定比这两个数都小。','correct':False, 'reason':'如果两个数相等，如 6 和 6，最大公因数是 6，和原数相等。'},
  ],
  '公倍数和最小公倍数': [
    {'statement':'两个数的乘积就是它们的最小公倍数。','correct':False, 'reason':'4×6=24，但 LCM(4,6)=12，不是 24。这是互质数才成立的特例。'},
    {'statement':'两个数的公倍数有无限多个。','correct':True, 'reason':'倍数集是无限的，所以公倍数集也是无限的。这道是对的。'},
  ],
  '长方体正方体表面积': [
    {'statement':'正方体的表面积是 6a²，所以棱长 2cm 的正方体表面积 = 24cm²。','correct':True, 'reason':'6×2²=6×4=24cm²。这道是对的。'},
    {'statement':'长方体的表面积公式和正方体一样。','correct':False, 'reason':'正方体 6 个面一样大，公式 6a²。长方体 3 组对面面积不同，公式 2(lw+lh+wh)。'},
  ],
  '分数与除法的关系': [
    {'statement':'a÷b = a/b，所以 5÷0 = 5/0。','correct':False, 'reason':'除数不能为 0，所以 b≠0。5÷0 和 5/0 都没有意义。'},
    {'statement':'分数就是除法，所以 a/b 永远能被算成整数。','correct':False, 'reason':'1÷3=1/3≈0.333，写不成整数。分数精确表达了"除不尽"的结果。'},
  ],
  '分数加减混合运算': [
    {'statement':'分数混合运算的顺序和整数不同。','correct':False, 'reason':'顺序完全相同：从左到右，括号优先，先乘除后加减。'},
    {'statement':'2/5 + 1/3 − 2/5 = 1/3。','correct':True, 'reason':'利用交换律 2/5−2/5+1/3=0+1/3=1/3。这道是对的。'},
  ],
  '旋转三要素': [
    {'statement':'图形旋转后大小不变。','correct':True, 'reason':'旋转是刚体变换，图形大小形状都不变，只有位置和方向变。这道是对的。'},
    {'statement':'图形绕不同中心旋转 90°，结果一样。','correct':False, 'reason':'绕不同点旋转，图形最终落在不同位置。中心决定"转完之后在哪"。'},
  ],
  '复式折线统计图': [
    {'statement':'复式折线图可以不用图例。','correct':False, 'reason':'多条线不用图例区分，读者无法知道每条线代表什么。图例是必需的。'},
    {'statement':'复式折线图只能画两条线。','correct':False, 'reason':'可以画任意多条折线，只要用不同颜色/线型区分即可。但太多会影响可读性。'},
  ],
}

# Feynman fills
FEYNMAN = {
  '用数对确定位置': ('数对由___个数字组成，第一个表示___，第二个表示___。数对(3, 2)表示第___列第___行。数对中的顺序___（可以/不可以）互换。', ['两','列','行','3','2','不可以']),
  '小数近似数': ('把一个数保留几位小数时，看它的下___位。如果下一位___5就进一，___5就舍去。这种做法叫___。', ['一','≥','<','四舍五入']),
  '不规则图形面积估算': ('估算不规则图形面积时，放在___纸上数格子。满格计___，半格以上计___，不满半格___。', ['方格','1','1','不计']),
  '奇数和偶数': ('能被___整除的数是偶数，个位是0,2,4,6,___。不能被2整除的是___数。两个奇数相加得___数。', ['2','8','奇','偶']),
  '公因数和最大公因数': ('12的因数是{1,2,3,4,6,12}，18的因数是{1,2,3,6,9,18}，它们的公因数是___，最大公因数是___。', ['{1,2,3,6}','6']),
  '公倍数和最小公倍数': ('4的倍数有4,8,12,16,20,24…，6的倍数有6,12,18,24…，公倍数有___，最小公倍数是___。', ['12,24…','12']),
  '长方体正方体表面积': ('长方体有___个面。表面积公式S = 2(___+___+___)。对正方体，S = ___a²。', ['6','lw','lh','wh','6']),
  '分数与除法的关系': ('a ÷ b = ___/___（b ≠ 0）。分数线上面的叫___，下面的叫___。分数就是除法的另一种___。', ['a','b','分子','分母','写法']),
  '分数加减混合运算': ('分数加减混合运算的顺序和___运算相同。每次计算前先___。可以用___律、___律简化计算。', ['整数','通分','交换','结合']),
  '旋转三要素': ('旋转的三个要素是：①旋转___，②旋转___，③旋转___。图形旋转后大小___（变/不变）。', ['中心','方向','角度','不变']),
  '复式折线统计图': ('复式折线图有___条或以上折线。不同组用不同___或___区分。必须要有___告诉读者每条线代表什么。', ['两','颜色','线型','图例']),
}

# Generate all pages
for p in PAGES:
  concept = p['concept']
  gate_qs = json.dumps(GATES.get(concept, []), ensure_ascii=False)
  challenges = json.dumps(CHALLENGES.get(concept, []), ensure_ascii=False)
  feynman_template = FEYNMAN[concept][0]
  feynman_answer = json.dumps(FEYNMAN[concept][1], ensure_ascii=False)

  body = p['body'].strip()

  # Ensure dir exists
  os.makedirs(p['dir'], exist_ok=True)

  html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{p['title']}</title>
<link rel="stylesheet" href="../../shared/layout.css">
<style>
.visual-step{{background:linear-gradient(145deg,#f8fafc,#fff);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin:16px 0;}}
.visual-step h4{{font-size:17px;margin-bottom:12px;}}
.visual-step .step-label{{display:inline-block;padding:2px 10px;border-radius:6px;font-size:11px;font-weight:700;background:var(--accent-light);color:var(--accent-deep);margin-bottom:10px;}}
.concept-highlight{{background:linear-gradient(145deg,#fefce8,#fff);border:2px solid #fde68a;border-radius:var(--radius);padding:20px 24px;margin:16px 0;text-align:center;}}
.concept-highlight .big-idea{{font-size:22px;font-weight:800;color:#92400e;line-height:1.6;}}
.concept-highlight .big-idea .highlight{{color:var(--accent-deep);background:var(--accent-light);padding:2px 8px;border-radius:4px;}}
.cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:12px 0;}}
.card{{background:#f8fafc;border:1px solid var(--border);border-radius:var(--radius-md);padding:16px;}}
.card h4{{font-size:14px;margin-bottom:6px;}}
</style>
</head>
<body data-concept="{concept}">
<div class="top-nav"><a href="../../index.html#{p['hash']}">🏠</a><span class="breadcrumb-sep">›</span><span>{p['nav_title']}</span></div>
<h1 class="module-title">{p['icon']} {p['module_title']}</h1>
<p class="module-subtitle">{p['subtitle']}</p>

<div class="section"><div class="section-header"><span class="emoji">🔑</span>预热</div><div id="gate-root"></div></div>

{body}

<div class="section">
  <div class="section-header"><span class="emoji">⚡</span>对抗验证</div>
  <div id="adversary-root"></div>
  <div id="feynman-root"></div>
</div>

<div class="section">
  <div class="section-header"><span class="emoji">📖</span>复习</div>
  <div id="summary-root"></div>
</div>

<script src="../../shared/components.js"></script>
<script src="../../shared/concepts.js"></script>
<script>
(function(){{
  // Gate
  var gate = createGate({{
    containerId:'gate-root',
    questions:{gate_qs}
  }});

  // Summary
  createCourseSummary({{containerId:'summary-root',lesson:'{concept}',concepts:['{concept}']}});

  // Adversarial
  createAdversarialChallenge({{
    containerId:'adversary-root',
    challenges:{challenges}
  }});

  // Feynman
  createFeynmanFill({{
    containerId:'feynman-root',
    template:'{feynman_template}',
    answer:{feynman_answer}
  }});

  // Completion
  setupCompletionButton('summary-root');
}})();
</script>
</body>
</html>'''

  filepath = os.path.join(p['dir'], p['file'])
  with open(filepath, 'w') as f:
    f.write(html)
  print(f"✓ Generated {filepath}")

print(f"\nDone! {len(PAGES)} lesson pages generated.")
