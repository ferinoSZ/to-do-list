from database import pegar_conexao
from werkzeug.security import generate_password_hash

def cadastrar_usuario(nome, email, senha):
    if not nome or not email or not senha:
        return {"message": "Todos os campos são obrigatórios!"}
    elif "@" not in email or "." not in email:
        return {"message": "Formato de e-mail inválido!"}
    
    cursor = None
    conexao = None

    try:
        conexao = pegar_conexao()
        cursor = conexao.cursor()

        senha_hash = generate_password_hash(senha)

        cursor.execute(
            "INSERT INTO usuario (nome, email, senha) VALUES (%s, %s, %s)",
            (nome, email, senha_hash)
        )
        conexao.commit()

        return {"message": "Usuário cadastrado com sucesso!"}

    except Exception as e:
        mensagem = str(e).lower()

        if "duplicate" in mensagem or "unique" in mensagem or "1062" in mensagem:
            return {"message": "Este e-mail já está cadastrado!"}

        return {"message": f"Erro ao cadastrar usuário: {str(e)}"}

    finally:
        if cursor is not None:
            cursor.close()
        if conexao is not None:
            conexao.close()