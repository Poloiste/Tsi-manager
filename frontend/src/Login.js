import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from './AuthContext';

function Login() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Le nom est requis');
        }
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 border border-indigo-500/30 rounded-2xl p-8 max-w-md w-full backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            TSI1 Manager
          </h1>
          <p className="text-slate-400">
            {isSignUp ? 'Créer votre compte' : 'Connectez-vous pour continuer'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-indigo-300 mb-2">
                <UserIcon className="w-4 h-4 inline mr-2" />
                Nom complet
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Jean Dupont"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              placeholder="votre.email@exemple.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
            {isSignUp && (
              <p className="text-xs text-slate-400 mt-1">Minimum 6 caractères</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Chargement...
              </div>
            ) : (
              isSignUp ? 'Créer mon compte' : 'Se connecter'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold"
          >
            {isSignUp 
              ? 'Déjà un compte ? Se connecter' 
              : 'Pas encore de compte ? S\'inscrire'}
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300">
            ℹ️ <strong>Important:</strong> Configurez vos identifiants Supabase dans le code pour activer l'authentification.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
