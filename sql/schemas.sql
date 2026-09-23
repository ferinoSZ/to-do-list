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
    categoria ENUM('Trabalho', 'Casa', 'Estudo', 'Urgente', 'Lazer', 'Outros') NOT NULL DEFAULT 'Outros'
);