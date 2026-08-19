import { useCallback, useState } from 'react'
import { submitInquiry, type InquiryPayload } from '../services/api'

interface ToastState {
  message: string
  type: 'success' | 'error'
}

const INITIAL_FORM: InquiryPayload = {
  name: '',
  email: '',
  phone: '',
  project_type: 'integrated',
  message: '',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateForm(form: InquiryPayload): string | null {
  const name = form.name.trim()
  const email = form.email.trim()
  const phone = form.phone.trim()
  const message = form.message.trim()

  if (!name) return '이름을 입력해 주세요.'
  if (name.length > 100) return '이름은 100자 이하로 입력해 주세요.'
  if (!email) return '이메일을 입력해 주세요.'
  if (!EMAIL_PATTERN.test(email)) return '올바른 이메일 주소를 입력해 주세요.'
  if (!phone) return '연락처를 입력해 주세요.'
  if (phone.length < 10) return '연락처는 10자 이상 입력해 주세요.'
  if (phone.length > 20) return '연락처는 20자 이하로 입력해 주세요.'
  if (!message) return '메시지를 입력해 주세요.'
  if (message.length < 10) return '메시지는 10자 이상 입력해 주세요.'
  if (message.length > 2000) return '메시지는 2000자 이하로 입력해 주세요.'

  return null
}

export function useInquiries() {
  const [form, setForm] = useState<InquiryPayload>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const updateField = useCallback(<K extends keyof InquiryPayload>(key: K, value: InquiryPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM)
  }, [])

  const handleSubmit = useCallback(async () => {
    const validationError = validateForm(form)
    if (validationError) {
      setToast({ message: validationError, type: 'error' })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      }
      const result = await submitInquiry(payload)
      setToast({ message: result.message, type: 'success' })
      resetForm()
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : '문의 접수에 실패했습니다.',
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }, [form, resetForm])

  const clearToast = useCallback(() => setToast(null), [])

  return {
    form,
    submitting,
    toast,
    updateField,
    handleSubmit,
    clearToast,
  }
}
