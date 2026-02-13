'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Save,
  Plus,
  Trash2,
  X,
  User,
  Stethoscope,
  MapPin,
  Link2,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import { ApiError } from '@/app/components/api-error'
import { useToast } from '@/app/components/toast'

// ── Types ────────────────────────────────────────────────────────

type TabType = 'profile' | 'doctors' | 'services' | 'locations' | 'connected'

interface Doctor {
  name: string
  title: string
  specialization: string[]
  npi: string
  bio: string
}

interface Location {
  address: string
  phone: string
  hours: Record<string, string>
  primary: boolean
}

interface ConnectedAccounts {
  google: { gsc: boolean; ga: boolean; gbp: boolean; lastSync: string | null }
  cms: { connected: boolean; type: string | null; lastSync: string | null }
}

interface ProfileData {
  id: string
  name: string
  domain: string
  vertical: string
  description: string
  doctors: Doctor[]
  services: string[]
  locations: Location[]
  connectedAccounts: ConnectedAccounts
}

// ── Zod Schemas ──────────────────────────────────────────────────

const ProfileFormSchema = z.object({
  name: z.string().min(1, 'Practice name is required'),
  vertical: z.string().min(1),
  description: z.string(),
})

const DoctorFormSchema = z.object({
  doctors: z.array(
    z.object({
      name: z.string().min(1, 'Doctor name is required'),
      title: z.string().min(1, 'Title is required'),
      specialization: z.array(z.string()),
      npi: z.string(),
      bio: z.string(),
    })
  ),
})

const LocationFormSchema = z.object({
  locations: z.array(
    z.object({
      address: z.string().min(1, 'Address is required'),
      phone: z.string(),
      hours: z.record(z.string()),
      primary: z.boolean(),
    })
  ),
})

type ProfileFormData = z.infer<typeof ProfileFormSchema>
type DoctorFormData = z.infer<typeof DoctorFormSchema>
type LocationFormData = z.infer<typeof LocationFormSchema>

// ── Constants ────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const SERVICE_CATEGORIES: Record<string, string[]> = {
  General: ['Cleanings', 'Fillings', 'Crowns', 'Root Canals', 'Extractions'],
  Cosmetic: ['Teeth Whitening', 'Veneers', 'Bonding', 'Smile Makeover'],
  Orthodontics: ['Braces', 'Invisalign', 'Retainers', 'Clear Aligners'],
  Surgical: ['Dental Implants', 'Bone Grafting', 'Wisdom Teeth', 'Jaw Surgery'],
  Pediatric: ['Sealants', 'Fluoride Treatment', 'Space Maintainers', 'Pediatric Crowns'],
  Emergency: ['Emergency Repair', 'Pain Relief', 'Abscess Treatment', 'Trauma Care'],
}

const SPECIALIZATIONS = [
  'General Dentistry',
  'Cosmetic Dentistry',
  'Orthodontics',
  'Periodontics',
  'Endodontics',
  'Oral Surgery',
  'Pediatric Dentistry',
  'Prosthodontics',
]

const VERTICALS = ['dental', 'medical', 'veterinary', 'chiropractic'] as const

// ── Skeleton ─────────────────────────────────────────────────────

