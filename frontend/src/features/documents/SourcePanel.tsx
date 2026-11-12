import styles from '../laboratory/Laboratory.module.css'
export function SourcePanel({ title, text, busy, onTitle, onText, onCreate, onUpload }: {
  title: string
  text: string
  busy: boolean
  onTitle: (value: string) => void
  onText: (value: string) => void
  onCreate: () => void
  onUpload: (file: File) => void
}) {
  return <section>
    <div className={[styles['section-title']].filter(Boolean).join(' ')}><span>02</span><div><h2>Preparar fuente</h2><p>Pega texto o carga TXT/PDF seleccionable.</p></div></div>
    <label>Título<input value={title} onChange={event => onTitle(event.target.value)} /></label>
    <label>Texto<textarea rows={8} placeholder="Pega aquí el contenido que quieres consultar…" value={text} onChange={event => onText(event.target.value)} /></label>
    <button className={[styles['primary']].filter(Boolean).join(' ')} disabled={!title.trim() || !text.trim() || busy} onClick={onCreate}>
      {busy ? 'Extrayendo…' : 'Usar este texto'}
    </button>
    <label className={[styles['file-button']].filter(Boolean).join(' ')}>o seleccionar TXT / PDF
      <input type="file" accept=".txt,.pdf,text/plain,application/pdf" disabled={busy}
        onChange={event => event.target.files?.[0] && onUpload(event.target.files[0])} />
    </label>
  </section>
}

