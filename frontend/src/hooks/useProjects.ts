import { useCallback, useEffect, useState } from 'react'

import { fetchProject, fetchProjects, type Project, type ProjectDetail } from '../services/api'

interface ToastState {
  message: string
  type: 'success' | 'error'
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ProjectDetail | null>(null)
  const [openingId, setOpeningId] = useState<number | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProjects(await fetchProjects())
    } catch (err) {
      setProjects([])
      setError(err instanceof Error ? err.message : '프로젝트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openProject = useCallback(async (id: number) => {
    setOpeningId(id)
    try {
      setSelected(await fetchProject(id))
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '프로젝트를 불러오지 못했습니다.',
        type: 'error',
      })
    } finally {
      setOpeningId(null)
    }
  }, [])

  const closeProject = useCallback(() => setSelected(null), [])
  const clearToast = useCallback(() => setToast(null), [])

  return {
    projects,
    loading,
    error,
    selected,
    openingId,
    toast,
    reload: load,
    openProject,
    closeProject,
    clearToast,
  }
}
