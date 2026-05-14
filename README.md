# 五年级数学知识图谱 + 深度课件

这是一个纯静态网页课件项目，面向小学五年级数学概念理解。项目当前采用 HTML、CSS、D3 和原生 JavaScript 实现，不依赖构建工具，适合直接部署到 GitHub Pages、Netlify 或任意静态站点服务。

当前产品结构是：

- 首页：知识图谱浏览器，呈现 40 个概念、57 条关系，支持拖拽、缩放、筛选、节点聚焦和 visual metaphor。
- 子页：深度交互课件，从概念图节点进入，不再把模块列表作为首页。
- 互链：`index.html#概念名` 可直接聚焦节点；课件页顶部导航返回对应概念 hash。
- 共享概念层：`shared/concepts.js` 维护 icon、视觉隐喻、图像资产和课件入口；课件页通过 `shared/concept-sync.js` 自动同步顶部概念卡。
- 排期透明：暂无深度课件的节点会显示连接度排名和误区风险排名，说明后续补齐顺序。

## 教学设计原则

每节课遵循同一条学习路径：

1. 前置检查：确认学生具备进入本课的必要旧知。
2. 拆到公理：把公式拆回最基本的定义、不变量和合法操作。
3. 交互实验：通过拖动、切分、拼合、缩放、数形对应等方式让学生亲眼看到概念。
4. 费曼输出：要求学生用自己的话解释概念来源，而不是复述公式。
5. 分层练习：从直接应用到迁移应用，检测是否真正理解。

## 当前内容

已完成的单元：

- 五上第一单元：小数乘法
  - 小数 × 整数
  - 小数 × 小数
- 五上第六单元：多边形面积
  - 平行四边形面积
  - 三角形面积
  - 梯形面积
- 五下第四单元：分数的意义和性质
  - 分数的意义
  - 分数与除法
  - 分数的基本性质

首页已有深度课件入口的概念包括（18个）：

- **五上**：小数乘法、整数乘法、位置值、小数除法、简易方程
- **五下**：分数基础、分数的意义、分数的基本性质、整数除法
- **图形**：矩形面积、平行四边形面积、三角形面积、梯形面积、组合图形面积
- **空间**：长方体和正方体、体积和体积单位
- **数论**：因数和倍数、质数与合数

## 课件扩展模板

新增课时建议保持以下结构：

```html
<div class="section"><div class="section-header">前置检查</div></div>
<div class="section"><div class="section-header">拆到公理</div></div>
<div class="section"><div class="section-header">交互实验室</div></div>
<div class="section"><div class="section-header">教材溯源</div></div>
<div class="section"><div class="section-header">典例精讲</div></div>
<div class="section"><div class="section-header">踩坑预警</div></div>
<div class="section"><div class="section-header">费曼输出</div></div>
<div class="section"><div class="section-header">分层练习</div></div>
```

优先复用 `shared/components.js` 中的组件：

- `createGate`：前置检查
- `createAdversarialChallenge`：对抗挑战，用“同意/反驳”训练学生找条件、举反例、识别误区
- `createExerciseSet`：分层练习
- `createFeynmanFill`：费曼填空
- `saveProgress` / `getProgress`：本地学习进度

## 后续优先级

已完成（第三轮）：
- ✅ 图片全部转 WebP（6.7MB → 304KB，-95%）
- ✅ 4 个高频组件：数轴、面积模型、分数条、天平
- ✅ 新 7 课时：位置值、小数除法、简易方程、体积单位、长方体、因数倍数、质数合数
- ✅ P0：首页默认分层学习路径，点击节点进入概念探索，全图探索作为高级模式
- ✅ P1：全课件共享升级，自动补齐概念 hero、学习流程、可视化操作台、课后总结、下一课推荐、完成标记、4 条对抗挑战和至少 3 题练习
- ✅ P2：错题本自动收集、首页薄弱点/错题优先推荐、图谱文案和移动端遮挡修复

仍待补齐：
1. 核心链路（约7个课时）：循环小数、长方体体积、容积、约分通分、分数加减法、组合图形面积、折线统计图
2. 高频交互组件迭代：分数比较条（动画切换）、更细的统计图交互、应用题策略树
3. 继续扩展 visual metaphor 图像资产
