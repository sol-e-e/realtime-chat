"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import UserList from "../../components/chat/UserList";
import { User } from "../../types";

export default function Chat() {
  const { loading, currentUser, logout } = useAuth();
  const router = useRouter();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login");
    }
  }, [loading, currentUser, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const handleUserSelect = (user: User) => {
    console.log("user", user);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-gray-900">채팅</h1>
            <div className="text-sm text-gray-500">
              {currentUser?.displayName || currentUser?.email}님 안녕하세요!
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            로그아웃
          </Button>
        </div>
      </header>

      <main className="flex flex-1 bg-white min-h-screen border-b">
        <div className="flex flex-1">
          <div className="flex flex-col border-r border-gray-200 min-w-56 h-full">
            <UserList onUserSelect={handleUserSelect} />
          </div>
        </div>
        <div className="flex flex-1 p-4">{"chat"}</div>
      </main>
    </div>
  );
}
