# 当前 demo 模块字段标注说明 v3

## 截图来源

本批标注图不使用 `major-construction-platform/outputs/prd/current-demo-screenshots` 中的旧截图。

底图来自当前 Vite demo 实时截图：

- `http://127.0.0.1:5178/index.html?view=job-industry&tab=region&reportView=library`
- `http://127.0.0.1:5178/index.html?view=job-industry&tab=policy&reportView=library`
- `http://127.0.0.1:5178/index.html?view=job-industry&tab=company&reportView=library`
- `http://127.0.0.1:5178/index.html?view=job-research&tab=portrait&reportView=library`
- `http://127.0.0.1:5178/index.html?view=job-research&tab=demand&reportView=library`
- `http://127.0.0.1:5178/index.html?view=job-research&tab=forecast&reportView=library`

其中 `区域产业分析` 已按当前 demo 恢复中国地图热力图后重新截图，页面同时包含 KPI、全国企业区域分布、省份企业样本排名和区域合作方向。

原始底图位于：

- `live-screenshots/当前demo-区域产业分析.png`
- `live-screenshots/当前demo-产业政策库.png`
- `live-screenshots/当前demo-产业企业库.png`
- `live-screenshots/当前demo-岗位画像分析.png`
- `live-screenshots/当前demo-招聘需求趋势.png`
- `live-screenshots/当前demo-新岗位新技术.png`

## 标注产物

- `当前demo-区域产业分析-字段标注_v3.png`
- `当前demo-产业政策库-字段标注_v3.png`
- `当前demo-产业企业库-字段标注_v3.png`
- `当前demo-岗位画像分析-字段标注_v3.png`
- `当前demo-招聘需求趋势-字段标注_v3.png`
- `当前demo-新岗位新技术-字段标注_v3.png`

## 口径说明

1. 红色编号贴在当前 demo 页面真实字段位置。
2. 右侧说明包含页面字段含义、建议数据库字段或统计口径。
3. 筛选、搜索、分页、清除筛选等交互控件标为前端状态或交互动作，不建议作为业务事实字段入库。
4. AI 研判、趋势判断、合作建议、新技术预判等内容应保存生成依据、生成时间、审核状态和人工复核信息。
5. 当前 v3 设计中对证书、新技术方向、技术方向-专业、岗位紧缺度等结构支撑不足，标注中已按“建议新增表/统计快照”说明。
