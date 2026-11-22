# Готовит папку game для iOS-приложения и иконку.
# Игру берёт из Android-сборки (prigovor_android/app/src/main/assets/game): там уже лежат меню,
# настройки графики (gfx.js) и катсцена — сначала запусти prigovor_android/build_assets.py.
import os, re, shutil, asyncio

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, '..', 'prigovor_android', 'app', 'src', 'main', 'assets', 'game')
OUT = os.path.join(ROOT, 'game')
ICON_XML = os.path.join(ROOT, '..', 'prigovor_android', 'app', 'src', 'main', 'res', 'drawable', 'ic_lily.xml')
ICON = os.path.join(ROOT, 'Assets.xcassets', 'AppIcon.appiconset', 'icon.png')

if os.path.exists(OUT):
    shutil.rmtree(OUT)
shutil.copytree(SRC, OUT)
print('game:', sum(len(f) for _, _, f in os.walk(OUT)), 'файлов')


# иконка: та же золотая лилия, что у Android, на тёмном фоне, 1024×1024 без прозрачности
async def icon():
    from playwright.async_api import async_playwright
    paths = re.findall(r'android:fillColor="([^"]+)"\s+android:pathData="([^"]+)"', open(ICON_XML, encoding='utf-8').read())
    svg = ''.join('<path fill="%s" d="%s"/>' % p for p in paths)
    html = ('<html><body style="margin:0;background:#14110F"><svg width="1024" height="1024" viewBox="14 14 80 80">'
            + svg + '</svg></body></html>')
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1024, 'height': 1024})
        await pg.set_content(html)
        await pg.screenshot(path=ICON, omit_background=False)
        await b.close()

asyncio.run(icon())
from PIL import Image
Image.open(ICON).convert('RGB').save(ICON)
print('icon:', ICON)
