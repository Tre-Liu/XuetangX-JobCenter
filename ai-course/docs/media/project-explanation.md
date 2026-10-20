# 项目讲解素材

图片讲解由 `src/media/project-flow.mjs` 依据当前项目明确保存的阶段和任务生成 SVG，带执行顺序、操作任务与验收返修路径。教师上传图片不替换，主动删除不恢复。

视频封面：`public/project-explanation/training-teacher-guidance.png`。使用内置 image_gen 生成，属于写实风格的课程场景素材，不是实拍课堂记录。教师近距离指导成年学生操作机器人示教器，场景为智能制造实训室，无文字水印。提示词核心：16:9 photorealistic Chinese vocational college intelligent manufacturing practical training; navy-clothed instructor coaches two adult students step by step on a robot teach pendant beside a stopped industrial robot in a safety-fenced cell; natural daylight; realistic anatomy; no text, logo or watermark.

16:9 播放素材由该静态场景图制作，1280×720、9 秒、无声；用于本地页面展示上传后的视频状态，不是完整授课录像。PNG 原图和 JPEG 封面保留，默认 MP4 和 JPEG 内嵌入静态入口，支持独立 HTML。来源元信息保留在默认素材数据里，页面采用普通产品文案。

## 生成提示词（原文）

Create a photorealistic documentary still photograph for a Chinese vocational college intelligent manufacturing practical training course, aspect ratio 16:9 landscape. A Chinese instructor aged about 40 wearing navy workwear is closely coaching two adult college students wearing coordinated blue workshop clothes at a robotics programming training station. Instructor beside student, leaning slightly and pointing gently to the robot teach pendant held by the student, guiding the controls step by step; anatomically natural hands and poses. A compact industrial robot arm and safety fenced training cell are clearly visible in the background, robot stopped during teaching, tidy modern training lab with machining and automation equipment, computer monitor showing abstract robot path visualization. Authentic classroom atmosphere, warm natural daylight, realistic skin texture and optical photography, professional educational course video cover composition, medium wide shot, sharp people and equipment, no text, no logos, no watermark. Output one high-quality 16:9 photograph-style image.

## 教学字幕

`training-teacher-guidance-captioned.mp4` 在原始 9 秒场景视频上加入三段教学字幕：0–3 秒“先核对设备状态，确认控制点位。”；3–6 秒“逐项调试启停与互锁，观察设备响应。”；6–9 秒“记录测试结果，修正后再次验证。”。字幕直接编码进画面，暂停、全屏和独立 HTML 播放均可见，并避开底部原生控制栏。默认封面从带字幕视频第一帧提取；原始无字幕素材保留。字幕为课程场景编写的教学提示，不是实拍语音转写，视频仍为无声场景素材。时间与文字保存在 `training-teacher-guidance-captions.json` 和默认视频元信息中；教师自行上传的视频保持原样。
