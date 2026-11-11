import type { ComponentType } from 'react'
import { ChunkingSlide } from './slides/ChunkingSlide'
import { ContextSlide } from './slides/ContextSlide'
import { DocumentExtractionSlide } from './slides/DocumentExtractionSlide'
import { EmbeddingLabSlide } from './slides/EmbeddingLabSlide'
import { EmbeddingsSlide } from './slides/EmbeddingsSlide'
import { EvaluationSlide } from './slides/EvaluationSlide'
import { GenerationSlide } from './slides/GenerationSlide'
import { RagOverviewSlide } from './slides/RagOverviewSlide'
import { RetrievalSlide } from './slides/RetrievalSlide'
import { SystemPromptSlide } from './slides/SystemPromptSlide'
import type { LearningSlideProps } from './slides/types'
import { VectorDatabaseSlide } from './slides/VectorDatabaseSlide'
import { VectorSimilaritySlide } from './slides/VectorSimilaritySlide'

export interface SlideDefinition {
  title: string
  component: ComponentType<LearningSlideProps>
}

export const slideRegistry: SlideDefinition[] = [
  { title: 'Qué es RAG', component: RagOverviewSlide },
  { title: 'Documento', component: DocumentExtractionSlide },
  { title: 'Chunks', component: ChunkingSlide },
  { title: 'Embeddings', component: EmbeddingsSlide },
  { title: 'Laboratorio', component: EmbeddingLabSlide },
  { title: 'Vectores', component: VectorSimilaritySlide },
  { title: 'Base vectorial', component: VectorDatabaseSlide },
  { title: 'Recuperación', component: RetrievalSlide },
  { title: 'Contexto', component: ContextSlide },
  { title: 'System prompt', component: SystemPromptSlide },
  { title: 'Generación y citas', component: GenerationSlide },
  { title: 'Evaluación', component: EvaluationSlide },
]
