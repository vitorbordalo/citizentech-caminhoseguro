#!/bin/bash
# renderiza cada figura em PNG (conferencia visual). uso: bash doc/rend.sh
cd "$(dirname "$0")"
node gerar_diagrama_classes.mjs
C="/c/Program Files/Google/Chrome/Application/chrome.exe"
for f in diagramas/fig-*.svg; do
  b=${f%.svg}
  H=$(grep -o 'height="[0-9]*"' "$f" | head -1 | tr -dc 0-9)
  "$C" --headless=new --disable-gpu --hide-scrollbars --window-size=1040,$H --screenshot="$(cygpath -m "$PWD")/$b.png" "file:///$(cygpath -m "$PWD")/$f" 2>&1 | tail -1 > /dev/null
  echo "$f $H"
done
