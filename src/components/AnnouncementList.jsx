import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import ButtonGroup from '@/components/ui/ButtonGroup';

export default function AnnouncementList() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('status', 'published')
        .order('application_deadline', { ascending: true });
      if (!error) {
        setAnnouncements(data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = announcements
    .filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    .filter(a => {
      const deadline = a.application_deadline ? new Date(a.application_deadline) : null;
      if (filter === 'open') {
        return !deadline || deadline >= new Date();
      }
      if (filter === 'expired') {
        return deadline && deadline < new Date();
      }
      return true;
    });

  const categoryColor = cat => {
    const map = {
      A: 'bg-red-500',
      B: 'bg-orange-500',
      C: 'bg-blue-500',
      D: 'bg-yellow-500',
      E: 'bg-green-500',
    };
    return map[cat] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div className="relative w-full sm:w-1/3 mb-4 sm:mb-0 sm:mr-4">
          <input
            type="text"
            placeholder="搜尋公告標題、摘要…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
        </div>
        <ButtonGroup connected={false}>
          <Button 
            variant={filter === 'open' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setFilter('open')}
          >
            開放申請中
          </Button>
          <Button 
            variant={filter === 'all' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            全部
          </Button>
          <Button 
            variant={filter === 'expired' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setFilter('expired')}
          >
            已過期
          </Button>
        </ButtonGroup>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden divide-y divide-gray-200">
        {loading ? (
          <div className="p-4 text-center text-gray-500">載入中...</div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="p-4 sm:p-6 hover:bg-gray-50 transition duration-150 ease-in-out cursor-pointer">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div className="md:col-span-3">
                  <div className="flex items-start space-x-4 mb-2">
                    <span className={`flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full text-white text-sm font-bold ${categoryColor(item.category)}`}>{item.category}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.summary}</p>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex justify-end">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-gray-700 text-sm font-bold">N</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-red-500 text-lg">
                    {item.application_deadline ? new Date(item.application_deadline).toLocaleDateString('zh-TW') : '-'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{item.application_method || ''}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
