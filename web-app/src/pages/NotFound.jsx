import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page notfound-page">
      <h1>404</h1>
      <p>Page introuvable.</p>
      <Link to="/">Retour au fil</Link>
    </div>
  );
}
