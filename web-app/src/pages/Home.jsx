import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Clock3, Heart, MapPin, PlayCircle, ShieldCheck, UsersRound } from 'lucide-react';
import api from '../api';
import { useAuth } from '../hooks/useAuth';

export const DEFAULT_CHURCH_CONTENT = {
  churchName: 'Église Épika',
  tagline: 'Une famille pour croire, grandir et servir.',
  description: 'Nous sommes une église accueillante, enracinée dans la Parole et tournée vers notre ville. Venez comme vous êtes : une place vous attend.',
  nextService: 'Dimanche · 09:00 & 11:00',
  address: '125, avenue de la Grâce, Abidjan',
  mapUrl: 'https://maps.google.com/?q=Abidjan',
  phone: '+225 00 00 00 00 00',
  email: 'bonjour@eglise-epika.org',
  heroImage: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1800&q=85',
  gallery: [
    'https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=900&q=80',
  ],
  schedule: [
    { day: 'Dimanche', time: '09:00', title: 'Célébration familiale' },
    { day: 'Mercredi', time: '19:00', title: 'Prière & encouragement' },
    { day: 'Samedi', time: '16:00', title: 'Rencontre des jeunes' },
  ],
};

function mergeContent(content) {
  return {
    ...DEFAULT_CHURCH_CONTENT,
    ...(content || {}),
    gallery: Array.isArray(content?.gallery) && content.gallery.length ? content.gallery : DEFAULT_CHURCH_CONTENT.gallery,
    schedule: Array.isArray(content?.schedule) && content.schedule.length ? content.schedule : DEFAULT_CHURCH_CONTENT.schedule,
  };
}

export default function Home() {
  const { user, loading } = useAuth();
  const [content, setContent] = useState(DEFAULT_CHURCH_CONTENT);

  useEffect(() => {
    api.get('/site/content').then(({ data }) => setContent(mergeContent(data.content))).catch(() => {});
  }, []);

  const isAdmin = ['admin', 'superadmin'].includes(user?.status);

  return (
    <div className="church-page">
      <nav className="church-nav" aria-label="Navigation principale">
        <Link className="church-brand" to="/">
          <span className="church-brand-mark"><Heart size={18} fill="currentColor" /></span>
          <span>{content.churchName}</span>
        </Link>
        <div className="church-nav-links">
          <a href="#bienvenue">Bienvenue</a>
          <a href="#horaires">Horaires</a>
          <a href="#photos">Photos</a>
          <a href="#contact">Nous trouver</a>
        </div>
        <div className="church-nav-actions">
          {!loading && isAdmin && <Link to="/admin" className="church-admin-link"><ShieldCheck size={16} /> Administration</Link>}
          {!loading && <Link to={user ? '/app' : '/login'} className="church-button church-button-small">{user ? 'Mon espace' : 'Se connecter'}</Link>}
        </div>
      </nav>

      <main>
        <section className="church-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 18, 31, .92) 4%, rgba(9, 18, 31, .62) 51%, rgba(9, 18, 31, .2)), url(${content.heroImage})` }}>
          <div className="church-hero-content">
            <span className="church-kicker"><span /> Bienvenue à la maison</span>
            <h1>{content.tagline}</h1>
            <p>{content.description}</p>
            <div className="church-hero-actions">
              <a className="church-button" href="#horaires">Planifier ma visite <ChevronRight size={18} /></a>
              <a className="church-button church-button-outline" href="#contact"><MapPin size={18} /> Nous trouver</a>
            </div>
          </div>
          <div className="church-next-service">
            <CalendarDays size={21} />
            <div><span>Prochaine célébration</span><strong>{content.nextService}</strong></div>
            <a href="#horaires" aria-label="Voir les horaires"><ChevronRight size={20} /></a>
          </div>
        </section>

        <section id="bienvenue" className="church-section church-intro">
          <div className="church-section-heading"><span className="church-kicker church-kicker-dark"><span /> Notre communauté</span><h2>Une église vivante, proche de vous.</h2></div>
          <p>À Épika, chaque génération peut trouver des amis, approfondir sa foi et participer à une communauté qui prend soin des autres.</p>
          <div className="church-values">
            <article><UsersRound /><h3>Une vraie famille</h3><p>Des petits groupes et des temps partagés pour ne jamais avancer seul.</p></article>
            <article><Heart /><h3>Une foi qui agit</h3><p>La compassion et le service sont au cœur de ce que nous vivons au quotidien.</p></article>
            <article><PlayCircle /><h3>Grandir ensemble</h3><p>Des enseignements accessibles pour tous, à chaque étape de la vie.</p></article>
          </div>
        </section>

        <section id="horaires" className="church-section church-schedule-section">
          <div className="church-section-heading"><span className="church-kicker church-kicker-dark"><span /> Cette semaine</span><h2>Nos rendez-vous</h2></div>
          <div className="church-schedule-grid">
            {content.schedule.map((event, index) => <article className="church-schedule-card" key={`${event.day}-${event.time}-${index}`}><span>{event.day}</span><strong>{event.time}</strong><p>{event.title}</p><Clock3 size={18} /></article>)}
          </div>
        </section>

        <section id="photos" className="church-section church-gallery-section">
          <div className="church-section-heading"><span className="church-kicker church-kicker-dark"><span /> En images</span><h2>La vie de l'église</h2></div>
          <div className="church-gallery">{content.gallery.slice(0, 3).map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={`Moment de vie à l'église ${index + 1}`} loading="lazy" />)}</div>
        </section>

        <section id="contact" className="church-contact-section">
          <div><span className="church-kicker"><span /> Venir nous voir</span><h2>Votre première visite commence ici.</h2><p>Nous serons heureux de vous accueillir et de répondre à vos questions.</p><a className="church-button church-button-light" href={content.mapUrl} target="_blank" rel="noreferrer"><MapPin size={18} /> Itinéraire</a></div>
          <address><MapPin size={21} /><p><strong>Notre adresse</strong>{content.address}</p><p><strong>Contact</strong><a href={`tel:${content.phone.replace(/\s/g, '')}`}>{content.phone}</a><a href={`mailto:${content.email}`}>{content.email}</a></p></address>
        </section>
      </main>
      <footer className="church-footer"><span>© {new Date().getFullYear()} {content.churchName}</span><span>Une communauté de foi ouverte à tous.</span>{isAdmin && <Link to="/admin">Gérer le site</Link>}</footer>
    </div>
  );
}
