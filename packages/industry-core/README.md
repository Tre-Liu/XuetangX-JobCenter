# 专业产业共用数据与规则

`@platform/industry-core` 是不依赖框架的本地共享包。业务构建通过相对路径导入；无网络请求、浏览器存储或应用运行时依赖。

- `index.mjs`：`industryDataset`、`directory`、`officialMajors`、`findMajor(code, sourceLevel?)`、`chains`、`matchChains(code, sourceLevel?)`、`matchMajorJobs(major)`、`IndustryMajorSelection`（亦导出小写别名）。
- `catalog.mjs`：目录和关联查询。查询结果保留 `majorKey`、层次、顺序、置信度、规则得分及依据；指定 `sourceLevel` 可精确限定层次。
- `matching.mjs`：专业名称规则，保留规则先后顺序、岗位 ID 和测算计数。
- `course-job-matching.mjs`：课程适配器，根据既有岗位任务库覆盖任务数与能力数，其他规则与身份字段共用。
- `selection.mjs`：多专业恢复、同链合并、岗位聚合。恢复时拒绝歧义层次，保留原有 ID 与选择顺序。

## 数据与来源

`data/industry-catalog.json` 从本批改造前专业平台的完整数据原样迁移，包含 2,142 个专业、19 条产业链、791 条关系及匹配/未匹配/待研判状态。工作簿来源为 `V1.0需求（2026.6.11）/官方数据/专业与产业链产业环节匹配结果.xlsx`。`data/official-majors.json` 保留课程既有官方专业目录的来源链接、快照日期、工作簿、工作表、层次与源行号。快照日期沿用历史档案，不表示本次重新检索或核验。

专业名称规则生成的是岗位画像；任务库为既有课程内容。它们不代表当前招聘记录或已核验的企业事实。数据档案见 `catalogProvenance`；界面来源统一为“岗位画像测算”。

## 更新与兼容

编辑 canonical JSON 或规则后，执行：

```sh
node packages/industry-core/scripts/generate-compat.mjs
node packages/industry-core/scripts/generate-compat.mjs --check
node --test packages/industry-core/tests/*.test.mjs
```

生成器为专业平台生成现有路径的经典脚本、TS 数据以及离线目录，为课程保留历史 JSON 路径。经典脚本自包含，双击本地页面不需要跨目录 fetch。兼容产物不可手改，检查模式会报出差异但不会覆写。专业平台原 Excel 导入命令现先写 canonical 数据再运行统一生成器；不再维护另一套独立数据写出逻辑。

共享测试涵盖具体匹配行为、层次隔离、全专业经典脚本行为一致、课程计数适配和生成物漂移。既有业务测试继续验证原调用路径。
