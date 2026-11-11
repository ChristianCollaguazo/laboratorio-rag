import { useEffect, useMemo, useState } from 'react'
import { api } from './api'
import LearningDeck from './LearningDeck'
import type { ChatResult, ChunkSet, DocumentView, IndexView, Provider, ProviderConfig, Retrieval, Status } from './types'

type Tab = 'texto' | 'chunks' | 'embedding' | 'recuperacion' | 'envio' | 'respuesta'
type Busy = 'extract' | 'chunk' | 'embed' | 'retrieve' | 'chat' | null
type View = 'laboratorio' | 'aprender'

const defaults = {
  openaiGeneration: 'gpt-6-luna',
  openaiEmbedding: 'text-embedding-3-small',
  ollamaGeneration: 'qwen3:8b',
  ollamaEmbedding: 'qwen3-embedding:0.6b',
}

function loadPreference<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || '') as T
  } catch { return fallback }
}

function viewFromHash(): View {
  return window.location.hash === '#aprender' ? 'aprender' : 'laboratorio'
}

function ProviderEditor({ label, value, onChange, purpose }: {
  label: string
  value: ProviderConfig
  onChange: (value: ProviderConfig) => void
  purpose: 'generation' | 'embedding'
}) {
  const switchProvider = (provider: Provider) => onChange({
    provider,
    model: provider === 'openai'
      ? (purpose === 'generation' ? defaults.openaiGeneration : defaults.openaiEmbedding)
      : (purpose === 'generation' ? defaults.ollamaGeneration : defaults.ollamaEmbedding),
    dimensions: purpose === 'embedding' && provider === 'openai' ? 1536 : null,
  })
  return <fieldset className="provider-card">
    <legend>{label}</legend>
    <div className="segmented" aria-label={`Proveedor de ${label.toLowerCase()}`}>
      {(['openai', 'ollama'] as Provider[]).map(provider =>
        <button key={provider} type="button" className={value.provider === provider ? 'active' : ''}
          onClick={() => switchProvider(provider)}>{provider === 'openai' ? 'OpenAI' : 'Ollama'}</button>)}
    </div>
    <label>Modelo
      <input value={value.model} onChange={event => onChange({ ...value, model: event.target.value })} />
    </label>
    {purpose === 'embedding' && <label>Dimensiones <span className="optional">(vacío = modelo)</span>
      <input type="number" min="1" value={value.dimensions ?? ''}
        onChange={event => onChange({ ...value, dimensions: event.target.value ? Number(event.target.value) : null })} />
    </label>}
  </fieldset>
}

function StageRail({ completed, busy }: { completed: number; busy: Busy }) {
  const stages = ['Extraer', 'Fragmentar', 'Embeddings', 'Almacenar', 'Recuperar', 'Generar']
  return <ol className="stage-rail" aria-label="Etapas del pipeline">
    {stages.map((stage, index) => <li key={stage} className={index < completed ? 'done' : index === completed && busy ? 'working' : ''}>
      <span>{index < completed ? '✓' : index + 1}</span>{stage}
    </li>)}
  </ol>
}

