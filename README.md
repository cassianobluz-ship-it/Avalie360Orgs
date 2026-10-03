# Avalie360

Sistema de avaliação organizacional em "pulsos" para a SEPAL (organização missionária). Avalia as áreas da organização, os eventos e a liderança com avaliações curtas, em ciclos, e transforma as respostas em resultados por ciclo, indicadores estratégicos e um relatório para o Conselho de Governança.

## Problema que resolve

Organizações precisam de retorno constante sobre como áreas, eventos e lideranças estão funcionando, mas questionários longos cansam quem participa e, sem confidencialidade, geram respostas pouco sinceras. O Avalie360 usa pulsos de poucos minutos, guarda as respostas sem identificar quem respondeu e devolve aos participantes o que a liderança fez com elas ("Vocês disseram, nós fizemos").

## Estado atual — versão 2

| Camada | Tecnologia | Onde está |
|---|---|---|
| Interface (este repositório) | React + Vite | Vercel, deploy automático a cada push no `main` |
| API e autenticação | Node.js + Express + JWT | Repositório privado `avalie360-api`, em servidor próprio |
| Dados | PostgreSQL | Mesmo servidor da API |

Principais funcionalidades:

- **Acesso:** sem cadastro aberto; a gestão cria os acessos com senha provisória, trocada no primeiro acesso. Todos aceitam um aviso de privacidade (LGPD) antes de responder.
- **Pulsos:** de Área (7 áreas), de Liderança (Diretor Executivo e coordenações, com autoavaliação do líder) e de Evento. Escala de concordância de 1 a 5, perguntas Sim/Não, NPS de 0 a 10 e uma pergunta aberta. Uma pergunta-âncora (eNPS) por ciclo.
- **Ciclos:** com abertura e fechamento; cada área e cada liderança são respondidas uma vez por ciclo. Rodízio opcional de perguntas.
- **Confidencialidade:** participação e respostas ficam em tabelas separadas, sem ligação. Resultados e sugestões só aparecem com no mínimo 5 respondentes (3 em liderança).
- **Gestão:** resultados por ciclo com comparação ao anterior; liderança 360; NPS dos eventos; painel de sugestões; 10 KPIs e índice estratégico ponderado (45/35/20); relatório do ciclo para o Conselho (imprimível em PDF); cadastro de missionários, acessos, equipes, ciclos, eventos, lideranças e ações; lembretes para quem não participou.
- **Participação:** Talentos e níveis individuais (privados) e participação coletiva por equipe, sem ranking de pessoas.
- **Modo demonstração:** abra o site com `?demo` no fim do endereço. Dados fictícios, nada é gravado.

As perguntas ficam no servidor (banco de perguntas versionado). O frontend as recebe pela API; a cópia em `src/demo/perguntas.json` serve só ao modo demonstração.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/App.jsx` | Estrutura do app: fluxo de acesso, abas por papel e carregamento dos dados |
| `src/telas/` | Uma tela por arquivo: `Acesso`, `Inicio`, `Avaliacao`, `Pessoal` (perfil e participação), `Resultados` (e sugestões), `Indicadores` (KPIs e relatório), `Missionarios`, `Cadastros` |
| `src/indicadores.js` | Cálculo dos resultados, dos 10 KPIs e do índice a partir dos dados agregados da API |
| `src/api.js` | Todas as chamadas à API |
| `src/apiDemo.js` | API simulada do modo demonstração, com as mesmas regras do servidor |
| `src/tema.js`, `src/ui.jsx` | Cores, níveis, formatadores e componentes visuais compartilhados |
| `public/tutorial/` | Vídeo e PDFs de tutorial e do instrumento de avaliação |

## Como rodar localmente

1. Instale o [Node.js](https://nodejs.org) (versão 18 ou superior).
2. `npm install`
3. `npm run dev` e abra o endereço mostrado (geralmente `http://localhost:5173/?demo` para a demonstração).
4. Para usar uma API local ou de teste, crie `.env.local` com `VITE_API_URL=<endereço da API>/api`.

Detalhes de operação e deploy estão em `MANUTENCAO.md`. Endereços internos e credenciais ficam num documento privado, fora deste repositório público.
