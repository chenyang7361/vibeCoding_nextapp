'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

/**
 * 欢迎页面组件
 * 展示戴森球icon，点击任意处跳转到计算器页面
 */
export default function Home() {
  const router = useRouter();

  // 点击任意位置跳转到计算器页面
  const handleClick = () => {
    router.push('/calculator');
  };

  return (
    <main
      onClick={handleClick}
      className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #0a0e27 0%, #16213e 50%, #1a1a2e 100%)'
      }}
    >
      {/* 背景装饰效果 - 模拟太空星空 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute w-1 h-1 bg-blue-400 rounded-full top-[10%] left-[15%] animate-pulse" />
        <div className="absolute w-1 h-1 bg-purple-400 rounded-full top-[20%] left-[80%] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute w-1 h-1 bg-cyan-400 rounded-full top-[60%] left-[25%] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-1 h-1 bg-blue-300 rounded-full top-[75%] left-[70%] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute w-1 h-1 bg-purple-300 rounded-full top-[40%] left-[90%] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* 主要内容区 */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* 标题和图标组合 */}
        <div className="flex flex-col items-center gap-4">
          {/* 戴森球图标 - 小尺寸精致显示 */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
            <Image
              src="/favicon.ico"
              alt="Dyson Sphere Icon"
              width={64}
              height={64}
              className="relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"
              priority
              unoptimized
            />
          </div>

          {/* 标题 */}
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
            戴森球计划
          </h1>
        </div>

        {/* 副标题 */}
        <p className="text-xl text-blue-200 font-light">量化计算器</p>

        {/* 装饰线条 */}
        <div className="w-48 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />

        {/* 提示文字 */}
        <p className="mt-4 text-sm text-gray-400 animate-pulse">
          点击任意位置开始计算
        </p>
      </div>

      {/* 发光效果 */}
      <div 
        className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
    </main>
  );
}