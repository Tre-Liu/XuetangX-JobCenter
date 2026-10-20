"""Render the three locally authored, silent calculus lessons.

Requires Pillow and a local FFmpeg binary; installs and downloads nothing.
Usage: python3 scripts/generate-course-media.py --ffmpeg /path/to/ffmpeg
"""
from __future__ import annotations

import argparse
import math
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'course-media'
WIDTH, HEIGHT, FPS, DURATION = 960, 540, 24, 36
BG, PANEL, INK = '#0a1320', '#101e30', '#eff5ff'
MUTED, GRID, BLUE, CYAN, GOLD = '#9cadc4', '#233247', '#6b9fff', '#57dbc4', '#ffcf80'
FONT = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
FONTS = {size: ImageFont.truetype(FONT, size) for size in [15, 17, 18, 20, 22, 24, 26, 30]}


def text(draw, xy, value, size=20, color=INK):
    draw.text(xy, value, font=FONTS[size], fill=color)


def wrap(draw, value, xy, width=270, size=20, color=INK, gap=10):
    line, y = '', xy[1]
    for char in value:
        if draw.textlength(line + char, font=FONTS[size]) > width:
            text(draw, (xy[0], y), line, size, color)
            line, y = char, y + size + gap
        else:
            line += char
    if line:
        text(draw, (xy[0], y), line, size, color)


