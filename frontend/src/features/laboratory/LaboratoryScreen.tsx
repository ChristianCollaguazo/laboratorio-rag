import { Link } from 'react-router-dom'
import { ProviderPanel } from '../provider-config/ProviderPanel'
import { SourcePanel } from '../documents/SourcePanel'
import { IndexingPanel } from '../indexing/IndexingPanel'
import { LibraryPanel } from '../library/LibraryPanel'
import { PipelineInspector } from '../pipeline/PipelineInspector'
import { StageRail } from '../pipeline/StageRail'
import { useLaboratoryController } from './useLaboratoryController'
import styles from './Laboratory.module.css'

export function LaboratoryScreen() {
  const controller = useLaboratoryController()
  const { state, patch, status, completed, activeMutation, error, mutations } = controller
  const busy = Boolean(activeMutation)

  return <div className={[styles['app-shell']].filter(Boolean).join(' ')}>
    <header className={[styles['hero']].filter(Boolean).join(' ')}>
      <div><span className={[styles['eyebrow']].filter(Boolean).join(' ')}>LABORATORIO LOCAL</span><h1>RAG, pieza por pieza.</h1>
        <p>Pega conocimiento, observa sus vectores y comprueba cómo una respuesta encuentra su evidencia.</p></div>
      <div className={[styles['hero-side']].filter(Boolean).join(' ')}>
        <Link className={[styles['learn-button']].filter(Boolean).join(' ')} to="/aprender"><span>✦</span> Aprender RAG</Link>
        <div className={[styles['health']].filter(Boolean).join(' ')}>
          <span className={[styles.dot, status?.chroma_available ? styles.ok : ''].filter(Boolean).join(' ')} /> Chroma local
          <span className={[styles.dot, status?.openai.available ? styles.ok : styles.warn].filter(Boolean).join(' ')} /> OpenAI
          <span className={[styles.dot, status?.ollama.available ? styles.ok : styles.warn].filter(Boolean).join(' ')} /> Ollama
        </div>
      </div>
    </header>

    <StageRail completed={completed} busy={busy} />
    {error && <div className={[styles['alert'], styles['error']].filter(Boolean).join(' ')} role="alert"><strong>No se pudo completar el paso.</strong> {error}</div>}
    {state.notice && <div className={[styles['alert'], styles['success']].filter(Boolean).join(' ')} role="status">{state.notice}</div>}

    <main className={[styles['workspace']].filter(Boolean).join(' ')}>
      <aside className={[styles['controls']].filter(Boolean).join(' ')}>
        <ProviderPanel embedding={state.embedding} generation={state.generation} status={status}
          onEmbedding={embedding => patch({ embedding })} onGeneration={generation => patch({ generation })} />
        <SourcePanel title={state.title} text={state.text} busy={busy}
          onTitle={title => patch({ title })} onText={text => patch({ text })}
          onCreate={() => mutations.createText.mutate()} onUpload={file => mutations.upload.mutate(file)} />
        <IndexingPanel chunkSize={state.chunkSize} overlap={state.overlap} topK={state.topK}
          canChunk={Boolean(state.document)} canIndex={Boolean(state.chunkSet)} busy={busy}
          onChunkSize={chunkSize => patch({ chunkSize })} onOverlap={overlap => patch({ overlap })}
          onTopK={topK => patch({ topK })} onChunk={(chunkSize, overlap) => mutations.createChunks.mutate({ chunkSize, overlap })}
          onIndex={() => mutations.createIndex.mutate()} />
      </aside>
      <PipelineInspector controller={controller} />
    </main>

    <LibraryPanel controller={controller} />
    <footer><span>RAG Lab · los documentos son datos, no instrucciones</span><Link to="/aprender">Aprender los conceptos →</Link><span>FastAPI · LangChain · Chroma · React</span></footer>
  </div>
}

