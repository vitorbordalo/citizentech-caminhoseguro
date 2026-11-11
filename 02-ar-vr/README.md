# CaminhoSeguro — experiência 3D (AR-VR Modelling And Simulation)

Vídeo 3D de 55 s sobre o **CaminhoSeguro**, a CitizenTech da Equipe 1 (Lucas Branquinho e Vitor Bordalo):
rotas acessíveis para idosos e pessoas com mobilidade reduzida no bairro Bela Vista (São Paulo).
A persona (fictícia) é a dona Maria, 72 anos, que quer ir sozinha de casa ao Posto de Saúde.

Arquivo final: `caminhoseguro-arvr.mp4` (1920x1080, 30 fps, 55 s, com trilha sintetizada).

## O que o vídeo mostra
| Tempo | Cena |
|---|---|
| 0–6 s | Título "CaminhoSeguro — uma CitizenTech da Bela Vista" sobre a vista aérea de um quarteirão 3D (ruas, calçadas, prédios, árvores, faixas de pedestres, uma ladeira). Locais rotulados: Casa da dona Maria, Mercado, Praça 14 Bis, Posto de Saúde. |
| 6–20 s | A câmera desce até a calçada e acompanha a dona Maria saindo de casa pelo caminho direto. Quatro barreiras ganham marcadores 3D vermelhos com rótulo: buraco na calçada, esquina sem rampa, ladeira muito íngreme, poste apagado. |
| 20–32 s | "A comunidade avisa": os marcadores viram alertas ("aviso de moradores") com ondas no chão, e o caminho rápido, mas perigoso, é desenhado em vermelho e marcado como "EVITAR". |
| 32–48 s | O app calcula a rota acessível: linha verde animada no chão, passando por rampas, faixa com semáforo (que abre para pedestres) e o Ponto de Apoio (banco, água e Wi-Fi). A dona Maria percorre o trajeto; o painel mostra "Rota mais acessível · 11 min · 0 barreiras". |
| 48–55 s | Chegada ao Posto de Saúde, a câmera sobe e o encerramento traz "Rotas acessíveis, decididas com a comunidade", ODS 3, 10 e 11 e a equipe. |

Textos grandes, em alto contraste, sempre sobre painéis escuros (o vídeo também trata de acessibilidade).
Os "11 min" e "0 barreiras" são os valores da simulação da história, não medições reais.

## Como foi feito
- **three.js r160** (`cena/lib/three.module.min.js`), carregado por import map. Sem build, sem npm.
- **Geometria 100% procedural** (caixas, cilindros, cones, extrusão da ladeira); nenhum modelo externo, nenhuma marca real.
- Iluminação hemisférica + sol direcional com sombras, céu em gradiente e névoa leve.
- Rótulos 3D: `Sprite` com `CanvasTexture`. HUD, legendas e cartela final: segundo canvas 2D sobreposto.
- **Renderização determinística**: `window.renderFrame(tSegundos)` posiciona câmera, avatar, marcadores e linhas só em função de `t`
  (sem relógio nem `requestAnimationFrame`). O mesmo código serve ao vídeo e à cena interativa.
- `cena/gravar.mjs` (Node 24, sem dependências) sobe um servidor estático, abre o Chrome headless (SwiftShader) via
  Chrome DevTools Protocol, captura 1650 quadros PNG (30 fps) em paralelo e monta o MP4 com ffmpeg (libx264, crf 18).
  A trilha (pads suaves e sinais de aviso/sucesso) é sintetizada pelo próprio script em `cena/trilha.wav`; nenhuma música de terceiros.

## Cena interativa (opcional)
Sirva a pasta `cena/` com qualquer servidor estático e abra no navegador. Exemplo sem instalar nada:

```
cd cena
node gravar.mjs --servir     # abre em http://127.0.0.1:8765/
```

A animação roda em tempo real em loop. **Arraste** para girar a câmera, **roda do mouse** para aproximar, **espaço** pausa,
**setas** avançam/voltam 3 s, **duplo clique** reinicia a câmera.

## Como regravar
```
cd cena
node gravar.mjs                      # renderiza tudo e gera ../caminhoseguro-arvr.mp4
node gravar.mjs --teste=3,17,40      # só alguns instantes, em quadros-teste/
node gravar.mjs --workers=6          # mais instâncias de Chrome em paralelo
node gravar.mjs --retomar            # continua se algum quadro já existir
node gravar.mjs --so-video           # remonta o MP4 a partir de frames/
```
Requisitos: Chrome em `C:\Program Files\Google\Chrome\Application\chrome.exe` e ffmpeg no caminho definido no topo de `gravar.mjs`.
`cena/quadros-chave/` guarda 4 quadros para o PDF.
