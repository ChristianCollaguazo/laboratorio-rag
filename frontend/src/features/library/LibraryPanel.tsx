import { useEffect, useState } from 'react'

import type { LaboratoryController } from '../laboratory/useLaboratoryController'
import styles from '../laboratory/Laboratory.module.css'

export function LibraryPanel({ controller }: { controller: LaboratoryController }) {
  const { documents, indices, selectIndex, activeMutation, mutations } = controller
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const busy = Boolean(activeMutation)

  useEffect(() => {
    setSelectedDocumentIds(current => {
      const availableIds = documents.map(document => document.id)
      const retainedIds = current.filter(id => availableIds.includes(id))
      const newIds = availableIds.filter(id => !retainedIds.includes(id))
      return [...retainedIds, ...newIds]
    })
  }, [documents])

  const allSelected = documents.length > 0 && selectedDocumentIds.length === documents.length
  const toggleDocument = (documentId: string) => {
    setSelectedDocumentIds(current => current.includes(documentId)
      ? current.filter(id => id !== documentId)
      : [...current, documentId])
  }
  const toggleAllDocuments = () => setSelectedDocumentIds(allSelected ? [] : documents.map(document => document.id))
  const removeDocument = (id: string) => {
    if (confirm('¿Borrar el documento y sus vectores?')) mutations.deleteDocument.mutate(id)
  }
  const removeIndex = (id: string) => {
    if (confirm('¿Borrar este índice local?')) mutations.deleteIndex.mutate(id)
  }
  const clearLocalData = () => {
    if (confirm('Esto borrará todos los documentos, chunks, índices y vectores locales. Esta acción no se puede deshacer.')) {
      mutations.clearLibrary.mutate()
    }
  }

  return <section className={styles.library}>
    <div>
      <span className={styles.eyebrow}>BIBLIOTECA LOCAL</span>
      <h2>Índices y consultas guardadas</h2>
      <p className={styles.muted}>Selecciona un índice existente para preguntar sin volver a cargar una fuente.</p>
      <button className={styles['danger-button']} disabled={busy || (!documents.length && !indices.length)} onClick={clearLocalData}>Vaciar datos locales</button>
    </div>
    <div className={styles['library-grid']}>
      <div className={styles['library-section']}>
        <div className={styles['library-heading']}><h3>1. Elegir documentos</h3>{documents.length > 0 && <label className={styles['select-all']}><input type="checkbox" checked={allSelected} onChange={toggleAllDocuments} /> Todos los documentos</label>}</div>
        {documents.length ? <div className={styles['library-list']}>{documents.map(item => <div className={styles['library-item']} key={item.id}>
          <label className={styles['document-check']}><input type="checkbox" checked={selectedDocumentIds.includes(item.id)} onChange={() => toggleDocument(item.id)} /><span><strong>{item.title}</strong><small>{item.kind} · {item.text.length} caracteres</small></span></label>
          <button className={styles.danger} aria-label={`Borrar ${item.title}`} onClick={() => removeDocument(item.id)}>×</button>
        </div>)}</div> : <p className={styles.muted}>Aún no hay documentos.</p>}
        <button className={styles.primary} disabled={!selectedDocumentIds.length || busy} onClick={() => mutations.createSharedIndex.mutate(selectedDocumentIds)}>
          {mutations.createSharedIndex.isPending ? 'Preparando índice…' : `Crear índice compartido (${selectedDocumentIds.length})`}
        </button>
        <p className={styles.muted}>Esta acción vuelve a fragmentar los documentos seleccionados con los ajustes actuales y crea un índice nuevo. Los índices anteriores se conservan.</p>
      </div>
      <div className={styles['library-section']}>
        <h3>2. Consultar un índice existente</h3>
        {indices.length ? <div className={styles['library-list']}>{indices.map(item => <div className={styles['library-item']} key={item.id}>
          <button className={styles['item-main']} onClick={() => selectIndex(item)}><strong>{item.document_ids.length} documento(s) · {item.embedding.model}</strong><small>{item.chunk_count} chunks · {item.embedding.dimensions}D · {item.chunking.chunk_size}/{item.chunking.chunk_overlap}</small></button>
          <button className={styles.danger} aria-label={`Borrar índice ${item.collection_name}`} onClick={() => removeIndex(item.id)}>×</button>
        </div>)}</div> : <p className={styles.muted}>Crea un índice compartido para habilitar consultas sobre la biblioteca.</p>}
        {controller.state.index && <p className={styles['loaded-index']}>Índice cargado: <code>{controller.state.index.collection_name}</code>. Puedes preguntar en el panel de la derecha.</p>}
      </div>
    </div>
  </section>
}

