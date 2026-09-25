# To-do List — React + FastAPI

Frontend minimalista em React para um backend REST em FastAPI.

## Funcionalidades

- Carregar tarefas da API (`GET /tasks`)
- Criar tarefas (`POST /tasks`)
- Solicitar confirmação antes da exclusão
- Excluir tarefas após confirmação (`DELETE /tasks/{id}`)
- Toast de confirmação para criação, exclusão e erros
- Botão flutuante `+` com tooltip acessível: "Criar nova tarefa"
- Layout responsivo, teclado, foco visível e estados de carregamento/erro

## Stack

- React 19
- Vite 8
- JavaScript (JSX)
- CSS sem framework
- `fetch` nativo para HTTP

## Requisitos

Vite 8 requer Node.js 20.19+ ou 22.12+.

## Executando

```bash
npm install
copy .env.example .env
npm run dev
```

No PowerShell, o segundo comando pode ser:

```powershell
Copy-Item .env.example .env
```

A aplicação abre em `http://localhost:5173`.

## Conexão com FastAPI

Edite `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_TASKS_PATH=/tasks
```

O código de consumo fica centralizado em `src/services/tasksApi.js`.

### Contrato esperado

**GET `/tasks`**

Pode retornar:

```json
[
  {
    "id": 1,
    "title": "Estudar React",
    "description": "Revisar componentes e hooks",
    "due_date": "2026-10-01",
    "due_time": "19:30",
    "status": "Pendente"
  }
]
```

Ou um objeto com `items` ou `tasks` contendo a lista.

**POST `/tasks`**

Body enviado pelo frontend:

```json
{
  "title": "Estudar React",
  "description": "Revisar componentes e hooks",
  "due_date": "2026-10-01",
  "due_time": "19:30"
}
```

O ideal é a API responder com a tarefa criada, incluindo seu `id`.

**DELETE `/tasks/{id}`**

Exemplo: `DELETE /tasks/1`.

## Onde adaptar se seu FastAPI usar outro contrato

Edite apenas `src/services/tasksApi.js`:

- `VITE_TASKS_PATH` para o caminho do router (por exemplo, `/api/tasks`)
- `normalizeTask()` para mapear os nomes enviados pelo backend
- `createTask()` se o schema do POST for diferente
- `deleteTask()` se a rota de exclusão tiver outro formato

A UI não precisa ser alterada para ajustes de contrato da API.
