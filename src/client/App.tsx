// Ember & Olive: Main Application Container
// Coordinates layout, data loading, navigation anchors, and global accessibility features

import React, { useState, useEffect, useCallback } from 'react';
import type { MenuCategory, MenuItem, RestaurantInfo, Reservation } from '../../types/shared.ts';
import { fetchMenu, fetchRestaurantInfo } from './api.ts';
import { MOCK_RESTAURANT_INFO } from './mockData.ts';
import { Navbar } from '../components/Navbar.tsx';
import { Hero } from '../components/Hero.tsx';
import { StorySection } from '../components/StorySection.tsx';
import { MenuSection } from '../components/MenuSection.tsx';
import { ReservationSection } from '../components/ReservationSection.tsx';
import { RestaurantInfoSection } from '../components/RestaurantInfoSection.tsx';
import { Footer } from '../components/Footer.tsx';

export const App: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(MOCK_RESTAURANT_INFO);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);
  const [menuError, setMenuError] = useState<string | null>(null);

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
      // Set focus to the section's heading for screen readers
      const heading = el.querySelector('h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
  };

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
