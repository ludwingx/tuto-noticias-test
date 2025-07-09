import { useState, useEffect } from "react";

export function useNews() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ejecutandoWebhook, setEjecutandoWebhook] = useState(false);
  const [webhookError, setWebhookError] = useState(null);
  const [timer, setTimer] = useState(20);
  const [waiting, setWaiting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [noNews, setNoNews] = useState(false);
  const [intentosSinNoticias, setIntentosSinNoticias] = useState(0);
  const [actualizandoEstado, setActualizandoEstado] = useState({});
  const [contador, setContador] = useState(null);
  const [horaLocal, setHoraLocal] = useState("");
  const [mostrarModalCargaNoticias, setMostrarModalCargaNoticias] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState("");

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

  async function esperarCambioNoticias(condicionCambio, maxIntentos = 3) {
    setWaiting(true);
    setShowModal(true);
    setTimer(20);
    setNoNews(false);
    setIntentosSinNoticias(0);

    let intentos = 0;

    try {
      while (intentos < maxIntentos) {
        for (let t = 20; t > 0; t--) {
          setTimer(t);
          await new Promise((r) => setTimeout(r, 1000));
        }
        setTimer(0);

        const noticiasRes = await fetch("/api/noticias");
        const nuevasNoticias = await noticiasRes.json();

        if (condicionCambio(nuevasNoticias)) {
          setNoticias(nuevasNoticias);
          setWebhookMessage("✅ Noticias cargadas correctamente");
          break;
        } else {
          intentos++;
          setIntentosSinNoticias(intentos);
        }
      }

      setShowModal(false);
      setWaiting(false);
    } catch (err) {
      console.error(err);
      setWebhookError("Error al esperar cambios en las noticias.");
      setShowModal(false);
      setWaiting(false);
    }
  }

  async function ejecutarWebhook() {
    setEjecutandoWebhook(true);
    setWebhookError(null);
    setWebhookMessage("Buscando noticias");
    try {
      const res = await fetch(
        "https://n8n-torta-express.qnfmlx.easypanel.host/webhook-test/a21e1a7f-73f2-44d0-b4bc-2176ff690234",
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Error al ejecutar el webhook");
      const webhookData = await res.json();
      if (webhookData?.process === "Extrayendo y Filtrando Noticias") {
        setWebhookMessage("Extrayendo noticias");
      } else if (webhookData?.process === "Procesando Noticias Filtradas") {
        setWebhookMessage("Procesando noticias filtradas");
      }
      await esperarCambioNoticias(
        (nuevasNoticias) => Array.isArray(nuevasNoticias) && nuevasNoticias.length > 0
      );
    } catch (err) {
      setWebhookError("Error al ejecutar el flujo de N8N.");
    } finally {
      setEjecutandoWebhook(false);
    }
  }

  async function manejarEstado(id, nuevoEstado) {
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
    timer,
    noNews,
    intentosSinNoticias,
    webhookError,
    contador,
    horaLocal,
    hayNoticias,
    webhookMessage,
  };
}
