# Progresso da GS — prazo 19/11/2026 23h55

Atualizado em: 11/11/2026 (todas as disciplinas produzidas; faltam passos humanos)

## Enunciados (04/11/2026)
- `enunciados/GS-CitizenTech-2ES-2026.pdf`: o enunciado COMPLETO, com as 7 disciplinas (já resumido nos REQUISITOS.md).
- `enunciados/GS-lancamento-motivacional-2026.pdf`: só os slides de lançamento (inspiração, exemplos, QR "CitizenTech Studio"). Sem regras novas. Não precisa reler.
- Falta só: critérios de nota do AR-VR (perguntar ao professor). Número da equipe: 1 (definido pela dupla).

## Decisões da equipe (pendente)
- [ ] Integrantes (nome + RM, ordem alfabética) e nome da equipe
- [x] Número da equipe: 1 (X = 1 na rede 192.168.1.0/24)
- [ ] Problema escolhido + cidade/bairro + pessoa real entrevistada
- [ ] Nome da CitizenTech e frase do problema
- [ ] ODS conectados
- [ ] Repositório GitHub criado

## Disciplinas
| Disciplina | Responsável | Status | Próximo passo |
|---|---|---|---|
| 01 Agile | Vitor | PDF pronto (`01-agile/GS-Agile-CaminhoSeguro.pdf`); pitch montado sem narração em `01-agile/pitch/` | gravar narração (Lucas e Vitor), subir no YouTube não listado, colocar link no PDF |
| 02 AR-VR | Vitor | vídeo 3D de 55 s e PDF prontos (`02-ar-vr/`) | subir o vídeo no YouTube e colocar o link no PDF |
| 03 Data Science | Lucas | feito no tema CaminhoSeguro/Bela Vista (base SIMULADA de 600 segmentos, seed 2026): notebook executado sem erro, `entrega-data-science.zip` conferido (notebook, CSV, `integrantes.txt`, `FONTE_DOS_DADOS.txt`, `gerar_base.py`; reexecutado do zero a partir do ZIP, sem erro) | só enviar o ZIP no Teams (um integrante) até 19/11 23h55. Estudar para a defesa: split ANTES do Pipeline (vazamento), imputação mediana/mais frequente, one-hot, MAE/RMSE/R² (teste: 1,76 / 2,66 / 0,67), matriz de confusão, precisão 0,75 / recall 0,44 / F1 0,56 com limiar 0,5, por que baixar o limiar, razão de chances, "E se?" (60 segmentos: 77,5% → 81,4%) e as limitações (dados simulados, causalidade, viés de registro) |
| 04 Database | Vitor | DDL/DML/DQL + PDF prontos (`04-database/`) | refazer o diagrama no Oracle Data Modeler e rodar os scripts no Oracle FIAP |
| 05 DDD Java | Vitor | API + front + 21 testes + PDF prontos (`05-ddd-java/`) | GitHub público, deploy no Render com Oracle FIAP, links no PDF |
| 06 Dynamic Programming | Lucas | feito no tema CaminhoSeguro/Bela Vista (dados simulados): 21 testes OK, `main.py` OK, `entrega-dp.zip` atualizado | só enviar o ZIP no Teams (um integrante) até 19/11 23h55; se a equipe trocar de tema/bairro, editar `dados/bairro.json`, regerar o ZIP e rodar `python -m unittest`. Estudar para a defesa: Dijkstra, Floyd-Warshall (tabulação), memoização em `menor_custo_com_limite`, mochila 0/1 (as duas versões), rota com parada, indicadores e por que a memoização reduz as chamadas |
| 07 Network | Lucas | feito com X=1 (confirmado): .pkt + PDF + 7 testes OK + segurança reforçada + Ficha preenchida (CaminhoSeguro, Bela Vista/SP) | só o envio no Teams/Portal (link do GitHub já está na Ficha; ver "Network — detalhes") |

## Ordem sugerida (dependências)
Ideia/Ficha → 04 Database (modelo) → 05 DDD Java (usa as mesmas tabelas) → resto em paralelo.
Deploy no Render (05) vale 30 pts: não deixar para o último dia.

## Network — detalhes (atualizado em 05/11/2026)
- **Pronto:** `07-network/citizentech-rede.pkt` (rede montada, aba Physical organizada em 2 prédios com salas),
  `07-network/GS-Network-CitizenTech.pdf` (12 págs), prints em `07-network/prints/`, configs em `07-network/configs/x1/`.
- **Decisões tomadas pelo Claude a pedido do Lucas (05/11/2026):** tema **CaminhoSeguro** (calçadas acessíveis e rotas
  seguras), bairro **Bela Vista (São Paulo/SP)**, equipe **1**, persona fictícia dona Maria (72). Aplicado em `dados.json`,
  `index.html`, HTTP do Server-Solucao (`.pkt`), `teste3.png`, PDF, README da raiz e README do Dynamic Programming.
  Os outros integrantes/disciplinas devem usar o mesmo tema e bairro.
- **Falta:**
  1. Repositório criado em 05/11/2026: https://github.com/lucasfbranquinho/citizentech-caminhoseguro (**público**, por
     decisão do Lucas em 05/11/2026; o link já está na Ficha, no `.pkt` e no PDF).
     Se mudar a Ficha: editar `dados.json` e `index.html`, colar o HTML em Server-Solucao → Services → HTTP → index.html
     (Save → Yes), refazer o print do teste 3, salvar o `.pkt` e rodar `python gerar_pdf.py` na pasta `gerador-pdf`.
  2. Decisão do Lucas: usar a personagem fictícia dona Maria (72 anos), já incluída na Ficha, no `.pkt` e no PDF.
  3. Um integrante envia `.pkt` + PDF no Teams/Portal até 19/11/2026 23h55.


## Revisão final das matérias do Lucas (05/11/2026)
Network, DP e Data Science revisados contra o enunciado e corrigidos (ver prompts.md). Arquivos de envio: `Downloads\ENVIAR-Network\` (.pkt + PDF), `06-dynamic-programming/entrega-dp.zip`, `03-data-science/entrega-data-science.zip`. Backups das versões anteriores em `_backup/`. Equipe 1 confirmada pelo Lucas; commit/push feitos.
