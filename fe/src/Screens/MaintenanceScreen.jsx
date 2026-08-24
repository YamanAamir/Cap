import React from 'react';

const MaintenanceScreen = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAF9F6] text-[#1A2E2C] p-6 font-sans antialiased relative">
      {/* Subtle top indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#0F3B3A]"></div>

      <div className="w-full max-w-md mx-auto text-center">
        {/* A simple status dot */}
        <div className="inline-flex items-center gap-2 mb-6 text-xs font-medium text-[#0F3B3A]/80 tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#0F3B3A] animate-pulse"></span>
          <span>Vedligeholdelse</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-[#0F3B3A] tracking-tight mb-4">
          Siden er under vedligeholdelse
        </h1>

        {/* Description */}
        <p className="text-[#4A5D5A] text-base leading-relaxed mb-8">
          Vi opdaterer systemet for at forbedre din oplevelse. Vi forventer at være online igen inden længe. Tak for din tålmodighed!
        </p>

        {/* Return to Home Button */}
        <div className="mb-10">
          <a 
            href="https://studentlife.dk" 
            className="inline-flex items-center justify-center px-6 py-3 bg-[#0F3B3A] hover:bg-[#154E4C] text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          >
            Gå til Student Life
          </a>
        </div>

        {/* Minimal footer */}
        <p className="text-xs text-[#8BA09D]">
          &copy; {new Date().getFullYear()} Student Life
        </p>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
