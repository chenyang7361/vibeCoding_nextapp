/**
 * 测试副产物抵扣功能
 * 验证60宇宙矩阵所需的氢是否为840
 */

const fs = require('fs');
const path = require('path');

// 读取数据文件
const dataPath = path.join(__dirname, 'data', 'Vanilla.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const items = data.items;
const recipes = data.recipes;

// 模拟getMaterialTree函数的核心逻辑
function getMaterialTree(itemId, targetPerMinute, visited = new Set()) {
  if (visited.has(itemId)) {
    return [];
  }
  visited.add(itemId);

  const item = items.find(i => i.ID === itemId);
  if (!item) {
    return [];
  }

  const availableRecipes = recipes.filter(r => r.Results && r.Results.includes(itemId));
  const recipe = availableRecipes[0];
  
  if (!recipe) {
    return [{
      id: item.ID,
      name: item.Name,
      perMinute: targetPerMinute,
      recipe: null
    }];
  }

  const resultIndex = recipe.Results.indexOf(itemId);
  const resultCount = recipe.ResultCounts[resultIndex] || 1;

  const result = [];
  
  result.push({
    id: item.ID,
    name: item.Name,
    perMinute: targetPerMinute,
    recipe: recipe
  });

  if (recipe.Items && recipe.Items.length > 0) {
    recipe.Items.forEach((materialId, index) => {
      const materialCount = recipe.ItemCounts[index] || 1;
      const materialPerMinute = (targetPerMinute * materialCount) / resultCount;
      
      const subMaterials = getMaterialTree(materialId, materialPerMinute, new Set(visited));
      subMaterials.forEach(mat => {
        const existingMat = result.find(r => r.id === mat.id);
        if (existingMat) {
          existingMat.perMinute += mat.perMinute;
        } else {
          result.push(mat);
        }
      });
    });
  }

  // 计算副产物
  const byproducts = new Map();
  result.forEach(material => {
    const recipe = material.recipe;
    if (!recipe || !recipe.Results || recipe.Results.length <= 1) {
      return;
    }
    
    recipe.Results.forEach((resultId, index) => {
      if (resultId === material.id) {
        return;
      }
      
      const resultCount = recipe.ResultCounts[index] || 1;
      const mainResultIndex = recipe.Results.indexOf(material.id);
      const mainResultCount = recipe.ResultCounts[mainResultIndex] || 1;
      
      const byproductPerMinute = (material.perMinute / mainResultCount) * resultCount;
      
      const existing = byproducts.get(resultId) || 0;
      byproducts.set(resultId, existing + byproductPerMinute);
    });
  });

  // 应用副产物抵扣
  const deductedResult = [];
  result.forEach(material => {
    const byproductAmount = byproducts.get(material.id) || 0;
    
    if (byproductAmount > 0) {
      const newPerMinute = material.perMinute - byproductAmount;
      
      if (newPerMinute > 0.001) {
        deductedResult.push({
          ...material,
          perMinute: newPerMinute,
          byproductAmount: byproductAmount
        });
      }
    } else {
      deductedResult.push(material);
    }
  });
  
  return deductedResult;
}

// 测试60宇宙矩阵
console.log('=== 测试60宇宙矩阵 ===');
const universeMatrixId = 6006; // 宇宙矩阵ID
const result = getMaterialTree(universeMatrixId, 60);

console.log('\n材料列表:');
result.forEach(mat => {
  const byproductInfo = mat.byproductAmount ? ` (副产物抵扣: ${mat.byproductAmount.toFixed(3)})` : '';
  console.log(`${mat.name}: ${mat.perMinute.toFixed(3)}/分钟${byproductInfo}`);
});

// 查找氢
const hydrogen = result.find(mat => mat.id === 1120);
if (hydrogen) {
  console.log('\n=== 验证结果 ===');
  console.log(`氢的需求量: ${hydrogen.perMinute.toFixed(3)}/分钟`);
  if (hydrogen.byproductAmount) {
    console.log(`副产物抵扣: ${hydrogen.byproductAmount.toFixed(3)}/分钟`);
  }
  
  if (Math.abs(hydrogen.perMinute - 840) < 0.1) {
    console.log('✓ 验证通过! 氢的需求量约为840');
  } else {
    console.log(`✗ 验证失败! 期望840，实际${hydrogen.perMinute.toFixed(3)}`);
  }
} else {
  console.log('\n✗ 未找到氢材料');
}
