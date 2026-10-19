// Ember & Olive: Main Application Container
// Coordinates layout, data loading, navigation anchors, custom 404 fallback, and accessibility

import React, { useState, useEffect, useCallback } from 'react';
import type { MenuCategory, MenuItem, RestaurantInfo } from '../../types/shared.ts';
import { fetchMenu, fetchRestaurantInfo } from './api.ts';
import { MOCK_RESTAURANT_INFO } from './mockData.ts';
import { Navbar } from '../components/Navbar.tsx';
import { Hero } from '../components/Hero.tsx';
import { StorySection } from '../components/StorySection.tsx';
import { MenuSection } from '../components/MenuSection.tsx';
import { ReservationSection } from '../components/ReservationSection.tsx';
import { RestaurantInfoSection } from '../components/RestaurantInfoSection.tsx';
import { Footer } from '../components/Footer.tsx';
import { FlameIcon } from '../components/Icons.tsx';

export const App: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(MOCK_RESTAURANT_INFO);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  // Client-side route detection for 404 fallback handling
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Load menu and restaurant info on initial render
  const loadData = useCallback(async () => {
    setIsLoadingMenu(true);
    setMenuError(null);

    try {
      const [menuRes, infoRes] = await Promise.all([
        fetchMenu(),
        fetchRestaurantInfo(),
      ]);

      setCategories(menuRes.data.categories);
      setItems(menuRes.data.items);
      setRestaurantInfo(infoRes.data);
    } catch (err) {
      setMenuError('Failed to load menu data. Please try again.');
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Smooth scroll helpers
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const heading = el.querySelector('h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
  };

  const navigateToHome = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
    }
  };

  // Dedicated 404 Route Fallback
  const isKnownRoute = currentPath === '/' || currentPath === '' || currentPath.startsWith('/#') || currentPath === '/index.html';
  if (!isKnownRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1A1A18]">
        <header className="py-6 px-4 bg-white border-b border-[#E5E0D8]">
          <div className="container mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={navigateToHome}
              className="flex items-center gap-2.5 text-left"
            >
              <div className="w-9 h-9 rounded-full bg-[#3D4D36] flex items-center justify-center text-[#C85A32]">
                <FlameIcon size={18} />
              </div>
              <span className="font-serif text-xl font-bold text-[#1A1A18]">Ember &amp; Olive</span>
            </button>
            <button
              type="button"
              onClick={navigateToHome}
              className="btn btn-secondary text-xs py-2 px-4"
            >
              Back to Home
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6 text-center" role="main">
          <div className="max-w-md bg-white p-8 sm:p-12 rounded-3xl border border-[#E5E0D8] shadow-sm">
            <span className="font-mono text-sm uppercase tracking-widest text-[#C85A32] font-bold block mb-2">
              404 — Page Not Found
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A18] mb-4">
              Table Not Found
            </h1>
            <p className="text-sm text-[#66645E] leading-relaxed mb-8">
              The hearth has many paths, but the page you are seeking does not exist or has been moved.
            </p>
            <button
              type="button"
              onClick={navigateToHome}
              className="btn btn-primary text-sm py-3 px-8 shadow"
            >
              Return to Hearth &amp; Table
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1A1A18]">
      {/* Skip to Main Content Link for Keyboard / Screen Reader Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Global Navbar */}
      <Navbar onReserveClick={() => scrollToSection('reservations')} />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {/* 1. Hero Section */}
        <Hero
          onReserveClick={() => scrollToSection('reservations')}
          onMenuClick={() => scrollToSection('menu')}
        />

        {/* 2. Story & Philosophy Section */}
        <StorySection />

        {/* 3. Interactive Menu Section with Dietary Filters */}
        <MenuSection
          categories={categories}
          items={items}
          isLoading={isLoadingMenu}
          error={menuError}
          onRetry={loadData}
        />

        {/* 4. Table Reservation Module */}
        <ReservationSection />

        {/* 5. Restaurant Info & Location Section */}
        <RestaurantInfoSection
          info={restaurantInfo}
          onReserveClick={() => scrollToSection('reservations')}
        />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