function SettingsSkeleton(): React.ReactElement {
  return (
    <div className="grid lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-full h-10 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="lg:col-span-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 animate-pulse space-y-6">
          <div className="w-48 h-8 bg-gray-200 rounded" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-full h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────

export default function PracticeSettings(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState<number | 'network' | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [customServiceInput, setCustomServiceInput] = useState('')
  const { toast } = useToast()

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: { name: '', vertical: 'dental', description: '' },
  })

  // Doctors form
  const doctorForm = useForm<DoctorFormData>({
    resolver: zodResolver(DoctorFormSchema),
    defaultValues: { doctors: [] },
  })
  const { fields: doctorFields, append: appendDoctor, remove: removeDoctor } = useFieldArray({
    control: doctorForm.control,
    name: 'doctors',
  })

  // Locations form
  const locationForm = useForm<LocationFormData>({
    resolver: zodResolver(LocationFormSchema),
    defaultValues: { locations: [] },
  })
  const { fields: locationFields, append: appendLocation, remove: removeLocation } = useFieldArray({
    control: locationForm.control,
    name: 'locations',
  })

  // ── Fetch data ─────────────────────────────────
  useEffect(() => {
    async function fetchProfile(): Promise<void> {
      try {
        const response = await fetch('/api/practice/profile')
        if (!response.ok) {
          setFetchError(response.status)
          return
        }
        const data: ProfileData = await response.json()
        setProfileData(data)
        setFetchError(null)

        profileForm.reset({
          name: data.name,
          vertical: data.vertical,
          description: data.description,
        })
        doctorForm.reset({
          doctors: data.doctors.map((d) => ({
            name: d.name,
            title: d.title,
            specialization: d.specialization ?? [],
            npi: d.npi ?? '',
            bio: d.bio ?? '',
          })),
        })
        locationForm.reset({
          locations: data.locations.map((l) => ({
            address: l.address,
            phone: l.phone ?? '',
            hours: l.hours ?? {},
            primary: l.primary ?? false,
          })),
        })
        setSelectedServices(new Set(data.services))
      } catch {
        setFetchError('network')
      } finally {
        setLoading(false)
      }
    }
    void fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Save handlers ──────────────────────────────
  async function saveProfile(data: ProfileFormData): Promise<void> {
    setSaving(true)
    try {
      const response = await fetch('/api/practice/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          vertical: data.vertical,
          description: data.description,
        }),
      })
      if (response.ok) {
        toast('success', 'Profile updated successfully.')
      } else {
        toast('error', 'Failed to save profile.')
      }
    } catch {
      toast('error', 'Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function saveDoctors(data: DoctorFormData): Promise<void> {
    setSaving(true)
    try {
      const response = await fetch('/api/practice/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctors: data.doctors }),
      })
      if (response.ok) {
        toast('success', 'Doctors updated successfully.')
      } else {
        toast('error', 'Failed to save doctors.')
      }
    } catch {
      toast('error', 'Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function saveServices(): Promise<void> {
    setSaving(true)
    try {
      const response = await fetch('/api/practice/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: Array.from(selectedServices) }),
      })
      if (response.ok) {
        toast('success', 'Services updated successfully.')
      } else {
        toast('error', 'Failed to save services.')
      }
    } catch {
      toast('error', 'Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function saveLocations(data: LocationFormData): Promise<void> {
    setSaving(true)
    try {
      const response = await fetch('/api/practice/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: data.locations }),
      })
      if (response.ok) {
        toast('success', 'Locations updated successfully.')
      } else {
        toast('error', 'Failed to save locations.')
      }
    } catch {
      toast('error', 'Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function toggleService(service: string): void {
    setSelectedServices((prev) => {
      const next = new Set(prev)
      if (next.has(service)) next.delete(service)
      else next.add(service)
      return next
    })
  }

  function addCustomService(): void {
    const trimmed = customServiceInput.trim()
    if (!trimmed) return
    if (selectedServices.has(trimmed)) {
      toast('info', 'Service already added.')
      setCustomServiceInput('')
      return
    }
    setSelectedServices((prev) => new Set([...prev, trimmed]))
    setCustomServiceInput('')
  }

  function removeCustomService(service: string): void {
    setSelectedServices((prev) => {
      const next = new Set(prev)
      next.delete(service)
      return next
    })
  }

  function addDoctor(): void {
    appendDoctor({ name: '', title: '', specialization: [], npi: '', bio: '' })
  }

  function addLocation(): void {
    appendLocation({ address: '', phone: '', hours: {}, primary: false })
  }

  const tabs: { id: TabType; label: string; icon: LucideIcon }[] = [
    { id: 'profile', label: 'Practice Profile', icon: User },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'services', label: 'Services', icon: ClipboardList },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'connected', label: 'Connected Accounts', icon: Link2 },
  ]

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your practice information and preferences.</p>
        </div>
        <SettingsSkeleton />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your practice information and preferences.</p>
        </div>
        <ApiError status={fetchError} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your practice information and preferences.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            {/* ── Tab 1: Practice Profile ─────────── */}
            {activeTab === 'profile' && (
              <form onSubmit={(e) => void profileForm.handleSubmit(saveProfile)(e)} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Practice Profile</h2>
                  <p className="text-gray-600">Update your practice information.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Practice Name</label>
                    <input
                      {...profileForm.register('name')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Website URL</label>
                    <input
                      value={profileData?.domain ?? ''}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Vertical</label>
                    <select
                      {...profileForm.register('vertical')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {VERTICALS.map((v) => (
                        <option key={v} value={v}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                    <textarea
                      {...profileForm.register('description')}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Describe your practice..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── Tab 2: Doctors ──────────────────── */}
            {activeTab === 'doctors' && (
              <form onSubmit={(e) => void doctorForm.handleSubmit(saveDoctors)(e)} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctors</h2>
                    <p className="text-gray-600">Manage your practice&apos;s dental professionals.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addDoctor}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Doctor</span>
                  </button>
                </div>

                {doctorFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No doctors added yet. Click &quot;Add Doctor&quot; to get started.</p>
                  </div>
                )}

                <div className="space-y-6">
                  {doctorFields.map((field, index) => (
                    <div key={field.id} className="p-6 border border-gray-200 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Doctor {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeDoctor(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Doctor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            {...doctorForm.register(`doctors.${index}.name`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Dr. Jane Smith"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            {...doctorForm.register(`doctors.${index}.title`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="DDS, FAGD"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                        <div className="flex flex-wrap gap-2">
                          {SPECIALIZATIONS.map((spec) => {
                            const current = doctorForm.watch(`doctors.${index}.specialization`) ?? []
                            const isSelected = current.includes(spec)
                            return (
                              <button
                                key={spec}
                                type="button"
                                onClick={() => {
                                  const updated = isSelected
                                    ? current.filter((s: string) => s !== spec)
                                    : [...current, spec]
                                  doctorForm.setValue(`doctors.${index}.specialization`, updated)
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                }`}
                              >
                                {spec}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">NPI Number</label>
                          <input
                            {...doctorForm.register(`doctors.${index}.npi`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="1234567890"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                          {...doctorForm.register(`doctors.${index}.bio`)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Brief biography..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : 'Save Doctors'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── Tab 3: Services ─────────────────── */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Services</h2>
                  <p className="text-gray-600">Select the services your practice offers.</p>
                </div>

                <div className="space-y-6">
                  {Object.entries(SERVICE_CATEGORIES).map(([category, services]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{category}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {services.map((service) => (
                          <label
                            key={service}
                            className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedServices.has(service)}
                              onChange={() => toggleService(service)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Custom Service Input */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Services</h3>
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={customServiceInput}
                        onChange={(e) => setCustomServiceInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomService() } }}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add a custom service..."
                      />
                      <button
                        type="button"
                        onClick={addCustomService}
                        className="flex items-center space-x-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                    {/* Custom service chips */}
                    {(() => {
                      const allPredefined = new Set(Object.values(SERVICE_CATEGORIES).flat())
                      const customServices = Array.from(selectedServices).filter((s) => !allPredefined.has(s))
                      if (customServices.length === 0) return null
                      return (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {customServices.map((service) => (
                            <span
                              key={service}
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                            >
                              <span>{service}</span>
                              <button
                                type="button"
                                onClick={() => removeCustomService(service)}
                                className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={() => void saveServices()}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : 'Save Services'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Tab 4: Locations ────────────────── */}
            {activeTab === 'locations' && (
              <form onSubmit={(e) => void locationForm.handleSubmit(saveLocations)(e)} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Locations</h2>
                    <p className="text-gray-600">Manage your practice locations and hours.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addLocation}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Location</span>
                  </button>
                </div>

                {locationFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No locations added yet. Click &quot;Add Location&quot; to get started.</p>
                  </div>
                )}

                <div className="space-y-6">
                  {locationFields.map((field, index) => (
                    <div key={field.id} className="p-6 border border-gray-200 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">Location {index + 1}</h3>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="primaryLocation"
                              checked={locationForm.watch(`locations.${index}.primary`)}
                              onChange={() => {
                                locationFields.forEach((_, i) => {
                                  locationForm.setValue(`locations.${i}.primary`, i === index)
                                })
                              }}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-medium text-gray-600">Primary</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLocation(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Location"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <input
                            {...locationForm.register(`locations.${index}.address`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="123 Main St, City, State ZIP"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            {...locationForm.register(`locations.${index}.phone`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>

                      {/* Hours Grid */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
                        <div className="space-y-2">
                          {DAYS.map((day) => (
                            <div key={day} className="flex items-center space-x-3">
                              <span className="w-10 text-sm font-medium text-gray-600">{day}</span>
                              <input
                                value={locationForm.watch(`locations.${index}.hours.${day}`) ?? ''}
                                onChange={(e) =>
                                  locationForm.setValue(
                                    `locations.${index}.hours.${day}`,
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="9:00 AM - 5:00 PM"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : 'Save Locations'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── Tab 5: Connected Accounts ───────── */}
            {activeTab === 'connected' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Connected Accounts</h2>
                  <p className="text-gray-600">Manage your Google and CMS integrations.</p>
                </div>

                {/* Google Services */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Google Services</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Google Search Console (GSC)', key: 'gsc' as const },
                      { label: 'Google Analytics (GA)', key: 'ga' as const },
                      { label: 'Google Business Profile (GBP)', key: 'gbp' as const },
                    ].map((service) => {
                      const isConnected = profileData?.connectedAccounts.google[service.key] ?? false
                      return (
                        <div
                          key={service.key}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                isConnected ? 'bg-green-500' : 'bg-orange-400'
                              }`}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{service.label}</p>
                              <p className="text-xs text-gray-500">
                                {isConnected ? 'Connected' : 'Disconnected'}
                                {isConnected &&
                                  profileData?.connectedAccounts.google.lastSync &&
                                  ` · Last sync: ${new Date(profileData.connectedAccounts.google.lastSync).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          {!isConnected && (
                            <button
                              onClick={() => {
                                toast('info', 'Redirecting to Google setup flow...')
                                window.location.href = '/onboarding/start?step=3'
                              }}
                              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                            >
                              Reconnect
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* CMS */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">CMS Integration</h3>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          profileData?.connectedAccounts.cms.connected ? 'bg-green-500' : 'bg-orange-400'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          CMS {profileData?.connectedAccounts.cms.type ? `(${profileData.connectedAccounts.cms.type})` : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {profileData?.connectedAccounts.cms.connected ? 'Connected' : 'Disconnected'}
                          {profileData?.connectedAccounts.cms.lastSync &&
                            ` · Last sync: ${new Date(profileData.connectedAccounts.cms.lastSync).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    {!profileData?.connectedAccounts.cms.connected && (
                      <button
                        onClick={() => toast('info', 'CMS reconnection coming soon.')}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        Reconnect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
