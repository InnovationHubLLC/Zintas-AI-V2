'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  ArrowLeft,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  LinkIcon,
  Undo,
  Redo,
  Save,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Search,
  FileText,
  Clock,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────

interface ContentPiece {
  id: string
  org_id: string
  client_id: string
  title: string
  body_html: string | null
  body_markdown: string | null
  content_type: string
  status: string
  target_keyword: string | null
  related_keywords: unknown[]
  seo_score: number
  word_count: number
  compliance_status: string
  compliance_details: unknown[]
  meta_title: string | null
  meta_description: string | null
  published_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

interface SeoCheckItem {
  label: string
  passed: boolean
}

// ── Helpers ──────────────────────────────────────────────────────

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return 0
  return text.split(' ').length
}

function readingTime(wordCount: number): string {
  const minutes = Math.ceil(wordCount / 200)
  return `${minutes} min read`
}

function complianceBadge(status: string): {
  icon: typeof CheckCircle
  color: string
  label: string
} {
  if (status === 'pass') return { icon: CheckCircle, color: 'text-green-600', label: 'Pass' }
  if (status === 'warn') return { icon: AlertTriangle, color: 'text-yellow-600', label: 'Warning' }
  return { icon: XCircle, color: 'text-red-600', label: 'Block' }
}

function buildSeoChecklist(
  piece: ContentPiece,
  currentWordCount: number
): SeoCheckItem[] {
  const keyword = piece.target_keyword?.toLowerCase() ?? ''
  const title = piece.title?.toLowerCase() ?? ''
  const html = piece.body_html?.toLowerCase() ?? ''
  const firstParagraph = html.match(/<p[^>]*>(.*?)<\/p>/)?.[1] ?? ''
  const metaTitle = piece.meta_title ?? ''
  const metaDesc = piece.meta_description ?? ''

  return [
    { label: 'Keyword in title', passed: !!keyword && title.includes(keyword) },
    { label: 'Keyword in first paragraph', passed: !!keyword && firstParagraph.includes(keyword) },
    { label: 'Word count ≥ 800', passed: currentWordCount >= 800 },
    { label: 'Meta title (50-70 chars)', passed: metaTitle.length >= 50 && metaTitle.length <= 70 },
    { label: 'Meta description (120-160 chars)', passed: metaDesc.length >= 120 && metaDesc.length <= 160 },
    { label: 'Has H2 headings', passed: html.includes('<h2') },
    { label: 'Has internal links', passed: html.includes('<a ') },
  ]
}

// ── Main Component ───────────────────────────────────────────────

