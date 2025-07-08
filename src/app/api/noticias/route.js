import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // 1. Obtener la fecha/hora actual en UTC
    const nowUTC = DateTime.utc();
    
    // 2. Mostrar hora actual en Bolivia para referencia
    const nowBolivia = nowUTC.setZone('America/La_Paz');
    console.log('Hora actual Bolivia:', nowBolivia.toString());
    
    // 3. Consultar las últimas 24 horas de noticias (sin filtro de hora específica)
    const noticias = await prisma.news.findMany({
      where: {
        created_at: {
          gte: nowUTC.minus({ hours: 24 }).toJSDate(),
          lte: nowUTC.toJSDate()
        }
      },
      orderBy: {
        created_at: 'desc'
      }
      // Eliminamos el include de categoria ya que parece no existir
    });

    console.log('=== RESULTADOS ===');
    console.log(`Noticias encontradas: ${noticias.length}`);
    console.log('Rango de consulta UTC:');
    console.log('Desde:', nowUTC.minus({ hours: 24 }).toString());
    console.log('Hasta:', nowUTC.toString());

    // 4. Si no hay resultados, mostrar diagnóstico completo
    if (noticias.length === 0) {
      const totalNoticias = await prisma.news.count();
      console.log('Total de noticias en BD:', totalNoticias);
      
      // Mostrar las últimas 10 noticias sin filtro de tiempo
      const ultimasNoticias = await prisma.news.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: { 
          id: true,
          titulo: true,
          created_at: true,
          categoria: true // Si este campo existe como string, no como relación
        }
      });
      
      console.log('Últimas noticias registradas (sin filtro):');
      ultimasNoticias.forEach(n => {
        const fechaBolivia = DateTime.fromJSDate(n.created_at).setZone('America/La_Paz');
        console.log(`- ID: ${n.id}, Título: ${n.titulo}, Hora Bolivia: ${fechaBolivia.toString()}, Categoría: ${n.categoria || 'N/A'}`);
      });
    }

    return new Response(JSON.stringify(noticias), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en GET /api/noticias:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al obtener noticias',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT: Aprobar o rechazar noticia
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, estado } = body;

    if (!id || !estado) {
      return new Response(
        JSON.stringify({ error: "Faltan campos: 'id' o 'estado'" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const noticiaActualizada = await prisma.news.update({
      where: { id: Number(id) },
      data: { estado }
      // Eliminamos el include de categoria
    });

    return new Response(JSON.stringify(noticiaActualizada), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error al actualizar noticia', detail: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}