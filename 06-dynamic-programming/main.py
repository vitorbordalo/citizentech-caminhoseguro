"""CaminhoSeguro (CitizenTech) - Dynamic Programming: rotas seguras/acessíveis e orçamento ótimo.

Uso:
    python main.py                      -> roda todos os casos de exemplo
    python main.py --menu               -> menu interativo
    python main.py --rota Casa_Dona_Maria Posto_de_Saude --perfil acessivel
    python main.py --rota Casa_Dona_Maria Metro_Brigadeiro --parada Farmacia
    python main.py --orcamento 30       -> mochila com outro orçamento (mil R$)
    python main.py --dados outro.json   -> usa outro arquivo de dados
"""
import argparse
import sys

import indicadores
from eficiencia import (comparar_mochila, comparar_rotas, escalabilidade_grafo,
                        escalabilidade_mochila, imprimir_escala_grafo,
                        imprimir_escala_mochila, imprimir_tabela)
from grafo import CAMINHO_PADRAO, PERFIS, carregar_dados, montar_grafo, nome_legivel
from orcamento import aplicar_melhorias, mochila_memoizacao, mochila_tabulacao
from rotas import (INFINITO, caminho_floyd, floyd_warshall, melhor_rota,
                   menor_custo_com_limite, ranking_pontos_de_apoio, rota_com_parada)

ORIGEM = "Casa_Dona_Maria"  # persona fictícia: dona Maria, 72 anos
# Locais usados nos exemplos prontos (existem no bairro.json; outro arquivo pode não ter).
LOCAIS_DEMO = (ORIGEM, "Metro_Brigadeiro", "Escola", "Posto_de_Saude", "FIAP_Paulista",
               "Farmacia", "Centro_Comunitario")


def tem_locais_demo(grafo):
    return all(local in grafo.adj for local in LOCAIS_DEMO)


def titulo(texto):
    print("\n" + "=" * 64)
    print(texto)
    print("=" * 64)


def formatar_caminho(caminho):
    return " > ".join(nome_legivel(p) for p in caminho)


def mostrar_rota(grafo, origem, destino, perfil):
    custo, caminho = melhor_rota(grafo, origem, destino, perfil)
    cab = f"  [{perfil}] {nome_legivel(origem)} -> {nome_legivel(destino)}"
    if caminho is None:
        print(f"{cab}: SEM ROTA possível neste perfil")
    else:
        print(f"{cab}: custo {custo} | {formatar_caminho(caminho)}")


def mostrar_indicadores(rotulo, grafo):
    r = indicadores.resumo(grafo)
    print(f"  {rotulo:<8} trechos acessíveis: {r['trechos_acessiveis_%']:.0f}% | "
          f"pares de locais com rota acessível: {r['pares_com_rota_acessivel_%']:.0f}% | "
          f"custo médio da rota acessível: {r['custo_medio_rota_acessivel']:.1f}")


# ------------------------------------------------------------------ demos
def demo_rotas(grafo):
    titulo("1) ROTAS (Dijkstra): mesma viagem, perfis diferentes")
    for destino in ("Metro_Brigadeiro", "Escola"):
        for perfil in PERFIS:
            mostrar_rota(grafo, ORIGEM, destino, perfil)
    print("  ('rapida' ignora o risco; 'segura' evita o Viaduto; 'acessivel' também evita escadas)")


def demo_floyd(grafo):
    titulo("2) TABULAÇÃO: Floyd-Warshall (todos os pares, perfil acessivel)")
    dist, proximo = floyd_warshall(grafo, "acessivel")
    for d in ("Posto_de_Saude", "Escola", "FIAP_Paulista"):
        print(f"  Custo {nome_legivel(ORIGEM)} -> {nome_legivel(d)}: {dist[ORIGEM][d]}")
    print("  Caminho até a Escola:", formatar_caminho(caminho_floyd(proximo, ORIGEM, "Escola")))
    custo, caminho = rota_com_parada(dist, proximo, ORIGEM, "Farmacia", "Metro_Brigadeiro")
    print(f"  Passando na Farmácia até o Metrô: custo {custo} | {formatar_caminho(caminho)}")
    print("  Melhores lugares para um ponto de apoio (menor soma de custos até os demais):")
    for soma, local in ranking_pontos_de_apoio(dist, grafo.locais)[:3]:
        print(f"    - {nome_legivel(local)} (soma {soma})")


