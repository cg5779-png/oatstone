import { useFadeIn } from '../../hooks/useFadeIn'
import './Contact.css'

const CONTACT_EMAIL = 'oootn@naver.com'
const CONTACT_PHONE = { display: '010-4462-7585', tel: '01044627585' } as const

export default function Contact() {
  const ref = useFadeIn()

  return (
    <section id="contact" className="contact fade-in" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <h2 className="section-title">Contact</h2>
        <p className="section-subtitle">프로젝트 의뢰 및 문의</p>

        <div className="contact__info">
          <h3 className="contact__info-title">함께 만들어갈 공간,<br />OATSTONE과 시작하세요</h3>
          <p className="contact__info-desc">
            이메일 또는 전화로 문의 주시면 언제든 연락 드리겠습니다.
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
              <a className="contact__link" href={`tel:${CONTACT_PHONE.tel}`}>
                {CONTACT_PHONE.display}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
