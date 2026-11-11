import { Link } from 'react-router-dom'

export function NotFoundRoute() {
  return <main className="not-found"><span className="eyebrow">404</span><h1>Esta vista no existe.</h1><Link className="primary" to="/laboratorio">Volver al laboratorio</Link></main>
}
