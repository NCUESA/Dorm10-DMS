"use client";

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

const categoryOptions = [
  { value: '', label: '不限' },
  { value: 'A', label: 'A: 縣市政府' },
  { value: 'B', label: 'B: 其他公家機關' },
  { value: 'C', label: 'C: 宗親會/指定身分' },
  { value: 'D', label: 'D: 其他民間單位' },
  { value: 'E', label: 'E: 得獎名單' }
];

export default function PreferenceForm({ onSubmit, initialData = {} }) {
  const [form, setForm] = useState({
    preferredCategory: '',
    note: ''
  });

  useEffect(() => {
    setForm(prev => ({ ...prev, ...initialData }));
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow p-6 rounded-lg max-w-2xl w-full">
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">偏好獎學金分類</label>
          <select
            name="preferredCategory"
            value={form.preferredCategory}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">其他需求或備註</label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>
      </div>
      <div className="text-center">
        <Button type="submit" className="mt-4">開始對話</Button>
      </div>
    </form>
  );
}
