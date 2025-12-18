'use client';

import { useState, useEffect } from 'react';

/**
 * 物品数据类型定义
 */
interface Item {
  ID: number;
  Type: number;
  Name: string;
  GridIndex: number;
  IconName: string;
}

/**
 * 组件属性类型
 */
interface ItemSelectorProps {
  onSelect: (item: Item) => void;  // 选择物品时的回调函数
  onClose: () => void;              // 关闭弹窗的回调函数
}

/**
 * 物品选择弹窗组件
 * 展示所有游戏物品，用户可以点击选择
 */
export default function ItemSelector({ onSelect, onClose }: ItemSelectorProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 组件加载时通过 API 读取物品数据
  useEffect(() => {
    // 从 API 路由获取物品数据
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        setItems(data.items);
        setLoading(false);
      })
      .catch(error => {
        console.error('加载物品数据失败:', error);
        setLoading(false);
      });
  }, []);

  // 根据搜索词过滤物品
  const filteredItems = items.filter(item => 
    item.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // 弹窗遮罩层 - 点击背景关闭弹窗
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 弹窗主体 - 阻止点击事件冒泡 */}
      <div 
        className="bg-gray-900 border-2 border-blue-500/50 rounded-2xl w-[90%] max-w-4xl max-h-[80vh] 
                   flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 弹窗头部 */}
        <div className="p-6 border-b border-blue-500/30">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              选择物品
            </h2>
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center
                         hover:bg-gray-800 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          
          {/* 搜索框 */}
          <input
            type="text"
            placeholder="搜索物品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-blue-500/30 rounded-lg 
                       text-white placeholder-gray-500 focus:outline-none focus:border-blue-500
                       transition-colors"
          />
        </div>

        {/* 物品网格列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 加载状态 */}
          {loading ? (
            <div className="text-center text-gray-400 py-12">
              加载中...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.ID}
                    onClick={() => onSelect(item)}
                    className="group cursor-pointer flex flex-col items-center gap-2 p-3 
                               bg-gray-800/50 hover:bg-gray-700/70 border border-blue-500/20 
                               hover:border-blue-500/60 rounded-lg transition-all duration-200
                               hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20"
                    title={item.Name}
                  >
                    {/* 物品图标 */}
                    <img
                      src={`/icon/Vanilla/${item.IconName}.png`}
                      alt={item.Name}
                      className="w-12 h-12 object-contain"
                    />
                    {/* 物品名称 - 悬停时显示 */}
                    <span className="text-xs text-gray-400 group-hover:text-blue-300 text-center 
                                     line-clamp-2 transition-colors">
                      {item.Name}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* 无搜索结果提示 */}
              {filteredItems.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  未找到匹配的物品
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部信息栏 */}
        <div className="p-4 border-t border-blue-500/30 text-sm text-gray-400 text-center">
          共 {filteredItems.length} 个物品
        </div>
      </div>
    </div>
  );
}
