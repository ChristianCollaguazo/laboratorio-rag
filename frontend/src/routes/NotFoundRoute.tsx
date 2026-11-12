import { Link } from 'react-router-dom'
import styles from './NotFoundRoute.module.css'

export function NotFoundRoute() {
  return <main className={styles.page}><span className={styles.eyebrow}>404</span><h1>Esta vista no existe.</h1><Link className={styles.link} to="/laboratorio">Volver al laboratorio</Link></main>
}
