import type { ChatResult, ProviderConfig, Retrieval } from '../../shared/api/contracts'
import styles from '../laboratory/Laboratory.module.css'

export function LlmDeliveryFlow({ retrieval, generation, embedding, topK, chat }: {
  retrieval: Retrieval
  generation: ProviderConfig
  embedding: ProviderConfig
  topK: number
  chat: ChatResult | null
}) {
  const systemMessage = retrieval.llm_messages.find(message => message.role === 'system')
  const userMessage = retrieval.llm_messages.find(message => message.role === 'user')
  const targetLabel = generation.provider === 'openai' ? 'OpenAI API' : 'Ollama local'
  const sent = Boolean(chat)
  const steps = [
    ['01', 'Pregunta', retrieval.question],
    ['02', 'Embedding de consulta', embedding.model],
    ['03', 'Búsqueda vectorial', `Chroma · coseno · top ${topK}`],
    ['04', 'Chunks elegidos', `${retrieval.source_count} fuente${retrieval.source_count === 1 ? '' : 's'}`],
    ['05', 'Contexto', `${retrieval.context_characters.toLocaleString()} caracteres`],
    ['06', 'Payload', `${retrieval.llm_messages.length} mensajes: system + user`],
    ['07', targetLabel, generation.model],
    ['08', sent ? 'Respuesta recibida' : 'Esperando envío', sent ? `${chat?.citations.length ?? 0} citas válidas` : 'Pulsa Preguntar'],
  ]

  return <div className={[styles['llm-delivery']].filter(Boolean).join(' ')}>
    <div className={[styles['panel-heading']].filter(Boolean).join(' ')}>
      <div><span className={[styles['kind']].filter(Boolean).join(' ')}>trazabilidad</span><h2>Del documento al LLM</h2></div>
      <span className={[styles['delivery-state'], sent ? styles.sent : ''].filter(Boolean).join(' ')}>{sent ? '✓ Enviado' : '● Preparado para enviar'}</span>
    </div>
    <p className={[styles['explanation']].filter(Boolean).join(' ')}>Esta vista representa el recorrido exacto de la pregunta y las fuentes. El modelo no consulta Chroma directamente: recibe los mensajes construidos por el backend.</p>
    <ol className={[styles['llm-flow']].filter(Boolean).join(' ')} aria-label="Flujo de envío al LLM">
      {steps.map(([number, label, value]) => <li key={number}>
        <span className={[styles['flow-number']].filter(Boolean).join(' ')}>{number}</span><strong>{label}</strong><small>{value}</small>
      </li>)}
    </ol>
    <div className={[styles['transfer-notice'], styles[generation.provider]].filter(Boolean).join(' ')}>
      <strong>{sent ? 'Destino utilizado' : 'Destino seleccionado'}: {targetLabel} · {generation.model}</strong>
      <span>{generation.provider === 'openai'
        ? 'La pregunta y las fuentes mostradas abajo salen de este Mac hacia OpenAI al pulsar Preguntar.'
        : 'La pregunta y las fuentes permanecen en este Mac y se envían al servicio local de Ollama.'}</span>
    </div>
    <div className={[styles['payload-heading']].filter(Boolean).join(' ')}>
      <div><span className={[styles['kind']].filter(Boolean).join(' ')}>payload exacto</span><h3>Mensajes preparados por FastAPI</h3></div>
      <dl><div><dt>Fuentes</dt><dd>{retrieval.source_count}</dd></div><div><dt>Contexto</dt><dd>{retrieval.context_characters.toLocaleString()} caracteres</dd></div></dl>
    </div>
    <div className={[styles['payload-stack']].filter(Boolean).join(' ')}>
      <details open><summary><span className={[styles['role'], styles['system']].filter(Boolean).join(' ')}>system</span> Reglas, seguridad y formato de citas</summary><pre>{systemMessage?.content}</pre></details>
      <details><summary><span className={[styles['role'], styles['question']].filter(Boolean).join(' ')}>question</span> Pregunta del usuario</summary><pre>{retrieval.question}</pre></details>
      <details><summary><span className={[styles['role'], styles['sources']].filter(Boolean).join(' ')}>sources</span> Fuentes recuperadas delimitadas</summary><pre>{retrieval.context}</pre></details>
      <details open><summary><span className={[styles['role'], styles['user']].filter(Boolean).join(' ')}>user</span> Mensaje final enviado al modelo</summary><pre>{userMessage?.content}</pre></details>
    </div>
    {sent && chat && <div className={[styles['delivery-result']].filter(Boolean).join(' ')}>
      <div><span>Tokens de entrada</span><strong>{chat.usage?.input_tokens ?? '—'}</strong></div>
      <div><span>Tokens de salida</span><strong>{chat.usage?.output_tokens ?? '—'}</strong></div>
      <div><span>Recuperación</span><strong>{chat.timings_ms.retrieval?.toFixed(0)} ms</strong></div>
      <div><span>Generación</span><strong>{chat.timings_ms.generation?.toFixed(0)} ms</strong></div>
      <div><span>Citas válidas</span><strong>{chat.citations.length}</strong></div>
      <div><span>IDs validados</span><strong>{chat.citations.length ? chat.citations.join(', ') : 'Ninguno'}</strong></div>
    </div>}
  </div>
}

