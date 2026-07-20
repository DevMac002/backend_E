import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [device, setDevice] = useState('web');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await login(email, password, device);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la connexion');
    }
  };

  return (
    <div className="page login-page">
      <h1>Connexion Epika Social</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Mot de passe
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <label>
          Appareil
          <input value={device} onChange={(e) => setDevice(e.target.value)} type="text" />
        </label>
        <button type="submit" className="button button-primary">Se connecter</button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
