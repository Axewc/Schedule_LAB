import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.FROM_EMAIL ?? "citas@consultorio.com";
export const DOCTOR_EMAIL = process.env.DOCTOR_EMAIL ?? "doctor@consultorio.com";
