# Hospedagem gratuita do portfólio

Pesquisa em 03/11/2026. Este é um plano de publicação; nenhum recurso cloud foi criado. Preços, quotas e disponibilidade devem ser conferidos novamente na conta antes de provisionar.

## Caminho recomendado para a arquitetura atual

Uma VM **Oracle Cloud Always Free Ampere A1**, se disponível na região da conta, permite manter os containers separados: shell, PDP/BFF, gateway, duas APIs Java, dois PostgreSQL e dois Redis. A aplicação ocupa uma única máquina, mas preserva as fronteiras de processo, credenciais e volumes já demonstradas localmente. Não há alta disponibilidade entre máquinas.

A documentação atual informa cota equivalente a **2 OCPUs e 12 GB de RAM**, com armazenamento Always Free sujeito à cota compartilhada. Não assumir os limites de tutoriais antigos. A disponibilidade pode ser limitada e instâncias consideradas ociosas podem ser recuperadas pela Oracle. O Always Free não oferece garantia de disponibilidade para entrevistas: manter documentação, screenshots e demonstração gravada como apoio.

As imagens atuais `maven:3.9.11-eclipse-temurin-21`, `eclipse-temurin:21-jre-alpine` e `node:24-bookworm-slim` tiveram seus manifests consultados e oferecem ARM64. Isso valida a arquitetura publicada das bases, não substitui um build e smoke test completos na VM ARM. Também conferir as bases PostgreSQL, Redis e Nginx ao preparar o deploy.

Fontes: [recursos Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) e [visão geral do Free Tier](https://www.oracle.com/cloud/free/).

## Alternativa com serviços gerenciados

| Componente          | Opção para avaliar | Condição relevante                                                                 |
| ------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| Shell e PDP Next.js | Vercel Hobby       | Plano pessoal; validar projetos, quotas e roteamento entre aplicações              |
| APIs Java em Docker | Render Free        | Serviços dormem após inatividade; horas grátis são compartilhadas pelo workspace   |
| PostgreSQL          | Neon Free          | Projetos separados preservam o isolamento; há quotas de armazenamento e computação |
| Redis               | Upstash Free       | O plano anuncia um banco gratuito; não atende diretamente dois Redis independentes |

Esta alternativa exige configuração específica de cada provedor. Subir o Compose integral não equivale a criar vários serviços gerenciados.

Limitações que afetam esta aplicação:

- Render informa 750 horas gratuitas por workspace/mês; duas APIs não podem ser tratadas como dois serviços sempre ligados sem considerar essa cota. Serviços gratuitos suspendem após 15 minutos sem tráfego.
- O PostgreSQL gratuito do Render expira em 30 dias; para um portfólio duradouro, avaliar Neon em vez desse banco temporário.
- O BFF atual usa timeout de 1,8 segundo, apropriado à demonstração local. Um Java em cold start pode levar muito mais tempo. Precisamos testar e implementar uma experiência explícita de inicialização antes de usar essa composição em entrevistas. Não mascarar falha com avaliações inventadas nem criar requisições artificiais para contornar limites de planos.
- Reutilizar um único Redis gerenciado com namespaces reduziria o isolamento de infraestrutura atual. Não realizar essa mudança silenciosamente; manter dois caches ou documentar uma decisão de arquitetura revisada.
- Vercel não executará os bancos e as APIs Java como serviços Docker deste Compose. O roteamento do shell para a PDP e seus assets precisa de configuração própria, substituindo o Nginx local nessa parte do caminho.
- Conexões a bancos/caches gerenciados exigem TLS e credenciais de servidor. Configurar JDBC e Redis de forma explícita, sem publicar secrets no frontend, e testar migrations e pools nos limites do plano.

Fontes: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Render Free](https://render.com/docs/free), [Neon](https://neon.com/pricing), [Upstash Redis](https://upstash.com/pricing/redis).

## Sequência para começar pela VM

1. Criar/acessar a conta Oracle Cloud e verificar a oferta Always Free e a disponibilidade na região escolhida. Não usar apenas créditos temporários como promessa de hospedagem gratuita permanente.
2. Selecionar uma VM elegível dentro da cota, sistema Linux compatível e acesso SSH por chave. Nenhuma senha, chave privada ou informação de cartão deve ser enviada pelo chat ou adicionada ao Git.
3. Preparar uma configuração de deploy separada da local: HTTPS público no proxy, hostname real, restart, limites de recursos e atualização das imagens. Manter os binds de banco, cache e endpoints administrativos privados.
4. Obter os repositórios em revisões registradas, gerar credenciais exclusivas do servidor e subir os containers. Não copiar o `.env` pessoal para o repositório nem reutilizar as senhas da máquina de desenvolvimento.
5. Definir como cadastrar os cinco reviews de demonstração. O perfil demo oferece usuários locais para o seed; suas operações de escrita devem continuar inacessíveis ao visitante público e os segredos permanecem no servidor.
6. Rodar migrations, seed idempotente, smoke tests, teste ARM, falhas de dependências, verificação TLS e teste de acesso externo à PDP. Registrar a URL pública somente depois dessa validação.
7. Configurar backup/restauração do PostgreSQL e atualização do host. Volumes persistentes não substituem backup e uma VM gratuita pode ser recuperada pelo provedor.
8. Atualizar os READMEs e o perfil GitHub com os links públicos e um vídeo curto da demonstração.

## Estado atual

O stack Docker local, os bancos separados, o seed e os testes estão disponíveis nos três repositórios públicos. Não existe URL de demonstração hospedada neste momento. A escolha do provedor, a conta e a disponibilidade de recursos ainda precisam ser confirmadas para iniciar o deploy real.
