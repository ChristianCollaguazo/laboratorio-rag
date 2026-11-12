import { ConceptSlide, VectorSpaceGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function VectorSimilaritySlide(_props: LearningSlideProps) {
  return <ConceptSlide number={6} eyebrow="geometría semántica" title="Cercanía entre vectores, no coincidencia literal"
    lead="La búsqueda compara la posición del vector de la pregunta con las posiciones de los chunks y ordena los más cercanos."
    analogy="Imagina un mapa: la distancia indica qué casas están más cerca de tu ubicación. top_k es pedir “tráeme las k casas más cercanas”; por ejemplo, con k = 3 conservas las primeras tres."
    misconception="Una distancia de 0.08 es la separación entre el vector de la pregunta y el vector de un chunk. Sirve para ordenar candidatos dentro del mismo índice: cuanto menor sea frente a las demás, más cerca están sus direcciones semánticas. No significa 92 % de confianza, no confirma que el texto sea correcto y no es una probabilidad."
    technical={<><p>La distancia coseno compara la orientación de dos vectores; cerca de 0 suele indicar direcciones parecidas.</p><ul><li>En el laboratorio educativo, FastAPI calcula la distancia. En la recuperación RAG, Chroma realiza la comparación vectorial y devuelve el valor al backend.</li><li>El frontend solo muestra el resultado y la fórmula didáctica.</li><li>Una distancia solo es comparable con resultados del mismo modelo de embeddings, la misma métrica y el mismo índice.</li><li>No existe un valor universal que garantice relevancia.</li><li>La proyección 2D es didáctica: el vector real tiene muchas dimensiones.</li></ul></>}><VectorSpaceGraphic /></ConceptSlide>
}
