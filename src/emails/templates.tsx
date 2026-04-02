import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ConfirmationEmailProps {
  patientName: string;
  serviceName: string;
  dateFormatted: string;
  timeFormatted: string;
  appointmentCode: string;
  depositAmount: string;
  providerName: string;
  address?: string;
  manageUrl: string;
}

export function ConfirmationPatientEmail({
  patientName,
  serviceName,
  dateFormatted,
  timeFormatted,
  appointmentCode,
  depositAmount,
  providerName,
  address,
  manageUrl,
}: ConfirmationEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>✅ Cita Confirmada — {serviceName} el {dateFormatted}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✅ Cita Confirmada</Heading>
          <Text style={text}>Hola {patientName},</Text>
          <Text style={text}>
            Tu cita ha sido confirmada exitosamente. Aquí están los detalles:
          </Text>
          <Section style={detailsBox}>
            <Text style={detailRow}>
              <strong>Código de cita:</strong> {appointmentCode}
            </Text>
            <Text style={detailRow}>
              <strong>Servicio:</strong> {serviceName}
            </Text>
            <Text style={detailRow}>
              <strong>Doctor:</strong> {providerName}
            </Text>
            <Text style={detailRow}>
              <strong>Fecha:</strong> {dateFormatted}
            </Text>
            <Text style={detailRow}>
              <strong>Hora:</strong> {timeFormatted}
            </Text>
            {address && (
              <Text style={detailRow}>
                <strong>Dirección:</strong> {address}
              </Text>
            )}
            <Text style={detailRow}>
              <strong>Anticipo pagado:</strong> {depositAmount}
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={text}>
            Para consultar o cancelar tu cita, visita:{" "}
            <a href={manageUrl} style={link}>
              {manageUrl}
            </a>
          </Text>
          <Text style={footer}>
            Si tienes alguna pregunta, no dudes en contactarnos.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

interface ProviderNotificationEmailProps {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  serviceName: string;
  dateFormatted: string;
  timeFormatted: string;
  patientNotes?: string;
  depositAmount: string;
  appointmentCode: string;
}

export function ConfirmationProviderEmail({
  patientName,
  patientEmail,
  patientPhone,
  serviceName,
  dateFormatted,
  timeFormatted,
  patientNotes,
  depositAmount,
  appointmentCode,
}: ProviderNotificationEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>📅 Nueva Cita — {patientName} el {dateFormatted}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📅 Nueva Cita Agendada</Heading>
          <Text style={text}>
            Se ha agendado una nueva cita con los siguientes datos:
          </Text>
          <Section style={detailsBox}>
            <Text style={detailRow}>
              <strong>Código:</strong> {appointmentCode}
            </Text>
            <Text style={detailRow}>
              <strong>Paciente:</strong> {patientName}
            </Text>
            <Text style={detailRow}>
              <strong>Email:</strong> {patientEmail}
            </Text>
            <Text style={detailRow}>
              <strong>Teléfono:</strong> {patientPhone}
            </Text>
            <Text style={detailRow}>
              <strong>Servicio:</strong> {serviceName}
            </Text>
            <Text style={detailRow}>
              <strong>Fecha:</strong> {dateFormatted}
            </Text>
            <Text style={detailRow}>
              <strong>Hora:</strong> {timeFormatted}
            </Text>
            {patientNotes && (
              <Text style={detailRow}>
                <strong>Motivo:</strong> {patientNotes}
              </Text>
            )}
            <Text style={detailRow}>
              <strong>Anticipo:</strong> {depositAmount}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

interface ReminderEmailProps {
  patientName: string;
  serviceName: string;
  dateFormatted: string;
  timeFormatted: string;
  appointmentCode: string;
  providerName: string;
  address?: string;
  mapsUrl?: string;
  manageUrl: string;
}

export function ReminderEmail({
  patientName,
  serviceName,
  dateFormatted,
  timeFormatted,
  appointmentCode,
  providerName,
  address,
  mapsUrl,
  manageUrl,
}: ReminderEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>🔔 Recordatorio: Tu cita es mañana — {serviceName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🔔 Tu cita es mañana</Heading>
          <Text style={text}>Hola {patientName},</Text>
          <Text style={text}>
            Te recordamos que tienes una cita programada para mañana:
          </Text>
          <Section style={detailsBox}>
            <Text style={detailRow}>
              <strong>Código:</strong> {appointmentCode}
            </Text>
            <Text style={detailRow}>
              <strong>Servicio:</strong> {serviceName}
            </Text>
            <Text style={detailRow}>
              <strong>Doctor:</strong> {providerName}
            </Text>
            <Text style={detailRow}>
              <strong>Fecha:</strong> {dateFormatted}
            </Text>
            <Text style={detailRow}>
              <strong>Hora:</strong> {timeFormatted}
            </Text>
            {address && (
              <Text style={detailRow}>
                <strong>Dirección:</strong> {address}
              </Text>
            )}
          </Section>
          {mapsUrl && (
            <Text style={text}>
              <a href={mapsUrl} style={link}>Ver en Google Maps</a>
            </Text>
          )}
          <Hr style={hr} />
          <Text style={text}>
            ¿Necesitas hacer cambios?{" "}
            <a href={manageUrl} style={link}>Gestiona tu cita aquí</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

interface CancellationEmailProps {
  patientName: string;
  appointmentCode: string;
  serviceName: string;
  dateFormatted: string;
  timeFormatted: string;
  refundInfo?: string;
}

export function CancellationPatientEmail({
  patientName,
  appointmentCode,
  serviceName,
  dateFormatted,
  timeFormatted,
  refundInfo,
}: CancellationEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>❌ Cita Cancelada — Código {appointmentCode}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>❌ Cita Cancelada</Heading>
          <Text style={text}>Hola {patientName},</Text>
          <Text style={text}>
            Tu cita ha sido cancelada exitosamente.
          </Text>
          <Section style={detailsBox}>
            <Text style={detailRow}>
              <strong>Código:</strong> {appointmentCode}
            </Text>
            <Text style={detailRow}>
              <strong>Servicio:</strong> {serviceName}
            </Text>
            <Text style={detailRow}>
              <strong>Fecha:</strong> {dateFormatted}
            </Text>
            <Text style={detailRow}>
              <strong>Hora:</strong> {timeFormatted}
            </Text>
          </Section>
          {refundInfo && (
            <Text style={text}>{refundInfo}</Text>
          )}
        </Container>
      </Body>
    </Html>
  );
}

export function CancellationProviderEmail({
  patientName,
  appointmentCode,
  serviceName,
  dateFormatted,
  timeFormatted,
}: Omit<CancellationEmailProps, "refundInfo">) {
  return (
    <Html lang="es">
      <Head />
      <Preview>❌ Cita Cancelada — {patientName} el {dateFormatted}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>❌ Cita Cancelada</Heading>
          <Text style={text}>
            El paciente ha cancelado la siguiente cita:
          </Text>
          <Section style={detailsBox}>
            <Text style={detailRow}>
              <strong>Código:</strong> {appointmentCode}
            </Text>
            <Text style={detailRow}>
              <strong>Paciente:</strong> {patientName}
            </Text>
            <Text style={detailRow}>
              <strong>Servicio:</strong> {serviceName}
            </Text>
            <Text style={detailRow}>
              <strong>Fecha:</strong> {dateFormatted}
            </Text>
            <Text style={detailRow}>
              <strong>Hora:</strong> {timeFormatted}
            </Text>
          </Section>
          <Text style={text}>El slot ha quedado disponible.</Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#F8F9FA",
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  marginTop: "24px",
  marginBottom: "24px",
};

const h1 = {
  color: "#0077B6",
  fontSize: "24px",
  fontWeight: "700",
  marginBottom: "16px",
};

const text = {
  color: "#212529",
  fontSize: "16px",
  lineHeight: "1.6",
  marginBottom: "12px",
};

const detailsBox = {
  backgroundColor: "#F8F9FA",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "16px",
};

const detailRow = {
  color: "#212529",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "4px 0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const link = {
  color: "#0077B6",
  textDecoration: "underline",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  marginTop: "24px",
};
