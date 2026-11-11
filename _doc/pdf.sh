#!/bin/bash
# uso: pdf.sh entrada.html saida.pdf
IN="$1"; OUT="$2"
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw --virtual-time-budget=5000 --print-to-pdf="$(cygpath -w "$OUT")" "file:///$(cygpath -m "$(realpath "$IN")")" 2>/dev/null
ls -la "$OUT"
