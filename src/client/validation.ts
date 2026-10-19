// Ember & Olive: Client-Side Reservation Form Validator
// Enforces validation rules matching .team/CONTRACTS.md Section 4.3 and backend validation

import type { ReservationRequest } from '../../types/shared.ts';

export const VALID_SERVICE_TIMES = [
  // Lunch slots
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  // Dinner slots
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

export const VALID_SERVICE_TIMES_SET = new Set(VALID_SERVICE_TIMES);

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface ValidationResult<T> {
  isValid: boolean;
  errors: Record<string, string>;
  data?: T;
}

/**
 * Validates a reservation request input object.
 * Returns field-level errors and sanitized data.
 */
export function validateReservationForm(
  input: Partial<ReservationRequest>,
  todayOverride?: string
): ValidationResult<ReservationRequest> {
  const errors: Record<string, string> = {};

  // 1. customerName: 2 to 100 characters
  const rawName = input.customerName;
  let sanitizedName = '';
  if (!rawName || typeof rawName !== 'string' || rawName.trim().length < 2 || rawName.trim().length > 100) {
    errors.customerName = 'Customer name must be between 2 and 100 characters';
  } else {
    sanitizedName = rawName.trim();
  }

  // 2. email: valid email address
  const rawEmail = input.email;
  let sanitizedEmail = '';
  if (!rawEmail || typeof rawEmail !== 'string' || !EMAIL_REGEX.test(rawEmail.trim())) {
    errors.email = 'Invalid email address format (e.g. name@example.com)';
  } else {
    sanitizedEmail = rawEmail.trim().toLowerCase();
  }

  // 3. phone: at least 7 digits
  const rawPhone = input.phone;
  let sanitizedPhone = '';
  if (!rawPhone || typeof rawPhone !== 'string') {
    errors.phone = 'Valid telephone number is required';
  } else {
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      errors.phone = 'Phone number must contain at least 7 digits';
    } else {
      sanitizedPhone = rawPhone.trim();
    }
  }

  // 4. reservationDate: YYYY-MM-DD, cannot be in past, cannot be > 90 days
  const rawDate = input.reservationDate;
  let sanitizedDate = '';
  if (!rawDate || typeof rawDate !== 'string' || !DATE_REGEX.test(rawDate)) {
    errors.reservationDate = 'Please select a valid date in YYYY-MM-DD format';
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
      const todayStr = todayOverride || new Date().toISOString().split('T')[0];
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

  // 5. reservationTime: must be in VALID_SERVICE_TIMES_SET
  const rawTime = input.reservationTime;
  let sanitizedTime = '';
  if (!rawTime || typeof rawTime !== 'string' || !VALID_SERVICE_TIMES_SET.has(rawTime.trim())) {
    errors.reservationTime = 'Please select an available service time slot (Lunch 12:00–14:30 or Dinner 17:00–21:30)';
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
    errors.partySize = 'Party size must be an integer between 1 and 12 guests';
  } else {
    sanitizedPartySize = rawPartySize;
  }

  // 7. specialRequest: optional string, max 500 chars
  let sanitizedSpecialRequest: string | undefined = undefined;
  if (input.specialRequest !== undefined && input.specialRequest !== null && input.specialRequest !== '') {
    if (typeof input.specialRequest !== 'string') {
      errors.specialRequest = 'Special request must be text';
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
