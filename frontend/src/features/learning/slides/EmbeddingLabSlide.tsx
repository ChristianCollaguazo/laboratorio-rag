import { ConceptSlide, EmbeddingLabGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function EmbeddingLabSlide(props: LearningSlideProps) {
  return <ConceptSlide number={5} eyebrow="laboratorio real" title="De textos a vectores, y del vecino a su texto"
    lead="Compara una oración en español con textos en ambos idiomas. El modelo multilingüe representa todos en el mismo espacio y permite observar cuál queda más cerca."
    analogy="Cada texto se guarda como una ficha con dos caras: una contiene su dirección numérica y la otra conserva su contenido e ID. La dirección ayuda a encontrar la ficha; el ID permite leer su texto."
    misconception="El vector no se decodifica para reconstruir el texto ni funciona como un diccionario. Las frases con contexto suelen producir comparaciones más claras que las palabras aisladas."
    technical={<><p>FastAPI envía la consulta y los candidatos en una sola petición al modelo seleccionado.</p><ul><li><code>text-embedding-3-small</code> usa 1536 dimensiones por defecto.</li><li><code>text-embedding-3-large</code> usa 3072 y puede mejorar tareas exigentes, con mayor costo.</li><li>Calcula <code>distancia coseno = 1 − similitud coseno</code>.</li><li>Usa el ID del vecino más cercano para recuperar el texto almacenado.</li></ul></>}>
    <EmbeddingLabGraphic model={props.labModel} query={props.labQuery} candidatesText={props.labCandidates} result={props.labResult} busy={props.labBusy} error={props.labError} onModel={props.setLabModel} onQuery={props.setLabQuery} onCandidates={props.setLabCandidates} onRun={props.runEmbeddingLab} />
  </ConceptSlide>
}
