import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true);
      
      // La animación dura ~600ms, cambiamos el contenido a la mitad
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        
        // Termina la animación
        setTimeout(() => {
          setIsTransitioning(false);
        }, 600); // Se queda un poco más para que salga de la pantalla
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation.pathname]);

  return (
    <>
      {isTransitioning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300">
          <div className="animate-cart-drag absolute">
            {/* SVG Persona arrastrando carrito de libros */}
            <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Persona */}
              <circle cx="50" cy="40" r="15" fill="#4F46E5" />
              <rect x="42" y="60" width="16" height="40" rx="5" fill="#4F46E5" />
              <path d="M 50 65 L 85 85" stroke="#4F46E5" strokeWidth="6" strokeLinecap="round" />
              <path d="M 45 100 L 35 140" stroke="#4F46E5" strokeWidth="6" strokeLinecap="round" />
              <path d="M 55 100 L 65 140" stroke="#4F46E5" strokeWidth="6" strokeLinecap="round" />
              
              {/* Carrito */}
              <rect x="80" y="70" width="80" height="60" rx="4" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="4" />
              <circle cx="95" cy="140" r="10" fill="#374151" />
              <circle cx="145" cy="140" r="10" fill="#374151" />
              
              {/* Libros en el carrito */}
              <rect x="90" y="40" width="15" height="30" fill="#EF4444" />
              <rect x="110" y="30" width="15" height="40" fill="#10B981" />
              <rect x="130" y="50" width="15" height="20" fill="#F59E0B" />
              <rect x="150" y="35" width="10" height="35" fill="#8B5CF6" />
            </svg>
          </div>
        </div>
      )}
      {/* Contenido actual (se actualiza cuando el carrito tapa o va a la mitad) */}
      <div className={isTransitioning ? 'opacity-50 transition-opacity' : 'opacity-100 transition-opacity'}>
        {React.cloneElement(children, { location: displayLocation })}
      </div>
    </>
  );
}
