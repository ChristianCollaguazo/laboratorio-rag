import type { ChatResult, ChunkSet, DocumentView, EmbeddingLabResult, IndexTraceability, IndexView, ProviderConfig, Retrieval, Status } from './contracts'

function formatErrorDetail(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail.flatMap(item => {
      if (typeof item === 'string') return [item]
      if (item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string') {
        return [item.msg.replace(/^Value error,\s*/i, '')]
      }
      return []
    })
    if (messages.length) return messages.join(' ')
  }
  if (detail && typeof detail === 'object') {
    if ('message' in detail && typeof detail.message === 'string') return detail.message
    if ('msg' in detail && typeof detail.msg === 'string') return detail.msg
  }
  return fallback
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    let message = `Error HTTP ${response.status}`
    try {
      const payload: unknown = await response.json()
      if (payload && typeof payload === 'object' && 'detail' in payload) {
        message = formatErrorDetail(payload.detail, message)
      }
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
  document: (id: string) => request<DocumentView>(`/api/v1/documents/${id}`),
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
  createIndex: (chunkSetIds: string | string[], embedding: ProviderConfig) =>
    request<IndexView>('/api/v1/indices', json({
      chunk_set_ids: Array.isArray(chunkSetIds) ? chunkSetIds : [chunkSetIds],
      embedding,
    })),
  indexTraceability: (indexId: string) => request<IndexTraceability>(`/api/v1/indices/${indexId}/traceability`),
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
  clearLibrary: () => request<void>('/api/v1/library', { method: 'DELETE' }),
}
