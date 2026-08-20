import { useFadeIn } from '../../hooks/useFadeIn'
import './About.css'

export default function About() {
  const ref = useFadeIn()

  return (
    <section id="about" className="about fade-in" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <h2 className="section-title">About OATSTONE</h2>
        <p className="section-subtitle">Outset · Attitude · Tone — 공간 디자인의 새로운 기준</p>

        <div className="about__text">
          <p className="about__lead">
            OATSTONE은 클라이언트의 디자인 의뢰를 받아, 현장 확인과 실측을 거쳐
            도면과 3D 디자인을 직접 제작하는 공간 디자인 전문 회사입니다.
          </p>
          <p className="about__body">
            평면도, 천정면도, 입면도, 단면도, 상세도 등 정밀한 도면 작성부터
            아이소메트릭, 투시도, 조감도 등 생동감 있는 3D 시각화까지 —
            모든 결과물은 OATSTONE 구성원이 직접 설계하여 제공합니다.
          </p>
        </div>
      </div>
    </section>
  )
}
