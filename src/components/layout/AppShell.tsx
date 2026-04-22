"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { SearchBar } from "@/components/search/SearchBar";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Your Library", icon: Library },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden bg-[#121212] text-white">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[240px] border-r border-white/5 bg-black px-4 py-6 md:block">
        <Link href="/" className="mb-7 block text-2xl font-bold tracking-tight">
          Vartify
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden md:ml-[240px]">
        <header
          className={`sticky top-0 z-30 px-4 py-4 sm:px-6 lg:px-8 ${
            isScrolled ? "bg-[#121212]/95 backdrop-blur" : "bg-transparent"
          }`}
        >
          <SearchBar />
        </header>
        <div className="flex-1 overflow-y-auto pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
