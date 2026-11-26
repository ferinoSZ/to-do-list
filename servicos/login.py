from flask import session
from pymysql import MySQLError
from werkzeug.security import check_password_hash

from database import pegar_conexao


def validar_login(email, senha):
    if not isinstance(email, str) or not isinstance(senha, str) or not email.strip() or not senha:
        return {"message": "Preencha o e-mail e a senha."}, 400
    try:
        with pegar_conexao() as conexao, conexao.cursor() as cursor:
            cursor.execute("SELECT id, senha FROM usuario WHERE email = %s", (email.strip(),))
            usuario = cursor.fetchone()
    except MySQLError:
        return {"message": "Login indisponível. Tente novamente em instantes."}, 503

    if not usuario or not check_password_hash(usuario[1], senha):
        return {"message": "E-mail ou senha incorretos."}, 401
    session.clear()
    session["usuario_id"] = usuario[0]
    return {"message": "Login realizado com sucesso!"}, 200
