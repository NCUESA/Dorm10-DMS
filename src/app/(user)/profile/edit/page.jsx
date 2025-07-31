"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    student_id: "",
    department: "",
    year: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.user_metadata?.name || "",
        student_id: user.user_metadata?.student_id || "",
        department: user.user_metadata?.department || "",
        year: user.user_metadata?.year || ""
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateProfile(formData);
    setSaving(false);
    if (result.success) {
      router.push("/profile");
    } else {
      alert(result.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">載入中...</div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow w-full max-w-lg space-y-4">
        <h1 className="text-2xl font-bold mb-4">編輯個人資料</h1>
        <div>
          <label className="block text-sm font-medium mb-1">姓名</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">學號</label>
          <input
            type="text"
            name="student_id"
            value={formData.student_id}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {/* <div>
          <label className="block text-sm font-medium mb-1">系所</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">年級</label>
          <input
            type="text"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div> */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>取消</Button>
          <Button type="submit" loading={saving}>儲存</Button>
        </div>
      </form>
    </div>
  );
}
