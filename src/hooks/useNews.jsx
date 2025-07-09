import { useState, useEffect } from "react";


export function useNews() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ejecutandoWebhook, setEjecutandoWebhook] = useState(false);
  const [webhookError, setWebhookError] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [noNews, setNoNews] = useState(false);
  const [intentosSinNoticias, setIntentosSinNoticias] = useState(0);
  const [actualizandoEstado, setActualizandoEstado] = useState({});
  const [contador, setContador] = useState(null);
  const [horaLocal, setHoraLocal] = useState("");
  const [mostrarModalCargaNoticias, setMostrarModalCargaNoticias] = useState(false);
  const [procesoActual, setProcesoActual] = useState("");
  const [tiempoEspera, setTiempoEspera] = useState(0); // Nuevo estado para el tiempo
  // Filtrar noticias por categoría
  const noticiasTuto = noticias.filter(
    (n) => (n.categoria || "").toUpperCase() === "TUTO"
  );
  const noticiasJP = noticias.filter(
    (n) => (n.categoria || "").toUpperCase() === "JP"
  );
  const noticiasOtros = noticias.filter((n) => {
    const cat = (n.categoria || "").toUpperCase();
    return cat !== "TUTO" && cat !== "JP";
  });
  const hayNoticias = noticias.length > 0;

  useEffect(() => {
    const updateHora = () => {
      const ahora = new Date();
      setHoraLocal(ahora.toLocaleTimeString());
    };
    updateHora();
    const interval = setInterval(updateHora, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchNoticias() {
      const res = await fetch("/api/noticias");
      let data = await res.json();
      if (!Array.isArray(data)) data = [];
      setNoticias(data);
      setLoading(false);
    }
    fetchNoticias();
  }, []);

  // Efecto para el contador de recarga
  useEffect(() => {
    let interval;
    function updateContador() {
      if (hayNoticias) {
        setContador(getTiempoRestanteHasta830amSiguiente());
      } else {
        setContador(null);
      }
    }
    updateContador();
    if (hayNoticias) {
      interval = setInterval(updateContador, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hayNoticias]);

  async function esperarCambioNoticias(condicionCambio, maxIntentos = 3, mostrarModal = true, tiempoTotal = 0) {
    if (mostrarModal) {
      setWaiting(true);
      setShowModal(true);
    }
    setNoNews(false);
    setIntentosSinNoticias(0);

    let foundCambio = false;
    let intentos = 0;
    let tiempoRestante = tiempoTotal;

    // Actualizar el contador cada segundo
    const intervalId = setInterval(() => {
      if (tiempoRestante > 0) {
        tiempoRestante--;
        setTiempoEspera(tiempoRestante);
      }
    }, 1000);

    try {
      while (intentos < maxIntentos && !foundCambio) {
        const noticiasRes = await fetch("/api/noticias");
        const nuevasNoticias = await noticiasRes.json();

        if (condicionCambio(nuevasNoticias)) {
          setNoticias(nuevasNoticias);
          foundCambio = true;
        } else {
          intentos++;
          setIntentosSinNoticias(intentos);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      if (!foundCambio) {
        setNoNews(true);
      }
    } catch (err) {
      console.error(err);
      setWebhookError("Error al esperar cambios en las noticias.");
    } finally {
      clearInterval(intervalId);
      if (mostrarModal) {
        setWaiting(false);
        setShowModal(false);
      }
      setIntentosSinNoticias(0);
    }
  }

async function ejecutarWebhook() {
  setEjecutandoWebhook(true);
  setWebhookError(null);
  setMostrarModalCargaNoticias(true);
  setProcesoActual("Buscando noticias...");
  setTiempoEspera(0);

  try {
    const res = await fetch(
      "https://n8n-torta-express.qnfmlx.easypanel.host/webhook-test/a21e1a7f-73f2-44d0-b4bc-2176ff690234",
      { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Mostrar el response completo en consola
    console.log("Response del webhook:", {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      data: await res.clone().json().catch(() => "No se pudo parsear como JSON")
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al ejecutar el webhook");
    }
    
    const responseData = await res.json();
    console.log("Datos procesados del webhook:", responseData); // Mostrar datos procesados
    
    setProcesoActual(responseData.process || "Procesando noticias...");
    
    
    // Asegúrate de que amountNews es un número
    const cantidadNoticias = parseInt(responseData.amountNews) || 0;
    const tiempoCalculado = cantidadNoticias * 30;
    
    console.log(`Tiempo calculado: ${tiempoCalculado}s`); // Verifica en consola
    
    setTiempoEspera(tiempoCalculado); // Actualiza el estado
    setProcesoActual(responseData.process || "Procesando noticias...");
    
    await esperarCambioNoticias(
      (nuevasNoticias) => Array.isArray(nuevasNoticias) && nuevasNoticias.length > 0,
      3,
      true,
      tiempoCalculado
    );
    
  } catch (err) {
    console.error("Error completo en ejecutarWebhook:", err);
    setWebhookError(err.message);
    setProcesoActual("Error al buscar noticias");
  } finally {
    setEjecutandoWebhook(false);
  }
}

  
  async function manejarEstado(id, nuevoEstado) {
    // Aplica el cambio local optimista
    setNoticias((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, estado: nuevoEstado.toUpperCase() } : n
      )
    );
  
    setActualizandoEstado((prev) => ({ ...prev, [id]: true }));
  
    try {
      const res = await fetch("/api/noticias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: nuevoEstado.toUpperCase() }),
      });
  
      if (!res.ok) throw new Error("Error al actualizar estado");
      await res.json();
    } catch (err) {
      alert("No se pudo actualizar el estado de la noticia.");
    } finally {
      setActualizandoEstado((prev) => ({ ...prev, [id]: false }));
    }
  }
  
  function getTiempoRestanteHasta830amSiguiente() {
    const ahora = new Date();
    const ahoraBolivia = new Date(
      ahora.toLocaleString("en-US", { timeZone: "America/La_Paz" })
    );
    let siguiente830 = new Date(ahoraBolivia);
    siguiente830.setHours(8, 30, 0, 0);

    if (ahoraBolivia >= siguiente830) {
      siguiente830.setDate(siguiente830.getDate() + 1);
    }

    const diff = siguiente830 - ahoraBolivia;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);

    return { horas, minutos, segundos };
  }

  return {
    noticias,
    loading,
    noticiasTuto,
    noticiasJP,
    noticiasOtros,
    ejecutarWebhook,
    manejarEstado,
    actualizandoEstado,
    ejecutandoWebhook,
    waiting,
    showModal,
    mostrarModalCargaNoticias,
    noNews,
    intentosSinNoticias,
    webhookError,
    contador,
    horaLocal,
    hayNoticias,
    procesoActual,
    tiempoEspera, // Asegúrate de incluir este estado en el return
  };

}