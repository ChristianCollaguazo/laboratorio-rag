import type { ChatResult, ChunkSet, DocumentView, EmbeddingLabResult, IndexView, ProviderConfig, Retrieval, Status } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    let message = `Error HTTP ${response.status}`
    try {
      const payload = await response.json()
      message = payload.detail ?? message
    } catch { /* respuesta sin JSON */ }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const api = {
  status: () => request<Status>('/api/status'),
  documents: () => request<DocumentView[]>('/api/documents'),
  indices: () => request<IndexView[]>('/api/indices'),
  createText: (title: string, text: string) =>
    request<DocumentView>('/api/documents/text', json({ title, text })),
  upload: (file: File) => {
    const body = new FormData()
    body.append('file', file)
    return request<DocumentView>('/api/documents/upload', { method: 'POST', body })
  },
  chunks: (documentId: string, chunkSize: number, chunkOverlap: number) =>
    request<ChunkSet>(`/api/documents/${documentId}/chunks`, json({ chunk_size: chunkSize, chunk_overlap: chunkOverlap })),
  createIndex: (chunkSetId: string, embedding: ProviderConfig) =>
    request<IndexView>('/api/indices', json({ chunk_set_ids: [chunkSetId], embedding })),
  retrieve: (indexId: string, question: string, topK: number, embedding: ProviderConfig) =>
    request<Retrieval>('/api/retrieve', json({ index_id: indexId, question, top_k: topK, embedding })),
  chat: (indexId: string, question: string, topK: number, embedding: ProviderConfig, generation: ProviderConfig) =>
    request<ChatResult>('/api/chat', json({ index_id: indexId, question, top_k: topK, embedding, generation })),
  learningEmbeddings: (query: string, candidates: string[]) =>
    request<EmbeddingLabResult>('/api/learning/embeddings', json({
      query, candidates, model: 'text-embedding-3-small', dimensions: 1536,
    })),
  deleteDocument: (id: string) => request<void>(`/api/documents/${id}`, { method: 'DELETE' }),
  deleteIndex: (id: string) => request<void>(`/api/indices/${id}`, { method: 'DELETE' }),
}
