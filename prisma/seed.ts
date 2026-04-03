import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create provider
  const provider = await prisma.provider.upsert({
    where: { email: "dr.garcia@consultorio.com" },
    update: {},
    create: {
      name: "Dr. Alejandro García",
      email: "dr.garcia@consultorio.com",
      phone: "+52 55 1234 5678",
      specialty: "Médico General y Odontólogo",
      bio: "Con más de 15 años de experiencia, el Dr. García se especializa en brindar atención médica y dental de alta calidad. Egresado de la UNAM con especialidad en Odontología Restaurativa.",
      isActive: true,
    },
  });

  console.log(`✅ Provider: ${provider.name}`);

  // Create services
  const services = [
    {
      name: "Consulta General",
      description: "Diagnóstico y tratamiento de enfermedades comunes",
      durationMin: 30,
      price: 500,
      depositAmount: 100,
    },
    {
      name: "Limpieza Dental",
      description: "Limpieza profunda y pulido dental profesional",
      durationMin: 60,
      price: 800,
      depositAmount: 150,
    },
    {
      name: "Revisión Preventiva",
      description: "Chequeo completo de salud y diagnóstico preventivo",
      durationMin: 45,
      price: 650,
      depositAmount: 120,
    },
    {
      name: "Extracción Dental",
      description: "Extracción segura con anestesia local",
      durationMin: 60,
      price: 1200,
      depositAmount: 200,
    },
    {
      name: "Ortodoncia Consulta",
      description: "Evaluación inicial para brackets o alineadores",
      durationMin: 45,
      price: 300,
      depositAmount: 50,
    },
  ];

  for (const serviceData of services) {
    const service = await prisma.service.upsert({
      where: {
        id: `seed-${serviceData.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {},
      create: {
        id: `seed-${serviceData.name.toLowerCase().replace(/\s+/g, "-")}`,
        providerId: provider.id,
        ...serviceData,
      },
    });
    console.log(`✅ Service: ${service.name}`);
  }

  // Create weekly schedules (Mon-Fri 9:00-19:00, Sat 9:00-14:00)
  const weekdays = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "19:00", slotInterval: 30 }, // Mon
    { dayOfWeek: 2, startTime: "09:00", endTime: "19:00", slotInterval: 30 }, // Tue
    { dayOfWeek: 3, startTime: "09:00", endTime: "19:00", slotInterval: 30 }, // Wed
    { dayOfWeek: 4, startTime: "09:00", endTime: "19:00", slotInterval: 30 }, // Thu
    { dayOfWeek: 5, startTime: "09:00", endTime: "19:00", slotInterval: 30 }, // Fri
    { dayOfWeek: 6, startTime: "09:00", endTime: "14:00", slotInterval: 30 }, // Sat
  ];

  for (const scheduleData of weekdays) {
    const schedule = await prisma.schedule.upsert({
      where: {
        providerId_dayOfWeek_startTime: {
          providerId: provider.id,
          dayOfWeek: scheduleData.dayOfWeek,
          startTime: scheduleData.startTime,
        },
      },
      update: {},
      create: {
        providerId: provider.id,
        ...scheduleData,
      },
    });
    console.log(`✅ Schedule: Day ${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime}`);
  }

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  const adminUser = await prisma.adminUser.upsert({
    where: { email: "admin@consultorio.com" },
    update: {},
    create: {
      email: "admin@consultorio.com",
      passwordHash,
      name: "Administrador",
      role: "admin",
      providerId: provider.id,
    },
  });

  console.log(`✅ Admin user: ${adminUser.email} (password: admin123)`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
