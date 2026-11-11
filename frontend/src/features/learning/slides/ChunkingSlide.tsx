import { ChunkGraphic, ConceptSlide } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function ChunkingSlide(props: LearningSlideProps) {
  return <ConceptSlide number={3} eyebrow="fragmentación" title="Chunks: piezas con suficiente contexto"
    lead="Un chunk es una porción del documento que puede indexarse y recuperarse de manera independiente. Prueba los controles para ver cómo cambia el corte."
    analogy="Es dividir un libro en fichas: cada ficha debe contener una idea útil, y puede repetir unas líneas para no perder el hilo entre fichas."
    misconception="Más chunks no significa automáticamente mejor recuperación. Fragmentos minúsculos pierden contexto; fragmentos enormes mezclan temas y consumen más tokens, las unidades con las que el modelo mide texto."
    technical={<><p>El laboratorio mide tamaño y overlap en caracteres; la ventana del LLM se mide en tokens.</p><ul><li>El splitter intenta respetar párrafos y separadores naturales.</li><li>El solapamiento conserva continuidad, pero también duplica texto y costo.</li><li>Cada chunk recibe un ID estable para rastreo y citas.</li></ul></>}>
    <ChunkGraphic chunks={props.chunks} chunkSize={props.chunkSize} overlap={props.overlap} onSize={props.setChunkSize} onOverlap={props.setOverlap} articleText={props.articleText} onArticleText={props.setArticleText} onResetArticle={props.resetArticle} />
  </ConceptSlide>
}
