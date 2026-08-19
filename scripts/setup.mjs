import { existsSync } from 'fs'
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const backend = path.join(root, 'backend')
const frontend = path.join(root, 'frontend')
const isWin = process.platform === 'win32'

function run(cmd, args, cwd = root) {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('📦 OATSTONE — 패키지 설치 중...\n')

console.log('→ Root 의존성 설치')
run('npm', ['install'], root)

const venvPython = isWin
  ? path.join(backend, 'venv', 'Scripts', 'python.exe')
  : path.join(backend, 'venv', 'bin', 'python')

if (!existsSync(venvPython)) {
  console.log('→ Python 가상환경 생성')
  run('python', ['-m', 'venv', 'venv'], backend)
}

const pip = isWin
  ? path.join(backend, 'venv', 'Scripts', 'pip.exe')
  : path.join(backend, 'venv', 'bin', 'pip')

console.log('→ Backend 의존성 설치')
run(pip, ['install', '-r', 'requirements.txt'], backend)

console.log('→ Frontend 의존성 설치')
run('npm', ['install'], frontend)

console.log('→ 포트폴리오 이미지 동기화')
run('node', ['scripts/sync-portfolio.mjs'], root)

console.log('\n✅ 모든 패키지 설치 완료\n')
