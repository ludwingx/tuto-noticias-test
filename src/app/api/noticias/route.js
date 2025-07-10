import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const zonaBolivia = "America/La_Paz";

    const ahoraUTC = DateTime.utc();
    const ahoraBolivia = ahoraUTC.setZone(zonaBolivia);

    console.log(`[DEBUG] Hora actual Bolivia: ${ahoraBolivia.toFormat("dd/MM/yyyy HH:mm:ss")}`);

    // Corte de hoy a las 08:30 AM Bolivia
    const corteHoyBolivia = ahoraBolivia.set({
      hour: 8,
      minute: 30,
      second: 0,
      millisecond: 0,
    });

    // Mostrar solo si es después del corte de hoy
    if (ahoraBolivia < corteHoyBolivia) {
      console.log("[DEBUG] Antes del corte de hoy: no mostrar noticias.");
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // Traemos todas las noticias ordenadas por fecha (desc)
    const todasNoticias = await prisma.news.findMany({
      orderBy: { created_at: "desc" },
    });

    // Filtramos en memoria interpretando created_at como hora Bolivia
    const noticiasFiltradas = todasNoticias.filter((noticia) => {
      const fechaBolivia = DateTime.fromJSDate(noticia.created_at).setZone(zonaBolivia);
      return fechaBolivia >= corteHoyBolivia && fechaBolivia < corteHoyBolivia.plus({ days: 1 });
    });

    // Mapear para formatear las fechas
    const noticiasConFechaFormateada = noticiasFiltradas.map((noticia) => {
      const fechaUTC = DateTime.fromJSDate(noticia.created_at).toUTC();
      const fechaBolivia = fechaUTC.setZone(zonaBolivia);

      return {
        ...noticia,
        created_at: fechaBolivia.toISO(),
        fecha_bolivia: fechaBolivia.toFormat("dd/MM/yyyy HH:mm:ss"),
        fecha_utc: fechaUTC.toFormat("dd/MM/yyyy HH:mm:ss"),
      };
    });

    console.log(`[DEBUG] Noticias encontradas: ${noticiasConFechaFormateada.length}`);

    return new Response(JSON.stringify(noticiasConFechaFormateada), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[ERROR] En GET /api/noticias:", error);
    return new Response(
      JSON.stringify({
        error: "Error al obtener noticias",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
// PUT permanece igual
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, estado } = body;

    if (!id || !estado) {
      return new Response(
        JSON.stringify({ error: "Faltan campos: 'id' o 'estado'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const noticiaActualizada = await prisma.news.update({
      where: { id: Number(id) },
      data: { estado },
    });

    return new Response(JSON.stringify(noticiaActualizada), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error al actualizar noticia", detail: error.message }),
      { status: 500 }
    );
  }
}
