// Ember & Olive: Reservation Request Validator
// Enforces validation rules defined in .team/CONTRACTS.md Section 4.3

import type { ReservationRequest, ValidationResult } from '../types.ts';

export const VALID_SERVICE_TIMES = new Set([
  // Lunch slots
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  // Dinner slots
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
]);

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates a reservation request payload.
 * Returns isValid, a map of field-specific error messages, and sanitized data if valid.
 */
export function validateReservationRequest(
  input: any,
  currentDateOverride?: string
): ValidationResult<ReservationRequest> {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      errors: {
        body: 'Request body must be a valid JSON object',
      },
    };
  }

  // 1. customerName: string, trim length between 2 and 100 characters
  const rawName = input.customerName;
  let sanitizedName = '';
  if (typeof rawName !== 'string' || rawName.trim().length < 2 || rawName.trim().length > 100) {
    errors.customerName = 'Customer name must be between 2 and 100 characters';
  } else {
    sanitizedName = rawName.trim();
  }

  // 2. email: valid email format
  const rawEmail = input.email;
  let sanitizedEmail = '';
  if (typeof rawEmail !== 'string' || !EMAIL_REGEX.test(rawEmail.trim())) {
    errors.email = 'Invalid email address format';
  } else {
    sanitizedEmail = rawEmail.trim().toLowerCase();
  }

  // 3. phone: valid phone string with at least 7 digits
  const rawPhone = input.phone;
  let sanitizedPhone = '';
  if (typeof rawPhone !== 'string') {
    errors.phone = 'Valid phone number is required';
  } else {
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      errors.phone = 'Phone number must contain at least 7 digits';
    } else {
      sanitizedPhone = rawPhone.trim();
    }
  }

  // 4. reservationDate: YYYY-MM-DD, cannot be in past, cannot be > 90 days out
  const rawDate = input.reservationDate;
  let sanitizedDate = '';
  if (typeof rawDate !== 'string' || !DATE_REGEX.test(rawDate)) {
    errors.reservationDate = 'Invalid date format, expected YYYY-MM-DD';
  } else {
    const [year, month, day] = rawDate.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      errors.reservationDate = 'Reservation date is not a valid calendar date';
    } else {
      // Determine today's date in YYYY-MM-DD
      const todayStr = currentDateOverride || new Date().toISOString().split('T')[0];
      const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
      const todayUtc = new Date(Date.UTC(tYear, tMonth - 1, tDay));

      const diffMs = parsedDate.getTime() - todayUtc.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        errors.reservationDate = 'Reservation date cannot be in the past';
      } else if (diffDays > 90) {
        errors.reservationDate = 'Reservation date cannot be more than 90 days in the future';
      } else {
        sanitizedDate = rawDate;
      }
    }
  }

  // 5. reservationTime: HH:mm, must match restaurant service hours
  const rawTime = input.reservationTime;
  let sanitizedTime = '';
  if (typeof rawTime !== 'string' || !VALID_SERVICE_TIMES.has(rawTime.trim())) {
    errors.reservationTime = 'Reservation time must be within service hours';
  } else {
    sanitizedTime = rawTime.trim();
  }

  // 6. partySize: integer between 1 and 12
  const rawPartySize = input.partySize;
  let sanitizedPartySize = 0;
  if (
    typeof rawPartySize !== 'number' ||
    !Number.isInteger(rawPartySize) ||
    rawPartySize < 1 ||
    rawPartySize > 12
  ) {
    errors.partySize = 'Party size must be an integer between 1 and 12';
  } else {
    sanitizedPartySize = rawPartySize;
  }

  // 7. specialRequest: optional string, max 500 chars
  let sanitizedSpecialRequest: string | undefined = undefined;
  if (input.specialRequest !== undefined && input.specialRequest !== null) {
    if (typeof input.specialRequest !== 'string') {
      errors.specialRequest = 'Special request must be a string';
    } else if (input.specialRequest.length > 500) {
      errors.specialRequest = 'Special request cannot exceed 500 characters';
    } else {
      sanitizedSpecialRequest = input.specialRequest.trim() || undefined;
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          customerName: sanitizedName,
          email: sanitizedEmail,
          phone: sanitizedPhone,
          reservationDate: sanitizedDate,
          reservationTime: sanitizedTime,
          partySize: sanitizedPartySize,
          specialRequest: sanitizedSpecialRequest,
        }
      : undefined,
  };
}