export default function App() {
  const [view, setView] = useState<View>(viewFromHash)
  const [status, setStatus] = useState<Status | null>(null)
  const [documents, setDocuments] = useState<DocumentView[]>([])
  const [indices, setIndices] = useState<IndexView[]>([])
  const [document, setDocument] = useState<DocumentView | null>(null)
  const [chunkSet, setChunkSet] = useState<ChunkSet | null>(null)
  const [index, setIndex] = useState<IndexView | null>(null)
  const [retrieval, setRetrieval] = useState<Retrieval | null>(null)
  const [chat, setChat] = useState<ChatResult | null>(null)
  const [title, setTitle] = useState('Notas de ejemplo')
  const [text, setText] = useState('')
  const [question, setQuestion] = useState('')
  const [chunkSize, setChunkSize] = useState(800)
  const [overlap, setOverlap] = useState(120)
  const [topK, setTopK] = useState(4)
  const [tab, setTab] = useState<Tab>('texto')
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [embedding, setEmbedding] = useState<ProviderConfig>(() => loadPreference('rag.embedding', {
    provider: 'openai', model: defaults.openaiEmbedding, dimensions: 1536,
  }))
  const [generation, setGeneration] = useState<ProviderConfig>(() => loadPreference('rag.generation', {
    provider: 'openai', model: defaults.openaiGeneration,
  }))

  const refresh = async () => {
    const [nextStatus, nextDocuments, nextIndices] = await Promise.all([api.status(), api.documents(), api.indices()])
    setStatus(nextStatus); setDocuments(nextDocuments); setIndices(nextIndices)
  }

  useEffect(() => { refresh().catch(reason => setError(reason.message)) }, [])
  useEffect(() => {
    const syncView = () => setView(viewFromHash())
    window.addEventListener('hashchange', syncView)
    return () => window.removeEventListener('hashchange', syncView)
  }, [])
  useEffect(() => { localStorage.setItem('rag.embedding', JSON.stringify(embedding)) }, [embedding])
  useEffect(() => { localStorage.setItem('rag.generation', JSON.stringify(generation)) }, [generation])

  const completed = useMemo(() => {
    if (chat) return 6
    if (retrieval) return 5
    if (index) return 4
    if (chunkSet) return 2
    if (document) return 1
    return 0
  }, [document, chunkSet, index, retrieval, chat])

  const act = async (kind: Busy, action: () => Promise<void>) => {
    setBusy(kind); setError(''); setNotice('')
    try { await action() } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)) }
    finally { setBusy(null) }
  }

  const resetAfterDocument = (next: DocumentView) => {
    setDocument(next); setChunkSet(null); setIndex(null); setRetrieval(null); setChat(null); setTab('texto')
  }

  const createText = () => act('extract', async () => {
    const next = await api.createText(title, text)
    resetAfterDocument(next); setDocuments(items => [next, ...items]); setNotice('Texto extraído y guardado localmente.')
  })

  const upload = (file: File) => act('extract', async () => {
    const next = await api.upload(file)
    resetAfterDocument(next); setDocuments(items => [next, ...items]); setNotice(`${file.name} extraído sin OCR.`)
  })

  const makeChunks = () => document && act('chunk', async () => {
    const next = await api.chunks(document.id, chunkSize, overlap)
    setChunkSet(next); setIndex(null); setRetrieval(null); setChat(null); setTab('chunks')
    setNotice(`${next.chunks.length} fragmentos creados.`)
  })

  const makeIndex = () => chunkSet && act('embed', async () => {
    const next = await api.createIndex(chunkSet.id, embedding)
    setIndex(next); setIndices(items => [next, ...items]); setRetrieval(null); setChat(null); setTab('embedding')
    setNotice(`Índice ${next.collection_name} persistido en Chroma.`)
  })

  const retrieve = () => index && act('retrieve', async () => {
    const next = await api.retrieve(index.id, question, topK, embedding)
    setRetrieval(next); setChat(null); setTab('recuperacion')
  })

  const ask = () => index && act('chat', async () => {
    const next = await api.chat(index.id, question, topK, embedding, generation)
    setChat(next); setRetrieval({
      chunks: next.retrieved,
      question: next.question,
      context: next.context,
      llm_messages: next.llm_messages,
      source_count: next.source_count,
      context_characters: next.context_characters,
      elapsed_ms: next.timings_ms.retrieval,
    })
    setTab('respuesta')
  })

  const selectIndex = (next: IndexView) => {
    setIndex(next); setEmbedding(next.embedding); setChunkSize(next.chunking.chunk_size); setOverlap(next.chunking.chunk_overlap)
    setRetrieval(null); setChat(null); setTab('embedding')
  }

  const navigate = (next: View) => {
    window.location.hash = next
    setView(next)
  }

  if (view === 'aprender') return <LearningDeck onBack={() => navigate('laboratorio')} />

  return <div className="app-shell">
    <header className="hero">
      <div><span className="eyebrow">LABORATORIO LOCAL</span><h1>RAG, pieza por pieza.</h1>
        <p>Pega conocimiento, observa sus vectores y comprueba cómo una respuesta encuentra su evidencia.</p></div>
      <div className="hero-side">
        <button className="learn-button" onClick={() => navigate('aprender')}><span>✦</span> Aprender RAG</button>
        <div className="health">
          <span className={status?.chroma_available ? 'dot ok' : 'dot'} /> Chroma local
          <span className={status?.openai.available ? 'dot ok' : 'dot warn'} /> OpenAI
          <span className={status?.ollama.available ? 'dot ok' : 'dot warn'} /> Ollama
        </div>
      </div>
    </header>

    <StageRail completed={completed} busy={busy} />

    {error && <div className="alert error" role="alert"><strong>No se pudo completar el paso.</strong> {error}</div>}
    {notice && <div className="alert success" role="status">{notice}</div>}

    <main className="workspace">
      <aside className="controls">
        <section>
          <div className="section-title"><span>01</span><div><h2>Proveedores</h2><p>Embeddings y generación son independientes.</p></div></div>
          <ProviderEditor label="Embeddings" value={embedding} onChange={setEmbedding} purpose="embedding" />
          <ProviderEditor label="Generación" value={generation} onChange={setGeneration} purpose="generation" />
          {status && <div className="provider-status">
            <p><span className={status.openai.available ? 'mini ok' : 'mini'} />{status.openai.message}</p>
            <p><span className={status.ollama.available ? 'mini ok' : 'mini'} />{status.ollama.message}</p>
          </div>}
          {(embedding.provider === 'openai' || generation.provider === 'openai') &&
            <div className="privacy-note">↗ El texto de las operaciones seleccionadas se enviará a OpenAI. La clave permanece en el backend.</div>}
        </section>

        <section>
          <div className="section-title"><span>02</span><div><h2>Fuente</h2><p>Pega texto o carga TXT/PDF seleccionable.</p></div></div>
          <label>Título<input value={title} onChange={event => setTitle(event.target.value)} /></label>
          <label>Texto<textarea rows={8} placeholder="Pega aquí el contenido que quieres consultar…" value={text} onChange={event => setText(event.target.value)} /></label>
          <button className="primary" disabled={!title.trim() || !text.trim() || busy !== null} onClick={createText}>
            {busy === 'extract' ? 'Extrayendo…' : 'Usar este texto'}
          </button>
          <label className="file-button">o seleccionar TXT / PDF
            <input type="file" accept=".txt,.pdf,text/plain,application/pdf" disabled={busy !== null}
              onChange={event => event.target.files?.[0] && upload(event.target.files[0])} />
          </label>
        </section>

        <section>
          <div className="section-title"><span>03</span><div><h2>Ajustes</h2><p>Medidos en caracteres, no tokens.</p></div></div>
          <div className="number-grid">
            <label>Tamaño<input type="number" min="100" max="8000" value={chunkSize} onChange={e => setChunkSize(Number(e.target.value))} /></label>
            <label>Solapamiento<input type="number" min="0" value={overlap} onChange={e => setOverlap(Number(e.target.value))} /></label>
            <label>Resultados<input type="number" min="1" max="20" value={topK} onChange={e => setTopK(Number(e.target.value))} /></label>
          </div>
          <div className="button-row">
            <button disabled={!document || busy !== null} onClick={makeChunks}>1. Fragmentar</button>
            <button disabled={!chunkSet || busy !== null} onClick={makeIndex}>2. Vectorizar</button>
          </div>
        </section>
      </aside>

      <section className="inspector">
        <nav className="tabs" aria-label="Resultados del pipeline">
          {([
            ['texto', 'texto'], ['chunks', 'chunks'], ['embedding', 'embedding'],
            ['recuperacion', 'recuperación'], ['envio', 'envío LLM'], ['respuesta', 'respuesta'],
          ] as [Tab, string][]).map(([item, label]) =>
            <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{label}</button>)}
        </nav>
        <div className="panel">
          {tab === 'texto' && (document ? <>
            <div className="panel-heading"><div><span className="kind">{document.kind}</span><h2>{document.title}</h2></div><span>{document.text.length.toLocaleString()} caracteres · {document.pages.length} pág.</span></div>
            <pre className="extracted">{document.text}</pre>
          </> : <Empty text="Añade una fuente para ver aquí el texto extraído." />)}

          {tab === 'chunks' && (chunkSet ? <>
            <div className="panel-heading"><div><span className="kind">fragmentación</span><h2>{chunkSet.chunks.length} chunks</h2></div><span>{chunkSet.config.chunk_size} / {chunkSet.config.chunk_overlap}</span></div>
            <div className="chunk-list">{chunkSet.chunks.map(chunk => <article key={chunk.id} className="chunk-card">
              <header><code>{chunk.id}</code><span>pág. {chunk.page} · posición {chunk.position}</span></header><p>{chunk.text}</p>
            </article>)}</div>
          </> : <Empty text="Fragmenta el documento para inspeccionar IDs, páginas y contenido." />)}

          {tab === 'embedding' && (index ? <>
            <div className="panel-heading"><div><span className="kind">vector</span><h2>{index.embedding.model}</h2></div><span>{index.embedding.dimensions} dimensiones</span></div>
            <p className="explanation">Un embedding es una coordenada semántica. Esta es una muestra de 8 valores del primer vector; el índice completo permanece en Chroma.</p>
            <div className="vector">{index.embedding_sample.map((value, i) => <span key={i}>{value.toFixed(6)}</span>)}</div>
            <dl className="manifest"><div><dt>Proveedor</dt><dd>{index.embedding.provider}</dd></div><div><dt>Colección</dt><dd><code>{index.collection_name}</code></dd></div><div><dt>Métrica</dt><dd>distancia coseno</dd></div><div><dt>Chunks</dt><dd>{index.chunk_count}</dd></div></dl>
          </> : <Empty text="Vectoriza los chunks para ver el modelo, la dimensión y una muestra." />)}

          {tab === 'recuperacion' && (retrieval ? <>
            <div className="panel-heading"><div><span className="kind">top {topK}</span><h2>Fragmentos recuperados</h2></div><span>{retrieval.elapsed_ms.toFixed(1)} ms</span></div>
            <p className="explanation">La distancia coseno mide separación: menor suele significar mayor cercanía. No es una probabilidad.</p>
            <div className="chunk-list">{retrieval.chunks.map(chunk => <article key={chunk.id} className="chunk-card retrieved">
              <header><code>{chunk.id}</code><strong>{chunk.distance.toFixed(4)}</strong></header><p>{chunk.text}</p>
            </article>)}</div>
          </> : <Empty text="Escribe una pregunta y ejecuta recuperación para comparar distancias." />)}

          {tab === 'envio' && (retrieval ? <LlmDeliveryFlow
            retrieval={retrieval}
            generation={chat?.generation ?? generation}
            embedding={embedding}
            topK={topK}
            sent={Boolean(chat)}
            chat={chat}
          /> : <Empty text="Ejecuta la recuperación para preparar y visualizar el payload del LLM antes de enviarlo." />)}

          {tab === 'respuesta' && (chat ? <>
            <div className="panel-heading"><div><span className="kind">{generation.model}</span><h2>Respuesta con evidencia</h2></div><span>{chat.timings_ms.total?.toFixed(0)} ms</span></div>
            <div className="answer">{chat.answer}</div>
            <h3>Citas verificadas</h3><div className="citations">{chat.citations.length ? chat.citations.map(id => <code key={id}>{id}</code>) : <span>Ninguna cita válida.</span>}</div>
            {chat.invalid_citations.length > 0 && <p className="invalid">Referencias descartadas: {chat.invalid_citations.join(', ')}</p>}
            {chat.usage && <p className="usage">Tokens: {chat.usage.input_tokens ?? '—'} entrada · {chat.usage.output_tokens ?? '—'} salida · {chat.usage.total_tokens ?? '—'} total</p>}
          </> : <Empty text="Genera una respuesta para validar sus referencias contra lo recuperado." />)}
        </div>

        <div className="ask-bar">
          <label>Pregunta sobre tus fuentes<input value={question} placeholder="¿Qué afirma el documento sobre…?" onChange={event => setQuestion(event.target.value)} /></label>
          <button disabled={!index || !question.trim() || busy !== null} onClick={retrieve}>{busy === 'retrieve' ? 'Buscando…' : 'Solo recuperar'}</button>
          <button className="primary" disabled={!index || !question.trim() || busy !== null} onClick={ask}>{busy === 'chat' ? 'Generando…' : 'Preguntar'}</button>
        </div>
      </section>
    </main>

    <section className="library">
      <div><span className="eyebrow">PERSISTENCIA LOCAL</span><h2>Biblioteca e índices</h2></div>
      <div className="library-grid"><div><h3>Documentos</h3>{documents.length ? documents.map(item => <div className="library-item" key={item.id}>
        <button className="item-main" onClick={() => resetAfterDocument(item)}><strong>{item.title}</strong><small>{item.kind} · {item.text.length} caracteres</small></button>
        <button className="danger" aria-label={`Borrar ${item.title}`} onClick={() => act(null, async () => { if (!confirm('¿Borrar el documento y sus vectores?')) return; await api.deleteDocument(item.id); if (document?.id === item.id) setDocument(null); await refresh() })}>×</button>
      </div>) : <p className="muted">Aún no hay documentos.</p>}</div>
      <div><h3>Índices</h3>{indices.length ? indices.map(item => <div className="library-item" key={item.id}>
        <button className="item-main" onClick={() => selectIndex(item)}><strong>{item.embedding.model}</strong><small>{item.chunk_count} chunks · {item.embedding.dimensions}D</small></button>
        <button className="danger" aria-label={`Borrar índice ${item.collection_name}`} onClick={() => act(null, async () => { if (!confirm('¿Borrar este índice local?')) return; await api.deleteIndex(item.id); if (index?.id === item.id) setIndex(null); await refresh() })}>×</button>
      </div>) : <p className="muted">Aún no hay índices.</p>}</div></div>
    </section>

    <footer><span>RAG Lab · los documentos son datos, no instrucciones</span><button onClick={() => navigate('aprender')}>Aprender los conceptos →</button><span>FastAPI · LangChain · Chroma · React</span></footer>
  </div>
}

