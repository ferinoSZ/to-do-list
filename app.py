from flask import Flask
from rotas.routes import routes_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.register_blueprint(routes_bp)

if __name__ == '__main__':
    app.run(debug=True)