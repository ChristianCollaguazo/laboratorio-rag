import styles from '../laboratory/Laboratory.module.css'
export function StageRail({ completed, busy }: { completed: number; busy: boolean }) {
  const stages = ['Extraer', 'Fragmentar', 'Embeddings', 'Almacenar', 'Recuperar', 'Generar']
  return <ol className={[styles['stage-rail']].filter(Boolean).join(' ')} aria-label="Etapas del pipeline">
    {stages.map((stage, index) => <li key={stage} className={index < completed ? styles.done : index === completed && busy ? styles.working : ''}>
      <span>{index < completed ? '✓' : index + 1}</span>{stage}
    </li>)}
  </ol>
}

