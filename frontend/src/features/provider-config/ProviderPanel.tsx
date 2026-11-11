import type { Provider, ProviderConfig, Status } from '../../shared/api/contracts'
import styles from '../laboratory/Laboratory.module.css'

const defaults = {
  openaiGeneration: 'gpt-6-luna', openaiEmbedding: 'text-embedding-3-small',
  ollamaGeneration: 'qwen3:8b', ollamaEmbedding: 'qwen3-embedding:0.6b',
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
  return <fieldset className={[styles['provider-card']].filter(Boolean).join(' ')}>
    <legend>{label}</legend>
    <div className={[styles['segmented']].filter(Boolean).join(' ')} aria-label={`Proveedor de ${label.toLowerCase()}`}>
      {(['openai', 'ollama'] as Provider[]).map(provider =>
        <button key={provider} type="button" className={value.provider === provider ? styles.active : ''}
          onClick={() => switchProvider(provider)}>{provider === 'openai' ? 'OpenAI' : 'Ollama'}</button>)}
    </div>
    <label>Modelo<input value={value.model} onChange={event => onChange({ ...value, model: event.target.value })} /></label>
    {purpose === 'embedding' && <label>Dimensiones <span className={[styles['optional']].filter(Boolean).join(' ')}>(vacío = modelo)</span>
      <input type="number" min="1" value={value.dimensions ?? ''}
        onChange={event => onChange({ ...value, dimensions: event.target.value ? Number(event.target.value) : null })} />
    </label>}
  </fieldset>
}

export function ProviderPanel({ embedding, generation, status, onEmbedding, onGeneration }: {
  embedding: ProviderConfig
  generation: ProviderConfig
  status?: Status
  onEmbedding: (value: ProviderConfig) => void
  onGeneration: (value: ProviderConfig) => void
}) {
  return <section>
    <div className={[styles['section-title']].filter(Boolean).join(' ')}><span>01</span><div><h2>Proveedores</h2><p>Embeddings y generación son independientes.</p></div></div>
    <ProviderEditor label="Embeddings" value={embedding} onChange={onEmbedding} purpose="embedding" />
    <ProviderEditor label="Generación" value={generation} onChange={onGeneration} purpose="generation" />
    {status && <div className={[styles['provider-status']].filter(Boolean).join(' ')}>
      <p><span className={[styles.mini, status.openai.available ? styles.ok : ''].filter(Boolean).join(' ')} />{status.openai.message}</p>
      <p><span className={[styles.mini, status.ollama.available ? styles.ok : ''].filter(Boolean).join(' ')} />{status.ollama.message}</p>
    </div>}
    {(embedding.provider === 'openai' || generation.provider === 'openai') &&
      <div className={[styles['privacy-note']].filter(Boolean).join(' ')}>↗ El texto de las operaciones seleccionadas se enviará a OpenAI. La clave permanece en el backend.</div>}
  </section>
}

