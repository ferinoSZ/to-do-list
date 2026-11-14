# servicos/dataset_categorizacao.py

DADOS_TREINO = [
    # Trabalho
    ("Reunião com o cliente para alinhar o escopo do projeto", "Trabalho"),
    ("Enviar relatório de entregas semanais para o gerente", "Trabalho"),
    ("Fazer deploy da API no servidor de homologação", "Trabalho"),
    ("Corrigir bug crítico no sistema de login", "Trabalho"),
    ("Atualizar o status das tasks no Jira", "Trabalho"),
    ("Apresentar os resultados da sprint para a diretoria", "Trabalho"),

    # Estudo
    ("Estudar algoritmos de estruturas de dados avançadas", "Estudo"),
    ("Assistir aula de arquitetura de software na faculdade", "Estudo"),
    ("Praticar exercícios de Python no LeetCode", "Estudo"),
    ("Ler documentação oficial do Flask e PyMySQL", "Estudo"),
    ("Preparar o banner para a apresentação acadêmica", "Estudo"),
    ("Fazer a entrega do trabalho da faculdade", "Estudo"),

    # Casa
    ("Lavar a louça e organizar a cozinha", "Casa"),
    ("Consertar a torneira da pia que está vazando", "Casa"),
    ("Lavar e estender as roupas acumuladas", "Casa"),
    ("Limpar os quartos e trocar a roupa de cama", "Casa"),
    ("Regar as plantas da varanda", "Casa"),

    # Finanças
    ("Pagar a fatura do cartão de crédito", "Finanças"),
    ("Pagar a conta de luz e internet", "Finanças"),
    ("Transferir dinheiro para a conta poupança", "Finanças"),
    ("Verificar o extrato bancário do mês", "Finanças"),
    ("Pagar o boleto do IPVA do carro", "Finanças"),

    # Saúde
    ("Marcar consulta de rotina com o cardiologista", "Finanças".replace("Finanças", "Saúde")), # (ou apenas "Saúde")
    ("Ir à academia fazer treino de musculação", "Saúde"),
    ("Comprar os remédios na farmácia", "Saúde"),
    ("Fazer exame de sangue em jejum", "Saúde"),
    ("Cortar o cabelo na barbearia", "Saúde"),
    ("Marcar consulta de rotina com o cardiologista", "Saúde"),
    ("Marcar consulta na Unimed para ultrassonografia", "Saúde"),
    ("Consulta com ortopedista por causa de dor no joelho", "Saúde"),
    ("Fazer exames de sangue e imagem", "Saúde"),
    ("Ir à academia fazer treino de musculação", "Saúde"),
    ("Comprar os remédios na farmácia", "Saúde"),
    ("Cortar o cabelo na barbearia", "Saúde"),

    # Compras
    ("Comprar leite, pão e ovos no supermercado", "Compras"),
    ("Comprar pão e leite no mercado", "Compras"),
    ("Comprar um novo par de tênis", "Compras"),
    ("Encomendar ração para o cachorro", "Compras"),
    ("Comprar papel higiênico e produtos de limpeza", "Compras"),
    ("Comprar leite Ninho e café no supermercado", "Compras"),
    ("Comprar ingredientes para o café da manhã", "Compras"),
    ("Comprar snacks e bebidas para o fim de semana", "Compras"),
    ("Comprar produtos de higiene pessoal", "Compras"),

    # Compromissos
    ("Levar o carro para a revisão na oficina", "Compromissos"),
    ("Consulta com o dentista marcada para as 14h", "Compromissos"),
    ("Participar da festa de aniversário do amigo", "Compromissos"),
    ("Reunião de condomínio no salão de festas", "Compromissos"),

    # Lazer
    ("Jogar partida de Pro Clubs no EA Sports FC com os amigos", "Lazer"),
    ("Assistir ao novo filme que estreou no cinema", "Lazer"),
    ("Jogar Rocket League no PC para relaxar", "Lazer"),
    ("Fazer um churrasco no fim de semana", "Lazer"),
    ("Assistir à série nova na Netflix", "Lazer"),

    # Pessoal
    ("Responder mensagens pendentes no WhatsApp", "Pessoal"),
    ("Fazer backup das fotos do celular no computador", "Pessoal"),
    ("Organizar a caixa de entrada do e-mail pessoal", "Pessoal"),
    ("Ler um livro de desenvolvimento pessoal antes de dormir", "Pessoal"),

    # Outros
    ("Dar uma volta rápida na praça", "Outros"),
    ("Jogar o lixo fora", "Outros"),
    ("Verificar o correio", "Outros"),
]