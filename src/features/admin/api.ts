import { createMiddleware, createServerFn } from "@tanstack/react-start";
import {
  deleteSpecial,
  deleteTap,
  reorderSpecials,
  reorderTaps,
  resendNotification,
  saveSpecial,
  saveTap,
  setMenuPdf,
  saveSiteDetails,
  setReservationStatus,
} from "@/server/admin";
import {
  completePasswordChange,
  inviteAdmin,
  listAdmins,
  removeAdmin,
  resetAdmin,
} from "@/server/admin-users";
import { getBearerToken } from "@/server/request";
import {
  idInput,
  inviteInput,
  menuPdfInput,
  newPasswordInput,
  reorderInput,
  setStatusInput,
  siteDetailsInput,
  specialInput,
  tapInput,
} from "./schema";
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

export const saveTapFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(tapInput)
  .handler(({ data, context }) => (context.token ? saveTap(context.token, data) : unauthorized));

export const deleteTapFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(idInput)
  .handler(({ data, context }) =>
    context.token ? deleteTap(context.token, data.id) : unauthorized,
  );

export const reorderTapsFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(reorderInput)
  .handler(({ data, context }) =>
    context.token ? reorderTaps(context.token, data.ids) : unauthorized,
  );

export const setMenuPdfFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(menuPdfInput)
  .handler(({ data, context }) => (context.token ? setMenuPdf(context.token, data) : unauthorized));

export const listAdminsFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .handler(({ context }) => (context.token ? listAdmins(context.token) : unauthorized));

export const inviteAdminFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(inviteInput)
  .handler(({ data, context }) =>
    context.token ? inviteAdmin(context.token, data.email) : unauthorized,
  );

export const resetAdminFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(idInput)
  .handler(({ data, context }) =>
    context.token ? resetAdmin(context.token, data.id) : unauthorized,
  );

export const removeAdminFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(idInput)
  .handler(({ data, context }) =>
    context.token ? removeAdmin(context.token, data.id) : unauthorized,
  );

/** First sign-in with the emailed temporary password. */
export const completePasswordChangeFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(newPasswordInput)
  .handler(({ data, context }) =>
    context.token
      ? completePasswordChange(context.token, data.currentPassword, data.password)
      : unauthorized,
  );

export const saveSiteDetailsFn = createServerFn({ method: "POST" })
  .middleware([adminAuth])
  .inputValidator(siteDetailsInput)
  .handler(({ data, context }) =>
    context.token ? saveSiteDetails(context.token, data) : unauthorized,
  );
