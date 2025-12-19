import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * API 路由：获取所有物品和配方数据
 * GET /api/items
 * 返回 Vanilla.json 中的 items 数组和 recipes 数组
 */
export async function GET() {
  try {
    // 读取 JSON 文件（使用 Node.js 文件系统 API）
    const filePath = join(process.cwd(), 'data', 'Vanilla.json');
    let fileContents = readFileSync(filePath, 'utf8');
    
    // 移除 UTF-8 BOM 标记（如果存在）
    if (fileContents.charCodeAt(0) === 0xFEFF) {
      fileContents = fileContents.slice(1);
    }
    
    // 解析 JSON 数据
    const data = JSON.parse(fileContents);
    
    // 返回物品列表和配方列表
    return NextResponse.json({ 
      items: data.items,
      recipes: data.recipes 
    });
  } catch (error) {
    console.error('读取物品数据失败:', error);
    return NextResponse.json(
      { error: '加载物品数据失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
