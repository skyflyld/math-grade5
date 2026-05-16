# Sprint 3 第五步全域审计报告

审计时间：2026-05-16  
审计基线：`8cc59e1 feat: 完成 Sprint 3 最后一批课件`  
审计范围：首页图谱、`shared/` 组件与概念同步、`modules/` 下 52 个 HTML、Sprint 3 七个目标课件、组件 demo。

## 结论

硬性发布项通过。当前仓库没有发现阻断发布的问题：

- `scripts/audit.js`：`PASS 1321 / FAIL 0`
- 51 个概念课件入口全部存在，缺失链接为 0
- 49 个深度课件均具备：`data-concept`、`concept-sync.js`、`components.js`、`createGate`、`createAdversarialChallenge`、`createFeynmanFill`、`createExerciseSet`
- 首页 + 52 个模块页面浏览器批量加载通过，页面级 JS error 为 0，桌面横向溢出为 0
- 所有内联脚本语法检查通过
- Sprint 3 七个目标课件全部达到本 Sprint 标准

## Sprint 3 七课验收

| 课件 | 大小 | 视觉交互 | 对抗题 | 费曼 | 练习组 | 练习题 |
|---|---:|---|---:|---:|---:|---:|
| `09-factors/9-4-common-denominator.html` | 15.6KB | `createFractionBar` | 4 | 1 | 3 | 9 |
| `09-factors/9-3-reduction.html` | 14.5KB | `createFractionBar` | 4 | 1 | 3 | 9 |
| `10-fraction-ops/10-1-fraction-add-sub.html` | 16.1KB | `createFractionBar` | 4 | 1 | 3 | 9 |
| `02-dec-division/2-2-recurring-decimals.html` | 14.9KB | `createLongDivision` | 4 | 1 | 3 | 9 |
| `06-polygon-area/6-5-comb-area.html` | 15.0KB | `createPolygonCut` | 4 | 1 | 3 | 9 |
| `07-volume/7-4-capacity.html` | 18.4KB | 课内 Canvas 注水动画 | 4 | 1 | 3 | 9 |
| `11-statistics/11-2-line-chart.html` | 17.0KB | `createLineChartInteract` | 4 | 1 | 3 | 9 |

## 链接与入口

- `shared/concepts.js` 中 `lessonByConcept` 共 51 条，全部指向存在的文件。
- 首页兜底 `COURSEWARE_LINKS` 中 `组合图形面积` 已同步指向 `modules/06-polygon-area/6-5-comb-area.html`。
- 本地静态链接扫描未发现真实缺失文件。`index.html` 中模板字符串 `${lesson.href}`、`${svgSrc}`、`${visual.image}` 属运行时动态插值，不计为坏链。

## 运行时检查

浏览器批量打开：

- `index.html`
- `modules/` 下 52 个 HTML

结果：

- 页面加载失败：0
- 页面级 JavaScript error：0
- 桌面视口横向溢出：0
- Sprint 3 新增三页的按钮/拖拽交互已在第四批交付时逐项验证

## 全域质量债

如果把 Sprint 3 的新标准强制套到全部旧课件，仍有明显质量债。这不是本次发布阻断项，但应进入下一轮排期。

### 旧课件视觉交互缺口

21 个旧课件没有 Canvas 或共享可视化组件调用：

- `03-integer-ops/3-1-add-sub.html`
- `03-integer-ops/3-2-four-operations.html`
- `04-place-value/4-2-dec-meaning.html`
- `04-place-value/4-3-unit-conversion.html`
- `05-equations/5-2-equality-properties.html`
- `07-volume/7-2-cuboid.html`
- `07-volume/7-3-volume-formula.html`
- `07-volume/7-5-surface-area.html`
- `08-geometry-intro/8-1-shape-cognition.html`
- `08-geometry-intro/8-2-observe-objects.html`
- `08-geometry-intro/8-3-symmetry.html`
- `08-geometry-intro/8-4-rotation.html`
- `09-factors/9-1-factors-multiples.html`
- `09-factors/9-2-prime-composite.html`
- `09-factors/9-5-divisibility.html`
- `10-fraction-ops/10-2-fraction-decimal.html`
- `11-statistics/11-1-data-collection.html`
- `11-statistics/11-3-probability.html`
- `12-applications/12-1-tree-planting.html`
- `12-applications/12-2-find-faulty.html`
- `14-fraction-meaning/14-4-proper-improper.html`

### 旧课件内容密度缺口

部分旧课件仍低于 Sprint 3 的“4 道对抗 + 3 组练习 + 约 9 个练习点”标准。当前硬审计只要求结构完整；下一轮若要把标准扩展到全域，需要分批升级旧课件，而不是在审计中一次性强修。

建议优先级：

1. `整数加减法`、`整数四则运算`、`小数的意义`、`单位换算`：它们是后续路径的基础概念，适合先补数轴/位值/单位阶梯交互。
2. `等式的性质`、`长方体体积`、`长方体正方体表面积`：适合复用天平、立方体堆叠、展开图交互。
3. `数据收集`、`可能性`、`植树问题`、`找次品`：适合补真实情境模拟和决策树。

## 本轮不修复项

本轮审计未直接修改旧课件质量债，原因：

- 它们不是 Sprint 3 七课交付范围；
- 旧课件质量债数量较多，强行统一修复会扩大回归风险；
- 当前发布硬指标已通过，下一步应按概念路径优先级分批升级。

