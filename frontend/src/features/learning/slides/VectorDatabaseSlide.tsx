import { ChromaGraphic, ConceptSlide } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function VectorDatabaseSlide(_props: LearningSlideProps) {
  return <ConceptSlide number={7} eyebrow="persistencia" title="Base de datos vectorial: guardar y buscar por significado"
    lead="Una base de datos vectorial guarda representaciones numéricas y permite buscar las más cercanas a una consulta. Junto a cada vector conserva el chunk original y sus metadatos. Chroma es la base vectorial concreta que usamos en esta POC."
    analogy="Es una biblioteca que, además del catálogo, conoce la cercanía temática entre cada ficha y una pregunta nueva. «Base vectorial» es el tipo de biblioteca; Chroma es una implementación de ese tipo."
    misconception="Una base vectorial no crea los embeddings y tampoco redacta respuestas. El modelo de embeddings produce los vectores; Chroma los almacena, los compara y devuelve los chunks asociados."
    technical={<><p>Chroma organiza los registros en colecciones; una colección preparada para búsqueda funciona como índice vectorial.</p><ul><li>Cada registro relaciona ID, vector, texto y metadatos.</li><li>Los metadatos permiten filtrar por documento o página.</li><li>Modelo, dimensión y chunking forman parte de la identidad del índice.</li></ul></>}><ChromaGraphic /></ConceptSlide>
}
