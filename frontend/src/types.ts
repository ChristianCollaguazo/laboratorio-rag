export type Provider = 'openai' | 'ollama'

export interface ProviderConfig {
  provider: Provider
  model: string
  dimensions?: number | null
}

export interface Status {
  openai: { available: boolean; configured: boolean; message: string; models: string[] }
  ollama: { available: boolean; configured: boolean; message: string; models: string[] }
  chroma_available: boolean
  defaults: Record<string, string>
}

export interface DocumentView {
  id: string
  title: string
  kind: 'text' | 'txt' | 'pdf'
  text: string
  pages: { page: number; text: string }[]
  created_at: string
}

export interface Chunk {
  id: string
  document_id: string
  document_title: string
  page: number
  position: number
  text: string
  distance?: number
}

export interface ChunkSet {
  id: string
  document_id: string
  config: { chunk_size: number; chunk_overlap: number }
  chunks: Chunk[]
}

export interface IndexView {
  id: string
  collection_name: string
  embedding: ProviderConfig
  chunking: { chunk_size: number; chunk_overlap: number }
  distance_metric: 'cosine'
  document_ids: string[]
  chunk_count: number
  embedding_sample: number[]
  created_at: string
}

export interface Retrieval {
  chunks: Required<Chunk>[]
  question: string
  context: string
  llm_messages: LlmMessage[]
  source_count: number
  context_characters: number
  elapsed_ms: number
}

export interface LlmMessage {
  role: 'system' | 'user'
  content: string
}

export interface ChatResult {
  answer: string
  citations: string[]
  invalid_citations: string[]
  retrieved: Required<Chunk>[]
  question: string
  context: string
  llm_messages: LlmMessage[]
  source_count: number
  context_characters: number
  generation: ProviderConfig
  usage: { input_tokens?: number; output_tokens?: number; total_tokens?: number } | null
  timings_ms: Record<string, number>
}

export interface EmbeddingLabPoint {
  id: string
  text: string
  embedding_sample: number[]
}

export interface EmbeddingLabCandidate extends EmbeddingLabPoint {
  distance: number
  rank: number
}

export interface EmbeddingLabResult {
  model: string
  dimension: number
  query: EmbeddingLabPoint
  candidates: EmbeddingLabCandidate[]
  recovered: EmbeddingLabCandidate
  usage: { prompt_tokens: number; total_tokens: number }
}
