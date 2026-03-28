// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Polyfills for Next.js server-side APIs
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js Request and Response if needed
if (typeof Request === 'undefined') {
  global.Request = class Request {}
}

if (typeof Response === 'undefined') {
  global.Response = class Response {}
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {}
}
