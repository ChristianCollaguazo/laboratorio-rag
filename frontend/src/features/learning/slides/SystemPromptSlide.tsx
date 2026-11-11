import { ConceptSlide, PromptGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function SystemPromptSlide(props: LearningSlideProps) {
  return <ConceptSlide number={10} eyebrow="instrucciones" title="System prompt: las reglas que rodean a las fuentes"
    lead="El backend construye una sola solicitud para el LLM. Dentro del arreglo messages viajan el system prompt y el mensaje user, que ya contiene la pregunta seguida de las fuentes recuperadas."
    analogy="El system prompt es el reglamento del examen; el mensaje user contiene la pregunta y las páginas permitidas para contestarla."
    misconception="Delimitar fuentes reduce el riesgo de prompt injection —instrucciones maliciosas escondidas en los documentos—, pero no constituye por sí solo una defensa completa para producción."
    technical={<><p>Una sola solicitud contiene mensajes con roles distintos.</p><ul><li><code>system</code>: reglas de uso de evidencia y citas.</li><li><code>user</code>: pregunta y bloques <code>source</code>.</li><li>No se envían API keys, cabeceras ni razonamiento interno dentro de esos mensajes.</li></ul></>}><PromptGraphic topK={props.topK} /></ConceptSlide>
}
