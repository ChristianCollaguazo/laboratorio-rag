import { ConceptSlide, RetrievalGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function RetrievalSlide(props: LearningSlideProps) {
  return <ConceptSlide number={6} eyebrow="búsqueda" title="Recuperar: vectorizar la pregunta para comparar"
    lead="Los chunks ya están guardados como vectores. Para compararlos semánticamente, la pregunta debe pasar por el mismo modelo y convertirse en un vector temporal dentro del mismo espacio."
    analogy="Es pedir a la biblioteca que ordene todas las fichas por cercanía temática y luego decir: “tráeme las primeras k”. Si k vale 2, llevas dos fichas a la mesa."
    misconception="No se vectoriza la respuesta del LLM para responder esta pregunta. Se vectorizan documentos y consulta para buscarlos; la salida de recuperación son candidatos, todavía no una respuesta. top_k tampoco es un porcentaje ni un mínimo de calidad."
    technical={<><p>El mismo modelo y dimensión hacen comparables ambos lados: vector de consulta y vectores del índice. El vector de consulta se usa para buscar y no necesita guardarse.</p><ul><li>El ranking se ordena por distancia coseno ascendente y conserva los primeros <code>k</code>.</li><li><strong>Cobertura:</strong> traer suficiente evidencia relevante.</li><li><strong>Precisión:</strong> evitar chunks irrelevantes o ruido.</li><li>ANN, filtros, umbrales, reranking y búsqueda híbrida son extensiones avanzadas, no parte del flujo básico.</li></ul></>}><RetrievalGraphic topK={props.topK} onTopK={props.setTopK} /></ConceptSlide>
}
