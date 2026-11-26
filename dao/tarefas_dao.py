from database import pegar_conexao
from pymysql.cursors import DictCursor

class TarefasDAO:
    @staticmethod
    def criar_tarefa_dao(titulo, descricao, status, data_hora, prioridade, categoria, usuario_id):
        cursor = None
        conexao = None

        try:
            conexao = pegar_conexao()
            cursor = conexao.cursor()

            sql = """
                INSERT INTO tarefa (titulo, descricao, status, data_hora, prioridade, categoria, usuario_id) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            valores = (
                titulo,
                descricao,
                status,
                data_hora,
                prioridade,
                categoria if categoria else None,
                usuario_id
            )

            cursor.execute(sql, valores)
            conexao.commit()

        
        except Exception as e:
            return {"message": f"Erro ao criar tarefa: {str(e)}"}
        
        finally:
            if cursor is not None:
                cursor.close()
            if conexao is not None:
                conexao.close()

    def listar_tarefas(usuario_id):
        cursor = None
        conexao = None

        try:
            conexao = pegar_conexao()
            cursor = conexao.cursor(DictCursor)

            sql = "SELECT id, titulo, descricao, status, data_hora, prioridade, categoria FROM tarefa WHERE usuario_id = %s"
            cursor.execute(sql, (usuario_id,))
            tarefas = cursor.fetchall()

            return tarefas
        
        except Exception as e:
            return {"message": f"Erro ao listar tarefas: {str(e)}"}
        
        finally:
            if cursor is not None:
                cursor.close()
            if conexao is not None:
                conexao.close()

    def editar_tarefa_dao(titulo, descricao, status, data_hora, prioridade, categoria, id, usuario_id):
        cursor = None
        conexao = None

        try:
            conexao = pegar_conexao()
            cursor = conexao.cursor()

            sql = """
                UPDATE tarefa
                SET titulo = %s, descricao = %s, status = %s, data_hora = %s, prioridade = %s, categoria = %s
                WHERE id = %s AND usuario_id = %s
            """
            valores = (titulo, descricao, status, data_hora, prioridade, categoria, id, usuario_id)
            cursor.execute(sql, valores)
            conexao.commit()

            if cursor.rowcount == 0:
                return {"message": "Tarefa não encontrada ou não autorizada!"}
            return {"message": "Tarefa editada com sucesso!"}

        except Exception as e:
            return {"message": f"Erro ao editar tarefa: {str(e)}"}
        
        finally:
            if cursor is not None:
                cursor.close()
            if conexao is not None:
                conexao.close()

    @staticmethod
    def atualizar_parcial_dao(tarefa_id, usuario_id, dados_validos):    
        conexao = None
        cursor = None

        try:
            conexao = pegar_conexao()
            cursor = conexao.cursor()

            colunas = []
            valores = []

            for chave, valor in dados_validos.items():
                colunas.append(f"{chave} = %s")
                valores.append(valor)

            valores.append(tarefa_id)
            valores.append(usuario_id)

            campos_sql = ", ".join(colunas)
            sql = f"""
                UPDATE tarefa   
                SET {campos_sql}
                WHERE id = %s AND usuario_id = %s
            """

            cursor.execute(sql, tuple(valores))

            if cursor.rowcount == 0:
                sql = "SELECT id FROM tarefa WHERE id = %s AND usuario_id = %s"
                cursor.execute(sql, (tarefa_id, usuario_id))
                usuario = cursor.fetchone()
                if usuario:
                    return {"message": "Tarefa atualizada com sucesso!"}
                else:
                    return {"message": "Tarefa não encontrada ou não autorizada!"}

            conexao.commit()
            return {"message": "Tarefa atualizada com sucesso!"}

        except Exception as e:
            if conexao:
                conexao.rollback()
            return {"message": f"Erro ao atualizar tarefa: {str(e)}"}

        finally:
            if cursor:
                cursor.close()
            if conexao:
                conexao.close()

    @staticmethod
    def excluir_tarefa_dao(tarefa_id, usuario_id):
        cursor = None
        conexao = None

        try:
            conexao = pegar_conexao()
            cursor = conexao.cursor()

            sql = "DELETE FROM tarefa WHERE id = %s AND usuario_id = %s"
            cursor.execute(sql, (tarefa_id, usuario_id))

            if cursor.rowcount == 0:
                return {"message": "Tarefa não encontrada ou não autorizada!"}

            conexao.commit()
            return {"message": "Tarefa excluída com sucesso!"}

        except Exception as e:
            if conexao:
                conexao.rollback()
            return {"message": f"Erro ao excluir tarefa: {str(e)}"}

        finally:
            if cursor:
                cursor.close()
            if conexao:
                conexao.close()
