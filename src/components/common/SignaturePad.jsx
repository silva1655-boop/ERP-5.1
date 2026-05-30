import { useRef, useEffect } from "react";

export function SignaturePad({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const start = e => {
    e.preventDefault();
    const c = canvasRef.current; if (!c) return;
    drawing.current = true;
    const ctx = c.getContext("2d");
    const { x, y } = getPos(e, c);
    ctx.beginPath(); ctx.moveTo(x, y);
  };

  const move = e => {
    e.preventDefault();
    if (!drawing.current) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    const { x, y } = getPos(e, c);
    ctx.lineTo(x, y); ctx.stroke();
  };

  const stop = () => { drawing.current = false; };

  const clear = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    ctx.strokeStyle = "#1e3a5f"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-gray-500 text-sm">Firma en el recuadro a continuación:</p>
      <canvas ref={canvasRef} width={460} height={180}
        className="w-full border-2 border-gray-300 rounded-xl bg-white touch-none"
        style={{ cursor: "crosshair" }}
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
      />
      <div className="flex gap-2">
        <button onClick={clear} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition">Limpiar</button>
        <button onClick={() => onSave(canvasRef.current?.toDataURL("image/png") || null)} className="flex-1 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition" style={{ background: "#002060" }}>Guardar Firma</button>
        <button onClick={onCancel} className="py-2 px-4 rounded-lg border border-gray-200 text-gray-400 text-sm hover:bg-gray-50 transition">Saltar</button>
      </div>
    </div>
  );
}
