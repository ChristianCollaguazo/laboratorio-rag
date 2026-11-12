import { useEffect, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import type { LaboratoryController } from '../laboratory/useLaboratoryController'
import type { LaboratoryTab } from '../laboratory/state'
import { LlmDeliveryFlow } from '../generation/LlmDeliveryFlow'
import { MarkdownAnswer } from '../generation/MarkdownAnswer'
import { api } from '../../shared/api/client'
import styles from '../laboratory/Laboratory.module.css'

function Empty({ text }: { text: string }) {
  return <div className={[styles['empty']].filter(Boolean).join(' ')}><div>⌁</div><p>{text}</p></div>
}

export function PipelineInspector({ controller }: { controller: LaboratoryController }) {
  const { state, patch, activeMutation, mutations } = controller
  const [focusedChunkId, setFocusedChunkId] = useState<string | null>(null)
  const [focusedDocumentId, setFocusedDocumentId] = useState<string | null>(null)
  const [retrievalView, setRetrievalView] = useState<'chunks' | 'documents'>('chunks')
  const [citationDisplay, setCitationDisplay] = useState<'chunks' | 'documents'>('chunks')
  const tabs: [LaboratoryTab, string][] = [
    ['texto', 'texto'], ['chunks', 'chunks'], ['embedding', 'embedding'],
    ['trazabilidad', 'trazabilidad'], ['recuperacion', 'recuperación'], ['envio', 'envío LLM'], ['respuesta', 'respuesta'],
  ]
  const showChunk = (chunkId: string) => {
    setFocusedChunkId(chunkId)
    setRetrievalView('chunks')
    patch({ tab: 'recuperacion' })
    window.setTimeout(() => {
      const target = document.getElementById(`chunk-${chunkId}`)
      if (typeof target?.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 0)
  }
  const showDocument = (documentId: string) => {
    setFocusedDocumentId(documentId)
    setRetrievalView('documents')
    patch({ tab: 'recuperacion' })
  }
  const sourceDocumentIds = [...new Set(state.retrieval?.chunks.map(chunk => chunk.document_id) ?? [])]
  const sourceDocumentQueries = useQueries({
    queries: sourceDocumentIds.map(documentId => ({
      queryKey: ['documents', documentId],
      queryFn: () => api.document(documentId),
      enabled: retrievalView === 'documents',
    })),
  })
  const loadingSourceDocuments = sourceDocumentQueries.some(query => query.isLoading)
  const sourceDocumentError = sourceDocumentQueries.find(query => query.isError)?.error
  const loadedSourceDocumentIds = sourceDocumentQueries.map(query => query.data?.id ?? '').join(',')
  useEffect(() => {
    if (!focusedDocumentId || !loadedSourceDocumentIds.includes(focusedDocumentId)) return
    const target = document.getElementById(`document-${focusedDocumentId}`)
    if (typeof target?.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [focusedDocumentId, loadedSourceDocumentIds])
  const traceabilityQuery = useQuery({
    queryKey: ['indices', state.index?.id, 'traceability'],
    queryFn: () => api.indexTraceability(state.index!.id),
    enabled: state.tab === 'trazabilidad' && Boolean(state.index),
  })
  const citationSources = Object.fromEntries((state.chat?.retrieved ?? []).map(chunk => [chunk.id, {
    documentId: chunk.document_id,
    documentTitle: chunk.document_title,
  }]))
  return <section className={[styles['inspector']].filter(Boolean).join(' ')}>
    <nav className={[styles['tabs']].filter(Boolean).join(' ')} aria-label="Resultados del pipeline">
      {tabs.map(([item, label]) => <button key={item} className={state.tab === item ? styles.active : ''} onClick={() => patch({ tab: item })}>{label}</button>)}
    </nav>
    <div className={[styles['panel']].filter(Boolean).join(' ')}>
      {state.tab === 'texto' && (state.document ? <>
        <div className={[styles['panel-heading']].filter(Boolean).join(' ')}><div><span className={[styles['kind']].filter(Boolean).join(' ')}>{state.document.kind}</span><h2>{state.document.title}</h2></div><span>{state.document.text.length.toLocaleString()} caracteres · {state.document.pages.length} pág.</span></div>
        <pre className={[styles['extracted']].filter(Boolean).join(' ')}>{state.document.text}</pre>
      </> : <Empty text="Añade una fuente para ver aquí el texto extraído." />)}
      {state.tab === 'chunks' && (state.chunkSet ? <>
        <div className={[styles['panel-heading']].filter(Boolean).join(' ')}><div><span className={[styles['kind']].filter(Boolean).join(' ')}>fragmentación</span><h2>{state.chunkSet.chunks.length} chunks</h2></div><span>{state.chunkSet.config.chunk_size} / {state.chunkSet.config.chunk_overlap}</span></div>
        <div className={[styles['chunk-list']].filter(Boolean).join(' ')}>{state.chunkSet.chunks.map(chunk => <article key={chunk.id} className={[styles['chunk-card']].filter(Boolean).join(' ')}><header><code>{chunk.id}</code><span>pág. {chunk.page} · posición {chunk.position}</span></header><p>{chunk.text}</p></article>)}</div>
      </> : <Empty text="Fragmenta el documento para inspeccionar IDs, páginas y contenido." />)}
      {state.tab === 'embedding' && (state.index ? <>
        <div className={[styles['panel-heading']].filter(Boolean).join(' ')}><div><span className={[styles['kind']].filter(Boolean).join(' ')}>vector</span><h2>{state.index.embedding.model}</h2></div><span>{state.index.embedding.dimensions} dimensiones</span></div>
        <p className={[styles['explanation']].filter(Boolean).join(' ')}>Un embedding es una coordenada semántica. Esta es una muestra de 8 valores del primer vector; el índice completo permanece en Chroma.</p>
        <div className={[styles['vector']].filter(Boolean).join(' ')}>{state.index.embedding_sample.map((value, index) => <span key={index}>{value.toFixed(6)}</span>)}</div>
        <dl className={[styles['manifest']].filter(Boolean).join(' ')}><div><dt>Proveedor</dt><dd>{state.index.embedding.provider}</dd></div><div><dt>Colección</dt><dd><code>{state.index.collection_name}</code></dd></div><div><dt>Métrica</dt><dd>distancia coseno</dd></div><div><dt>Chunks</dt><dd>{state.index.chunk_count}</dd></div></dl>
      </> : <Empty text="Vectoriza los chunks para ver el modelo, la dimensión y una muestra." />)}
      {state.tab === 'trazabilidad' && (state.index ? <>
        <div className={styles['panel-heading']}><div><span className={styles.kind}>Chroma + SQLite</span><h2>Metadatos y trazabilidad</h2></div><span>{traceabilityQuery.data?.record_count ?? state.index.chunk_count} vectores</span></div>
        <p className={styles.explanation}>Cada registro de Chroma usa el mismo <code>chunk_id</code> que SQLite. Chroma guarda el vector y sus metadatos; SQLite conserva el documento y el texto completo.</p>
        {traceabilityQuery.isLoading && <p className={styles.muted}>Leyendo metadatos de Chroma…</p>}
        {traceabilityQuery.isError && <p className={styles.invalid}>No se pudieron leer los metadatos de esta colección.</p>}
        {traceabilityQuery.data && <>
          <dl className={styles.manifest}>{Object.entries(traceabilityQuery.data.collection_metadata).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl>
          <h3 className={styles['trace-heading']}>Documento SQLite → chunk → vector Chroma</h3>
          <div className={styles['trace-list']}>{traceabilityQuery.data.records.map(record => <article className={styles['trace-record']} key={record.chunk_id}>
            <button type="button" onClick={() => showDocument(record.document_id)}><strong>{record.document_title}</strong><small>SQLite · pág. {record.page}</small></button>
            <span>→</span><code>{record.chunk_id}</code><span>→</span><code>[{record.embedding_sample.map(value => value.toFixed(4)).join(', ')}, …]</code>
          </article>)}</div>
          {traceabilityQuery.data.record_count > traceabilityQuery.data.records.length && <p className={styles.muted}>Se muestran los primeros {traceabilityQuery.data.records.length} de {traceabilityQuery.data.record_count} vectores.</p>}
        </>}
      </> : <Empty text="Carga un índice para inspeccionar sus metadatos y enlaces entre SQLite y Chroma." />)}
      {state.tab === 'recuperacion' && (state.retrieval ? <>
        <div className={[styles['panel-heading']].filter(Boolean).join(' ')}><div><span className={[styles['kind']].filter(Boolean).join(' ')}>top {state.topK}</span><h2>Fragmentos recuperados</h2></div><span>{state.retrieval.elapsed_ms.toFixed(1)} ms</span></div>
        <p className={[styles['explanation']].filter(Boolean).join(' ')}>La distancia coseno mide separación: menor suele significar mayor cercanía. No es una probabilidad.</p>
        <div className={styles['source-switch']} role="group" aria-label="Vista de fuentes recuperadas">
          <button className={retrievalView === 'chunks' ? styles.active : ''} onClick={() => setRetrievalView('chunks')}>Chunks recuperados</button>
          <button className={retrievalView === 'documents' ? styles.active : ''} onClick={() => setRetrievalView('documents')}>Documentos fuente (SQLite)</button>
        </div>
        {retrievalView === 'chunks' ? <div className={[styles['chunk-list']].filter(Boolean).join(' ')}>{state.retrieval.chunks.map(chunk => <article id={`chunk-${chunk.id}`} key={chunk.id} className={[styles['chunk-card'], styles['retrieved'], focusedChunkId === chunk.id ? styles.focused : ''].filter(Boolean).join(' ')}><header><code>{chunk.id}</code><strong>{chunk.distance.toFixed(4)}</strong></header><p>{chunk.text}</p></article>)}</div> : <div className={styles['source-documents']}>
          {loadingSourceDocuments && <p className={styles.muted}>Cargando documentos desde SQLite…</p>}
          {sourceDocumentError && <p className={styles.invalid}>No se pudo cargar el documento fuente desde SQLite.</p>}
          {sourceDocumentQueries.map(query => query.data && <article id={`document-${query.data.id}`} className={[styles['source-document'], focusedDocumentId === query.data.id ? styles.focused : ''].filter(Boolean).join(' ')} key={query.data.id}><header><span className={styles.kind}>Documento fuente · SQLite</span><code>{query.data.id}</code></header><h3>{query.data.title}</h3><p className={styles.muted}>{query.data.kind} · {query.data.text.length.toLocaleString()} caracteres · {query.data.pages.length} pág.</p><pre className={styles.extracted}>{query.data.text}</pre></article>)}
        </div>}
      </> : <Empty text="Escribe una pregunta y ejecuta recuperación para comparar distancias." />)}
      {state.tab === 'envio' && (state.retrieval ? <LlmDeliveryFlow retrieval={state.retrieval} generation={state.chat?.generation ?? state.generation} embedding={state.embedding} topK={state.topK} chat={state.chat} /> : <Empty text="Ejecuta la recuperación para preparar y visualizar el payload del LLM antes de enviarlo." />)}
      {state.tab === 'respuesta' && (state.chat ? <>
        <div className={[styles['panel-heading']].filter(Boolean).join(' ')}><div><span className={[styles['kind']].filter(Boolean).join(' ')}>{state.generation.model}</span><h2>Respuesta con evidencia</h2></div><span>{state.chat.timings_ms.total?.toFixed(0)} ms</span></div>
        <div className={styles['source-switch']} role="group" aria-label="Formato de citas"><button className={citationDisplay === 'chunks' ? styles.active : ''} onClick={() => setCitationDisplay('chunks')}>ID del chunk</button><button className={citationDisplay === 'documents' ? styles.active : ''} onClick={() => setCitationDisplay('documents')}>Título del documento</button></div>
        <MarkdownAnswer answer={state.chat.answer} citationIds={state.chat.citations} citationSources={citationSources} display={citationDisplay} onChunkClick={showChunk} onDocumentClick={showDocument} />
        <h3>Citas verificadas</h3><div className={[styles['citations']].filter(Boolean).join(' ')}>{state.chat.citations.length ? state.chat.citations.map(id => <button type="button" key={id} title={id} onClick={() => citationDisplay === 'documents' ? showDocument(citationSources[id].documentId) : showChunk(id)}>{citationDisplay === 'documents' ? citationSources[id].documentTitle : id}</button>) : <span>Ninguna cita válida.</span>}</div>
        {state.chat.invalid_citations.length > 0 && <p className={[styles['invalid']].filter(Boolean).join(' ')}>Referencias descartadas: {state.chat.invalid_citations.join(', ')}</p>}
        {state.chat.usage && <p className={[styles['usage']].filter(Boolean).join(' ')}>Tokens: {state.chat.usage.input_tokens ?? '—'} entrada · {state.chat.usage.output_tokens ?? '—'} salida · {state.chat.usage.total_tokens ?? '—'} total</p>}
      </> : <Empty text="Genera una respuesta para validar sus referencias contra lo recuperado." />)}
    </div>
    <div className={[styles['ask-bar']].filter(Boolean).join(' ')}>
      <label>Pregunta sobre tus fuentes<input value={state.question} placeholder="¿Qué afirma el documento sobre…?" onChange={event => patch({ question: event.target.value })} /></label>
      <button disabled={!state.index || !state.question.trim() || Boolean(activeMutation)} onClick={() => mutations.retrieve.mutate()}>{mutations.retrieve.isPending ? 'Buscando…' : 'Solo recuperar'}</button>
      <button className={[styles['primary']].filter(Boolean).join(' ')} disabled={!state.index || !state.question.trim() || Boolean(activeMutation)} onClick={() => mutations.chat.mutate()}>{mutations.chat.isPending ? 'Generando…' : 'Preguntar'}</button>
    </div>
  </section>
}

