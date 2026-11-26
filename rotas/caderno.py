import json
from contextlib import contextmanager

from flask import Blueprint, abort, jsonify, request, session
from pymysql import MySQLError
from pymysql.cursors import DictCursor

from database import pegar_conexao
from servicos.categorizador import resolver_categoria
from servicos.validacao_tarefa import validar_dados_tarefa, validar_tarefa_parcial

caderno_bp = Blueprint("caderno", __name__, url_prefix="/caderno")
POR_FOLHA = 4
CAMPOS = ("title", "description", "dueDate", "dueTime", "priority", "category", "status")


@caderno_bp.before_request
def autenticar():
    if request.method == "OPTIONS":
        return
    if not session.get("usuario_id"):
        abort(401, "Entre novamente para abrir a agenda.")
    if request.headers.get("X-Conta") != str(session["usuario_id"]):
        abort(409, "A conta mudou. Atualize a página antes de continuar.")


@caderno_bp.errorhandler(MySQLError)
def banco_indisponivel(_):
    return jsonify(message="Não foi possível sincronizar a agenda. Tente novamente."), 503


@caderno_bp.errorhandler(400)
@caderno_bp.errorhandler(401)
@caderno_bp.errorhandler(404)
@caderno_bp.errorhandler(409)
def erro_cliente(erro):
    return jsonify(message=erro.description), erro.code


@contextmanager
def transacao():
    usuario = session["usuario_id"]
    with pegar_conexao() as db, db.cursor(DictCursor) as cursor:
        cursor.execute("SELECT id FROM usuario WHERE id=%s FOR UPDATE", (usuario,))
        if not cursor.fetchone():
            abort(401, "Entre novamente.")
        yield cursor, usuario
        db.commit()


def validar_entrada(body):
    if not isinstance(body, dict):
        abort(400, "Rascunho inválido.")
    dados = body.get("dados")
    rev = body.get("revision")
    if not isinstance(rev, int) or not 0 < rev < 2**53 or not isinstance(dados, dict):
        abort(400, "Rascunho inválido.")
    if dados.get("mode") not in ("create", "duplicate", "edit"):
        abort(400, "Tipo de rascunho inválido.")
    form = dados.get("form")
    if not isinstance(form, dict) or not all(isinstance(form.get(k), str) for k in CAMPOS):
        abort(400, "Campos de rascunho inválidos.")
    if len(form["title"]) > 255 or len(form["description"].encode()) > 65535:
        abort(400, "O texto excedeu o limite da tarefa.")
    origem = dados.get("source")
    if dados["mode"] != "create" and (not isinstance(origem, dict) or not isinstance(origem.get("id"), int)):
        abort(400, "Origem da tarefa inválida.")
    return dados, rev


def selecionar(cursor, usuario, chave):
    cursor.execute("SELECT * FROM caderno_item WHERE usuario_id=%s AND chave=%s", (usuario, chave))
    return cursor.fetchone()


def guardar(cursor, usuario, chave, dados, rev):
    item = selecionar(cursor, usuario, chave)
    if item:
        if item["estado"] == "rascunho" and not item["arquivado_em"] and rev > item["revisao"]:
            cursor.execute("UPDATE caderno_item SET dados=%s, revisao=%s WHERE usuario_id=%s AND chave=%s",
                           (json.dumps(dados), rev, usuario, chave))
        return
    cursor.execute("""SELECT folha, SUM(estado <> 'retirado') AS total, MAX(arquivado_em) AS arquivo
                      FROM caderno_item WHERE usuario_id=%s GROUP BY folha ORDER BY folha DESC LIMIT 1""", (usuario,))
    ultima = cursor.fetchone()
    folha = ultima["folha"] if ultima else 1
    if ultima and (ultima["arquivo"] or ultima["total"] >= POR_FOLHA):
        folha += 1
    cursor.execute("INSERT INTO caderno_item (usuario_id,chave,folha,dados,revisao) VALUES (%s,%s,%s,%s,%s)",
                   (usuario, chave, folha, json.dumps(dados), rev))


def consultar_itens(cursor, usuario, folha=None, bloquear=False):
    sql = """SELECT c.*, t.titulo, t.descricao, t.status, t.data_hora, t.prioridade, t.categoria
             FROM caderno_item c LEFT JOIN tarefa t ON t.id=c.tarefa_id AND t.usuario_id=c.usuario_id
             WHERE c.usuario_id=%s AND c.estado <> 'retirado'"""
    params = [usuario]
    if folha is not None:
        sql += " AND c.folha=%s"
        params.append(folha)
    cursor.execute(sql + " ORDER BY c.folha, c.criado_em, c.chave" + (" FOR UPDATE" if bloquear else ""), params)
    entradas = []
    for row in cursor.fetchall():
        dados = json.loads(row["dados"])
        done = bool(row["concluido"])
        if row["estado"] == "vinculado" and row["status"] and not row["arquivado_em"]:
            data = row["data_hora"]
            dados["form"] = dict(title=row["titulo"], description=row["descricao"] or "", status=row["status"],
                                 priority=row["prioridade"], category=row["categoria"],
                                 dueDate=data.strftime("%Y-%m-%d") if data else "",
                                 dueTime=data.strftime("%H:%M") if data else "")
            done = row["status"] == "Concluida"
        entradas.append(dict(id=row["chave"], page=row["folha"], dados=dados, done=done, state=row["estado"],
                             taskId=row["tarefa_id"], revision=row["revisao"],
                             archived=row["arquivado_em"].isoformat() if row["arquivado_em"] else None))
    return entradas


