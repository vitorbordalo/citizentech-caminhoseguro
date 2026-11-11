# CaminhoSeguro: decisões de UX e acessibilidade

Protótipo web estático (HTML, CSS e JS puros). Persona principal: dona Maria, 72 anos, que quer ir sozinha ao posto de saúde e ao mercado. Públicos secundários: cuidadores e o agente da subprefeitura. Todos os dados são fictícios. Prints em `prints/` (celular 390 px e desktop 1280 px).

## Princípios gerais (valem para as 4 telas)
- **Celular primeiro (360 px).** Uma coluna, nada de rolagem lateral. No desktop o conteúdo se reorganiza em duas colunas, sem mudar a lógica.
- **Letra grande:** base de 20 px; nada abaixo de 18 px. Títulos de 30 a 45 px.
- **Contraste:** texto principal `#111b24` sobre `#f6f3ec` ou branco (acima de 15:1, nível AAA). Texto secundário acima de 9:1. Azul-petróleo `#0b4a6f` (9,6:1 sobre branco) como cor principal, âmbar `#ffc13b` só como destaque da ação principal e sempre com texto escuro.
- **Alvos de toque:** botões e campos com no mínimo 56 px de altura (o enunciado pede 48 px). Opções (critério, tipo, gravidade) são cartões inteiros clicáveis.
- **Sem depender de cor:** todo estado tem ícone e texto (Aberta, Em análise, Resolvida; acessível ou não; "Ponto de apoio"). A cor só reforça.
- **Teclado e foco:** link "Pular para o conteúdo", foco com anel duplo (escuro e âmbar) visível em fundo claro e escuro, ordem de tabulação igual à ordem visual, opções de rádio navegáveis com setas.
- **Leitor de tela:** todos os campos têm `<label>`; ícones decorativos são `aria-hidden`; resultados e erros em regiões `aria-live`/`role="alert"`; o foco vai para o título quando o resultado ou a confirmação aparecem.
- **Linguagem simples:** frases curtas, verbos de ação ("Ver caminho", "Enviar aviso"), sem sigla nem termo técnico. Erros dizem o que aconteceu e o que fazer.
- **Movimento:** quase nada anima; `prefers-reduced-motion` desliga até o indicador de carregando.
- **Identidade:** nome CaminhoSeguro, logotipo em SVG inline (pino com sinal de certo, em âmbar e azul-petróleo), tom calmo e acolhedor. Não parece template: o caminho é mostrado como uma linha pontilhada ligando locais numerados.
- **Modo demonstração:** se a API não responder, o front usa dados simulados do mesmo conjunto do banco, com o mesmo cálculo de rota do contrato, e mostra o selo "Modo demonstração". O usuário logado é simulado (Maria).

## Tela 1: Início ("Para onde você quer ir?") (`index.html`)
- **Objetivo:** levar a pessoa de zero até pedir uma rota em poucos toques.
- **Para quem:** dona Maria e qualquer morador; é a porta de entrada.
- **Decisões de UX:**
  - Uma ação principal por tela: o botão âmbar "Ver caminho", largura total.
  - Pergunta em linguagem de conversa ("De onde você sai? / Para onde você vai?"), com listas de lugares em vez de digitar endereço (menos erro, bom para quem tem dificuldade de digitar).
  - Três critérios como cartões grandes com ícone e uma linha de explicação. **"Mais acessível" vem marcado por padrão**, porque é o que o público principal precisa; os outros dois são uma escolha consciente.
  - Três pontos curtos explicam o valor do app sem texto longo.
- **Acessibilidade:** `<label>` em cada seleção; validação própria com mensagem junto do campo e resumo em `role="alert"`; o foco vai ao primeiro campo com problema; destino igual à origem é bloqueado com texto claro. Nenhuma cor sozinha indica erro (ícone e frase).

