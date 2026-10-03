# Guia de Manutenção — Avalie360

Para que qualquer pessoa consiga entender o projeto e saber onde mexer, sem reconstruir tudo do zero. Endereços de servidor, credenciais e comandos de acesso **não** ficam aqui (este repositório é público): estão no documento privado `INFRAESTRUTURA.md`, que está no `.gitignore`.

## Mapa

```
Avalie360Orgs/  (público — este repositório: interface)
└── src/
    ├── App.jsx            ← fluxo de acesso, abas e dados
    ├── telas/             ← uma tela por arquivo
    ├── indicadores.js     ← cálculo dos KPIs e do índice
    ├── api.js / apiDemo.js
    └── demo/perguntas.json  ← cópia do banco de perguntas, só para a demonstração

avalie360-api/  (privado: API + banco)
└── src/
    ├── dados/perguntas.json  ← BANCO DE PERGUNTAS oficial (fonte única)
    ├── dados/banco.js        ← validação dos envios e regras de Talentos
    ├── rotas/ e modelos/     ← endpoints e consultas
    └── bancoDeDados/         ← esquema, migração v2 e criação do primeiro gestor
```

## Alterações comuns

| Quero alterar... | Onde | Cuidado |
|---|---|---|
| Texto de uma pergunta | `avalie360-api/src/dados/perguntas.json` | Mantenha o **código** (ex.: `RH-3`). Se o sentido mudar muito, crie um código novo; respostas antigas ficam ligadas ao código. Depois copie o arquivo para `src/demo/perguntas.json` deste repositório e gere de novo o PDF de perguntas |
| Talentos por pulso | `perguntas.json` → `talentos` | O servidor calcula; o navegador só exibe |
| Mínimo de respondentes | variáveis `MIN_RESPONDENTES` e `MIN_RESPONDENTES_LIDERANCA` no servidor (padrão 5 e 3) | Diminuir reduz a confidencialidade |
| Metas e fórmulas dos KPIs | `src/indicadores.js` (`calcularKpis`) | Metas são decisão do Conselho |
| Ciclos, eventos, lideranças, ações, acessos | Pelo próprio sistema, aba de gestão | — |
| Texto do aviso de privacidade | `src/telas/Acesso.jsx` (`TextoPrivacidade`) | Ao mudar, altere também `VERSAO_PRIVACIDADE` no servidor, para pedir novo aceite |

## Alertas

- **Confidencialidade é uma regra do produto.** Nunca crie rota ou relatório que ligue `participacoes` (quem) a `respostas` (o quê), nem exiba grupos abaixo do mínimo de respondentes.
- **Frontend e API mudam juntos.** Uma mudança de contrato na API exige publicar os dois. O modo demonstração (`apiDemo.js`) precisa acompanhar as regras do servidor.
- **O servidor recarrega a conta a cada requisição:** papel alterado ou acesso removido valem na hora.
- **Não existe cadastro público.** O primeiro gestor de uma instalação nova é criado no servidor com `npm run criar-gestor -- email@sepal.org.br "Nome"`; os demais acessos, pela aba Missionários.

## Deploy

- **Frontend:** push no `main` → o Vercel publica sozinho.
- **API:** teste local (`npm run testar` contra um Postgres descartável) → teste no ambiente de staging → produção. Os comandos de acesso ao servidor estão em `INFRAESTRUTURA.md`. Depois de atualizar o código no servidor: `npm install --omit=dev` (se mudou dependência), `npm run migrar` (se mudou o esquema), reinicie o processo e confira os logs.
- **Antes de migrar o banco de produção, faça backup.**

## Conteúdos de apoio

Vídeo e PDF de tutorial e o PDF do instrumento de avaliação (perguntas) são gerados por scripts fora deste repositório (pasta de tutoriais do projeto) e publicados em `public/tutorial/`.
