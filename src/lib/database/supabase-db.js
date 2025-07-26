import { supabase } from '../config/supabase';

// 資料庫相關操作函數
export const dbService = {
  // 創建記錄
  async create(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();
      
      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 讀取記錄
  async read(table, filters = {}, options = {}) {
    try {
      let query = supabase.from(table);
      
      // 應用篩選條件
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });
      
      // 應用選項（排序、限制等）
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.select) {
        query = query.select(options.select);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 更新記錄
  async update(table, id, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 刪除記錄
  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 執行 RPC 函數
  async rpc(functionName, params = {}) {
    try {
      const { data, error } = await supabase.rpc(functionName, params);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
