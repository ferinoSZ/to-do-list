import re

from pymysql import IntegrityError, MySQLError
from werkzeug.security import generate_password_hash

from database import pegar_conexao


def cadastrar_usuario(nome, email, senha):
    if not all(isinstance(valor, str) for valor in (nome, email, senha)):
        return {"message": "Preencha o nome, o e-mail e a senha."}, 400
    nome, email = nome.strip(), email.strip()
    if not 1 <= len(nome) <= 100:
        return {"message": "Informe um nome de até 100 caracteres."}, 400
    if len(email) > 100 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return {"message": "Informe um e-mail válido."}, 400
    if not 15 <= len(senha) <= 128:
        return {"message": "Use uma senha de 15 a 128 caracteres."}, 400

    senha_hash = generate_password_hash(senha, method="scrypt")
    try:
        with pegar_conexao() as conexao, conexao.cursor() as cursor:
            cursor.execute(
                "INSERT INTO usuario (nome, email, senha) VALUES (%s, %s, %s)",
                (nome, email, senha_hash),
            )
            conexao.commit()
    except IntegrityError as erro:
        if erro.args[0] == 1062:
            return {"message": "Este e-mail já tem uma conta. Entre para continuar."}, 409
        return {"message": "Não foi possível criar sua conta agora."}, 500
    except MySQLError:
        return {"message": "Cadastro indisponível. Tente novamente em instantes."}, 503
    return {"message": "Usuário cadastrado com sucesso!"}, 201
