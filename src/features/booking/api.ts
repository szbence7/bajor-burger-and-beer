import { createServerFn } from "@tanstack/react-start";
import { getAvailableSlots, submitReservation } from "@/server/booking";
import { getClientIp } from "@/server/request";
import { availabilityInput, reservationInput } from "./schema";

export const getAvailability = createServerFn({ method: "GET" })
  .inputValidator(availabilityInput)
  .handler(({ data }) => getAvailableSlots(data.date, data.partySize));

export const createReservation = createServerFn({ method: "POST" })
  .inputValidator(reservationInput)
  .handler(({ data }) => submitReservation(data, getClientIp()));
