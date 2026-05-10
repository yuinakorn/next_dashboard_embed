import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Download, Layout, ShieldCheck } from 'lucide-react';

const App = () => {
  const canvasRef = useRef(null);
  const [seed, setSeed] = useState(Math.random());

  // Function to draw abstract art on Canvas
  const drawAbstractArt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = 800;
    const height = canvas.height = 1200;

    // 1. Background Fill
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#1a1a1a');
    bgGradient.addColorStop(1, '#000000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Random Shapes
    const shapeCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < shapeCount; i++) {
      ctx.save();
      
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 200 + Math.random() * 600;
      
      // Create Gradient for Shape
      const shapeGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      const opacity = 0.1 + Math.random() * 0.2;
      shapeGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      shapeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = shapeGradient;
      
      // Randomly choose between Circle and Polygon
      if (Math.random() > 0.5) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.translate(x, y);
        ctx.rotate(Math.random() * Math.PI);
        ctx.beginPath();
        ctx.moveTo(-size, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(-size, size);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Add Architectural Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      const startY = Math.random() * height;
      ctx.moveTo(0, startY);
      ctx.lineTo(width, startY + (Math.random() - 0.5) * 400);
      ctx.stroke();
    }

    // 4. Add Noise/Grain Effect
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 15;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    drawAbstractArt();
  }, [seed]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'generative-bg.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 md:p-10 font-sans">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-bold tracking-tighter text-xl">
              <ShieldCheck className="size-6" />
              <span>DESIGN SYSTEM</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase">Generative BG Generator</h1>
            <p className="text-slate-500">สร้างพื้นหลัง Abstract ด้วย Code (ไม่ต้องพึ่งพา Image API)</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSeed(Math.random())}
              className="flex items-center gap-2 bg-white border-2 border-black text-black px-6 py-3 font-bold rounded-none hover:bg-black hover:text-white transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <RefreshCw className="size-5" />
              GENERATE NEW
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-black text-white px-6 py-3 font-bold rounded-none hover:bg-zinc-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
            >
              <Download className="size-5" />
              SAVE PNG
            </button>
          </div>
        </header>

        {/* Layout Preview */}
        <div className="bg-white shadow-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row min-h-[600px] rounded-sm">
          
          {/* Left Section: Generative Art */}
          <div className="w-full md:w-5/12 relative bg-zinc-900 overflow-hidden">
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Overlay Content (Simulating original design) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-center p-12 text-white z-10">
              <div className="space-y-6">
                <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-[10px] tracking-[0.2em] font-bold">
                  OPEN DATA PLATFORM
                </div>
                <h2 className="text-4xl font-bold leading-tight">Dashboard Hub</h2>
                <div className="w-12 h-1 bg-blue-500"></div>
                <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
                  ระบบจัดการข้อมูลสุขภาพอัจฉริยะ 
                  ตรวจสอบและรายงานผลแบบ Real-time สำหรับบุคลากรภายใน
                </p>
              </div>
            </div>
          </div>

          {/* Right Section: Login Form UI */}
          <div className="w-full md:w-7/12 p-8 md:p-16 flex flex-col justify-center bg-white">
            <div className="max-w-md w-full mx-auto space-y-8">
              <div>
                <span className="text-blue-600 font-bold text-xs tracking-widest uppercase mb-2 block">Secure Login</span>
                <h3 className="text-3xl font-bold text-slate-900">ยืนยันตัวตน</h3>
                <p className="text-slate-500 mt-2">กรุณาเข้าสู่ระบบผ่าน Central Auth เพื่อใช้งาน</p>
              </div>

              <div className="space-y-4">
                <button className="w-full py-4 bg-black text-white font-bold text-sm tracking-wide hover:bg-zinc-800 transition-colors flex items-center justify-center gap-3">
                  เข้าสู่ระบบด้วยบัญชีกลาง
                </button>
                <button className="w-full py-4 border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                  ดูสถิติสาธารณะ
                </button>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Instructions</p>
                <ul className="space-y-4">
                  {[
                    { step: 1, title: 'คลิกปุ่ม Login', desc: 'ระบบจะนำไปยังหน้า OAuth' },
                    { step: 2, title: 'กรอกรหัสพนักงาน', desc: 'ใช้ Username เดียวกับระบบ HR' },
                    { step: 3, title: 'เริ่มใช้งาน', desc: 'เข้าถึง Dashboard ตามสิทธิ์ของคุณ' }
                  ].map((item) => (
                    <li key={item.step} className="flex gap-4">
                      <span className="text-slate-300 font-black text-xl italic leading-none">{item.step.toString().padStart(2, '0')}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="pt-6 text-[10px] text-slate-400 font-medium">
                Version 1.2.0 • Secured by Enterprise Guard
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Technique', value: 'Canvas Generative Art' },
            { label: 'Colors', value: 'Monochrome Gradients' },
            { label: 'Effect', value: 'Digital Noise / Grain' },
            { label: 'Performance', value: 'Zero API Dependency' }
          ].map(info => (
            <div key={info.label} className="bg-white border border-slate-200 p-4 rounded-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase">{info.label}</p>
              <p className="text-sm font-bold text-slate-700">{info.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;