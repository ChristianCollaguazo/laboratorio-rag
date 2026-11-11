import { Navigate, createBrowserRouter } from 'react-router-dom'
import { LaboratoryRoute } from '../routes/LaboratoryRoute'
import { LearningRoute } from '../routes/LearningRoute'
import { NotFoundRoute } from '../routes/NotFoundRoute'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/laboratorio" replace /> },
  { path: '/laboratorio', element: <LaboratoryRoute /> },
  { path: '/aprender', element: <LearningRoute /> },
  { path: '*', element: <NotFoundRoute /> },
])
