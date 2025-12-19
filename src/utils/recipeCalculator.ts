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

// 材料树节点类型
export interface MaterialNode {
  id: number;
  name: string;
  iconName: string;
  perMinute: number;
  factoryName?: string;
  factoryIconName?: string;
  factoryCount?: number;
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
 * @returns 材料列表(包含每分钟需求量)
 */
export function getMaterialTree(
  itemId: number,
  targetPerMinute: number,
  items: Item[],
  recipes: Recipe[],
  factories: Factory[],
  visited = new Set<number>(),
  recipeSelections: Map<number, number> = new Map()
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
  
  // 获取工厂信息(取第一个工厂)
  const factoryId = recipe?.Factories && recipe.Factories.length > 0 ? recipe.Factories[0] : null;
  const factory = factoryId ? factories.find(f => f.ID === factoryId) : null;
  
  // 计算所需工厂数量
  let factoryCount = 0;
  if (factory && recipe?.TimeSpend) {
    // 配方时间(秒) = TimeSpend / 60
    const recipeTimeInSeconds = recipe.TimeSpend / 60;
    // 考虑工厂速度后的实际时间 = 配方时间 / 工厂速度
    const actualTimeInSeconds = recipeTimeInSeconds / factory.Speed;
    // 每分钟产量 = 60 / 实际时间 * 产出数量
    const productionPerMinute = (60 / actualTimeInSeconds) * resultCount;
    // 所需工厂数 = 目标需求量 / 每分钟产量
    factoryCount = targetPerMinute / productionPerMinute;
  }
  
  // 如果没有配方或配方没有原料(但可能有工厂,如采矿机)
  if (!recipe || !recipe.Items || recipe.Items.length === 0) {
    return [{
      id: item.ID,
      name: item.Name,
      iconName: item.IconName,
      perMinute: targetPerMinute,
      factoryName: factory?.Name,
      factoryIconName: factory?.IconName,
      factoryCount: factoryCount > 0 ? factoryCount : undefined,
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
    factoryName: factory?.Name,
    factoryIconName: factory?.IconName,
    factoryCount: factoryCount,
    recipe: recipe,
    availableRecipes: availableRecipes,
    selectedRecipeId: recipe.ID
  });

  // 递归分解每个原材料
  recipe.Items.forEach((materialId, index) => {
    // 计算该材料的需求量
    const materialCount = recipe.ItemCounts[index] || 1;
    const materialPerMinute = (targetPerMinute * materialCount) / resultCount;
    
    const subMaterials = getMaterialTree(materialId, materialPerMinute, items, recipes, factories, new Set(visited), recipeSelections);
    subMaterials.forEach(mat => {
      // 如果已存在,累加数量
      const existingMat = result.find(r => r.id === mat.id);
      if (existingMat) {
        existingMat.perMinute += mat.perMinute;
        if (existingMat.factoryCount !== undefined && mat.factoryCount !== undefined) {
          existingMat.factoryCount += mat.factoryCount;
        }
      } else {
        result.push(mat);
      }
    });
  });

  return result;
}
