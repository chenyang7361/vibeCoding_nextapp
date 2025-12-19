/**
 * 配方计算工具函数
 * 负责材料树的递归分解和工厂数量计算
 */

// 物品数据类型
export interface Item {
  ID: number;
  Type: number;
  Name: string;
  GridIndex: number;
  IconName: string;
}

// 工厂/设备数据类型
export interface Factory {
  ID: number;
  Name: string;
  IconName: string;
  Speed: number;
}

// 配方数据类型
export interface Recipe {
  ID: number;
  Name: string;
  Items: number[];
  ItemCounts: number[];
  Results: number[];
  ResultCounts: number[];
  TimeSpend: number;
  Factories: number[];
  IconName: string;
}

// 工厂数量信息类型
export interface FactoryInfo {
  id: number;
  name: string;
  iconName: string;
  count: number;
}

// 材料树节点类型
export interface MaterialNode {
  id: number;
  name: string;
  iconName: string;
  perMinute: number;
  factoryName?: string;  // 保留用于兼容性
  factoryIconName?: string;  // 保留用于兼容性
  factoryCount?: number;  // 保留用于兼容性
  availableFactories?: FactoryInfo[];  // 所有可用工厂及其数量
  selectedFactoryId?: number;  // 当前选中的工厂ID
  recipe?: Recipe;  // 当前使用的配方
  availableRecipes?: Recipe[];  // 该物品的所有可用配方
  selectedRecipeId?: number;  // 当前选中的配方ID
}

/**
 * 获取物品的所有可用配方
 * @param itemId 物品ID
 * @param recipes 所有配方数据
 * @returns 该物品的所有配方列表
 */
export function getRecipesForItem(itemId: number, recipes: Recipe[]): Recipe[] {
  return recipes.filter(r => r.Results && r.Results.includes(itemId));
}

/**
 * 递归分解物品,获取所有所需材料
 * @param itemId 物品ID
 * @param targetPerMinute 目标物品的每分钟需求量
 * @param items 所有物品数据
 * @param recipes 所有配方数据
 * @param factories 所有工厂数据
 * @param visited 已访问的物品集合(防止循环依赖)
 * @param recipeSelections 用户选择的配方映射 (物品ID -> 配方ID)
 * @param factorySelections 用户选择的工厂映射 (物品ID -> 工厂ID)
 * @returns 材料列表(包含每分钟需求量)
 */
/**
 * 计算所有配方产生的副产物
 * @param materials 材料节点列表
 * @returns 副产物映射 (物品ID -> 每分钟产量)
 */
function calculateByproducts(materials: MaterialNode[]): Map<number, number> {
  const byproducts = new Map<number, number>();
  
  materials.forEach(material => {
    const recipe = material.recipe;
    if (!recipe || !recipe.Results || recipe.Results.length <= 1) {
      // 没有配方或只有一个产物,没有副产物
      return;
    }
    
    // 一个配方可能有多个产物,第一个是主产物,其他的是副产物
    recipe.Results.forEach((resultId, index) => {
      if (resultId === material.id) {
        // 这是主产物,不是副产物
        return;
      }
      
      // 这是副产物
      const resultCount = recipe.ResultCounts[index] || 1;
      const mainResultIndex = recipe.Results.indexOf(material.id);
      const mainResultCount = recipe.ResultCounts[mainResultIndex] || 1;
      
      // 计算副产物的每分钟产量
      // 副产物产量 = (主产物需求量 / 主产物配方产出) * 副产物配方产出
      const byproductPerMinute = (material.perMinute / mainResultCount) * resultCount;
      
      // 累加副产物
      const existing = byproducts.get(resultId) || 0;
      byproducts.set(resultId, existing + byproductPerMinute);
    });
  });
  
  return byproducts;
}

/**
 * 用副产物抵扣原材料需求
 * @param materials 材料节点列表
 * @param byproducts 副产物映射
 * @returns 抵扣后的材料列表
 */
function deductByproducts(
  materials: MaterialNode[],
  byproducts: Map<number, number>
): MaterialNode[] {
  // 创建新的材料列表,避免修改原列表
  const result: MaterialNode[] = [];
  
  materials.forEach(material => {
    const byproductAmount = byproducts.get(material.id) || 0;
    
    if (byproductAmount > 0) {
      // 有副产物可以抵扣
      const newPerMinute = material.perMinute - byproductAmount;
      
      if (newPerMinute > 0.001) {
        // 副产物不足以完全抵扣,需要保留这个材料但减少数量
        const ratio = newPerMinute / material.perMinute;
        
        // 重新计算工厂数量
        let newFactoryCount = material.factoryCount ? material.factoryCount * ratio : undefined;
        let newAvailableFactories = material.availableFactories?.map(factory => ({
          ...factory,
          count: factory.count * ratio
        }));
        
        result.push({
          ...material,
          perMinute: newPerMinute,
          factoryCount: newFactoryCount,
          availableFactories: newAvailableFactories
        });
      }
      // 如果 newPerMinute <= 0.001,说明副产物完全抵扣了需求,不添加到结果中
    } else {
      // 没有副产物抵扣,保持原样
      result.push(material);
    }
  });
  
  return result;
}

