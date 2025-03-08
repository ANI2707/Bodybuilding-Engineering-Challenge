'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabse';
import { FaGoogle } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        console.log("user",user)
        setLoading(false);
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);


  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-gray-900 shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-white">
          BB Simulator
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-6">
          <Link href="/" className="text-white hover:text-gray-300 transition">
            Home
          </Link>
          <Link href="/advice" className="text-white hover:text-gray-300 transition">
            Bodybuilding Advice
          </Link>
          <Link href="/factory" className="text-white hover:text-gray-300 transition">
            Protein Factory
          </Link>
        </div>

        {/* Authentication */}
        <div className="flex items-center space-x-4">
          {!loading && (
            <>
              {user ? (
                <div className="relative group">
                  <img
                    src={user.user_metadata?.avatar_url}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-500"
                  />
                  <div className="absolute right-0 mt-2 w-40 bg-gray-800 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="px-4 py-2 border-b border-gray-700">
                      {user.user_metadata?.full_name}
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center px-4 py-2 w-full hover:bg-gray-700 text-red-500"
                    >
                      <FiLogOut className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="flex cursor-pointer items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  <FaGoogle className="mr-2" />
                  Sign In with Google
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
