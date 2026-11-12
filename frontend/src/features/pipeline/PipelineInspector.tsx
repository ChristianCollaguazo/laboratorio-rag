import { useState } from 'react'
import type { LaboratoryController } from '../laboratory/useLaboratoryController'
import type { LaboratoryTab } from '../laboratory/state'
import { LlmDeliveryFlow } from '../generation/LlmDeliveryFlow'
import { MarkdownAnswer } from '../generation/MarkdownAnswer'
import styles from '../laboratory/Laboratory.module.css'

function Empty({ text }: { text: string }) {
  return <div className={[styles['empty']].filter(Boolean).join(' ')}><div>⌁</div><p>{text}</p></div>
}

export function PipelineInspector({ controller }: { controller: LaboratoryController }) {
  const { state, patch, activeMutation, mutations } = controller
  const [focusedChunkId, setFocusedChunkId] = useState<string | null>(null)
  const tabs: [LaboratoryTab, string][] = [
    ['texto', 'texto'], ['chunks', 'chunks'], ['embedding', 'embedding'],
    ['recuperacion', 'recuperación'], ['envio', 'envío LLM'], ['respuesta', 'respuesta'],
  ]
  const showChunk = (chunkId: string) => {
    setFocusedChunkId(chunkId)
    patch({ tab: 'recuperacion' })
    window.setTimeout(() => {
      const target = document.getElementById(`chunk-${chunkId}`)
      if (typeof target?.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 0)
  }
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
      {state.tab === 'recuperacion' && (state.retrieval ? <>
        <div className={[styles['panel-heading']].filter(Boolean).join(' ')}><div><span className={[styles['kind']].filter(Boolean).join(' ')}>top {state.topK}</span><h2>Fragmentos recuperados</h2></div><span>{state.retrieval.elapsed_ms.toFixed(1)} ms</span></div>
        <p className={[styles['explanation']].filter(Boolean).join(' ')}>La distancia coseno mide separación: menor suele significar mayor cercanía. No es una probabilidad.</p>
        <div className={[styles['chunk-list']].filter(Boolean).join(' ')}>{state.retrieval.chunks.map(chunk => <article id={`chunk-${chunk.id}`} key={chunk.id} className={[styles['chunk-card'], styles['retrieved'], focusedChunkId === chunk.id ? styles.focused : ''].filter(Boolean).join(' ')}><header><code>{chunk.id}</code><strong>{chunk.distance.toFixed(4)}</strong></header><p>{chunk.text}</p></article>)}</div>
      </> : <Empty text="Escribe una pregunta y ejecuta recuperación para comparar distancias." />)}
      {state.tab === 'envio' && (state.retrieval ? <LlmDeliveryFlow retrieval={state.retrieval} generation={state.chat?.generation ?? state.generation} embedding={state.embedding} topK={state.topK} chat={state.chat} /> : <Empty text="Ejecuta la recuperación para preparar y visualizar el payload del LLM antes de enviarlo." />)}
      {state.tab === 'respuesta' && (state.chat ? <>
        <div className={[styles['panel-heading']].filter(Boolean).join(' ')}><div><span className={[styles['kind']].filter(Boolean).join(' ')}>{state.generation.model}</span><h2>Respuesta con evidencia</h2></div><span>{state.chat.timings_ms.total?.toFixed(0)} ms</span></div>
        <MarkdownAnswer answer={state.chat.answer} citationIds={state.chat.citations} onCitationClick={showChunk} />
        <h3>Citas verificadas</h3><div className={[styles['citations']].filter(Boolean).join(' ')}>{state.chat.citations.length ? state.chat.citations.map(id => <button type="button" key={id} onClick={() => showChunk(id)}>{id}</button>) : <span>Ninguna cita válida.</span>}</div>
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

