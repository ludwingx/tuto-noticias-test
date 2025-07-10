import { FaFilePdf } from "react-icons/fa6";
import { FiDownload } from "react-icons/fi";

export default function ActionButtons({
  ejecutarWebhook,
  generarBoletin,
  ejecutandoWebhook,
  generando,
  hayNoticias,
  contador,       // el viejo contador, ya no usado para temporizador en botón
  showFullButtons = false,
  disabled,
  estadoProceso,  // estado actual del proceso ("pendiente", "procesando", etc)
  countdown,      // temporizador calculado basado en created_at (en segundos)
}) {
  // Función para formatear segundos a mm:ss
  const formatSeconds = (seconds) => {
    if (seconds == null) return null;
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {showFullButtons && (
        <button
          onClick={generarBoletin}
          disabled={generando}
          className="flex items-center justify-center gap-2 bg-[#123488] text-white px-4 py-2 rounded-md hover:bg-[#0f2c6b] disabled:opacity-50 transition text-sm sm:text-base"
        >
          {generando ? (
            "Generando..."
          ) : (
            <>
              <FaFilePdf />
              <span className="whitespace-nowrap">Descargar Boletín</span>
              <FiDownload />
            </>
          )}
        </button>
      )}

      <button
        onClick={ejecutarWebhook}
        disabled={disabled}
        className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition text-sm sm:text-base"
      >
        {ejecutandoWebhook
          ? "Ejecutando..."
          : (estadoProceso === "pendiente" || estadoProceso === "procesando") && countdown !== null && countdown > 0
          ? `Disponible en ${formatSeconds(countdown)}`
          : "Cargar Noticias"}
      </button>
    </div>
  );
}
