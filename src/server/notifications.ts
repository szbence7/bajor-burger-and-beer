export interface NewReservation {
  date: string;
  time: string;
  partySize: number;
  name: string;
  phone: string;
  email: string;
  note: string;
}

/**
 * Hook point for notifications (e.g. a confirmation email to the guest and an alert to the
 * staff). Called after a reservation is stored; failures are logged and never fail the
 * booking. Not implemented yet.
 */
export async function onReservationCreated(_reservation: NewReservation): Promise<void> {}
