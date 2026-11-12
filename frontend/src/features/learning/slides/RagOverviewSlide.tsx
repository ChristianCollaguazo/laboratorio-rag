import { ConceptSlide, PipelineGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function RagOverviewSlide(_props: LearningSlideProps) {
  return <ConceptSlide number={1} eyebrow="punto de partida" title="LLM y RAG: responder con evidencia"
    lead="Un LLM —modelo de lenguaje grande— recibe tokens y genera texto prediciendo una continuación. RAG le entrega evidencia recuperada para responder sobre documentos que no formaron parte de su entrenamiento."
    analogy="Es como resolver un examen con libro abierto: primero buscas las páginas pertinentes, luego redactas la respuesta y señalas de dónde salió."
    misconception="RAG no reentrena al modelo, no introduce permanentemente documentos en sus parámetros y no garantiza una respuesta verdadera. El LLM no abre tus archivos ni consulta Chroma por sí solo."
    technical={<><p>Un LLM fue entrenado previamente ajustando muchos parámetros. En esta POC solo hace <strong>inferencia</strong>: usa esos parámetros para procesar los mensajes recibidos.</p><ul><li><strong>Token:</strong> unidad de texto que el modelo procesa.</li><li><strong>Ventana de contexto:</strong> límite de tokens que puede recibir en una solicitud.</li><li><strong>Retrieval:</strong> buscar evidencia relevante.</li><li><strong>Augmented:</strong> añadir esa evidencia al mensaje.</li><li><strong>Generation:</strong> redactar una respuesta condicionada por el mensaje.</li></ul></>}><PipelineGraphic /></ConceptSlide>
}
