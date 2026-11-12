import { ConceptSlide, EmbeddingGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function EmbeddingsSlide(_props: LearningSlideProps) {
  return <ConceptSlide number={3} eyebrow="representación" title="Un embedding convierte significado en coordenadas"
    lead="Un modelo de embeddings es una red neuronal entrenada para recibir texto y devolver una lista de números que permita comparar su significado con otros textos."
    analogy="Es asignar una dirección semántica: textos que hablan de ideas parecidas reciben direcciones cercanas, aunque usen palabras distintas."
    misconception="Vectorizar tus documentos no entrena el modelo ni los incorpora a su memoria. El modelo de embeddings tampoco contesta preguntas, resume chunks o asigna una etiqueta interpretable a cada coordenada."
    technical={<><p>La dimensión es la cantidad de números del vector; 1536 es el valor usado por defecto con OpenAI en esta POC.</p><ul><li>El entrenamiento ajusta parámetros; la inferencia aplica los parámetros ya aprendidos.</li><li>Documentos y preguntas deben usar exactamente el mismo modelo de embeddings.</li><li>Cambiar modelo o dimensión exige reindexar; cambiar solo el generador no cambia los vectores.</li></ul></>}><EmbeddingGraphic /></ConceptSlide>
}
