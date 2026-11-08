# E-commerce

Aplicação Next.js com API NestJS, PostgreSQL e envio de e-mails. Toda a execução ocorre em containers; Node.js e npm não são necessários na máquina host.

## Estrutura Docker

- `compose.yaml`: serviços, rede e volume compartilhados.
- `compose.dev.yaml`: hot reload, bind mounts e Mailpit.
- `compose.prod.yaml`: imagens compiladas, SMTP real e exposição mínima.
- `backend/Dockerfile` e `frontend/Dockerfile`: imagens multi-stage com targets `development`, `build` e `production`.

O volume nomeado `ecommerce_postgres_data` é preservado entre reinicializações. Não use `docker compose down -v` em uma instalação que contenha dados a manter.

## Desenvolvimento

Copie as variáveis locais de exemplo e inicie a stack:

```bash
cp .env.example .env
docker compose -f compose.yaml -f compose.dev.yaml up --build
```

- Frontend: http://localhost:3001
- API e Swagger: http://localhost:3000 e http://localhost:3000/api/docs
- Mailpit: http://localhost:8025
- PostgreSQL: `127.0.0.1:5432`

O serviço `migrate` executa as migrations versionadas depois que o banco fica saudável e antes da API iniciar. Os volumes `backend_node_modules` e `frontend_node_modules` evitam que bind mounts ocultem dependências instaladas na imagem. Alterações nos dois projetos usam hot reload.

Para validar a configuração:

```bash
docker compose -f compose.yaml -f compose.dev.yaml config
docker compose -f compose.yaml -f compose.dev.yaml exec frontend npm run test:smoke
docker compose -f compose.yaml -f compose.dev.yaml exec frontend npm run test:purchase-flow
```

O teste de compra requer ao menos um produto ativo com estoque de duas unidades ou mais. O e-mail de checkout aparece no Mailpit; nenhum SMTP real é usado neste perfil.

## Produção

Crie um arquivo externo e não versionado, por exemplo `/etc/ecommerce/production.env`, com valores reais:

```dotenv
POSTGRES_USER=ecommerce
POSTGRES_PASSWORD=troque-por-um-segredo-forte
POSTGRES_DB=ecommerce
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario
SMTP_PASSWORD=segredo
MAIL_FROM="E-commerce <no-reply@example.com>"
```

Valide e inicie:

```bash
docker compose --env-file /etc/ecommerce/production.env -f compose.yaml -f compose.prod.yaml config
docker compose --env-file /etc/ecommerce/production.env -f compose.yaml -f compose.prod.yaml up -d --build
```

Produção não inicia Mailpit e não publica PostgreSQL ou a API. Apenas o frontend é associado a `127.0.0.1:3001`; um proxy reverso externo deve encaminhá-lo por HTTPS. O navegador usa `/api`, que o Next encaminha internamente para a API, preservando o cookie HttpOnly no mesmo domínio.

Docker Compose não fornece HTTPS, certificados, firewall, domínio, backup ou rotação de segredos. Configure esses controles no ambiente de implantação. Como o cookie de carrinho é `Secure` em produção, o fluxo completo de carrinho e checkout requer acesso HTTPS real.

## Migrations e e-mail

As migrations nunca são executadas no build da imagem nem no boot da API. O serviço one-shot `migrate` aplica migrations compiladas em produção e migrations TypeScript em desenvolvimento; a API depende da sua conclusão bem-sucedida.

O perfil de produção fixa `MAIL_PROVIDER=smtp` e exige host, credenciais e remetente. Não existe fallback silencioso para Mailpit. As variáveis SMTP são runtime-only e não devem usar o prefixo `NEXT_PUBLIC_`.

Nenhum segredo é usado no build das imagens. `BACKEND_INTERNAL_URL` também é uma variável runtime do servidor Next, com valor interno `http://backend:3000`; o browser nunca a recebe e sempre chama o caminho relativo `/api`.
