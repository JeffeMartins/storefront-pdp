# Operação local e decisões

## Cache e consistência

Catálogo descritivo: Redis, TTL 300–329 segundos com jitter. Oferta/estoque: TTL 10 segundos por SKU, canal, localidade, vendedor fixo e moeda. O payload da oferta inclui o produto, mas a API recompõe o produto com seu próprio cache; são políticas independentes. O contexto é validado no banco antes de servir a oferta. Não existe promessa de eliminar todas as consultas SQL.

Ratings usa seu cache de resumo existente, TTL 30 segundos e invalidação após commit. Há corrida possível de refill após invalidação; TTL limita o atraso. Comentários são paginados do banco. O BFF não adiciona outro cache ao agregado e usa fetch `no-store`.

Falhas Redis viram misses e o circuito evita insistência após falhas repetidas. Nenhuma resposta Redis substitui validação transacional de pagamento/estoque, que não faz parte deste projeto. Não há single-flight; sob misses simultâneos o banco pode receber leituras repetidas. Medir antes de acrescentar locks distribuídos.

## Falhas e estados

- Catálogo inexistente: HTTP 404, inclusive na rota SSR. Contexto inválido: BFF/API HTTP 400.
- Falha catálogo: BFF HTTP 503; o error boundary SSR oferece nova tentativa. O framework pode responder 500 para erro SSR, em vez do 503 do contrato JSON.
- Falha reviews: produto e oferta continuam; `ratings.status=UNAVAILABLE`, sem nota ou total fabricados.
- SKU ainda não provisionado em reviews: `NOT_REGISTERED`. Zero é exibido apenas quando confirmado pela Ratings API.
- Oferta ausente: status `UNAVAILABLE`; estoque zero: `OUT_OF_STOCK`, HTTP 200.
- BFF: chamadas concorrentes com timeout de 1,8 s por dependência, sem retry. Não há circuit breaker no Node; os breakers Redis residem nas APIs Java. Não há limite distribuído de concorrência.

Teste manual de falha, preservando os dados:

```bash
docker compose stop catalog-cache
curl -sS "http://localhost:3000/api/pdp/FONE-BT-001"
docker compose start catalog-cache
docker compose stop ratings
curl -sS "http://localhost:3000/api/pdp/FONE-BT-001"
docker compose start ratings
```

Um container `ratings` parado pode levar à resolução de DNS/proxy e timeout; a UI deve mostrar indisponibilidade. Restaurar com `docker compose up -d --wait`. Health checks de liveness não atestam que todas as dependências estão prontas; requests de catálogo ainda podem retornar 503 se o banco cair.

## Diagnóstico

```bash
docker compose ps
docker compose logs --tail 100 catalog ratings pdp gateway
curl -sS http://localhost:8081/actuator/health/liveness
curl -sS http://localhost:8082/actuator/health/liveness
```

Em conflito de porta, edite apenas o bind do serviço correspondente. Se editar a senha de um PostgreSQL com volume existente, a imagem não altera a senha do usuário já criado: restaure a credencial anterior ou faça rotação administrativa deliberada. O setup evita sobrescrever `.env` justamente para impedir esse problema.

O projeto reserva aproximadamente 3 GB em limites somados, além do overhead de builds e Docker. O primeiro build é mais pesado; shell e PDP têm imagens separadas. Volumes guardam somente dados demonstrativos deste stack. O banco original `ratings-reviews` não é montado.

## Evolução

O lock usa um override de `minimatch` para a versão corrigida 11.x, compatível com o Node 24 utilizado. A dependência é transitiva das ferramentas de lint; a atualização foi validada com ESLint e TypeScript. O motivo é o [advisory GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Remover o override quando as dependências diretas adotarem a correção, repetindo lint e auditoria. Não foi usado `npm audit fix --force` nem downgrade automático das ferramentas.

Testes de carga com dataset/hardware identificados, métricas Prometheus/tracing, filtros server-side de reviews, catálogo editável com auditoria/OIDC, sincronização via outbox e análise IA persistida são próximos incrementos. Nenhum benchmark ou SLA é declarado sem medição. Este projeto não é uma implementação de serviços internos de terceiros.
