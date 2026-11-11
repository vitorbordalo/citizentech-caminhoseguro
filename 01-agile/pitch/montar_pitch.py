#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Monta o pitch do CaminhoSeguro (Agile, GS FIAP 2026.2) a partir da voz gravada.

Uso (um comando so):
    python montar_pitch.py
Opcoes:
    --audios PASTA   pasta com cena1..cenaN (qualquer extensao)   [ENTREGAS/01-Agile/AUDIOS]
    --saida ARQ.mp4  video final                                  [ENTREGAS/01-Agile/PITCH-final/pitch-final.mp4]
    --roteiro ARQ.md roteiro (linhas '>' por cena)                [ENTREGAS/01-Agile/ROTEIRO-NARRACAO.md]
    --artes PASTA    PNGs 1920x1080 das cenas (cena1a.png ...)    [./cenas_novas]
    --sem-video      so processa a voz e mostra a linha do tempo (rapido)

O texto das legendas vem do roteiro (nada fixo no codigo). Se o numero de pausas
detectadas nao bater com o numero de frases, distribui pelo numero de palavras.
Requer: Python com numpy, scipy, Pillow; ffmpeg (procurado em _ferramentas/ffmpeg).
"""
import argparse, glob, json, math, re, shutil, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
from PIL import Image, ImageDraw, ImageFont

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[2]                      # .../GS-2026
SR, FPS, W, H = 48000, 30, 1920, 1080
LIMITE = 178.0                              # 2:58
LEAD = TAIL = 0.4                           # folga de silencio mantida em cada ponta da fala
RESPIRO = 0.35                              # respiracao entre cenas
FADE = 0.45                                 # transicao entre imagens


def achar_ffmpeg():
    for p in (RAIZ / "_ferramentas" / "ffmpeg").rglob("ffmpeg.exe"):
        return str(p)
    return "ffmpeg"


FFMPEG = achar_ffmpeg()


def rodar(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, **kw)


# ---------------------------------------------------------------- roteiro
def ler_roteiro(caminho):
    cenas, atual = {}, None
    for linha in Path(caminho).read_text(encoding="utf-8").splitlines():
        m = re.match(r"^##\s+Cena\s+(\d+)", linha)
        if m:
            atual = int(m.group(1)); cenas[atual] = []; continue
        if linha.startswith("#"):
            atual = None; continue
        if atual and linha.lstrip().startswith(">"):
            t = linha.lstrip()[1:].strip().replace("**", "").replace("`", "")
            if t:
                cenas[atual].append(t)
    if not cenas:
        sys.exit("Roteiro sem cenas: esperava '## Cena N' e linhas começando com '>'.")
    return dict(sorted(cenas.items()))


# A fala diz por extenso; na legenda queimada/SRT escreve-se do jeito escrito.
SUBST = [("Objetivos de Desenvolvimento Sustentável onze, dez e três", "Objetivos de Desenvolvimento Sustentável (ODS) 11, 10 e 3"),
         ("onze, dez e três", "11, 10 e 3"), ("equipe um, turma dois E S P H", "equipe 1, turma 2ESPH"),
         ("turma dois E S P H", "turma 2ESPH"), ("setenta e dois anos", "72 anos")]


def para_legenda(t):
    for a, b in SUBST:
        t = t.replace(a, b)
    return t


def n_palavras(s):
    return max(1, len(re.findall(r"\w+", s)))


# ---------------------------------------------------------------- audio
def normalizar(src, dst):
    """Filtro leve + loudnorm de 2 passes (alvo -16 LUFS). Saida: wav mono 48k float."""
    pre = "highpass=f=80"
    r = rodar([FFMPEG, "-hide_banner", "-y", "-i", str(src), "-vn", "-af",
               f"{pre},loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    txt = r.stderr.decode("utf-8", "ignore")
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", txt, re.S)
    filtro = f"{pre},loudnorm=I=-16:TP=-1.5:LRA=11"
    if m:
        try:
            d = json.loads(m.group(0))
            if float(d["input_i"]) > -70:
                filtro = (f"{pre},loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={d['input_i']}:measured_TP={d['input_tp']}"
                          f":measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true")
        except Exception:
            pass
    r = rodar([FFMPEG, "-hide_banner", "-y", "-i", str(src), "-vn", "-af", filtro + ",aresample=48000",
               "-ac", "1", "-c:a", "pcm_f32le", str(dst)])
    if r.returncode != 0:
        sys.exit(f"ffmpeg falhou em {src}:\n" + r.stderr.decode("utf-8", "ignore")[-600:])
    sr, x = wavfile.read(str(dst))
    return x.astype(np.float32)


def envelope_db(x, passo=0.010):
    hop = int(SR * passo)
    n = len(x) // hop
    rms = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1))
    return 20 * np.log10(rms + 1e-9), hop


def mascara_fala(db):
    piso, pico = np.percentile(db, 10), np.percentile(db, 95)
    lim = max(piso + 12, pico - 32)
    m = db > lim
    # fecha buracos < 90 ms e remove cliques < 60 ms
    def runs(mask, val):
        out, i, n = [], 0, len(mask)
        while i < n:
            if mask[i] == val:
                j = i
                while j < n and mask[j] == val:
                    j += 1
                out.append((i, j)); i = j
            else:
                i += 1
        return out
    for a, b in runs(m, False):
        if b - a < 9 and a > 0 and b < len(m):
            m[a:b] = True
    for a, b in runs(m, True):
        if b - a < 6:
            m[a:b] = False
    return m, runs


def pausas(m, runs, passo, min_s):
    idx = np.where(m)[0]
    if len(idx) == 0:
        return None, None, []
    a0, b0 = idx[0], idx[-1] + 1
    ps = [(a * passo, b * passo) for a, b in runs(m, False) if a > a0 and b < b0 and (b - a) * passo >= min_s]
    return a0 * passo, b0 * passo, ps


def selecionar(ps, cum, ts, te):
    k = len(cum)
    T = max(te - ts, 1e-3)
    esp = [ts + T * c for c in cum]
    INF = 1e18
    P = len(ps)
    custo = [[abs((p[0] + p[1]) / 2 - e) / T * 4 - min(p[1] - p[0], 1.0) for p in ps] for e in esp]
    dp = [[INF] * P for _ in range(k)]
    bk = [[-1] * P for _ in range(k)]
    for p in range(P):
        dp[0][p] = custo[0][p]
    for j in range(1, k):
        for p in range(P):
            melhor, q_ = INF, -1
            for q in range(p):
                if dp[j - 1][q] < melhor:
                    melhor, q_ = dp[j - 1][q], q
            if q_ >= 0:
                dp[j][p] = melhor + custo[j][p]; bk[j][p] = q_
    p = int(np.argmin(dp[k - 1]))
    if dp[k - 1][p] >= INF:
        return None
    out = [p]
    for j in range(k - 1, 0, -1):
        p = bk[j][p]; out.append(p)
    return [ps[i] for i in reversed(out)]


def encurtar_pausas(x, maximo):
    """Corta o miolo de silencios maiores que `maximo` (nunca mexe na voz)."""
    db, hop = envelope_db(x)
    m, runs = mascara_fala(db)
    idx = np.where(m)[0]
    if len(idx) == 0:
        return x
    a0, b0 = idx[0], idx[-1] + 1
    partes, pos = [], 0
    xf = int(0.015 * SR)
    for a, b in runs(m, False):
        if a <= a0 or b >= b0:
            continue
        s0, s1 = a * hop, b * hop
        if (s1 - s0) / SR > maximo:
            metade = int(maximo / 2 * SR)
            partes.append(x[pos:s0 + metade]); pos = s1 - metade
    partes.append(x[pos:])
    if len(partes) == 1:
        return x
    out = partes[0]
    for p in partes[1:]:
        fade = np.linspace(0, 1, xf, dtype=np.float32)
        out = np.concatenate([out[:-xf], out[-xf:] * (1 - fade) + p[:xf] * fade, p[xf:]])
    return out


def preparar_cena(x, frases, pausa_max=None, rotulo="", marcas=None):
    """Apara a fala e acha o inicio de cada frase. Retorna (audio, inicios[s], fins[s], metodo)."""
    if pausa_max:
        x = encurtar_pausas(x, pausa_max)
    db, hop = envelope_db(x)
    passo = hop / SR
    m, runs = mascara_fala(db)
    if not m.any():
        sys.exit(f"{rotulo}: nao encontrei voz no audio (so silencio?).")
    k = len(frases) - 1
    pal = [n_palavras(f) for f in frases]
    tot = sum(pal)
    cum = list(np.cumsum(pal)[:-1] / tot)
    ts = te = None
    escolhidas, metodo = None, ""
    if k == 0:
        ts, te, _ = pausas(m, runs, passo, 0.4)
        escolhidas, metodo = [], "frase unica"
    if k and marcas and len(marcas) == k and not pausa_max:
        # inicio de cada frase vindo da transcricao (tempos reais das palavras)
        ts, te, _ = pausas(m, runs, passo, 0.4)
        escolhidas = [(t - 0.10, t - 0.10) for t in marcas]
        metodo = "marcas da transcricao"
    for lim in (() if (k == 0 or escolhidas is not None) else (0.40, 0.30, 0.22, 0.16)):
        ts, te, ps = pausas(m, runs, passo, lim)
        if len(ps) >= k:
            escolhidas = ps if len(ps) == k else selecionar(ps, cum, ts, te)
            if escolhidas:
                metodo = f"pausas ({len(ps)} achadas, limite {lim:.2f}s)"
                break
    if escolhidas is None:
        escolhidas = []
        for c in cum:  # fallback proporcional, encaixado no ponto mais calmo proximo
            alvo = ts + (te - ts) * c
            i0, i1 = int((alvo - 0.5) / passo), int((alvo + 0.5) / passo)
            i0, i1 = max(i0, int(ts / passo)), min(i1, int(te / passo))
            suave = np.convolve(db[i0:i1], np.ones(9) / 9, mode="same")
            i = i0 + int(np.argmin(suave))
            escolhidas.append((i * passo - 0.05, i * passo + 0.05))
        metodo = "proporcional por palavras (pausas insuficientes)"
    ini_audio = max(0.0, ts - LEAD)
    fim_audio = min(len(x) / SR, te + TAIL)
    corte = x[int(ini_audio * SR):int(fim_audio * SR)]
    pad_i = int(max(0.0, LEAD - ts) * SR)
    pad_f = int(max(0.0, te + TAIL - len(x) / SR) * SR)
    corte = np.concatenate([np.zeros(pad_i, np.float32), corte, np.zeros(pad_f, np.float32)])
    off = ini_audio - pad_i / SR
    inicios = [ts - off] + [p[1] - off for p in escolhidas]
    fins = [p[0] - off for p in escolhidas] + [te - off]
    fade = int(0.02 * SR)
    corte[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
    corte[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    return corte, inicios, fins, metodo


# ---------------------------------------------------------------- musica
def fazer_musica(dur, seed=7):
    """Trilha suave sintetizada (acordes em pad), sem copyright. Retorna (n,2) float32, pico ~0.5."""
    rng = np.random.default_rng(seed)
    n = int((dur + 1) * SR)
    t = np.arange(n) / SR
    acordes = [(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63]),
               (130.81, [261.63, 329.63, 392.0]), (98.0, [196.0, 246.94, 293.66])]
    seg = 6.0
    out = np.zeros((n, 2), np.float32)
    for lado, det in ((0, -0.12), (1, 0.12)):
        sinal = np.zeros(n)
        for i in range(int(dur / seg) + 2):
            raiz, notas = acordes[i % 4]
            t0 = i * seg
            a, b = max(0, int((t0 - 1.5) * SR)), min(n, int((t0 + seg + 1.5) * SR))
            if a >= b:
                continue
            tt = t[a:b]
            env = np.clip((tt - (t0 - 1.5)) / 2.0, 0, 1) * np.clip(((t0 + seg + 1.5) - tt) / 2.0, 0, 1)
            env = np.sin(env * np.pi / 2) ** 2
            for f in [raiz] + notas:
                amp = 0.9 if f == raiz else 0.5
                vib = 1 + 0.0025 * np.sin(2 * np.pi * 0.25 * tt + f)
                sinal[a:b] += env * amp * (np.sin(2 * np.pi * (f + det) * tt * vib) + 0.25 * np.sin(2 * np.pi * 2 * (f + det) * tt))
        trem = 0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * t + lado)
        out[:, lado] = (sinal * trem).astype(np.float32)
    sos = butter(2, 2200, btype="low", fs=SR, output="sos")
    out = sosfilt(sos, out, axis=0).astype(np.float32)
    out *= 0.5 / (np.max(np.abs(out)) + 1e-9)
    fi, fo = int(2.0 * SR), int(2.5 * SR)
    out[:fi] *= np.linspace(0, 1, fi, dtype=np.float32)[:, None]
    out[-fo:] *= np.linspace(1, 0, fo, dtype=np.float32)[:, None]
    return out


def ducking(voz, atk=0.12, rel=0.7, prof_db=-9.0):
    """Ganho (n,) da musica: cai prof_db sob a voz, volta suave nas pausas."""
    hop = int(0.02 * SR)
    n = len(voz) // hop + 1
    v = np.pad(voz, (0, n * hop - len(voz)))
    rms = np.sqrt(np.mean(v.reshape(n, hop) ** 2, axis=1))
    ativo = (20 * np.log10(rms + 1e-9) > -48).astype(np.float64)
    ca, cr = 1 - math.exp(-0.02 / atk), 1 - math.exp(-0.02 / rel)
    s, env = 0.0, np.zeros(n)
    for i, a in enumerate(ativo):
        s += (ca if a > s else cr) * (a - s)
        env[i] = s
    g = 1 - (1 - 10 ** (prof_db / 20)) * env
    return np.interp(np.arange(len(voz)), np.arange(n) * hop, g).astype(np.float32)


# ---------------------------------------------------------------- video
def fonte(tam):
    for nome in ("segoeuib.ttf", "seguisb.ttf", "arialbd.ttf"):
        try:
            return ImageFont.truetype("C:/Windows/Fonts/" + nome, tam)
        except OSError:
            pass
    return ImageFont.load_default()


def quebrar(draw, texto, f, largura):
    palavras, linhas, atual = texto.split(), [], ""
    for p in palavras:
        teste = (atual + " " + p).strip()
        if draw.textlength(teste, font=f) <= largura or not atual:
            atual = teste
        else:
            linhas.append(atual); atual = p
    linhas.append(atual)
    return linhas


def desenhar_legenda(texto):
    dummy = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    for tam in (60, 54, 48, 43, 38):
        f = fonte(tam)
        linhas = quebrar(dummy, texto, f, 1500)
        if len(linhas) <= 2:
            break
    if len(linhas) == 2:  # equilibra as duas linhas
        ws = texto.split()
        melhor = None
        for i in range(1, len(ws)):
            a, b = " ".join(ws[:i]), " ".join(ws[i:])
            d = max(dummy.textlength(a, font=f), dummy.textlength(b, font=f))
            if d <= 1500 and (melhor is None or d < melhor[0]):
                melhor = (d, [a, b])
        if melhor:
            linhas = melhor[1]
    alt_l = int(tam * 1.32)
    larg = int(max(dummy.textlength(l, font=f) for l in linhas)) + 90
    alt = alt_l * len(linhas) + 44
    img = Image.new("RGBA", (larg, alt), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, larg - 1, alt - 1), radius=30, fill=(7, 16, 24, 222), outline=(45, 212, 191, 90), width=2)
    for i, l in enumerate(linhas):
        d.text((larg / 2, 22 + i * alt_l + alt_l / 2), l, font=f, fill=(246, 250, 252, 255), anchor="mm")
    x0, y1 = (W - larg) // 2, 1040
    return np.asarray(img), x0, y1 - alt


def suave(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def fmt_srt(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


# ---------------------------------------------------------------- principal
def achar_audio(pasta, n):
    achados = [p for p in Path(pasta).glob(f"cena{n}.*") if p.suffix.lower() in
               (".m4a", ".mp3", ".wav", ".ogg", ".opus", ".aac", ".flac", ".wma", ".mp4", ".webm", ".amr", ".3gp")]
    return achados[0] if achados else None


def mapear_imagens(n, nfrases, imgs, mapa):
    """Frase j -> indice da imagem. Usa mapa_imagens.json se bater; senao distribui proporcionalmente."""
    m = len(imgs)
    cfg = mapa.get(str(n))
    if cfg and len(cfg) == nfrases and max(cfg) < m:
        return cfg
    if cfg:
        print(f"  AVISO cena{n}: mapa_imagens.json nao bate ({len(cfg)} no mapa x {nfrases} frases, {m} imagens); distribuindo proporcionalmente.")
    if nfrases == 1 or m == 1:
        return [0] * nfrases
    return [min(m - 1, int(round(j * (m - 1) / (nfrases - 1) - 1e-9))) for j in range(nfrases)]


def construir(cenas, audios, tmp, pausa_max, respiro, cauda, marcas=None):
    infos, S = [], 0.0
    for n, frases in cenas.items():
        x = audios[n]
        corte, ini, fim, metodo = preparar_cena(x, frases, pausa_max, f"cena{n}", (marcas or {}).get(str(n)))
        dur = len(corte) / SR + respiro
        infos.append(dict(n=n, frases=frases, audio=corte, ini=[S + t for t in ini], fim=[S + t for t in fim],
                          S=S, dur=dur, metodo=metodo))
        S += dur
    return infos, S + cauda


def main():
    ap = argparse.ArgumentParser(description="Monta o pitch final a partir da voz.")
    ap.add_argument("--audios", default=str(RAIZ / "ENTREGAS/01-Agile/AUDIOS"))
    ap.add_argument("--saida", default=str(RAIZ / "ENTREGAS/01-Agile/PITCH-final/pitch-final.mp4"))
    ap.add_argument("--roteiro", default=str(RAIZ / "ENTREGAS/01-Agile/ROTEIRO-NARRACAO.md"))
    ap.add_argument("--artes", default=str(AQUI / "cenas_novas"))
    ap.add_argument("--sem-video", action="store_true")
    ap.add_argument("--marcas", help="JSON {cena: [inicio de cada frase a partir da 2a, em s]} (opcional)")
    a = ap.parse_args()
    saida = Path(a.saida); saida.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="pitch_"))

    cenas = ler_roteiro(a.roteiro)
    print("Roteiro:", {n: len(f) for n, f in cenas.items()}, "frases por cena")
    falta = [n for n in cenas if not achar_audio(a.audios, n)]
    if falta:
        sys.exit(f"Faltam audios em {a.audios}: " + ", ".join(f"cena{n}" for n in falta))
    audios = {}
    for n in cenas:
        src = achar_audio(a.audios, n)
        print(f"Normalizando {src.name} ...")
        audios[n] = normalizar(src, tmp / f"cena{n}_norm.wav")

    marcas = json.loads(Path(a.marcas).read_text(encoding="utf-8")) if a.marcas else None
    infos, total = construir(cenas, audios, tmp, None, RESPIRO, 0.8, marcas)
    if total > LIMITE:
        print(f"AVISO: {total:.1f}s passa de {LIMITE:.0f}s. Encurtando pausas (a voz nao e acelerada)...")
        infos, total = construir(cenas, audios, tmp, 0.45, 0.2, 0.5)
        if total > LIMITE:
            print(f"ATENCAO: mesmo assim ficou com {total:.1f}s (limite 3:00). Grave frases mais curtas.")
    for i in infos:
        print(f"  cena{i['n']}: {i['dur']:.1f}s, {len(i['frases'])} frases, metodo: {i['metodo']}")
    print(f"Duracao total: {total:.1f}s ({int(total // 60)}:{total % 60:04.1f})")

    # voz global + musica + ducking
    n_tot = int(total * SR) + SR
    voz = np.zeros(n_tot, np.float32)
    for i in infos:
        p = int(i["S"] * SR)
        voz[p:p + len(i["audio"])] += i["audio"]
    musica = fazer_musica(total + 1)[:n_tot]
    if len(musica) < n_tot:
        musica = np.pad(musica, ((0, n_tot - len(musica)), (0, 0)))
    g = ducking(voz)
    base = 10 ** (-31 / 20) / (np.sqrt(np.mean(musica ** 2)) + 1e-9)
    mix = voz[:, None] + musica * base * g[:, None]
    mix = mix[:int(total * SR)]
    pico = np.max(np.abs(mix))
    if pico > 0.95:
        mix *= 0.95 / pico
    wav_mix = tmp / "mix.wav"
    wavfile.write(str(wav_mix), SR, mix.astype(np.float32))

    # legendas .srt
    srt, k = [], 1
    legs = []
    for i in infos:
        for j, f in enumerate(i["frases"]):
            t0 = i["ini"][j] - 0.05
            prox = i["ini"][j + 1] - 0.05 if j + 1 < len(i["frases"]) else i["fim"][j] + 0.6
            t1 = min(prox - 0.04, i["fim"][j] + 0.6) if j + 1 < len(i["frases"]) else prox
            legs.append((max(0, t0), t1, f, i["n"], j))
            srt.append(f"{k}\n{fmt_srt(max(0, t0))} --> {fmt_srt(t1)}\n{para_legenda(f)}\n"); k += 1
    (saida.parent / "legendas.srt").write_text("\n".join(srt), encoding="utf-8")
    print("Legendas:", saida.parent / "legendas.srt")
    if a.sem_video:
        shutil.rmtree(tmp, ignore_errors=True)
        print("(--sem-video) pronto."); return

    # imagens e segmentos visuais
    mf = AQUI / "mapa_imagens.json"
    mapa = json.loads(mf.read_text(encoding="utf-8")) if mf.exists() else {}
    segs = []  # dict(t_in, img)
    for i in infos:
        imgs = sorted(Path(a.artes).glob(f"cena{i['n']}[0-9a-z].png"))
        if not imgs:
            sys.exit(f"Sem imagens da cena {i['n']} em {a.artes}")
        mp = mapear_imagens(i["n"], len(i["frases"]), imgs, mapa)
        usado = -1
        for j, k_img in enumerate(mp):
            if k_img != usado:
                t_in = i["S"] if usado == -1 else i["ini"][j] - 0.1
                segs.append(dict(t_in=t_in, img=imgs[k_img])); usado = k_img
    cache = {}
    for s in segs:
        im = Image.open(s["img"]).convert("RGB")
        if im.size != (W, H):
            im = im.resize((W, H), Image.LANCZOS)
        s["pil"] = im
    for k_, s in enumerate(segs):
        s["t_out"] = segs[k_ + 1]["t_in"] if k_ + 1 < len(segs) else total
        s["dir"] = k_ % 2
    subs = [(t0, t1, desenhar_legenda(para_legenda(f))) for t0, t1, f, _, _ in legs]

    def quadro(s, t):
        u = (t - s["t_in"]) / max(s["t_out"] - s["t_in"], 7.0)
        u = min(max(u, 0.0), 1.0)
        z = 1 + 0.05 * (u if s["dir"] == 0 else 1 - u)
        cw, ch = W / z, H / z
        cx = W / 2 + (u - 0.5) * 24 * (1 if s["dir"] == 0 else -1)
        x0 = min(max(cx - cw / 2, 0), W - cw); y0 = (H - ch) / 2
        return np.asarray(s["pil"].resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch)), dtype=np.uint8)

    saida_tmp = tmp / "video.mp4"
    cmd = [FFMPEG, "-hide_banner", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-i", str(wav_mix), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
           "-shortest", str(saida)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    nq = int(total * FPS)
    print(f"Renderizando {nq} quadros ...")
    for q in range(nq):
        t = q / FPS
        # camadas: alpha_k = s((t-(in_k-f/2))/f) - s((t-(in_k+1-f/2))/f)
        ativos = []
        for k_, s in enumerate(segs):
            a_in = 1.0 if k_ == 0 else suave((t - (s["t_in"] - FADE / 2)) / FADE)
            a_out = 0.0 if k_ + 1 == len(segs) else suave((t - (s["t_out"] - FADE / 2)) / FADE)
            al = a_in - a_out
            if al > 0.002:
                ativos.append((s, al))
        if len(ativos) == 1:
            fr = quadro(ativos[0][0], t).copy()
            if ativos[0][1] < 0.999:
                fr = (fr * ativos[0][1]).astype(np.uint8)
        else:
            acc = np.zeros((H, W, 3), np.float32)
            for s, al in ativos:
                acc += quadro(s, t).astype(np.float32) * al
            fr = acc.clip(0, 255).astype(np.uint8)
        # legenda
        for t0, t1, (arr, x0, y0) in subs:
            if t0 - 0.01 <= t <= t1 + 0.12:
                al = min(suave((t - t0) / 0.15), suave((t1 + 0.12 - t) / 0.15)) if t > t0 - 0.01 else 0
                if al > 0.01:
                    h_, w_ = arr.shape[:2]
                    reg = fr[y0:y0 + h_, x0:x0 + w_].astype(np.float32)
                    aa = (arr[..., 3:4].astype(np.float32) / 255.0) * al
                    fr[y0:y0 + h_, x0:x0 + w_] = (reg * (1 - aa) + arr[..., :3].astype(np.float32) * aa).astype(np.uint8)
        # fade de/para preto
        f_in, f_out = suave(t / 0.7), suave((total - t) / 0.9)
        fator = min(f_in, f_out)
        if fator < 0.999:
            fr = (fr * fator).astype(np.uint8)
        proc.stdin.write(fr.tobytes())
        if q % 300 == 0:
            print(f"  {q}/{nq}", flush=True)
    proc.stdin.close(); proc.wait()
    if proc.returncode != 0:
        sys.exit("ffmpeg falhou ao codificar o video.")
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"Pronto: {saida}  ({total:.1f}s)")
    if total > LIMITE:
        print("ATENCAO: acima de 2:58.")


if __name__ == "__main__":
    main()
