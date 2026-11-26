create database lista;

use lista;

create table usuario(
id int Primary key auto_increment,
nome varchar(100) NOT NULL,
email varchar(100) NOT NULL Unique,
senha varchar(300) NOT NULL
);

CREATE TABLE tarefa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    status ENUM('Pendente', 'Em Andamento', 'Concluida') NOT NULL DEFAULT 'Pendente',
    data_hora DATETIME,
    prioridade ENUM('Alta', 'Media', 'Baixa') NOT NULL DEFAULT 'Baixa',
    categoria ENUM('Trabalho', 'Casa', 'Estudo', 'Urgente', 'Lazer', 'Outros') NOT NULL DEFAULT 'Outros',
    usuario_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

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
