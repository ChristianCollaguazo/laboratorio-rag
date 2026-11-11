import type { LaboratoryController } from '../laboratory/useLaboratoryController'
import styles from '../laboratory/Laboratory.module.css'

export function LibraryPanel({ controller }: { controller: LaboratoryController }) {
  const { documents, indices, resetAfterDocument, selectIndex, mutations } = controller
  const removeDocument = (id: string) => {
    if (confirm('¿Borrar el documento y sus vectores?')) mutations.deleteDocument.mutate(id)
  }
  const removeIndex = (id: string) => {
    if (confirm('¿Borrar este índice local?')) mutations.deleteIndex.mutate(id)
  }
  return <section className={[styles['library']].filter(Boolean).join(' ')}>
    <div><span className={[styles['eyebrow']].filter(Boolean).join(' ')}>PERSISTENCIA LOCAL</span><h2>Biblioteca e índices</h2></div>
    <div className={[styles['library-grid']].filter(Boolean).join(' ')}>
      <div><h3>Documentos</h3>{documents.length ? documents.map(item => <div className={[styles['library-item']].filter(Boolean).join(' ')} key={item.id}>
        <button className={[styles['item-main']].filter(Boolean).join(' ')} onClick={() => resetAfterDocument(item)}><strong>{item.title}</strong><small>{item.kind} · {item.text.length} caracteres</small></button>
        <button className={[styles['danger']].filter(Boolean).join(' ')} aria-label={`Borrar ${item.title}`} onClick={() => removeDocument(item.id)}>×</button>
      </div>) : <p className={[styles['muted']].filter(Boolean).join(' ')}>Aún no hay documentos.</p>}</div>
      <div><h3>Índices</h3>{indices.length ? indices.map(item => <div className={[styles['library-item']].filter(Boolean).join(' ')} key={item.id}>
        <button className={[styles['item-main']].filter(Boolean).join(' ')} onClick={() => selectIndex(item)}><strong>{item.embedding.model}</strong><small>{item.chunk_count} chunks · {item.embedding.dimensions}D</small></button>
        <button className={[styles['danger']].filter(Boolean).join(' ')} aria-label={`Borrar índice ${item.collection_name}`} onClick={() => removeIndex(item.id)}>×</button>
      </div>) : <p className={[styles['muted']].filter(Boolean).join(' ')}>Aún no hay índices.</p>}</div>
    </div>
  </section>
}

