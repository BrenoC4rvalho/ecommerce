# E-commerce

Frontend Next.js e API NestJS para o E-commerce. Todo o fluxo usa Docker; Node.js, npm e Next.js não precisam estar instalados na máquina host.

## Stack

- Frontend: Next.js (App Router), React, TypeScript strict, Tailwind CSS 4, TanStack Query, React Hook Form e Zod.
- Backend: NestJS, PostgreSQL e Mailpit.
- Infraestrutura: Docker Compose e imagens Node.js 24.

## Desenvolvimento

Execute na raiz do repositório:

```bash
docker compose up --build
```

Endereços disponíveis:

- Frontend: http://localhost:3001
- API e Swagger: http://localhost:3000 e http://localhost:3000/api/docs
- Mailpit: http://localhost:8025
- PostgreSQL: `127.0.0.1:5432`

O código do frontend é montado no container de desenvolvimento. O volume nomeado `frontend_node_modules` mantém as dependências do container e impede que o bind mount as substitua. Alterações em `frontend/src` usam hot reload.

## Produção local

Para construir e executar a imagem standalone do Next.js:

```bash
docker compose -f compose.yaml -f compose.production.yaml up --build
```

O modo de produção usa `NODE_ENV=production`. O cookie de carrinho passa a ser `Secure`, portanto uma implantação real deve ser servida por HTTPS.

## Dependências do frontend

Instale dependências sem npm local:

```bash
docker compose run --rm frontend npm install nome-do-pacote
```

Para dependências de desenvolvimento, use `npm install --save-dev nome-do-pacote` no mesmo comando. Depois, reconstrua o serviço com `docker compose up --build`.

## API e sessão

O navegador chama a API por URLs relativas iniciadas em `/api`, por exemplo `GET /api/products`. O rewrite do Next remove o prefixo e encaminha a chamada internamente para `http://backend:3000`; assim não há dependência de `localhost` entre containers.

O backend cria o cookie HttpOnly `cart_session_id`. O cliente HTTP usa `credentials: "include"`, mas nunca lê nem armazena o valor em `localStorage`. Em desenvolvimento o backend usa cookie não-`Secure` para funcionar em `http://localhost`; em produção ele exige HTTPS.

## Estrutura do frontend

```text
frontend/src/
├── app/          # App Router, layout e página inicial
├── components/   # componentes de UI e layout
├── features/     # produtos, carrinho e checkout
├── hooks/
├── lib/          # cliente HTTP e QueryClient
├── providers/    # TanStack Query
├── schemas/      # schemas Zod
└── types/
```
