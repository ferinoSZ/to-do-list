from flask import jsonify

from database import pegar_conexao
from werkzeug.security import check_password_hash


def validar_login(email, senha):
    if not email or not senha:
        return {"message": "Todos os campos são obrigatórios!"}

    cursor = None
    conexao = None

    try:
        conexao = pegar_conexao()
        cursor = conexao.cursor()

        cursor.execute("SELECT senha FROM usuario WHERE email = %s", (email,))
        resultado = cursor.fetchone()


        if resultado is None:
            return {"message": "Email ou senha inválidos!"}

        senha_hash = resultado[0]

        if check_password_hash(senha_hash, senha):
            return {"message": "Login realizado com sucesso!"}
        else:
            return {"message": "Email ou senha inválidos!"}
        
    except Exception as e:
        return {"message": f"Erro ao realizar login: {str(e)}"}
    
    finally:
        if cursor is not None:
            cursor.close()
        if conexao is not None:
            conexao.close()