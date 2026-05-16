# Sprint 4：旧课件升级 — Codex 任务摘要

> 状态实时追踪：**读取仓库根目录 `PROGRESS.md`**（Ariste ↔ Codex 双向同步）  
> 前置：Sprint 3 已封版，52 课全部通过 audit.js (1321/0)

## 目标

21 个旧课件目前只有结构骨架（预热+对抗+费曼+练习），缺少 Canvas/共享可视化组件。按概念路径优先级分 3 批升级，每批新增共享组件驱动力。

## 分工

| 角色 | 职责 |
|------|------|
| **Codex** | 构建共享组件 → 按批次升级课件 |
| **Ariste** | 准备 reference 文档、逐批审查、部署验证、全域审计 |
| **Sky** | 审批计划、教材素材、抽查验收、数学准确性终审 |

## 顺序

### Phase 0：构建 6 个共享组件

一次性交付。全部加入 `shared/components.js`。

| 组件 | 用途 | 核心交互 |
|------|------|----------|
| `createNumberLine` | 数轴可视化 | 可选刻度（整数/小数/分数），拖拽标记，跳跃动画 |
| `createCuboid3D` | 长方体 3D 视图 | 旋转、单位立方体堆叠模式 |
| `createNetUnfold` | 展开图动画 | 6 面展开/折叠过渡 |
| `createSymmetryBoard` | 对称与旋转 | 镜像轴拖拽、旋转角度滑动 |
| `createBalanceScale` | 天平模型 | 两端放物、平衡判断 |
| `createProbabilitySim` | 概率模拟器 | 转盘/骰子、多次试验统计 |

### Batch 1：基础概念（P0，6 课）

> 共用 `createNumberLine`。这些是后续所有概念的认知地基。

| 课件 | 文件 | 数轴用法 |
|------|------|----------|
| 整数加减法 | `modules/03-integer-ops/3-1-add-sub.html` | 数轴跳跃动画 |
| 整数四则运算 | `modules/03-integer-ops/3-2-four-operations.html` | 运算顺序阶梯 |
| 小数的意义 | `modules/04-place-value/4-2-dec-meaning.html` | 位值伸缩尺 |
| 单位换算 | `modules/04-place-value/4-3-unit-conversion.html` | 单位转换梯 |
| 分数小数互化 | `modules/10-fraction-ops/10-2-fraction-decimal.html` | 双标尺对照 |
| 真分数假分数 | `modules/14-fraction-meaning/14-4-proper-improper.html` | 分数数轴分类 |

### Batch 2：几何空间（P1，7 课）

> 共用 `createCuboid3D`、`createNetUnfold`、`createSymmetryBoard`。

| 课件 | 文件 | 组件 |
|------|------|------|
| 长方体认识 | `modules/07-volume/7-2-cuboid.html` | `createCuboid3D` |
| 体积公式 | `modules/07-volume/7-3-volume-formula.html` | `createCuboid3D`（堆叠模式） |
| 表面积 | `modules/07-volume/7-5-surface-area.html` | `createNetUnfold` |
| 图形认知 | `modules/08-geometry-intro/8-1-shape-cognition.html` | `createSymmetryBoard` |
| 观察物体 | `modules/08-geometry-intro/8-2-observe-objects.html` | `createSymmetryBoard`（三视图） |
| 对称 | `modules/08-geometry-intro/8-3-symmetry.html` | `createSymmetryBoard`（镜像） |
| 旋转 | `modules/08-geometry-intro/8-4-rotation.html` | `createSymmetryBoard`（旋转盘） |

### Batch 3：数论 + 统计应用（P2，8 课）

> 共用 `createBalanceScale`、`createProbabilitySim`，复用已有 `createLineChartInteract`，课内 Canvas。

| 课件 | 文件 | 组件 |
|------|------|------|
| 因数倍数 | `modules/09-factors/9-1-factors-multiples.html` | `createFactorTree`（课内） |
| 质数合数 | `modules/09-factors/9-2-prime-composite.html` | `createSieve`（课内筛法） |
| 整除特征 | `modules/09-factors/9-5-divisibility.html` | `createSieve`（规则检查） |
| 等式的性质 | `modules/05-equations/5-2-equality-properties.html` | `createBalanceScale` |
| 找次品 | `modules/12-applications/12-2-find-faulty.html` | `createBalanceScale`（称量模式） |
| 数据收集 | `modules/11-statistics/11-1-data-collection.html` | `createLineChartInteract`（已有） |
| 可能性 | `modules/11-statistics/11-3-probability.html` | `createProbabilitySim` |
| 植树问题 | `modules/12-applications/12-1-tree-planting.html` | 课内 Canvas 间隔模型 |

## 约束

1. **不做越界修改**：只改目标课件文件，不动 `index.html`、`shared/concepts.js`、`shared/layout.css` 等基础设施（除非批内明确要求）
2. **保留现有结构**：预热（createGate）、对抗（createAdversarialChallenge）、费曼（createFeynmanFill）、练习（createExerciseSet）四段必须保留，在现有的 `🧱拆到公理` 和 `📐教材原文` 之间插入 `🎮交互实验室` 区域
3. **组件统一注册**：新组件加入 `shared/components.js`，使用 `function createXxx(opts)` 签名，返回 `{render, destroy}` 或可操作方法
4. **CSS 复用 shared/layout.css**：组件内联样式优先用 CSS 变量（`var(--radius)` 等）
5. **每批交付后审计**：`node scripts/audit.js` 必须 PASS

## 参考文件

Ariste 将在每批执行前提供 reference 文档，路径：`reference/sprint-4/`。每课含：
- 公理（第一性原理拆解）
- 常见误区（含根因和自检链）
- 4 道对抗挑战题
- 4 道费曼输出填空题
- 3 组分层练习（直接应用 / 变式迁移 / 综合应用）

## Ariste ↔ Codex 通信协议

由于双方无法直接消息，所有通信通过 GitHub 仓库完成：

| 文件 | 谁写 | 谁读 | 用途 |
|------|------|------|------|
| `PROGRESS.md` | 双方 | 双方 | 当前阶段状态、阶段流转、审查记录 |
| `reference/sprint-4/CODEX-TASK.md` | Ariste | Codex | 任务规范 |
| `reference/sprint-4/batch-X/*.md` | Ariste | Codex | 每课教学内容 |
| `review/SPRINT-4-*-REVIEW.md` | Ariste | Codex | 审查结论和修改意见 |
| Git 提交记录 | Codex | Ariste | 交付物和变更追踪 |

**Codex 工作流**：
1. `git pull` → 读 `PROGRESS.md` 确认当前阶段
2. 按 `CODEX-TASK.md` 施工
3. 完成后 `git commit` + `git push`
4. 更新 `PROGRESS.md` 状态字段
5. 等待 Ariste 审查 → 审查结果写入 `review/` → 读反馈 → 按需修正
