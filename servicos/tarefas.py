from dao.tarefas_dao import TarefasDAO
from servicos.validacao_tarefa import validar_dados_tarefa, validar_tarefa_parcial

def criar_tarefa(dados, usuario_id):
    titulo = dados.get('titulo').strip()
    descricao = dados.get('descricao').strip()
    status = dados.get('status').strip()
    data_hora = dados.get('data_hora').strip()
    prioridade = dados.get('prioridade').strip()
    categoria = dados.get('categoria').strip()

    novo_id = TarefasDAO.criar_tarefa_dao(titulo, descricao, status, data_hora, prioridade, categoria, usuario_id)


    return {"message": "Tarefa criada com sucesso!"}

def listar_tarefas(usuario_id):

    tarefas = TarefasDAO.listar_tarefas(usuario_id)

    for tarefa in tarefas:
        if tarefa.get('data_hora'):
            tarefa['data_hora'] = str(tarefa['data_hora'])

    return {"tarefas": tarefas}

def editar_tarefa(tarefa_id, usuario_id, dados):
    titulo = dados.get('titulo')
    descricao = dados.get('descricao')
    status = dados.get('status')
    data_hora = dados.get('data_hora')
    prioridade = dados.get('prioridade')
    categoria = dados.get('categoria')

    erro = validar_dados_tarefa(titulo, descricao, status, data_hora, prioridade, categoria)
    if erro:
        return {"erros": erro}, 400

    resultado = TarefasDAO.editar_tarefa_dao(
        titulo=str(titulo).strip(),
        descricao=str(descricao).strip(),
        status=str(status).strip(),
        data_hora=str(data_hora).strip(),
        prioridade=str(prioridade).strip(),
        categoria=str(categoria).strip() if categoria else None,
        id=tarefa_id,
        usuario_id=usuario_id
    )

    if resultado.get("message") == "Tarefa não encontrada ou não autorizada!":
        return resultado, 404

    if "Erro" in resultado.get("message", ""):
        return resultado, 500

    return resultado, 200


def atualizar_parcial_tarefa(tarefa_id, usuario_id, dados):
    CAMPOS_PERMITIDOS = {"titulo", "descricao", "status", "data_hora", "prioridade", "categoria"}

    dados_validos = {
        chave: (valor.strip() if isinstance(valor, str) else valor)
        for chave, valor in dados.items()
        if chave in CAMPOS_PERMITIDOS
    }

    if not dados_validos:
        return {"message": "Por favor, verifique os campos editados!"}, 400

    erro = validar_tarefa_parcial(dados_validos)
    if erro:
        return {"erros": erro}, 400

    resultado = TarefasDAO.atualizar_parcial_dao(tarefa_id, usuario_id, dados_validos)

    if resultado.get("message") == "Tarefa não encontrada ou não autorizada!":
        return resultado, 404

    if "Erro" in resultado.get("message", ""):
        return resultado, 500

    return resultado, 200

def excluir_tarefa(tarefa_id, usuario_id):
    resultado = TarefasDAO.excluir_tarefa_dao(tarefa_id, usuario_id)

    if resultado.get("message") == "Tarefa não encontrada ou não autorizada!":
        return resultado, 404

    return resultado, 200