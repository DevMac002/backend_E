import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, sendVerificationCode } = useAuth();
  const prefillEmail = location.state?.email || '';

  const [email, setEmail] = useState(prefillEmail);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleCodeChange = (index, value) => {
    const char = value.slice(-1);
    if (!/^\d?$/.test(char)) return;
    const next = [...code];
    next[index] = char;
    setCode(next);
    setError('');
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setCode(next);
    const focusIndex = Math.min(text.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Le code doit contenir 6 chiffres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyEmail({ email, code: fullCode });
      setSuccess(true);
      setTimeout(() => navigate('/'), 900);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Veuillez renseigner votre email.');
      return;
    }
    setResending(true);
    setError('');
    try {
      await sendVerificationCode(email);
      setResendCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de renvoyer le code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page verify-page">
      <div className="auth-form-side">
        <button className="btn-back" onClick={() => navigate('/login')} aria-label="Retour">
          <ArrowLeft size={18} />
          Retour
        </button>
        <div className="auth-form-card">
          <div className="verify-icon">
            <Mail size={28} />
          </div>
          <div className="auth-form-head">
            <h2>Vérifiez votre email</h2>
            <p>Nous avons envoyé un code à 6 chiffres à l'adresse ci-dessous.</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              Email vérifié avec succès ! Redirection...
            </div>
          )}

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="verify-email">Email</label>
              <input
                id="verify-email"
                className="form-input"
                type="email"
                placeholder="jean@exemple.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Code de vérification</label>
              <div className="otp-inputs" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    type="text"
                    maxLength={1}
                    className="otp-input"
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg btn-full${loading ? ' btn-loading' : ''}`}
              disabled={loading || success}
            >
              {loading ? '' : 'Vérifier'}
            </button>
          </form>

          <div className="form-foot">
            <button
              type="button"
              className={`btn-link-inline${resendCooldown > 0 ? ' disabled' : ''}`}
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
            >
              {resending ? <RefreshCw size={14} className="spin" /> : null}
              {resendCooldown > 0
                ? `Renvoyer le code (${resendCooldown}s)`
                : resending
                ? 'Envoi en cours...'
                : "Renvoyer le code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
