# E-commerce

Aplicação Next.js com API NestJS, PostgreSQL e envio de e-mails. Toda a execução ocorre em containers; Node.js e npm não são necessários na máquina host.

## Pré-requisitos — Instalação do Docker

O projeto utiliza Docker e Docker Compose para executar o frontend, o backend, o PostgreSQL, as migrations e o Mailpit. Não é necessário instalar Node.js, npm ou PostgreSQL na máquina local: essas dependências são executadas dentro dos containers.

### Links oficiais

- [Download geral do Docker](https://www.docker.com/get-started/)
- [Instalação no Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Instalação no macOS](https://docs.docker.com/desktop/setup/install/mac-install/)
- [Docker Engine no Linux](https://docs.docker.com/engine/install/)
- [Docker Desktop no Linux](https://docs.docker.com/desktop/setup/install/linux/)

### Windows

1. Baixe o Docker Desktop pela [documentação oficial do Windows](https://docs.docker.com/desktop/setup/install/windows-install/).
2. Execute o instalador e siga as etapas apresentadas.
3. Utilize o WSL 2 como backend, que é a opção recomendada para o desenvolvimento no Windows.
4. Reinicie o computador, se o instalador solicitar.
5. Abra o Docker Desktop.
6. Aguarde até que o Docker esteja disponível antes de executar os comandos do projeto.

### macOS

1. Identifique se o Mac utiliza processador Apple Silicon ou Intel.
2. Baixe a versão correspondente na [documentação oficial do macOS](https://docs.docker.com/desktop/setup/install/mac-install/).
3. Abra o arquivo `.dmg` baixado.
4. Arraste o Docker para a pasta `Applications`.
5. Abra o Docker Desktop.
6. Aguarde a inicialização completa antes de executar os comandos do projeto.

### Linux

#### Opção A — Docker Engine (recomendada)

O Docker Engine é suficiente para executar este projeto e não exige interface gráfica. Acesse a [documentação oficial de instalação do Docker Engine](https://docs.docker.com/engine/install/), selecione sua distribuição e siga as instruções específicas para ela.

As distribuições documentadas incluem, entre outras:

- Ubuntu;
- Debian;
- Fedora;
- CentOS.

Instale também o [Docker Compose Plugin para Linux](https://docs.docker.com/compose/install/linux/) conforme a seção de instalação da sua distribuição. Ele fornece o comando moderno `docker compose`, utilizado neste README. Não misture comandos de instalação de uma distribuição com outra; use sempre as instruções oficiais correspondentes ao seu sistema.

#### Opção B — Docker Desktop

Se preferir uma interface gráfica para gerenciar containers, imagens e volumes, instale o [Docker Desktop para Linux](https://docs.docker.com/desktop/setup/install/linux/). Depois da instalação, abra o Docker Desktop e aguarde o serviço ficar disponível.

### Verificar a instalação

Execute os comandos abaixo em um terminal:

```bash
docker --version
docker compose version
docker run hello-world
```

- `docker --version` confirma que o Docker CLI está instalado.
- `docker compose version` confirma que o Docker Compose Plugin está disponível.
- `docker run hello-world` baixa e executa uma imagem de teste, confirmando que o daemon do Docker consegue criar containers.

Se algum comando falhar, confirme que o Docker Engine ou o Docker Desktop está instalado, iniciado e disponível para o seu usuário. No Linux, também verifique as permissões do usuário para acessar o daemon.

## Estrutura Docker

- `compose.yaml`: serviços, rede e volume compartilhados.
- `compose.dev.yaml`: hot reload, bind mounts e Mailpit.
- `compose.prod.yaml`: imagens compiladas, SMTP real e exposição mínima.
- `backend/Dockerfile` e `frontend/Dockerfile`: imagens multi-stage com targets `development`, `build` e `production`.

O volume nomeado `ecommerce_postgres_data` é preservado entre reinicializações. Não use `docker compose down -v` em uma instalação que contenha dados a manter.

## Como executar o projeto

### Ambiente de desenvolvimento

Clone o repositório, entre na pasta do projeto e copie o arquivo de variáveis de exemplo:

```bash
git clone https://github.com/BrenoC4rvalho/ecommerce.git
cd ecommerce
cp .env.example .env
```

Revise o `.env` e ajuste as variáveis necessárias. Para começar, os valores de desenvolvimento fornecidos no `.env.example` são suficientes: eles configuram o PostgreSQL local, o CORS e o Mailpit. Não coloque API Keys, senhas reais ou outras credenciais no Git.

Suba os containers com o Compose de desenvolvimento:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d 
```

Aguarde o PostgreSQL ficar saudável. Em seguida, o serviço `migrate` executa as migrations e o backend é iniciado; o frontend só fica disponível depois que a API passar no healthcheck.

- Frontend: http://localhost:3001
- Backend/API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Mailpit: http://localhost:8025
- PostgreSQL: `127.0.0.1:5432`

Para acompanhar os logs de todos os serviços ou de um serviço específico:

```bash
docker compose -f compose.yaml -f compose.dev.yaml logs -f
docker compose -f compose.yaml -f compose.dev.yaml logs -f backend
```

Para parar os containers sem remover o volume persistente do PostgreSQL:

```bash
docker compose -f compose.yaml -f compose.dev.yaml stop
```

O serviço `migrate` executa as migrations versionadas depois que o banco fica saudável e antes da API iniciar. Os volumes `backend_node_modules` e `frontend_node_modules` evitam que bind mounts ocultem dependências instaladas na imagem. Alterações nos dois projetos usam hot reload.

### Dados de desenvolvimento (Mock Data)

Ao iniciar o projeto pela primeira vez em modo de desenvolvimento, o backend verifica se o banco PostgreSQL possui produtos cadastrados. Caso o banco esteja vazio, o seed de desenvolvimento existente insere automaticamente 30 produtos fictícios.

Esses produtos mockados são usados para testar a listagem de produtos, a pesquisa, a paginação, a exibição dos produtos no frontend, a adição de produtos ao carrinho e o fluxo de checkout.

O seed:

- é executado somente no ambiente `development`;
- popula o banco somente quando não existem produtos cadastrados;
- armazena os dados no PostgreSQL;
- não duplica os produtos ao reiniciar os containers;
- não é executado em produção.

Não é necessário cadastrar produtos manualmente para começar a testar o E-commerce. Basta iniciar o ambiente de desenvolvimento seguindo as instruções de Docker acima.

Para validar a configuração e os fluxos principais depois que a stack estiver em execução:

```bash
docker compose -f compose.yaml -f compose.dev.yaml config
docker compose -f compose.yaml -f compose.dev.yaml exec frontend npm run test:smoke
docker compose -f compose.yaml -f compose.dev.yaml exec frontend npm run test:purchase-flow
```

O teste de compra requer ao menos um produto ativo com estoque de duas unidades ou mais. Por padrão, o e-mail de checkout aparece no Mailpit. O perfil de desenvolvimento também permite substituir esse padrão por SMTP real, conforme a seção a seguir.

## Configuração de envio de e-mails

### Visão geral

O checkout grava o pedido e uma notificação na Transactional Outbox na mesma transação. O `EmailOutboxProcessor` envia essa notificação usando o transporte Nodemailer configurado. Mailpit e Resend usam a mesma arquitetura; somente o provedor SMTP muda.

| Característica | Mailpit | Resend |
| --- | --- | --- |
| Envio real | Não | Sim |
| Recebe na caixa de entrada | Não | Sim |
| Necessita conta externa | Não | Sim |
| Necessita domínio verificado | Não | Conforme configuração |
| Uso recomendado | Desenvolvimento | Testes reais e produção |

### Mailpit — desenvolvimento

Mailpit é o modo padrão em desenvolvimento. Ele recebe e exibe as mensagens localmente, sem entregá-las à caixa de entrada real do destinatário.

Copie `.env.example` para `.env` e mantenha ou configure estas variáveis:

```dotenv
MAIL_PROVIDER=mailpit
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_SECURE=false
MAIL_FROM="E-commerce <no-reply@ecommerce.test>"
```

Inicie a stack:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up --build
```

O backend acessa o SMTP pela rede Docker em `mailpit:1025`. Após finalizar uma compra, abra [http://localhost:8025](http://localhost:8025) para visualizar a mensagem. A porta SMTP também é publicada localmente em `127.0.0.1:1025`, mas não é necessária para o fluxo da aplicação.

### Resend — envio real

Para enviar e-mails reais, crie uma conta em [Resend](https://resend.com/), gere uma API Key SMTP e, quando necessário, configure e valide o domínio do remetente. Use somente um `MAIL_FROM` autorizado pela conta Resend. O remetente de teste da Resend possui restrições próprias.

No arquivo `.env` local, substitua a configuração Mailpit por:

```dotenv
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASSWORD=re_SUA_API_KEY
MAIL_FROM="Resend <onboarding@resend.dev>"
```

`SMTP_PASSWORD` recebe a API Key da Resend e nunca deve ser versionada no Git. Reinicie somente o backend para que as novas variáveis sejam carregadas:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d --force-recreate backend
```

Faça uma compra de teste e acompanhe a aceitação e o status da entrega no painel da Resend. A aceitação SMTP confirma que a Resend aceitou a mensagem, mas a entrega final deve ser verificada no painel do provedor.

### Como alternar entre os provedores

Edite o `.env` com a configuração do provedor desejado e recrie o container do backend:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d --force-recreate backend
```

Para voltar ao Mailpit, restaure `MAIL_PROVIDER=mailpit`, `SMTP_HOST=mailpit`, `SMTP_PORT=1025` e `SMTP_SECURE=false`, então execute o mesmo comando. Não use `docker compose down -v`: esse comando remove o volume persistente do PostgreSQL.

As variáveis opcionais de operação são `MAIL_SMTP_TIMEOUT_MS` (padrão `10000`), `MAIL_OUTBOX_BATCH_SIZE` (padrão `20`) e `MAIL_PROCESSING_TIMEOUT_SECONDS` (padrão `120`). O tempo de processamento deve ser maior que o timeout SMTP.

### Fluxo de envio e retentativas

1. O cliente finaliza a compra.
2. O pedido é persistido e uma notificação de confirmação é registrada na Outbox.
3. O `EmailOutboxProcessor` procura notificações pendentes a cada 30 segundos.
4. O transporte configurado envia a mensagem por Mailpit ou SMTP/Resend.
5. Em caso de sucesso, a notificação é marcada como enviada.
6. Em caso de falha, a notificação é reagendada após 1, 5, 15 e 60 minutos.
7. Após a quinta tentativa sem sucesso, a notificação é marcada como falha, preservando o erro sanitizado para diagnóstico.

### Segurança das credenciais

- Não versione o arquivo `.env` e não compartilhe API Keys ou senhas SMTP.
- Use `.env.example` apenas como referência para variáveis locais sem segredos reais.
- Configure credenciais reais somente no ambiente local protegido ou na plataforma de implantação.
- Não use `NEXT_PUBLIC_` para variáveis SMTP: elas são exclusivas do runtime do backend.
- Use apenas remetentes autorizados pelo provedor para evitar rejeições de envio.

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
