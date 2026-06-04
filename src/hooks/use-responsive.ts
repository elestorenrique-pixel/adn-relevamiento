'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para detectar tamaño de pantalla
 * Útil para layouts responsivos
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState<{
    width: number | undefined
    height: number | undefined
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
  }>({
    width: undefined,
    height: undefined,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  })

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setWindowSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

/**
 * Hook para detectar modo oscuro
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(isDarkMode)

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handler)

    return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handler)
  }, [])

  return isDark
}

/**
 * Hook para throttle de eventos (scroll, resize)
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastUpdated = useState(Date.now())[0]

  useEffect(() => {
    const now = Date.now()
    if (now >= lastUpdated + interval) {
      setThrottledValue(value)
    }
  }, [value, interval])

  return throttledValue
}

/**
 * Hook para debounce (búsqueda, input)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para acceder a localStorage con SSR safety
 */
export function useLocalStorage(key: string, initialValue?: string) {
  const [storedValue, setStoredValue] = useState<string | null>(initialValue || null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key)
      setStoredValue(item)
    }
  }, [key])

  const setValue = (value: string | null) => {
    try {
      if (typeof window !== 'undefined') {
        if (value === null) {
          window.localStorage.removeItem(key)
        } else {
          window.localStorage.setItem(key, value)
        }
        setStoredValue(value)
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}

/**
 * Hook para clipboard copy
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return true
    } catch (error) {
      console.error('Failed to copy:', error)
      return false
    }
  }

  return { copy, copied }
}
