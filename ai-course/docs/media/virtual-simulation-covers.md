# 虚拟仿真实验封面

2026-10-10，使用内置 `image_gen` 生成六张与《电气控制与PLC》对应的写实封面。图片为AI生成的视觉素材，不是企业实拍；企业名称和学习人数为本地展示配置，不表示已取得企业资源授权或已接入企业平台。

所有素材存放在 `ai-course/public/virtual-simulation-covers/`，转为960px宽的JPEG以适配卡片，并在 `src/media/virtual-simulation-covers.mjs` 内嵌。独立打开 `index.html`、`offline.html`、CMS入口无需联网加载图片。原始生成图片保留在本机 `.codex/generated_images/01a124b2-f8e2-7310-9e60-8ceff1b7e8af/`。

| 文件 | 对应实验 | 虚构企业 |
| --- | --- | --- |
| motor-photo-v1.jpg | 三相异步电动机正反转控制 | 启衡自动化 |
| ladder-photo-v1.jpg | PLC基本指令与梯形图编程 | 智研电气 |
| conveyor-photo-v1.jpg | 输送线启停与电机互锁控制 | 联程智控 |
| star-delta-photo-v1.jpg | 电动机星三角降压启动 | 华实机电 |
| sorting-photo-v1.jpg | 工件检测与自动分拣 | 科岳智造 |
| io-photo-v1.jpg | PLC I/O点位接线与故障排查 | 铭拓工业 |

## 生成提示词

每次调用的完整提示词由以下模板替换 `{scene}` 得到，每个场景独立调用一次内置工具：

```text
Use case: photorealistic-natural. Asset type: landscape 16:9 course resource card cover for a Chinese vocational course Electrical Control and PLC. Create one realistic professional educational equipment photograph, {scene} Composition: three-quarter view, medium close-up, equipment centered and fills most of the horizontal frame, uncluttered real laboratory backdrop in soft focus, subject readable at small card size. Lighting: natural bright lab light, neutral colors, convincing shadows, brushed aluminum, industrial plastics, realistic wires. No overlay title, no logo, no watermark, no collage, no floating graphic elements, no illustration, no futuristic holograms. Single distinct image.
```

1. motor: a three-phase induction motor forward/reverse control training bench. A blue-gray compact industrial motor sits beside an open electrical training board fitted with two DIN-rail contactors, thermal overload relay, neat red blue black wiring and green red start-stop push buttons. Real metal and molded plastic materials, mechanically credible connections.
2. ladder: a PLC programming workstation. A laptop screen shows a plausible ladder logic program with power rails, contacts, coils and timer blocks. Beside the laptop is a compact modular PLC with expansion I/O modules and green terminal blocks on an aluminum training panel, organized wiring and a small HMI touch screen. The laptop and PLC dominate the scene.
3. conveyor: a PLC controlled bench-scale industrial conveyor training system. A short black belt in an aluminum extrusion frame, a small gray geared motor at the end, two photoelectric sensors, a few metal workpieces and a compact control box with red emergency stop button and green indicator. Vocational electrical automation laboratory.
4. star-delta: a close-up of a star-delta motor starter electrical training cabinet. Three DIN-rail contactors and a thermal overload relay, circuit breaker, neat terminal strips, carefully routed red yellow blue and black wiring, a small three-phase motor visible on the workbench beside the cabinet. Visible industrial hardware, electrically credible construction.
5. sorting: a PLC automatic workpiece sorting training bench. Aluminum extrusion frame, short black conveyor belt carrying metal and dark plastic cylindrical parts, inductive and optical sensors, a compact pneumatic cylinder acting as sorting pusher into two trays, small control enclosure with green/red buttons, PLC training laboratory.
6. io: a close-up of a PLC I/O wiring and fault diagnosis training board. Compact gray modular PLC, orderly green screw terminals, numbered terminal strips without readable text, red blue black and yellow wiring in cable ducts, a digital multimeter and insulated probes resting beside the board, small sensors and pushbuttons nearby.

已逐张检查主体与课程相关性。设备图仅作资源封面，不作为接线图或施工依据。
