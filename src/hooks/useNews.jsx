import { useState, useEffect } from "react";

export function useNews(emailUsuario) {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ejecutandoWebhook, setEjecutandoWebhook] = useState(false);
  const [webhookError, setWebhookError] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [noNews, setNoNews] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState({});
  const [contador, setContador] = useState(null);
  const [horaLocal, setHoraLocal] = useState("");
  const [mostrarModalCargaNoticias, setMostrarModalCargaNoticias] = useState(false);
  const [estadoProceso, setEstadoProceso] = useState(null);

  const noticiasTuto = noticias.filter((n) => (n.categoria || "").toUpperCase() === "TUTO");
  const noticiasJP = noticias.filter((n) => (n.categoria || "").toUpperCase() === "JP");
  const noticiasOtros = noticias.filter((n) => {
    const cat = (n.categoria || "").toUpperCase();
    return cat !== "TUTO" && cat !== "JP";
  });

  const hayNoticias = noticias.length > 0;

  // 🕒 Actualizar hora local
  useEffect(() => {
    const updateHora = () => setHoraLocal(new Date().toLocaleTimeString());
    updateHora();
    const interval = setInterval(updateHora, 1000);
    return () => clearInterval(interval);
  }, []);

  // 📰 Obtener noticias al iniciar
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

  // ⏰ Contador para 8:30 AM
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
    return () => clearInterval(interval);
  }, [hayNoticias]);

  // 🔁 Revisa estado del proceso cada 1 segundo si está en pendiente
  useEffect(() => {
    let interval;
    const fetchEstadoProceso = async () => {
      try {
        const res = await fetch("/api/procesos-workflow");
        const data = await res.json();
        const estado = data?.[0]?.estado?.toLowerCase();
        setEstadoProceso(estado);
      } catch (error) {
        console.error("Error al consultar procesos_workflow", error);
      }
    };

    if (estadoProceso === "pendiente") {
      interval = setInterval(fetchEstadoProceso, 1000);
    } else {
      fetchEstadoProceso(); // inicial
    }

    return () => clearInterval(interval);
  }, [estadoProceso]);

  // ⏳ Esperar noticias nuevas
  async function esperarCambioNoticias(condicionCambio, timeoutSegundos = 60) {
    setWaiting(true);
    setShowModal(true);
    const startTime = Date.now();

    try {
      while ((Date.now() - startTime) / 1000 < timeoutSegundos) {
        const res = await fetch("/api/noticias");
        const nuevas = await res.json();
        if (condicionCambio(nuevas)) {
          setNoticias(nuevas);
          break;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch (e) {
      setWebhookError("Error al esperar noticias.");
    } finally {
      setWaiting(false);
      setShowModal(false);
    }
  }

  async function ejecutarWebhook() {
    if (!emailUsuario) {
      setWebhookError("Falta el email del usuario.");
      return;
    }

    setEjecutandoWebhook(true);
    setWebhookError(null);
    setMostrarModalCargaNoticias(true);

    try {
      const res = await fetch("https://n8n-torta-express.qnfmlx.easypanel.host/webhook-test/a21e1a7f-73f2-44d0-b4bc-2176ff690234", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailUsuario }),
      });

      if (!res.ok) throw new Error("Webhook falló");

      await esperarCambioNoticias((nuevas) => Array.isArray(nuevas) && nuevas.length > 0);
    } catch (err) {
      setWebhookError("Error ejecutando webhook N8N.");
    } finally {
      setEjecutandoWebhook(false);
      setMostrarModalCargaNoticias(false);
    }
  }

  async function manejarEstado(id, nuevoEstado) {
    setNoticias((prev) =>
      prev.map((n) => (n.id === id ? { ...n, estado: nuevoEstado.toUpperCase() } : n))
    );
    setActualizandoEstado((prev) => ({ ...prev, [id]: true }));

    try {
      const res = await fetch("/api/noticias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: nuevoEstado.toUpperCase() }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar");
      await res.json();
    } catch (err) {
      alert("Error al actualizar noticia");
    } finally {
      setActualizandoEstado((prev) => ({ ...prev, [id]: false }));
    }
  }

  function getTiempoRestanteHasta830amSiguiente() {
    const ahora = new Date();
    const ahoraBolivia = new Date(ahora.toLocaleString("en-US", { timeZone: "America/La_Paz" }));
    let siguiente830 = new Date(ahoraBolivia);
    siguiente830.setHours(8, 30, 0, 0);
    if (ahoraBolivia >= siguiente830) siguiente830.setDate(siguiente830.getDate() + 1);

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
    webhookError,
    contador,
    horaLocal,
    hayNoticias,
    estadoProceso,
  };
}
