# V1.0 一期需求拆解

日期：2026-06-11

本文件夹用于承接需求评审后的 V1.0 一期拆解。本期先做三个模块：

- 岗位画像分析
- 招聘需求趋势
- CMS 数据初始化

本次拆解基于当前 demo 已有页面、数据结构和截图资产整理，目标是把 demo 能力拆成产品、研发、测试都能对齐的开发输入。

## 文件说明

| 文件 | 用途 |
| --- | --- |
| `00-V1.0一期范围说明.md` | 说明本期边界、业务闭环、暂不做范围 |
| `01-岗位画像分析.md` | 拆解岗位画像分析页面、详情弹窗、数据字段和验收点 |
| `02-招聘需求趋势.md` | 拆解招聘趋势 KPI、趋势图、技能热度、明细表 |
| `03-CMS数据初始化.md` | 拆解 CMS 初始化入口、初始化状态、产业链推荐选择 |
| `04-数据对象与接口拆解.md` | 汇总三模块关键数据对象、接口建议和状态流转 |
| `05-开发排期与验收清单.md` | 给研发排期、联调顺序、验收清单和风险点 |
| `06-demo总览与演示路径.md` | 拆解当前 demo 的入口、演示路径和讲解顺序 |
| `07-demo页面模块拆解.md` | 按页面区域拆当前 demo 的前端模块和交互 |
| `08-demo代码与数据映射.md` | 将 demo 页面映射到代码文件、数据对象和生产化改造点 |
| `V1.0一期功能拆解清单.csv` | 可导入表格工具的功能清单 |
| `V1.0-demo页面拆解清单.csv` | 可导入表格工具的 demo 页面级拆解清单 |
| `assets/` | 从当前 demo 拷贝出的相关截图 |
| `demo-project/` | 从当前大 demo 拆出的轻量 Vue/Vite 工程，包含 `index.html`、`src/App.vue`、mock 数据和样式 |

## 当前 demo 依据

- 岗位画像分析：`major-construction-platform/src/mock/job-research.ts`、`major-construction-platform/src/App.vue`
- 招聘需求趋势：`major-construction-platform/src/mock/job-research.ts`、`major-construction-platform/src/App.vue`
- CMS 数据初始化：`major-construction-platform/src/app/industry-research-management.ts`、`major-construction-platform/src/App.vue`

## 一期验收主线

1. 管理端完成专业产业调研数据初始化。
2. 管理员选择推荐产业链作为专业默认产业链。
3. 前台岗位中心按默认产业链展示岗位画像分析。
4. 前台岗位中心展示招聘需求趋势。
5. 岗位画像详情能支撑后续岗位建设、课程映射和报告生成。
