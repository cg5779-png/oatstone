import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcBase = path.resolve(root, '..', 'project')
const coverBase = path.join(root, 'frontend', 'public', 'assets', 'portfolio-covers')
const destBase = path.join(root, 'frontend', 'public', 'assets', 'portfolio')
const manifestPath = path.join(root, 'frontend', 'src', 'data', 'portfolio-manifest.json')

const SLUG_MAP = {
  A: 'a-public',
  B: 'b-medical',
  C: 'c-office',
  D: 'd-education',
  E: 'e-commercial',
  F: 'f-exhibition',
  G: 'g-exterior',
}

const TITLE_MAP = {
  A: '공공시설',
  B: '의료시설',
  C: '업무시설',
  D: '교육시설',
  E: '상업시설',
  F: '전시기획시설',
  G: '익스테리어',
}

const COVER_IMAGES = {
  C: 'c-office-cover.png',
  D: 'd-education-cover.png',
  E: 'e-commercial-cover.png',
}

if (!existsSync(srcBase)) {
  console.error(`❌ 프로젝트 폴더를 찾을 수 없습니다: ${srcBase}`)
  process.exit(1)
}

if (existsSync(destBase)) {
  rmSync(destBase, { recursive: true, force: true })
}
mkdirSync(destBase, { recursive: true })
mkdirSync(coverBase, { recursive: true })

const folders = readdirSync(srcBase, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()

const manifest = []
let id = 1

for (const folder of folders) {
  const letter = folder.match(/프로젝트([A-G])/)?.[1]
  if (!letter) continue

  const slug = SLUG_MAP[letter]
  const title = TITLE_MAP[letter] ?? folder.replace(/^프로젝트[A-G]-/, '')
  const srcDir = path.join(srcBase, folder)
  const destDir = path.join(destBase, slug)
  mkdirSync(destDir, { recursive: true })

  const images = readdirSync(srcDir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, 'ko'))

  const imageUrls = []
  const coverFile = COVER_IMAGES[letter]
  if (coverFile && existsSync(path.join(coverBase, coverFile))) {
    imageUrls.push(`/assets/portfolio-covers/${coverFile}`)
  }

  images.forEach((file, index) => {
    const ext = path.extname(file).toLowerCase()
    const destName = `${String(index + 1).padStart(3, '0')}${ext}`
    copyFileSync(path.join(srcDir, file), path.join(destDir, destName))
    imageUrls.push(`/assets/portfolio/${slug}/${destName}`)
  })

  manifest.push({ id, slug, title, folder, images: imageUrls, count: imageUrls.length })
  console.log(`✓ ${folder} → ${title} (${imageUrls.length}장)`)
  id++
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
console.log(`\n✅ 포트폴리오 동기화 완료 — ${manifest.length}개 프로젝트, ${manifest.reduce((s, p) => s + p.count, 0)}장`)
