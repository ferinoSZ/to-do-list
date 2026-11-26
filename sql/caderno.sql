CREATE TABLE IF NOT EXISTS caderno_item (
    usuario_id INT NOT NULL,
    chave CHAR(36) NOT NULL,
    folha INT NOT NULL,
    dados JSON NOT NULL,
    revisao BIGINT NOT NULL,
    criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    estado ENUM('rascunho','vinculado','retirado') NOT NULL DEFAULT 'rascunho',
    concluido BOOLEAN NOT NULL DEFAULT FALSE,
    tarefa_id INT NULL,
    arquivado_em DATETIME NULL,
    PRIMARY KEY (usuario_id, chave),
    INDEX (usuario_id, folha),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    FOREIGN KEY (tarefa_id) REFERENCES tarefa(id) ON DELETE SET NULL
);
