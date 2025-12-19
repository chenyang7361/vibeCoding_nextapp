'use client';

import { useState, useEffect } from 'react';
import ItemSelector from '../../components/ItemSelector';
import RecipeDisplay from '../../components/RecipeDisplay';
import { getMaterialTree, calculateTotalEnergy, Item, Recipe, Factory, MaterialNode, FactorySummary } from '../../utils/recipeCalculator';

/**
 * 应用全局工厂选择到所有材料
 * @param itemId 物品ID
 * @param globalFactorySelections 全局工厂选择
 * @param items 所有物品数据
 * @param recipes 所有配方数据
 * @param factories 所有工厂数据
 * @returns 更新后的工厂选择映射
 */
function applyGlobalFactorySelections(
  itemId: number,
  globalFactorySelections: {
    smelter?: number;
    assembler?: number;
    lab?: number;
    miner?: number;
    chemical?: number;
  },
  items: Item[],
  recipes: Recipe[],
  factories: Factory[]
): Map<number, number> {
  const factorySelections = new Map<number, number>();
  
  // 定义工厂类型到工厂ID的映射
  const factoryTypeMap: { [key: number]: 'smelter' | 'assembler' | 'lab' | 'miner' | 'chemical' | null } = {
    2302: 'smelter', 2315: 'smelter', 2319: 'smelter',  // 熔炉
    2303: 'assembler', 2304: 'assembler', 2305: 'assembler', 2318: 'assembler',  // 制造台
    2901: 'lab', 2902: 'lab',  // 研究站
    2301: 'miner', 2316: 'miner',  // 采矿机
    2309: 'chemical', 2317: 'chemical'  // 化工厂
  };
  
  // 递归遍历所有材料，应用全局工厂选择
  function traverse(currentItemId: number, visited = new Set<number>()) {
    if (visited.has(currentItemId)) return;
    visited.add(currentItemId);
    
    // 查找配方
    const itemRecipes = recipes.filter(r => r.Results && r.Results.includes(currentItemId));
    if (itemRecipes.length === 0) return;
    
    const recipe = itemRecipes[0];  // 使用第一个配方
    
    // 处理当前物品的工厂
    if (recipe.Factories && recipe.Factories.length > 0) {
      const firstFactoryId = recipe.Factories[0];
      const factoryType = factoryTypeMap[firstFactoryId];
      
      if (factoryType && globalFactorySelections[factoryType]) {
        // 检查全局选择的工厂是否在可用工厂列表中
        const selectedFactoryId = globalFactorySelections[factoryType]!;
        if (recipe.Factories.includes(selectedFactoryId)) {
          factorySelections.set(currentItemId, selectedFactoryId);
        }
      }
    }
    
    // 递归处理原料
    if (recipe.Items) {
      recipe.Items.forEach(materialId => {
        traverse(materialId, new Set(visited));
      });
    }
  }
  
  traverse(itemId);
  return factorySelections;
}

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
  factorySelections: Map<number, number>;  // 存储用户选择的工厂 (物品ID -> 工厂ID)
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
  // 全局工厂选择：工厂类型 -> 工厂ID
  const [globalFactorySelections, setGlobalFactorySelections] = useState<{
    smelter?: number;      // 熔炉
    assembler?: number;    // 制造台
    lab?: number;          // 研究站
    miner?: number;        // 采矿机
    chemical?: number;     // 化工厂
  }>({});

  // 组件加载时读取数据
  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setRecipes(data.recipes || []);
        // 工厂数据也在items数组中,过滤出Speed字段的
        const factoryData = (data.items || []).filter((item: any) => item.Speed !== undefined);
        setFactories(factoryData);
          
        // 初始化全局工厂选择（选择最高级的）
        setGlobalFactorySelections({
          smelter: 2319,    // 负熙熔炉
          assembler: 2318,  // 重组式制造台
          lab: 2902,        // 自演化研究站
          miner: 2316,      // 大型采矿机
          chemical: 2317    // 量子化工厂
        });
      })
      .catch(error => {
        console.error('加载数据失败:', error);
      });
  }, []);

  // 处理用户选择物品
  const handleSelectItem = (item: { ID: number; Name: string; IconName: string }) => {
    // 初始化配方选择映射
    const recipeSelections = new Map<number, number>();
    // 应用全局工厂选择
    const factorySelections = applyGlobalFactorySelections(
      item.ID,
      globalFactorySelections,
      items,
      recipes,
      factories
    );
    // 计算材料分解树(默认每分钟60个)
    const materials = getMaterialTree(item.ID, 60, items, recipes, factories, new Set(), recipeSelections, factorySelections);
    
    // 将选中的物品添加到需求列表
    setDemands([...demands, {
      id: item.ID,
      name: item.Name,
      iconName: item.IconName,
      perMinute: 60,
      materials: materials,
      recipeSelections: recipeSelections,
      factorySelections: factorySelections
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
    // 重新计算材料数量，使用已保存的配方和工厂选择
    newDemands[index].materials = getMaterialTree(
      newDemands[index].id, 
      numValue, 
      items, 
      recipes, 
      factories, 
      new Set(), 
      newDemands[index].recipeSelections,
      newDemands[index].factorySelections
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
      demand.recipeSelections,
      demand.factorySelections
    );
    
    setDemands(newDemands);
  };

  // 处理全局工厂切换
  const handleGlobalFactoryChange = (factoryType: 'smelter' | 'assembler' | 'lab' | 'miner' | 'chemical', factoryId: number) => {
    // 更新全局工厂选择
    const newGlobalFactorySelections = {
      ...globalFactorySelections,
      [factoryType]: factoryId
    };
    setGlobalFactorySelections(newGlobalFactorySelections);
    
    // 更新所有需求的工厂选择
    const newDemands = demands.map(demand => {
      // 为每个需求应用新的全局工厂选择
      const updatedFactorySelections = applyGlobalFactorySelections(
        demand.id,
        newGlobalFactorySelections,
        items,
        recipes,
        factories
      );
      
      // 重新计算材料树
      const materials = getMaterialTree(
        demand.id,
        demand.perMinute,
        items,
        recipes,
        factories,
        new Set(),
        demand.recipeSelections,
        updatedFactorySelections
      );
      
      return {
        ...demand,
        factorySelections: updatedFactorySelections,
        materials: materials
      };
    });
    
    setDemands(newDemands);
  };

  // 处理单个物品的工厂切换（不影响其他物品）
  const handleFactoryChange = (demandIndex: number, materialId: number, factoryId: number) => {
    const newDemands = [...demands];
    const demand = newDemands[demandIndex];
    
    // 更新工厂选择
    demand.factorySelections.set(materialId, factoryId);
    
    // 重新计算材料树
    demand.materials = getMaterialTree(
      demand.id,
      demand.perMinute,
      items,
      recipes,
      factories,
      new Set(),
      demand.recipeSelections,
      demand.factorySelections
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

        {/* 增加需求按钮和全局工厂选择 */}
        <div className="flex items-start gap-4 flex-wrap">
          <button
            onClick={() => setShowSelector(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg 
                       hover:from-blue-600 hover:to-purple-600 transition-all duration-200 
                       shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            + 增加需求
          </button>
          
          {/* 全局工厂选择 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-400">全局设备：</span>
            <div className="flex items-center gap-3 flex-wrap">
              
              {/* 熔炉 */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 text-center">熔炉</span>
                <div className="flex items-center gap-1">
                  <div 
                    onClick={() => handleGlobalFactoryChange('smelter', 2302)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.smelter === 2302
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="电弧熔炉"
                  >
                    <img src="/icon/Vanilla/smelter.png" alt="电弧熔炉" className="w-8 h-8" />
                  </div>
                  <div 
                    onClick={() => handleGlobalFactoryChange('smelter', 2315)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.smelter === 2315
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="位面熔炉"
                  >
                    <img src="/icon/Vanilla/smelter-2.png" alt="位面熔炉" className="w-8 h-8" />
                  </div>
                  <div 
                    onClick={() => handleGlobalFactoryChange('smelter', 2319)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.smelter === 2319
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="负熙熔炉"
                  >
                    <img src="/icon/Vanilla/smelter-3.png" alt="负熙熔炉" className="w-8 h-8" />
                  </div>
                </div>
              </div>
              
              {/* 制造台 */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 text-center">制造台</span>
                <div className="flex items-center gap-1">
                  <div 
                    onClick={() => handleGlobalFactoryChange('assembler', 2303)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.assembler === 2303
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="制造台 Mk.I"
                  >
                    <img src="/icon/Vanilla/assembler-1.png" alt="制造台 Mk.I" className="w-8 h-8" />
                  </div>
                  <div 
                    onClick={() => handleGlobalFactoryChange('assembler', 2304)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.assembler === 2304
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="制造台 Mk.II"
                  >
                    <img src="/icon/Vanilla/assembler-2.png" alt="制造台 Mk.II" className="w-8 h-8" />
                  </div>
                  <div 
                    onClick={() => handleGlobalFactoryChange('assembler', 2305)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.assembler === 2305
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="制造台 Mk.III"
                  >
                    <img src="/icon/Vanilla/assembler-3.png" alt="制造台 Mk.III" className="w-8 h-8" />
                  </div>
                  <div 
                    onClick={() => handleGlobalFactoryChange('assembler', 2318)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.assembler === 2318
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="重组式制造台"
                  >
                    <img src="/icon/Vanilla/assembler-4.png" alt="重组式制造台" className="w-8 h-8" />
                  </div>
                </div>
              </div>
              
              {/* 研究站 */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 text-center">研究站</span>
                <div className="flex items-center gap-1">
                  <div 
                    onClick={() => handleGlobalFactoryChange('lab', 2901)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.lab === 2901
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="矩阵研究站"
                  >
                    <img src="/icon/Vanilla/lab.png" alt="矩阵研究站" className="w-8 h-8" />
                  </div>
                  <div 
                    onClick={() => handleGlobalFactoryChange('lab', 2902)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.lab === 2902
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="自演化研究站"
                  >
                    <img src="/icon/Vanilla/lab-2.png" alt="自演化研究站" className="w-8 h-8" />
                  </div>
                </div>
              </div>
              
              {/* 采矿机 */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 text-center">采矿机</span>
                <div className="flex items-center gap-1">
                  <div 
                    onClick={() => handleGlobalFactoryChange('miner', 2301)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.miner === 2301
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="采矿机"
                  >
                    <img src="/icon/Vanilla/mining-drill.png" alt="采矿机" className="w-8 h-8" />
                  </div>
                  <div 
                    onClick={() => handleGlobalFactoryChange('miner', 2316)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.miner === 2316
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="大型采矿机"
                  >
                    <img src="/icon/Vanilla/mining-drill-mk2.png" alt="大型采矿机" className="w-8 h-8" />
                  </div>
                </div>
              </div>
              
              {/* 化工厂 */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 text-center">化工厂</span>
                <div className="flex items-center gap-1">
                  <div 
                    onClick={() => handleGlobalFactoryChange('chemical', 2309)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.chemical === 2309
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="化工厂"
                  >
                    <img src="/icon/Vanilla/chemical-plant.png" alt="化工厂" className="w-8 h-8" />
                  </div>
                  <div 
                    onClick={() => handleGlobalFactoryChange('chemical', 2317)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      globalFactorySelections.chemical === 2317
                        ? 'bg-blue-500/30 border-2 border-blue-500'
                        : 'bg-gray-700/50 border-2 border-gray-600 hover:border-blue-400'
                    }`}
                    title="量子化工厂"
                  >
                    <img src="/icon/Vanilla/chemical-plant-2.png" alt="量子化工厂" className="w-8 h-8" />
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>

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
                      {material.availableFactories && material.availableFactories.length > 0 ? (
                        <div className="flex flex-col gap-1 border-l border-gray-700 pl-3">
                          {material.availableFactories.map(factory => (
                            <div 
                              key={factory.id} 
                              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                                factory.id === material.selectedFactoryId
                                  ? 'bg-purple-500/20 border border-purple-500/50'
                                  : 'bg-gray-800/30 border border-gray-700/30 hover:border-purple-500/30'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFactoryChange(index, material.id, factory.id);
                              }}
                              title={factory.name}
                            >
                              {/* 工厂图标 */}
                              <img 
                                src={`/icon/Vanilla/${factory.iconName}.png`}
                                alt={factory.name}
                                className="w-6 h-6"
                                title={factory.name}
                              />
                              {/* 工厂数量 - 只显示选中的 */}
                              {factory.id === material.selectedFactoryId && (
                                <span className="text-xs text-purple-300 font-mono">
                                  {factory.count.toFixed(3)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : material.factoryIconName ? (
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
                      ) : null}
                    </div>
                  ))}
                </div>
                {demand.materials.length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-4">
                    暂无材料数据
                  </div>
                )}
                
                {/* 合计行 */}
                {demand.materials.length > 0 && (() => {
                  const summary = calculateTotalEnergy(demand.materials, items);
                  return (
                    <div className="mt-4 pt-3 border-t border-blue-500/30">
                      <div className="px-3 py-2 bg-gray-900/50 rounded-lg space-y-3">
                        {/* 标题 */}
                        <div className="text-sm text-blue-300 font-semibold">合计</div>
                        
                        {/* 工厂汇总 */}
                        {summary.factories.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-400">设备:</span>
                            {summary.factories.map(factory => (
                              <div 
                                key={factory.id}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded border border-gray-700/50"
                                title={`${items.find(i => i.ID === factory.id)?.Name || ''}`}
                              >
                                <img 
                                  src={`/icon/Vanilla/${factory.iconName}.png`}
                                  alt=""
                                  className="w-5 h-5"
                                />
                                <span className="text-xs text-purple-300 font-mono">
                                  {factory.count.toFixed(3)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* 总耗能 */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">总耗能:</span>
                          <span className="text-sm text-yellow-300 font-mono font-semibold">
                            {summary.totalEnergy.toFixed(3)} MW
                          </span>
                        </div>
                        
                        {/* 占地面积 */}
                        {summary.totalSpace > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">占地面积:</span>
                            <span className="text-sm text-cyan-300 font-mono font-semibold">
                              {summary.totalSpace.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
