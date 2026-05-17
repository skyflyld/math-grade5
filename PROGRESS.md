# Sprint 进度追踪

> 本文件由 Ariste 和 Codex 共同维护。每次阶段变更必须更新此文件并 commit。
> Ariste 读取此文件判断 Codex 当前所在阶段；Codex 读取此文件获取下一步任务和审查反馈。

## 当前状态

| 字段 | 值 |
|------|-----|
| Sprint | 4 |
| 阶段 | Sprint 4 — 协作文档已归档 |
| 状态 | 🔒 关闭 — 协作机制结束。Signal ACK `ack-archive` 已发，Cron 已停 |
| 认领人 | Codex |
| 认领时间 | 2026-05-17 01:16 HKT |
| 开始施工 | 2026-05-17 01:17 HKT |
| 最后提交 | `608ec39` — review: Sprint 4 full audit [auto] |
| 下一触发 | 无 — Sprint 4 已封版，本轮 Codex/Ariste 协作机制已归档；Sprint 5 需人工显式重启 |
| 协作机制 | 🛑 已结束 — Codex 心跳关闭，双方不再自动认领新任务 |

## 任务状态模型

每个阶段的状态流转（必填，不可跳跃）：

```
⏳ 空闲 → 🏁 已认领 → 🔧 施工中 → ⏳ 待审查 → ✅ 通过 或 ❌ 需修正(→重试)
     ↑                                                ↓
     └──────────────── 可协商 ──────────────────→ 下一阶段
```

| 状态 | 含义 | 谁触发 | 动作 |
|------|------|--------|------|
| ⏳ 空闲 | 阶段已定义，等待执行者 | Ariste(定义后) | 等待认领 |
| 🏁 已认领 | 执行者声明接手 | Codex | 更新 PROGRESS.md 状态+认领人 |
| 🔧 施工中 | 正在工作 | Codex | 更新状态+可选ETA |
| ⏳ 待审查 | 交付已提交，等审查 | Codex(commit后) | Ariste cron 自动审查 |
| ✅ 通过 | 审查通过 | Ariste(cron) | → 下一阶段状态变空闲 |
| ❌ 需修正 | 审查发现问题 | Ariste(cron) | Codex 读 review/并按反馈修补 |

## 超时升级规则

| 转变 | 超时时间 | 动作 |
|------|----------|------|
| ⏳ 空闲 → 无人认领 | 4 小时 | Ariste 群内 @Sky 提醒 |
| 🏁 已认领 → 无后续 | 2 小时（无commit） | Ariste cron 标记「施工超时警告」 |
| ⏳ 待审查 → 无人审查 | 30 分钟（无cron响应） | 触发手动审查 |
| ❌ 需修正 → 无响应 | 4 小时 | Ariste 群内 @Sky 介入 |

## 阶段流转

```
Phase 0 (6组件) → Batch 1 (6课, NumberLine) → Batch 2 (7课, 几何) → Batch 3 (8课, 数论+统计) → 全域审计 → 封版
```

## 审查记录

| 阶段 | 提交 | 审计 | 结论 | 日期 |
|------|------|------|------|------|
| Phase 0 | `95c23dc` | PASS 1338/0 | ✅ 通过 | 2026-05-16 |
| Batch 1 | `a156896` | PASS 1338/0；6 课组件齐全 | ✅ 通过 | 2026-05-16 → 2026-05-17 |
| Batch 2 | `c1f5925` | PASS 1338/0；7 课组件齐全 | ✅ 通过 | 2026-05-16 |
| Batch 3 | `5b1aac8` | PASS 1338/0；8 课组件齐全 | ✅ 通过 | 2026-05-16 → 2026-05-17 |
| 全域审计 | `71240d3` | PASS 1338/0；51 个课件入口；0 个多概念映射异常；diff-check 通过 | ✅ 通过 | 2026-05-17 |
| 封版 | `608ec39` | PASS 1338/0；全局审计复核通过 | ✅ 通过 | 2026-05-17 |
| **归档** | `87c2347` | Codex 归档 → Ariste ACK `signals/ack-archive` | 🔒 完成 | 2026-05-17 |

