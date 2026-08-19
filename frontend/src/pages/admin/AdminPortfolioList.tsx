import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Toast from '../../components/ui/Toast'
import { CATEGORY_LABELS } from '../../services/api'
import { deleteAdminProject, fetchAdminProjects, type AdminProject } from '../../services/adminApi'

export default function AdminPortfolioList() {
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setProjects(await fetchAdminProjects())
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const onDelete = async (project: AdminProject) => {
    if (!window.confirm(`「${project.title}」 프로젝트를 삭제할까요? 첨부된 이미지도 함께 삭제됩니다.`)) {
      return
    }
    try {
      await deleteAdminProject(project.id)
      setProjects((current) => current.filter((item) => item.id !== project.id))
      setToast({ message: '프로젝트를 삭제했습니다.', type: 'success' })
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '삭제에 실패했습니다.',
        type: 'error',
      })
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>포트폴리오</h1>
          <p>프로젝트를 추가하고, 이미지는 기존 목록 뒤에 순서대로 붙습니다.</p>
        </div>
        <Link to="/admin/portfolio/new">
          <Button type="button">새 프로젝트</Button>
        </Link>
      </header>

      {loading ? (
        <p className="admin-muted">불러오는 중…</p>
      ) : error ? (
        <div className="admin-empty">
          <p>{error}</p>
          <Button type="button" onClick={() => void load()}>
            다시 시도
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="admin-empty">
          <p>등록된 프로젝트가 없습니다.</p>
          <Link to="/admin/portfolio/new">
            <Button type="button">첫 프로젝트 만들기</Button>
          </Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>대표</th>
                <th>제목</th>
                <th>카테고리</th>
                <th>이미지</th>
                <th>순서</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    {project.thumbnail_url ? (
                      <img src={project.thumbnail_url} alt="" className="admin-thumb" />
                    ) : (
                      <span className="admin-thumb admin-thumb--empty" />
                    )}
                  </td>
                  <td>
                    <strong>{project.title}</strong>
                    {project.is_featured && <span className="admin-badge">추천</span>}
                  </td>
                  <td>{CATEGORY_LABELS[project.category] || project.category}</td>
                  <td>{project.image_count}</td>
                  <td>{project.sort_order}</td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/portfolio/${project.id}`}>수정</Link>
                    <button type="button" className="admin-link-danger" onClick={() => void onDelete(project)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </section>
  )
}
