#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Coloca a narracao no video de AR-VR (55 s) sem recodificar a imagem.

Uso (um comando so):
    python narrar_arvr.py
Opcoes:
    --audios PASTA   arvr1..arvr5 (qualquer extensao)   [ENTREGAS/02-AR-VR/AUDIOS]
    --saida ARQ.mp4  video final                        [ENTREGAS/02-AR-VR/arvr-final.mp4]
    --video ARQ.mp4  video original (com trilha)        [repo/02-ar-vr/caminhoseguro-arvr.mp4]
    --roteiro ARQ.md roteiro das falas                  [ENTREGAS/02-AR-VR/ROTEIRO-NARRACAO-ARVR.md]

O que faz: normaliza cada fala (-16 LUFS), apara silencio, posiciona no inicio de cada
janela (+0,3 s), comprime levemente o tempo (atempo ate 1,08) so se a fala passar da
janela, abaixa a trilha original sob a voz (ducking) e remixa o audio. Video: copy.
Gera tambem arvr-final.srt (legendas) ao lado do mp4, para subir no YouTube.
Reaproveita as funcoes de voz de 01-agile/pitch/montar_pitch.py.
"""
import argparse, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
from scipy.io import wavfile

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]
sys.path.insert(0, str(RAIZ / "repo" / "01-agile" / "pitch"))
import montar_pitch as mp  # noqa: E402

SR = mp.SR
JANELAS = [(0, 6), (6, 20), (20, 32), (32, 48), (48, 55)]   # segundos
INICIO = 0.3          # fala comeca 0,3 s depois do inicio da janela
FOLGA_FIM = 0.15      # sobra minima no fim da janela
TEMPO_MAX = 1.08      # atempo maximo
NIVEL_TRILHA = -26.0  # LUFS maximo da trilha original sem voz
DUCK_DB = -9.0


def ler_falas(caminho):
    falas, atual = {}, None
    for linha in Path(caminho).read_text(encoding="utf-8").splitlines():
        m = re.match(r"^##\s+arvr(\d+)", linha, re.I)
        if m:
            atual = int(m.group(1)); falas[atual] = []; continue
        if linha.startswith("#"):
            atual = None; continue
        if atual and linha.lstrip().startswith(">"):
            t = linha.lstrip()[1:].strip().replace("**", "")
            if t:
                falas[atual].append(t)
    if not falas:
        sys.exit("Roteiro sem falas: esperava '## arvrN' e linhas com '>'.")
    return dict(sorted(falas.items()))


def achar_audio(pasta, n):
    for p in Path(pasta).glob(f"arvr{n}.*"):
        if p.suffix.lower() in (".m4a", ".mp3", ".wav", ".ogg", ".opus", ".aac", ".flac", ".wma", ".mp4", ".webm", ".amr", ".3gp"):
            return p
    return None


def mudar_tempo(x, fator, tmp):
    """atempo (ffmpeg): fator > 1 acelera levemente."""
    a, b = tmp / "t_in.wav", tmp / "t_out.wav"
    wavfile.write(str(a), SR, x.astype(np.float32))
    r = mp.rodar([mp.FFMPEG, "-hide_banner", "-y", "-i", str(a), "-af", f"atempo={fator:.5f}", "-c:a", "pcm_f32le", str(b)])
    if r.returncode != 0:
        sys.exit("ffmpeg (atempo) falhou.")
    return wavfile.read(str(b))[1].astype(np.float32)


def main():
    ap = argparse.ArgumentParser(description="Narra o video de AR-VR.")
    ap.add_argument("--audios", default=str(RAIZ / "ENTREGAS/02-AR-VR/AUDIOS"))
    ap.add_argument("--saida", default=str(RAIZ / "ENTREGAS/02-AR-VR/arvr-final.mp4"))
    ap.add_argument("--video", default=str(RAIZ / "repo/02-ar-vr/caminhoseguro-arvr.mp4"))
    ap.add_argument("--roteiro", default=str(RAIZ / "ENTREGAS/02-AR-VR/ROTEIRO-NARRACAO-ARVR.md"))
    a = ap.parse_args()
    saida = Path(a.saida); saida.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="arvr_"))
    if not Path(a.video).exists():
        sys.exit(f"Video original nao encontrado: {a.video}")

    falas = ler_falas(a.roteiro)
    falta = [n for n in falas if not achar_audio(a.audios, n)]
    if falta:
        sys.exit(f"Faltam audios em {a.audios}: " + ", ".join(f"arvr{n}" for n in falta))
    if max(falas) > len(JANELAS):
        sys.exit("O roteiro tem mais falas que janelas.")

    dur_video = float(mp.rodar([mp.FFMPEG.replace("ffmpeg.exe", "ffprobe.exe"), "-v", "error", "-show_entries", "format=duration",
                                "-of", "default=nw=1:nk=1", a.video]).stdout.decode().strip() or 55)
    n_tot = int(dur_video * SR)
    voz = np.zeros(n_tot, np.float32)
    mp.LEAD, mp.TAIL = 0.05, 0.12   # aparar bem rente: a posicao e controlada aqui
    legendas, avisos = [], []
    for n, frases in falas.items():
        src = achar_audio(a.audios, n)
        w0, w1 = JANELAS[n - 1]
        print(f"arvr{n}: {src.name}  janela {w0}-{w1}s")
        x = mp.normalizar(src, tmp / f"arvr{n}_norm.wav")
        corte, ini, fim, metodo = mp.preparar_cena(x, frases, None, f"arvr{n}")
        disp = (w1 - w0) - INICIO - FOLGA_FIM
        dur = len(corte) / SR
        acao = "ok"
        if dur > disp:   # 1) encurta pausas internas; 2) atempo leve; 3) avisa
            corte, ini, fim, metodo = mp.preparar_cena(x, frases, 0.45, f"arvr{n}")
            dur = len(corte) / SR; acao = "pausas encurtadas"
        if dur > disp:
            f = min(dur / disp, TEMPO_MAX)
            corte = mudar_tempo(corte, f, tmp)
            ini = [t / f for t in ini]; fim = [t / f for t in fim]
            dur = len(corte) / SR; acao = f"tempo x{f:.3f}"
        if dur > disp + 0.05:
            avisos.append(f"arvr{n}: fala com {dur:.1f}s passa {dur - disp:.1f}s da janela ({w1 - w0} s). Grave de novo mais curta.")
        p0 = int((w0 + INICIO) * SR)
        voz[p0:p0 + len(corte)] += corte[:max(0, n_tot - p0)]
        print(f"   fala {dur:.1f}s de {disp:.1f}s disponiveis; {acao}; {metodo}")
        for j, fr in enumerate(frases):
            t0 = w0 + INICIO + ini[j]
            t1 = w0 + INICIO + (ini[j + 1] if j + 1 < len(frases) else fim[j] + 0.4)
            legendas.append((t0, min(t1 - 0.04, t0 + 8), fr))

    # audio original -> ducking sob a voz
    orig = tmp / "orig.wav"
    mp.rodar([mp.FFMPEG, "-hide_banner", "-y", "-i", a.video, "-vn", "-ac", "2", "-ar", str(SR), "-c:a", "pcm_f32le", str(orig)])
    ot = wavfile.read(str(orig))[1].astype(np.float32)
    if ot.ndim == 1:
        ot = np.stack([ot, ot], 1)
    ot = np.pad(ot, ((0, max(0, n_tot - len(ot))), (0, 0)))[:n_tot]
    r = mp.rodar([mp.FFMPEG, "-hide_banner", "-i", str(orig), "-af", "loudnorm=I=-16:print_format=json", "-f", "null", "-"])
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr.decode("utf-8", "ignore"), re.S)
    ganho = 1.0
    if m:
        try:
            li = float(json.loads(m.group(0))["input_i"])
            if li > NIVEL_TRILHA:
                ganho = 10 ** ((NIVEL_TRILHA - li) / 20)
            print(f"Trilha original: {li:.1f} LUFS -> ganho {20 * np.log10(ganho):+.1f} dB (sem voz)")
        except Exception:
            pass
    g = mp.ducking(voz, prof_db=DUCK_DB)
    mix = ot * ganho * g[:, None] + voz[:, None]
    pico = float(np.max(np.abs(mix)))
    if pico > 0.95:
        mix *= 0.95 / pico
    # fade-out curto no fim para nao cortar seco
    fo = int(0.8 * SR); mix[-fo:] *= np.linspace(1, 0, fo, dtype=np.float32)[:, None]
    wavfile.write(str(tmp / "mix.wav"), SR, mix.astype(np.float32))

    srt = "\n".join(f"{k}\n{mp.fmt_srt(t0)} --> {mp.fmt_srt(t1)}\n{t}\n" for k, (t0, t1, t) in enumerate(legendas, 1))
    srt_path = saida.with_suffix(".srt"); srt_path.write_text(srt, encoding="utf-8")

    r = mp.rodar([mp.FFMPEG, "-hide_banner", "-y", "-i", a.video, "-i", str(tmp / "mix.wav"), "-map", "0:v:0", "-map", "1:a:0",
                  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(saida)])
    if r.returncode != 0:
        sys.exit("ffmpeg falhou:\n" + r.stderr.decode("utf-8", "ignore")[-600:])
    shutil.rmtree(tmp, ignore_errors=True)
    for av in avisos:
        print("ATENCAO:", av)
    print(f"Pronto: {saida}\nLegendas: {srt_path}")


if __name__ == "__main__":
    main()
