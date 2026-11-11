"""Gera o HTML do PDF de Agile a partir de conteudo_agile.md + prints + UX.md.
Uso: python build_agile.py [LINK_DO_PITCH]
Depois: _doc/pdf.sh agile.html ../GS-Agile-CaminhoSeguro.pdf
"""
import re, sys, pathlib, markdown

AQUI = pathlib.Path(__file__).resolve().parent
REPO = AQUI.parent.parent
md = (AQUI.parent / "conteudo_agile.md").read_text(encoding="utf-8")
link = sys.argv[1] if len(sys.argv) > 1 else "[LINK DO PITCH]"

# remove o cabeçalho (vira capa)
md = md[md.index("## 1. Apresentação da ideia"):]

# diagrama de casos de uso logo após o título da seção 3
md = md.replace("## 3. Diagrama de Casos de Uso (escopo total)\n",
    "\n"
    '<div class="paisagem"><h2>3. Diagrama de Casos de Uso (escopo total)</h2><figure><img src="casos_de_uso.png" alt="Diagrama de casos de uso" style="max-height:158mm"><figcaption>Figura 1: diagrama de casos de uso '
    "do CaminhoSeguro (escopo total). Elipses verdes = MVP; tracejadas = escopo futuro.</figcaption></figure></div>\n\n", 1)

# prints + comentários de UX
ux_path = REPO / "05-ddd-java" / "front" / "UX.md"
ux = ux_path.read_text(encoding="utf-8") if ux_path.exists() else ""
blocos = re.split(r"\n(?=## )", ux)
def bloco_ux(n):
    for b in blocos:
        if re.match(rf"## Tela {n}:", b):
            return re.sub(r"^## .*\n", "", b)
    return ""
TELAS = {1: ("1-inicio", "Início: para onde você quer ir?"), 2: ("2-rota", "Resultado da rota"),
         3: ("3-ocorrencia", "Avisar um problema"), 4: ("4-painel", "Painel da agente pública")}
prints = REPO / "05-ddd-java" / "front" / "prints"
for n, (nome, titulo) in TELAS.items():
    cel = prints / f"{nome}-celular.png"; cel = cel if cel.exists() else None
    desk = prints / f"{nome}-desktop.png"; desk = desk if desk.exists() else None
    imgs = ""
    if cel: imgs += f'<img src="{cel.as_uri()}" style="height:100mm;border:1px solid #ccc;margin:0 6pt">'
    if desk: imgs += f'<img src="{desk.as_uri()}" style="width:110mm;border:1px solid #ccc;margin:0 6pt;vertical-align:top">'
    html = (f'\n<h3>Tela {n}: {titulo}</h3>\n<figure>{imgs}<figcaption>Tela {n} no celular e no computador</figcaption></figure>\n\n'
            + bloco_ux(n) + "\n")
    md = re.sub(rf"\*\*\[PRINT TELA {n}[^\]]*\]\*\*", lambda m: html, md)
md = md.replace("*Os comentários de UX de cada tela (intenção, adequação ao público, acessibilidade) são inseridos junto a cada print.*", "")

corpo = markdown.markdown(md, extensions=["tables", "sane_lists", "md_in_html"])
corpo = corpo.replace("<h2>2. Personas", '<h2 class="quebra">2. Personas').replace("<h2>3. Diagrama", '<h2 class="quebra">3. Diagrama') \
             .replace("<h2>4. Backlog", '<h2 class="quebra">4. Backlog').replace("<h2>5. Protótipo", '<h2 class="quebra">5. Protótipo') \
             .replace("<h2>6. Roteiro", '<h2 class="quebra">6. Roteiro').replace("<h3>Tela 2", '<h3 class="quebra">Tela 2') \
             .replace("<h3>Tela 3", '<h3 class="quebra">Tela 3').replace("<h3>Tela 4", '<h3 class="quebra">Tela 4') \
             .replace("<h2>Apêndice", '<h2 class="quebra">Apêndice')

capa = f"""
<section class="capa">
  <div class="topo">FIAP · ENGENHARIA DE SOFTWARE · 2º ANO · TURMA 2ESPH · GLOBAL SOLUTION 2026.2 · CITIZENTECH</div>
  <div class="meio">
    <div class="disc">Agile Methodology With Squad Framework</div>
    <h1>CaminhoSeguro</h1>
    <div class="sub">Rotas a pé acessíveis e seguras, decididas com a comunidade</div>
    <p><b>Equipe 1</b> · Bela Vista, São Paulo/SP</p>
    <table><tr><th>Integrante</th><th>RM</th></tr><tr><td>Lucas Branquinho</td><td>562262</td></tr><tr><td>Vitor Bordalo</td><td>561592</td></tr></table>
    <p style="margin-top:14pt"><b>Vídeo Pitch (YouTube, não listado):</b><br><a href="{link}">{link}</a></p>
    <p><b>Repositório:</b> https://github.com/lucasfbranquinho/citizentech-caminhoseguro</p>
  </div>
  <div class="rodape">São Paulo · novembro de 2026</div>
</section>
<section class="sumario"><h2>Sumário</h2><ol>
<li>1. Apresentação da ideia</li><li>2. Personas</li><li>3. Diagrama de Casos de Uso</li>
<li>4. Backlog do Produto (MoSCoW, Planning Poker e MVP)</li><li>5. Protótipo das telas e comentários de UX</li>
<li>6. Vídeo Pitch (link e roteiro)</li><li>Apêndice: conversa com moradora real</li></ol></section>
"""
html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>CaminhoSeguro - Agile</title>
<link rel="stylesheet" href="../../_doc/doc.css"><style>h3 + figure img{{max-height:105mm}} @page paisagem{{size:A4 landscape;margin:10mm}} .paisagem{{page:paisagem;page-break-before:always;page-break-after:always}} td{{font-size:9pt}}</style></head>
<body>{capa}{corpo}</body></html>"""
(AQUI / "agile.html").write_text(html, encoding="utf-8")
print("ok", len(html))
