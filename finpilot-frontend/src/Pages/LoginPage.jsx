import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthLayout, { AuthDivider, AuthField } from '../components/shared/AuthLayout';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finish = (user, accessToken) => {
    if (onLoginSuccess) onLoginSuccess(user, accessToken);
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      finish({ email: login }, 'mock-token');
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

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Password reset link sent to your email.');
  };

  const forgotLink = (
    <a
      href="#forgot"
      onClick={handleForgotPassword}
      className="text-xs font-semibold text-[#050505] transition-colors hover:opacity-80"
    >
      Forgot password?
    </a>
  );

  const eyeToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((s) => !s)}
      className="w-8 h-8 flex items-center justify-center text-[#A3A3A3] hover:text-[#050505] rounded-lg transition-colors cursor-pointer"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      tabIndex={-1}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your financial reasoning workspace."
    >
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div
              className="text-xs font-semibold px-4 py-3 rounded-xl border border-[#D4D4D4] flex items-start gap-2 break-words bg-[#F5F5F5] text-[#050505]"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <AuthField
            id="login"
            label="Email"
            type="email"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="username@domain.com"
            required
          />

          <AuthField
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            rightLabel={forgotLink}
            endAdornment={eyeToggle}
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 rounded-xl font-bold text-[15px] text-white bg-[#050505] inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-[#1A1A1A] active:scale-[0.98] cursor-pointer shadow-xs"
          >
            {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Sign in'}
          </button>
        </form>

        <AuthDivider />

        <div className="w-full flex justify-center mt-2 overflow-hidden min-h-[40px]">
          <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-in failed')} useOneTap={false} width="300" shape="pill" />
        </div>

        <p className="text-xs font-medium text-[#525252] text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-bold underline text-[#050505] hover:opacity-80 transition-opacity">
            Sign up
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}