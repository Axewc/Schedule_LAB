import { resend, FROM_EMAIL, DOCTOR_EMAIL } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import { EmailType } from "@prisma/client";
import { render } from "@react-email/components";
import {
  ConfirmationPatientEmail,
  ConfirmationProviderEmail,
  ReminderEmail,
  CancellationPatientEmail,
  CancellationProviderEmail,
} from "@/emails/templates";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const CLINIC_ADDRESS = process.env.CLINIC_ADDRESS ?? "Consulta la dirección en el email de confirmación";
const MAPS_URL = process.env.MAPS_URL ?? "";

interface AppointmentEmailData {
  id: string;
  code: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientNotes?: string | null;
  dateTime: Date;
  depositAmount: { toString(): string };
  service: { name: string };
  provider: { name: string; email: string };
}

async function logEmail(
  appointmentId: string,
  recipientEmail: string,
  type: EmailType,
  status: string
) {
  await prisma.emailLog.create({
    data: { appointmentId, recipientEmail, type, status },
  });
}

export async function sendConfirmationEmails(appointment: AppointmentEmailData) {
  const manageUrl = `${APP_URL}/mi-cita?code=${appointment.code}`;
  const dateFormatted = formatDate(appointment.dateTime);
  const timeFormatted = formatTime(appointment.dateTime);
  const depositFormatted = formatCurrency(appointment.depositAmount.toString());

  // Email al paciente
  try {
    const html = await render(
      ConfirmationPatientEmail({
        patientName: appointment.patientName,
        serviceName: appointment.service.name,
        dateFormatted,
        timeFormatted,
        appointmentCode: appointment.code,
        depositAmount: depositFormatted,
        providerName: appointment.provider.name,
        address: CLINIC_ADDRESS,
        manageUrl,
      })
    );
    await resend.emails.send({
      from: FROM_EMAIL,
      to: appointment.patientEmail,
      subject: `✅ Cita Confirmada — ${appointment.service.name} el ${dateFormatted}`,
      html,
    });
    await logEmail(appointment.id, appointment.patientEmail, EmailType.CONFIRMATION_PATIENT, "sent");
  } catch (error) {
    console.error("Error sending patient confirmation email:", error);
    await logEmail(appointment.id, appointment.patientEmail, EmailType.CONFIRMATION_PATIENT, "failed");
  }

  // Email al doctor
  try {
    const html = await render(
      ConfirmationProviderEmail({
        patientName: appointment.patientName,
        patientEmail: appointment.patientEmail,
        patientPhone: appointment.patientPhone,
        serviceName: appointment.service.name,
        dateFormatted,
        timeFormatted,
        patientNotes: appointment.patientNotes ?? undefined,
        depositAmount: depositFormatted,
        appointmentCode: appointment.code,
      })
    );
    const doctorEmail = appointment.provider.email ?? DOCTOR_EMAIL;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: doctorEmail,
      subject: `📅 Nueva Cita — ${appointment.patientName} el ${dateFormatted}`,
      html,
    });
    await logEmail(appointment.id, doctorEmail, EmailType.CONFIRMATION_PROVIDER, "sent");
  } catch (error) {
    console.error("Error sending provider confirmation email:", error);
    await logEmail(appointment.id, appointment.provider.email ?? DOCTOR_EMAIL, EmailType.CONFIRMATION_PROVIDER, "failed");
  }
}

export async function sendReminderEmail(appointment: AppointmentEmailData) {
  const manageUrl = `${APP_URL}/mi-cita?code=${appointment.code}`;
  const dateFormatted = formatDate(appointment.dateTime);
  const timeFormatted = formatTime(appointment.dateTime);

  try {
    const html = await render(
      ReminderEmail({
        patientName: appointment.patientName,
        serviceName: appointment.service.name,
        dateFormatted,
        timeFormatted,
        appointmentCode: appointment.code,
        providerName: appointment.provider.name,
        address: CLINIC_ADDRESS,
        mapsUrl: MAPS_URL,
        manageUrl,
      })
    );
    await resend.emails.send({
      from: FROM_EMAIL,
      to: appointment.patientEmail,
      subject: `🔔 Recordatorio: Tu cita es mañana — ${appointment.service.name}`,
      html,
    });
    await logEmail(appointment.id, appointment.patientEmail, EmailType.REMINDER_24H, "sent");
  } catch (error) {
    console.error("Error sending reminder email:", error);
    await logEmail(appointment.id, appointment.patientEmail, EmailType.REMINDER_24H, "failed");
  }
}

export async function sendCancellationEmails(appointment: AppointmentEmailData, hoursUntil: number) {
  const dateFormatted = formatDate(appointment.dateTime);
  const timeFormatted = formatTime(appointment.dateTime);
  const refundInfo = hoursUntil >= 24
    ? "Se iniciará el proceso de reembolso del anticipo en los próximos 3-5 días hábiles."
    : "Lamentablemente, al cancelar con menos de 24 horas de anticipación, el anticipo no es reembolsable.";

  // Email al paciente
  try {
    const html = await render(
      CancellationPatientEmail({
        patientName: appointment.patientName,
        appointmentCode: appointment.code,
        serviceName: appointment.service.name,
        dateFormatted,
        timeFormatted,
        refundInfo,
      })
    );
    await resend.emails.send({
      from: FROM_EMAIL,
      to: appointment.patientEmail,
      subject: `❌ Cita Cancelada — Código ${appointment.code}`,
      html,
    });
    await logEmail(appointment.id, appointment.patientEmail, EmailType.CANCELLATION_PATIENT, "sent");
  } catch (error) {
    console.error("Error sending cancellation patient email:", error);
    await logEmail(appointment.id, appointment.patientEmail, EmailType.CANCELLATION_PATIENT, "failed");
  }

  // Email al doctor
  try {
    const html = await render(
      CancellationProviderEmail({
        patientName: appointment.patientName,
        appointmentCode: appointment.code,
        serviceName: appointment.service.name,
        dateFormatted,
        timeFormatted,
      })
    );
    const doctorEmail = appointment.provider.email ?? DOCTOR_EMAIL;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: doctorEmail,
      subject: `❌ Cita Cancelada — ${appointment.patientName} el ${dateFormatted}`,
      html,
    });
    await logEmail(appointment.id, doctorEmail, EmailType.CANCELLATION_PROVIDER, "sent");
  } catch (error) {
    console.error("Error sending cancellation provider email:", error);
    await logEmail(appointment.id, appointment.provider.email ?? DOCTOR_EMAIL, EmailType.CANCELLATION_PROVIDER, "failed");
  }
}
