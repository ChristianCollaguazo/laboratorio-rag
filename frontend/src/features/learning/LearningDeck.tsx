import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '../../shared/api/client'
import type { EmbeddingLabResult } from '../../shared/api/contracts'
import { learningArticle, splitForDemo } from './components/LearningGraphics'
import { slideRegistry } from './slideRegistry'
import styles from './LearningDeck.module.css'

export default function LearningDeck({ onBack }: { onBack: () => void }) {
  const [current, setCurrent] = useState(0)
  const [chunkSize, setChunkSize] = useState(300)
  const [overlap, setOverlap] = useState(60)
  const [topK, setTopK] = useState(2)
  const [articleText, setArticleText] = useState(learningArticle)
  const [labQuery, setLabQuery] = useState('automóvil')
  const [labCandidates, setLabCandidates] = useState('coche\nbanana\nvehículo')
  const [labResult, setLabResult] = useState<EmbeddingLabResult | null>(null)
  const [labBusy, setLabBusy] = useState(false)
  const [labError, setLabError] = useState('')
  const chunks = useMemo(
    () => splitForDemo(articleText, chunkSize, Math.min(overlap, chunkSize / 2)),
    [articleText, chunkSize, overlap],
  )

  const runEmbeddingLab = async (event: FormEvent) => {
    event.preventDefault()
    const candidates = labCandidates.split(/\n|,/).map(item => item.trim()).filter(Boolean)
    if (!labQuery.trim() || candidates.length < 2 || candidates.length > 6) {
      setLabError('Escribe una consulta y entre 2 y 6 palabras candidatas.')
      return
    }
    setLabBusy(true)
    setLabError('')
    try {
      setLabResult(await api.learningEmbeddings(labQuery.trim(), candidates))
    } catch (error) {
      setLabResult(null)
      setLabError(error instanceof Error ? error.message : 'No se pudieron generar los embeddings.')
    } finally {
      setLabBusy(false)
    }
  }

  const go = (next: number) => {
    setCurrent(Math.max(0, Math.min(slideRegistry.length - 1, next)))
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return
      if (event.key === 'ArrowRight') go(current + 1)
      if (event.key === 'ArrowLeft') go(current - 1)
      if (event.key === 'Home') go(0)
      if (event.key === 'End') go(slideRegistry.length - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [current])

  const CurrentSlide = slideRegistry[current].component
  const slideProps = {
    chunks, chunkSize, overlap, topK, articleText, labQuery, labCandidates,
    labResult, labBusy, labError, setChunkSize, setOverlap, setTopK, setArticleText,
    resetArticle: () => setArticleText(learningArticle), setLabQuery, setLabCandidates,
    runEmbeddingLab,
  }

  return <div className={[styles['learning-shell']].filter(Boolean).join(' ')}>
    <header className={[styles['learning-topbar']].filter(Boolean).join(' ')}>
      <button className={[styles['back-to-lab']].filter(Boolean).join(' ')} onClick={onBack}>← Volver al laboratorio</button>
      <div><span className={['eyebrow'].filter(Boolean).join(' ')}>PRESENTACIÓN DIDÁCTICA</span><strong>Aprender RAG</strong></div>
      <span className={[styles['lesson-progress']].filter(Boolean).join(' ')} aria-live="polite">{current + 1} / {slideRegistry.length}</span>
    </header>
    <div className={[styles['learning-layout']].filter(Boolean).join(' ')}>
      <nav className={[styles['lesson-index']].filter(Boolean).join(' ')} aria-label="Temas de la presentación">
        <div><span className={[styles['kind']].filter(Boolean).join(' ')}>índice</span><p>Del documento a una respuesta verificable.</p></div>
        <ol>{slideRegistry.map((slide, index) => <li key={slide.title}>
          <button aria-label={`${String(index + 1).padStart(2, '0')} ${slide.title}`} className={current === index ? styles.active : current > index ? styles.visited : ''} aria-current={current === index ? 'step' : undefined} onClick={() => go(index)}>
            <span>{String(index + 1).padStart(2, '0')}</span><span className={[styles['lesson-topic']].filter(Boolean).join(' ')}>{slide.title}</span>
          </button>
        </li>)}</ol>
        <small>Usa ← → para avanzar</small>
      </nav>
      <main className={[styles['lesson-stage']].filter(Boolean).join(' ')}>
        <div className={[styles['progress-track']].filter(Boolean).join(' ')}><span style={{ width: `${((current + 1) / slideRegistry.length) * 100}%` }} /></div>
        <div key={current} className={[styles['slide-enter']].filter(Boolean).join(' ')}><CurrentSlide {...slideProps} /></div>
        <footer className={[styles['lesson-controls']].filter(Boolean).join(' ')}>
          <button disabled={current === 0} onClick={() => go(current - 1)}>← Anterior</button>
          <span>{slideRegistry[current].title}</span>
          {current < slideRegistry.length - 1
            ? <button className={['primary'].filter(Boolean).join(' ')} onClick={() => go(current + 1)}>Siguiente →</button>
            : <button className={['primary'].filter(Boolean).join(' ')} onClick={onBack}>Volver al laboratorio</button>}
        </footer>
      </main>
    </div>
  </div>
}