export default function ContentEditorPage({
  params,
}: {
  params: Promise<{ client: string; id: string }>
}): React.ReactElement {
  const { client: clientId, id: contentId } = use(params)
  const router = useRouter()

  const [piece, setPiece] = useState<ContentPiece | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [currentWordCount, setCurrentWordCount] = useState(0)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch content piece
  useEffect(() => {
    async function fetchContent(): Promise<void> {
      try {
        const res = await fetch(`/api/content/${contentId}`)
        if (!res.ok) return
        const data = (await res.json()) as ContentPiece
        setPiece(data)
        setMetaTitle(data.meta_title ?? '')
        setMetaDescription(data.meta_description ?? '')
        setCurrentWordCount(data.word_count)
      } finally {
        setLoading(false)
      }
    }
    void fetchContent()
  }, [contentId])

  // Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your content...' }),
    ],
    content: '',
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      const wc = countWords(html)
      setCurrentWordCount(wc)

      // Debounced auto-save
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        void saveContent(html, wc)
      }, 30000)
    },
  })

  // Set editor content when piece loads
  useEffect(() => {
    if (editor && piece?.body_html) {
      editor.commands.setContent(piece.body_html)
    }
  }, [editor, piece])

  // Save function
  const saveContent = useCallback(
    async (html?: string, wc?: number): Promise<void> => {
      if (!piece) return
      setSaving(true)
      try {
        const bodyHtml = html ?? editor?.getHTML() ?? ''
        const wordCount = wc ?? countWords(bodyHtml)
        await fetch(`/api/content/${contentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body_html: bodyHtml,
            meta_title: metaTitle,
            meta_description: metaDescription,
            word_count: wordCount,
          }),
        })
        setLastSaved(new Date())
      } finally {
        setSaving(false)
      }
    },
    [piece, editor, contentId, metaTitle, metaDescription]
  )

  // Approve & Publish
  const handleApprovePublish = useCallback(async (): Promise<void> => {
    if (!piece) return
    if (!confirm('Publish this content to WordPress?')) return

    try {
      // First save current content
      await saveContent()

      // Then approve via queue if there's an associated action,
      // or publish directly
      await fetch(`/api/content/${contentId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishedUrl: `https://${piece.client_id}/blog`,
        }),
      })

      router.push(`/dashboard/${clientId}`)
    } catch {
      // publish failed
    }
  }, [piece, contentId, clientId, router, saveContent])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!piece) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Content not found</p>
      </div>
    )
  }

  const badge = complianceBadge(piece.compliance_status)
  const BadgeIcon = badge.icon
  const seoChecklist = buildSeoChecklist(piece, currentWordCount)
  const seoPassCount = seoChecklist.filter((c) => c.passed).length

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${clientId}`}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold truncate max-w-md">
            {piece.title}
          </h1>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
            {piece.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {lastSaved && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {saving && <span className="text-blue-500">Saving...</span>}
        </div>
      </header>

      {/* Three-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL - Content Brief */}
        <aside className="w-[280px] bg-gray-50 border-r overflow-y-auto p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content Brief
          </h2>

          {/* Target Keyword */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
              Target Keyword
            </h3>
            <p className="text-sm font-medium">
              {piece.target_keyword ?? 'Not set'}
            </p>
          </section>

          {/* Related Keywords */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
              Related Keywords
            </h3>
            <div className="flex flex-wrap gap-1">
              {(piece.related_keywords as string[]).map((kw, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"
                >
                  {kw}
                </span>
              ))}
              {piece.related_keywords.length === 0 && (
                <span className="text-xs text-gray-400">None</span>
              )}
            </div>
          </section>

          {/* Compliance */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
              Compliance
            </h3>
            <div className={`flex items-center gap-1 text-sm ${badge.color}`}>
              <BadgeIcon className="h-4 w-4" />
              {badge.label}
            </div>
            {piece.compliance_status !== 'pass' && (
              <ul className="mt-1 space-y-1">
                {(piece.compliance_details as { rule?: string; detail?: string }[]).map(
                  (d, i) => (
                    <li key={i} className="text-xs text-red-600">
                      {d.detail ?? d.rule ?? 'Issue flagged'}
                    </li>
                  )
                )}
              </ul>
            )}
          </section>

          {/* Content Stats */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
              Stats
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                Words: <span className="font-medium">{currentWordCount}</span>
              </p>
              <p>
                Reading time:{' '}
                <span className="font-medium">
                  {readingTime(currentWordCount)}
                </span>
              </p>
              <p>
                Type:{' '}
                <span className="font-medium">{piece.content_type}</span>
              </p>
            </div>
          </section>
        </aside>

        {/* CENTER PANEL - Editor */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-4 py-2 border-b bg-gray-50">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded hover:bg-gray-200 ${
                editor?.isActive('bold') ? 'bg-gray-200' : ''
              }`}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded hover:bg-gray-200 ${
                editor?.isActive('italic') ? 'bg-gray-200' : ''
              }`}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={`p-1.5 rounded hover:bg-gray-200 ${
                editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
              }`}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={`p-1.5 rounded hover:bg-gray-200 ${
                editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
              }`}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().toggleBulletList().run()
              }
              className={`p-1.5 rounded hover:bg-gray-200 ${
                editor?.isActive('bulletList') ? 'bg-gray-200' : ''
              }`}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().toggleOrderedList().run()
              }
              className={`p-1.5 rounded hover:bg-gray-200 ${
                editor?.isActive('orderedList') ? 'bg-gray-200' : ''
              }`}
              title="Ordered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => {
                const url = window.prompt('Enter URL:')
                if (url) {
                  editor?.chain().focus().setLink({ href: url }).run()
                }
              }}
              className={`p-1.5 rounded hover:bg-gray-200 ${
                editor?.isActive('link') ? 'bg-gray-200' : ''
              }`}
              title="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => editor?.chain().focus().undo().run()}
              className="p-1.5 rounded hover:bg-gray-200"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().redo().run()}
              className="p-1.5 rounded hover:bg-gray-200"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>

            <div className="flex-1" />

            {/* Word count in toolbar */}
            <span className="text-xs text-gray-500">
              {currentWordCount} words &middot; {readingTime(currentWordCount)}
            </span>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none min-h-[400px] focus:outline-none"
            />
          </div>

          {/* Meta Fields - Bottom */}
          <div className="border-t p-4 bg-gray-50 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Search className="h-4 w-4" />
              SERP Preview
            </h3>

            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Meta Title ({metaTitle.length}/70)
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={70}
                  className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Meta title..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Meta Description ({metaDescription.length}/160)
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={160}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Meta description..."
                />
              </div>

              {/* SERP Preview Card */}
              <div className="bg-white rounded border p-3">
                <p className="text-blue-700 text-base truncate">
                  {metaTitle || piece.title}
                </p>
                <p className="text-green-700 text-xs truncate">
                  {piece.published_url ?? `https://example.com/blog/${piece.target_keyword?.toLowerCase().replace(/\s+/g, '-') ?? 'post'}`}
                </p>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {metaDescription || 'Add a meta description to preview here...'}
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL - SEO Score */}
        <aside className="w-[260px] bg-gray-50 border-l overflow-y-auto p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            SEO Score
          </h2>

          {/* Score Gauge */}
          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full border-4 ${
                piece.seo_score >= 80
                  ? 'border-green-500 text-green-700'
                  : piece.seo_score >= 60
                    ? 'border-yellow-500 text-yellow-700'
                    : 'border-red-500 text-red-700'
              }`}
            >
              <span className="text-2xl font-bold">{piece.seo_score}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">out of 100</p>
          </div>

          {/* Checklist */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Checklist ({seoPassCount}/{seoChecklist.length})
            </h3>
            <ul className="space-y-1.5">
              {seoChecklist.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-xs"
                >
                  {item.passed ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  )}
                  <span className={item.passed ? 'text-gray-600' : 'text-gray-800'}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Compliance Warnings */}
          {piece.compliance_details.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">
                Compliance Issues
              </h3>
              <ul className="space-y-1.5">
                {(piece.compliance_details as { rule?: string; detail?: string; suggestion?: string }[]).map(
                  (d, i) => (
                    <li
                      key={i}
                      className="text-xs p-2 rounded bg-red-50 border border-red-100"
                    >
                      <p className="font-medium text-red-700">
                        {d.rule ?? 'Issue'}
                      </p>
                      {d.suggestion && (
                        <p className="text-red-600 mt-0.5">{d.suggestion}</p>
                      )}
                    </li>
                  )
                )}
              </ul>
            </section>
          )}

          {/* Word Count / Stats */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
              Content Stats
            </h3>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p>word_count: {currentWordCount}</p>
              <p>seo_score: {piece.seo_score}/100</p>
              <p>compliance_status: {piece.compliance_status}</p>
            </div>
          </section>
        </aside>
      </div>

      {/* Action Bar */}
      <footer className="flex items-center justify-end gap-3 px-4 py-3 bg-white border-t">
        <button
          type="button"
          onClick={() => void saveContent()}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Save Draft
        </button>
        <button
          type="button"
          onClick={() => void handleApprovePublish()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4" />
          Approve &amp; Publish
        </button>
      </footer>
    </div>
  )
}
