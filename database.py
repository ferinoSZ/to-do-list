import pymysql

from config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB, MYSQL_PORT

def pegar_conexao():
    return pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        database=MYSQL_DB,
        password=MYSQL_PASSWORD,
        port=MYSQL_PORT
    )
