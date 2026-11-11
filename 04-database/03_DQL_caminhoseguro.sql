-- =====================================================================
-- CaminhoSeguro - CitizenTech | Global Solution 2026.2 - FIAP
-- Disciplina: Database Design | Equipe 1 | Turma 2ESPH
-- Integrantes: Lucas Branquinho (RM 562262), Vitor Bordalo (RM 561592)
-- Script 3/3 - DQL: consultas pedidas no enunciado
-- Rodar depois do DDL e do DML.
-- =====================================================================

-- ---------------------------------------------------------------------
-- CONSULTA 1 (INNER JOIN entre duas tabelas)
-- Pergunta: quais locais do bairro são pontos de apoio (onde a pessoa pode
-- descansar, beber água e usar o Wi-Fi público) e de que tipo eles são?
-- Tabelas: T_CS_LOCAL x T_CS_TIPO_LOCAL
-- ---------------------------------------------------------------------
SELECT l.id_local,
       l.nm_local,
       t.ds_tipo_local,
       l.ds_endereco
  FROM T_CS_LOCAL l
 INNER JOIN T_CS_TIPO_LOCAL t
    ON t.id_tipo_local = l.id_tipo_local
 WHERE l.st_ponto_apoio = 'S'
 ORDER BY l.nm_local;

-- ---------------------------------------------------------------------
-- CONSULTA 2 (INNER JOIN + função de grupo + GROUP BY)
-- Pergunta: quais tipos de problema a comunidade mais registra e qual a
-- gravidade média de cada um? Ajuda a subprefeitura a priorizar obras.
-- Tabelas: T_CS_OCORRENCIA x T_CS_TIPO_OCORRENCIA
-- ---------------------------------------------------------------------
SELECT t.ds_tipo_ocorrencia,
       COUNT(o.id_ocorrencia)        AS qt_ocorrencias,
       ROUND(AVG(o.nr_gravidade), 2) AS media_gravidade,
       MAX(o.dt_registro)            AS ultimo_registro
  FROM T_CS_OCORRENCIA o
 INNER JOIN T_CS_TIPO_OCORRENCIA t
    ON t.id_tipo_ocorrencia = o.id_tipo_ocorrencia
 GROUP BY t.ds_tipo_ocorrencia
 ORDER BY qt_ocorrencias DESC, media_gravidade DESC;

-- ---------------------------------------------------------------------
-- CONSULTA 3 (LEFT OUTER JOIN + WHERE + ORDER BY)
-- Pergunta: quais locais da Bela Vista já foram destino de uma rota pedida
-- no app, e quais NUNCA foram (aparecem com a consulta vazia graças ao
-- LEFT JOIN)? Mostra onde divulgar a solução ou se faltam trechos no mapa.
-- Tabelas: T_CS_LOCAL x T_CS_ROTA_CONSULTA
-- ---------------------------------------------------------------------
SELECT l.id_local,
       l.nm_local,
       r.id_consulta,
       NVL(r.tp_criterio, 'NUNCA PEDIDO') AS tp_criterio,
       r.dt_consulta
  FROM T_CS_LOCAL l
  LEFT OUTER JOIN T_CS_ROTA_CONSULTA r
    ON r.id_local_destino = l.id_local
 WHERE l.id_bairro = 1
 ORDER BY r.id_consulta NULLS FIRST, l.nm_local;
