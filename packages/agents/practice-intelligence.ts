import { ChatAnthropic } from '@langchain/anthropic'
import { getClientById, updateClient } from '@packages/db/queries/clients'
import { supabaseAdmin } from '@packages/db/client'

// ── Types ────────────────────────────────────────────────────────

interface Doctor {
  name: string
  title: string
  specializations: string[]
  npi: string | null
  verified: boolean
}

interface Location {
  address: string
  city: string
  state: string
  zip: string
  phone: string
  isPrimary: boolean
}

interface PracticeProfile {
  name: string
  description: string
  doctors: Doctor[]
  services: string[]
  locations: Location[]
  insuranceNetworks: string[]
  uniqueSellingPoints: string[]
  officeHours: string | null
  awards: string[]
}

interface NPIResult {
  result_count: number
  results?: {
    number?: string
    basic?: {
      first_name?: string
      last_name?: string
    }
  }[]
}

interface ExtractedProfile {
  name?: string
  description?: string
  doctors?: { name: string; title: string; specializations: string[] }[]
  services?: string[]
  locations?: { address: string; city: string; state: string; zip: string; phone: string }[]
  insuranceNetworks?: string[]
  uniqueSellingPoints?: string[]
  officeHours?: string
  awards?: string[]
}

// ── Constants ────────────────────────────────────────────────────

const PAGES_TO_CRAWL = [
  '',
  '/about',
  '/about-us',
  '/services',
  '/our-team',
  '/doctors',
  '/meet-the-team',
]

const NPI_API = 'https://npiregistry.cms.hhs.gov/api'

// ── Main Function ────────────────────────────────────────────────

/**
 * Auto-populate a practice's profile by crawling their website
 * and extracting structured data using Claude.
 */
export async function populatePracticeProfile(
  clientId: string
): Promise<PracticeProfile> {
  const client = await getClientById(clientId)
  if (!client) {
    throw new Error(`Client not found: ${clientId}`)
  }

  const existingProfile = client.practice_profile as Record<string, unknown>
  const domain = client.domain.replace(/\/$/, '')

  // 1. Crawl practice website pages
  const pageTexts = await crawlPages(domain)
  const combinedText = pageTexts.join('\n\n---\n\n')

  if (!combinedText.trim()) {
    // Website unreachable or empty — return existing data
    return buildProfile(existingProfile)
  }

  // 2. Extract structured data using Claude
  const extracted = await extractWithClaude(combinedText, domain)

  // 3. Verify NPI numbers for doctors
  const doctors = await verifyDoctorNPIs(
    extracted.doctors ?? [],
    extracted.locations?.[0]?.state ?? ''
  )

  // 4. Merge with existing profile (don't overwrite manual entries)
  const merged = mergeProfiles(existingProfile, {
    ...extracted,
    doctors: doctors.map((d) => ({
      ...d,
      npi: d.npi,
      verified: d.verified,
    })),
  })

  // 5. Save updated profile
  await updateClient(clientId, {
    practice_profile: merged as unknown as Record<string, unknown>,
  })

  // 6. Create agent action record
  await supabaseAdmin.from('agent_actions').insert({
    org_id: client.org_id,
    client_id: clientId,
    agent: 'conductor',
    action_type: 'profile_update',
    autonomy_tier: 1,
    status: 'deployed',
    severity: 'info',
    description: `Practice Intelligence: auto-populated profile with ${doctors.length} doctors, ${(extracted.services ?? []).length} services, ${(extracted.locations ?? []).length} locations`,
    proposed_data: merged as unknown as Record<string, unknown>,
    rollback_data: existingProfile,
    content_piece_id: null,
    approved_by: null,
    approved_at: null,
    deployed_at: new Date().toISOString(),
  })

  return merged
}

// ── Helpers ──────────────────────────────────────────────────────

async function crawlPages(domain: string): Promise<string[]> {
  const texts: string[] = []

  for (const pagePath of PAGES_TO_CRAWL) {
    const url = `https://${domain}${pagePath}`
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'ZintasBot/1.0 (dental-marketing-platform)' },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) continue

      const html = await response.text()
      const text = stripHtml(html)
      if (text.length > 100) {
        texts.push(`[Page: ${pagePath || '/'}]\n${text.slice(0, 5000)}`)
      }
    } catch {
      // Page unavailable — skip
    }
  }

  return texts
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

