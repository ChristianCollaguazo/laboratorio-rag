import { ChromaGraphic, ConceptSlide } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function VectorDatabaseSlide(_props: LearningSlideProps) {
  return <ConceptSlide number={5} eyebrow="indexación" title="Indexación y base vectorial: preparar la búsqueda"
    lead="Indexar es preparar vectores, texto e identificadores para buscarlos después. Una base de datos vectorial guarda esas representaciones; Chroma es la implementación concreta usada por esta POC."
    analogy="Es una biblioteca que, además del catálogo, conoce la cercanía temática entre cada ficha y una pregunta nueva. «Base vectorial» es el tipo de biblioteca; Chroma es una implementación de ese tipo."
    misconception="Una base vectorial no crea los embeddings y tampoco redacta respuestas. El modelo de embeddings produce los vectores; Chroma los almacena, los compara y devuelve los chunks asociados."
    technical={<><p>Un índice vectorial es un conjunto de vectores que comparte configuración compatible. Chroma organiza sus registros en colecciones.</p><ul><li>Cada registro relaciona ID, vector, texto y metadatos.</li><li>Los metadatos permiten filtrar por documento o página.</li><li>Modelo, dimensión, métrica y chunking forman parte de la identidad del índice.</li></ul></>}><ChromaGraphic /></ConceptSlide>
}
