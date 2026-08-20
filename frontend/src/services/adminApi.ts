import { parseApiError } from '../utils/validationMessages'

const API_BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'oatstone_admin_token'

export interface AdminProjectImage {
  id: number
  image_url: string
  caption: string | null
  sort_order: number
}

export interface AdminProject {
  id: number
  slug: string
  title: string
  description: string
  category: string
  thumbnail_url: string | null
  tags: string[]
  is_featured: boolean
  sort_order: number
  image_count: number
  created_at: string
  updated_at: string
}

export interface AdminProjectDetail extends AdminProject {
  images: AdminProjectImage[]
}

export interface AdminProjectPayload {
  title: string
  description: string
  category: 'drawing' | '3d' | 'integrated'
  tags: string[]
  is_featured: boolean
  sort_order?: number | null
  slug?: string | null
}

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

async function adminRequest<T>(path: string, fallback: string, options: RequestInit = {}, tokenOverride?: string): Promise<T> {
  const token = tokenOverride ?? getToken()
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.')
  }

  if (res.status === 413) {
    throw new Error('업로드 용량이 너무 큽니다. 이미지를 한 장씩 올리거나 용량을 줄여 주세요.')
  }

  if (res.status === 401) {
    if (token) {
      onUnauthorized?.()
    }
    const data = await res.json().catch(() => null)
    throw new Error(parseApiError(data, '로그인이 필요합니다.'))
  }

  if (res.status === 204) {
    return undefined as T
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(parseApiError(data, fallback))
  }
  return data as T
}

export async function adminLogin(username: string, password: string): Promise<{ access_token: string }> {
  return adminRequest(
    '/api/admin/login',
    '로그인에 실패했습니다.',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    '',
  )
}

export async function fetchAdminMe(token: string): Promise<{ username: string }> {
  return adminRequest('/api/admin/me', '로그인 상태를 확인하지 못했습니다.', {}, token)
}

export async function fetchAdminProjects(): Promise<AdminProject[]> {
  return adminRequest('/api/admin/projects', '프로젝트 목록을 불러오지 못했습니다.')
}

export async function fetchAdminProject(id: number): Promise<AdminProjectDetail> {
  return adminRequest(`/api/admin/projects/${id}`, '프로젝트를 불러오지 못했습니다.')
}

export async function createAdminProject(payload: AdminProjectPayload): Promise<AdminProjectDetail> {
  return adminRequest('/api/admin/projects', '프로젝트를 저장하지 못했습니다.', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateAdminProject(id: number, payload: AdminProjectPayload): Promise<AdminProjectDetail> {
  return adminRequest(`/api/admin/projects/${id}`, '프로젝트를 수정하지 못했습니다.', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminProject(id: number): Promise<void> {
  return adminRequest(`/api/admin/projects/${id}`, '프로젝트를 삭제하지 못했습니다.', {
    method: 'DELETE',
  })
}

async function uploadOneAdminImage(id: number, file: File): Promise<AdminProjectDetail> {
  const body = new FormData()
  body.append('files', file)
  return adminRequest(`/api/admin/projects/${id}/images`, '이미지를 업로드하지 못했습니다.', {
    method: 'POST',
    body,
  })
}

export async function uploadAdminImages(
  id: number,
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ project: AdminProjectDetail; uploaded: number; failed: string[] }> {
  let project: AdminProjectDetail | null = null
  const failed: string[] = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    try {
      project = await uploadOneAdminImage(id, file)
    } catch {
      failed.push(file.name || `파일 ${index + 1}`)
    }
    onProgress?.(index + 1, files.length)
  }

  if (!project) {
    throw new Error('이미지를 업로드하지 못했습니다. jpg, png, webp, gif 파일인지 확인해 주세요.')
  }

  return {
    project,
    uploaded: files.length - failed.length,
    failed,
  }
}

export async function deleteAdminImage(projectId: number, imageId: number): Promise<AdminProjectDetail> {
  return adminRequest(
    `/api/admin/projects/${projectId}/images/${imageId}`,
    '이미지를 삭제하지 못했습니다.',
    { method: 'DELETE' },
  )
}

export async function setAdminThumbnail(projectId: number, imageId: number): Promise<AdminProjectDetail> {
  return adminRequest(`/api/admin/projects/${projectId}/thumbnail`, '대표 이미지를 변경하지 못했습니다.', {
    method: 'PUT',
    body: JSON.stringify({ image_id: imageId }),
  })
}
