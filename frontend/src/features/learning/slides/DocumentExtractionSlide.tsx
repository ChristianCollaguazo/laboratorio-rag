import { ChunkGraphic, ConceptSlide, ExtractionGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function DocumentExtractionSlide(props: LearningSlideProps) {
  return <ConceptSlide number={2} eyebrow="preparación" title="Documentos y chunks: preparar evidencia buscable"
    lead="Antes de buscar significado, el sistema extrae texto y metadatos; después lo divide en chunks, piezas que pueden recuperarse de manera independiente."
    analogy="Es catalogar un libro antes de ponerlo en una biblioteca: conservas su contenido, título, páginas y una etiqueta única."
    misconception="Extraer texto no crea embeddings. Tampoco convierte automáticamente imágenes en palabras: un PDF escaneado necesita OCR, una etapa distinta. Más chunks tampoco implica mejor recuperación."
    technical={<><p>La extracción normaliza TXT, PDF con texto seleccionable o texto pegado. Los metadatos permiten citar, filtrar y borrar.</p><ul><li>Un chunk pequeño puede perder contexto; uno grande puede mezclar temas y gastar más tokens.</li><li>El solapamiento repite una parte del texto para conservar continuidad, pero también duplica contenido.</li><li>El laboratorio mide caracteres; la ventana del LLM se mide en tokens.</li></ul></>}><div className="learning-section-stack"><ExtractionGraphic /><ChunkGraphic chunks={props.chunks} chunkSize={props.chunkSize} overlap={props.overlap} onSize={props.setChunkSize} onOverlap={props.setOverlap} articleText={props.articleText} onArticleText={props.setArticleText} onResetArticle={props.resetArticle} /></div></ConceptSlide>
}
