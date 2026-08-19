import { useFadeIn } from '../../hooks/useFadeIn'
import Card from '../ui/Card'
import { ServiceIcon, type ServiceIconName } from '../ui/LineIcon'
import './Services.css'

const SERVICES: {
  id: string
  title: string
  desc: string
  icon: ServiceIconName
}[] = [
  { id: 'survey', title: '현장 실측', desc: '현장 방문, 실측, 클라이언트 협의', icon: 'survey' },
  { id: 'drawing', title: '도면 작성', desc: '평면도, 천정면도, 입면도, 단면도, 상세도', icon: 'drawing' },
  { id: '3d', title: '3D 디자인', desc: '아이소메트릭, 투시도, 조감도', icon: '3d' },
  { id: 'integrated', title: '통합 제공', desc: '도면 + 3D 디자인 패키지', icon: 'integrated' },
]

export default function Services() {
  const ref = useFadeIn()

  return (
    <section id="services" className="services fade-in" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <h2 className="section-title">Services</h2>
        <p className="section-subtitle">의뢰부터 결과물 제공까지, 원스톱 디자인 서비스</p>

        <div className="services__grid">
          {SERVICES.map((s) => (
            <Card key={s.id} className="services__card">
              <div className="services__icon-wrap">
                <ServiceIcon name={s.icon} className="services__icon" />
              </div>
              <h3 className="services__title">{s.title}</h3>
              <p className="services__desc">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
