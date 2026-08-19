import type { Project, ProjectDetail } from '../services/api'
import { PORTFOLIO_PROJECTS, getPortfolioProjectDetail } from './portfolioData'

export async function fetchProjects(): Promise<Project[]> {
  return PORTFOLIO_PROJECTS
}

export async function fetchProject(id: number): Promise<ProjectDetail> {
  const project = getPortfolioProjectDetail(id)
  if (!project) throw new Error('프로젝트를 불러오지 못했습니다.')
  return project
}
