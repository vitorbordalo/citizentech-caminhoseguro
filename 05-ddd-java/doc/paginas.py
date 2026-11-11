# Uso: python paginas.py arquivo.pdf  -> imprime JSON {chave: numero_da_pagina} dos titulos do indice.
import json
import sys

try:
    import pymupdf as fitz
except ImportError:  # versoes antigas
    import fitz

TITULOS = {
    "PG_1": "1. Descritivo da solução", "PG_2": "2. Justificativa", "PG_3": "3. Objetivos",
    "PG_4": "4. Arquitetura da API", "PG_5": "5. Diagrama de classes", "PG_6": "6. DER",
    "PG_7": "7. Tabela de endpoints", "PG_71": "7.1 Exemplos", "PG_8": "8. Protótipos",
    "PG_9": "9. Instruções", "PG_93": "9.3 Passo a passo", "PG_95": "9.5 Deploy", "PG_10": "10. Demais",
}
doc = fitz.open(sys.argv[1])
res = {}
for chave, titulo in TITULOS.items():
    for i in range(2, len(doc)):  # pula capa e indice
        if titulo in doc[i].get_text():
            res[chave] = i + 1
            break
print(json.dumps(res))
