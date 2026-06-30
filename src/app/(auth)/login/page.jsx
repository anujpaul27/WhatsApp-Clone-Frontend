'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, User, LogIn, Check } from 'lucide-react';

export default function WhatsAppLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);

  // Dynamic gradient background colors
  const [bgColor, setBgColor] = useState('#25D366');

  useEffect(() => {
    const colors = ['#25D366', '#128C7E', '#075E54', '#1F2A33'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % colors.length;
      setBgColor(colors[index]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setIsValidEmail(validateEmail(value));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isValidEmail || password.length < 6) {
      setError('Please enter a valid email and password (min 6 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Replace with your BetterAuth call
      // await signIn.email({ email, password });
      await new Promise(resolve => setTimeout(resolve, 1400));
      
      setSuccess(true);
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Replace with BetterAuth Google OAuth
      // await signIn.social({ provider: 'google' });
      await new Promise(resolve => setTimeout(resolve, 1200));
      setSuccess(true);
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Animated Background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `linear-gradient(135deg, ${bgColor} 0%, #0A0F14 50%, #111B21 100%)`,
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            className="w-16 h-16 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-xl"
          >
            <span className="text-4xl">💬</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1F2A33] rounded-3xl shadow-2xl overflow-hidden border border-[#2A3A47]"
        >
          <div className="h-1.5 bg-[#25D366]" />

          <div className="p-8 pb-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light text-white tracking-tight">Sign in to WhatsApp</h1>
              <p className="text-[#8696A0] mt-2">Secure access with BetterAuth</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-[#8696A0] text-sm flex items-center gap-2">
                  <Mail size={18} /> Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="you@example.com"
                    className="w-full bg-[#2A3A47] border border-[#3A4A57] focus:border-[#25D366] 
                             text-white text-lg py-4 px-5 rounded-2xl outline-none transition-all
                             placeholder:text-[#5B6B79]"
                  />
                  {isValidEmail && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#25D366]">
                      <Check size={22} />
                    </div>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-[#8696A0] text-sm flex items-center gap-2">
                  <Lock size={18} /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#2A3A47] border border-[#3A4A57] focus:border-[#25D366] 
                             text-white text-lg py-4 px-5 rounded-2xl outline-none transition-all
                             placeholder:text-[#5B6B79]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isValidEmail || password.length < 6}
                className="w-full bg-[#25D366] hover:bg-[#20C258] disabled:bg-[#3A4A57] 
                         text-black font-semibold py-4 rounded-2xl text-lg flex items-center 
                         justify-center gap-3 transition-all active:scale-[0.985] mt-4"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <LogIn size={22} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="h-px flex-1 bg-[#3A4A57]" />
              <span className="text-[#8696A0] text-sm uppercase tracking-widest">or</span>
              <div className="h-px flex-1 bg-[#3A4A57]" />
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full border border-[#3A4A57] hover:border-[#25D366] text-white py-4 
                       rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-white/5"
            >
              <img 
                src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
                alt="Google" 
                className="w-5 h-5"
              />
              <span className="font-medium">Continue with Google</span>
            </button>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-center text-sm mt-4"
              >
                {error}
              </motion.p>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-[#2A3A47] text-center">
            <p className="text-[#8696A0] text-xs">
              End-to-end encrypted • Powered by BetterAuth
            </p>
          </div>
        </motion.div>

        {/* Extra Links */}
        <div className="text-center mt-6 text-[#8696A0] text-sm space-x-4">
          <a href="#" className="hover:text-white transition-colors">Forgot password?</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Create account</a>
        </div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="text-8xl mb-6">🎉</div>
              <h2 className="text-4xl font-light text-white">Welcome back!</h2>
              <p className="text-[#25D366] mt-3 text-xl">You are now signed in</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}