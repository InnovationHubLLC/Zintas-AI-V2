import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'

interface GoogleTokens {
  access_token: string
  refresh_token: string
  expiry_date: number
  scope: string
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex) {
    throw new Error(
      'Missing required environment variable: ENCRYPTION_KEY. ' +
        'Must be a 32-byte hex string (64 hex characters).'
    )
  }
  return Buffer.from(keyHex, 'hex')
}

function encrypt(data: Record<string, unknown>): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  const plaintext = JSON.stringify(data)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':')
}

function decrypt(encrypted: string): Record<string, unknown> {
  const key = getEncryptionKey()
  const parts = encrypted.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format. Expected iv:authTag:ciphertext.')
  }

  const iv = Buffer.from(parts[0], 'base64')
  const authTag = Buffer.from(parts[1], 'base64')
  const ciphertext = Buffer.from(parts[2], 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return JSON.parse(decrypted.toString('utf8')) as Record<string, unknown>
}

function encryptTokens(tokens: GoogleTokens): string {
  return encrypt(tokens as unknown as Record<string, unknown>)
}

function decryptTokens(encrypted: string): GoogleTokens {
  return decrypt(encrypted) as unknown as GoogleTokens
}

export { encrypt, decrypt, encryptTokens, decryptTokens }
export type { GoogleTokens }
