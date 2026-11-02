# D-257: i simboli del gioco che il sottoinsieme «latin» di @fontsource/inter non ha (→ ≤ ≥ ▲ ▼ ★ ☆ ⋮ ⚑), in un file
# woff2 per peso, così non cadono sul carattere di sistema (diverso da telefono a telefono). I glifi vengono da Inter
# 4.1.1 (pacchetto npm inter-ui 4.1.1, OFL 1.1, nessun «Reserved Font Name»); Inter non ha ⋮ e ⚑: qui li disegniamo
# (tre punti di Inter in colonna; asta grande come «|» e bandiera rettangolare). Uscita: src/resa/caratteri/.
# Uso (una volta, a mano; serve fontTools e brotli):  npm pack inter-ui@4.1.1 && tar xzf inter-ui-4.1.1.tgz
#   python3 tools/caratteri-simboli.py package/web
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools import subset

SIMBOLI = '→≤≥▲▼★☆⋮⚑'
PESI = {400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold'}


def rettangolo(pen, x0, y0, x1, y1):  # in senso orario (contorno esterno TrueType)
    pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath()


def aggiungi(f, nome, codice, disegno, avanzo):
    pen = TTGlyphPen(f.getGlyphSet()); disegno(pen)
    ordine = f.getGlyphOrder() + [nome]; f.setGlyphOrder(ordine); f['glyf'].glyphOrder = ordine
    f['glyf'].glyphs[nome] = pen.glyph()
    f['hmtx'][nome] = (avanzo, 0)
    for t in f['cmap'].tables:
        if t.isUnicode(): t.cmap[codice] = nome


def genera(sorgente, peso, uscita):
    f = TTFont(sorgente)
    gs, cmap, cap = f.getGlyphSet(), f.getBestCmap(), f['OS/2'].sCapHeight
    punto = cmap[ord('.')]; pv = f['hmtx'][punto][0]
    sbar = f['hmtx'][cmap[ord('|')]]
    asta = f['glyf'][cmap[ord('|')]]; asta.recalcBounds(f['glyf']); spessore = asta.xMax - asta.xMin
    # ⋮: tre punti fra la linea di base e l'altezza delle maiuscole
    f['glyf'][punto].recalcBounds(f['glyf']); alto = f['glyf'][punto].yMax - f['glyf'][punto].yMin
    passo = (cap - alto) / 2
    def tre_punti(pen):
        for i in range(3): gs[punto].draw(TransformPen(pen, (1, 0, 0, 1, 0, round(i * passo))))
    aggiungi(f, 'uni22EE', 0x22EE, tre_punti, pv)
    # ⚑: asta dalla base all'altezza delle maiuscole, bandiera nella metà alta
    x0 = sbar[1]
    def bandiera(pen):
        rettangolo(pen, x0, 0, x0 + spessore, cap)
        rettangolo(pen, x0 + spessore, round(cap * 0.45), x0 + spessore + round(cap * 0.62), cap)
    aggiungi(f, 'uni2691', 0x2691, bandiera, 2 * x0 + spessore + round(cap * 0.62))
    o = subset.Options(); o.flavor = 'woff2'; o.layout_features = []; o.name_IDs = [0, 1, 2, 3, 4, 5, 6]; o.notdef_outline = True
    s = subset.Subsetter(o); s.populate(unicodes=[ord(c) for c in SIMBOLI]); s.subset(f)
    f.flavor = 'woff2'; f.save(uscita)
    manca = [c for c in SIMBOLI if ord(c) not in f.getBestCmap()]
    if manca: sys.exit(f'{uscita}: mancano {manca}')
    print(uscita, peso)


if __name__ == '__main__':
    cartella = sys.argv[1]
    for peso, nome in PESI.items():
        genera(f'{cartella}/Inter-{nome}.woff2', peso, f'src/resa/caratteri/inter-simboli-{peso}.woff2')
