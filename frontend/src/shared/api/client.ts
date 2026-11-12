import type { ChatResult, ChunkSet, DocumentView, EmbeddingLabResult, IndexView, ProviderConfig, Retrieval, Status } from './contracts'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    let message = `Error HTTP ${response.status}`
    try {
      const payload = await response.json()
      message = payload.detail ?? message
    } catch { /* response has no JSON body */ }
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
  status: () => request<Status>('/api/v1/status'),
  documents: () => request<DocumentView[]>('/api/v1/documents'),
  indices: () => request<IndexView[]>('/api/v1/indices'),
  createText: (title: string, text: string) =>
    request<DocumentView>('/api/v1/documents/text', json({ title, text })),
  upload: (file: File) => {
    const body = new FormData()
    body.append('file', file)
    return request<DocumentView>('/api/v1/documents/upload', { method: 'POST', body })
  },
  chunks: (documentId: string, chunkSize: number, chunkOverlap: number) =>
    request<ChunkSet>(`/api/v1/documents/${documentId}/chunks`, json({ chunk_size: chunkSize, chunk_overlap: chunkOverlap })),
  createIndex: (chunkSetId: string, embedding: ProviderConfig) =>
    request<IndexView>('/api/v1/indices', json({ chunk_set_ids: [chunkSetId], embedding })),
  retrieve: (indexId: string, question: string, topK: number, embedding: ProviderConfig) =>
    request<Retrieval>('/api/v1/retrieve', json({ index_id: indexId, question, top_k: topK, embedding })),
  chat: (indexId: string, question: string, topK: number, embedding: ProviderConfig, generation: ProviderConfig) =>
    request<ChatResult>('/api/v1/chat', json({ index_id: indexId, question, top_k: topK, embedding, generation })),
  learningEmbeddings: (query: string, candidates: string[], model: string, dimensions: number) =>
    request<EmbeddingLabResult>('/api/v1/learning/embeddings', json({
      query, candidates, model, dimensions,
    })),
  deleteDocument: (id: string) => request<void>(`/api/v1/documents/${id}`, { method: 'DELETE' }),
  deleteIndex: (id: string) => request<void>(`/api/v1/indices/${id}`, { method: 'DELETE' }),
}
