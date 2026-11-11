import { ConceptSlide, EvaluationGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function EvaluationSlide(_props: LearningSlideProps) {
  return <ConceptSlide number={12} eyebrow="calidad" title="Evaluar RAG: medir cada etapa antes de mejorarla"
    lead="Una demo convincente no demuestra que el sistema funcione bien en preguntas distintas. La evaluación usa casos repetibles para medir recuperación, generación, citas, latencia y costo por separado."
    analogy="Es revisar una línea de producción: si el resultado final falla, primero identificas en qué estación apareció el defecto antes de cambiar toda la fábrica."
    misconception="No existe una única puntuación que garantice un buen RAG. Mejorar la fluidez de la respuesta no arregla una recuperación deficiente, y aumentar top_k puede añadir ruido y costo."
    technical={<><p>Un conjunto de evaluación —a veces llamado <em>golden set</em>— reúne preguntas representativas, fuentes esperadas y criterios de respuesta.</p><ul><li>Evalúa recuperación antes de evaluar al LLM.</li><li>Combina métricas automáticas con revisión humana de fidelidad y utilidad.</li><li>Registra configuración, versión del índice y modelos para poder reproducir cada resultado.</li></ul></>}><EvaluationGraphic /></ConceptSlide>
}
