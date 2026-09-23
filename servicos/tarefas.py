from database import pegar_conexao

def criar_tarefa(titulo, descricao, status, data_hora, prioridade, categoria):
    if not titulo or not descricao or not status or not data_hora or not prioridade or not categoria:
        return {"message": "Todos os campos são obrigatórios!"}
    cursor = None
    conexao = None
    try:
        conexao = pegar_conexao()
        cursor = conexao.cursor()

        cursor.execute("""
        INSERT INTO tarefa (titulo, descricao, status, data_hora, prioridade, categoria) VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (titulo, descricao, status, data_hora, prioridade, categoria))
        conexao.commit()
        return {"message": "Tarefa criada com sucesso!"}
    
    except Exception as e:
        return {"message": f"Erro ao criar tarefa: {str(e)}"}
    
    finally:
        if cursor is not None:
            cursor.close()
        if conexao is not None:
            conexao.close()

def listar_tarefas():
    cursor = None
    conexao = None

    try:
        conexao = pegar_conexao()
        cursor = conexao.cursor()

        cursor.execute("""
        SELECT id, titulo, descricao, status, data_hora, prioridade, categoria
        FROM tarefa
        ORDER BY data_hora DESC
        """)

        tarefas = cursor.fetchall()

        return{"tarefas": tarefas}
    
    except Exception as e:
        return {"message": f"Erro ao listar tarefas: {str(e)}"}

    finally:
        if cursor is not None:
            cursor.close()
        if conexao is not None:
            conexao.close()