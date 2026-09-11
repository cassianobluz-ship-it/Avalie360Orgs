# Guia de Manutenção — Avalie360

Este documento existe para que qualquer pessoa (incluindo você mesmo, no futuro, ou outra pessoa no seu lugar) consiga entender a estrutura do projeto e saber onde tocar para fazer alterações comuns — sem precisar reconstruir o entendimento do zero.

## Mapa da estrutura atual

```
Avalie360Orgs/                  ← repositório do frontend (público)
├── index.html                  ← raiz HTML, carrega a aplicação
├── package.json                ← dependências e comandos
├── vite.config.js              ← configuração de build
└── src/
    ├── main.jsx                ← ponto de entrada, monta o React na página
    ├── App.jsx                 ← TODA a lógica de interface está aqui
    └── api.js                  ← todas as chamadas à API (avalie360-api)

avalie360-api/                  ← repositório do backend (privado, projeto separado)
└── (Node.js + Express + PostgreSQL, hospedado em VPS próprio — ver INFRAESTRUTURA.md)

Avalie360_Apresentacao/         ← repositório separado, página de apresentação
└── (HTML estático, deploy próprio no Vercel)
```

O sistema tem backend e banco de dados reais, em produção. Dados preenchidos por um usuário **são** persistidos e visíveis para outros usuários com permissão. Os detalhes operacionais (URLs, credenciais, acesso ao servidor) não ficam neste arquivo público — ver `INFRAESTRUTURA.md` (documento local, no `.gitignore`, nunca commitado).

## Pontos de entrada para alterações comuns

| Alteração desejada | Arquivo | Cuidado |
|---|---|---|
| Mudar pergunta de um pulso | `src/App.jsx` (procure pelo texto da pergunta atual) | Baixo risco |
| Mudar regras de Talentos (TL) ou níveis | `src/App.jsx` (procure por "Talentos" ou "TL") | Médio — confirme que os níveis (Iniciante → Embaixador) continuam consistentes |
| Adicionar nova área de avaliação | `src/App.jsx` | Médio — siga o padrão das áreas existentes (Financeiro, Operações etc.) |
| Trocar logo ou cores | `index.html` / `src/App.jsx` | Baixo risco |
| Adicionar nova dependência (biblioteca) | `package.json`, depois rodar `npm install` | Sempre teste localmente antes de subir ao Vercel |
| Mudar como o KPI é calculado | `src/App.jsx`, seção do dashboard de KPIs | Alto — confira a fonte de cada KPI (alguns vêm de cadastro de missionários, outros de pulsos, outros de input manual) |

## Alertas — partes que exigem cuidado especial

- **`src/App.jsx` é um arquivo único e grande.** Concentra toda a lógica de interface (pulsos, Talentos, ranking, gestão de missionários, dashboard). Isso é aceitável no tamanho atual, mas qualquer alteração deve ser testada localmente (`npm run dev`) antes de subir ao Vercel, porque um erro de sintaxe nesse arquivo quebra a aplicação inteira.
- **Autenticação real via JWT**, com papel (`gestor`/`missionario`) controlado no backend — o frontend só esconde botões visualmente, mas a API confere o papel de verdade em cada rota administrativa.
- **Existem contas de teste com senha padrão ativas em produção.** Ver documento privado `INFRAESTRUTURA.md` (não commitado) — trocar/remover antes de qualquer divulgação pública do link.
- **Mudança no backend (`avalie360-api`) exige deploy manual** — não há CI/CD automático como o Vercel tem para o frontend. Depois de dar push no repositório, é preciso entrar no servidor via SSH e atualizar o código rodando (`git pull`, `npm install` se mudou dependência, `pm2 restart avalie360-api`). Detalhes de acesso em `INFRAESTRUTURA.md`.
- **Antes de mudar algo arriscado no backend**, teste primeiro no ambiente de staging (API separada, banco separado, mesma máquina) antes de tocar em produção. Ver `INFRAESTRUTURA.md`.

## Como fazer deploy de uma mudança no backend

O frontend (`Avalie360Orgs`) já tem deploy automático: qualquer push no branch `main` publica no Vercel sozinho.

O backend (`avalie360-api`) não tem isso — os passos são:

1. Teste a mudança localmente e, se possível, contra o ambiente de staging (`INFRAESTRUTURA.md`)
2. `git push` no branch `master` do repositório privado `avalie360-api`
3. Entre no servidor via SSH (ver `INFRAESTRUTURA.md` para a chave/comando)
4. `cd /var/www/avalie360-api && git pull`
5. Se mudou alguma dependência: `npm install --omit=dev`
6. Se mudou o schema do banco (`src/bancoDeDados/esquema.sql`): `npm run migrar`
7. `pm2 restart avalie360-api`
8. Confira com `pm2 logs avalie360-api` que subiu sem erro

## Decisões técnicas (registro)

**Por que separar frontend e backend em repositórios distintos:** facilita manutenção independente — quem for tocar o backend não precisa entender React, e quem ajustar a interface não precisa entender o servidor.

**Por que VPS próprio (Contabo) em vez de Railway/Render:** custo fixo mensal em vez de cobrança por uso, e o usuário já tinha o servidor contratado para outro projeto (`conectandogente.com`), então reaproveitar evita gasto extra.

**Pontos mais frágeis para atenção futura:** deploy do backend é manual (sem CI/CD) — um esquecimento de reiniciar o PM2 após um `git pull` deixa o servidor rodando código antigo sem nenhum aviso. Vale considerar automatizar isso (GitHub Actions + SSH, por exemplo) se as mudanças no backend ficarem mais frequentes.
