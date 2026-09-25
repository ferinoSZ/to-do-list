# Contrato da API do To-do List

## 1. Listar tarefas

`GET /tasks`

Resposta esperada: lista de objetos de tarefa.

```json
[
  {
    "id": 1,
    "title": "Entregar trabalho",
    "description": "Enviar no ambiente virtual",
    "due_date": "2026-10-05",
    "due_time": "23:59",
    "status": "Pendente"
  }
]
```

## 2. Criar tarefa

`POST /tasks`

Body:

```json
{
  "title": "Estudar React",
  "description": "Revisar JSX e hooks",
  "due_date": "2026-10-01",
  "due_time": "19:30"
}
```

O frontend considera sucesso qualquer resposta HTTP 2xx. Para atualizar a tela sem uma nova leitura completa, é recomendado que a API retorne a tarefa criada com `id`.

## 3. Excluir tarefa

`DELETE /tasks/{id}`

Exemplo:

`DELETE /tasks/1`

O frontend aceita `204 No Content` ou qualquer resposta 2xx.

## 4. Erros

O frontend tenta mostrar `detail` ou `message` da resposta JSON. Exemplo FastAPI:

```json
{
  "detail": "Tarefa não encontrada"
}
```
