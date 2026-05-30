import { useRef } from "react";
import { X } from "lucide-react";

export function PhotoPicker({ photos = [], onChange, max = 3 }) {
  const inputRef = useRef(null);

  const compress = (file, cb) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 800;
      let { width: w, height: h } = img;
      if (w > MAX) { h = Math.round(h * (MAX / w)); w = MAX; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL("image/jpeg", 0.6));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const onFile = e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    let done = 0;
    const newPhotos = [...photos];
    files.slice(0, max - photos.length).forEach(f => {
      compress(f, b64 => {
        newPhotos.push(b64);
        done++;
        if (done === Math.min(files.length, max - photos.length)) onChange(newPhotos);
      });
    });
    e.target.value = "";
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {photos.map((p, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
            <img src={p} className="w-full h-full object-cover" onClick={() => { const w = window.open(); w.document.write(`<img src="${p}" style="max-width:100%">`); }} style={{ cursor: "zoom-in" }}/>
            <button onClick={() => onChange(photos.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"><X size={9} className="text-white"/></button>
          </div>
        ))}
        {photos.length < max && (
          <button onClick={() => inputRef.current?.click()} className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition text-xs">
            <span className="text-lg leading-none">📷</span><span className="text-xs">Foto</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onFile}/>
    </div>
  );
}
