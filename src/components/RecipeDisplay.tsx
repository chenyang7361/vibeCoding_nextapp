/**
 * 配方显示组件
 * 用图标形式展示配方的组成
 */

import { Recipe, Item } from '../utils/recipeCalculator';

interface RecipeDisplayProps {
  recipe?: Recipe;
  items: Item[];
  // 可选：显示所有可用配方
  availableRecipes?: Recipe[];
  // 可选：当前选中的配方ID
  selectedRecipeId?: number;
  // 可选：配方切换回调
  onRecipeChange?: (recipeId: number) => void;
}

/**
 * 渲染单个配方
 * @param recipe 配方数据
 * @param items 所有物品数据
 * @param isSelected 是否为当前选中的配方
 * @param onClick 点击回调（用于切换配方）
 */
function renderSingleRecipe(
  recipe: Recipe, 
  items: Item[], 
  isSelected: boolean,
  onClick?: () => void
) {
  // 如果没有原料(如采矿配方、无中生有配方),只显示产出
  if (!recipe.Items || recipe.Items.length === 0) {
    return (
      <div 
        className={`flex items-center gap-1 flex-wrap px-2 py-1 rounded cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-blue-500/20 border border-blue-500/50' 
            : 'bg-gray-800/30 border border-gray-700/30 hover:border-blue-500/30'
        }`}
        onClick={onClick}
        title={recipe.Name}
      >
        {recipe.Results && recipe.Results.map((resultId, index) => {
          const item = items.find(i => i.ID === resultId);
          if (!item) return null;
          
          return (
            <div key={resultId} className="flex items-center gap-1">
              <img 
                src={`/icon/Vanilla/${item.IconName}.png`}
                alt={item.Name}
                className="w-5 h-5"
                title={item.Name}
              />
              <span className="text-xs text-green-400">{recipe.ResultCounts[index]}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // 有原料的配方
  return (
    <div 
      className={`flex items-center gap-1 flex-wrap px-2 py-1 rounded cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-blue-500/20 border border-blue-500/50' 
          : 'bg-gray-800/30 border border-gray-700/30 hover:border-blue-500/30'
      }`}
      onClick={onClick}
      title={recipe.Name}
    >
      {/* 输入材料 */}
      {recipe.Items.map((itemId, index) => {
        const item = items.find(i => i.ID === itemId);
        if (!item) return null;
        
        return (
          <div key={itemId} className="flex items-center gap-1">
            <img 
              src={`/icon/Vanilla/${item.IconName}.png`}
              alt={item.Name}
              className="w-5 h-5"
              title={item.Name}
            />
            <span className="text-xs text-blue-400">{recipe.ItemCounts[index]}</span>
          </div>
        );
      })}
      
      {/* 箭头 */}
      <span className="text-gray-500 text-xs">→</span>
      
      {/* 产出物品 */}
      {recipe.Results && recipe.Results.map((resultId, index) => {
        const item = items.find(i => i.ID === resultId);
        if (!item) return null;
        
        return (
          <div key={resultId} className="flex items-center gap-1">
            <img 
              src={`/icon/Vanilla/${item.IconName}.png`}
              alt={item.Name}
              className="w-5 h-5"
              title={item.Name}
            />
            <span className="text-xs text-green-400">{recipe.ResultCounts[index]}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 配方显示组件
 * 显示格式: 原料1 数量1 + 原料2 数量2 -> 产物 数量
 * 如果有多个配方，全部并排显示
 */
export default function RecipeDisplay({ 
  recipe, 
  items, 
  availableRecipes, 
  selectedRecipeId, 
  onRecipeChange 
}: RecipeDisplayProps) {
  if (!recipe) {
    return <span className="text-xs text-gray-500">-</span>;
  }

  // 如果有多个配方，上下排列显示所有配方
  if (availableRecipes && availableRecipes.length > 1) {
    return (
      <div className="flex flex-col gap-1">
        {availableRecipes.map(r => (
          <div key={r.ID}>
            {renderSingleRecipe(
              r, 
              items, 
              r.ID === (selectedRecipeId || recipe.ID),
              onRecipeChange ? () => onRecipeChange(r.ID) : undefined
            )}
          </div>
        ))}
      </div>
    );
  }

  // 只有一个配方，直接显示
  return renderSingleRecipe(recipe, items, true, undefined);
}
