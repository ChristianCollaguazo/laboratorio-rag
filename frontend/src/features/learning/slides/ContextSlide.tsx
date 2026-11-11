import { ConceptSlide, ContextGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function ContextSlide(props: LearningSlideProps) {
  return <ConceptSlide number={9} eyebrow="ensamblaje" title="El contexto es evidencia seleccionada y delimitada"
    lead="Los resultados recuperados se transforman en fuentes identificables. El LLM no abre Chroma: recibe este texto ya construido."
    analogy="Son las páginas que dejaste abiertas sobre la mesa, cada una con un separador que indica de qué libro y página proviene."
    misconception="Contexto no significa documento completo ni memoria permanente. Es el subconjunto recuperado para esta pregunta y debe caber en la ventana de contexto: el límite de tokens que el modelo puede recibir."
    technical={<><p>Cada bloque <code>source</code> conserva chunk ID, documento y página.</p><ul><li>El backend ordena y delimita las fuentes.</li><li>Más contexto consume más tokens y puede diluir la evidencia útil.</li><li>La estructura permite exigir citas y validarlas después.</li></ul></>}><ContextGraphic topK={props.topK} /></ConceptSlide>
}
