import { supabase } from '../config/supabase';

// 即時資料相關函數
export const realtimeService = {
  // 監聽表格變化
  subscribeToTable(table, callback, filters = {}) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...filters
        },
        callback
      )
      .subscribe();

    return channel;
  },

  // 監聽特定記錄變化
  subscribeToRecord(table, id, callback) {
    const channel = supabase
      .channel(`${table}_${id}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `id=eq.${id}`
        },
        callback
      )
      .subscribe();

    return channel;
  },

  // 取消訂閱
  unsubscribe(channel) {
    return supabase.removeChannel(channel);
  },

  // 取消所有訂閱
  unsubscribeAll() {
    return supabase.removeAllChannels();
  }
};
