import styles from '../laboratory/Laboratory.module.css'
export function IndexingPanel({ chunkSize, overlap, topK, canChunk, canIndex, busy, onChunkSize, onOverlap, onTopK, onChunk, onIndex }: {
  chunkSize: number
  overlap: number
  topK: number
  canChunk: boolean
  canIndex: boolean
  busy: boolean
  onChunkSize: (value: number) => void
  onOverlap: (value: number) => void
  onTopK: (value: number) => void
  onChunk: () => void
  onIndex: () => void
}) {
  return <section>
    <div className={[styles['section-title']].filter(Boolean).join(' ')}><span>03</span><div><h2>Ajustes</h2><p>Medidos en caracteres, no tokens.</p></div></div>
    <div className={[styles['number-grid']].filter(Boolean).join(' ')}>
      <label>Tamaño<input type="number" min="100" max="8000" value={chunkSize} onChange={event => onChunkSize(Number(event.target.value))} /></label>
      <label>Solapamiento<input type="number" min="0" value={overlap} onChange={event => onOverlap(Number(event.target.value))} /></label>
      <label>Resultados<input type="number" min="1" max="20" value={topK} onChange={event => onTopK(Number(event.target.value))} /></label>
    </div>
    <div className={[styles['button-row']].filter(Boolean).join(' ')}>
      <button disabled={!canChunk || busy} onClick={onChunk}>1. Fragmentar</button>
      <button disabled={!canIndex || busy} onClick={onIndex}>2. Vectorizar</button>
    </div>
  </section>
}

