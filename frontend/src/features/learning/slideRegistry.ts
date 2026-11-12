import type { ComponentType } from 'react'
import { ContextSlide } from './slides/ContextSlide'
import { DocumentExtractionSlide } from './slides/DocumentExtractionSlide'
import { EmbeddingsSlide } from './slides/EmbeddingsSlide'
import { EvaluationSlide } from './slides/EvaluationSlide'
import { GenerationSlide } from './slides/GenerationSlide'
import { RagOverviewSlide } from './slides/RagOverviewSlide'
import { RetrievalSlide } from './slides/RetrievalSlide'
import type { LearningSlideProps } from './slides/types'
import { VectorDatabaseSlide } from './slides/VectorDatabaseSlide'
import { VectorSimilaritySlide } from './slides/VectorSimilaritySlide'

export interface SlideDefinition {
  title: string
  topics: string[]
  component: ComponentType<LearningSlideProps>
}

export const slideRegistry: SlideDefinition[] = [
  { title: 'LLM y RAG', topics: ['Qué es un LLM', 'Qué es RAG', 'Indexación y consulta'], component: RagOverviewSlide },
  { title: 'Documentos y chunks', topics: ['Extracción', 'Metadatos', 'Fragmentación'], component: DocumentExtractionSlide },
  { title: 'Modelo de embeddings', topics: ['Embedding', 'Entrenamiento', 'Compatibilidad'], component: EmbeddingsSlide },
  { title: 'Vectores y similitud', topics: ['Distancia coseno', 'Texto por ID', 'Laboratorio'], component: VectorSimilaritySlide },
  { title: 'Indexación y base vectorial', topics: ['Índice', 'Base vectorial', 'Chroma y SQLite'], component: VectorDatabaseSlide },
  { title: 'Recuperación', topics: ['Vectorizar la pregunta', 'Ranking', 'top_k'], component: RetrievalSlide },
  { title: 'Contexto y mensajes', topics: ['Fuentes', 'System prompt', 'Payload'], component: ContextSlide },
  { title: 'Generación y validación', topics: ['Tokens', 'Citas', 'Fidelidad'], component: GenerationSlide },
  { title: 'Evaluación y operación', topics: ['Métricas', 'Diagnóstico', 'Privacidad'], component: EvaluationSlide },
]
