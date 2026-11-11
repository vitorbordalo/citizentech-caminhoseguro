# Gera as artes 1920x1080 (HTML -> PNG) com Chrome headless. Uso: python renderizar_artes.py [cena1 cena3 ...]
import subprocess, sys, pathlib
AQUI = pathlib.Path(__file__).resolve().parent
ARTE, SAIDA = AQUI/"arte", AQUI/"cenas_novas"
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
SITE = "https://citizentech-caminhoseguro.onrender.com"
# cena -> variantes (v=)
VAR = {"cena1": ["a","b","c"], "cena2": ["a","b","c"], "cena3": list("abcdefgh"),
       "cena4": [str(i) for i in range(8)], "cena5": list("abcdefghi"), "cena6": ["a","b","c"]}
def main():
    SAIDA.mkdir(exist_ok=True)
    if len(sys.argv) == 1:
        for velho in SAIDA.glob("*.png"): velho.unlink()
    alvo = sys.argv[1:] or list(VAR)
    for c in alvo:
        for v in VAR[c]:
            out = SAIDA/f"{c}{v}.png"
            espera = 6000
            subprocess.run([CHROME,"--headless=new","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1",
              "--window-size=1920,1080",f"--virtual-time-budget={espera}",f"--screenshot={out}",
              (ARTE/f"{c}.html").as_uri()+f"?v={v}&site={SITE}"],capture_output=True)
            print(out.name, out.exists())
main()
