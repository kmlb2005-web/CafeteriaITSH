import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library no auto-limpia sin globals de vitest: limpieza explícita
afterEach(() => {
  cleanup()
})
