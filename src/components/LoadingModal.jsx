import { useEffect, useState } from "react";

export default function LoadingModal({ proceso, tiempoEspera }) {
  const [dots, setDots] = useState("");
  const [tiempoMostrado, setTiempoMostrado] = useState(0);

  // Efecto para actualizar el tiempo mostrado
  useEffect(() => {
    setTiempoMostrado(tiempoEspera); // Actualizar con el valor inicial
    
    if (tiempoEspera > 0) {
      const interval = setInterval(() => {
        setTiempoMostrado(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [tiempoEspera]);

  // Efecto para los puntos animados
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Función para formatear el tiempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center min-w-[300px]">
        <div className="text-lg font-semibold mb-2 text-center">
          {proceso || "Cargando"}
          {!proceso?.endsWith("...") && dots}
        </div>
        {tiempoMostrado > 0 && (
          <div className="text-sm text-gray-600">
            Tiempo estimado: {formatTime(tiempoMostrado)}
          </div>
        )}
      </div>
    </div>
  );
}