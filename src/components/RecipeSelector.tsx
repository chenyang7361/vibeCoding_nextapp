/**
 * 配方选择器组件
 * 当一个物品有多个配方时，显示下拉选择器供用户切换
 */

import { Recipe, Item } from '../utils/recipeCalculator';

interface RecipeSelectorProps {
  // 该物品的所有可用配方
  availableRecipes: Recipe[];
  // 当前选中的配方ID
  selectedRecipeId?: number;
  // 所有物品数据(用于显示配方中的物品图标)
  items: Item[];
  // 切换配方的回调函数
  onRecipeChange: (recipeId: number) => void;
}

/**
 * 配方选择器组件
 * 显示配方选项，包括配方名称和配方内容预览
 */
export default function RecipeSelector({ 
  availableRecipes, 
  selectedRecipeId, 
  items, 
  onRecipeChange 
}: RecipeSelectorProps) {
  // 如果只有一个配方或没有配方，不显示选择器
  if (!availableRecipes || availableRecipes.length <= 1) {
    return null;
  }

  return (
    <select
      value={selectedRecipeId || availableRecipes[0]?.ID}
      onChange={(e) => onRecipeChange(Number(e.target.value))}
      className="px-2 py-1 bg-gray-700/80 border border-blue-500/30 rounded text-xs text-white
                 hover:border-blue-500/50 focus:outline-none focus:border-blue-500
                 cursor-pointer transition-colors"
      title="选择配方"
    >
      {availableRecipes.map(recipe => (
        <option key={recipe.ID} value={recipe.ID}>
          {recipe.Name}
        </option>
      ))}
    </select>
  );
}
