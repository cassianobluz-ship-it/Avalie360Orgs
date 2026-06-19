# Guia de Manutenção — Avalie360

Este documento existe para que qualquer pessoa (incluindo você mesmo, no futuro, ou outra pessoa no seu lugar) consiga entender a estrutura do projeto e saber onde tocar para fazer alterações comuns — sem precisar reconstruir o entendimento do zero.

## Mapa da estrutura atual

```
Avalie360Orgs/                  ← repositório do frontend (Fase 1, atual)
├── index.html                  ← raiz HTML, carrega a aplicação
├── package.json                ← dependências e comandos
├── vite.config.js              ← configuração de build
└── src/
    ├── main.jsx                ← ponto de entrada, monta o React na página
    └── App.jsx                 ← TODA a lógica do sistema está aqui

Avalie360_Apresentacao/         ← repositório separado, página de apresentação
└── (HTML estático, deploy próprio no Vercel)
```

Hoje **não existe backend nem banco de dados**. Tudo roda no navegador. Isso é importante entender: dados preenchidos por um usuário não são vistos por outro usuário, e desaparecem ao recarregar a página.

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

- **`src/App.jsx` é um arquivo único e grande.** Concentra toda a lógica do sistema (pulsos, Talentos, ranking, gestão de missionários, dashboard). Isso é aceitável no tamanho atual, mas qualquer alteração deve ser testada localmente (`npm run dev`) antes de subir ao Vercel, porque um erro de sintaxe nesse arquivo quebra a aplicação inteira.
- **Não há autenticação real ainda.** O perfil "Gestor" (que vê o dashboard de KPIs) provavelmente é controlado por lógica simples no frontend, não por um sistema de login seguro. Isso é adequado para piloto interno, mas **não deve ser usado** se dados sensíveis ou externos entrarem no sistema, sem antes implementar autenticação real (ver Fase 2).
- **Sem persistência de dados.** Qualquer dado inserido (respostas de pulso, cadastro de missionário) existe apenas durante a sessão do navegador. Antes de qualquer uso real com a equipe da SEPAL, isso precisa estar resolvido.

## Como adicionar o backend quando chegar a hora (Fase 2)

Quando o piloto validar o conceito e for hora de ter dados persistentes e múltiplos usuários reais, o caminho planejado é:

**1. Criar um repositório novo, separado**, por exemplo `Avalie360-API`, contendo um backend em Node.js (framework Express é o mais simples e documentado).

**2. Hospedar esse backend em Railway ou Render** (não no Vercel — Vercel é otimizado para frontend e funções leves, não para um servidor de API completo e banco de dados persistente).

**3. Adicionar um banco de dados PostgreSQL** — tanto Railway quanto Render oferecem isso integrado, sem precisar contratar serviço separado.

**4. Estrutura mínima esperada do backend:**
```
Avalie360-API/
├── src/
│   ├── rotas/          ← endpoints da API (ex: /api/pulsos, /api/missionarios)
│   ├── modelos/        ← estrutura das tabelas do banco de dados
│   ├── autenticacao/   ← login e geração de token (JWT)
│   └── servidor.js     ← arquivo principal que inicia a API
├── package.json
└── README.md
```

**5. Endpoints REST esperados (mínimo):**
- `POST /api/auth/login` — autenticação, retorna token JWT
- `GET /api/missionarios` — lista missionários (protegido por token)
- `POST /api/pulsos` — registra resposta de um pulso
- `GET /api/kpis` — retorna dados consolidados do dashboard

Todas as respostas devem seguir um formato JSON padronizado, por exemplo:
```json
{ "sucesso": true, "dados": { ... }, "erro": null }
```

**6. No frontend (`src/App.jsx`)**, trocar os pontos onde os dados hoje ficam só em estado React por chamadas a essa API (usando `fetch` ou `axios`), mantendo a interface visual igual.

**7. O frontend continua no Vercel.** Não é necessário mover nada do que já existe — só passa a "conversar" com a nova API em vez de manter tudo internamente.

Essa separação (frontend no Vercel, backend em Railway/Render) é o motivo pelo qual o sistema foi desenhado com REST API prevista desde o início: a migração não exige reescrever a interface, só conectar as duas partes.

## Decisões técnicas (registro)

**Por que postergar o backend:** validar o modelo de pulsos com o piloto SEPAL antes de investir em infraestrutura de servidor e banco de dados — evita gastar esforço em algo que pode precisar de ajustes depois de feedback real.

**Por que separar frontend e backend em repositórios distintos:** facilita manutenção independente — quem for tocar o backend não precisa entender React, e quem ajustar a interface não precisa entender o servidor.

**Pontos mais frágeis para atenção futura:** a falta de persistência de dados é o maior risco atual — qualquer uso da SEPAL além de demonstração visual exige a Fase 2 implementada primeiro.
