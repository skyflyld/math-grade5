# Sprint 3 — 7 课深度重构 + 4 共享组件

## 背景

51 个概念全有 HTML 页面，但其中 7 课是自动生成的骨架（零 Canvas 交互、对抗/费曼仅 2 道、缺深度解释）。本次 Sprint 将这些骨架升级到 T1 深度课件标准。

## 当前状态

所有文件在 `modules/` 下已存在，直接在各文件上扩展内容：
- `modules/09-factors/9-4-common-denominator.html` (通分, 9.3KB)
- `modules/09-factors/9-3-reduction.html` (约分, 8.3KB)
- `modules/10-fraction-ops/10-1-fraction-add-sub.html` (分数加减法, 10.2KB)
- `modules/02-dec-division/2-2-recurring-decimals.html` (循环小数, 8.8KB)
- `modules/06-polygon-area/6-5-comb-area.html` (组合图形面积, **新建**)
- `modules/07-volume/7-4-capacity.html` (容积, 5.9KB)
- `modules/11-statistics/11-2-line-chart.html` (折线统计图, 5.8KB)

## 执行顺序

### 第一步：建 4 个共享交互组件（`shared/components.js`）

| 组件 | 功能 | Canvas API |
|---|---|---|
| `fractionBar(container, options)` | 分数条缩放/拼接/比较动画 | Canvas 2D |
| `longDivision(container, {dividend, divisor})` | 竖式除法逐行动画+循环节高亮 | Canvas 2D |
| `lineChartInteract(container, {data, xLabel, yLabel})` | 数据点拖拽+实时折线重绘 | Canvas 2D |
| `polygonCut(container, {vertices, cutMode})` | 拖拽切割线+分区着色+面积计算 | Canvas 2D |

每个组件写好后在 `test/<component-name>.html` 创建独立 demo 页验证。

### 第二步：逐课升级（每 2 课 commit 一次）

每课目标标准：
- 8 节全流程：前置检查→拆到公理→交互实验室→教材溯源→典例精讲→踩坑预警→费曼输出→分层练习
- 至少 1 个 Canvas 交互（用对应的共享组件）
- 4 道对抗挑战（createAdversarialChallenge）
- 4 道费曼填空（createFeynmanFill）
- 3 组分层练习（createExerciseSet）
- 大小目标 14-16KB

**批次 1**：通分 + 约分（使用 fractionBar）
**批次 2**：分数加减法（使用 fractionBar）+ 循环小数（使用 longDivision）
**批次 3**：组合图形面积（新建，使用 polygonCut）+ 容积（Canvas 注水动画）+ 折线统计图（使用 lineChartInteract）

### 第三步：更新 concepts.js

组合图形面积新增 lesson 入口，指向 `modules/06-polygon-area/6-5-comb-area.html`。

## 教学参考

每课的详细教学要点在 `reference/sprint-3/` 下：
- `01-通分.md` — 通分的公理、误区、对抗题、费曼题、练习
- `02-约分.md` — 同上
- `03-分数加减法.md`
- `04-循环小数.md`
- `05-组合图形面积.md`
- `06-容积.md`
- `07-折线统计图.md`

**强制规则**：生成每课内容前必须先读对应的 reference 文件。数学内容必须与 reference 一致。

## 约束

- 保持零外部依赖（无 npm、无构建工具）
- 所有交互用原生 Canvas 2D API
- 保持现有 8 节模板结构（section/section-header）
- 保持 shared/concept-sync.js 的概念卡同步
- 移动端适配：Canvas 绑定 touch 事件 + viewport 响应式
- 不要改 index.html（图谱页）
- 不要改 shared/concepts.js 里已有的 lesson 映射（只新增组合图形面积）
