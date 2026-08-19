import { exec } from 'child_process'

const url = 'http://localhost:5173'

const cmd =
  process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`

exec(cmd, (err) => {
  if (err) console.error('브라우저를 열 수 없습니다:', err.message)
  else console.log(`🌐 브라우저 열기: ${url}`)
})
