import ReactMarkdown from 'react-markdown'
import styles from '../laboratory/Laboratory.module.css'

function escapeExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function linkVerifiedCitations(answer: string, citationIds: string[]): string {
  if (!citationIds.length) return answer
  const alternatives = citationIds.map(escapeExpression).join('|')
  const citationPattern = new RegExp(`\\[(${alternatives})\\]`, 'g')
  return answer.replace(citationPattern, (_match, identifier: string) =>
    `[${identifier}](#chunk-${encodeURIComponent(identifier)})`,
  )
}

export function MarkdownAnswer({ answer, citationIds, onCitationClick }: {
  answer: string
  citationIds: string[]
  onCitationClick: (citationId: string) => void
}) {
  const markdown = linkVerifiedCitations(answer, citationIds)

  return <div className={styles.answer}>
    <ReactMarkdown components={{
      a: ({ href, children }) => {
        const prefix = '#chunk-'
        if (href?.startsWith(prefix)) {
          const citationId = decodeURIComponent(href.slice(prefix.length))
          return <button type="button" className={styles['citation-link']} onClick={() => onCitationClick(citationId)}>{children}</button>
        }
        return <a href={href} target="_blank" rel="noreferrer">{children}</a>
      },
    }}>{markdown}</ReactMarkdown>
  </div>
}