def demo_memoizacao(grafo):
    titulo("3) MEMOIZAÇÃO: rota com no máximo k trechos (perfil segura)")
    for k in (1, 2, 3, 4):
        custo = menor_custo_com_limite(grafo, ORIGEM, "Posto_de_Saude", "segura", k)
        texto = "impossível" if custo == INFINITO else f"custo {custo}"
        print(f"  Casa Dona Maria -> Posto de Saude com até {k} trecho(s): {texto}")


def demo_orcamento(dados, grafo, orcamento):
    titulo(f"4) ORÇAMENTO ÓTIMO (mochila 0/1) com R$ {orcamento} mil")
    melhorias = dados.get("melhorias", [])
    # Orçamento acima do custo de TODAS as melhorias não muda a resposta; limitar evita
    # uma tabela gigante (e memória estourada) se alguém digitar um valor enorme.
    orcamento_util = min(orcamento, sum(m["custo"] for m in melhorias))
    ben_tab, escolhidas = mochila_tabulacao(melhorias, orcamento_util)
    ben_memo, _ = mochila_memoizacao(melhorias, orcamento_util)
    print(f"  Benefício máximo: {ben_tab} pessoas (tabulação) | {ben_memo} (memoização)")
    gasto = sum(m["custo"] for m in escolhidas)
    print(f"  Gasto: R$ {gasto} mil de R$ {orcamento} mil. Melhorias escolhidas:")
    for m in escolhidas:
        print(f"    - {m['nome']} (custo {m['custo']}, benefício {m['beneficio']})")

    novo = aplicar_melhorias(grafo, escolhidas)
    titulo("5) IMPACTO: o bairro ANTES e DEPOIS das melhorias")
    if tem_locais_demo(grafo):  # rotas de exemplo só existem no bairro.json
        mostrar_rota(grafo, ORIGEM, "Metro_Brigadeiro", "acessivel")
        mostrar_rota(novo, ORIGEM, "Metro_Brigadeiro", "acessivel")
        mostrar_rota(grafo, ORIGEM, "Escola", "acessivel")
        mostrar_rota(novo, ORIGEM, "Escola", "acessivel")
    mostrar_indicadores("antes:", grafo)
    mostrar_indicadores("depois:", novo)


def demo_eficiencia(dados, grafo):
    titulo("6) EFICIÊNCIA: com e sem memoização")
    imprimir_tabela("Rota Casa Dona Maria -> Centro Comunitario, até 12 trechos:",
                    comparar_rotas(grafo, ORIGEM, "Centro_Comunitario", "segura", 12),
                    "chamadas")
    print()
    imprimir_tabela(f"Mochila do bairro ({len(dados['melhorias'])} melhorias, "
                    f"orçamento {dados['orcamento_mil_reais']}):",
                    comparar_mochila(dados["melhorias"], dados["orcamento_mil_reais"]),
                    "chamadas/células")
    print()
    imprimir_escala_mochila(escalabilidade_mochila())
    print("  -> sem memoização as chamadas dobram a cada item (2^n); memoização e")
    print("     tabulação crescem só com n x orçamento.")
    print()
    imprimir_escala_grafo(escalabilidade_grafo())
    print("  -> Floyd-Warshall cresce com V^3; para UMA origem, Dijkstra é bem mais barato.")


def demo_completa(dados, grafo):
    demo_rotas(grafo)
    demo_floyd(grafo)
    demo_memoizacao(grafo)
    demo_orcamento(dados, grafo, dados["orcamento_mil_reais"])
    demo_eficiencia(dados, grafo)


