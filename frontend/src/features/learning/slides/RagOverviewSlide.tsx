import { ConceptSlide, PipelineGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function RagOverviewSlide(_props: LearningSlideProps) {
  return <ConceptSlide number={1} eyebrow="la idea completa" title="RAG: responder con el libro abierto"
    lead="RAG son las siglas de Retrieval-Augmented Generation, en español generación aumentada por recuperación. Primero recupera evidencia y después se la entrega al LLM —un modelo de lenguaje grande que comprende y genera texto— para responder."
    analogy="Es como resolver un examen con libro abierto: primero buscas las páginas pertinentes, luego redactas la respuesta y señalas de dónde salió."
    misconception="RAG no reentrena al modelo, no introduce permanentemente documentos en su memoria y no garantiza una respuesta verdadera. Le entrega evidencia para una consulta concreta."
    technical={<><p><strong>Retrieval-Augmented Generation</strong> separa recuperación y generación.</p><ul><li><strong>Retrieval:</strong> buscar y recuperar información relevante.</li><li><strong>Augmented:</strong> enriquecer la solicitud al modelo con esa evidencia.</li><li><strong>Generation:</strong> redactar una respuesta basada en el contexto recibido.</li><li><strong>Indexación:</strong> prepara documentos, chunks y vectores.</li><li><strong>Consulta:</strong> recupera evidencia, construye contexto y genera.</li></ul></>}><PipelineGraphic /></ConceptSlide>
}
