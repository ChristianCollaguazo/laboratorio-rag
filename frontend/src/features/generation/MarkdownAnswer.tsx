import ReactMarkdown from 'react-markdown'
import styles from '../laboratory/Laboratory.module.css'

function escapeExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type CitationSource = { documentId: string, documentTitle: string }

function linkVerifiedCitations(
  answer: string,
  citationIds: string[],
  citationSources: Record<string, CitationSource>,
  display: 'chunks' | 'documents',
): string {
  if (!citationIds.length) return answer
  const alternatives = citationIds.map(escapeExpression).join('|')
  const citationPattern = new RegExp(`\\[(${alternatives})\\]`, 'g')
  return answer.replace(citationPattern, (_match, identifier: string) => {
    const source = citationSources[identifier]
    if (display === 'documents' && source) {
      return `[${source.documentTitle}](#document-${encodeURIComponent(source.documentId)})`
    }
    return `[${identifier}](#chunk-${encodeURIComponent(identifier)})`
  })
}

export function MarkdownAnswer({ answer, citationIds, citationSources, display, onChunkClick, onDocumentClick }: {
  answer: string
  citationIds: string[]
  citationSources: Record<string, CitationSource>
  display: 'chunks' | 'documents'
  onChunkClick: (citationId: string) => void
  onDocumentClick: (documentId: string) => void
}) {
  const markdown = linkVerifiedCitations(answer, citationIds, citationSources, display)

  return <div className={styles.answer}>
    <ReactMarkdown components={{
      a: ({ href, children }) => {
        const prefix = '#chunk-'
        if (href?.startsWith(prefix)) {
          const citationId = decodeURIComponent(href.slice(prefix.length))
          return <button type="button" className={styles['citation-link']} onClick={() => onChunkClick(citationId)}>{children}</button>
        }
        const documentPrefix = '#document-'
        if (href?.startsWith(documentPrefix)) {
          const documentId = decodeURIComponent(href.slice(documentPrefix.length))
          return <button type="button" className={styles['citation-link']} onClick={() => onDocumentClick(documentId)}>{children}</button>
        }
        return <a href={href} target="_blank" rel="noreferrer">{children}</a>
      },
    }}>{markdown}</ReactMarkdown>
  </div>
}
