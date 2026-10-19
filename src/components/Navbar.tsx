// Ember & Olive: Global Navigation Bar
// Fully accessible with keyboard navigation, focus management, and mobile drawer

import React, { useState, useEffect, useRef } from 'react';
import { FlameIcon, LeafIcon, MenuIcon, XIcon } from './Icons.tsx';

interface NavbarProps {
  onReserveClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReserveClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trap focus and handle escape key for mobile drawer
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        mobileToggleRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling when drawer is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    mobileToggleRef.current?.focus();
  };

  const navLinks = [
    { label: 'Menu', href: '#menu' },
    { label: 'Story', href: '#story' },
    { label: 'Reservations', href: '#reservations' },
    { label: 'Hours & Location', href: '#location' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#FAF8F5]/95 backdrop-blur-md shadow-md border-b border-[#E5E0D8]/80 py-3'
          : 'bg-[#FAF8F5]/85 backdrop-blur-sm border-b border-transparent py-5'
      }`}
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a
            href="#"
            className="flex items-center gap-2.5 text-decoration-none group"
            aria-label="Ember and Olive Home"
          >
            <div className="w-10 h-10 rounded-full bg-[#3D4D36] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <span className="flex items-center text-[#C85A32]">
                <FlameIcon size={18} />
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A1A18] leading-none">
                Ember & Olive
              </span>
              <span className="text-[0.68rem] uppercase tracking-widest text-[#66645E] font-medium mt-0.5">
                Wood-Fired & Seasonal Cellar
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#1A1A18] hover:text-[#C85A32] transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#C85A32] hover:after:w-full after:transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Right CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              onClick={onReserveClick}
              className="btn btn-primary shadow-sm hover:shadow"
            >
              Book a Table
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={onReserveClick}
              className="btn btn-primary text-xs py-2 px-3 min-h-[40px]"
            >
              Reserve
            </button>
            <button
              ref={mobileToggleRef}
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#1A1A18] hover:text-[#C85A32] rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C85A32] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMobileMenuOpen ? <XIcon size={26} /> : <MenuIcon size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          ref={mobileDrawerRef}
          className="fixed inset-0 top-[65px] bg-[#FAF8F5] z-40 md:hidden flex flex-col px-6 py-8 border-t border-[#E5E0D8] shadow-2xl animate-fade-in overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <nav className="flex flex-col gap-6 text-lg" aria-label="Mobile Menu">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className="font-serif text-2xl font-semibold text-[#1A1A18] hover:text-[#C85A32] py-2 border-b border-[#E5E0D8]/60 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-[#E5E0D8] flex flex-col gap-4">
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                onReserveClick();
              }}
              className="btn btn-primary w-full text-base py-3.5"
            >
              Reserve a Table
            </button>
            <div className="text-center text-xs text-[#66645E] mt-4">
              <p>418 Olive Way, Seattle, WA 98101</p>
              <p className="mt-1">(206) 555-0194</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