@caderno_bp.get("")
def listar():
    with pegar_conexao() as db, db.cursor(DictCursor) as cursor:
        return jsonify(items=consultar_itens(cursor, session["usuario_id"]), capacity=POR_FOLHA)


@caderno_bp.put("/<uuid:chave>")
def sincronizar(chave):
    dados, rev = validar_entrada(request.get_json(silent=True))
    with transacao() as (cursor, usuario):
        guardar(cursor, usuario, str(chave), dados, rev)
    return jsonify(ok=True)


@caderno_bp.patch("/<uuid:chave>")
def marcar(chave):
    body = request.get_json(silent=True)
    if not isinstance(body, dict) or not isinstance(body.get("done"), bool):
        abort(400, "Informe o estado da entrada.")
    chave = str(chave)
    with transacao() as (cursor, usuario):
        item = selecionar(cursor, usuario, chave)
        if not item or item["estado"] == "retirado":
            abort(404, "Entrada não encontrada.")
        if item["arquivado_em"]:
            abort(409, "Esta folha já foi arquivada.")
        if item["tarefa_id"]:
            cursor.execute("UPDATE tarefa SET status=%s WHERE id=%s AND usuario_id=%s",
                           ("Concluida" if body["done"] else "Pendente", item["tarefa_id"], usuario))
        cursor.execute("UPDATE caderno_item SET concluido=%s WHERE usuario_id=%s AND chave=%s",
                       (body["done"], usuario, chave))
    return jsonify(ok=True)


def campos_tarefa(form):
    data = f"{form['dueDate']} {form['dueTime']}:00" if form.get("dueDate") and form.get("dueTime") else None
    return dict(titulo=form.get("title"), descricao=form.get("description"), status=form.get("status"),
                data_hora=data, prioridade=form.get("priority"), categoria=form.get("category"))


@caderno_bp.post("/<uuid:chave>/salvar")
def publicar(chave):
    body = request.get_json(silent=True)
    dados, rev = validar_entrada(body)
    chave = str(chave)
    with transacao() as (cursor, usuario):
        guardar(cursor, usuario, chave, dados, rev)
        item = selecionar(cursor, usuario, chave)
        if item["estado"] != "rascunho":
            return jsonify(ok=True, id=item["tarefa_id"])
        if item["arquivado_em"] or item["revisao"] > rev:
            abort(409, "A entrada mudou. Feche o formulário e abra a versão atual.")
        fields = campos_tarefa(dados["form"])
        fields["categoria"] = resolver_categoria(fields["categoria"], fields["descricao"])
        if dados["mode"] == "edit":
            original = campos_tarefa(dados["source"])
            changes = {key: value for key, value in fields.items() if value != original[key]}
            erros = validar_tarefa_parcial(changes)
            if erros:
                abort(400, " ".join(erros))
            tarefa = dados["source"]["id"]
            cursor.execute("SELECT id FROM tarefa WHERE id=%s AND usuario_id=%s FOR UPDATE", (tarefa, usuario))
            if not cursor.fetchone():
                abort(404, "A tarefa original foi excluída. O texto continua na agenda.")
            if changes:
                colunas = ", ".join(key + "=%s" for key in changes)
                cursor.execute("UPDATE tarefa SET " + colunas + " WHERE id=%s AND usuario_id=%s",
                               (*changes.values(), tarefa, usuario))
        else:
            erros = validar_dados_tarefa(**fields)
            if erros:
                abort(400, " ".join(erros))
            cursor.execute("""INSERT INTO tarefa (titulo,descricao,status,data_hora,prioridade,categoria,usuario_id)
                              VALUES (%s,%s,%s,%s,%s,%s,%s)""", (*fields.values(), usuario))
            tarefa = cursor.lastrowid
        dados["form"]["category"] = fields["categoria"]
        estado = "vinculado" if body.get("fromBook") is True else "retirado"
        cursor.execute("""UPDATE caderno_item SET estado=%s,tarefa_id=%s,concluido=%s,dados=%s
                          WHERE usuario_id=%s AND chave=%s""",
                       (estado, tarefa, fields["status"] == "Concluida", json.dumps(dados if estado == "vinculado" else {}), usuario, chave))
    return jsonify(ok=True, id=tarefa)


@caderno_bp.post("/folhas/<int:folha>/arquivar")
def arquivar(folha):
    with transacao() as (cursor, usuario):
        itens = consultar_itens(cursor, usuario, folha, bloquear=True)
        if not itens:
            abort(404, "Folha não encontrada.")
        if all(item["archived"] for item in itens):
            return jsonify(ok=True)
        if len(itens) != POR_FOLHA or not all(item["done"] for item in itens):
            abort(409, "A folha precisa estar cheia e com todas as entradas concluídas.")
        for item in itens:
            cursor.execute("""UPDATE caderno_item SET arquivado_em=UTC_TIMESTAMP(), dados=%s, concluido=1
                              WHERE usuario_id=%s AND chave=%s""",
                           (json.dumps(item["dados"]), usuario, item["id"]))
    return jsonify(ok=True)
