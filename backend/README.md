# E-commerce API

API NestJS para produtos, carrinhos anônimos, checkout transacional e e-mails de confirmação confiáveis.

## Desenvolvimento com Mailpit

Execute `docker compose up --build` na raiz deste backend. A API estará em `http://localhost:3000`, o Swagger em `http://localhost:3000/api/docs` e a caixa de entrada Mailpit em `http://localhost:8025`.

O Compose inicia PostgreSQL, aplica migrations e configura a API com `MAIL_PROVIDER=mailpit`, usando o hostname interno `mailpit:1025`. As portas de banco, SMTP, interface Mailpit e API são publicadas apenas em `127.0.0.1`.

Fora do Docker, copie `.env.example` para `.env`, use `SMTP_HOST=localhost` e inicie o Mailpit ou SMTP local na porta `1025`.

## SMTP real

Para enviar e-mails reais, configure no ambiente da aplicação:

```dotenv
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario
SMTP_PASSWORD=segredo
MAIL_FROM="E-commerce <no-reply@example.com>"
```

O modo `smtp` exige host, porta, usuário, senha e remetente válidos ao iniciar. Não há fallback para Mailpit quando o SMTP falha. TLS mantém validação de certificados e usa TLS 1.2 ou superior. Nunca versione `.env` com credenciais.

## Transactional Outbox

No checkout, pedido, itens, baixa de estoque, carrinho `CHECKED_OUT` e um registro `email_outbox` de confirmação são gravados na mesma transação PostgreSQL. O checkout não aguarda SMTP: se o provedor estiver indisponível, a compra confirmada permanece persistida com a notificação pendente.

O worker roda a cada 30 segundos. Ele reivindica pendências com `FOR UPDATE SKIP LOCKED`, envia fora da transação e usa um token/lease para evitar que workers concorrentes atualizem a mesma mensagem. Registros `PROCESSING` cujo lease vence são devolvidos para `PENDING` após `MAIL_PROCESSING_TIMEOUT_SECONDS`.

As falhas usam backoff de 1 minuto, 5 minutos, 15 minutos e 1 hora. A quinta falha marca o registro como `FAILED`, preservando um erro sanitizado para inspeção no banco. Registros `FAILED` não são reenviados automaticamente.

A entrega é *at-least-once*: uma falha após o SMTP aceitar uma mensagem pode levar a uma duplicação em nova tentativa.

## Testes

- `npm run build`: compila a aplicação.
- `npm test -- --runInBand`: testes unitários.
- `npm run test:integration`: testes PostgreSQL de estoque, checkout e outbox.
- `npm run test:mailpit`: envia apenas para Mailpit em `localhost:1025` e confirma a mensagem pela interface HTTP; execute com o Compose em execução. Esse comando nunca usa SMTP real.

Para simular falha SMTP nos testes de integração, o transporte é substituído por um mock que rejeita o envio. O worker então mantém o pedido e reagenda a outbox conforme a política de retry.
