#!/bin/bash
# uso: ./montar_pdf.sh "https://youtu.be/XXXX"
cd "$(dirname "$0")"
LINK="${1:-[COLAR AQUI O LINK DO YOUTUBE]}"
sed "s#{{LINK_VIDEO}}#$LINK#" arvr.html > _arvr_final.html
../../_doc/pdf.sh _arvr_final.html ../GS-ARVR-CaminhoSeguro.pdf
rm -f _arvr_final.html
