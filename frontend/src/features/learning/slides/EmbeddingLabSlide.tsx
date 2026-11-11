import { ConceptSlide, EmbeddingLabGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function EmbeddingLabSlide(props: LearningSlideProps) {
  return <ConceptSlide number={5} eyebrow="laboratorio real" title="De palabras a vectores, y del vecino a su texto"
    lead="Envía palabras reales a OpenAI, compara sus embeddings y observa cómo el texto original se recupera mediante el ID asociado al vector más cercano."
    analogy="Cada palabra se guarda como una ficha con dos caras: una contiene su dirección numérica y la otra conserva su texto e ID. La dirección ayuda a encontrar la ficha; el ID permite leer su texto."
    misconception="El vector no se decodifica para reconstruir la palabra. Embeddings parecidos pueden corresponder a textos distintos; por eso el sistema debe guardar explícitamente vector, ID, texto y metadatos juntos."
    technical={<><p>FastAPI envía la consulta y las candidatas en una sola petición a <code>text-embedding-3-small</code>.</p><ul><li>Calcula <code>distancia coseno = 1 − similitud coseno</code>.</li><li>Ordena de menor a mayor distancia.</li><li>Usa el ID del vecino más cercano para recuperar el texto almacenado.</li><li>La llamada ocurre únicamente al pulsar el botón y consume la API de OpenAI.</li></ul></>}>
    <EmbeddingLabGraphic query={props.labQuery} candidatesText={props.labCandidates} result={props.labResult} busy={props.labBusy} error={props.labError} onQuery={props.setLabQuery} onCandidates={props.setLabCandidates} onRun={props.runEmbeddingLab} />
  </ConceptSlide>
}
