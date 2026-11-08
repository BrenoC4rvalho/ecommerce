# Justificativas Técnicas e Decisões Arquiteturais do E-commerce

Este documento apresenta as principais decisões técnicas adotadas no
desenvolvimento do e-commerce, destacando os problemas identificados, as
soluções implementadas e suas justificativas. O foco está na integridade
dos dados, na confiabilidade das operações, na segurança e na
consistência das informações da aplicação.

**Repositório:** <https://github.com/BrenoC4rvalho/ecommerce>

A solução está organizada em um monorepositório, com backend em NestJS,
Node.js e TypeScript, frontend em Next.js e PostgreSQL como banco de
dados relacional. O TypeORM é utilizado para o mapeamento
objeto-relacional, e o Docker auxilia na padronização do ambiente de
execução.

## 1. Integridade financeira e precisão dos valores monetários

**Risco:** o uso de tipos como `float` e `double` pode gerar imprecisões
nos cálculos financeiros. Além disso, os valores enviados pelo frontend
podem ser manipulados pelo usuário, comprometendo o valor final do
pedido.

**Abordagem utilizada:** utilização do tipo `NUMERIC`/`DECIMAL` no
PostgreSQL e centralização dos cálculos de subtotais, descontos e totais
no backend.

**Justificativa:** realizar os cálculos no servidor impede que valores
manipulados pelo frontend sejam considerados confiáveis, garantindo
maior precisão e integridade nas operações financeiras.

## 2. Integridade dos dados e controle de concorrência (ACID)

**Problema:** o checkout envolve operações relacionadas, como criação do
pedido, gravação dos itens e registro da notificação. Uma falha poderia
deixar os dados incompletos. Além disso, dois clientes podem tentar
comprar simultaneamente o mesmo produto, causando conflitos na
atualização do estoque.

**Abordagem utilizada:** utilização de transações no PostgreSQL,
gerenciadas pelo TypeORM, seguindo as propriedades ACID, e aplicação de
Optimistic Locking para controlar atualizações concorrentes.

### Implementação das propriedades ACID

-   **Atomicidade:** pedido, itens e registro da Outbox são gravados na
    mesma transação. Em caso de falha, ocorre rollback.
-   **Consistência:** as operações respeitam as regras de negócio e as
    restrições do banco.
-   **Isolamento:** as transações evitam conflitos e atualizações
    indevidas nos dados.
-   **Durabilidade:** após o commit, os dados permanecem persistidos no
    PostgreSQL.

### Controle de concorrência --- Optimistic Locking

Utiliza o versionamento dos registros para identificar alterações
simultâneas. Se outro cliente modificar o estoque antes da atualização,
o conflito é identificado, evitando que uma informação desatualizada
sobrescreva a mais recente.

**Justificativa:** garantir que pedidos e estoques permaneçam
consistentes, mesmo diante de falhas ou operações simultâneas, evitando
dados incompletos e atualizações indevidas.

## 3. Confiabilidade do checkout e processamento de notificações

**Problema:** cliques repetidos podem gerar pedidos duplicados, enquanto
falhas em serviços externos, como provedores de e-mail, podem impedir o
envio das notificações.

**Abordagem utilizada:**

-   **Idempotência:** utilização de uma chave para identificar operações
    de checkout já processadas, evitando a criação duplicada de pedidos.
-   **Transactional Outbox:** gravação do pedido, seus itens e da
    notificação pendente na mesma transação.
-   **Retry Job:** processamento assíncrono das notificações por meio de
    um Job periódico, utilizando Nodemailer. A política de retentativas
    segue uma abordagem semelhante à utilizada na integração com a
    eNotas, realizando uma tentativa inicial e, em caso de falha, uma
    nova tentativa, respeitando um limite definido. Os erros são
    registrados para análise e eventual reprocessamento.

**Justificativa:** essas estratégias aumentam a confiabilidade do
checkout, evitam pedidos duplicados e permitem recuperar notificações
que falharam, sem depender da disponibilidade imediata de serviços
externos.

## 4. Segurança da sessão e identificação do carrinho

**Problema:** usuários não autenticados também precisam manter seus
carrinhos. Armazenar o identificador no `localStorage` permite que
scripts executados na página acessem esse dado, inclusive em cenários de
XSS.

**Abordagem utilizada:** utilização de cookies com as seguintes
propriedades:

-   **HttpOnly:** impede que JavaScript acesse diretamente o cookie.
-   **Secure:** permite o envio do cookie somente por HTTPS.
-   **SameSite:** ajuda a reduzir o envio de cookies em requisições
    cross-site, contribuindo para a proteção contra CSRF.
-   **CORS:** configurado no backend para permitir requisições apenas
    das origens autorizadas, com suporte ao envio de credenciais
    (cookies).

O navegador envia o identificador automaticamente nas requisições,
permitindo que o backend localize o carrinho correspondente.

**Justificativa:** essa abordagem reduz a exposição do identificador da
sessão e aumenta a segurança do carrinho. A combinação de cookies
protegidos, CORS e validações no backend contribui para proteger a
comunicação entre frontend e servidor.