## Tela 2: Resultado do caminho (`rota.html?origem=1&destino=3&criterio=ACESSIVEL`)
- **Objetivo:** mostrar o caminho de forma que dê para seguir andando, e deixar claro quanto tempo leva e se há risco.
- **Para quem:** dona Maria no dia a dia; cuidadores que combinam o trajeto com ela.
- **Decisões de UX:**
  - **Lista numerada grande** com os locais em sequência ("Você sai de", "Passe por", "Você chega em"), ligados por linha pontilhada. Cada trecho mostra tempo e se é acessível.
  - **Tempo total em destaque**, com selo do critério usado e selo "Totalmente acessível" (ícone de certo, verde) ou "Não é totalmente acessível" (ícone de alerta, âmbar), com aviso em texto e atalho para a versão mais acessível.
  - **Pontos de apoio destacados** no próprio passo (etiqueta âmbar com coração: "dá para descansar e pedir ajuda") e resumidos no cartão lateral. Pensado para quem precisa parar no caminho.
  - Avisos abertos da comunidade aparecem no trecho afetado, mostrando que o relato de moradores entra no cálculo.
  - **Sem rota (404):** mensagem amigável com o motivo, o que fazer (outro tipo de caminho com cuidado, ou outro destino) e botões para tentar. Nada de tela de erro técnica. Origem igual a destino (422) e falha de rede também têm texto próprio.
  - Ação secundária bem visível: "Avisar um problema neste caminho", que leva os trechos da rota para a tela 3.
- **Acessibilidade:** a região do resultado é `aria-live="polite"` e o foco vai para o título ao carregar; cada passo tem "Passo N" para leitor de tela; informação de acessibilidade nunca depende só de cor.

## Tela 3: Registrar problema (`ocorrencia.html`)
- **Objetivo:** permitir que qualquer pessoa registre um problema de calçada em menos de um minuto, alimentando o cálculo das rotas.
- **Para quem:** moradores, idosos, cuidadores.
- **Decisões de UX:**
  - **Trecho pré-selecionado** quando a pessoa vem do resultado da rota; os trechos do caminho aparecem primeiro, num grupo "Neste caminho".
  - **Tipo de problema em botões grandes com ícone** (buraco, calçada estreita, esquina sem rampa, iluminação, travessia, ladeira), dois ou três por linha, reconhecíveis sem ler.
  - **Gravidade de 1 a 5 em palavras** ("Incomoda um pouco" a "Perigoso"), com número visível. Ao escolher o tipo, sugerimos a gravidade padrão daquele tipo, que a pessoa pode mudar.
  - Descrição **opcional**, dita como tal; só três campos são obrigatórios.
  - **Confirmação clara** ao enviar: ícone de certo, "Aviso enviado. Obrigada, Maria!", resumo do que foi enviado e próximos passos (voltar ao início ou avisar outro). Se falhar, o que a pessoa preencheu fica na tela.
- **Acessibilidade:** `<fieldset>` e `<legend>` para os grupos de rádio; erro junto de cada grupo e resumo em `role="alert"`; foco no primeiro problema; botão muda para "Enviando..." e fica desativado para evitar envio duplicado; a confirmação recebe o foco e é anunciada.

## Tela 4: Painel do agente público (`painel.html`)
- **Objetivo:** dar ao agente da subprefeitura uma visão rápida do que precisa de ação e um jeito simples de atualizar a situação.
- **Para quem:** agente público (secundário), que também pode ser acompanhado por cuidadores e moradores interessados.
- **Decisões de UX:**
  - **Três contadores** no topo (abertos, em análise, resolvidos), com ícone, número grande e borda de cor diferente. Respondem "o que está pendente?" em um olhar.
  - **Filtro por situação** com um único campo; a lista vem ordenada com abertos primeiro e, dentro deles, os mais graves.
  - Cada aviso é um cartão com tipo, situação e gravidade (ícone e texto), trecho em palavras (origem para destino), data e descrição. A faixa lateral colorida reforça, mas não é a única pista.
  - **Mudar a situação** com um campo e botão "Salvar" no próprio cartão; o resultado é confirmado em mensagem e os contadores atualizam na hora. Ao resolver, a data de resolução é preenchida.
  - Estado vazio do filtro explica o que fazer ("Escolha 'Todos'").
- **Acessibilidade:** os contadores e as mensagens de confirmação ficam em regiões `aria-live`; após salvar, o foco volta ao botão do cartão alterado; tabelas foram evitadas em favor de cartões, que funcionam melhor em tela pequena e com leitor de tela.

## Limites assumidos do protótipo
- Sem login real (usuário Maria simulado) e sem mapa: o caminho é descrito em lista, que é mais confiável para o público principal.
- Os tempos mostrados são os cadastrados nos trechos; não há medição real de calçada.
- Contraste, tamanhos e navegação por teclado foram conferidos nos prints e no código; uma validação com idosos reais fica como próximo passo.
