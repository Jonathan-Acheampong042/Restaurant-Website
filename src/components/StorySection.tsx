// Ember & Olive: Culinary Story & Philosophy Section
// Rich brand storytelling highlighting wood-fired craft, seasonal sourcing, and cellar curation

import React from 'react';
import { FlameIcon, LeafIcon } from './Icons.tsx';

export const StorySection: React.FC = () => {
  return (
    <section id="story" className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#E5E0D8]" aria-labelledby="story-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-[#C85A32] font-semibold mb-2 block">
            Our Philosophy
          </span>
          <h2 id="story-heading" className="font-serif text-3xl sm:text-4xl text-[#1A1A18] font-bold mb-6">
            The Living Hearth & The Ancient Grove
          </h2>
          <p className="text-base sm:text-lg text-[#66645E] leading-relaxed">
            At Ember & Olive, cooking is an elemental ritual. Every dish is influenced
            by our custom hand-built masonry hearth, fueled exclusively by seasoned olive wood
            and native Northwest hardwoods.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Pillar 1: The Hearth */}
          <div className="bg-white p-8 rounded-xl border border-[#E5E0D8] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
            <div className="mb-4 rounded-lg overflow-hidden border border-[#E5E0D8]">
              <img src="/assets/hearth-olive-wood.svg" alt="Wood-fired hearth" className="w-full h-36 object-cover" width="600" height="400" loading="lazy" />
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#FAF8F5] text-[#C85A32] border border-[#E5E0D8] flex items-center justify-center mb-4">
              <FlameIcon size={24} />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1A1A18] mb-3">
              The Wood-Fired Hearth
            </h3>
            <p className="text-sm text-[#66645E] leading-relaxed">
              We cook over glowing coals of cured olive wood. The intense, fragrant heat seals in
              succulence, blistered coastal flatbreads, and releases aromatic smoke with subtle herbal sweetness.
            </p>
          </div>

          {/* Pillar 2: The Coast & Soil */}
          <div className="bg-white p-8 rounded-xl border border-[#E5E0D8] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
            <div className="mb-4 rounded-lg overflow-hidden border border-[#E5E0D8]">
              <img src="/assets/signature-flatbread.svg" alt="Mediterranean flatbread & olive oil" className="w-full h-36 object-cover" width="600" height="400" loading="lazy" />
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#FAF8F5] text-[#3D4D36] border border-[#E5E0D8] flex items-center justify-center mb-4">
              <LeafIcon size={24} />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1A1A18] mb-3">
              Pacific & Mediterranean
            </h3>
            <p className="text-sm text-[#66645E] leading-relaxed">
              We marry cold-water Northwest fisheries and Skagit Valley heirloom produce with
              first-cold-pressed single-estate olive oils from Crete, hand-harvested sea salt, and wild oregano.
            </p>
          </div>

          {/* Pillar 3: The Cellar */}
          <div className="bg-white p-8 rounded-xl border border-[#E5E0D8] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
            <div className="mb-4 rounded-lg overflow-hidden border border-[#E5E0D8]">
              <img src="/assets/signature-cellar.svg" alt="Natural & biodynamic wine cellar" className="w-full h-36 object-cover" width="600" height="400" loading="lazy" />
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#FAF8F5] text-[#C85A32] border border-[#E5E0D8] flex items-center justify-center mb-4">
              <span className="font-serif text-2xl font-bold text-[#C85A32]">🍷</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1A1A18] mb-3">
              The Seasonal Cellar
            </h3>
            <p className="text-sm text-[#66645E] leading-relaxed">
              Our wine program champions low-intervention biodynamic and organic vignerons from Mount Etna,
              Santorini, the Peloponnese, and coastal Iberian hillsides, alongside Washington natural wines.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
