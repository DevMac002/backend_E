import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, ChevronRight, CirclePlay, Heart, HeartHandshake, MapPin, ShieldCheck, UsersRound } from 'lucide-react';
import api from '../api';
import { useAuth } from '../hooks/useAuth';

export const DEFAULT_CHURCH_CONTENT = {
  churchName: 'Église Nouvelle Alliance',
  tagline: 'Vivre pour Christ, Impacter le monde.',
  description: 'Une église accueillante, centrée sur la Parole de Dieu, la prière, la louange et l’amour du prochain.',
  nextService: 'Dimanche · 09:00',
  address: '123 Rue de la Grâce, Abidjan, Côte d’Ivoire',
  mapUrl: 'https://maps.google.com/?q=Abidjan',
  phone: '+225 00 00 00 00 00',
  email: 'bonjour@nouvellealliance.ci',
  heroImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=2200&q=90',
  gallery: [
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85',
  ],
  messageTitle: 'Marcher par la foi et non par la vue',
  verseText: 'Car nous marchons par la foi, et non par la vue.',
  verseReference: '2 Corinthiens 5:7',
  prayerTitle: 'Besoin de prière ?',
  prayerDescription: 'Notre équipe est là pour prier avec vous et vous accompagner.',
  serviceLocation: 'Temple principal',
  schedule: [
    { day: '03', time: '09:00 - 11:30', title: 'Culte dominical' },
    { day: '08', time: '19:00 - 20:30', title: 'Réunion de prière' },
    { day: '15', time: '18:00 - 21:00', title: 'Soirée des jeunes' },
  ],
};

const VALUES = [
  { icon: BookOpen, title: 'La Parole de Dieu', text: 'Nous enseignons la Bible avec clarté pour une vie transformée.' },
  { icon: UsersRound, title: 'Communauté', text: 'Une famille unie où chacun trouve sa place.' },
  { icon: HeartHandshake, title: 'Service', text: 'Nous servons Dieu en servant les autres avec amour.' },
  { icon: Heart, title: 'Mission', text: 'Nous allons plus loin pour impacter notre génération.' },
];

function mergeContent(content) {
  return { ...DEFAULT_CHURCH_CONTENT, ...(content || {}), gallery: content?.gallery?.length ? content.gallery : DEFAULT_CHURCH_CONTENT.gallery, schedule: content?.schedule?.length ? content.schedule : DEFAULT_CHURCH_CONTENT.schedule };
}

export default function Home() {
  const { user, loading } = useAuth();
  const [content, setContent] = useState(DEFAULT_CHURCH_CONTENT);
  useEffect(() => { api.get('/site/content').then(({ data }) => setContent(mergeContent(data.content))).catch(() => {}); }, []);
  const isAdmin = ['admin', 'superadmin'].includes(user?.status);
  const [serviceDay, serviceTime = '09:00'] = content.nextService.split('·').map((value) => value.trim());

  return <div className="official-church-page">
    <section className="official-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(2, 10, 20, .96) 0%, rgba(2, 10, 20, .66) 42%, rgba(2, 10, 20, .12) 100%), url(${content.heroImage})` }}>
      <nav className="official-nav" aria-label="Navigation principale">
        <Link className="official-brand" to="/"><span className="official-cross">✝</span><span><small>Église</small>{content.churchName.replace(/^Église\s*/i, '')}</span></Link>
        <div className="official-nav-links"><a className="active" href="#accueil">Accueil</a><a href="#apropos">À propos</a><a href="#ministeres">Ministères</a><a href="#evenements">Événements</a><a href="#medias">Médias</a><a href="#ressources">Ressources</a><a href="#contact">Contact</a></div>
        <div className="official-nav-actions">{isAdmin && <Link className="official-admin" to="/admin"><ShieldCheck size={15} /> Admin</Link>}<a className="official-donate" href="#contact">Faire un don <Heart size={16} /></a></div>
      </nav>
      <div id="accueil" className="official-hero-inner">
        <div className="official-hero-copy"><h1>{content.tagline.split(', ').map((line, index) => <span key={line} className={index === 1 ? 'gold' : ''}>{line}{index === 0 && <br />}</span>)}</h1><p>{content.description}</p><div className="official-actions"><a href="#apropos" className="official-primary">Nous rejoindre <ArrowRight size={17} /></a><a href="#apropos" className="official-secondary">En savoir plus</a></div></div>
        <aside className="official-service-card"><div className="official-card-heading"><CalendarDays size={25} /> <span>Prochain culte</span></div><strong>{serviceDay}</strong><b>{serviceTime}</b><p><MapPin size={18} /> {content.address}</p><a href={content.mapUrl} target="_blank" rel="noreferrer">Ajouter au calendrier <ArrowRight size={16} /></a></aside>
      </div>
    </section>

    <main className="official-main">
      <section id="apropos" className="official-values">{VALUES.map(({ icon: Icon, title, text }) => <article key={title}><Icon /><div><h2>{title}</h2><p>{text}</p></div></article>)}</section>
      <section className="official-content-grid">
        <article id="medias" className="official-panel official-message"><img src={content.gallery[0]} alt="Dernier message de l’église" /><div className="official-play"><CirclePlay fill="rgba(0,0,0,.5)" /></div><div className="official-panel-body"><b>Dernier message</b><p>{content.messageTitle}</p><a className="official-small-button" href="/app">Regarder maintenant</a></div></article>
        <article id="ressources" className="official-panel official-verse"><span>Verset du jour</span><blockquote>« {content.verseText} »</blockquote><p>{content.verseReference}</p><a href="#contact">Lire la Bible <ArrowRight size={16} /></a></article>
        <article id="evenements" className="official-panel official-events"><h2>Événements à venir</h2>{content.schedule.slice(0, 3).map((event) => <div className="official-event" key={`${event.day}-${event.title}`}><time><b>{event.day}</b><span>AOÛT</span></time><p><strong>{event.title}</strong><span>{event.time}</span><small>{content.serviceLocation}</small></p></div>)}<a href="#contact">Voir tous les événements <ChevronRight size={16} /></a></article>
        <article id="ministeres" className="official-panel official-prayer"><img src={content.gallery[1] || content.gallery[0]} alt="Prière et accompagnement" /><div className="official-panel-body"><b>{content.prayerTitle}</b><p>{content.prayerDescription}</p><a className="official-small-button" href={`mailto:${content.email}?subject=Demande%20de%20prière`}>Faire une demande</a></div></article>
      </section>
    </main>
    <footer id="contact" className="official-footer"><span>{content.churchName} · {content.address}</span><a href={`mailto:${content.email}`}>{content.email}</a>{!loading && <Link to={user ? '/app' : '/login'}>{user ? 'Mon espace' : 'Se connecter'}</Link>}</footer>
  </div>;
}
