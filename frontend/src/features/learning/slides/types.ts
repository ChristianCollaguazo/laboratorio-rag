import type { FormEvent } from 'react'
import type { EmbeddingLabResult } from '../../../shared/api/contracts'
import type { DemoChunk } from '../components/LearningGraphics'

export interface LearningSlideProps {
  chunks: DemoChunk[]
  chunkSize: number
  overlap: number
  topK: number
  articleText: string
  labQuery: string
  labCandidates: string
  labResult: EmbeddingLabResult | null
  labBusy: boolean
  labError: string
  setChunkSize: (value: number) => void
  setOverlap: (value: number) => void
  setTopK: (value: number) => void
  setArticleText: (value: string) => void
  resetArticle: () => void
  setLabQuery: (value: string) => void
  setLabCandidates: (value: string) => void
  runEmbeddingLab: (event: FormEvent) => void
}
