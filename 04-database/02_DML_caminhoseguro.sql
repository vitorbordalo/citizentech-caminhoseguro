-- =====================================================================
-- CaminhoSeguro - CitizenTech | Global Solution 2026.2 - FIAP
-- Disciplina: Database Design | Equipe 1 | Turma 2ESPH
-- Integrantes: Lucas Branquinho (RM 562262), Vitor Bordalo (RM 561592)
-- Script 2/3 - DML: dados de exemplo (mínimo 5 linhas por tabela)
--
-- TODOS OS DADOS SÃO SIMULADOS. Nomes de usuários e e-mails são fictícios
-- (domínio de exemplo .example). Locais são referências genéricas do bairro
-- Bela Vista; tempos e riscos são os mesmos usados na disciplina de
-- Dynamic Programming (dados/bairro.json), para as partes conversarem.
-- Rodar depois do 01_DDL_caminhoseguro.sql.
-- =====================================================================

-- ---------------- T_CS_BAIRRO (5) ----------------
INSERT INTO T_CS_BAIRRO (id_bairro, nm_bairro, nm_cidade, sg_uf) VALUES (1, 'Bela Vista', 'São Paulo', 'SP');
INSERT INTO T_CS_BAIRRO (id_bairro, nm_bairro, nm_cidade, sg_uf) VALUES (2, 'Liberdade',  'São Paulo', 'SP');
INSERT INTO T_CS_BAIRRO (id_bairro, nm_bairro, nm_cidade, sg_uf) VALUES (3, 'Consolação', 'São Paulo', 'SP');
INSERT INTO T_CS_BAIRRO (id_bairro, nm_bairro, nm_cidade, sg_uf) VALUES (4, 'República',  'São Paulo', 'SP');
INSERT INTO T_CS_BAIRRO (id_bairro, nm_bairro, nm_cidade, sg_uf) VALUES (5, 'Cambuci',    'São Paulo', 'SP');

-- ---------------- T_CS_TIPO_LOCAL (8) ----------------
INSERT INTO T_CS_TIPO_LOCAL (id_tipo_local, ds_tipo_local) VALUES (1, 'Residência');
INSERT INTO T_CS_TIPO_LOCAL (id_tipo_local, ds_tipo_local) VALUES (2, 'Unidade de saúde');
INSERT INTO T_CS_TIPO_LOCAL (id_tipo_local, ds_tipo_local) VALUES (3, 'Comércio');
INSERT INTO T_CS_TIPO_LOCAL (id_tipo_local, ds_tipo_local) VALUES (4, 'Transporte público');
INSERT INTO T_CS_TIPO_LOCAL (id_tipo_local, ds_tipo_local) VALUES (5, 'Praça ou espaço público');
INSERT INTO T_CS_TIPO_LOCAL (id_tipo_local, ds_tipo_local) VALUES (6, 'Educação e cultura');
INSERT INTO T_CS_TIPO_LOCAL (id_tipo_local, ds_tipo_local) VALUES (7, 'Ponto de apoio comunitário');
INSERT INTO T_CS_TIPO_LOCAL (id_tipo_local, ds_tipo_local) VALUES (8, 'Via ou travessia');

