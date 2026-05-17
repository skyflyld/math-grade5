# 📡 信号协议
> 独立于 PROGRESS.md 的异步确认通道
> 规则：Codex 写信号 → Ariste 确认后删除 → 超时 < 30min 未处理 = 故障

> 归档状态：Sprint 4 已封板时，本协议仅作为下一轮基础设施保留；除非 `PROGRESS.md` 写入新的可执行阶段，否则双方不应创建新的信号文件。

## 信号文件格式

`signals/<TYPE>-<TIMESTAMP>-<TOKEN>.json`

## 信号类型

| TYPE | 发送者 | 含义 |
|------|--------|------|
| `deliver` | Codex | 交付物就绪，等审查 |
| `revise` | Codex | 已按 review 修正，重新提交 |
| `start` | Codex | 开始施工（认领确认） |
| `ack` | Ariste | 已拉取代码并开始审查 |
| `done` | Ariste | 审查完成，状态已更新 |
| `fault` | 任一方 | 检测到系统异常 |
| `meta` | 任一方 | 协议改进建议 |

## 规则

1. **写信号和写状态是两步**：Codex 先写信号文件，再更新 PROGRESS.md 并 commit
2. **Ariste 先查信号，再读 PROGRESS.md**：如果有 `signals/*` 文件，优先处理
3. **确认即删除**：Ariste 处理完信号后删除对应信号文件，再 commit
4. **超时告警**：信号文件停留 > 30 分钟 → cron 自动告警
