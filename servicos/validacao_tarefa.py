from datetime import datetime

STATUS_PERMITIDOS = {"Pendente", "Em Andamento", "Concluida"}
PRIORIDADES_PERMITIDAS = {"Baixa", "Media", "Alta"}
CATEGORIA_PERMITIDAS = {"Trabalho", "Estudo", "Casa", "Finanças", "Saúde", "Compras", "Compromissos","Pessoal", "Lazer", "Outros"}

NOMES_CAMPOS = {
    "titulo": "título",
    "descricao": "descrição",
    "status": "status",
    "data_hora": "data e hora",
    "prioridade": "prioridade",
    "categoria": "categoria"
}

def validar_tarefa_parcial(dados_validos):
    erros = []

    for campo, valor in dados_validos.items():
        if valor is None or not str(valor).strip():
            nome_exibicao = NOMES_CAMPOS.get(campo, campo)
            erros.append(f"O campo '{nome_exibicao}' não pode ser vazio.")

    if "status" in dados_validos and dados_validos["status"]:
        status_limpo = str(dados_validos["status"]).strip()
        if status_limpo not in STATUS_PERMITIDOS:
            opcoes = ", ".join(STATUS_PERMITIDOS)
            erros.append(f"Status inválido. Valores aceitos: {opcoes}.")

    if "prioridade" in dados_validos and dados_validos["prioridade"]:
        prioridade_limpa = str(dados_validos["prioridade"]).strip()
        if prioridade_limpa not in PRIORIDADES_PERMITIDAS:
            opcoes = ", ".join(PRIORIDADES_PERMITIDAS)
            erros.append(f"Prioridade inválida. Valores aceitos: {opcoes}.")

    if "categoria" in dados_validos and dados_validos["categoria"]:
        categoria_limpa = str(dados_validos["categoria"]).strip()
        if categoria_limpa not in CATEGORIA_PERMITIDAS:
            opcoes = ", ".join(CATEGORIA_PERMITIDAS)
            erros.append(f"Categoria inválida. Valores aceitos: {opcoes}.")

    if "data_hora" in dados_validos and dados_validos["data_hora"]:
        data_hora = dados_validos["data_hora"]
        if not isinstance(data_hora, str):
            erros.append("A data e hora deve ser uma string no formato 'YYYY-MM-DD HH:MM:SS'.")
        else:
            try:
                datetime.strptime(data_hora.strip(), "%Y-%m-%d %H:%M:%S")
            except ValueError:
                erros.append("A data e hora deve estar no formato válido 'YYYY-MM-DD HH:MM:SS'.")

    return erros

def validar_dados_tarefa(titulo, descricao, status, data_hora, prioridade, categoria):
    dados_completos = {
        "titulo": titulo,
        "descricao": descricao,
        "status": status,
        "data_hora": data_hora,
        "prioridade": prioridade
    }
    return validar_tarefa_parcial(dados_completos)
