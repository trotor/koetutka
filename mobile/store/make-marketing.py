#!/usr/bin/env python3
"""Koostaa kauppakuvat: otsikko + raakakuvakaappaus puhelinkehyksessä.

Raakakuvat: store/screenshots-ios/*.png (1320×2868) ja store/screenshots/*.png
(1080×2400). Tulokset: store/marketing/ios/ (1320×2868, App Store 6.9")
ja store/marketing/android/ (1080×2100, Play: pidempi sivu ≤ 2× lyhyempi).

    python3 mobile/store/make-marketing.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
FONT = '/System/Library/Fonts/Avenir Next.ttc'
HEAVY, DEMI = 8, 2

CREAM = (247, 240, 220)
GOLD = (232, 185, 49)
TOP = (22, 48, 22)
BOTTOM = (45, 90, 39)
BEZEL = (12, 20, 12)

# (raakakuvan nimi, otsikko, alaotsikko, uutta-merkki)
SHOTS = [
    ('01-list', 'Lähimmät kokeet ensin', 'Kaikki SNJ:n noutajakokeet\netäisyyden mukaan', False),
    ('02-month', 'Suosikit seinäkalenterina', 'Koko kuukausi yhdellä silmäyksellä', True),
    ('03-map', 'Koko Suomi kartalla', 'Koetyypit omilla väreillään', False),
    ('04-favorites', 'Suosikit omin värein', 'Ilmoittauduttu, harkinnassa –\nsinä päätät merkitykset', False),
    ('05-detail', 'Kaikki kokeen tiedot', 'Ilmoittaudu SNJ:ssä ja\nlisää koe kalenteriin', False),
]


# Henkilönimet ja yhteystiedot peitetään kuvista (raakakuvan koordinaatit):
# korvataan harmailla "tekstiviivoilla", jotta rivi näyttää yhä sisällöltä.
MASKS = {
    ('ios', '05-detail'): [(80, 1606, 950, 1664)],      # Tuomarit
    ('android', '05-detail'): [(66, 1408, 810, 1464)],  # Tuomarit
}


def redact(img, boxes):
    d = ImageDraw.Draw(img)
    for x0, y0, x1, y1 in boxes:
        d.rectangle([x0, y0, x1, y1], fill='white')
        h = (y1 - y0) * 0.5
        cy = (y0 + y1) / 2
        x = x0 + 4
        for w in (0.28, 0.32, 0.22):
            seg = (x1 - x0) * w
            d.rounded_rectangle([x, cy - h / 2, x + seg, cy + h / 2], radius=h / 2, fill=(222, 226, 222))
            x += seg + (x1 - x0) * 0.04


def gradient(size):
    w, h = size
    img = Image.new('RGB', size)
    px = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        px.line([(0, y), (w, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM)))
    return img


def rounded_mask(size, radius, bottom=True):
    mask = Image.new('L', size, 0)
    d = ImageDraw.Draw(mask)
    w, h = size
    d.rounded_rectangle([0, 0, w - 1, (h - 1) if bottom else h + radius], radius=radius, fill=255)
    return mask


def compose(raw: Path, out: Path, canvas, title, subtitle, new, phone_w, phone_top, title_y, masks=()):
    W, H = canvas
    img = gradient(canvas)
    d = ImageDraw.Draw(img)
    s = W / 1320  # mittakaava iOS-koon suhteen

    # Pehmeä vaalea hehku puhelimen takana.
    glow = Image.new('L', canvas, 0)
    ImageDraw.Draw(glow).ellipse([W * 0.1, phone_top - 80 * s, W * 0.9, phone_top + 900 * s], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(160 * s))
    img.paste(Image.new('RGB', canvas, (120, 160, 90)), (0, 0), glow)
    d = ImageDraw.Draw(img)

    y = title_y
    if new:
        f = ImageFont.truetype(FONT, round(40 * s), index=HEAVY)
        label = 'UUTTA'
        tw = d.textlength(label, font=f)
        pad_x, pad_y = 26 * s, 10 * s
        box = [W / 2 - tw / 2 - pad_x, y, W / 2 + tw / 2 + pad_x, y + 40 * s + 2 * pad_y + 8 * s]
        d.rounded_rectangle(box, radius=(box[3] - box[1]) / 2, fill=GOLD)
        d.text((W / 2, (box[1] + box[3]) / 2), label, font=f, fill=TOP, anchor='mm')
        y = box[3] + 28 * s

    size = 104 * s
    f_title = ImageFont.truetype(FONT, round(size), index=HEAVY)
    while d.textlength(title, font=f_title) > W - 120 * s:
        size -= 2
        f_title = ImageFont.truetype(FONT, round(size), index=HEAVY)
    d.text((W / 2, y), title, font=f_title, fill=CREAM, anchor='ma')
    y += size * 1.25

    f_sub = ImageFont.truetype(FONT, round(56 * s), index=DEMI)
    d.multiline_text((W / 2, y), subtitle, font=f_sub, fill=GOLD, anchor='ma', align='center', spacing=14 * s)

    # Puhelin: kuvakaappaus pyöristetyllä kehyksellä, valuu alareunan yli.
    shot = Image.open(raw).convert('RGB')
    redact(shot, masks)
    bezel = round(22 * s)
    inner_w = phone_w - 2 * bezel
    inner_h = round(shot.height * inner_w / shot.width)
    shot = shot.resize((inner_w, inner_h), Image.LANCZOS)
    radius = round(110 * s)
    phone_h = inner_h + 2 * bezel
    x = (W - phone_w) // 2

    shadow = Image.new('L', canvas, 0)
    ImageDraw.Draw(shadow).rounded_rectangle(
        [x, phone_top + 30 * s, x + phone_w, phone_top + phone_h], radius=radius, fill=150)
    shadow = shadow.filter(ImageFilter.GaussianBlur(40 * s))
    img.paste(Image.new('RGB', canvas, (5, 12, 5)), (0, 0), shadow)

    frame = Image.new('RGB', (phone_w, phone_h), BEZEL)
    frame.paste(shot, (bezel, bezel), rounded_mask((inner_w, inner_h), radius - bezel))
    img.paste(frame, (x, phone_top), rounded_mask((phone_w, phone_h), radius))

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, optimize=True)
    print(out.relative_to(ROOT), img.size)


def main():
    for name, title, subtitle, new in SHOTS:
        compose(ROOT / 'screenshots-ios' / f'{name}.png', ROOT / 'marketing' / 'ios' / f'{name}.png',
                (1320, 2868), title, subtitle, new, phone_w=1140, phone_top=540 if not new else 600,
                title_y=150 if not new else 110, masks=MASKS.get(('ios', name), ()))
        # Play kieltää kuvissa aikasidonnaiset sanat ("uutta"), joten ei merkkiä.
        compose(ROOT / 'screenshots' / f'{name}.png', ROOT / 'marketing' / 'android' / f'{name}.png',
                (1080, 2100), title, subtitle, False, phone_w=900, phone_top=440, title_y=110,
                masks=MASKS.get(('android', name), ()))


if __name__ == '__main__':
    main()
