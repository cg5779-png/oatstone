import { FormEvent } from 'react'
import { useFadeIn } from '../../hooks/useFadeIn'
import { useInquiries } from '../../hooks/useInquiries'
import Button from '../ui/Button'
import Toast from '../ui/Toast'
import './Contact.css'

const CONTACT_EMAIL = 'oootn@naver.com'
const CONTACT_PHONES = [
  { display: '010-4488-5779', tel: '01044885779' },
  { display: '010-4462-7585', tel: '01044627585' },
] as const

export default function Contact() {
  const ref = useFadeIn()
  const { form, submitting, toast, updateField, handleSubmit, clearToast } = useInquiries()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleSubmit()
  }

  return (
    <section id="contact" className="contact fade-in" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <h2 className="section-title">Contact</h2>
        <p className="section-subtitle">프로젝트 의뢰 및 문의</p>

        <div className="contact__grid">
          <div className="contact__info">
            <h3 className="contact__info-title">함께 만들어갈 공간,<br />OATSTONE과 시작하세요</h3>
            <p className="contact__info-desc">
              아래 양식을 작성해 주시면 빠른 시일 내에 연락드리겠습니다.
            </p>
            <div className="contact__details">
              <p>
                <strong>이메일</strong>{' '}
                <a className="contact__link" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                <strong>전화</strong>{' '}
                {CONTACT_PHONES.map((phone, index) => (
                  <span key={phone.tel}>
                    {index > 0 && ' / '}
                    <a className="contact__link" href={`tel:${phone.tel}`}>
                      {phone.display}
                    </a>
                  </span>
                ))}
              </p>
            </div>
          </div>

          <form className="contact__form" onSubmit={onSubmit} noValidate>
            <div className="contact__field">
              <label htmlFor="name">이름 *</label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div className="contact__row">
              <div className="contact__field">
                <label htmlFor="email">이메일 *</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="example@naver.com"
                />
              </div>
              <div className="contact__field">
                <label htmlFor="phone">연락처 *</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>
            </div>
            <div className="contact__field">
              <label htmlFor="project_type">프로젝트 유형 *</label>
              <select
                id="project_type"
                required
                value={form.project_type}
                onChange={(e) => updateField('project_type', e.target.value as typeof form.project_type)}
              >
                <option value="drawing">도면 작성</option>
                <option value="3d">3D 디자인</option>
                <option value="integrated">통합 패키지</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div className="contact__field">
              <label htmlFor="message">메시지 *</label>
              <textarea
                id="message"
                required
                rows={5}
                value={form.message}
                onChange={(e) => updateField('message', e.target.value)}
                placeholder="프로젝트 내용을 간략히 설명해 주세요."
              />
            </div>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? '전송 중...' : '문의 보내기'}
            </Button>
          </form>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </section>
  )
}
