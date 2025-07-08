'use client' // Convertimos a Client Component

import Link from "next/link";
import { useSession } from "next-auth/react";
import { AiOutlineLogin, AiOutlineUserAdd } from "react-icons/ai";
import SignOutButton from "./SignOutButton";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Evitar renderizado antes de montar (hidratación)
  if (!isMounted) return null;

  return (
    <nav className="bg-gradient-to-r from-white via-blue-50 to-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex justify-between items-center relative">
        {/* Logo izquierdo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/Logos/tutoLogo.png`}
            alt="Tuto Logo"
            width={140}
            height={40}
            className="object-contain"
            priority
            unoptimized={process.env.NODE_ENV === "production"}
          />
        </Link>

        {/* Logo centrado */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/Logos/LibreLogo.png`}
            alt="Libre Logo"
            width={110}
            height={40}
            className="object-contain"
            priority
            unoptimized={process.env.NODE_ENV === "production"}
          />
        </div>

        {/* Desktop menu */}
        <ul className="hidden md:flex gap-6 text-[#123488] font-semibold text-base items-center">
          {!session?.user ? (
            <>
              <li>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 hover:text-[#da0b0a] transition-colors"
                >
                  <AiOutlineLogin size={20} />
                  Iniciar sesión
                </Link>
              </li>
            </>
          ) : (
            <li>
              <SignOutButton />
            </li>
          )}
        </ul>

        {/* Mobile menu */}
        <details className="md:hidden relative group">
          <summary className="cursor-pointer text-[#123488] font-semibold text-sm">
            ☰ Menú
          </summary>
          <ul className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-2 text-sm">
            {!session?.user ? (
              <li>
                <Link
                  href="/auth/login"
                  className="block px-4 py-2 hover:bg-gray-100 text-[#123488]"
                >
                  <AiOutlineLogin className="inline mr-1" />
                  Iniciar sesión
                </Link>
              </li>
            ) : (
              <li className="px-4 py-2">
                <SignOutButton />
              </li>
            )}
          </ul>
        </details>
      </div>
    </nav>
  );
}