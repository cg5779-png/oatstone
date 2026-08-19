import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__brand">
          <img src="/assets/oatstone-logo-footer.png" alt="OAT STONE - Outset · Attitude · Tone" className="footer__logo" />
        </div>
        <p className="footer__copy">&copy; 2026 OATSTONE. 모든 권리 보유.</p>
      </div>
    </footer>
  )
}
