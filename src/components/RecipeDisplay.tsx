/**
 * 配方显示组件
 * 用图标形式展示配方的组成
 */

import { Recipe, Item } from '../utils/recipeCalculator';

interface RecipeDisplayProps {
  recipe?: Recipe;
  items: Item[];
}

/**
 * 配方显示组件
 * 显示格式: 原料1 数量1 + 原料2 数量2 -> 产物 数量
 */
export default function RecipeDisplay({ recipe, items }: RecipeDisplayProps) {
  if (!recipe) {
    return <span className="text-xs text-gray-500">-</span>;
  }

  // 如果没有原料(如采矿配方),只显示产出
  if (!recipe.Items || recipe.Items.length === 0) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
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

  return (
    <div className="flex items-center gap-2 flex-wrap">
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
