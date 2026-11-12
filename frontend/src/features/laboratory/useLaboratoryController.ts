import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import type { DocumentView, IndexView } from '../../shared/api/contracts'
import { useLaboratoryState } from './state'

export function useLaboratoryController() {
  const { state, dispatch } = useLaboratoryState()
  const queryClient = useQueryClient()
  const statusQuery = useQuery({ queryKey: ['status'], queryFn: api.status })
  const documentsQuery = useQuery({ queryKey: ['documents'], queryFn: api.documents })
  const indicesQuery = useQuery({ queryKey: ['indices'], queryFn: api.indices })

  const patch = (payload: Partial<typeof state>) => dispatch({ type: 'patch', payload })
  const resetAfterDocument = (document: DocumentView) => patch({ document, chunkSet: null, index: null, retrieval: null, chat: null, tab: 'texto' })

  const createText = useMutation({
    mutationFn: () => api.createText(state.title, state.text),
    onSuccess: async document => {
      resetAfterDocument(document)
      patch({ notice: 'Texto extraído y guardado localmente.' })
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
  const upload = useMutation({
    mutationFn: (file: File) => api.upload(file),
    onSuccess: async (document, file) => {
      resetAfterDocument(document)
      patch({ notice: `${file.name} extraído sin OCR.` })
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
  const createChunks = useMutation({
    mutationFn: ({ chunkSize, overlap }: { chunkSize: number, overlap: number }) =>
      api.chunks(state.document!.id, chunkSize, overlap),
    onSuccess: chunkSet => patch({ chunkSet, index: null, retrieval: null, chat: null, tab: 'chunks', notice: `${chunkSet.chunks.length} fragmentos creados.` }),
  })
  const createIndex = useMutation({
    mutationFn: () => api.createIndex(state.chunkSet!.id, state.embedding),
    onSuccess: async index => {
      patch({ index, retrieval: null, chat: null, tab: 'embedding', notice: `Índice ${index.collection_name} persistido en Chroma.` })
      await queryClient.invalidateQueries({ queryKey: ['indices'] })
    },
  })
  const createSharedIndex = useMutation({
    mutationFn: async (documentIds: string[]) => {
      const chunkSets = []
      for (const documentId of documentIds) {
        chunkSets.push(await api.chunks(documentId, state.chunkSize, state.overlap))
      }
      const index = await api.createIndex(chunkSets.map(chunkSet => chunkSet.id), state.embedding)
      return { index, chunkSets }
    },
    onSuccess: async ({ index, chunkSets }) => {
      patch({
        chunkSet: chunkSets.at(-1) ?? null,
        index,
        retrieval: null,
        chat: null,
        tab: 'embedding',
        notice: `Índice compartido creado con ${index.document_ids.length} documento(s) y ${index.chunk_count} chunks.`,
      })
      await queryClient.invalidateQueries({ queryKey: ['indices'] })
    },
  })
  const retrieve = useMutation({
    mutationFn: () => api.retrieve(state.index!.id, state.question, state.topK, state.embedding),
    onSuccess: retrieval => patch({ retrieval, chat: null, tab: 'recuperacion', notice: '' }),
  })
  const chat = useMutation({
    mutationFn: () => api.chat(state.index!.id, state.question, state.topK, state.embedding, state.generation),
    onSuccess: result => patch({
      chat: result,
      retrieval: {
        chunks: result.retrieved, question: result.question, context: result.context,
        llm_messages: result.llm_messages, source_count: result.source_count,
        context_characters: result.context_characters, elapsed_ms: result.timings_ms.retrieval,
      },
      tab: 'respuesta', notice: '',
    }),
  })
  const deleteDocument = useMutation({
    mutationFn: api.deleteDocument,
    onSuccess: async (_, id) => {
      if (state.document?.id === id) patch({ document: null, chunkSet: null, index: null, retrieval: null, chat: null })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['indices'] }),
      ])
    },
  })
  const deleteIndex = useMutation({
    mutationFn: api.deleteIndex,
    onSuccess: async (_, id) => {
      if (state.index?.id === id) patch({ index: null, retrieval: null, chat: null })
      await queryClient.invalidateQueries({ queryKey: ['indices'] })
    },
  })
  const clearLibrary = useMutation({
    mutationFn: api.clearLibrary,
    onSuccess: async () => {
      patch({
        document: null,
        chunkSet: null,
        index: null,
        retrieval: null,
        chat: null,
        tab: 'texto',
        notice: 'La biblioteca local quedó vacía.',
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['indices'] }),
      ])
    },
  })

  const mutations = { createText, upload, createChunks, createIndex, createSharedIndex, retrieve, chat, deleteDocument, deleteIndex, clearLibrary }
  const activeMutation = Object.entries(mutations).find(([, mutation]) => mutation.isPending)?.[0] ?? null
  const mutationError = Object.values(mutations).find(mutation => mutation.error)?.error
  const queryError = statusQuery.error ?? documentsQuery.error ?? indicesQuery.error
  const error = mutationError ?? queryError
  const completed = useMemo(() => {
    if (state.chat) return 6
    if (state.retrieval) return 5
    if (state.index) return 4
    if (state.chunkSet) return 2
    if (state.document) return 1
    return 0
  }, [state.document, state.chunkSet, state.index, state.retrieval, state.chat])

  const selectIndex = (index: IndexView) => patch({
    index, embedding: index.embedding, chunkSize: index.chunking.chunk_size,
    overlap: index.chunking.chunk_overlap, retrieval: null, chat: null, tab: 'embedding',
  })

  return {
    state, patch, completed, activeMutation,
    error: error instanceof Error ? error.message : error ? String(error) : '',
    status: statusQuery.data,
    documents: documentsQuery.data ?? [],
    indices: indicesQuery.data ?? [],
    resetAfterDocument, selectIndex, mutations,
  }
}

export type LaboratoryController = ReturnType<typeof useLaboratoryController>
