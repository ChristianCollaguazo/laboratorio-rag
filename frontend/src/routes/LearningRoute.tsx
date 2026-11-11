import { useNavigate } from 'react-router-dom'
import LearningDeck from '../features/learning/LearningDeck'

export function LearningRoute() {
  const navigate = useNavigate()
  return <LearningDeck onBack={() => navigate('/laboratorio')} />
}
