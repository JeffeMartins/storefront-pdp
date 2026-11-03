# Validação local

Execução em 03/11/2026, Windows, Docker Desktop com engine Linux e 8 GB alocados, Node 24.22.1, Java 21, PostgreSQL 17, Redis 7.4, Next.js 16.4.5 e React 19.3.1. Os serviços foram executados como builds de produção no Docker, sem chamadas a parceiros ou IA.

## Evidências

- Builds de produção independentes para shell e PDP; build Java e imagem de runtime do catálogo.
- Ratings API: suite existente passou após adicionar o perfil; nove testes unitários passaram, incluindo dois novos casos de isolamento/autorização dos autores demo. A suite completa antes dos novos casos executou onze testes unitários/de integração.
- Catálogo: dois testes Testcontainers com PostgreSQL/Redis reais, cobrindo preço por contexto, chaves de cache separadas, estoque, SKU desconhecido e rejeição de requisições inválidas/escrita.
- Seed HTTP criou cinco comentários de autores distintos, soma das notas 21 e média 4,2. Uma segunda execução preservou cinco registros, sem duplicação.
- Sete testes Playwright com Chromium passaram e cobriram APIs reais, renderização, cinco comentários, mudança de loja, sacola de demonstração, variante esgotada, página 404 e versão móvel sem overflow. Auditoria axe WCAG A/AA não encontrou violações no cenário principal. Há ainda teste de resposta degradada interceptada no navegador; isso complementa os testes reais de serviços parados.
- Teste de falha real com os dois Redis parados: catálogo/reviews retornaram dados do PostgreSQL.
- Teste de falha real com ratings parado: BFF retornou o produto, preço e `ratings.status=UNAVAILABLE`; serviços restaurados após o teste.
- Auditoria npm completa sem vulnerabilidades conhecidas no momento da execução; não equivale a uma auditoria de segurança completa.

O CI é a evidência reproduzível para os commits publicados; resultados de uma execução local não garantem que qualquer ambiente terá o mesmo comportamento. A cobertura automatizada de acessibilidade não substitui validação com leitores de tela e revisão humana.

## Medição curta de leitura

Comando: `node scripts/perf.mjs`, com o stack iniciado e seed concluído. Endpoint `/api/pdp/FONE-BT-001`, incluindo cinco comentários e oferta. Dataset: três variantes, três localidades, cinco reviews. Cache quente, quatro consumidores concorrentes, cem solicitações medidas, sem tráfego externo.

| Métrica                              | Resultado observado |
| ------------------------------------ | ------------------- |
| Primeira requisição, fora da amostra | 92,48 ms            |
| p50                                  | 43,68 ms            |
| p95                                  | 66,41 ms            |
| p99                                  | 102,11 ms           |
| Duração das 100 requisições          | 1.182,82 ms         |
| Erros                                | 0                   |

É um smoke local pequeno, não benchmark de capacidade ou SLA. A medição inclui cliente Node, gateway, BFF, rede Docker e APIs na mesma máquina; não inclui internet, latência regional, dataset grande ou longa duração. O artefato JSON inclui timestamp, plataforma, concorrência e percentis. Próximo passo de performance: ensaio mais longo com dataset maior, cache frio/quente, limites de recursos e métricas de SQL/Redis/CPU.

## Limitações verificáveis

Não houve chamada real à OpenAI, parceiro comercial, pagamento ou operação de estoque transacional. Não foram feitas auditoria de pentest, validação legal de comércio eletrônico ou certificação WCAG. A PDP é um produto de demonstração de engenharia, com limitações descritas no README.
