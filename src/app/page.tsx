'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // 追踪鼠标位置
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 监听鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // 根据鼠标位置计算渐变
  const gradientStyle = {
    background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, #1a1a2e 0%, #0f0f1e 50%, #050510 100%)`,
  };

  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center p-24 relative overflow-hidden transition-all duration-300"
      style={gradientStyle}
    >
      {/* 添加一些动态光点效果 */}
      <div 
        className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl transition-all duration-500"
        style={{
          background: 'radial-gradient(circle, #4a5fff 0%, transparent 70%)',
          left: `${mousePosition.x - 192}px`,
          top: `${mousePosition.y - 192}px`,
        }}
      />
      <div 
        className="absolute w-80 h-80 rounded-full opacity-15 blur-3xl transition-all duration-700"
        style={{
          background: 'radial-gradient(circle, #ff4a9f 0%, transparent 70%)',
          left: `${mousePosition.x - 160}px`,
          top: `${mousePosition.y - 160}px`,
        }}
      />

      {/* 内容区域 */}
      <div className="relative z-10">
        <h1 className="text-4xl font-bold text-white">我的第一个 Next.js 应用</h1>
        <p className="mt-4 text-gray-300">Hello, Vibe Coding!</p>
        <p className="mt-2 text-sm text-gray-400">移动鼠标看看效果吧 ✨</p>
      </div>
    </main>
  );
}