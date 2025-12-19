'use client';

import { useState, useEffect } from 'react';
import ItemSelector from '../../components/ItemSelector';
import RecipeDisplay from '../../components/RecipeDisplay';
import { getMaterialTree, Item, Recipe, Factory, MaterialNode } from '../../utils/recipeCalculator';

/**
 * 物品需求数据类型
 */
interface ItemDemand {
  id: number;
  name: string;
  iconName: string;
  perMinute: number;
  materials: MaterialNode[];
  recipeSelections: Map<number, number>;  // 存储用户选择的配方 (物品ID -> 配方ID)
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
  // 存储所有物品数据
  const [items, setItems] = useState<Item[]>([]);
  // 存储所有配方数据
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  // 存储所有工厂数据
  const [factories, setFactories] = useState<Factory[]>([]);
  // 存储输入框的临时值
  const [tempValues, setTempValues] = useState<{ [key: number]: string }>({});

  // 组件加载时读取数据
  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setRecipes(data.recipes || []);
        // 工厂数据也在items数组中,过滤出有Speed字段的
        const factoryData = (data.items || []).filter((item: any) => item.Speed !== undefined);
        setFactories(factoryData);
      })
      .catch(error => {
        console.error('加载数据失败:', error);
      });
  }, []);

  // 处理用户选择物品
  const handleSelectItem = (item: { ID: number; Name: string; IconName: string }) => {
    // 初始化配方选择映射
    const recipeSelections = new Map<number, number>();
    // 计算材料分解树(默认每分钟60个)
    const materials = getMaterialTree(item.ID, 60, items, recipes, factories, new Set(), recipeSelections);
    
    // 将选中的物品添加到需求列表
    setDemands([...demands, {
      id: item.ID,
      name: item.Name,
      iconName: item.IconName,
      perMinute: 60,
      materials: materials,
      recipeSelections: recipeSelections
    }]);
    setShowSelector(false);
  };

  // 删除指定的需求
  const handleRemoveDemand = (index: number) => {
    const newDemands = demands.filter((_, i) => i !== index);
    setDemands(newDemands);
  };

  // 修改需求的每分钟数量
  const handlePerMinuteChange = (index: number, value: string) => {
    // 保存临时输入值
    setTempValues({ ...tempValues, [index]: value });
  };

  // 处理输入框失去焦点或回车
  const handlePerMinuteBlur = (index: number) => {
    const value = tempValues[index];
    if (value === undefined) return;

    const numValue = parseFloat(value);
    // 如果输入无效或为0,恢复原值
    if (isNaN(numValue) || numValue <= 0) {
      // 清除临时值,恢复显示原值
      const newTempValues = { ...tempValues };
      delete newTempValues[index];
      setTempValues(newTempValues);
      return;
    }
    
    // 有效值,更新需求列表
    const newDemands = [...demands];
    newDemands[index].perMinute = numValue;
    // 重新计算材料数量，使用已保存的配方选择
    newDemands[index].materials = getMaterialTree(
      newDemands[index].id, 
      numValue, 
      items, 
      recipes, 
      factories, 
      new Set(), 
      newDemands[index].recipeSelections
    );
    setDemands(newDemands);
    
    // 清除临时值
    const newTempValues = { ...tempValues };
    delete newTempValues[index];
    setTempValues(newTempValues);
  };

  // 处理配方切换
  const handleRecipeChange = (demandIndex: number, materialId: number, recipeId: number) => {
    const newDemands = [...demands];
    const demand = newDemands[demandIndex];
    
    // 更新配方选择
    demand.recipeSelections.set(materialId, recipeId);
    
    // 重新计算材料树
    demand.materials = getMaterialTree(
      demand.id,
      demand.perMinute,
      items,
      recipes,
      factories,
      new Set(),
      demand.recipeSelections
    );
    
    setDemands(newDemands);
  };

  // 处理回车键
  const handlePerMinuteKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // 触发失焦事件
    }
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
        <div className="mt-8 space-y-6">
          {demands.map((demand, index) => (
            <div 
              key={`${demand.id}-${index}`}
              className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-lg overflow-hidden"
            >
              {/* 物品头部 */}
              <div className="p-4 flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-blue-500/20">
                {/* 左侧：物品信息 */}
                <div className="flex items-center gap-4">
                  {/* 物品图标 */}
                  <img 
                    src={`/icon/Vanilla/${demand.iconName}.png`}
                    alt={demand.name}
                    className="w-12 h-12"
                  />
                  <div className="flex flex-col gap-1">
                    {/* 物品名称 */}
                    <span className="text-white text-lg font-semibold">{demand.name}</span>
                    {/* 每分钟数量输入 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">每分钟:</span>
                      <input
                        type="number"
                        value={tempValues[index] !== undefined ? tempValues[index] : demand.perMinute}
                        onChange={(e) => handlePerMinuteChange(index, e.target.value)}
                        onBlur={() => handlePerMinuteBlur(index)}
                        onKeyDown={(e) => handlePerMinuteKeyDown(index, e)}
                        className="w-24 px-2 py-1 bg-gray-700 border border-blue-500/30 rounded
                                   text-white text-sm focus:outline-none focus:border-blue-500"
                        step="0.001"
                      />
                    </div>
                  </div>
                </div>
                
                {/* 右侧：重置按钮 */}
                <button
                  onClick={() => handleRemoveDemand(index)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200
                             border border-red-500/30 hover:border-red-500/50 rounded-lg
                             transition-all duration-200 text-sm font-medium"
                  title="删除此需求"
                >
                  重置
                </button>
              </div>
              
              {/* 材料分解列表 */}
              <div className="p-4">
                <div className="text-sm text-gray-400 mb-3">所需材料:</div>
                {/* 表头 */}
                <div className="flex items-center justify-between px-3 py-2 mb-2 border-b border-blue-500/30">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-300 w-10">物品</span>
                    <span className="text-xs text-gray-300 border-l border-gray-600 pl-3 w-24">所需数量</span>
                    <span className="text-xs text-gray-300 border-l border-gray-600 pl-3 flex-1">配方</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-300 border-l border-gray-600 pl-3">设备数量</span>
                  </div>
                </div>
                {/* 竖排列表显示 */}
                <div className="space-y-2">
                  {demand.materials.map((material, matIndex) => (
                    <div
                      key={`${material.id}-${matIndex}`}
                      className="bg-gray-900/50 border border-blue-500/20 rounded-lg p-3 
                                 flex items-center justify-between hover:border-blue-500/40 
                                 hover:bg-gray-900/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {/* 材料图标 */}
                        <img 
                          src={`/icon/Vanilla/${material.iconName}.png`}
                          alt={material.name}
                          className="w-10 h-10 flex-shrink-0"
                          title={material.name}
                        />
                        {/* 每分钟数量 */}
                        <span className="text-sm text-blue-300 font-mono border-l border-gray-700 pl-3 w-24">
                          {material.perMinute.toFixed(3)}
                        </span>
                        {/* 配方显示 */}
                        <div className="border-l border-gray-700 pl-3 flex-1">
                          <RecipeDisplay 
                            recipe={material.recipe} 
                            items={items}
                            availableRecipes={material.availableRecipes}
                            selectedRecipeId={material.selectedRecipeId}
                            onRecipeChange={(recipeId) => handleRecipeChange(index, material.id, recipeId)}
                          />
                        </div>
                      </div>
                      {/* 工厂信息 */}
                      {material.factoryIconName && (
                        <div className="flex items-center gap-2 border-l border-gray-700 pl-3">
                          {/* 工厂图标 */}
                          <img 
                            src={`/icon/Vanilla/${material.factoryIconName}.png`}
                            alt={material.factoryName || '工厂'}
                            className="w-6 h-6"
                            title={material.factoryName}
                          />
                          {/* 工厂数量 */}
                          <span className="text-xs text-purple-300 font-mono">
                            {material.factoryCount?.toFixed(3)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {demand.materials.length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-4">
                    暂无材料数据
                  </div>
                )}
              </div>
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
