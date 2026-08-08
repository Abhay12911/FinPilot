import { useMemo, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import AuthLayout, { AuthDivider, AuthField } from '../components/shared/AuthLayout';

function strengthOf(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
const STRENGTH_COLORS = ['#D4D4D4', '#A3A3A3', '#737373', '#404040', '#050505'];

export default function SignupPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const initialRole = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('role') === 'recruiter' ? 'recruiter' : 'student';
  }, [location.search]);

  const [role, setRole] = useState(initialRole);

  const strength = useMemo(() => strengthOf(password), [password]);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  const finish = (user, accessToken) => {
    if (onLoginSuccess) onLoginSuccess(user, accessToken);
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      finish({ email }, 'mock-token');
    }, 1000);
  };

  const handleGoogle = async (credentialResponse) => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      finish({ name: 'Google User' }, 'mock-token');
    }, 1000);
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join FinPilot to get your first reasoning workspace free."
    >
      <div className="w-full">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden"
              >
                <div className="text-xs font-semibold px-3 py-2 rounded-xl border border-[#D4D4D4] bg-[#F5F5F5] text-[#050505] flex items-start gap-2 break-words">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#050505]" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">
                I want to join as
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] relative">
                {[
                  { key: 'student', label: ' Retail Investor' },
                  { key: 'recruiter', label: ' Professional' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setRole(opt.key)}
                    className={`relative z-10 py-1.5 px-3 rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      role === opt.key ? 'text-[#050505]' : 'text-[#737373] hover:text-[#050505]'
                    }`}
                  >
                    {role === opt.key && (
                      <motion.div
                        layoutId="activeRoleTab"
                        className="absolute inset-0 bg-white rounded-lg shadow-sm border border-[#E5E5E5]"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <AuthField id="name" label="Full name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Chen" required />

            <AuthField id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="username@domain.com" required />

            <AuthField id="username" label="Username (optional)" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" />

            <div>
              <AuthField
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={6}
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="w-8 h-8 flex items-center justify-center text-[#A3A3A3] hover:text-[#050505] rounded-lg transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[#E5E5E5] overflow-hidden flex gap-0.5">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="flex-1 h-full transition-all duration-300"
                        style={{ background: i < strength ? STRENGTH_COLORS[strength] : 'transparent' }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold shrink-0 uppercase tracking-wider" style={{ color: STRENGTH_COLORS[strength] }}>
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
              )}
            </div>

            <div>
              <AuthField
                id="confirmPassword"
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className={!passwordsMatch ? 'border-[#050505] focus:border-[#050505] focus:ring-[#050505]/20' : ''}
                endAdornment={
                  confirmPassword.length > 0 && passwordsMatch ? (
                    <span className="w-8 h-8 flex items-center justify-center text-[#050505]">
                      <Check className="w-4 h-4" />
                    </span>
                  ) : null
                }
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <span className="mt-1.5 block text-xs font-semibold text-[#050505]">Passwords don&apos;t match</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 rounded-xl font-bold text-[15px] text-white bg-[#050505] hover:bg-[#1A1A1A] inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.015] active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
            </button>
          </form>

          <AuthDivider />

          <div className="w-full flex justify-center mt-1 min-h-[38px]">
            <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-up failed')} text="signup_with" useOneTap={false} width="300" shape="pill" />
          </div>

          <p className="text-xs font-medium text-[#525252] text-center mt-5">
            Already have an account?{' '}
            <Link to="/login" className="font-bold underline text-[#050505] hover:opacity-80 transition-opacity">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </AuthLayout>
  );
}