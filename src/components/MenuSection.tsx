// Ember & Olive: Interactive Menu Component
// Supports category tabs, dietary filtering, search, loading skeletons, and empty state

import React, { useState, useMemo } from 'react';
import type { MenuCategory, MenuItem, DietaryTag } from '../../types/shared.ts';
import { FilterIcon, XIcon } from './Icons.tsx';

interface MenuSectionProps {
  categories: MenuCategory[];
  items: MenuItem[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const DIETARY_LABELS: Record<DietaryTag, { label: string; full: string; className: string }> = {
  V: { label: 'V', full: 'Vegetarian', className: 'badge-dietary-v' },
  VG: { label: 'VG', full: 'Vegan', className: 'badge-dietary-vg' },
  GF: { label: 'GF', full: 'Gluten-Free', className: 'badge-dietary-gf' },
  DF: { label: 'DF', full: 'Dairy-Free', className: 'badge-dietary-df' },
  N: { label: 'N', full: 'Contains Nuts', className: 'badge-dietary-n' },
};

export const MenuSection: React.FC<MenuSectionProps> = ({
  categories,
  items,
  isLoading,
  error,
  onRetry,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<Set<DietaryTag>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleDietaryTag = (tag: DietaryTag) => {
    setSelectedDietaryTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedDietaryTags(new Set());
    setSearchQuery('');
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Category filter
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }

      // 2. Dietary filter (must have all selected tags)
      if (selectedDietaryTags.size > 0) {
        for (const tag of selectedDietaryTags) {
          if (!item.dietaryTags.includes(tag)) {
            return false;
          }
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, selectedDietaryTags, searchQuery]);

  return (
    <section id="menu" className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#E5E0D8]" aria-labelledby="menu-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-[#C85A32] font-semibold mb-2 block">
            Hearth-Fired Selections
          </span>
          <h2 id="menu-heading" className="font-serif text-3xl sm:text-5xl text-[#1A1A18] font-bold mb-4">
            Seasonal Dining Menu
          </h2>
          <p className="text-base sm:text-lg text-[#66645E]">
            Our menu evolves with the Pacific Northwest seasons and daily fish harvests.
            Each dish is prepared over live olive wood embers.
          </p>
        </div>

        {/* Category Navigation Bar (Sticky or Horizontal Scrollable) */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 mb-6 scrollbar-none gap-2" role="tablist" aria-label="Menu Categories">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            className={`btn text-sm whitespace-nowrap px-5 py-2.5 rounded-full transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#3D4D36] text-white shadow-sm'
                : 'bg-white text-[#1A1A18] border border-[#E5E0D8] hover:border-[#3D4D36]'
            }`}
          >
            All Offerings
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`btn text-sm whitespace-nowrap px-5 py-2.5 rounded-full transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#3D4D36] text-white shadow-sm'
                  : 'bg-white text-[#1A1A18] border border-[#E5E0D8] hover:border-[#3D4D36]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E0D8] shadow-sm mb-12 max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Dietary Tags Chips */}
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Dietary Restrictions Filter">
              <span className="text-xs font-semibold text-[#66645E] flex items-center gap-1.5 mr-1">
                <FilterIcon size={14} />
                <span>Dietary:</span>
              </span>
              {(['GF', 'V', 'VG', 'DF', 'N'] as DietaryTag[]).map((tag) => {
                const info = DIETARY_LABELS[tag];
                const isActive = selectedDietaryTags.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDietaryTag(tag)}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#C85A32] text-white font-semibold shadow-sm ring-1 ring-[#C85A32]'
                        : 'bg-[#FAF8F5] text-[#1A1A18] border border-[#E5E0D8] hover:bg-[#EDF1EC]'
                    }`}
                  >
                    <span>{info.full}</span>
                    <span className="text-[10px] opacity-80 uppercase">({tag})</span>
                  </button>
                );
              })}
            </div>

            {/* Dish Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes or ingredients..."
                  aria-label="Search dishes or ingredients"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C85A32] text-[#1A1A18]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66645E] hover:text-[#1A1A18] p-1"
                    aria-label="Clear dish search"
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>

              {(selectedDietaryTags.size > 0 || searchQuery || selectedCategory !== 'all') && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-[#C85A32] hover:text-[#B04B26] font-medium underline px-2 py-1"
                  aria-label="Reset all filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Filter Announcement for Screen Readers */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Showing {filteredItems.length} menu items matching current filters.
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-center max-w-lg mx-auto my-8">
            <p className="text-sm text-[#B91C1C] font-medium mb-3">{error}</p>
            {onRetry && (
              <button type="button" onClick={onRetry} className="btn btn-secondary text-xs py-2 px-4">
                Try Again
              </button>
            )}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white p-6 rounded-xl border border-[#E5E0D8] shadow-sm flex flex-col gap-3">
                <div className="h-6 w-3/4 skeleton-shimmer" />
                <div className="h-4 w-full skeleton-shimmer" />
                <div className="h-4 w-2/3 skeleton-shimmer" />
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-12 skeleton-shimmer" />
                  <div className="h-5 w-12 skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Menu Items Grid */}
        {!isLoading && !error && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E0D8] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A18] leading-tight">
                      {item.name}
                    </h3>
                    <span className="font-mono text-lg font-bold text-[#3D4D36] whitespace-nowrap">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-[#66645E] leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                {/* Dietary Badges */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D8]/60 mt-auto">
                  <div className="flex flex-wrap items-center gap-1.5" aria-label="Dietary characteristics">
                    {item.dietaryTags.map((tag) => {
                      const tagInfo = DIETARY_LABELS[tag];
                      if (!tagInfo) return null;
                      return (
                        <span
                          key={tag}
                          className={`badge-dietary ${tagInfo.className}`}
                          title={tagInfo.full}
                          aria-label={tagInfo.full}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>

                  <span className="text-[11px] font-medium text-[#3D4D36] bg-[#EDF1EC] px-2.5 py-0.5 rounded-full">
                    Hearth Prepared
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredItems.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#E5E0D8] max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F5] text-[#C85A32] flex items-center justify-center mx-auto mb-4 border border-[#E5E0D8]">
              <FilterIcon size={28} />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#1A1A18] mb-2">
              No Dishes Found
            </h3>
            <p className="text-sm text-[#66645E] mb-6 max-w-sm mx-auto">
              No menu items match your active filters or search terms. Please adjust your criteria.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn btn-primary text-sm py-2 px-6"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
