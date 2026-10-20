专业层次切换验收（2026-10-14）

在对接专业标题下新增全部、本科、职业教育三个选项，默认全部。本科筛选普通本科；职业教育筛选职业本科、高职专科和中职。筛选只改变显示范围，保留原有顺序、代码及匹配度。数据档案和匹配度说明维持原有依据与待复核边界。

验证结果：
- 专项测试 9 项通过。
- Vue 页面实际点击：BIM建模工程师全部 10 项、本科 1 项、职业教育 9 项，再切回全部 10 项；控制台无错误。
- 静态入口已接入共用点击处理及样式；内置浏览器禁止 file 协议，未完成静态入口浏览器验收。
- 构建通过，存在已有的大体积资源包警告。
- 全量测试 596 项：588 项通过、8 项失败。下列 8 项在移除本次 Vue 和静态入口接线改动的临时副本中也全部失败。

失败项：
- generated AI chain bundle preserves the complete reconciled dataset
- generated AI chain bundle retains all source node families and province evidence
- BIM demo sources are opt-in, clearly marked, and do not replace historical sources
- static job analysis tabs keep rich sections and clickable portrait cards
- static job analysis deep links render the selected uninitialized tab without runtime errors
- job portrait level filter narrows the list results
- job portrait search matches visible job content instead of hidden associations
- portrait company cards use a coordinated summary layout
