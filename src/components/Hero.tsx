// Ember & Olive: Hero Section
// High visual impact, responsive editorial hierarchy, and dual call-to-action

import React from 'react';
import { CalendarIcon, ClockIcon, MapPinIcon, FlameIcon } from './Icons.tsx';

interface HeroProps {
  onReserveClick: () => void;
  onMenuClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onReserveClick, onMenuClick }) => {
  return (
    <section
      className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden bg-[#3D4D36] text-white"
      aria-labelledby="hero-title"
    >
      {/* Decorative Warm Ambient Glow Overlay */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 75% 25%, #C85A32 0%, transparent 55%), radial-gradient(circle at 15% 85%, #2D3A28 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* Subtle Pattern Grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FAF8F5] text-xs sm:text-sm font-medium tracking-wide uppercase mb-6">
            <span className="text-[#C85A32]">
              <FlameIcon size={16} />
            </span>
            <span>Wood-Fired Hearth & Seasonal Cellar</span>
          </div>

          {/* Main Title */}
          <h1
            id="hero-title"
            className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#FAF8F5] mb-6 leading-tight"
          >
            Ember & Olive
          </h1>

          {/* Subtitle / Intro Narrative */}
          <p className="text-lg sm:text-xl text-[#FAF8F5]/85 leading-relaxed font-light mb-10 max-w-2xl">
            Where the raw coastal harvest of the Pacific Northwest meets the ancient,
            elemental warmth of the Mediterranean hearth. Seasoned olive wood embers,
            handcrafted coastal dishes, and low-intervention biodynamic wines.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 mb-14">
            <button
              type="button"
              onClick={onReserveClick}
              className="btn btn-primary text-base px-8 py-3.5 shadow-lg hover:shadow-xl focus-visible:ring-offset-[#3D4D36]"
            >
              <CalendarIcon size={18} />
              <span>Reserve a Table</span>
            </button>
            <button
              type="button"
              onClick={onMenuClick}
              className="btn btn-outline-white text-base px-8 py-3.5 focus-visible:ring-offset-[#3D4D36]"
            >
              <span>Explore Menu</span>
            </button>
          </div>

          {/* Quick Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/20 text-xs sm:text-sm text-[#FAF8F5]/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/10 text-[#C85A32]">
                <ClockIcon size={18} />
              </div>
              <div>
                <p className="font-semibold text-white">Daily Hours</p>
                <p className="text-white/70">Lunch 12–2:30 • Dinner 5–10</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/10 text-[#C85A32]">
                <MapPinIcon size={18} />
              </div>
              <div>
                <p className="font-semibold text-white">Location</p>
                <p className="text-white/70">418 Olive Way, Seattle</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/10 text-[#C85A32]">
                <FlameIcon size={18} />
              </div>
              <div>
                <p className="font-semibold text-white">Culinary Heart</p>
                <p className="text-white/70">Live Olive Wood Hearth</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
