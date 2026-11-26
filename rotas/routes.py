from flask import Blueprint, request, jsonify, session

from servicos.login import validar_login
from servicos.cadastro import cadastrar_usuario
from servicos.tarefas import atualizar_parcial_tarefa, criar_tarefa, editar_tarefa, listar_tarefas, excluir_tarefa
from servicos.validacao_tarefa import validar_dados_tarefa

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('/criar', methods=['POST'])
def cadastro_usuario():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"message": "Envie os dados do cadastro em JSON."}), 400
    resultado, status = cadastrar_usuario(data.get('nome'), data.get('email'), data.get('senha'))
    return jsonify(resultado), status

@routes_bp.route('/login', methods=['POST'])
def login_usuario():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"message": "Envie os dados de acesso em JSON."}), 400
    resultado, status = validar_login(data.get('email'), data.get('senha'))
    if status == 200:
        resultado["usuario_id"] = session["usuario_id"]
    return jsonify(resultado), status

@routes_bp.get('/sessao')
def consultar_sessao():
    return jsonify({"autenticado": bool(session.get('usuario_id')), "usuario_id": session.get("usuario_id")})

@routes_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
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

    resultado, status = criar_tarefa(dados, usuario_id)
    return jsonify(resultado), status

@routes_bp.route('/tarefas', methods=['GET'])
def get_tarefas():
    usuario_id = session.get('usuario_id')

    if not usuario_id:
        return jsonify({"message": "Usuário não autenticado!"}), 401
    
    resultado, status = listar_tarefas(usuario_id)
    return jsonify(resultado), status

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