## 全域审计 状态

| 字段 | 值 |
|------|-----|
| Sprint | 4 |
| 阶段 | 全域审计 — Sprint 4 收尾 |
| 状态 | ✅ 通过 — 全域审计通过，Sprint 4 封版完成 |
| 任务 | 运行全域审计，检查所有 51 课组件完整性、概念图连通性、跨课一致性。✅ 已完成 |

## 封板归档

| 字段 | 值 |
|------|-----|
| 封板时间 | 2026-05-17 09:01 HKT |
| 封板结论 | Sprint 4 全部阶段完成并通过全域审计 |
| 协作状态 | 本轮 Codex/Ariste 自动协作结束 |
| 后续规则 | 若启动 Sprint 5 或维护更新，需要先由 Sky/Ariste 写入新的阶段目标与状态，再重新启用自动协作 |

---

## 信号协议（P0 — 必读）

> 归档说明：当本文件“协作机制”为“已结束”时，不再创建新的 `signals/*` 文件，不再触发自动认领。信号协议保留为下一轮 Sprint 的基础设施。

`signals/` 目录是独立于 PROGRESS.md 的信号通道。**每次状态变更必须同时写信号文件。**

### Codex 发送信号
```
# 1. 写信号文件（先于 PROGRESS.md 更新）
echo '{"type":"deliver","phase":"Batch X","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > signals/deliver-$(date +%s).json

# 2. 更新 PROGRESS.md
# 3. git add signals/ PROGRESS.md && git commit + push
```

### 信号类型
| 文件前缀 | 含义 | 发送者 | 预期回应 |
|---------|------|--------|---------|
| `deliver-` | 交付物就绪，等审查 | Codex | Ariste 执行审查 → 删信号 + 写报告 |
| `revise-` | 已按 review 修正重交 | Codex | Ariste 重新审查 |
| `start-` | 开始施工（认领确认） | Codex | Ariste 确认状态匹配 |
| `fault-` | 系统异常 | 任一方 | 读出故障上下文 → 群内报告 |

### Ariste 确认信号
Cron 处理完信号后：
```
git rm signals/<file>  # 删除已处理的信号
# 写 ack 完成信号
```

### 超时规则
信号文件在 `signals/` 停留 > 30 分钟 → cron 自动告警（信号通道故障，不依赖 PROGRESS.md）。

## 执行指南

### Codex 执行流程
1. 确认当前阶段状态为 `⏳ 空闲`
2. **认领**: 写 `signals/start-<ts>.json` + 更新 PROGRESS.md 为 `🏁 已认领` → commit + push
3. **施工**: 自由工作，可更新为 `🔧 施工中`
4. **交付**: 写 `signals/deliver-<ts>.json` + 更新 PROGRESS.md 为 `⏳ 待审查` → commit + push
5. **反馈**: 拉取 → 检查信号是否已删除（Ariste 确认） → 读 review/ → 按结论行动
   - ✅ 通过 → 继续下一阶段
   - ❌ 需修正 → 修复后写 `signals/revise-<ts>.json` + 重交

### Ariste 执行流程
1. Cron 每 5 分钟：`git fetch origin gh-pages && git reset --hard origin/gh-pages`
2. 先检查 `signals/`（独立通道，优先级高于 PROGRESS.md）
3. 有信号 → 处理信号 → 审核/确认/报告 → 删除信号文件 → push
4. 无信号 → 检查 PROGRESS.md 超时规则
5. 群内简报

### Sky 介入条件
- 信号在 `signals/` 停留 > 30 分钟 → 群内 @Sky（说明: 即使是 Ariste cron 挂了，信号文件也能揭示问题）
- 阶段空闲 > 4 小时无人认领 → 群内 @Sky
- ❌ 需修正 > 4 小时无响应 → 群内 @Sky
