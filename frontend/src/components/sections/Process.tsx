import { useFadeIn } from '../../hooks/useFadeIn'
import './Process.css'

const STEPS = [
  { num: '01', title: '의뢰 접수', desc: '프로젝트 내용과 요구사항을 파악합니다.' },
  { num: '02', title: '현장 확인/실측', desc: '필요 시 현장을 방문하여 정밀 실측을 진행합니다.' },
  { num: '03', title: '협의', desc: '클라이언트와 디자인 방향을 협의합니다.' },
  { num: '04', title: '도면 작성', desc: '평면도, 입면도 등 정밀 도면을 작성합니다.' },
  { num: '05', title: '3D 디자인 제공', desc: '아이소메트릭, 투시도, 조감도를 제작하여 제공합니다.' },
]

export default function Process() {
  const ref = useFadeIn()

  return (
    <section id="process" className="process fade-in" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <h2 className="section-title">Process</h2>
        <p className="section-subtitle">의뢰부터 결과물까지, 5단계 워크플로우</p>

        <div className="process__timeline">
          {STEPS.map((step, i) => (
            <div key={step.num} className="process__step">
              <div className="process__step-marker">
                <span className="process__num">{step.num}</span>
                {i < STEPS.length - 1 && <div className="process__line" />}
              </div>
              <div className="process__step-content">
                <h3 className="process__step-title">{step.title}</h3>
                <p className="process__step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