-- ---------------- T_CS_LOCAL (12 na Bela Vista + 1 na Liberdade) ----------------
-- Coordenadas aproximadas da região (apenas para exibir no mapa do protótipo).
INSERT INTO T_CS_LOCAL VALUES (1,  1, 1, 'Casa da dona Maria',   'Rua fictícia, 100 - Bela Vista',   -23.558900, -46.645200, 'N');
INSERT INTO T_CS_LOCAL VALUES (2,  1, 5, 'Praça 14 Bis',         'Praça 14 Bis - Bela Vista',         -23.556800, -46.646500, 'N');
INSERT INTO T_CS_LOCAL VALUES (3,  1, 2, 'Posto de Saúde',       'Endereço de exemplo - Bela Vista', -23.555200, -46.648700, 'S');
INSERT INTO T_CS_LOCAL VALUES (4,  1, 6, 'Escola',               'Endereço de exemplo - Bela Vista', -23.559900, -46.647100, 'N');
INSERT INTO T_CS_LOCAL VALUES (5,  1, 4, 'Metrô Brigadeiro',     'Av. Paulista - Bela Vista',         -23.568300, -46.649600, 'N');
INSERT INTO T_CS_LOCAL VALUES (6,  1, 3, 'Mercado',              'Endereço de exemplo - Bela Vista', -23.557900, -46.649100, 'N');
INSERT INTO T_CS_LOCAL VALUES (7,  1, 7, 'Ponto de Apoio',       'Endereço de exemplo - Bela Vista', -23.556100, -46.650300, 'S');
INSERT INTO T_CS_LOCAL VALUES (8,  1, 6, 'Biblioteca',           'Endereço de exemplo - Bela Vista', -23.561200, -46.651800, 'N');
INSERT INTO T_CS_LOCAL VALUES (9,  1, 8, 'Viaduto',              'Endereço de exemplo - Bela Vista', -23.562500, -46.644900, 'N');
INSERT INTO T_CS_LOCAL VALUES (10, 1, 7, 'Centro Comunitário',   'Endereço de exemplo - Bela Vista', -23.563400, -46.652700, 'S');
INSERT INTO T_CS_LOCAL VALUES (11, 1, 6, 'FIAP Paulista',        'Av. Paulista - Bela Vista',         -23.564000, -46.652500, 'N');
INSERT INTO T_CS_LOCAL VALUES (12, 1, 3, 'Farmácia',             'Endereço de exemplo - Bela Vista', -23.565100, -46.653600, 'N');
INSERT INTO T_CS_LOCAL VALUES (13, 2, 4, 'Metrô Liberdade',      'Praça da Liberdade - Liberdade',    -23.555400, -46.635700, 'N');

-- ---------------- T_CS_TRECHO (21) ----------------
-- (id, origem, destino, tempo_min, risco 0-10, acessível S/N, declividade %, largura calçada m)
INSERT INTO T_CS_TRECHO VALUES (1,  1, 2,  5, 2, 'S',  3.5, 2.30);
INSERT INTO T_CS_TRECHO VALUES (2,  1, 4,  4, 6, 'N',  9.8, 1.10);
INSERT INTO T_CS_TRECHO VALUES (3,  1, 9,  6, 8, 'S',  4.0, 1.60);
INSERT INTO T_CS_TRECHO VALUES (4,  2, 3,  6, 1, 'S',  2.1, 2.80);
INSERT INTO T_CS_TRECHO VALUES (5,  2, 6,  4, 2, 'S',  2.8, 2.40);
INSERT INTO T_CS_TRECHO VALUES (6,  2, 8,  5, 3, 'S',  4.2, 2.00);
INSERT INTO T_CS_TRECHO VALUES (7,  4, 6,  5, 4, 'S',  5.0, 1.80);
INSERT INTO T_CS_TRECHO VALUES (8,  4, 5,  7, 5, 'N', 11.5, 1.20);
INSERT INTO T_CS_TRECHO VALUES (9,  9, 5,  4, 7, 'S',  3.9, 1.50);
INSERT INTO T_CS_TRECHO VALUES (10, 6, 5,  6, 3, 'S',  4.5, 2.20);
INSERT INTO T_CS_TRECHO VALUES (11, 6, 7,  3, 1, 'S',  1.5, 3.00);
INSERT INTO T_CS_TRECHO VALUES (12, 3, 7,  4, 1, 'S',  1.8, 2.60);
INSERT INTO T_CS_TRECHO VALUES (13, 8, 10, 4, 2, 'S',  3.0, 2.10);
INSERT INTO T_CS_TRECHO VALUES (14, 7, 10, 5, 2, 'S',  2.5, 2.50);
INSERT INTO T_CS_TRECHO VALUES (15, 3, 10, 9, 6, 'N', 12.0, 1.00);
INSERT INTO T_CS_TRECHO VALUES (16, 5, 10, 8, 2, 'S',  3.2, 2.70);
INSERT INTO T_CS_TRECHO VALUES (17, 11, 5, 5, 2, 'S',  2.0, 3.50);
INSERT INTO T_CS_TRECHO VALUES (18, 11, 8, 6, 3, 'S',  4.8, 2.20);
INSERT INTO T_CS_TRECHO VALUES (19, 11, 12, 3, 1, 'S', 1.2, 3.20);
INSERT INTO T_CS_TRECHO VALUES (20, 12, 10, 4, 2, 'S', 2.6, 2.40);
INSERT INTO T_CS_TRECHO VALUES (21, 6, 3,  5, 2, 'S',  2.9, 2.30);

