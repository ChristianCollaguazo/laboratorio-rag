import { ConceptSlide, RetrievalGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function RetrievalSlide(props: LearningSlideProps) {
  return <ConceptSlide number={8} eyebrow="búsqueda" title="Recuperar es convertir la pregunta y ordenar candidatos"
    lead="La pregunta pasa por el mismo modelo de embeddings. Chroma consulta el índice para encontrar los vecinos más cercanos, los ordena por distancia y top_k decide cuántos pasan al contexto."
    analogy="Es pedir a la biblioteca que ordene todas las fichas por cercanía temática y luego decir: “tráeme las primeras k”. Si k vale 2, llevas dos fichas a la mesa."
    misconception="top_k no es un porcentaje ni un mínimo de calidad. Aunque un resultado sea lejano, entrará si está entre los primeros k. Recuperar candidatos tampoco significa que la pregunta ya esté respondida."
    technical={<><p>El ranking se ordena por distancia coseno ascendente y conserva los primeros <code>k</code>.</p><ul><li><strong>Cobertura:</strong> traer suficiente evidencia relevante.</li><li><strong>Precisión:</strong> evitar chunks irrelevantes o ruido.</li><li>Conceptualmente se comparan vectores; para escalar, una base vectorial suele usar búsqueda aproximada de vecinos —ANN— en vez de recorrerlos todos uno por uno.</li><li>Filtros, umbrales, reranking y búsqueda híbrida pueden mejorar el ranking; no forman parte de la POC básica.</li></ul></>}><RetrievalGraphic topK={props.topK} onTopK={props.setTopK} /></ConceptSlide>
}