export function getMaterialTree(
  itemId: number,
  targetPerMinute: number,
  items: Item[],
  recipes: Recipe[],
  factories: Factory[],
  visited = new Set<number>(),
  recipeSelections: Map<number, number> = new Map(),
  factorySelections: Map<number, number> = new Map()
): MaterialNode[] {
  // 防止循环依赖
  if (visited.has(itemId)) {
    return [];
  }
  visited.add(itemId);

  // 查找该物品的信息
  const item = items.find(i => i.ID === itemId);
  if (!item) {
    return [];
  }

  // 获取该物品的所有可用配方
  const availableRecipes = getRecipesForItem(itemId, recipes);
  
  // 确定使用哪个配方: 1.用户选择的 2.默认第一个
  let recipe: Recipe | undefined;
  const selectedRecipeId = recipeSelections.get(itemId);
  if (selectedRecipeId) {
    recipe = availableRecipes.find(r => r.ID === selectedRecipeId);
  }
  if (!recipe && availableRecipes.length > 0) {
    recipe = availableRecipes[0];  // 默认使用第一个配方
  }
  
  // 计算配方产出比例
  const resultIndex = recipe?.Results.indexOf(itemId) ?? -1;
  const resultCount = (recipe && resultIndex >= 0) ? (recipe.ResultCounts[resultIndex] || 1) : 1;
  
  // 计算所有可用工厂的数量
  const availableFactories: FactoryInfo[] = [];
  if (recipe?.Factories && recipe.Factories.length > 0 && recipe.TimeSpend) {
    recipe.Factories.forEach(factoryId => {
      const factory = factories.find(f => f.ID === factoryId);
      if (factory) {
        // 配方时间(秒) = TimeSpend / 60
        const recipeTimeInSeconds = recipe.TimeSpend / 60;
        // 考虑工厂速度后的实际时间 = 配方时间 / 工厂速度
        const actualTimeInSeconds = recipeTimeInSeconds / factory.Speed;
        // 每分钟产量 = 60 / 实际时间 * 产出数量
        const productionPerMinute = (60 / actualTimeInSeconds) * resultCount;
        // 所需工厂数 = 目标需求量 / 每分钟产量
        const factoryCount = targetPerMinute / productionPerMinute;
        
        availableFactories.push({
          id: factory.ID,
          name: factory.Name,
          iconName: factory.IconName,
          count: factoryCount
        });
      }
    });
  }
  
  // 确定使用哪个工厂: 1.用户选择的 2.默认第一个
  let selectedFactoryId = factorySelections.get(itemId);
  let selectedFactory: FactoryInfo | undefined;
  
  if (selectedFactoryId) {
    selectedFactory = availableFactories.find(f => f.id === selectedFactoryId);
  }
  if (!selectedFactory && availableFactories.length > 0) {
    selectedFactory = availableFactories[0];  // 默认使用第一个工厂
    selectedFactoryId = selectedFactory.id;
  }
  
  // 获取第一个工厂信息(用于兼容性)
  const factoryId = recipe?.Factories && recipe.Factories.length > 0 ? recipe.Factories[0] : null;
  const factory = factoryId ? factories.find(f => f.ID === factoryId) : null;
  
  // 计算选中工厂的数量(用于兼容性)
  let factoryCount = 0;
  if (selectedFactory) {
    factoryCount = selectedFactory.count;
  }
  
  // 如果没有配方或配方没有原料(但可能有工厂,如采矿机)
  if (!recipe || !recipe.Items || recipe.Items.length === 0) {
    return [{
      id: item.ID,
      name: item.Name,
      iconName: item.IconName,
      perMinute: targetPerMinute,
      factoryName: selectedFactory ? selectedFactory.name : factory?.Name,
      factoryIconName: selectedFactory ? selectedFactory.iconName : factory?.IconName,
      factoryCount: factoryCount > 0 ? factoryCount : undefined,
      availableFactories: availableFactories.length > 0 ? availableFactories : undefined,
      selectedFactoryId: selectedFactoryId,
      recipe: recipe,
      availableRecipes: availableRecipes,
      selectedRecipeId: recipe?.ID
    }];
  }
  
  // 有配方,需要递归分解
  const result: MaterialNode[] = [];
  
  // 先添加当前物品本身
  result.push({
    id: item.ID,
    name: item.Name,
    iconName: item.IconName,
    perMinute: targetPerMinute,
    factoryName: selectedFactory ? selectedFactory.name : factory?.Name,
    factoryIconName: selectedFactory ? selectedFactory.iconName : factory?.IconName,
    factoryCount: factoryCount,
    availableFactories: availableFactories.length > 0 ? availableFactories : undefined,
    selectedFactoryId: selectedFactoryId,
    recipe: recipe,
    availableRecipes: availableRecipes,
    selectedRecipeId: recipe.ID
  });

  // 递归分解每个原材料
  recipe.Items.forEach((materialId, index) => {
    // 计算该材料的需求量
    const materialCount = recipe.ItemCounts[index] || 1;
    const materialPerMinute = (targetPerMinute * materialCount) / resultCount;
    
    const subMaterials = getMaterialTree(materialId, materialPerMinute, items, recipes, factories, new Set(visited), recipeSelections, factorySelections);
    subMaterials.forEach(mat => {
      // 如果已存在,累加数量
      const existingMat = result.find(r => r.id === mat.id);
      if (existingMat) {
        existingMat.perMinute += mat.perMinute;
        // 累加工厂数量(兼容性字段)
        if (existingMat.factoryCount !== undefined && mat.factoryCount !== undefined) {
          existingMat.factoryCount += mat.factoryCount;
        }
        // 累加所有工厂的数量
        if (existingMat.availableFactories && mat.availableFactories) {
          existingMat.availableFactories.forEach(existingFactory => {
            const matchingFactory = mat.availableFactories?.find(f => f.id === existingFactory.id);
            if (matchingFactory) {
              existingFactory.count += matchingFactory.count;
            }
          });
        }
      } else {
        result.push(mat);
      }
    });
  });

  // 应用副产物抵扣逻辑
  // 1. 计算所有配方产生的副产物
  const byproducts = calculateByproducts(result);
  
  // 2. 用副产物抵扣原材料需求
  const deductedResult = deductByproducts(result, byproducts);
  
  return deductedResult;
}
