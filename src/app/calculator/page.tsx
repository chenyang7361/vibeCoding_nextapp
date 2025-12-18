'use client';

import { useState } from 'react';
import ItemSelector from '../../components/ItemSelector';

/**
 * 物品需求数据类型
 */
interface ItemDemand {
  id: number;          // 物品ID
  name: string;        // 物品名称
  iconName: string;    // 图标名称
}

/**
 * 量化计算器主页面
 * 功能：管理用户的物品需求列表
 */
export default function CalculatorPage() {
  // 存储用户选择的物品需求列表
  const [demands, setDemands] = useState<ItemDemand[]>([]);
  // 控制物品选择弹窗的显示/隐藏
  const [showSelector, setShowSelector] = useState(false);

  // 处理用户选择物品
  const handleSelectItem = (item: { ID: number; Name: string; IconName: string }) => {
    // 将选中的物品添加到需求列表
    setDemands([...demands, {
      id: item.ID,
      name: item.Name,
      iconName: item.IconName
    }]);
    // 关闭选择弹窗
    setShowSelector(false);
  };

  return (
    <main 
      className="min-h-screen p-8"
      style={{
        background: 'linear-gradient(135deg, #0a0e27 0%, #16213e 50%, #1a1a2e 100%)'
      }}
    >
      {/* 页面标题 */}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 mb-8">
          戴森球计划 - 量化计算器
        </h1>

        {/* 增加需求按钮 */}
        <button
          onClick={() => setShowSelector(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg 
                     hover:from-blue-600 hover:to-purple-600 transition-all duration-200 
                     shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          + 增加需求
        </button>

        {/* 已选择的物品需求列表 */}
        <div className="mt-8 space-y-4">
          {demands.map((demand, index) => (
            <div 
              key={`${demand.id}-${index}`}
              className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 
                         flex items-center gap-4"
            >
              {/* 物品图标 */}
              <img 
                src={`/icon/Vanilla/${demand.iconName}.png`}
                alt={demand.name}
                className="w-12 h-12"
              />
              {/* 物品名称 */}
              <span className="text-white text-lg">{demand.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 物品选择弹窗 */}
      {showSelector && (
        <ItemSelector
          onSelect={handleSelectItem}
          onClose={() => setShowSelector(false)}
        />
      )}
    </main>
  );
}
