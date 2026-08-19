import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const backend = path.join(root, 'backend')

const python =
  process.platform === 'win32'
    ? path.join(backend, 'venv', 'Scripts', 'python.exe')
    : path.join(backend, 'venv', 'bin', 'python')

const proc = spawn(python, ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'], {
  cwd: backend,
  stdio: 'inherit',
})

proc.on('exit', (code) => process.exit(code ?? 0))
