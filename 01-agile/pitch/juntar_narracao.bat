@echo off
setlocal
REM ======================================================================
REM  juntar_narracao.bat  -  junta a narracao de voces ao video do pitch
REM
REM  COMO USAR (coloque os audios nesta mesma pasta):
REM    1 arquivo  (voces dois, ou so um, do comeco ao fim do video):
REM        juntar_narracao.bat narracao.m4a
REM    2 arquivos (um por pessoa; cada um gravado com a duracao do video
REM                inteiro, em silencio nos trechos do outro):
REM        juntar_narracao.bat lucas.m4a vitor.m4a
REM    Tambem da para arrastar o(s) arquivo(s) de audio em cima deste .bat.
REM    Formatos aceitos: m4a, mp3, wav, aac, ogg...
REM
REM  O QUE FAZ:
REM    - Usa pitch-sem-narracao.mp4 (video ja legendado, com a trilha).
REM    - Normaliza o volume da voz (loudnorm, -16 LUFS), cada pessoa em separado.
REM    - Baixa a trilha para 60% do volume e mistura com a voz.
REM    - Copia o video sem recodificar e grava pitch-final.mp4 nesta pasta.
REM    - Corta no fim do video (2:55). Audio mais longo e cortado; mais curto
REM      fica em silencio no final.
REM
REM  FFMPEG: usa o da pasta _ferramentas do projeto (caminho relativo). Se nao
REM  existir, usa o ffmpeg instalado no PATH do Windows.
REM ======================================================================

set "AQUI=%~dp0"
set "FF=%AQUI%..\..\..\_ferramentas\ffmpeg\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe"
if not exist "%FF%" set "FF=ffmpeg"
set "VIDEO=%AQUI%pitch-sem-narracao.mp4"
set "SAIDA=%AQUI%pitch-final.mp4"

if "%~1"=="" goto uso
if not exist "%VIDEO%" (
  echo Nao achei pitch-sem-narracao.mp4 nesta pasta.
  exit /b 1
)
if not exist "%~1" (
  echo Nao achei o arquivo de audio: %~1
  exit /b 1
)

if not "%~2"=="" goto doisarquivos

echo Juntando 1 narracao: %~1
"%FF%" -hide_banner -loglevel error -y -i "%VIDEO%" -i "%~1" -filter_complex "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,apad[n];[0:a]volume=0.6[m];[m][n]amix=inputs=2:duration=first:normalize=0:dropout_transition=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "%SAIDA%"
goto fim

:doisarquivos
if not exist "%~2" (
  echo Nao achei o arquivo de audio: %~2
  exit /b 1
)
echo Juntando 2 narracoes: %~1 + %~2
"%FF%" -hide_banner -loglevel error -y -i "%VIDEO%" -i "%~1" -i "%~2" -filter_complex "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,apad[n1];[2:a]loudnorm=I=-16:TP=-1.5:LRA=11,apad[n2];[0:a]volume=0.6[m];[m][n1][n2]amix=inputs=3:duration=first:normalize=0:dropout_transition=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "%SAIDA%"
goto fim

:fim
if errorlevel 1 (
  echo Deu erro ao gerar o video. Confira os arquivos de audio.
  exit /b 1
)
echo.
echo Pronto: %SAIDA%
exit /b 0

:uso
echo.
echo Uso:  juntar_narracao.bat narracao.m4a
echo   ou: juntar_narracao.bat lucas.m4a vitor.m4a
echo Coloque os audios nesta pasta. Gera pitch-final.mp4.
exit /b 1
