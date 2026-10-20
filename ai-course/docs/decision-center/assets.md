# 决策中心栅格素材

内置 image_gen 工具生成，参考用户截图的淡蓝紫玻璃质感；没有使用CLI或外部API。

- `src/decision/operation-orbit.png`：宽幅淡蓝背景、中央紫色发光球、两层细椭圆轨道、下方青紫半透明圆台。生成提示要求无文字、数字、图标、人物或界面控件，四周留空用于前端指标。
- `src/decision/insight-orbit.png`：白背景、非常淡的蓝色椭圆底座和内层圆盘、中央蓝色发光球；提示要求无紫色、圆台、轨道线、文字、数字或控件，匹配洞察使用概况截图。

组件以inline导入，两张素材包含在index.html、offline.html与CMS入口中。数量、标签与筛选内容为可交互HTML，素材本身不含静态数值。

## 最终生成提示词

运行概览：Create one decorative UI illustration asset for a Chinese education analytics dashboard, matching the supplied reference's running overview illustration. Reference image role: palette and translucent 3D style ONLY. Wide landscape 1600x650 composition on a very pale almost white cool blue #f5f9ff background. The asset should have a softly glowing translucent lavender circular orb, centered horizontally at x=50% and vertically near 28%, medium size approx 170px diameter in the eventual 1100px-wide display. Beneath it are two very wide thin elliptical lavender orbital paths at around 60% height, followed by a small pale cyan/lavender translucent layered cylindrical platform centered at 85% height. Delicate glass-like low-contrast shading, airy soft light, exactly the restrained style of the source dashboard. No text, no numbers, no icons, no people, no mascot, no additional balls, no interface cards or controls. Leave large clean empty regions around the centered orb and rings for real editable frontend metrics. This is a BACKGROUND ILLUSTRATION ASSET, not a screenshot of a website.

应用洞察：Create a single wide 1600x460 decorative dashboard illustration inspired by the supplied screenshot (reference role: exact composition, colors, material). Recreate ONLY the background image within the screenshot's usage summary white card: a very pale blue wide horizontal elliptical base, nearly filling the image, with a smaller thin inner elliptical disk, and a luminous BLUE sphere at horizontal center, approx 155px diameter in a final 1100px-wide UI, its center at 47% of image height. Pure white background outside the pale elliptical base. Soft translucent blue glass style, restrained blue #4c8fff and cyan glows. No platform or pedestal, no orbital outlines, no purple, no other balls. No text, no digits, no icons, no labels, no UI chrome or cards. Empty horizontal areas to the left and right of the sphere will be used for real editable metrics. This image is a decorative BACKGROUND ASSET only. Keep central sphere prominent and round.
