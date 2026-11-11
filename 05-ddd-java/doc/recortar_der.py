# Recorta o espaco em branco do DER (img/modelo_logico.png -> img/modelo_logico_recortado.png) para ampliar na pagina.
try:
    import pymupdf as fitz
except ImportError:
    import fitz
src = fitz.Pixmap("img/modelo_logico.png")
if src.alpha:
    src = fitz.Pixmap(src, 0)
out = fitz.Pixmap(src.colorspace, fitz.IRect(0, 0, src.width, 862), False)
out.copy(src, fitz.IRect(0, 0, src.width, 862))
out.save("img/modelo_logico_recortado.png")
print(out.width, out.height)
