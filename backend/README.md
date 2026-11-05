# E-commerce API

API NestJS para produtos, carrinhos anônimos e checkout transacional com PostgreSQL.

## Execução

Na raiz do projeto, execute `docker compose up --build`. A API fica em `http://localhost:3000` e a documentação Swagger em `http://localhost:3000/api/docs`.

Em desenvolvimento, instale dependências com `npm install`, execute migrations com `npm run migration:run` e inicie com `npm run start:dev`.

## Testes

- `npm run test`: testes unitários.
- `npm run test:e2e`: testes HTTP básicos.
- `npm run test:integration`: cenários reais de concorrência PostgreSQL.

O último comando cria, se necessário, o banco isolado `ecommerce_test`, aplica migrations nele e limpa somente suas tabelas entre testes. O banco `ecommerce` não é usado para essa suíte.

## Regras da API

- `POST /carts` cria uma sessão UUID anônima e devolve o cookie `cart_session_id` como `HttpOnly` e `SameSite=Lax`.
- Operações de carrinho e checkout exigem esse cookie; o UUID do carrinho sozinho não concede acesso.
- Um carrinho ativo é reutilizado pela sessão. Depois do checkout, uma nova chamada a `POST /carts` cria uma nova sessão; o carrinho anterior permanece como `CHECKED_OUT` com todos os itens preservados.
- Preços, subtotais e totais são calculados no backend com valores decimais exatos. O frontend envia apenas produto/quantidade para carrinhos e carrinho/e-mail para checkout.
- `products.stock_version` começa em zero e é incrementado por qualquer mudança efetiva de estoque, inclusive atualização administrativa.
- O checkout usa transação, atualizações condicionais de estoque por versão e no máximo três tentativas para conflito de versão. Estoque insuficiente, produto inativo e erros de banco não são repetidos.
- Itens de pedido preservam nome e preço da compra; e-mails, autenticação de usuário e pagamentos ainda não foram implementados.

## Erros

As respostas de erro seguem `{ statusCode, error, message, details? }`. Validações retornam 400, recursos inexistentes 404, conflitos de estoque/estado 409 e regras de negócio 422. Erros internos não expõem SQL, stack trace ou credenciais.
