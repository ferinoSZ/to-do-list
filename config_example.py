import os

# Copie para config.py e defina as variáveis no ambiente.
# Gere SECRET_KEY uma vez com: python -c "import secrets; print(secrets.token_hex(32))"
secret_key = os.environ["SECRET_KEY"]
MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", "3306"))
MYSQL_USER = os.environ["MYSQL_USER"]
MYSQL_PASSWORD = os.environ["MYSQL_PASSWORD"]
MYSQL_DB = os.environ.get("MYSQL_DB", "lista")