async function extractWithClaude(
  text: string,
  domain: string
): Promise<ExtractedProfile> {
  const llm = new ChatAnthropic({
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 2048,
  })

  const prompt = `Analyze this dental practice website content and extract structured information.

Website: ${domain}

Content:
${text.slice(0, 8000)}

Extract and return ONLY valid JSON with this structure:
{
  "name": "Practice Name",
  "description": "Brief description of the practice",
  "doctors": [{"name": "Dr. Full Name", "title": "DDS/DMD", "specializations": ["General Dentistry"]}],
  "services": ["Dental Implants", "Teeth Whitening", ...],
  "locations": [{"address": "123 Main St", "city": "City", "state": "ST", "zip": "12345", "phone": "555-123-4567"}],
  "insuranceNetworks": ["Delta Dental", ...],
  "uniqueSellingPoints": ["25+ years experience", ...],
  "officeHours": "Mon-Fri 8am-5pm" or null,
  "awards": ["Best Dentist 2024", ...]
}

If information is not found, use empty arrays or null. Return ONLY the JSON object.`

  const response = await llm.invoke(prompt)
  const responseText = typeof response.content === 'string'
    ? response.content
    : String(response.content)

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return {}
    return JSON.parse(jsonMatch[0]) as ExtractedProfile
  } catch {
    return {}
  }
}

async function verifyDoctorNPIs(
  doctors: { name: string; title: string; specializations: string[] }[],
  state: string
): Promise<Doctor[]> {
  const verified: Doctor[] = []

  for (const doc of doctors) {
    const parts = doc.name.replace(/^Dr\.?\s*/i, '').split(/\s+/)
    const firstName = parts[0] ?? ''
    const lastName = parts[parts.length - 1] ?? ''

    let npi: string | null = null
    let isVerified = false

    try {
      const params = new URLSearchParams({
        version: '2.1',
        first_name: firstName,
        last_name: lastName,
        enumeration_type: 'NPI-1',
        limit: '5',
      })
      if (state) params.set('state', state)

      const response = await fetch(`${NPI_API}/?${params.toString()}`, {
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = (await response.json()) as NPIResult
        if (data.result_count > 0 && data.results?.[0]?.number) {
          npi = data.results[0].number
          isVerified = true
        }
      }
    } catch {
      // NPI lookup failed — continue without NPI
    }

    verified.push({
      name: doc.name,
      title: doc.title,
      specializations: doc.specializations,
      npi,
      verified: isVerified,
    })
  }

  return verified
}

function mergeProfiles(
  existing: Record<string, unknown>,
  extracted: ExtractedProfile & { doctors?: Doctor[] }
): PracticeProfile {
  // Preserve existing manually-entered data; only fill gaps
  return {
    name: (existing.name as string) || extracted.name || '',
    description: (existing.description as string) || extracted.description || '',
    doctors: (existing.doctors as Doctor[])?.length
      ? (existing.doctors as Doctor[])
      : (extracted.doctors ?? []),
    services: (existing.services as string[])?.length
      ? (existing.services as string[])
      : (extracted.services ?? []),
    locations: (existing.locations as Location[])?.length
      ? (existing.locations as Location[])
      : (extracted.locations ?? []).map((l) => ({ ...l, isPrimary: false })),
    insuranceNetworks: (existing.insuranceNetworks as string[])?.length
      ? (existing.insuranceNetworks as string[])
      : (extracted.insuranceNetworks ?? []),
    uniqueSellingPoints: (existing.uniqueSellingPoints as string[])?.length
      ? (existing.uniqueSellingPoints as string[])
      : (extracted.uniqueSellingPoints ?? []),
    officeHours: (existing.officeHours as string) || extracted.officeHours || null,
    awards: (existing.awards as string[])?.length
      ? (existing.awards as string[])
      : (extracted.awards ?? []),
  }
}

function buildProfile(existing: Record<string, unknown>): PracticeProfile {
  return {
    name: (existing.name as string) || '',
    description: (existing.description as string) || '',
    doctors: (existing.doctors as Doctor[]) || [],
    services: (existing.services as string[]) || [],
    locations: (existing.locations as Location[]) || [],
    insuranceNetworks: (existing.insuranceNetworks as string[]) || [],
    uniqueSellingPoints: (existing.uniqueSellingPoints as string[]) || [],
    officeHours: (existing.officeHours as string) || null,
    awards: (existing.awards as string[]) || [],
  }
}

export type { PracticeProfile, Doctor, Location }
