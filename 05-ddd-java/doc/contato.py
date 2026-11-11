# Conferencia visual: gera folhas de contato (PNG) das paginas do PDF. uso: python contato.py arquivo.pdf pasta_saida [dpi]
import sys
try:
    import pymupdf as fitz
except ImportError:
    import fitz

pdf, saida = sys.argv[1], sys.argv[2]
dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 50
doc = fitz.open(pdf)
print(len(doc), "paginas")
por_folha = 8
for ini in range(0, len(doc), por_folha):
    pix = []
    for i in range(ini, min(ini + por_folha, len(doc))):
        p = doc[i].get_pixmap(dpi=dpi)
        pix.append(p)
    w = max(p.width for p in pix); h = max(p.height for p in pix)
    cols = 4
    linhas = (len(pix) + cols - 1) // cols
    folha = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, cols * (w + 6), linhas * (h + 6)), False)
    folha.set_rect(folha.irect, (120, 120, 120))
    for k, p in enumerate(pix):
        p = fitz.Pixmap(fitz.csRGB, p) if p.colorspace.n != 3 else p
        p.set_origin((k % cols) * (w + 6) + 3, (k // cols) * (h + 6) + 3)
        folha.copy(p, p.irect)
    folha.save(f"{saida}/folha-{ini // por_folha + 1}.png")
