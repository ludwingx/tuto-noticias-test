import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const procesos = await prisma.procesosWorkflow.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    console.log("[API] procesosWorkflow:", procesos);
    return Response.json(procesos);
  } catch (error) {
    console.error("[API] Error al obtener procesos_workflow:", error);
    return new Response("Error interno del servidor", { status: 500 });
  }
}
