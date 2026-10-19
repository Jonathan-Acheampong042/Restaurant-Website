// Ember & Olive: Restaurant Information Section
// Authoritative hours, location, contact, and transport access details

import React from 'react';
import type { RestaurantInfo } from '../../types/shared.ts';
import { ClockIcon, MapPinIcon, PhoneIcon, MailIcon } from './Icons.tsx';

interface RestaurantInfoSectionProps {
  info: RestaurantInfo;
  onReserveClick: () => void;
}

export const RestaurantInfoSection: React.FC<RestaurantInfoSectionProps> = ({
  info,
  onReserveClick,
}) => {
  return (
    <section
      id="location"
      className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#E5E0D8]"
      aria-labelledby="info-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-[#C85A32] font-semibold mb-2 block">
            Visit Ember & Olive
          </span>
          <h2
            id="info-heading"
            className="font-serif text-3xl sm:text-5xl text-[#1A1A18] font-bold mb-4"
          >
            Hours & Location
          </h2>
          <p className="text-base sm:text-lg text-[#66645E]">
            Conveniently situated in downtown Seattle, steps from Pike Place Market and Westlake.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Operating Hours Card */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E5E0D8] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] text-[#3D4D36] border border-[#E5E0D8] flex items-center justify-center mb-6">
                <ClockIcon size={24} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1A1A18] mb-6">
                Service Hours
              </h3>

              <div className="space-y-6">
                {/* Lunch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E0D8]/60 gap-1">
                  <div>
                    <h4 className="font-bold text-base text-[#1A1A18]">Midday Hearth & Meze</h4>
                    <p className="text-xs text-[#66645E]">{info.hours.lunch.days}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-[#3D4D36] bg-[#EDF1EC] px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-center">
                    {info.hours.lunch.hours}
                  </span>
                </div>

                {/* Dinner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E0D8]/60 gap-1">
                  <div>
                    <h4 className="font-bold text-base text-[#1A1A18]">Evening Hearth & Cellar</h4>
                    <p className="text-xs text-[#66645E]">{info.hours.dinner.days}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-[#3D4D36] bg-[#EDF1EC] px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-center">
                    {info.hours.dinner.hours}
                  </span>
                </div>

                {/* Mondays Closed Notice */}
                <div className="flex items-center justify-between text-xs text-[#66645E] pt-1">
                  <span>Mondays</span>
                  <span className="italic font-medium text-[#C85A32]">
                    Closed for hearth conditioning & foraging
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E5E0D8]">
              <button
                type="button"
                onClick={onReserveClick}
                className="btn btn-primary w-full text-sm py-3"
              >
                Book a Table Now
              </button>
            </div>
          </div>

          {/* Location & Contact Card */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E5E0D8] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] text-[#C85A32] border border-[#E5E0D8] flex items-center justify-center mb-6">
                <MapPinIcon size={24} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1A1A18] mb-6">
                Location & Inquiries
              </h3>

              <div className="space-y-5">
                {/* Address */}
                <div className="flex items-start gap-3.5">
                  <span className="text-[#3D4D36] mt-1 shrink-0">
                    <MapPinIcon size={20} />
                  </span>
                  <div>
                    <h4 className="font-semibold text-sm text-[#1A1A18]">Address</h4>
                    <p className="text-sm text-[#66645E] leading-snug">{info.address}</p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(info.name + ' ' + info.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-semibold text-[#C85A32] hover:underline mt-1"
                    >
                      Get Directions on Google Maps ↗
                    </a>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-3.5">
                  <span className="text-[#3D4D36] mt-1 shrink-0">
                    <PhoneIcon size={20} />
                  </span>
                  <div>
                    <h4 className="font-semibold text-sm text-[#1A1A18]">Telephone</h4>
                    <a
                      href={`tel:${info.phone.replace(/\D/g, '')}`}
                      className="text-sm text-[#66645E] hover:text-[#C85A32] font-mono transition-colors"
                    >
                      {info.phone}
                    </a>
                    <p className="text-xs text-[#66645E] mt-0.5">Hospitality & Large Party Inquiries</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <span className="text-[#3D4D36] mt-1 shrink-0">
                    <MailIcon size={20} />
                  </span>
                  <div>
                    <h4 className="font-semibold text-sm text-[#1A1A18]">Hospitality Email</h4>
                    <a
                      href={`mailto:${info.email}`}
                      className="text-sm text-[#66645E] hover:text-[#C85A32] transition-colors"
                    >
                      {info.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Parking & Transit Information */}
            <div className="mt-8 pt-6 border-t border-[#E5E0D8] text-xs text-[#66645E] space-y-1">
              <p>
                <strong>Transit:</strong> 2 blocks from Westlake Light Rail Station.
              </p>
              <p>
                <strong>Parking:</strong> Validated evening garage parking available at 4th & Olive.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
