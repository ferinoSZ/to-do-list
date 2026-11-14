from flask import Flask
from rotas.routes import routes_bp
from flask_cors import CORS
from config import secret_key


app = Flask(__name__)
app.secret_key = secret_key
print("CHAVE CARREGADA:", app.secret_key)
CORS(app)

app.register_blueprint(routes_bp)

if __name__ == '__main__':
    app.run(debug=True)