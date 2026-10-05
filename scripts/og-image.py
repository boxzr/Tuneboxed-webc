"""Builds public/og-image.png, the 1200x630 card link previews show.

Run from the repo root: python3 scripts/og-image.py (needs Pillow).
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
ORANGE = (255, 138, 61)
BLUE = (77, 163, 255)
DISPLAY = 'node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff'
BODY = 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'


def font(path, size, weight=None):
    try:
        f = ImageFont.truetype(path, size)
        if weight:
            f.set_variation_by_axes([weight])
        return f
    except OSError:
        return ImageFont.truetype(DISPLAY, size)


def glow(color, center, radius, alpha):
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = center
    d.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(*color, alpha))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.45))


def sprite(path, height):
    im = Image.open(path).convert('RGBA')
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


def shadowed(im, offset=10, blur=14):
    pad = blur * 3
    out = Image.new('RGBA', (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    shadow = Image.new('RGBA', im.size, (0, 0, 0, 0))
    shadow.putalpha(im.getchannel('A').point(lambda a: a * 0.55))
    out.alpha_composite(shadow, (pad, pad + offset))
    out = out.filter(ImageFilter.GaussianBlur(blur))
    out.alpha_composite(im, (pad, pad))
    return out, pad


card = Image.new('RGBA', (W, H), (0, 0, 0, 255))
bg = ImageDraw.Draw(card)
for y in range(H):
    k = y / H
    bg.line([(0, y), (W, y)], fill=(int(14 + 10 * k), int(18 + 4 * k), int(38 - 10 * k)))
card.alpha_composite(glow(BLUE, (170, 420), 330, 120))
card.alpha_composite(glow(ORANGE, (1030, 420), 330, 120))
card.alpha_composite(glow((255, 210, 120), (600, 230), 260, 40))

# Ring ropes behind the fighters.
ropes = ImageDraw.Draw(card)
for i, (color, y) in enumerate([((255, 255, 255, 70), 470), ((255, 138, 61, 90), 505), ((77, 163, 255, 90), 540)]):
    ropes.rounded_rectangle((-20, y, W + 20, y + 7), radius=4, fill=color)
ropes.rectangle((0, 575, W, H), fill=(214, 200, 176, 255))
ropes.rectangle((0, 575, W, 581), fill=(170, 155, 130, 255))

blue, bp = shadowed(sprite('src/assets/boxer-blue.png', 430))
orange, op = shadowed(sprite('src/assets/boxer-orange.png', 430).transpose(Image.FLIP_LEFT_RIGHT))
card.alpha_composite(blue, (40 - bp, 180 - bp))
card.alpha_composite(orange, (W - 40 - orange.width + op, 180 - op))

logo, lp = shadowed(sprite('src/assets/tuneboxed-battle-logo.png', 170), offset=6, blur=10)
card.alpha_composite(logo, ((W - logo.width) // 2, 38 - lp))

d = ImageDraw.Draw(card)


def centered(text, y, f, fill, stroke=0, stroke_fill=(10, 12, 24)):
    w = d.textlength(text, font=f)
    d.text(((W - w) / 2, y), text, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)


title = font(DISPLAY, 128)
tune, boxed = 'TUNE', 'BOXED'
tw = d.textlength(tune, font=title)
total = tw + d.textlength(boxed, font=title)
x0 = (W - total) / 2
d.text((x0, 212), tune, font=title, fill=(255, 255, 255), stroke_width=4, stroke_fill=(10, 12, 24))
d.text((x0 + tw, 212), boxed, font=title, fill=ORANGE, stroke_width=4, stroke_fill=(10, 12, 24))

centered('SONG BATTLES FOUGHT AS BOXING MATCHES', 348, font(DISPLAY, 46), (255, 255, 255), 2)
centered('Every vote lands a punch', 406, font(BODY, 30, 700), (230, 232, 245))

pill = font(BODY, 24, 800)
label = 'PLAY FREE  ·  TUNEBOXED.COM'
pw = d.textlength(label, font=pill)
px, py = (W - pw) / 2 - 28, 470
d.rounded_rectangle((px, py, px + pw + 56, py + 52), radius=26, fill=ORANGE)
d.text((px + 28, py + 11), label, font=pill, fill=(26, 16, 32))

card.convert('RGB').save('public/og-image.png', optimize=True)
print('wrote public/og-image.png')
