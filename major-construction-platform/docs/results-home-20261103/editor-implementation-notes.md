# 编辑成果页与浅色主题 — 2026-11-03

## 交付范围

- Vue 工作台与静态 index.html 的“编辑成果页”均以新页面打开 `?view=results-portal&edit=1`。
- 共用 `src/results-home/editor.js` 控制编辑态工具栏、设置弹窗和本地配置；退出编辑移除 edit 参数。
- 导航：改名、显隐、拖拽排序、方向键排序、新增导航；取消不提交，确认后持久保存。新增导航当前展示“暂无已发布内容”。
- 风格：深色/浅色、标题、英文标题、描述、英文描述、学校标识和校徽图片。上传支持 PNG/JPG/WebP，单张不超过 2MB。
- 页面模块：专业全局概览、专业教师团队的显隐与顺序；探索版展开当前课程、岗位资料和可配置模块。没有补造教师数据。
- 领航员设置：名称、开场白、三条推荐问题；问答仍沿用当前专业资料规则，没有接入线上大模型或原站完整智能体管理后台。
- 数据源切换：专业建设统计/培养方案统计。缺失指标显示“—”，课程和知识点沿用原配置及其测算依据。

## 参考与素材

参考页：https://ykt-envning.rainclassroom.com/ai-workspace/ai-subject-display/3429/home?edit=1 。对照时原站已由用户设为浅色。

- 浅色球体：https://fe-static-yuketang.yuketang.cn/fe/static/assets/rainweb/ai-subject-display-bg-ball-theme-light.png
- 学校标识：https://envning-ai-course-base-resource.xuetangx.com/envning_ai_knowledge_base/ai_display/0/0/ai_display/1793673870598e942de88-de2e-4dfc-be6c-bcf93d227edb.png
- 校徽：https://envning-ai-course-base-resource.xuetangx.com/envning_ai_knowledge_base/ai_display/0/0/ai_display/179367388515729dfcc26-dbda-4c6c-8f4f-f87bb9bfe51d.jpg

标识属于原站视觉配置的还原素材，不构成对本地智能建造专业学校归属的核验；可在风格设置中替换。专业介绍、课程、岗位、统计保留本地已有资料。

深浅主题均复用前一轮从原站取得的 ray/star/frame Rive 动效。本轮核对浅色 frame 文件与深色版本一致，保留原动画并应用浅色背景、球体、白色卡片和深色文字。

## 保存和边界

设置保存在当前浏览器、当前 origin 的 localStorage（major-results-page-settings-v1）；支持同源页签刷新同步，没有写入生产后台。HTTP 页面和 file 页面受浏览器 origin 规则约束，不共享存储。英文描述保留为配置字段，当前展示使用中文。探索版模块展示使用本地资料，未声称复刻原站全部探索版业务页面。

## 验证

- 8 项设置恢复/错误存储降级/独立草稿/动画资源与清理测试通过。
- 26 项成果页相关测试通过，含静态入口编辑 URL。
- vue-tsc 与 Vite 客户端、服务端构建通过；保留仓库既有静态脚本和大包提示。
- 浏览器验证：菜单新页打开；深浅切换并保存；退出编辑后主题保留；导航取消回滚、改名、隐藏、键盘排序及刷新持久化；数据源切换；探索版展开模块；390px 窄屏无横向溢出，弹窗底部操作可见；控制台无 error。
- file:// 入口使用 VM 路由测试和共用控制器验证，未进行原生浏览器 file:// 视觉验收。

## 视觉证据

- source-editor-light.png / implementation-editor-light.png
- comparison-editor-light.png
- source-style-settings.png / implementation-style-settings.png
- comparison-style-settings.png
- implementation-navigation-settings.png
- implementation-editor-mobile.png

原站为计算机技术、八项导航与零统计；本地保留智能建造专业、岗位中心和原有统计，因此文字与计数不做逐像素等同声明。布局、背景、色彩、设置入口和动效来源按原站对齐。
