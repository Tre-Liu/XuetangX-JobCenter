# 分支清理记录（2026-09-07）

本次清理 5 个本地分支：新合并 2 个，删除已合并分支 1 个，转为归档标签 2 个。当前保留 main 和 4 个工作分支。未推送远端，未删除任何原工作目录。

| 分支 | 处理结果 |
| --- | --- |
| codex/new-double-high-collector | 236 个独立提交合入 main 后删除分支；原工作目录保留在 504c9f1 的 detached HEAD，未跟踪 PDF 和运行目录保留。 |
| codex/ai-career-matrix | 10 个独立提交合入 main 后删除分支；新增 13 个设计文档和图片文件。 |
| codex/talent-plan-empty-import | 已完全合入 main，删除分支；原工作目录保留在 8243e47 的 detached HEAD。 |
| sites-archive | 部署压缩包快照，转为 archive/sites-archive-20260907 标签后删除分支。 |
| sites-publish | 与 codex/sites-private-deploy 文件树完全一致，转为 archive/sites-publish-20260907 标签后删除分支。 |
| codex/cv-career-agent-v1 | 保留：18 个独立提交，工作目录有大量未提交代码和交付文件。 |
| codex/full-position-task-generation | 保留：4 个独立提交，数据、工作簿生成脚本和输出目录仍有未提交工作。 |
| codex/recruitment-position-matching | 保留：29 个独立提交，测试文件有未提交修改，目录中还有被忽略的匹配交付数据。 |
| codex/sites-private-deploy | 保留：5 个独立提交；预检与主线有 10 个冲突文件，包括 App.vue、index.html、样式和测试。预检未产生工作区冲突。 |

## 验证

- 新双高采集工具合并前后均为 76/76 测试通过，合入主线的工具目录与原分支完全一致。
- AI 设计的 13 个文件与原分支、合并后工作区逐字节一致；5 张 PNG 的所有数据块 CRC 校验通过。
- 主平台合并前测试为 519/520 通过；失败项为 `static portrait task chips render task names instead of task objects`，对应现有未提交的岗位任务展示改动。未为清理分支改写该业务代码。
- 已删除的 3 个合并分支原提交均可从 main 追溯；2 个归档标签均精确指向原分支提交。
- 无未解决的 Git 冲突，无暂存改动，仍处于 main。
- 核对开始时记录的 320 个未提交文件：没有缺失；期间部分 ai-course 文件发生变化。这些变化保留，本次合并提交不涉及 ai-course。具体文件见 verification.json。

## 恢复归档分支

```sh
git branch sites-archive archive/sites-archive-20260907
git branch sites-publish archive/sites-publish-20260907
```

原分支提交见 branches-before.txt，当前分支及工作目录见 branches-after.txt。测试日志和 Sites 合并预检记录保存在同目录。
