// Ember & Olive: Reservation Form Component
// Two-step guided flow, full WCAG 2.1 AA accessibility, strict validation, and input preservation

import React, { useState, useId } from 'react';
import type { ReservationRequest, Reservation } from '../../types/shared.ts';
import { validateReservationForm, VALID_SERVICE_TIMES } from '../client/validation.ts';
import { submitReservation } from '../client/api.ts';
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  FlameIcon,
} from './Icons.tsx';

interface ReservationSectionProps {
  onSuccess?: (res: Reservation) => void;
}

export const ReservationSection: React.FC<ReservationSectionProps> = ({ onSuccess }) => {
  // Form State
  const [partySize, setPartySize] = useState<number>(2);
  const [reservationDate, setReservationDate] = useState<string>(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });
  const [reservationTime, setReservationTime] = useState<string>('19:00');
  const [customerName, setCustomerName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [specialRequest, setSpecialRequest] = useState<string>('');

  // UI Flow State
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  // Accessible IDs
  const formId = useId();
  const nameErrorId = `${formId}-name-error`;
  const emailErrorId = `${formId}-email-error`;
  const phoneErrorId = `${formId}-phone-error`;
  const dateErrorId = `${formId}-date-error`;
  const timeErrorId = `${formId}-time-error`;
  const partyErrorId = `${formId}-party-error`;

  // Date limits: Min = today, Max = 90 days out
  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const lunchSlots = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'];
  const dinnerSlots = [
    '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30',
    '21:00', '21:30',
  ];

  // Validate step 1 before proceeding
  const handleNextStep = () => {
    const partialResult = validateReservationForm({
      customerName: 'Placeholder Name', // Bypass guest details for step 1
      email: 'test@example.com',
      phone: '206-555-0100',
      reservationDate,
      reservationTime,
      partySize,
    });

    const step1Errors: Record<string, string> = {};
    if (partialResult.errors.reservationDate) step1Errors.reservationDate = partialResult.errors.reservationDate;
    if (partialResult.errors.reservationTime) step1Errors.reservationTime = partialResult.errors.reservationTime;
    if (partialResult.errors.partySize) step1Errors.partySize = partialResult.errors.partySize;

    if (Object.keys(step1Errors).length > 0) {
      setErrors(step1Errors);
      return;
    }

    setErrors({});
    setServerError(null);
    setCurrentStep(2);
  };

  // Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const payload: ReservationRequest = {
      customerName,
      email,
      phone,
      reservationDate,
      reservationTime,
      partySize,
      specialRequest: specialRequest.trim() || undefined,
    };

    // Client-side validation
    const validation = validateReservationForm(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      // If error is in step 1 fields, jump to step 1
      if (validation.errors.reservationDate || validation.errors.reservationTime || validation.errors.partySize) {
        setCurrentStep(1);
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await submitReservation(payload);
      if (response.success && response.data) {
        setConfirmedReservation(response.data);
        if (onSuccess) onSuccess(response.data);
      } else if (response.error) {
        if (response.error.details) {
          setErrors(response.error.details);
        }
        setServerError(response.error.message || 'Unable to confirm reservation. Please check your information.');
      } else {
        setServerError('An unexpected error occurred while saving your reservation. Please try again.');
      }
    } catch (err) {
      setServerError('A network error occurred. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to book another table
  const handleReset = () => {
    setConfirmedReservation(null);
    setCurrentStep(1);
    setErrors({});
    setServerError(null);
    setCustomerName('');
    setEmail('');
    setPhone('');
    setSpecialRequest('');
    setPartySize(2);
    setReservationTime('19:00');
  };

  return (
    <section
      id="reservations"
      className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#E5E0D8]"
      aria-labelledby="reservations-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-[#C85A32] font-semibold mb-2 block">
            Table Reservations
          </span>
          <h2
            id="reservations-heading"
            className="font-serif text-3xl sm:text-5xl text-[#1A1A18] font-bold mb-4"
          >
            Join Us at the Hearth
          </h2>
          <p className="text-base sm:text-lg text-[#66645E]">
            We welcome reservations up to 90 days in advance. For parties of 8 or more,
            explore our private cellar dining experience.
          </p>
        </div>

        {/* Card Container */}
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#E5E0D8] shadow-md overflow-hidden">
          {/* Confirmed State Display */}
          {confirmedReservation ? (
            <div className="p-8 sm:p-12 text-center animate-fade-in" role="status" aria-live="polite">
              <div className="w-16 h-16 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC] flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon size={36} />
              </div>

              <h3 className="font-serif text-3xl font-bold text-[#1A1A18] mb-2">
                Reservation Confirmed
              </h3>
              <p className="text-sm text-[#66645E] mb-6">
                We have reserved your table at Ember & Olive. A confirmation has been sent to your email.
              </p>

              {/* Reference ID Pill */}
              <div className="inline-flex items-center gap-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-full px-5 py-2 text-sm font-mono text-[#3D4D36] mb-8">
                <span>Confirmation ID:</span>
                <span className="font-bold text-[#1A1A18]">{confirmedReservation.id}</span>
              </div>

              {/* Booking Details Recap */}
              <div className="bg-[#FAF8F5] rounded-2xl border border-[#E5E0D8] p-6 text-left mb-8 space-y-3">
                <div className="flex justify-between text-sm py-1 border-b border-[#E5E0D8]/60">
                  <span className="text-[#66645E]">Guest Name</span>
                  <span className="font-semibold text-[#1A1A18]">{confirmedReservation.customerName}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-[#E5E0D8]/60">
                  <span className="text-[#66645E]">Date & Time</span>
                  <span className="font-semibold text-[#1A1A18]">
                    {confirmedReservation.reservationDate} at {confirmedReservation.reservationTime}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-[#E5E0D8]/60">
                  <span className="text-[#66645E]">Party Size</span>
                  <span className="font-semibold text-[#1A1A18]">{confirmedReservation.partySize} Guests</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-[#E5E0D8]/60">
                  <span className="text-[#66645E]">Contact Details</span>
                  <span className="font-semibold text-[#1A1A18]">{confirmedReservation.email}</span>
                </div>
                {confirmedReservation.specialRequest && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-[#66645E]">Special Request</span>
                    <span className="font-medium text-[#1A1A18] italic">{confirmedReservation.specialRequest}</span>
                  </div>
                )}
              </div>

              {/* Policy note */}
              <p className="text-xs text-[#66645E] mb-8 leading-relaxed max-w-md mx-auto">
                Modifications or cancellations can be made up to 2 hours prior by calling
                our hospitality desk at (206) 555-0194 or replying to your confirmation email.
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary text-sm py-3 px-8"
              >
                Book Another Table
              </button>
            </div>
          ) : (
            /* Reservation Form */
            <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-10" aria-label="Table reservation form">
              {/* Step Indicator Header */}
              <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#E5E0D8]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      currentStep === 1
                        ? 'bg-[#3D4D36] text-white'
                        : 'bg-[#EDF1EC] text-[#3D4D36]'
                    }`}
                  >
                    1
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      currentStep === 1 ? 'text-[#1A1A18] font-bold' : 'text-[#66645E]'
                    }`}
                  >
                    Date & Party
                  </span>
                </div>

                <div className="w-12 h-0.5 bg-[#E5E0D8]" aria-hidden="true" />

                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      currentStep === 2
                        ? 'bg-[#3D4D36] text-white'
                        : 'bg-[#EDF1EC] text-[#66645E]'
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      currentStep === 2 ? 'text-[#1A1A18] font-bold' : 'text-[#66645E]'
                    }`}
                  >
                    Guest Details
                  </span>
                </div>
              </div>

              {/* Top-Level Server Error Banner */}
              {serverError && (
                <div
                  className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-start gap-3"
                  role="alert"
                >
                  <span className="text-[#B91C1C] mt-0.5">
                    <AlertCircleIcon size={20} />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#B91C1C]">Submission Error</h4>
                    <p className="text-xs text-[#B91C1C] mt-0.5">{serverError}</p>
                  </div>
                </div>
              )}

              {/* STEP 1: PARTY, DATE & TIME */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Party Size */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A18] mb-2.5">
                      <span className="flex items-center gap-2">
                        <UsersIcon size={18} />
                        <span>Party Size</span>
                      </span>
                    </label>
                    <div
                      className="grid grid-cols-4 sm:grid-cols-8 gap-2"
                      role="radiogroup"
                      aria-label="Party size in number of guests"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <button
                          key={num}
                          type="button"
                          role="radio"
                          aria-checked={partySize === num}
                          onClick={() => setPartySize(num)}
                          className={`btn py-2.5 text-sm font-bold rounded-xl transition-all ${
                            partySize === num
                              ? 'bg-[#3D4D36] text-white shadow-sm ring-2 ring-[#3D4D36]'
                              : 'bg-[#FAF8F5] text-[#1A1A18] border border-[#E5E0D8] hover:bg-[#EDF1EC]'
                          }`}
                        >
                          {num === 8 ? '8+' : num}
                        </button>
                      ))}
                    </div>
                    {partySize >= 8 && (
                      <p className="mt-2 text-xs text-[#C85A32] bg-[#FDF3EE] p-3 rounded-lg border border-[#E5E0D8]">
                        <strong>Large Party Note:</strong> Parties of 8 or more enjoy our Chef&apos;s
                        Mediterranean Hearth Tasting Menu. For custom private dining cellar events, contact
                        our hospitality desk directly at (206) 555-0194.
                      </p>
                    )}
                    {errors.partySize && (
                      <p id={partyErrorId} className="text-xs text-[#B91C1C] mt-1" role="alert">
                        {errors.partySize}
                      </p>
                    )}
                  </div>

                  {/* Reservation Date */}
                  <div>
                    <label htmlFor="res-date" className="block text-sm font-semibold text-[#1A1A18] mb-2">
                      <span className="flex items-center gap-2">
                        <CalendarIcon size={18} />
                        <span>Select Date</span>
                      </span>
                    </label>
                    <input
                      id="res-date"
                      type="date"
                      min={todayStr}
                      max={maxDateStr}
                      value={reservationDate}
                      onChange={(e) => setReservationDate(e.target.value)}
                      aria-invalid={!!errors.reservationDate}
                      aria-describedby={errors.reservationDate ? dateErrorId : undefined}
                      className={`w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border text-base text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#C85A32] ${
                        errors.reservationDate ? 'border-[#B91C1C]' : 'border-[#E5E0D8]'
                      }`}
                      required
                    />
                    <p className="text-xs text-[#66645E] mt-1">
                      Reservations are available up to 90 days in advance (through {maxDateStr}).
                    </p>
                    {errors.reservationDate && (
                      <p id={dateErrorId} className="text-xs text-[#B91C1C] mt-1" role="alert">
                        {errors.reservationDate}
                      </p>
                    )}
                  </div>

                  {/* Service Time Slots */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A18] mb-2">
                      <span className="flex items-center gap-2">
                        <ClockIcon size={18} />
                        <span>Service Time Slot</span>
                      </span>
                    </label>

                    {/* Lunch Service */}
                    <div className="mb-4">
                      <span className="text-xs font-semibold text-[#66645E] block mb-2 uppercase tracking-wider">
                        Lunch Service (12:00 PM – 2:30 PM)
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {lunchSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setReservationTime(slot)}
                            className={`py-2 px-2 text-xs font-mono font-medium rounded-lg border transition-all ${
                              reservationTime === slot
                                ? 'bg-[#3D4D36] text-white border-[#3D4D36] shadow-sm font-bold'
                                : 'bg-[#FAF8F5] text-[#1A1A18] border-[#E5E0D8] hover:bg-[#EDF1EC]'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dinner Service */}
                    <div>
                      <span className="text-xs font-semibold text-[#66645E] block mb-2 uppercase tracking-wider">
                        Dinner Service (5:00 PM – 10:00 PM)
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {dinnerSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setReservationTime(slot)}
                            className={`py-2 px-2 text-xs font-mono font-medium rounded-lg border transition-all ${
                              reservationTime === slot
                                ? 'bg-[#3D4D36] text-white border-[#3D4D36] shadow-sm font-bold'
                                : 'bg-[#FAF8F5] text-[#1A1A18] border-[#E5E0D8] hover:bg-[#EDF1EC]'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    {errors.reservationTime && (
                      <p id={timeErrorId} className="text-xs text-[#B91C1C] mt-2" role="alert">
                        {errors.reservationTime}
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="btn btn-primary w-full text-base py-3.5 shadow"
                    >
                      <span>Continue to Guest Details</span>
                      <ChevronRightIcon size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: GUEST DETAILS */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-fade-in">
                  {/* Reservation Recap Banner */}
                  <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E5E0D8] flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <p className="font-bold text-[#1A1A18]">
                        {reservationDate} at {reservationTime}
                      </p>
                      <p className="text-[#66645E]">{partySize} Guests</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-[#C85A32] font-semibold hover:underline"
                    >
                      Change Date/Time
                    </button>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label htmlFor="res-name" className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
                      Full Name <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      id="res-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      aria-required="true"
                      aria-invalid={!!errors.customerName}
                      aria-describedby={errors.customerName ? nameErrorId : undefined}
                      placeholder="e.g. Elena Vance"
                      className={`w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border text-base text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#C85A32] ${
                        errors.customerName ? 'border-[#B91C1C]' : 'border-[#E5E0D8]'
                      }`}
                      required
                    />
                    {errors.customerName && (
                      <p id={nameErrorId} className="text-xs text-[#B91C1C] mt-1" role="alert">
                        {errors.customerName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="res-email" className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
                      Email Address <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      id="res-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-required="true"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? emailErrorId : undefined}
                      placeholder="e.g. elena@example.com"
                      className={`w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border text-base text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#C85A32] ${
                        errors.email ? 'border-[#B91C1C]' : 'border-[#E5E0D8]'
                      }`}
                      required
                    />
                    {errors.email && (
                      <p id={emailErrorId} className="text-xs text-[#B91C1C] mt-1" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="res-phone" className="block text-sm font-semibold text-[#1A1A18] mb-1.5">
                      Phone Number <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      id="res-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      aria-required="true"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? phoneErrorId : undefined}
                      placeholder="e.g. (206) 555-0182"
                      className={`w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border text-base text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#C85A32] ${
                        errors.phone ? 'border-[#B91C1C]' : 'border-[#E5E0D8]'
                      }`}
                      required
                    />
                    {errors.phone && (
                      <p id={phoneErrorId} className="text-xs text-[#B91C1C] mt-1" role="alert">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Special Requests */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="res-notes" className="text-sm font-semibold text-[#1A1A18]">
                        Special Requests or Dietary Notes <span className="text-xs font-normal text-[#66645E]">(Optional)</span>
                      </label>
                      <span className="text-[11px] text-[#66645E]">
                        {specialRequest.length}/500
                      </span>
                    </div>
                    <textarea
                      id="res-notes"
                      rows={3}
                      maxLength={500}
                      value={specialRequest}
                      onChange={(e) => setSpecialRequest(e.target.value)}
                      placeholder="Celebrating an occasion? Dietary allergies or seating preferences?"
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-base text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="btn btn-secondary text-sm py-3.5 px-6"
                      disabled={isSubmitting}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                      className="btn btn-primary flex-1 text-base py-3.5 shadow"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner mr-2">
                            <FlameIcon size={18} />
                          </span>
                          <span>Securing Your Table...</span>
                        </>
                      ) : (
                        <span>Confirm Reservation</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
