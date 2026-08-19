const FIELD_LABELS: Record<string, string> = {
  name: '이름',
  email: '이메일',
  phone: '연락처',
  project_type: '프로젝트 유형',
  message: '메시지',
  title: '제목',
  description: '설명',
  category: '카테고리',
  slug: '슬러그',
  tags: '태그',
  username: '아이디',
  password: '비밀번호',
}

export function translateErrorMessage(message: string, field?: string): string {
  let text = message.trim()

  if (text.startsWith('Value error, ')) {
    text = text.slice('Value error, '.length)
  }

  const fieldLabel = field ? FIELD_LABELS[field] ?? field : ''

  const atLeast = text.match(/String should have at least (\d+) characters?/)
  if (atLeast) {
    const label = fieldLabel || '입력값'
    return `${label}은(는) ${atLeast[1]}자 이상 입력해 주세요.`
  }

  const atMost = text.match(/String should have at most (\d+) characters?/)
  if (atMost) {
    const label = fieldLabel || '입력값'
    return `${label}은(는) ${atMost[1]}자 이하로 입력해 주세요.`
  }

  const exactLength = text.match(/String should have (\d+) characters?/)
  if (exactLength) {
    const label = fieldLabel || '입력값'
    return `${label}은(는) ${exactLength[1]}자로 입력해 주세요.`
  }

  const translations: Record<string, string> = {
    'Field required': fieldLabel ? `${fieldLabel}을(를) 입력해 주세요.` : '필수 항목을 입력해 주세요.',
    'Input should be a valid string': fieldLabel
      ? `${fieldLabel} 형식이 올바르지 않습니다.`
      : '입력 형식이 올바르지 않습니다.',
    'value is not a valid email address': '올바른 이메일 주소를 입력해 주세요.',
    "Input should be 'drawing', '3d', 'integrated' or 'other'": '프로젝트 유형을 선택해 주세요.',
    'Input should be a valid integer': '숫자 형식이 올바르지 않습니다.',
    'Input should be a valid number': '숫자 형식이 올바르지 않습니다.',
  }

  for (const [english, korean] of Object.entries(translations)) {
    if (text.includes(english)) return korean
  }

  if (/^[A-Za-z]/.test(text) && text.includes('should')) {
    return fieldLabel ? `${fieldLabel}을(를) 확인해 주세요.` : '입력값을 확인해 주세요.'
  }

  return text
}

export function parseApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback

  const record = data as { detail?: unknown; message?: string }

  if (typeof record.message === 'string') {
    return translateErrorMessage(record.message)
  }

  if (typeof record.detail === 'string') {
    return translateErrorMessage(record.detail)
  }

  if (Array.isArray(record.detail)) {
    const messages = record.detail
      .map((item) => {
        if (typeof item === 'object' && item && 'msg' in item) {
          const field =
            typeof item === 'object' && item && 'loc' in item && Array.isArray((item as { loc: unknown[] }).loc)
              ? String((item as { loc: unknown[] }).loc[(item as { loc: unknown[] }).loc.length - 1] ?? '')
              : undefined
          return translateErrorMessage(String((item as { msg: string }).msg), field)
        }
        return ''
      })
      .filter(Boolean)

    if (messages.length > 0) return [...new Set(messages)].join(' · ')
  }

  return fallback
}
