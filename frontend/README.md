# Minhas tarefas

Interface React para a API Flask do projeto. A página inicial apresenta o cadastro. Quem já tem conta pode usar **Entrar** ou acessar `/#login`. Depois de criar a conta, o usuário chega ao login com o e-mail preenchido. A sessão permite criar, buscar, filtrar, editar, concluir, reabrir, duplicar e excluir tarefas da conta. A exclusão exige confirmação.

## Agenda de rascunhos

O preenchimento é gravado no navegador a cada alteração e sincronizado com a conta após uma pausa na digitação. Se a aba fechar antes da sincronização, abra a agenda no mesmo navegador e na mesma conta para recuperar a cópia local. Ao continuar uma entrada e salvar a tarefa, a folha acompanha seu status. O Arquivo morto guarda uma cópia dos dados no momento do arquivamento.

Com a agenda aberta, arraste uma folha, use as setas do teclado ou escolha uma aba numerada na lateral. As páginas em branco também podem ser folheadas. Quando as quatro entradas de uma página estão concluídas, a aba ganha um visto. A página continua no caderno até você escolher **Limpar folha**.

Em bancos já instalados, execute `sql/caderno.sql` no banco do projeto. Em uma instalação nova, a tabela está incluída em `sql/schemas.sql`.

## Desenvolvimento local

1. Na raiz do projeto, instale as dependências com `python -m pip install -r requirements.txt`.
2. Prepare o MySQL. Para um banco novo, use `sql/schemas.sql`. Em instalações anteriores, confira se a tabela `tarefa` já tem a coluna `usuario_id` vinculada a `usuario.id`. A migração de registros existentes depende de identificar seus proprietários.
3. Na raiz, copie `config_example.py` para `config.py` caso precise de uma configuração nova. Defina as variáveis de ambiente `MYSQL_USER`, `MYSQL_PASSWORD` e `SECRET_KEY`. O exemplo usa o banco `lista` na porta 3306 de localhost. O comando para gerar a chave de sessão está no próprio arquivo.
4. Inicie a API com `python app.py`. Em outro terminal, entre em `frontend`, execute `npm ci` e depois `npm run dev`. Abra [Minhas tarefas](http://localhost:5173).

## Conexão e sessão

O frontend usa `VITE_API_BASE_URL` e `VITE_TASKS_PATH`, configurados em `.env`. Os valores padrão apontam para `http://localhost:5000` e `/tarefas`. O Flask aceita o frontend de `http://localhost:5173` por padrão. Para outra origem, configure `FRONTEND_ORIGIN` no ambiente da API. Use o mesmo hostname em ambos para que o navegador envie o cookie de sessão.

O cadastro usa `POST /criar`. O login e a saída usam `POST /login` e `POST /logout`. Ao abrir a página, a interface consulta `GET /sessao` para reconhecer uma sessão ativa. O botão de olho permite conferir a senha durante a digitação.

## Build

Execute `npm run build` na pasta `frontend`. O resultado fica em `dist/`. A política de segurança de conteúdo do build autoriza conexões à origem da API configurada durante a compilação.
