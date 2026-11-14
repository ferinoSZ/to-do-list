import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from servicos.dataset_categorizacao import DADOS_TREINO

class CategorizadorInteligente:
    def __init__(self):
        textos = [item[0] for item in DADOS_TREINO]
        categorias = [item[1] for item in DADOS_TREINO]

        self.modelo = Pipeline([
            ('tfidf', TfidfVectorizer(
                analyzer='char_wb', 
                ngram_range=(3, 5), 
                lowercase=True
            )),
            ('clf', LinearSVC(random_state=42))
        ])

        self.modelo.fit(textos, categorias)

    def prever(self, descricao: str) -> str:
        if not descricao or len(descricao.strip()) < 3:
            return "Outros"
        
        scores = self.modelo.decision_function([descricao])
        max_score = np.max(scores) if scores.ndim > 1 else np.max(scores)
        
        LIMIAR_CONFIANCA = 0.0 
        if max_score < LIMIAR_CONFIANCA:
            return "Outros"
        
        predicao = self.modelo.predict([descricao])
        return predicao[0]

categorizador = CategorizadorInteligente()