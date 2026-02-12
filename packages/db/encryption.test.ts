import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Valid 32-byte hex key (64 hex chars) for testing
const TEST_ENCRYPTION_KEY = 'a'.repeat(64)

describe('TASK-06: Encryption Utility', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY
  })

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY
  })

  describe('encrypt / decrypt round-trip', () => {
    it('should decrypt to the original data after encrypting', async () => {
      const { encrypt, decrypt } = await import('./encryption')
      const original = { name: 'Test Practice', score: 42 }
      const encrypted = encrypt(original)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toEqual(original)
    })

    it('should handle nested objects', async () => {
      const { encrypt, decrypt } = await import('./encryption')
      const original = {
        practice: {
          name: 'Smile Dental',
          address: {
            street: '123 Main St',
            city: 'Austin',
            state: 'TX',
          },
        },
        scores: [10, 20, 30],
      }
      const encrypted = encrypt(original)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toEqual(original)
    })

    it('should handle special characters in values', async () => {
      const { encrypt, decrypt } = await import('./encryption')
      const original = {
        name: "Dr. O'Malley & Partners",
        emoji: '\u{1F601}\u{1F60D}',
        unicode: '\u00E9\u00E8\u00EA\u00EB',
        html: '<script>alert("xss")</script>',
      }
      const encrypted = encrypt(original)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toEqual(original)
    })
  })

  describe('random IV', () => {
    it('should produce different ciphertexts for the same input', async () => {
      const { encrypt } = await import('./encryption')
      const data = { token: 'same-value' }
      const encrypted1 = encrypt(data)
      const encrypted2 = encrypt(data)
      expect(encrypted1).not.toBe(encrypted2)
    })
  })

  describe('tamper detection', () => {
    it('should throw when ciphertext is tampered with', async () => {
      const { encrypt, decrypt } = await import('./encryption')
      const encrypted = encrypt({ secret: 'value' })

      const parts = encrypted.split(':')
      const tampered = parts[2]
      const flippedChar = tampered[0] === 'A' ? 'B' : 'A'
      parts[2] = flippedChar + tampered.slice(1)
      const tamperedString = parts.join(':')

      expect(() => decrypt(tamperedString)).toThrow()
    })
  })

  describe('missing ENCRYPTION_KEY', () => {
    it('should throw a clear error when ENCRYPTION_KEY is not set', async () => {
      delete process.env.ENCRYPTION_KEY
      const { encrypt } = await import('./encryption')
      expect(() => encrypt({ test: 'data' })).toThrow('ENCRYPTION_KEY')
    })
  })

  describe('encryptTokens / decryptTokens', () => {
    it('should round-trip GoogleTokens correctly', async () => {
      const { encryptTokens, decryptTokens } = await import('./encryption')
      const tokens = {
        access_token: 'ya29.a0AfH6SMA...',
        refresh_token: '1//0dx...',
        expiry_date: 1700000000000,
        scope: 'https://www.googleapis.com/auth/business.manage',
      }
      const encrypted = encryptTokens(tokens)
      const decrypted = decryptTokens(encrypted)
      expect(decrypted).toEqual(tokens)
    })
  })
})
