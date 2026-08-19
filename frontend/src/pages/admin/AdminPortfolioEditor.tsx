import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Toast from '../../components/ui/Toast'
import {
  createAdminProject,
  deleteAdminImage,
  fetchAdminProject,
  setAdminThumbnail,
  updateAdminProject,
  uploadAdminImages,
  type AdminProjectDetail,
  type AdminProjectPayload,
} from '../../services/adminApi'

const CATEGORIES = [
  { value: 'drawing', label: '도면 작성' },
  { value: '3d', label: '3D 디자인' },
  { value: 'integrated', label: '통합 패키지' },
] as const

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  category: 'integrated' as AdminProjectPayload['category'],
  tagsText: '',
  is_featured: false,
  sort_order: '',
}

export default function AdminPortfolioEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const projectId = id ? Number(id) : null

  const [form, setForm] = useState(emptyForm)
  const [project, setProject] = useState<AdminProjectDetail | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const nextOrder = useMemo(() => {
    if (!project?.images.length) return 1
    return Math.max(...project.images.map((image) => image.sort_order)) + 1
  }, [project])

  const load = async (targetId: number) => {
    setLoading(true)
    setError('')
    try {
      const detail = await fetchAdminProject(targetId)
      setProject(detail)
      setForm({
        title: detail.title,
        slug: detail.slug,
        description: detail.description,
        category: detail.category as AdminProjectPayload['category'],
        tagsText: detail.tags.join(', '),
        is_featured: detail.is_featured,
        sort_order: String(detail.sort_order),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId && Number.isFinite(projectId)) {
      void load(projectId)
    } else {
      setForm(emptyForm)
      setProject(null)
      setPendingFiles([])
    }
  }, [projectId])

  const payload = (): AdminProjectPayload => {
    const sort = form.sort_order.trim()
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      tags: form.tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      is_featured: form.is_featured,
      sort_order: sort && Number.isFinite(Number(sort)) ? Number(sort) : undefined,
      slug: isNew ? form.slug.trim() || null : undefined,
    }
  }

  const onSave = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (isNew) {
        const created = await createAdminProject(payload())
        const filesToUpload = pendingFiles
        setPendingFiles([])
        if (filesToUpload.length) {
          await uploadAdminImages(created.id, filesToUpload)
        }
        navigate(`/admin/portfolio/${created.id}`, { replace: true })
      } else if (projectId) {
        const updated = await updateAdminProject(projectId, payload())
        setProject(updated)
        setToast({ message: '프로젝트 정보를 저장했습니다.', type: 'success' })
      }
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '저장에 실패했습니다.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const onUpload = async () => {
    if (!projectId || pendingFiles.length === 0) return
    setUploading(true)
    try {
      const updated = await uploadAdminImages(projectId, pendingFiles)
      setProject(updated)
      setPendingFiles([])
      setToast({
        message: `이미지를 ${pendingFiles.length}장 추가했습니다. 순서 ${nextOrder}부터 이어집니다.`,
        type: 'success',
      })
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '업로드에 실패했습니다.',
        type: 'error',
      })
    } finally {
      setUploading(false)
    }
  }

  const onDeleteImage = async (imageId: number) => {
    if (!projectId || !window.confirm('이 이미지를 삭제할까요?')) return
    try {
      setProject(await deleteAdminImage(projectId, imageId))
      setToast({ message: '이미지를 삭제했습니다.', type: 'success' })
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '이미지 삭제에 실패했습니다.',
        type: 'error',
      })
    }
  }

  const onSetThumbnail = async (imageId: number) => {
    if (!projectId) return
    try {
      setProject(await setAdminThumbnail(projectId, imageId))
      setToast({ message: '대표 이미지를 변경했습니다.', type: 'success' })
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '대표 이미지 변경에 실패했습니다.',
        type: 'error',
      })
    }
  }

  if (loading) {
    return <p className="admin-muted">불러오는 중…</p>
  }

  if (error) {
    return (
      <div className="admin-empty">
        <p>{error}</p>
        <Link to="/admin/portfolio">
          <Button type="button" variant="secondary">
            목록으로
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <div>
          <Link to="/admin/portfolio" className="admin-back">
            ← 목록
          </Link>
          <h1>{isNew ? '새 프로젝트' : form.title || '프로젝트 수정'}</h1>
          <p>
            {isNew
              ? '저장한 뒤 이미지를 이어서 첨부할 수 있습니다. 새 이미지는 항상 맨 뒤에 추가됩니다.'
              : `현재 마지막 순서 ${nextOrder - 1 || 0}. 새 이미지는 ${nextOrder}번부터 뒤에 붙습니다.`}
          </p>
        </div>
      </header>

      <form className="admin-form" onSubmit={onSave}>
        <label>
          제목
          <input
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            required
          />
        </label>

        <label>
          슬러그 {isNew ? '(비우면 자동 생성)' : '(변경 불가)'}
          <input
            value={form.slug}
            onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))}
            disabled={!isNew}
            placeholder="예: medical-center"
          />
        </label>

        <label>
          카테고리
          <select
            value={form.category}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                category: e.target.value as AdminProjectPayload['category'],
              }))
            }
          >
            {CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          정렬 순서 (비우면 맨 뒤)
          <input
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) => setForm((current) => ({ ...current, sort_order: e.target.value }))}
          />
        </label>

        <label className="admin-form__full">
          설명
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
            required
          />
        </label>

        <label className="admin-form__full">
          태그 (쉼표로 구분)
          <input
            value={form.tagsText}
            onChange={(e) => setForm((current) => ({ ...current, tagsText: e.target.value }))}
            placeholder="공공시설, 평면도, 3D"
          />
        </label>

        <label className="admin-check">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => setForm((current) => ({ ...current, is_featured: e.target.checked }))}
          />
          추천 프로젝트
        </label>

        <div className="admin-form__actions">
          <Button type="submit" disabled={saving}>
            {saving ? '저장 중…' : isNew ? '프로젝트 등록' : '정보 저장'}
          </Button>
        </div>
      </form>

      <section className="admin-images">
        <h2>이미지</h2>
        <p className="admin-muted">
          선택한 파일은 기존에 첨부된 이미지의 <strong>뒤쪽</strong>으로 순번이 이어집니다. 빈 번호를
          채우지 않습니다.
        </p>

        <div className="admin-upload">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => setPendingFiles(Array.from(e.target.files ?? []))}
          />
          {pendingFiles.length > 0 && (
            <p className="admin-muted">
              {pendingFiles.length}장 선택됨
              {project
                ? ` → 순서 ${nextOrder}~${nextOrder + pendingFiles.length - 1}로 추가`
                : ' (프로젝트 등록 시 함께 업로드)'}
            </p>
          )}
          {project && (
            <Button type="button" onClick={() => void onUpload()} disabled={uploading || pendingFiles.length === 0}>
              {uploading ? '업로드 중…' : '기존 이미지 뒤에 추가'}
            </Button>
          )}
        </div>

        {project && project.images.length > 0 ? (
          <ul className="admin-gallery">
            {project.images.map((image) => {
              const isThumb = image.image_url === project.thumbnail_url
              return (
                <li key={image.id} className={isThumb ? 'is-thumb' : ''}>
                  <span className="admin-gallery__order">{String(image.sort_order).padStart(2, '0')}</span>
                  <img src={image.image_url} alt={image.caption || ''} />
                  <div className="admin-gallery__meta">
                    <span>{image.caption || '캡션 없음'}</span>
                    {isThumb ? (
                      <em>대표 이미지</em>
                    ) : (
                      <button type="button" onClick={() => void onSetThumbnail(image.id)}>
                        대표로 지정
                      </button>
                    )}
                    <button type="button" className="admin-link-danger" onClick={() => void onDeleteImage(image.id)}>
                      삭제
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="admin-muted">아직 첨부된 이미지가 없습니다.</p>
        )}
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </section>
  )
}
