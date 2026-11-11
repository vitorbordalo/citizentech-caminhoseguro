# Captura telas do app no ar (Chrome headless) para a cena 3. Uso: python capturar_app.py
import subprocess, pathlib
AQUI = pathlib.Path(__file__).resolve().parent
OUT = AQUI/"capturas"; OUT.mkdir(exist_ok=True)
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
S = "https://citizentech-caminhoseguro.onrender.com"
R = lambda c: f"{S}/rota.html?origem=1&destino=3&criterio={c}"
# nome, largura, altura, url  (celular: layout de 500 px, o mínimo do Chrome headless)
ITENS = [("inicio_cel",500,1500,f"{S}/index.html?origem=1&destino=3&criterio=ACESSIVEL"),
         ("rota_note",1280,800,R("ACESSIVEL")), ("rota_cel",500,1500,R("ACESSIVEL")),
         ("aviso_cel",500,1300,f"{S}/ocorrencia.html"),
         ("painel_note",1280,800,f"{S}/painel.html"), ("rota_segura_cel",500,1500,R("SEGURA")),
         ("rota_segura_note",1280,800,R("SEGURA"))]
for n,w,h,u in ITENS:
    subprocess.run([CHROME,"--headless=new","--disable-gpu","--hide-scrollbars","--force-device-scale-factor=1",
      f"--window-size={w},{h}","--virtual-time-budget=20000",f"--screenshot={OUT/(n+'.png')}",u],capture_output=True)
    print(n,(OUT/(n+'.png')).exists())
