import { ConceptSlide, EmbeddingLabGraphic, VectorSpaceGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function VectorSimilaritySlide(props: LearningSlideProps) {
  return <ConceptSlide number={4} eyebrow="geometría semántica" title="Vectores y similitud: comparar significado"
    lead="Los vectores permiten calcular qué textos tienen direcciones semánticas parecidas. El ID del vector ganador permite volver al texto original; el vector no se decodifica."
    analogy="Imagina un mapa: textos relacionados quedan en barrios cercanos. La distancia expresa separación entre direcciones, no una coincidencia literal de palabras."
    misconception="Una distancia de 0.08 es la separación entre el vector de la pregunta y el vector de un chunk. Sirve para ordenar candidatos dentro del mismo índice: cuanto menor sea frente a las demás, más cerca están sus direcciones semánticas. No significa 92 % de confianza, no confirma que el texto sea correcto y no es una probabilidad."
    technical={<><p>La distancia coseno compara la orientación de dos vectores; cerca de 0 suele indicar direcciones parecidas.</p><ul><li>En el laboratorio educativo, FastAPI calcula la distancia. En la recuperación RAG, Chroma realiza la comparación vectorial y devuelve el valor al backend.</li><li>Una distancia solo es comparable con resultados del mismo modelo de embeddings, la misma métrica y el mismo índice.</li><li>La proyección 2D es didáctica: el vector real tiene muchas dimensiones.</li></ul></>}><div className="learning-section-stack"><VectorSpaceGraphic /><EmbeddingLabGraphic model={props.labModel} query={props.labQuery} candidatesText={props.labCandidates} result={props.labResult} busy={props.labBusy} error={props.labError} onModel={props.setLabModel} onQuery={props.setLabQuery} onCandidates={props.setLabCandidates} onRun={props.runEmbeddingLab} /></div></ConceptSlide>
}
