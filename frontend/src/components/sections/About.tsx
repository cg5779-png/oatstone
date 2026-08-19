import { useFadeIn } from '../../hooks/useFadeIn'
import Card from '../ui/Card'
import { ValueIcon, type ValueIconName } from '../ui/LineIcon'
import './About.css'

const VALUES: { key: ValueIconName; title: string; desc: string }[] = [
  {
    key: 'outset',
    title: 'Outset',
    desc: '새로운 시작을 함께합니다. 클라이언트의 비전을 공간으로 구현하는 첫 걸음.',
  },
  {
    key: 'attitude',
    title: 'Attitude',
    desc: '세심한 태도로 현장을 확인하고, 정확한 실측과 협의를 거칩니다.',
  },
  {
    key: 'tone',
    title: 'Tone',
    desc: '일관된 디자인 톤으로 도면과 3D 결과물을 완성합니다.',
  },
]

export default function About() {
  const ref = useFadeIn()

  return (
    <section id="about" className="about fade-in" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <h2 className="section-title">About OATSTONE</h2>
        <p className="section-subtitle">Outset · Attitude · Tone — 공간 디자인의 새로운 기준</p>

        <div className="about__grid">
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
          <div className="about__values">
            {VALUES.map((v) => (
              <Card key={v.key} className="about__value-card">
                <ValueIcon name={v.key} className="about__icon" />
                <h3 className="about__value-title">{v.title}</h3>
                <p className="about__value-desc">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
