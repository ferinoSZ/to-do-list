from flask import Blueprint, request, jsonify, session

from servicos.login import validar_login
from servicos.cadastro import cadastrar_usuario
from servicos.tarefas import atualizar_parcial_tarefa, criar_tarefa, editar_tarefa, listar_tarefas, excluir_tarefa
from servicos.validacao_tarefa import validar_dados_tarefa

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

@routes_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('usuario_id', None)
    return jsonify({"message": "Logout realizado com sucesso!"}), 200

@routes_bp.route('/tarefas', methods=['POST'])
def criar_tarefa_route():
    usuario_id = session.get('usuario_id')

    if not usuario_id:
        return jsonify({"message": "Usuário não autenticado!"}), 401

    dados = request.get_json() or {}

    erros = validar_dados_tarefa(
        dados.get('titulo'),
        dados.get('descricao'),
        dados.get('status'),
        dados.get('data_hora'),
        dados.get('prioridade'),
        dados.get('categoria')
    )

    if erros:
        return jsonify({"erros": erros}), 400

    resultado = criar_tarefa(dados, usuario_id)

    return jsonify(resultado), 200

@routes_bp.route('/tarefas', methods=['GET'])
def get_tarefas():
    usuario_id = session.get('usuario_id')

    if not usuario_id:
        return jsonify({"message": "Usuário não autenticado!"}), 401
    
    resultado = listar_tarefas(usuario_id)
    return jsonify(resultado)

@routes_bp.route('/tarefas/<int:tarefa_id>', methods=['PUT'])
def rota_editar_tarefa(tarefa_id):
    usuario_id = session.get('usuario_id')
    if not usuario_id:
        return jsonify({"message": "Usuário não autenticado!"}), 401

    dados = request.get_json() or {}
    resultado, status_code = editar_tarefa(tarefa_id, usuario_id, dados)
    
    return jsonify(resultado), status_code

@routes_bp.route('/tarefas/<int:tarefa_id>', methods=['PATCH'])
def rota_atualizar_parcial_tarefa(tarefa_id):
    usuario_id = session.get('usuario_id')
    if not usuario_id:
        return jsonify({"message": "Usuário não autenticado!"}), 401

    dados = request.get_json() or {}
    resultado, status_code = atualizar_parcial_tarefa(tarefa_id, usuario_id, dados)
    
    return jsonify(resultado), status_code

@routes_bp.route('/tarefas/<int:tarefa_id>', methods=['DELETE'])
def deletar_tarefa(tarefa_id):
    usuario_id = session.get('usuario_id')
    if not usuario_id:
        return jsonify({"message": "Usuario não autenticado!"}), 401

    resultado, status_code = excluir_tarefa(tarefa_id, usuario_id)
    return jsonify(resultado), status_code