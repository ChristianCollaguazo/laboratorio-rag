import { ConceptSlide, ExtractionGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function DocumentExtractionSlide(_props: LearningSlideProps) {
  return <ConceptSlide number={2} eyebrow="entrada" title="Del archivo a un documento procesable"
    lead="Antes de buscar significado, el sistema necesita texto limpio y metadatos que permitan volver a la fuente correcta."
    analogy="Es catalogar un libro antes de ponerlo en una biblioteca: conservas su contenido, título, páginas y una etiqueta única."
    misconception="Extraer texto no es todavía crear embeddings. Tampoco convierte automáticamente imágenes en palabras: un PDF escaneado necesita OCR, una etapa distinta."
    technical={<><p>La extracción normaliza TXT, PDF con texto seleccionable o texto pegado.</p><ul><li>Conserva título, página, tipo e ID estable.</li><li>El texto permite fragmentar; los metadatos permiten citar, filtrar y borrar.</li><li>Si la extracción es incompleta, las etapas siguientes no pueden recuperar lo que falta.</li></ul></>}><ExtractionGraphic /></ConceptSlide>
}
