import { parseApiError } from '../utils/validationMessages'

const API_BASE = import.meta.env.VITE_API_URL || ''

export { parseApiError } from '../utils/validationMessages'

export interface Project {
  id: number
  title: string
  description: string
  category: string
  thumbnail_url: string | null
  tags: string[]
  is_featured: boolean
  created_at: string
}

export interface ProjectDetail extends Project {
  images: { id: number; image_url: string; caption: string | null }[]
}

export interface InquiryPayload {
  name: string
  email: string
  phone: string
  project_type: 'drawing' | '3d' | 'integrated' | 'other'
  message: string
}

export const CATEGORY_LABELS: Record<string, string> = {
  drawing: '도면 작성',
  '3d': '3D 디자인',
  integrated: '통합 패키지',
  other: '기타',
}

async function requestJson<T>(url: string, fallback: string, options?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${url}`, options)
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(parseApiError(data, fallback))
  }
  return data as T
}

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  return requestJson('/api/health', '서버 상태를 확인하지 못했습니다.')
}

export async function fetchProjects(): Promise<Project[]> {
  return requestJson<Project[]>('/api/projects', '프로젝트를 불러오지 못했습니다.')
}

export async function fetchProject(id: number): Promise<ProjectDetail> {
  return requestJson<ProjectDetail>(`/api/projects/${id}`, '프로젝트를 불러오지 못했습니다.')
}

export async function submitInquiry(payload: InquiryPayload): Promise<{ message: string }> {
  return requestJson<{ message: string }>(
    '/api/inquiries',
    '문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
}
