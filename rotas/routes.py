from flask import Blueprint, request, jsonify

from servicos.login import validar_login
from servicos.cadastro import cadastrar_usuario
from servicos.tarefas import criar_tarefa, listar_tarefas

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/criar', methods=['POST'])
def cadastro_usuario():
    data = request.get_json()


    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')

    
    resultado = cadastrar_usuario(nome, email, senha)
    return jsonify(resultado)

@routes_bp.route('/login', methods=['POST'])
def login_usuario():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    resultado = validar_login(email, senha)

    return jsonify(resultado)

@routes_bp.route('/tarefas', methods=['POST'])
def criar_tarefa_route():
    data = request.get_json()

    titulo = data.get('titulo')
    descricao = data.get('descricao')
    status = data.get('status')
    data_hora = data.get('data_hora')
    prioridade = data.get('prioridade')
    categoria = data.get('categoria')

    resultado = criar_tarefa(titulo, descricao, status, data_hora, prioridade, categoria)

    return jsonify(resultado)

@routes_bp.route('/tarefas', methods=['GET'])
def get_tarefas():
    resultado = listar_tarefas()
    return jsonify(resultado)