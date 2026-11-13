# 平台 CMS

本应用独立管理课程基础配置与专业产业关联。源码不依赖业务应用运行时；公共数据、规则和配置契约来自同仓库 `packages/`。目前保存位置仍为浏览器或离线往返配置，不提供跨设备、多用户数据库同步。

## 开发与构建

在本目录执行 `npm ci`、`npm run dev`，默认端口 5188；被占用时用 `npm run dev -- --port 5198`。开发模式的课程默认返回地址为同机 `http://127.0.0.1:5186/index.html`，可设置 `VITE_COURSE_URL` 改变。保持访问主机名一致（例如统一使用 127.0.0.1）。

- `/`：管理入口，产业卡直接进入产业配置。
- `/course.html`：课程管理。
- `/industry.html?entry=industry`：专业、产业链与岗位管理。
- `npm run build`：生成可独立部署的 `dist/` 与可双击的 `offline/`。
- `npm run build:industry-compat`：从同一源码更新专业建设项目原有 `industry-research-admin.html`。
- `npm test`：入口、产业控制器、存储拒绝、配置往返与刷新测试。

本地双击根目录 `index.html` 时，两个卡片自动打开 `offline/` 中的完整页面；直接双击根目录的 `course.html` 或 `industry.html` 也会转到对应离线文件。离线页的“返回管理首页”进入 `offline/index.html`，可继续切换管理模块。通过 HTTP 访问时仍使用线上入口。修改源码后须重新执行 `npm run build` 更新离线内容；`dist/` 用于通过 HTTP 部署。

在线部署时，业务应用与 CMS 推荐使用同一来源下不同目录。课程应用可通过 `VITE_PLATFORM_CMS_URL=/platform-cms/course.html` 指定独立 CMS；CMS 可通过 `VITE_COURSE_URL=/ai-course/index.html` 配置无调用方时的课程入口。跨域名导航目前不接受，允许同一主机不同端口的本地联调。

专业建设原管理路径由本应用生成兼容产物；旧 `?view=industry-research-admin` 入口自动跳转。课程原 `/cms/index.html` 也由本应用源码生成，保持原部署地址与本地配置兼容。

## 数据与所有权

- `packages/industry-core`：2142 专业、19 产业链、791 关系，以及多专业恢复、匹配和任务库规则。目录版本、规则依据和待核验性质保留在来源字段中；这些关系不表示当前招聘事实。
- `packages/course-config`：课程档位、关联专业、产业启用规则、历史存储键与导航契约。
- `packages/data-access`：校验配置、浏览器存储和跨入口桥接。拒绝可执行地址、外站返回、凭据 URL、HTTPS 降级及非 HTML 文件地址。
- `packages/build-tools`：独立的离线 IIFE 构建，不依赖在线分块名称和数量。

CMS 处理管理配置；课程正文、项目任务、知识图谱、教师草稿和附件仍由业务应用管理。直接访问不同来源的 CMS 不会自动读取另一来源的本地草稿；从业务入口进入时携带已校验配置，返回时保留课程模块与班级路由。存储不可用时保留 URL 中的配置，以支持刷新。

## 更新规则与兼容产物

修改共用规则后运行：

```sh
node ../packages/industry-core/scripts/generate-compat.mjs
node ../packages/industry-core/scripts/generate-compat.mjs --check
```

更新课程时在 `ai-course` 运行 `npm run build`；更新专业建设时在 `major-construction-platform` 运行 `npm run build`。后者会先构建 CMS 兼容页面，再构建浏览器桥和专业建设应用。三个应用需分别安装依赖，未强制统一原工具链版本，也未在共享运行时目录执行根级依赖安装。

不要手工修改 `offline/`、课程 `index.html/offline.html/cms/index.html`、专业建设 `industry-research-admin.html` 或 `industry-cms-bridge.js`。它们均由源码生成。
