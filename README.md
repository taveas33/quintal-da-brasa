# Quintal da Brasa

Projeto HTML/CSS/JavaScript com checkout e funções Node.js para PIX NexusPag. Preparado para abrir como pasta no Antigravity e importar na Vercel. Nenhum deploy foi realizado.

## Rodar localmente

Requer Node.js 24. Não há dependências externas de npm.

1. Abra esta pasta no Antigravity.
2. Para testar, mantenha `PIX_MODE=demo` no `.env`; nenhuma chave é necessária.
3. Execute `npm run dev` no terminal da pasta.
4. Abra http://127.0.0.1:8766.

O projeto abre em `PIX_MODE=demo`: o checkout gera apenas uma representação de teste e permite confirmar o pagamento simulado. Depois exibe a taxa demonstrativa de R$ 9,90 (informada antes do primeiro pagamento), simula sua quitação e segue para o status do pedido. Nenhuma cobrança é criada nesse modo. O servidor local carrega o `.env` automaticamente. `PIX_SESSION_SECRET` é opcional: se preenchido, use um segredo longo e mantenha-o estável. Caso fique vazio, a API key é usada para assinar os tokens. `PORT` altera apenas a porta local.

## Publicar na Vercel

1. Importe a pasta inteira como projeto (ou envie seu conteúdo para um repositório e importe esse repositório).
2. Escolha **Other** como framework e **Node.js 24.x**.
3. O `vercel.json` define `npm run build` e a saída `public`.
4. Em **Settings → Environment Variables**, mantenha `PIX_MODE=demo` para simulação. Para o PIX real do pedido, defina `PIX_MODE=live`, cadastre `NEXUSPAG_API_KEY` e, se utilizado, `PIX_SESSION_SECRET`. A Vercel não importa o `.env` local automaticamente.
5. Faça o deploy. As rotas `/api/pix` e `/api/pix-status` são funções do servidor.

Mantenha `.env` fora do Git. `.gitignore` e `.vercelignore` já estão configurados. Nunca coloque a chave em `public/`, no catálogo ou no JavaScript do navegador.

## Editar o projeto

- `public/index.html`: vitrine, categorias, logo e rodapé.
- `public/checkout.html`: sacola, entrega, dados e pagamento.
- `data/catalog.json`: fonte única de produtos, preços, descrições, imagens e bebidas.
- `public/images/quintal/`: fotos dos 19 pratos e kits do Quintal.
- `public/images/logo.png`: logo do Quintal.
- `public/images/banner-quintal.png`: capa do projeto anterior.
- `public/product.js`: gerado pelo build; edite o JSON e rode `npm run build`.
- `api/`: funções compatíveis com a Vercel.
- `lib/`: cálculo dos valores, NexusPag e assinatura dos tokens.
- `scripts/dev.mjs`: servidor local que usa as mesmas funções da Vercel.
- `.env` / `.env.example`: campos de configuração vazios.
- `tests/`: testes do catálogo e da integração.

## Conteúdo importado

Logo, rodapé, nomes, fotos, descrições e preços vêm do projeto Quintal da Brasa de 15/11/2026. Foram migrados 19 pratos e kits, e preservadas as 24 bebidas do template, inclusive todos os refrigerantes e seus preços. Os pratos seguem a composição descrita no catálogo, com observação livre e bebidas opcionais; não recebem as opções de frango e acompanhamentos do antigo template. A sacola usa uma chave exclusiva para não misturar pedidos do Sul na Brasa.

O rodapé mantém razão social e contato da referência anterior. Os links de políticas continuam apontando para o domínio institucional anterior; podem ser substituídos em `public/index.html` quando você definir os links definitivos. As fotos importadas são ilustrativas.

## PIX e limites

No modo `live`, o servidor recalcula o total usando o catálogo e envia à NexusPag somente valor, descrição, identificação externa e expiração de 30 minutos. A API key não vai ao navegador. A resposta exibe QR Code, copia e cola e consulta de status a cada 7 segundos. Tentativas repetidas do mesmo pedido no mesmo navegador reutilizam a identificação externa. A consulta é protegida por token assinado e não retorna dados pessoais do pagador.

Não existe banco de dados de pedidos, webhook ou despacho ao restaurante neste pacote. A confirmação aparece enquanto a tela de pagamento consulta o status. Para gestão de pedidos persistente, é necessário integrar armazenamento e processamento de pedidos. A API real ainda precisa ser validada com sua conta NexusPag; nenhuma cobrança real foi criada.

## Verificação

Execute `npm test` e `npm run build`. Foram verificados preços, marca, variáveis privadas, recálculo no servidor, contrato NexusPag com resposta simulada, repetição idempotente e proteção da consulta. A navegação no navegador confirmou produto, refrigerante e sacola com total de R$ 27,89.

Referências: [NexusPag](https://nexuspag.com/docs/create-pix), [consulta PIX](https://nexuspag.com/docs/get-pix), [funções Vercel](https://vercel.com/docs/functions/runtimes/node-js).

## Fluxo de demonstração adicionado

- `public/pedido-demo.js`: simulação de pagamento e transições.
- `public/taxa.html`: taxa demonstrativa de R$ 9,90, sem QR Code válido ou transação.
- `public/status.html`: etapas Pedido recebido, Em preparo, Saiu para entrega e Entregue; o botão avança manualmente a demonstração.
- `public/pedido.css`: layout responsivo dessas telas.
- `public/payment-config.js`: gerado pelo build conforme `PIX_MODE`.

A taxa e seu pagamento são exclusivamente demonstrativos e não estão integrados à NexusPag. No modo real, continua disponível apenas a cobrança do pedido. O modo de demonstração não utiliza a API nem grava um pedido no restaurante; seu estado fica na sessão do navegador. Não há alegação de taxa exigida por lei ou bloqueio por falta de pagamento.

Na Vercel, alterar PIX_MODE requer novo build/deploy para atualizar a configuração pública. No desenvolvimento local, reinicie npm run dev após editar .env.
