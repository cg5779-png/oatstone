import manifest from './portfolio-manifest.json'
import type { Project, ProjectDetail } from '../services/api'

const DESCRIPTIONS: Record<string, string> = {
  공공시설: '공공기관 및 공공공간을 위한 도면 작성과 3D 디자인 프로젝트입니다.',
  의료시설: '병원 및 의료시설 공간 설계, 평면도·천정면도·3D 시각화를 제공했습니다.',
  업무시설: '오피스 및 업무공간 환경개선을 위한 통합 설계 프로젝트입니다.',
  교육시설: '대학 및 교육시설 공간 설계, 도면과 3D 렌더링을 제작했습니다.',
  상업시설: '상업공간 및 F&B 시설의 공간 기획과 3D 디자인 프로젝트입니다.',
  전시기획시설: '전시·행사 공간 기획 및 부스·설치물 3D 디자인 프로젝트입니다.',
  익스테리어: '건물 외관 및 익스테리어 디자인, 조감도·투시도를 제작했습니다.',
}

const TAGS: Record<string, string[]> = {
  공공시설: ['공공시설', '평면도', '3D'],
  의료시설: ['의료시설', '천정면도', '3D'],
  업무시설: ['업무시설', '오피스', '3D'],
  교육시설: ['교육시설', '평면도', '투시도'],
  상업시설: ['상업시설', 'F&B', '3D'],
  전시기획시설: ['전시', '기획', '3D'],
  익스테리어: ['익스테리어', '외관', '조감도'],
}

export const PORTFOLIO_PROJECTS: Project[] = manifest.map((item) => ({
  id: item.id,
  title: item.title,
  description: DESCRIPTIONS[item.title] ?? `${item.title} 프로젝트`,
  category: item.title === '익스테리어' ? '3d' : 'integrated',
  thumbnail_url: item.images[0] ?? null,
  tags: TAGS[item.title] ?? [item.title],
  is_featured: item.id <= 4,
  created_at: `2026-0${Math.min(item.id, 9)}-15T10:00:00`,
}))

export function getPortfolioProjectDetail(id: number): ProjectDetail | null {
  const item = manifest.find((p) => p.id === id)
  const base = PORTFOLIO_PROJECTS.find((p) => p.id === id)
  if (!item || !base) return null

  return {
    ...base,
    images: item.images.map((url, index) => ({
      id: index + 1,
      image_url: url,
      caption: `${item.title} ${String(index + 1).padStart(2, '0')}`,
    })),
  }
}

// 하위 호환
export const MOCK_PROJECTS = PORTFOLIO_PROJECTS
export const getMockProjectDetail = getPortfolioProjectDetail
