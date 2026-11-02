import { createMiddleware, createServerFn } from "@tanstack/react-start";
import {
  deleteSpecial,
  reorderSpecials,
  resendNotification,
  saveSpecial,
  setMenuPdf,
  setReservationStatus,
} from "@/server/admin";
import { getBearerToken } from "@/server/request";
import { idInput, menuPdfInput, reorderInput, setStatusInput, specialInput } from "./schema";
import { accessToken } from "./supabase";

/** Sends the admin's access token with every admin server function call. */
const adminAuth = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const token = await accessToken();
    return next({ headers: token ? { authorization: `Bearer ${token}` } : {} });
  })
  .server(({ next }) => next({ context: { token: getBearerToken() } }));

const unauthorized = { ok: false, error: "unauthorized" } as const;

export const setReservationStatusFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(setStatusInput)
  .handler(({ data, context }) =>
    context.token ? setReservationStatus(context.token, data) : unauthorized,
  );

export const resendNotificationFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(idInput)
  .handler(({ data, context }) =>
    context.token ? resendNotification(context.token, data.id) : unauthorized,
  );

export const saveSpecialFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(specialInput)
  .handler(({ data, context }) =>
    context.token ? saveSpecial(context.token, data) : unauthorized,
  );

export const deleteSpecialFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(idInput)
  .handler(({ data, context }) =>
    context.token ? deleteSpecial(context.token, data.id) : unauthorized,
  );

export const reorderSpecialsFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(reorderInput)
  .handler(({ data, context }) =>
    context.token ? reorderSpecials(context.token, data.ids) : unauthorized,
  );

export const setMenuPdfFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(menuPdfInput)
  .handler(({ data, context }) =>
    context.token ? setMenuPdf(context.token, data.path) : unauthorized,
  );
