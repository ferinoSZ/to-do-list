ALTER TABLE tarefa
    MODIFY COLUMN categoria ENUM('Trabalho', 'Casa', 'Estudo', 'Urgente', 'Lazer', 'Outros', 'Finanças', 'Saúde', 'Compras', 'Compromissos', 'Pessoal') NOT NULL DEFAULT 'Outros';
