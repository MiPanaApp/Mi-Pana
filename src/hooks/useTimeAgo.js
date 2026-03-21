import { useState, useEffect } from 'react'

function calcTimeAgo(dateInput) {
  const now = Date.now()

  // Soporta Firestore Timestamp, Date, string ISO y número Unix
  let past
  if (!dateInput) return null
  if (dateInput?.toDate) {
    past = dateInput.toDate().getTime()      // Firestore Timestamp
  } else if (dateInput instanceof Date) {
    past = dateInput.getTime()               // Date nativo
  } else if (typeof dateInput === 'number') {
    past = dateInput > 1e10 ? dateInput : dateInput * 1000 // Unix ms o s
  } else {
    past = new Date(dateInput).getTime()     // string ISO
  }

  if (isNaN(past)) return null

  const diff = now - past
  const minutes = Math.floor(diff / 60000)
  const hours   = Math.floor(diff / 3600000)
  const days    = Math.floor(diff / 86400000)
  const months  = Math.floor(days / 30.44)
  const years   = Math.floor(days / 365.25)

  if (minutes < 1)   return 'Publicado ahora mismo'
  if (minutes < 60)  return `Publicado hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  if (hours < 24)    return `Publicado hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  if (days < 30)     return `Publicado hace ${days} ${days === 1 ? 'día' : 'días'}`
  if (months < 12)   return `Publicado hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  return `Publicado hace ${years} ${years === 1 ? 'año' : 'años'}`
}

export function useTimeAgo(dateInput) {
  const [label, setLabel] = useState(() => calcTimeAgo(dateInput))

  useEffect(() => {
    if (!dateInput) return

    setLabel(calcTimeAgo(dateInput))

    // Intervalo adaptativo según antigüedad
    const rawDate = dateInput?.toDate?.() ?? new Date(dateInput)
    const diff = Date.now() - rawDate.getTime()
    const hours = diff / 3600000

    // Recalcula cada minuto si es reciente, cada hora si tiene días
    const interval = hours < 1 ? 60000 : hours < 24 ? 3600000 : 86400000

    const timer = setInterval(() => {
      setLabel(calcTimeAgo(dateInput))
    }, interval)

    return () => clearInterval(timer)
  }, [dateInput])

  return label
}
