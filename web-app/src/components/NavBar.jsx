import { Link } from 'react-router-dom';

export default function NavBar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <Link to="/">Feed</Link>
      <Link to="/groups">Groupes</Link>
      <Link to="/messages">Messages</Link>
      <Link to="/notifications">Notifications</Link>
      <Link to="/profile">Profil</Link>
      {user?.status !== 'user' && <Link to="/admin">Admin</Link>}
      <button type="button" onClick={onLogout}>Se déconnecter</button>
    </nav>
  );
}