function Empty({ text }: { text: string }) {
  return <div className="empty"><div>⌁</div><p>{text}</p></div>
}

function LlmDeliveryFlow({ retrieval, generation, embedding, topK, sent, chat }: {
  retrieval: Retrieval
  generation: ProviderConfig
  embedding: ProviderConfig
  topK: number
  sent: boolean
  chat: ChatResult | null
}) {
  const systemMessage = retrieval.llm_messages.find(message => message.role === 'system')
  const userMessage = retrieval.llm_messages.find(message => message.role === 'user')
  const targetLabel = generation.provider === 'openai' ? 'OpenAI API' : 'Ollama local'
  const steps = [
    { number: '01', label: 'Pregunta', value: retrieval.question },
    { number: '02', label: 'Embedding de consulta', value: embedding.model },
    { number: '03', label: 'Búsqueda vectorial', value: `Chroma · coseno · top ${topK}` },
    { number: '04', label: 'Chunks elegidos', value: `${retrieval.source_count} fuente${retrieval.source_count === 1 ? '' : 's'}` },
    { number: '05', label: 'Contexto', value: `${retrieval.context_characters.toLocaleString()} caracteres` },
    { number: '06', label: 'Payload', value: `${retrieval.llm_messages.length} mensajes: system + user` },
    { number: '07', label: targetLabel, value: generation.model },
    { number: '08', label: sent ? 'Respuesta recibida' : 'Esperando envío', value: sent ? `${chat?.citations.length ?? 0} citas válidas` : 'Pulsa Preguntar' },
  ]

  return <div className="llm-delivery">
    <div className="panel-heading">
      <div><span className="kind">trazabilidad</span><h2>Del documento al LLM</h2></div>
      <span className={`delivery-state ${sent ? 'sent' : ''}`}>{sent ? '✓ Enviado' : '● Preparado para enviar'}</span>
    </div>

    <p className="explanation">Esta vista representa el recorrido exacto de la pregunta y las fuentes. El modelo no consulta Chroma directamente: recibe los mensajes construidos por el backend.</p>

    <ol className="llm-flow" aria-label="Flujo de envío al LLM">
      {steps.map(step => <li key={step.number}>
        <span className="flow-number">{step.number}</span>
        <strong>{step.label}</strong>
        <small>{step.value}</small>
      </li>)}
    </ol>

    <div className={`transfer-notice ${generation.provider}`}>
      <strong>{sent ? 'Destino utilizado' : 'Destino seleccionado'}: {targetLabel} · {generation.model}</strong>
      <span>{generation.provider === 'openai'
        ? 'La pregunta y las fuentes mostradas abajo salen de este Mac hacia OpenAI al pulsar Preguntar.'
        : 'La pregunta y las fuentes permanecen en este Mac y se envían al servicio local de Ollama.'}</span>
    </div>

    <div className="payload-heading">
      <div><span className="kind">payload exacto</span><h3>Mensajes preparados por FastAPI</h3></div>
      <dl>
        <div><dt>Fuentes</dt><dd>{retrieval.source_count}</dd></div>
        <div><dt>Contexto</dt><dd>{retrieval.context_characters.toLocaleString()} caracteres</dd></div>
      </dl>
    </div>

    <div className="payload-stack">
      <details open>
        <summary><span className="role system">system</span> Reglas, seguridad y formato de citas</summary>
        <pre>{systemMessage?.content}</pre>
      </details>
      <details>
        <summary><span className="role question">question</span> Pregunta del usuario</summary>
        <pre>{retrieval.question}</pre>
      </details>
      <details>
        <summary><span className="role sources">sources</span> Fuentes recuperadas delimitadas</summary>
        <pre>{retrieval.context}</pre>
      </details>
      <details open>
        <summary><span className="role user">user</span> Mensaje final enviado al modelo</summary>
        <pre>{userMessage?.content}</pre>
      </details>
    </div>

    {sent && chat && <div className="delivery-result">
      <div><span>Tokens de entrada</span><strong>{chat.usage?.input_tokens ?? '—'}</strong></div>
      <div><span>Tokens de salida</span><strong>{chat.usage?.output_tokens ?? '—'}</strong></div>
      <div><span>Recuperación</span><strong>{chat.timings_ms.retrieval?.toFixed(0)} ms</strong></div>
      <div><span>Generación</span><strong>{chat.timings_ms.generation?.toFixed(0)} ms</strong></div>
      <div><span>Citas válidas</span><strong>{chat.citations.length}</strong></div>
      <div><span>IDs validados</span><strong>{chat.citations.length ? chat.citations.join(', ') : 'Ninguno'}</strong></div>
    </div>}
  </div>
}
