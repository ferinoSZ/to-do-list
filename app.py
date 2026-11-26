import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from config import secret_key
from rotas.routes import routes_bp
from rotas.caderno import caderno_bp


app = Flask(__name__)
app.secret_key = secret_key
origem_frontend = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").rstrip("/")
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=origem_frontend.startswith("https://"),
)
CORS(app, origins=[origem_frontend], supports_credentials=True)
app.register_blueprint(routes_bp)
app.register_blueprint(caderno_bp)


@app.before_request
def verificar_origem():
    origem = request.headers.get("Origin")
    if request.method not in {"GET", "HEAD", "OPTIONS"} and origem:
        if origem not in {origem_frontend, request.host_url.rstrip("/")}:
            return jsonify({"message": "Origem não permitida."}), 403


@app.after_request
def proteger_resposta(response):
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


if __name__ == '__main__':
    app.run()
