"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import NewsSection from "@/components/NewsSection";
import ActionButtons from "@/components/ActionButtons";
import Filters from "@/components/Filters";
import { useNews } from "@/hooks/useNews";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";

export default function HomePage() {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const {
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
    mostrarModalCargaNoticias,
    tiempoEspera,
    webhookError,
    contador,
    horaLocal,
    hayNoticias,
  } = useNews(email);

  const { generarBoletin, generando, errorGen } = usePDFGenerator(noticias);
  const [activeSection, setActiveSection] = useState("all");
  const [procesosWorkflow, setProcesosWorkflow] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  const fetchProcesos = async () => {
    try {
      const res = await fetch("/api/procesos-workflow");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setProcesosWorkflow(data);
    } catch (err) {
      console.error("Error al consultar procesos_workflow:", err);
    }
  };

  useEffect(() => {
    fetchProcesos();
    const interval = setInterval(fetchProcesos, 5000);
    return () => clearInterval(interval);
  }, []);

  const errorMessage = errorGen || webhookError;
  const procesoMasReciente = procesosWorkflow?.[0];
  const estadoProceso = procesoMasReciente?.estado?.toLowerCase();
  const mensajeProceso = procesoMasReciente?.mensaje;
  const cantidadNoticias = procesoMasReciente?.cantidad;

  const deshabilitarBotones =
    estadoProceso === "pendiente" ||
    estadoProceso === "procesando" ||
    hayNoticias;

  const enProceso =
    estadoProceso === "pendiente" || estadoProceso === "procesando";

  useEffect(() => {
    if (cantidadNoticias && cantidadNoticias > 0) {
      const totalSeconds = cantidadNoticias * 10;
      setCountdown(totalSeconds);

      if (countdownRef.current) clearInterval(countdownRef.current);

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownRef.current);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [cantidadNoticias]);

  const formatSeconds = (seconds) => {
    if (seconds == null || seconds <= 0) return null;
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (estadoProceso === "procesandonoticia" && mensajeProceso) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 min-h-[70vh] flex items-center justify-center">
        <div className="bg-yellow-100 text-yellow-900 p-6 rounded-md text-center text-lg font-semibold max-w-xl">
          <p>📥 Extrayendo y filtrando noticias...</p>
          <p className="mt-2">🤖 Noticia procesándose ahora mismo con IA:</p>
          <p className="mt-2 italic">{mensajeProceso}</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 min-h-[70vh] flex items-center justify-center">
        <p className="text-lg">Cargando noticias...</p>
      </main>
    );
  }

  if (!loading && noticias.length === 0) {
    return (
      <main className="min-h-[70vh] flex flex-col justify-center items-center px-4 py-10 bg-white max-w-4xl mx-auto">
        {!enProceso && (
          <>
            <h1 className="text-3xl font-bold mb-6">Noticias recientes</h1>
            <p className="text-gray-500 text-lg mb-6">
              No hay noticias disponibles.
            </p>
          </>
        )}

        <ActionButtons
          ejecutarWebhook={ejecutarWebhook}
          generarBoletin={generarBoletin}
          ejecutandoWebhook={ejecutandoWebhook}
          generando={generando}
          hayNoticias={hayNoticias}
          contador={contador}
          disabled={deshabilitarBotones}
        />

        <p className="text-gray-400 mt-2 text-sm">Hora local: {horaLocal}</p>

        {hayNoticias && contador !== null && (
          <p className="text-yellow-600 mt-4 text-center">
            Ya se extrajeron noticias. Podrás volver a cargar a las 8:30 am de
            mañana.
          </p>
        )}

        {errorMessage && (
          <p className="text-red-600 mt-4 text-center max-w-md">
            {errorMessage}
          </p>
        )}

        {cantidadNoticias && cantidadNoticias > 0 && (
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md mb-2 text-center font-semibold">
            Extrayendo, procesando y filtrando {cantidadNoticias} noticias
            {countdown !== null && countdown > 0 && (
              <p className="mt-2 font-mono text-lg text-red-600">
                Tiempo estimado restante: {formatSeconds(countdown)}
              </p>
            )}
          </div>
        )}

        {mostrarModalCargaNoticias && (
          <div className="mt-6 px-4 py-2 rounded bg-gray-100 text-gray-700 text-center">
            Procesando... espera un momento ⏳
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-white">
      {!enProceso && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Noticias recientes</h1>
        </div>
      )}

      <ActionButtons
        ejecutarWebhook={ejecutarWebhook}
        generarBoletin={generarBoletin}
        ejecutandoWebhook={ejecutandoWebhook || waiting}
        generando={generando}
        hayNoticias={hayNoticias}
        contador={contador}
        showFullButtons
        disabled={deshabilitarBotones}
      />

      <Filters
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 rounded-md">
          <p className="text-red-600">{errorMessage}</p>
        </div>
      )}

      {estadoProceso !== "completado" && mensajeProceso && (
        <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded-md text-center">
          {mensajeProceso}
          {countdown !== null && countdown > 0 && (
            <p className="mt-2 font-mono text-lg text-red-600">
              Tiempo estimado restante: {formatSeconds(countdown)}
            </p>
          )}
        </div>
      )}

      <SectionWrapper activeSection={activeSection} section="tuto">
        <NewsSection
          title="Noticias de: Tuto Quiroga"
          noticias={noticiasTuto}
          colorClass="text-[#123488]"
          manejarEstado={manejarEstado}
          actualizandoEstado={actualizandoEstado}
          noNewsMessage="Hoy no hay noticias de Tuto Quiroga."
        />
      </SectionWrapper>

      <SectionWrapper activeSection={activeSection} section="jp">
        <NewsSection
          title="Noticias de: Juan Pablo Velasco"
          noticias={noticiasJP}
          colorClass="text-[#da0b0a]"
          manejarEstado={manejarEstado}
          actualizandoEstado={actualizandoEstado}
          noNewsMessage="Hoy no hay noticias de Juan Pablo Velasco."
        />
      </SectionWrapper>

      <SectionWrapper activeSection={activeSection} section="otros">
        <NewsSection
          title="Otras Noticias"
          noticias={noticiasOtros}
          colorClass="text-gray-700"
          manejarEstado={manejarEstado}
          actualizandoEstado={actualizandoEstado}
          noNewsMessage="No hay noticias cargadas."
        />
      </SectionWrapper>

      {mostrarModalCargaNoticias && (
        <div className="mt-6 px-4 py-2 rounded bg-gray-100 text-gray-700 text-center">
          Procesando... espera un momento ⏳
        </div>
      )}
    </main>
  );
}

function SectionWrapper({ activeSection, section, children }) {
  if (activeSection !== "all" && activeSection !== section) return null;
  return children;
}
