# Avalie360

Sistema de avaliação organizacional tipo "pulso" para a SEPAL (organização missionária). Mais simples que um 360 tradicional: avalia áreas organizacionais, eventos e liderança, minimizando o tempo exigido de quem responde (missionários e equipe).

## Problema que resolve

Organizações grandes precisam de feedback constante sobre como áreas, eventos e lideranças estão funcionando, mas modelos tradicionais de avaliação 360 são lentos e cansam quem participa. O Avalie360 resolve isso com ciclos curtos ("pulsos"), gamificação leve (sistema de Talentos) e um piloto focado — primeiro na SEPAL, depois replicável.

## Estado atual (Fase 2 — conectado à API)

O frontend agora se conecta a um backend real (`avalie360-api`, Node.js + Express + PostgreSQL) via `src/api.js`. Login, cadastro de missionários e envio de pulsos passam a ser persistidos no banco quando a API está disponível. Se a API estiver fora do ar, a tela mostra um aviso e o app continua funcionando com dados de demonstração em memória (não persistem).

| Camada | Tecnologia | Onde está |
|---|---|---|
| Interface (frontend) | React + Vite | Este repositório (`Avalie360Orgs`), deploy via Vercel |
| Apresentação para a equipe | HTML estático | Repositório separado, deploy via Vercel |
| API / autenticação | Node.js + Express + JWT | Repositório `avalie360-api`, ver `.env.example` (`VITE_API_URL`) |
| Dados | PostgreSQL (via `avalie360-api`) | Fallback: estado React em memória se a API estiver indisponível |

Login é restrito a emails `@sepal.org.br` e autenticado por JWT contra a API. Veja o README do `avalie360-api` para como rodar a API localmente e conectar os dois projetos.

## Arquivos do projeto (repositório `Avalie360Orgs`)

| Arquivo | O que faz |
|---|---|
| `index.html` | Página HTML raiz que carrega a aplicação React |
| `package.json` | Lista as dependências do projeto (React, Vite) e os comandos de build |
| `vite.config.js` | Configuração da ferramenta Vite, que compila e empacota o frontend |
| `src/main.jsx` | Ponto de entrada — monta a aplicação React dentro do `index.html` |
| `src/App.jsx` | Componente principal — contém toda a lógica do Avalie360 (pulsos, Talentos, ranking, gestão de missionários, dashboard de KPIs) |

## Tecnologias utilizadas

- **React** — biblioteca para construir a interface
- **Vite** — ferramenta de build, mais rápida que alternativas tradicionais
- **Vercel** — hospedagem do frontend, com deploy automático a cada atualização no GitHub
- **GitHub** — versionamento e armazenamento do código-fonte

## Como rodar o projeto localmente

1. Instale o [Node.js](https://nodejs.org) (versão 18 ou superior)
2. Baixe o repositório (`git clone` ou download do GitHub)
3. Abra o terminal na pasta do projeto e rode:
   ```
   npm install
   npm run dev
   ```
4. Acesse o endereço mostrado no terminal (geralmente `http://localhost:5173`)

## Como modificar (guia rápido)

| Quero alterar... | Onde olhar |
|---|---|
| Texto, perguntas dos pulsos, regras de Talentos, níveis | `src/App.jsx` |
| Logo, cores gerais, título da aba do navegador | `index.html` e `src/App.jsx` |
| Dependências (adicionar uma nova biblioteca) | `package.json`, depois `npm install` |
| Como o projeto é compilado | `vite.config.js` (raramente precisa mudar) |

## Fase 2 — Backend e API (implementado)

```
Frontend (React, Vercel)  →  API REST (Node.js/Express, avalie360-api)  →  Banco de dados (PostgreSQL)
```

O backend já existe em `avalie360-api` (projeto separado) e expõe autenticação JWT (restrita a `@sepal.org.br`) e endpoints REST para missionários, pulsos e KPIs. O frontend busca e envia dados por essa API via `src/api.js`, com fallback local caso a API esteja fora do ar.

Falta rodar `avalie360-api` em produção (Railway ou Render, ver o README de lá) e apontar `VITE_API_URL` para essa URL no deploy do Vercel. Mais detalhes em `MANUTENCAO.md`, na seção "Como adicionar o backend quando chegar a hora".

## Decisões técnicas

**Por que começar só com frontend:** validar o conceito e coletar feedback do piloto SEPAL rapidamente, sem o custo e complexidade de manter um servidor antes de saber se o modelo de pulsos funciona na prática.

**Por que React + Vite:** ecossistema amplamente documentado, fácil de encontrar ajuda e desenvolvedores no futuro, e Vite oferece tempo de build mais rápido que alternativas como Create React App.

**Por que Vercel para o frontend:** deploy automático a partir do GitHub, gratuito para esse volume, sem necessidade de configurar servidor.

**Alternativas descartadas:** um backend completo (com banco de dados) desde o primeiro dia foi descartado para não atrasar o piloto — o custo de adicionar isso depois é baixo, porque a arquitetura (REST API separada do frontend) já foi prevista desde o início.

**Pontos frágeis para atenção futura:**
- Dados não persistem entre sessões — qualquer reload de página apaga o que foi preenchido. Isso **precisa** ser resolvido antes de um uso real além de demonstração.
- `src/App.jsx` concentra toda a lógica do sistema num único arquivo grande. Funciona bem para o tamanho atual, mas se o sistema crescer muito mais, vale dividir em componentes menores (ver `MANUTENCAO.md`).
