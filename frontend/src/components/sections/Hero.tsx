import { scrollToSection } from '../../constants/navigation'
import Button from '../ui/Button'
import './Hero.css'

export default function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero__decor" aria-hidden="true">
        <div className="hero__pebble hero__pebble--large" />
        <div className="hero__pebble hero__pebble--small" />
      </div>
      <div className="hero__content">
        <img src="/assets/oatstone-logo.png" alt="OATSTONE" className="hero__logo" />
        <p className="hero__tagline">Outset · Attitude · Tone</p>
        <h1 className="hero__title">
          오트스톤
          <br />
          공간을 설계하고
          <br />
          미래를 디자인합니다
        </h1>
        <p className="hero__desc">
          현장 실측부터 도면 작성, 3D 디자인까지<br />
          OATSTONE이 직접 설계하는 맞춤 공간 솔루션
        </p>
        <Button size="lg" onClick={() => scrollToSection('contact')}>
          프로젝트 의뢰하기
        </Button>
      </div>
      <div className="hero__scroll-hint" aria-hidden="true">
        <span>아래로</span>
        <div className="hero__scroll-line" />
      </div>
    </section>
  )
}