# ------------------------------------------------------------------- menu
def menu(dados, grafo):
    opcoes = """
  1) Rota entre dois locais        4) Rota com no máximo k trechos
  2) Rota passando por uma parada  5) Orçamento ótimo (mochila)
  3) Ponto de apoio ideal          6) Comparar eficiência
  0) Sair"""
    while True:
        print(opcoes)
        try:
            escolha = input("Escolha: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return  # fim da entrada ou Ctrl+C: sai do menu sem erro
        try:
            if escolha == "0":
                return
            elif escolha in ("1", "2", "4"):
                print("Locais:", ", ".join(grafo.locais))
                origem = pedir_local(grafo, "Origem: ")
                destino = pedir_local(grafo, "Destino: ")
                perfil = input(f"Perfil {list(PERFIS)} [acessivel]: ").strip() or "acessivel"
                if perfil not in PERFIS:
                    print("Perfil inválido.")
                elif escolha == "1":
                    mostrar_rota(grafo, origem, destino, perfil)
                elif escolha == "2":
                    parada = pedir_local(grafo, "Parada: ")
                    dist, proximo = floyd_warshall(grafo, perfil)
                    custo, caminho = rota_com_parada(dist, proximo, origem, parada, destino)
                    print("  SEM ROTA" if caminho is None
                          else f"  custo {custo} | {formatar_caminho(caminho)}")
                else:
                    k = pedir_inteiro("Máximo de trechos: ")
                    # Com custos não negativos, a melhor rota nunca precisa de mais que (locais - 1)
                    # trechos. Limitar k dá o mesmo resultado e evita recursão profunda demais.
                    if k > len(grafo.locais) - 1:
                        k = len(grafo.locais) - 1
                        print(f"  (limite ajustado para {k} trechos: mais que isso não muda a resposta)")
                    custo = menor_custo_com_limite(grafo, origem, destino, perfil, k)
                    print("  impossível com esse limite" if custo == INFINITO else f"  custo {custo}")
            elif escolha == "3":
                dist, _ = floyd_warshall(grafo, "acessivel")
                ranking = ranking_pontos_de_apoio(dist, grafo.locais)[:3]
                if not ranking:
                    print("  Nenhum local alcança todos os outros por rota acessível.")
                for soma, local in ranking:
                    print(f"  {nome_legivel(local)} (soma {soma})")
            elif escolha == "5":
                demo_orcamento(dados, grafo, pedir_inteiro("Orçamento (mil R$): "))
            elif escolha == "6":
                if tem_locais_demo(grafo) and "melhorias" in dados and "orcamento_mil_reais" in dados:
                    demo_eficiencia(dados, grafo)
                else:
                    print("  A comparação usa os locais e as melhorias do bairro.json.")
            else:
                print("Opção inválida.")
        except ValueError as erro:
            print(f"Entrada inválida: {erro}")
        except (EOFError, KeyboardInterrupt):
            print()
            return


def pedir_inteiro(pergunta):
    """Lê um número inteiro; texto que não é número vira uma mensagem clara."""
    texto = input(pergunta).strip()
    try:
        return int(texto)
    except ValueError:
        raise ValueError(f"'{texto}' não é um número inteiro") from None


def pedir_local(grafo, pergunta):
    local = input(pergunta).strip()
    if local not in grafo.locais:
        raise ValueError(f"local desconhecido: {local}")
    return local


# ------------------------------------------------------------------- main
def main():
    # Evita erro de acentos no terminal do Windows.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="CaminhoSeguro - Dynamic Programming")
    parser.add_argument("--dados", default=CAMINHO_PADRAO, help="arquivo JSON do bairro")
    parser.add_argument("--rota", nargs=2, metavar=("ORIGEM", "DESTINO"))
    parser.add_argument("--parada", help="com --rota: passar por este local no caminho")
    parser.add_argument("--perfil", choices=list(PERFIS), default="acessivel")
    parser.add_argument("--orcamento", type=int, help="orçamento em mil R$")
    parser.add_argument("--menu", action="store_true", help="menu interativo")
    args = parser.parse_args()
    if args.orcamento is not None and args.orcamento < 0:
        parser.error("o orçamento não pode ser negativo")
    if args.parada and not args.rota:
        parser.error("--parada só funciona junto com --rota ORIGEM DESTINO")

    try:
        dados = carregar_dados(args.dados)
        grafo = montar_grafo(dados)
    except FileNotFoundError:
        parser.error(f"arquivo de dados não encontrado: {args.dados}")
    except (ValueError, KeyError) as erro:  # JSON malformado, campo faltando ou valor inválido
        parser.error(f"dados inválidos em {args.dados}: {erro}")
    print(dados.get("aviso", "Dados carregados de " + args.dados))

    if args.menu:
        menu(dados, grafo)
    elif args.rota:
        for local in args.rota + ([args.parada] if args.parada else []):
            if local not in grafo.locais:
                parser.error(f"local desconhecido: {local}. Opcoes: {', '.join(grafo.locais)}")
        if args.parada:
            dist, proximo = floyd_warshall(grafo, args.perfil)
            custo, caminho = rota_com_parada(dist, proximo, args.rota[0], args.parada, args.rota[1])
            print("  SEM ROTA" if caminho is None else f"  custo {custo} | {formatar_caminho(caminho)}")
        else:
            mostrar_rota(grafo, args.rota[0], args.rota[1], args.perfil)
    elif args.orcamento is not None:
        demo_orcamento(dados, grafo, args.orcamento)
    elif tem_locais_demo(grafo) and "melhorias" in dados and "orcamento_mil_reais" in dados:
        demo_completa(dados, grafo)
    else:
        print("Os exemplos prontos usam os locais do bairro.json. Com outro arquivo, use "
              "--menu, --rota ORIGEM DESTINO ou --orcamento VALOR.")


if __name__ == "__main__":
    main()
