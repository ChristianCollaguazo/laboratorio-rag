import { useEffect, useState } from 'react'
import styles from '../laboratory/Laboratory.module.css'

type NumericField = 'chunkSize' | 'overlap' | 'topK'

function parseInteger(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null
  return Number(value)
}

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
  onChunk: (chunkSize: number, overlap: number) => void
  onIndex: () => void
}) {
  const [drafts, setDrafts] = useState({
    chunkSize: String(chunkSize),
    overlap: String(overlap),
    topK: String(topK),
  })
  const [validationMessage, setValidationMessage] = useState('')

  useEffect(() => {
    setDrafts({ chunkSize: String(chunkSize), overlap: String(overlap), topK: String(topK) })
  }, [chunkSize, overlap, topK])

  const updateDraft = (field: NumericField, value: string) => {
    setDrafts(current => ({ ...current, [field]: value }))
    setValidationMessage('')
    const parsed = parseInteger(value)
    if (field === 'topK' && parsed !== null && parsed >= 1 && parsed <= 20) onTopK(parsed)
  }

  const validateChunking = (): { chunkSize: number, overlap: number } | null => {
    const nextChunkSize = parseInteger(drafts.chunkSize)
    const nextOverlap = parseInteger(drafts.overlap)
    if (nextChunkSize === null || nextChunkSize < 100 || nextChunkSize > 8000) {
      setValidationMessage('El tamaño debe ser un número entre 100 y 8000 caracteres.')
      return null
    }
    if (nextOverlap === null || nextOverlap < 0 || nextOverlap >= nextChunkSize) {
      setValidationMessage('El solapamiento debe ser 0 o mayor, y menor que el tamaño del chunk.')
      return null
    }
    return { chunkSize: nextChunkSize, overlap: nextOverlap }
  }

  const handleChunk = () => {
    const values = validateChunking()
    if (!values) return
    onChunkSize(values.chunkSize)
    onOverlap(values.overlap)
    onChunk(values.chunkSize, values.overlap)
  }

  return <section>
    <div className={[styles['section-title']].filter(Boolean).join(' ')}><span>03</span><div><h2>Fragmentar e indexar</h2><p>Medidos en caracteres, no tokens.</p></div></div>
    <div className={[styles['number-grid']].filter(Boolean).join(' ')}>
      <label>Tamaño (chunk size)<input aria-label="Tamaño (chunk size)" inputMode="numeric" value={drafts.chunkSize} onChange={event => updateDraft('chunkSize', event.target.value)} onBlur={validateChunking} /></label>
      <label>Solapamiento (chunk overlap)<input aria-label="Solapamiento (chunk overlap)" inputMode="numeric" value={drafts.overlap} onChange={event => updateDraft('overlap', event.target.value)} onBlur={validateChunking} /></label>
      <label>Resultados (top-k)<input aria-label="Resultados (top-k)" inputMode="numeric" value={drafts.topK} onChange={event => updateDraft('topK', event.target.value)} onBlur={() => {
        const value = parseInteger(drafts.topK)
        if (value === null || value < 1 || value > 20) setValidationMessage('Los resultados deben ser un número entre 1 y 20.')
      }} /></label>
    </div>
    {validationMessage && <p className={styles['field-error']} role="alert">{validationMessage}</p>}
    <div className={[styles['button-row']].filter(Boolean).join(' ')}>
      <button disabled={!canChunk || busy} onClick={handleChunk}>1. Fragmentar</button>
      <button disabled={!canIndex || busy} onClick={onIndex}>2. Vectorizar</button>
    </div>
  </section>
}

