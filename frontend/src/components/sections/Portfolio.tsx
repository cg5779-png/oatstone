import { useFadeIn } from '../../hooks/useFadeIn'
import { useProjects } from '../../hooks/useProjects'
import { CATEGORY_LABELS } from '../../services/api'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Toast from '../ui/Toast'
import './Portfolio.css'

export default function Portfolio() {
  const ref = useFadeIn()
  const {
    projects,
    loading,
    error,
    selected,
    openingId,
    toast,
    reload,
    openProject,
    closeProject,
    clearToast,
  } = useProjects()

  return (
    <section id="portfolio" className="portfolio fade-in" ref={ref as React.RefObject<HTMLElement>}>
      <div className="container">
        <h2 className="section-title">Portfolio</h2>
        <p className="section-subtitle">OATSTONE이 만든 공간 디자인</p>

        {loading ? (
          <div className="portfolio__loading">
            <div className="portfolio__skeleton-grid">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="portfolio__skeleton" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="portfolio__status">
            <p>{error}</p>
            <Button type="button" onClick={reload}>
              다시 시도
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <div className="portfolio__status">
            <p>등록된 프로젝트가 없습니다.</p>
          </div>
        ) : (
          <div className="portfolio__grid">
            {projects.map((p) => (
              <button
                key={p.id}
                className="portfolio__item"
                onClick={() => openProject(p.id)}
                aria-label={p.title}
                aria-busy={openingId === p.id}
                disabled={openingId !== null}
              >
                <img
                  src={p.thumbnail_url || ''}
                  alt={p.title}
                  loading="lazy"
                  className="portfolio__img"
                />
                <div className="portfolio__overlay">
                  <span className="portfolio__category">{CATEGORY_LABELS[p.category] || p.category}</span>
                  <span className="portfolio__title">{p.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Modal onClose={closeProject}>
          <div className="portfolio__modal">
            <img
              src={selected.thumbnail_url || ''}
              alt={selected.title}
              className="portfolio__modal-img"
            />
            <div className="portfolio__modal-body">
              <span className="portfolio__modal-category">
                {CATEGORY_LABELS[selected.category] || selected.category}
              </span>
              <h3 className="portfolio__modal-title">{selected.title}</h3>
              <p className="portfolio__modal-desc">{selected.description}</p>
              <div className="portfolio__tags">
                {selected.tags.map((tag) => (
                  <span key={tag} className="portfolio__tag">{tag}</span>
                ))}
              </div>
              {selected.images.length > 0 && (
                <div className="portfolio__modal-gallery">
                  {selected.images.map((img) => (
                    <figure key={img.id}>
                      <img src={img.image_url} alt={img.caption || selected.title} />
                      {img.caption && <figcaption>{img.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </section>
  )
}
