# 🚀 Task Management API with AI Categorizer

API RESTful modular desenvolvida em Python (Flask) com persistência em MySQL, estruturada em camadas (DAO, Service, Controller) e equipada com um **módulo de Inteligência Artificial** para auto-categorização inteligente de tarefas usando Processamento de Linguagem Natural (NLP).

---

## 🛠️ Tecnologias e Ferramentas

* **Linguagem:** Python 3.10+
* **Framework Web:** Flask
* **Banco de Dados:** MySQL / PyMySQL
* **Machine Learning / NLP:** `scikit-learn` (`LinearSVC`, `TfidfVectorizer`)
* **Arquitetura:** Padrão N-Tiers (Separação de responsabilidades: Rotas/Controllers, Serviços de Negócio e DAOs)

---

## 🧠 O Diferencial: IA de Auto-Categorização (Human-in-the-Loop)

O grande destaque deste projeto é a autonomia inteligente no cadastro de tarefas:
1. **Predição Automática:** Se o usuário enviar uma tarefa **sem** especificar a categoria, a API aciona um modelo supervisionado baseado em vetores TF-IDF e `LinearSVC` para prever a categoria ideal (ex: *Compras*, *Trabalho*, *Saúde*).
2. **Soberania Humana:** O sistema prioriza a escolha manual do usuário. Se a categoria for informada no payload, a IA não interfere (respeitando o princípio *Human-in-the-Loop*).
3. **Robustez e Fallback:** O modelo conta com um limiar de confiança (`LIMIAR_CONFIANCA`) e tratamento de casos Out-of-Vocabulary (OOV) para direcionar termos desconhecidos para a categoria padrão *"Outros"*.

---

No formulário, **Automática (IA)** mostra a sugestão após uma pausa na digitação. Ao salvar, inclusive pela agenda, a API usa a descrição final ou a categoria escolhida pela pessoa.

Para atualizar um banco criado com a lista antiga de categorias, execute `sql/categorias_tarefa.sql` no banco do projeto. Instalações novas já incluem as categorias em `sql/schemas.sql`.

## 📁 Arquitetura do Projeto

```text
api-tarefas/
│
├── dao/                  # Camada de Acesso a Dados (Queries SQL / MySQL)
├── servicos/             # Regras de negócio e motor de Inteligência Artificial
│   ├── categorizador.py  # Pipeline do scikit-learn (LinearSVC + TF-IDF)
│   ├── dataset_treino.py # Base de conhecimento supervisionada
│   └── tarefas.py        # Integração entre validação, IA e persistência
├── rotas/                # Endpoints e Controllers da API Flask
└── app.py                # Ponto de entrada da aplicação
```

---

## 🔌 Endpoints Principais

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/tarefas` | Cria uma nova tarefa (com suporte a auto-categorização via IA) |
| `POST` | `/tarefas/sugestao-categoria` | Recebe `{"descricao":"Comprar pão e leite no mercado"}` e retorna `{"categoria":"Compras"}` para a sessão autenticada, sem gravar uma tarefa. |
| `GET` | `/tarefas` | Lista todas as tarefas cadastradas |
| `PATCH` | `/tarefas/<id>` | Atualiza dados da tarefa (permitindo alteração manual de categoria) |
| `DELETE` | `/tarefas/<id>` | Remove uma tarefa do sistema |

