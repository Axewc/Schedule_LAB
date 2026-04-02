import { z } from "zod";

export const createAppointmentSchema = z.object({
  providerId: z.string().cuid(),
  serviceId: z.string().cuid(),
  dateTime: z.string().datetime(),
  patientName: z.string().min(2).max(100),
  patientEmail: z.string().email(),
  patientPhone: z.string().min(7).max(20),
  patientNotes: z.string().max(500).optional(),
  privacyConsent: z.boolean().refine((v) => v === true, {
    message: "Debe aceptar el aviso de privacidad",
  }),
});

export const lookupAppointmentSchema = z.object({
  code: z.string().optional(),
  email: z.string().email().optional(),
}).refine((d) => d.code || d.email, {
  message: "Se requiere código o email",
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(200).optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type LookupAppointmentInput = z.infer<typeof lookupAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
