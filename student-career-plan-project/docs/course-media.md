# 高等数学教学媒体档案

这三段视频由本项目的 `scripts/generate-course-media.py` 原创绘制并编码，使用当前课程单元中的函数、公式和教学顺序。图像、动画和中文说明均由本地代码生成，没有下载外部视频，没有挪用其他课程或教师影像。它们是无声的知识讲解短片，不是课堂实录或完整课时，不代表学校、企业或教师已经核验的教学记录。

| 学习单元 | 实际时长 | 文件字节数 | 内容分段 |
| --- | --- | ---: | --- |
| limit-introduction | 00:36 | 239714 | 00:00 从两侧观察趋近；00:10 化简后计算；00:22 区分极限与函数值 |
| derivative-meaning | 00:36 | 214536 | 00:00 平均变化率；00:09 割线趋于切线；00:19 瞬时速度与单位；00:29 连续未必可导 |
| monotonicity-extrema | 00:36 | 164503 | 00:00 分析区间与驻点；00:10 导数符号；00:22 端点与驻点的函数值比较 |

三个文件均为 960×540、24fps、864 帧、H.264 High / yuv420p / MP4，不含音轨。使用 `+faststart` 将索引放在媒体前部。每段同名 PNG 是生成视频的首帧，作为待播放画面。视频和图片位于 `public/course-media/`，构建时原样复制到 `dist/course-media/`。

`getCourseMedia(unitId)` 返回本地 `src`、`poster` 与 `durationSeconds`。生产构建使用 Vite 的相对 `BASE_URL`，因此内联后的 `dist/index.html` 使用 `./course-media/...` 读取媒体；开发时使用 `/course-media/...`。不依赖远程资源、网络请求或外部播放器服务。

`CourseVideoPlayer.vue` 接收 `unit: LearningUnit`，发出 `confused` 事件，公开 `seekTo(seconds)`。播放、暂停、进度、音量和全屏使用原生 HTMLVideoElement 控件；大播放按钮直接调用 `video.play()`，倍速直接设置 `video.playbackRate`。没有自动播放；切换单元会暂停旧视频并载入新视频。知识导引可通过公开方法跳转到真实媒体时间。

## 生成与检查

生成器需要 Pillow、支持 libx264 的本机 FFmpeg 和系统中文字体，不会安装软件或下载资源。使用方式：

```sh
python3 scripts/generate-course-media.py --ffmpeg /path/to/ffmpeg
node --test tests/course-media.test.mjs
```

首次生成使用本机已安装的 FFmpeg 6.0 和 bundled Python/Pillow。三个 MP4 均通过 FFmpeg 全片解码（每片 864 帧，零解码错误）。媒体测试独立读取 MP4 容器，检查本地资源覆盖、H.264 编码、实际时长、分辨率、帧数、faststart 索引和 PNG 尺寸。组件在开发与静态文件入口中的实际交互，需由整页浏览器验收覆盖。
