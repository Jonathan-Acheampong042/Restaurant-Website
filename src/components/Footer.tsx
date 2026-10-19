// Ember & Olive: Site Footer
// Includes navigation links, hours recap, accessibility statement, and copyright

import React from 'react';
import { FlameIcon } from './Icons.tsx';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1A1A18] text-[#FAF8F5] pt-16 pb-12 border-t border-[#3D4D36]" role="contentinfo">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#3D4D36] flex items-center justify-center text-[#C85A32]">
                <FlameIcon size={16} />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                Ember & Olive
              </span>
            </div>
            <p className="text-sm text-[#FAF8F5]/70 max-w-sm leading-relaxed">
              Wood-fired Mediterranean cuisine and seasonal cellar in downtown Seattle.
              Celebrating ancient olive wood embers, coastal Northwest fisheries, and low-intervention wines.
            </p>
            <p className="text-xs text-[#FAF8F5]/50">
              418 Olive Way, Seattle, WA 98101 • (206) 555-0194
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-base font-semibold text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-[#FAF8F5]/75">
              <li>
                <a href="#menu" className="hover:text-[#C85A32] transition-colors">
                  Seasonal Menu
                </a>
              </li>
              <li>
                <a href="#story" className="hover:text-[#C85A32] transition-colors">
                  Hearth & Philosophy
                </a>
              </li>
              <li>
                <a href="#reservations" className="hover:text-[#C85A32] transition-colors">
                  Table Reservations
                </a>
              </li>
              <li>
                <a href="#location" className="hover:text-[#C85A32] transition-colors">
                  Hours & Directions
                </a>
              </li>
            </ul>
          </div>

          {/* Service Hours Summary */}
          <div>
            <h4 className="font-serif text-base font-semibold text-white mb-4">
              Service Hours
            </h4>
            <div className="space-y-2 text-xs text-[#FAF8F5]/75">
              <div>
                <p className="font-semibold text-white">Lunch Service</p>
                <p>Tue – Sun: 12:00 PM – 2:30 PM</p>
              </div>
              <div>
                <p className="font-semibold text-white">Dinner Service</p>
                <p>Tue – Sun: 5:00 PM – 10:00 PM</p>
              </div>
              <div>
                <p className="font-semibold text-[#C85A32]">Mondays</p>
                <p>Closed for Hearth Rest</p>
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility Statement & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#FAF8F5]/60 gap-4">
          <div className="text-center md:text-left">
            <p>
              © {new Date().getFullYear()} Ember & Olive Restaurant. All rights reserved.
            </p>
            <p className="mt-1 text-[11px] text-[#FAF8F5]/45">
              Committed to digital accessibility per WCAG 2.1 Level AA standards. For assistance, contact hospitality@emberandolive.com.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <a href="#menu" className="hover:text-white transition-colors">Menu</a>
            <a href="#reservations" className="hover:text-white transition-colors">Reservations</a>
            <a href="#location" className="hover:text-white transition-colors">Directions</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
