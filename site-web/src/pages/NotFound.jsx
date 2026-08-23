import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page-404">
      <div className="notfound-card">
        <div className="notfound-code">404</div>
        <h2>Page introuvable</h2>
        <p>Cette page n'existe pas ou a été déplacée.</p>
        <Link to="/" className="btn btn-primary">
          <Home size={18} /> Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