-- ---------------- T_CS_USUARIO (7) - fictícios ----------------
INSERT INTO T_CS_USUARIO VALUES (1, 'Maria (persona)',      'maria.persona@caminhoseguro.example',  'IDOSO',    DATE '2026-10-01');
INSERT INTO T_CS_USUARIO VALUES (2, 'João Usuário Teste',   'joao.teste@caminhoseguro.example',     'PCD',      DATE '2026-10-03');
INSERT INTO T_CS_USUARIO VALUES (3, 'Ana Cuidadora Teste',  'ana.teste@caminhoseguro.example',      'CUIDADOR', DATE '2026-10-05');
INSERT INTO T_CS_USUARIO VALUES (4, 'Pedro Morador Teste',  'pedro.teste@caminhoseguro.example',    'MORADOR',  DATE '2026-10-03');
INSERT INTO T_CS_USUARIO VALUES (5, 'Carla Agente Teste',   'carla.teste@caminhoseguro.example',    'AGENTE',   DATE '2026-10-08');
INSERT INTO T_CS_USUARIO VALUES (6, 'Rosa Idosa Teste',     'rosa.teste@caminhoseguro.example',     'IDOSO',    DATE '2026-10-12');
INSERT INTO T_CS_USUARIO VALUES (7, 'Bruno Morador Teste',  'bruno.teste@caminhoseguro.example',    'MORADOR',  DATE '2026-10-17');

-- ---------------- T_CS_TIPO_OCORRENCIA (6) ----------------
INSERT INTO T_CS_TIPO_OCORRENCIA VALUES (1, 'Buraco ou piso quebrado',        4);
INSERT INTO T_CS_TIPO_OCORRENCIA VALUES (2, 'Calçada estreita ou obstruída',  3);
INSERT INTO T_CS_TIPO_OCORRENCIA VALUES (3, 'Esquina sem rampa',              4);
INSERT INTO T_CS_TIPO_OCORRENCIA VALUES (4, 'Iluminação ruim',                3);
INSERT INTO T_CS_TIPO_OCORRENCIA VALUES (5, 'Travessia perigosa',             5);
INSERT INTO T_CS_TIPO_OCORRENCIA VALUES (6, 'Ladeira muito íngreme',          2);

-- ---------------- T_CS_OCORRENCIA (10) ----------------
-- (id, trecho, usuário, tipo, descrição, gravidade, status, registro, resolução)
INSERT INTO T_CS_OCORRENCIA VALUES (1,  2, 1, 3, 'Esquina da escola sem rampa, precisei descer pela rua.',        4, 'ABERTA',     DATE '2026-10-02', NULL);
INSERT INTO T_CS_OCORRENCIA VALUES (2,  3, 4, 5, 'Carros em alta velocidade perto do viaduto, sem faixa.',          5, 'EM_ANALISE', DATE '2026-10-04', NULL);
INSERT INTO T_CS_OCORRENCIA VALUES (3,  8, 2, 6, 'Subida muito forte para cadeira de rodas.',                      3, 'ABERTA',     DATE '2026-10-06', NULL);
INSERT INTO T_CS_OCORRENCIA VALUES (4,  15, 3, 1, 'Piso solto em frente ao número 200.',                           4, 'RESOLVIDA',  DATE '2026-10-07', DATE '2026-10-21');
INSERT INTO T_CS_OCORRENCIA VALUES (5,  9, 5, 4, 'Poste apagado, trecho escuro à noite.',                          3, 'RESOLVIDA',  DATE '2026-10-09', DATE '2026-10-16');
INSERT INTO T_CS_OCORRENCIA VALUES (6,  2, 6, 2, 'Mesas de bar ocupando a calçada.',                               3, 'ABERTA',     DATE '2026-10-13', NULL);
INSERT INTO T_CS_OCORRENCIA VALUES (7,  3, 1, 4, 'Iluminação fraca na passagem do viaduto.',                       3, 'ABERTA',     DATE '2026-10-15', NULL);
INSERT INTO T_CS_OCORRENCIA VALUES (8,  7, 7, 1, 'Buraco grande perto do mercado.',                                4, 'EM_ANALISE', DATE '2026-10-18', NULL);
INSERT INTO T_CS_OCORRENCIA VALUES (9,  15, 2, 3, 'Sem rampa na esquina do posto de saúde.',                       4, 'ABERTA',     DATE '2026-10-22', NULL);
INSERT INTO T_CS_OCORRENCIA VALUES (10, 8, 3, 5, 'Semáforo de pedestres muito curto.',                             5, 'ABERTA',     DATE '2026-10-25', NULL);

