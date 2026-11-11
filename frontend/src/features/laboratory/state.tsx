import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'
import type { ChatResult, ChunkSet, DocumentView, IndexView, ProviderConfig, Retrieval } from '../../shared/api/contracts'

export type LaboratoryTab = 'texto' | 'chunks' | 'embedding' | 'recuperacion' | 'envio' | 'respuesta'

export interface LaboratoryState {
  document: DocumentView | null
  chunkSet: ChunkSet | null
  index: IndexView | null
  retrieval: Retrieval | null
  chat: ChatResult | null
  title: string
  text: string
  question: string
  chunkSize: number
  overlap: number
  topK: number
  tab: LaboratoryTab
  embedding: ProviderConfig
  generation: ProviderConfig
  notice: string
}

type LaboratoryAction = { type: 'patch'; payload: Partial<LaboratoryState> }

const defaultEmbedding: ProviderConfig = { provider: 'openai', model: 'text-embedding-3-small', dimensions: 1536 }
const defaultGeneration: ProviderConfig = { provider: 'openai', model: 'gpt-6-luna' }

function loadPreference(key: string, fallback: ProviderConfig): ProviderConfig {
  try {
    return JSON.parse(localStorage.getItem(key) || '') as ProviderConfig
  } catch {
    return fallback
  }
}

function createInitialState(): LaboratoryState {
  return {
    document: null, chunkSet: null, index: null, retrieval: null, chat: null,
    title: 'Notas de ejemplo', text: '', question: '', chunkSize: 800, overlap: 120,
    topK: 4, tab: 'texto', notice: '',
    embedding: loadPreference('rag.embedding', defaultEmbedding),
    generation: loadPreference('rag.generation', defaultGeneration),
  }
}

function reducer(state: LaboratoryState, action: LaboratoryAction): LaboratoryState {
  return action.type === 'patch' ? { ...state, ...action.payload } : state
}

const LaboratoryContext = createContext<{ state: LaboratoryState; dispatch: Dispatch<LaboratoryAction> } | null>(null)

export function LaboratoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  useEffect(() => localStorage.setItem('rag.embedding', JSON.stringify(state.embedding)), [state.embedding])
  useEffect(() => localStorage.setItem('rag.generation', JSON.stringify(state.generation)), [state.generation])

  return <LaboratoryContext.Provider value={{ state, dispatch }}>{children}</LaboratoryContext.Provider>
}

export function useLaboratoryState() {
  const context = useContext(LaboratoryContext)
  if (!context) throw new Error('useLaboratoryState must be used inside LaboratoryProvider')
  return context
}
