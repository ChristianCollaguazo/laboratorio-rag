import { ConceptSlide, GenerationGraphic } from '../components/LearningGraphics'
import type { LearningSlideProps } from './types'

export function GenerationSlide(_props: LearningSlideProps) {
  return <ConceptSlide number={11} eyebrow="salida verificable" title="Generar no basta: la respuesta debe demostrar su evidencia"
    lead="El LLM genera la respuesta token por token condicionado por las instrucciones, la pregunta y las fuentes. Después, el backend acepta solamente citas cuyos IDs estaban entre los chunks recuperados."
    analogy="No basta con entregar la respuesta: también se revisa que cada nota al pie apunte a una página que realmente estaba sobre la mesa."
    misconception="Una salida probable no es necesariamente verdadera. Una cita válida demuestra que el ID fue recuperado, no que toda la afirmación esté respaldada; la evaluación de fidelidad sigue siendo necesaria."
    technical={<><p>El generador predice continuaciones a partir de los mensajes; las citas también son texto generado y deben validarse.</p><ul><li>Un ID desconocido se marca o descarta de forma determinista.</li><li>Si no hay evidencia suficiente, la respuesta correcta es reconocerlo.</li><li>Comprobar que la fuente respalda realmente cada afirmación requiere evaluar fidelidad, no solo formato.</li></ul></>}><GenerationGraphic /></ConceptSlide>
}