-- ---------------- T_CS_ROTA_CONSULTA (8) ----------------
-- (id, usuário, origem, destino, critério, tempo total, data)
INSERT INTO T_CS_ROTA_CONSULTA VALUES (1, 1, 1, 3,  'ACESSIVEL', 11, DATE '2026-10-02');
INSERT INTO T_CS_ROTA_CONSULTA VALUES (2, 1, 1, 6,  'ACESSIVEL',  9, DATE '2026-10-05');
INSERT INTO T_CS_ROTA_CONSULTA VALUES (3, 2, 2, 5,  'ACESSIVEL', 10, DATE '2026-10-06');
INSERT INTO T_CS_ROTA_CONSULTA VALUES (4, 4, 1, 5,  'RAPIDA',    10, DATE '2026-10-08');
INSERT INTO T_CS_ROTA_CONSULTA VALUES (5, 3, 1, 10, 'SEGURA',    14, DATE '2026-10-11');
INSERT INTO T_CS_ROTA_CONSULTA VALUES (6, 6, 2, 12, 'ACESSIVEL', 13, DATE '2026-10-14');
INSERT INTO T_CS_ROTA_CONSULTA VALUES (7, 1, 1, 7,  'SEGURA',    12, DATE '2026-10-19');
INSERT INTO T_CS_ROTA_CONSULTA VALUES (8, 7, 11, 3, 'RAPIDA',    16, DATE '2026-10-23');

COMMIT;

-- Observação: os IDs foram informados explicitamente para que as chaves
-- estrangeiras fiquem previsíveis. Como as colunas são IDENTITY "BY DEFAULT",
-- os próximos registros inseridos pela API devem começar após o maior ID.
-- O ajuste abaixo reinicia cada identity a partir do próximo valor livre.
ALTER TABLE T_CS_BAIRRO          MODIFY id_bairro          GENERATED BY DEFAULT AS IDENTITY (START WITH LIMIT VALUE);
ALTER TABLE T_CS_TIPO_LOCAL      MODIFY id_tipo_local      GENERATED BY DEFAULT AS IDENTITY (START WITH LIMIT VALUE);
ALTER TABLE T_CS_LOCAL           MODIFY id_local           GENERATED BY DEFAULT AS IDENTITY (START WITH LIMIT VALUE);
ALTER TABLE T_CS_TRECHO          MODIFY id_trecho          GENERATED BY DEFAULT AS IDENTITY (START WITH LIMIT VALUE);
ALTER TABLE T_CS_USUARIO         MODIFY id_usuario         GENERATED BY DEFAULT AS IDENTITY (START WITH LIMIT VALUE);
ALTER TABLE T_CS_TIPO_OCORRENCIA MODIFY id_tipo_ocorrencia GENERATED BY DEFAULT AS IDENTITY (START WITH LIMIT VALUE);
ALTER TABLE T_CS_OCORRENCIA      MODIFY id_ocorrencia      GENERATED BY DEFAULT AS IDENTITY (START WITH LIMIT VALUE);
ALTER TABLE T_CS_ROTA_CONSULTA   MODIFY id_consulta        GENERATED BY DEFAULT AS IDENTITY (START WITH LIMIT VALUE);
