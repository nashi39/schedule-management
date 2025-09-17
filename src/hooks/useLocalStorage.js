import { useEffect, useRef, useState } from 'react'

export function useLocalStorageJson(key, initialValue) {
  const [value, setValue] = useState(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setValue(parsed)
        }
      }
    } catch (e) {
      console.warn('localStorage parse error. Reset.', e)
      localStorage.removeItem(key)
      setValue(initialValue)
    } finally {
      setIsLoaded(true)
    }
  }, [key])

  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value, isLoaded])

  return { value, setValue, isLoaded }
} 