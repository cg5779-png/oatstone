import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import About from '../components/sections/About'
import Process from '../components/sections/Process'
import Portfolio from '../components/sections/Portfolio'
import Contact from '../components/sections/Contact'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Process />
        <Portfolio />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
