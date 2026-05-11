# 五年级数学交互式课件

这是一个纯静态网页课件项目，面向小学五年级数学概念理解。项目当前采用 HTML、CSS、原生 JavaScript 实现，不依赖构建工具，适合直接部署到 GitHub Pages、Netlify 或任意静态站点服务。

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
- `createExerciseSet`：分层练习
- `createFeynmanFill`：费曼填空
- `saveProgress` / `getProgress`：本地学习进度

## 后续优先级

1. 补齐五上：位置、小数除法、可能性、简易方程、植树问题。
2. 补齐五下：观察物体、因数与倍数、长方体和正方体。
3. 把高频交互抽象为组件，例如数轴、面积模型、分数条、天平、三维长方体。
4. 增加教师模式：展示教学目标、关键追问、常见误区和课堂节奏。