def base(title, t, step, step_title, caption):
    image = Image.new('RGB', (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    text(draw, (38, 22), '高等数学  /  图形讲解', 15, MUTED)
    text(draw, (38, 53), title, 30)
    draw.rounded_rectangle((608, 114, 922, 426), radius=16, fill=PANEL)
    text(draw, (631, 135), f'{step:02d}  {step_title}', 22, CYAN)
    draw.line((632, 177, 896, 177), fill=GRID, width=1)
    draw.rounded_rectangle((38, 455, 922, 510), radius=10, fill=PANEL)
    text(draw, (57, 470), caption, 18)
    draw.line((38, 529, 922, 529), fill=GRID, width=3)
    draw.line((38, 529, 38 + int(884 * t / DURATION), 529), fill=BLUE, width=3)
    return image, draw


def plot(draw, xlim, ylim, y_label='y', x_label='x'):
    left, top, right, bottom = 80, 130, 552, 405
    def xy(x, y):
        return (left + (x - xlim[0]) / (xlim[1] - xlim[0]) * (right - left),
                bottom - (y - ylim[0]) / (ylim[1] - ylim[0]) * (bottom - top))
    for i in range(6):
        gx = left + i * (right - left) / 5
        gy = top + i * (bottom - top) / 5
        draw.line((gx, top, gx, bottom), fill=GRID, width=1)
        draw.line((left, gy, right, gy), fill=GRID, width=1)
    y0 = min(max(xy(0, 0)[1], top), bottom)
    x0 = min(max(xy(0, 0)[0], left), right)
    draw.line((left, y0, right + 11, y0), fill=MUTED, width=2)
    draw.line((x0, bottom, x0, top - 10), fill=MUTED, width=2)
    text(draw, (right + 15, y0 - 10), x_label, 17, MUTED)
    text(draw, (x0 - 12, top - 34), y_label, 17, MUTED)
    return xy


def point(draw, xy, color=CYAN, radius=6):
    draw.ellipse((xy[0] - radius, xy[1] - radius, xy[0] + radius, xy[1] + radius), fill=color)


def graph(draw, xy, fn, start, end, color=BLUE, width=4):
    coords = [xy(start + (end - start) * k / 100, fn(start + (end - start) * k / 100)) for k in range(101)]
    draw.line(coords, fill=color, width=width)


def limit(t):
    stage = 0 if t < 10 else 1 if t < 22 else 2
    titles = ['从两侧观察趋近', '先化简，再求极限', '极限与函数值']
    captions = ['x 从左右两侧接近 1，函数值都逐步接近 2。',
                '约去公因式的前提是 x ≠ 1，接近不等于取到。',
                '原函数在 x = 1 处无定义，极限仍然可以存在。']
    image, draw = base('极限的直观认识与计算', t, stage + 1, titles[stage], captions[stage])
    xy = plot(draw, (0, 2), (0, 3.3))
    graph(draw, xy, lambda x: x + 1, 0, 2)
    dist = max(0.025, 0.83 * math.exp(-t / 5.5))
    for x, color in [(1-dist, GOLD), (1+dist, CYAN)]:
        p = xy(x, x+1)
        draw.line((p[0], p[1], p[0], xy(x, 0)[1]), fill=color, width=1)
        point(draw, p, color)
    hole = xy(1, 2)
    draw.ellipse((hole[0]-7, hole[1]-7, hole[0]+7, hole[1]+7), fill=BG, outline=BLUE, width=3)
    text(draw, (xy(1, 0)[0] - 4, 413), '1', 18, MUTED)
    text(draw, (hole[0] + 18, hole[1] - 32), '(1, 2)', 18, MUTED)
    if stage == 0:
        text(draw, (632, 198), f'x = {1-dist:.3f}  →  1', 20, GOLD)
        text(draw, (632, 239), f'f(x) = {2-dist:.3f}  →  2', 20, GOLD)
        text(draw, (632, 298), f'x = {1+dist:.3f}  →  1', 20, CYAN)
        text(draw, (632, 339), f'f(x) = {2+dist:.3f}  →  2', 20, CYAN)
    elif stage == 1:
        text(draw, (632, 198), '(x² − 1) / (x − 1)', 22)
        text(draw, (632, 245), '= (x − 1)(x + 1) / (x − 1)', 18)
        text(draw, (632, 292), '= x + 1     (x ≠ 1)', 22, CYAN)
        text(draw, (632, 350), 'x → 1 时，x + 1 → 2', 20)
    else:
        text(draw, (632, 199), 'x = 1：原式没有定义', 20, GOLD)
        text(draw, (632, 248), 'x → 1：函数值趋近于 2', 20, CYAN)
        wrap(draw, '极限描述附近的变化趋势，不等同于该点的函数值。', (632, 308), size=20)
    return image


def derivative(t):
    stage = 0 if t < 9 else 1 if t < 19 else 2 if t < 29 else 3
    titles = ['平均变化率', '割线逐步趋于切线', '瞬时速度与单位', '连续未必可导']
    captions = ['两点的位移增量除以时间增量，得到区间平均速度。',
                '让 Δt 逐步趋近于 0，割线斜率逐步接近切线斜率。',
                '对 s(t) = t² 求导，t = 2 秒时的瞬时速度为 4 米/秒。',
                '绝对值函数在零点连续，但左右导数不同，因此不可导。']
    image, draw = base('导数的概念与几何意义', t, stage+1, titles[stage], captions[stage])
    if stage == 3:
        xy = plot(draw, (-2, 2), (-.2, 2.5))
        graph(draw, xy, abs, -2, 0, GOLD)
        graph(draw, xy, abs, 0, 2, CYAN)
        point(draw, xy(0, 0), BLUE)
        text(draw, (164, 170), 'y = |x|', 24)
        text(draw, (632, 203), '左导数 = −1', 24, GOLD)
        text(draw, (632, 254), '右导数 = 1', 24, CYAN)
        wrap(draw, '左右导数不相等，无法得到唯一的切线斜率。', (632, 318), size=20)
        return image
    xy = plot(draw, (0, 3.2), (0, 10.5), 's / m', 't / s')
    graph(draw, xy, lambda x: x*x, 0, 3.15)
    delta = 1 if stage == 0 else max(.025, math.exp(-(t-9)/2.5))
    slope = 4+delta
    graph(draw, xy, lambda x: 4+4*(x-2), 1.1, 3.05, CYAN, 2)
    graph(draw, xy, lambda x: 4+slope*(x-2), 1.35, 2.9, GOLD, 3)
    point(draw, xy(2, 4), CYAN)
    point(draw, xy(2+delta, (2+delta)**2), GOLD)
    text(draw, (146, 150), 's(t) = t²', 24)
    text(draw, (xy(2, 0)[0] - 3, 413), '2', 18, MUTED)
    if stage == 0:
        text(draw, (632, 202), 'Δs / Δt', 26, GOLD)
        text(draw, (632, 252), '= (3² − 2²) / (3 − 2)', 20)
        text(draw, (632, 300), '= 5 m/s', 26, GOLD)
        text(draw, (632, 357), '割线斜率对应平均变化率', 18, MUTED)
    elif stage == 1:
        text(draw, (632, 200), f'Δt = {delta:.3f} s', 22, GOLD)
        text(draw, (632, 248), f'割线斜率 = {slope:.3f}', 22, GOLD)
        text(draw, (632, 300), 'Δt → 0', 26)
        text(draw, (632, 350), '切线斜率 = 4', 24, CYAN)
    else:
        text(draw, (632, 199), 's′(t) = 2t', 26, CYAN)
        text(draw, (632, 249), 's′(2) = 4 m/s', 26)
        wrap(draw, '位移单位为米、时间单位为秒，导数的单位为米/秒。', (632, 310), size=20)
    return image


def extrema(t):
    stage = 0 if t < 10 else 1 if t < 22 else 2
    titles = ['先确定分析区间', '检查导数符号', '比较端点与驻点']
    captions = ['在闭区间 [0, 3] 内分析函数，并找到驻点 x = 2。',
                '导数由负变正，函数先减后增，x = 2 是极小值点。',
                '闭区间最值需要一起比较内部候选点与两个端点。']
    image, draw = base('单调性、极值与最值', t, stage+1, titles[stage], captions[stage])
    xy = plot(draw, (0, 3.4), (0, 6))
    fn = lambda x: x*x-4*x+5
    graph(draw, xy, fn, 0, 2, GOLD)
    graph(draw, xy, fn, 2, 3, CYAN)
    moving_x = min(3, (t % 12) / 4)
    point(draw, xy(moving_x, fn(moving_x)), INK, 5)
    text(draw, (200, 138), 'f(x) = x² − 4x + 5', 22)
    for x in [0, 2, 3]:
        pos = xy(x, fn(x))
        point(draw, pos, BLUE if x == 2 else MUTED)
        text(draw, (pos[0] + (9 if x == 0 else -4), 413), str(x), 18, MUTED)
        if stage == 2:
            text(draw, (pos[0]+10, pos[1]-30), f'({x}, {fn(x)})', 18)
    if stage == 0:
        text(draw, (632, 198), '定义域：[0, 3]', 22)
        text(draw, (632, 248), 'f′(x) = 2x − 4', 24)
        text(draw, (632, 299), 'f′(x) = 0  ⇒  x = 2', 22, CYAN)
        text(draw, (632, 357), '驻点还需要进一步判断', 18, MUTED)
    elif stage == 1:
        text(draw, (632, 197), '0 < x < 2', 20, GOLD)
        text(draw, (632, 235), 'f′(x) < 0  →  递减', 22, GOLD)
        text(draw, (632, 294), '2 < x < 3', 20, CYAN)
        text(draw, (632, 332), 'f′(x) > 0  →  递增', 22, CYAN)
    else:
        text(draw, (632, 196), 'f(0) = 5    f(2) = 1', 22)
        text(draw, (632, 239), 'f(3) = 2', 22)
        text(draw, (632, 302), '最小值：1（x = 2）', 22, CYAN)
        text(draw, (632, 350), '最大值：5（x = 0）', 22, GOLD)
    return image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--ffmpeg', required=True)
    parser.add_argument('--unit', choices=['limit-introduction', 'derivative-meaning', 'monotonicity-extrema'])
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    for key, render in [('limit-introduction', limit), ('derivative-meaning', derivative), ('monotonicity-extrema', extrema)]:
        if args.unit and key != args.unit:
            continue
        target = OUT / f'{key}.mp4'
        command = [args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgb24', '-video_size', f'{WIDTH}x{HEIGHT}', '-framerate', str(FPS), '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-metadata', 'title=高等数学图形讲解', str(target)]
        render(0).save(OUT / f'{key}.png')
        process = subprocess.Popen(command, stdin=subprocess.PIPE)
        try:
            for frame in range(FPS*DURATION):
                process.stdin.write(render(frame/FPS).tobytes())
        finally:
            process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError(f'Encoding failed: {target}')
        print(f'{key}: {DURATION}s, {target.stat().st_size} bytes', flush=True)


if __name__ == '__main__':
    main()
