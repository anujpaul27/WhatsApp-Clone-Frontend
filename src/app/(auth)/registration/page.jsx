'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Camera, ArrowRight, X } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { useRouter } from 'next/navigation';

export default function WhatsAppRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const router = useRouter()
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const IMGBB_API_KEY = `${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`; 

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      setError("Image size must be less than 1MB");
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadToImageBB = async (file) => {

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.status === 200) {
        setImageUrl(data.data.url);
        return data.data.url;
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || formData.password.length < 6) {
      setError("Please fill all fields correctly");
      return;
    }

    setLoading(true);
    setError('');
    

    try {
      // 1. Create user with BetterAuth
      const {data,error} = await  authClient.signUp.email ({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      }
    );

      if (error)
      {
        setSuccess(false)
        setError(`${error.message}`)
        return
      }

      let avatarUrl = '';

    // Upload image first if selected
    if (image) {
      avatarUrl = await uploadToImageBB(image);
      if (!avatarUrl) {
        setLoading(false);
        return;
      }
    }

    // 2. Update user with avatar (BetterAuth)
      if (avatarUrl) {
        await authClient.updateUser({ image: avatarUrl });
      }

      if (data)
      {
        console.log(data);
        router.push('/')
      }
      

      setSuccess(true);
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-[#0A0F14]">
      {/* Dynamic Background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 50%, #075E54 100%)",
        }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 bg-[#25D366] rounded-3xl flex items-center justify-center shadow-2xl"
          >
            <span className="text-5xl">💬</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1F2A33] rounded-3xl shadow-2xl overflow-hidden border border-[#2A3A47]"
        >
          <div className="h-1.5 bg-[#25D366]" />

          <div className="p-8">
            <h1 className="text-3xl font-light text-white text-center mb-2">Create Account</h1>
            <p className="text-[#8696A0] text-center mb-8">Join WhatsApp today</p>

            <form onSubmit={handleRegister} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative w-28 h-28 mb-4 group">
                  <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-[#25D366]/30 bg-[#2A3A47]">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={48} className="text-[#5B6B79]" />
                      </div>
                    )}
                  </div>

                  <label className="absolute bottom-1 right-1 bg-[#25D366] text-black p-2 rounded-full cursor-pointer hover:bg-[#20C258] transition-all">
                    <Camera size={20} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => { setImage(null); setImagePreview(null); setImageUrl(''); }}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#8696A0]">Profile Photo (Optional)</p>
              </div>

              {/* Name */}
              <div>
                <label className="text-[#8696A0] text-sm mb-1 block">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full bg-[#2A3A47] border border-[#3A4A57] focus:border-[#25D366] text-white py-4 px-5 rounded-2xl outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[#8696A0] text-sm mb-1 block">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full bg-[#2A3A47] border border-[#3A4A57] focus:border-[#25D366] text-white py-4 px-5 rounded-2xl outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[#8696A0] text-sm mb-1 block">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    className="w-full bg-[#2A3A47] border border-[#3A4A57] focus:border-[#25D366] text-white py-4 px-5 rounded-2xl outline-none"
                  />
                </div>
                <p className="text-xs text-[#8696A0] mt-1">Minimum 6 characters</p>
              </div>

              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full bg-[#25D366] hover:bg-[#20C258] disabled:bg-[#3A4A57] text-black font-semibold py-4 rounded-2xl text-lg flex items-center justify-center gap-3 transition-all mt-6"
              >
                {loading || uploading ? (
                  <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={22} />
                  </>
                )}
              </button>
            </form>

            {error && <p className="text-red-400 text-center mt-4 text-sm">{error}</p>}

            <div className="text-center mt-6">
              <p className="text-[#8696A0] text-sm">
                Already have an account?{" "}
                <a href="/login" className="text-[#25D366] hover:underline">Sign in</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Success Screen */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
          >
            <div className="text-center px-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-7xl mb-6"
              >
                🎉
              </motion.div>
              <h2 className="text-4xl text-white font-light">Account Created!</h2>
              <p className="text-[#25D366] mt-3">Welcome to WhatsApp</p>
              {imageUrl && <p className="text-sm text-[#8696A0] mt-8">Profile photo updated</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}