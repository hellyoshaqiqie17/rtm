'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8 bg-[#050505]">
      <div className="w-8 h-8 border-4 border-[#E50914]/20 border-t-[#E50914] rounded-full animate-spin"></div>
    </div>
  );
}
