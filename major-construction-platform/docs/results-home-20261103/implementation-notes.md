# 专业成果首页更新记录

日期：2026-11-03。

参考页面：https://ykt-envning.rainclassroom.com/ai-workspace/ai-subject-display/3429/home 。用户要求参照自有产品线上样式更新本地成果页，为后续需求建立基础。

## 实现范围

- 首页：深蓝背景、星球图片、渐变标题、专业介绍、五项统计、右侧领航员。
- 共享顶部导航：保留本地岗位中心，补齐教学百宝箱入口，退出按钮返回专业工作台。
- 保留智能建造工程专业的原有内容和岗位图谱；未实现的栏目使用“暂无已发布内容”。
- `src/results-home/element.js` 同时供 Vue 包装组件与静态 `index.html` 使用。静态成果入口改为默认首页。
- 问答采用本地资料检索规则，快捷问题、文本发送、Enter 发送、Shift+Enter 换行可用；不连接线上模型。“深度思考”展开资料依据与核验提示，不调用推理模型。
- 390px 窄屏下改为纵向布局，导航横向滚动。原站固定宽度在窄屏上存在裁切，未沿用该限制。

## 素材来源

原站已加载素材保存至 `public/results-assets/`，运行时不依赖原站资源：

- earth.png：https://qn-sfe.yuketang.cn/o_1imp6seijmu71s23nhjam915qj9.png
- navigator.png：https://envning-ai-course-base-resource.xuetangx.com/envning_ai_knowledge_base/ai_display/0/0/ai_display/1776065996126aaf8d1e8-0586-43a9-ab33-520674c1b2d2.png
- icons.woff2：从原站 `aiworkspace.61874300.css` 的 iconfont 内嵌字体提取。样式版本 `0.0.0-dev-3f2acd96`。
- 中文字体使用与原站一致的系统字体回退。没有引入生成的替代插画。原站 Rive 流光、背景光晕与流星已在后续动效补齐中接入。

## 数据档案

本次是页面样式更新，未将参考站“计算机技术”的零值统计或专业介绍作为本地业务数据。页面沿用项目原有记录，不表示核验后的学校或企业事实。

Vue 首页统计沿用原有计算：课程档案 74 条；知识点按课程数 × 2.5 取整得到 185；AI 工具按关联记录数 ÷ 3 取整、下限 6 得到 9；智能体按课程关联记录计数为 26（未按智能体去重）；资源按课程数 × 0.65 取整得到 48。每项均保留依据工具提示，测算值待核验。

静态入口保留历史配置值：68、318、12、18、44。与 Vue 的历史数据口径存在差异，本次不改写旧数据；工具提示注明“现有专业配置值，待按课程、知识点及资源台账核验”。两入口共享视觉与交互，不代表数据台账已统一。

问答中的课程和岗位取自当前入口既有课程/岗位档案，并明确提示培养方案核验与招聘边界。没有调用外部问答接口或修改线上站点。

## 验证边界

完成桌面、笔记本和窄屏浏览器检查；快捷问题、输入发送、依据开关、岗位中心与轮播均可用。成果页定向测试 25 项通过，构建通过。静态脚本经现有 VM 测试验证，浏览器安全策略禁止 `file:` URL，未宣称直接打开静态文件的视觉验证完成。


## 动效补齐（2026-11-03）

上一轮只还原了静态视觉，遗漏了用户期望的动效。现已从原站实际加载的前端脚本 `2808.63820c89.js`（版本 `0.0.0-dev-f33efd58`）核对 `RiveRayCanvas` 实现并复用原始资源：

- 统计框：`ai-subject-display-light-frame.riv`；原站两种 theme 文件的 SHA-256 相同。按原站 Fill/Center 布局缩放到统计框。
- 背景光晕：`ai-subject-display-light-ray.riv`；基准 1600 × 900，等比缩放。
- 流星：`ai-subject-display-light-star.riv`；基准 1600 × 900，按画面宽高缩放。
- 三份资源源路径均为 `https://fe-static-yuketang.yuketang.cn/fe/static/assets/rainweb/`；本地放在 `public/results-assets/motion/`。
- 运行库使用与原站一致的 `@rive-app/canvas@2.49.1`，由 npm 官方包提取 rive.js、rive.wasm，保留 package.json、README 和 MIT LICENSE。禁用外部 WASM 回退，浏览器已确认全部动画请求来自 localhost。
- 文件入口使用按原始字节生成的 file-assets.js，避免依赖本地文件 fetch；已验证与所有二进制文件逐字节一致。此前 file URL 浏览器限制仍在，未声称完成文件协议下的原生浏览器验证。
- 离开首页释放实例和 ResizeObserver；浏览器标签页隐藏时停止渲染；遵循 prefers-reduced-motion。
- 新增 4 项动效生命周期/字节一致性测试通过，原 25 项成果页回归检查通过，构建通过。连续截图证实统计框光晕位置和背景流星位置均随时间变化。
