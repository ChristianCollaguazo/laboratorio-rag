import { ConceptSlide, ContextGraphic, PromptGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function ContextSlide(props: LearningSlideProps) {
  return <ConceptSlide number={7} eyebrow="ensamblaje" title="Contexto y mensajes: enviar evidencia al LLM"
    lead="Los resultados recuperados se transforman en fuentes identificables. El backend las combina con reglas y la pregunta en una única solicitud que el LLM puede procesar."
    analogy="Son las páginas que dejaste abiertas sobre la mesa, cada una con un separador que indica de qué libro y página proviene."
    misconception="Contexto no significa documento completo ni memoria permanente. Es el subconjunto recuperado para esta pregunta y debe caber en la ventana de contexto: el límite de tokens que el modelo puede recibir."
    technical={<><p>Cada bloque <code>source</code> conserva chunk ID, documento y página.</p><ul><li>El backend ordena y delimita las fuentes.</li><li><code>system</code> contiene reglas; <code>user</code> contiene pregunta y fuentes.</li><li>Más contexto consume más tokens y puede diluir la evidencia útil.</li><li>Delimitar fuentes reduce el riesgo de prompt injection, pero no es una defensa completa.</li></ul></>}><div className="learning-section-stack"><ContextGraphic topK={props.topK} /><PromptGraphic topK={props.topK} /></div></ConceptSlide>
}
