"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Chat() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    }
  }, [currentUser, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  if (!currentUser) {
    return <div>loading...</div>;
  }

  return (
    <div className="h-screen flex">
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">채팅</h1>
            <p className="text-sm text-gray-500">
              {currentUser?.displayName || currentUser?.email}님 안녕하세요!
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            로그아웃
          </Button>
        </header>
        <div className="flex-1 p-4 bg-gray-50">
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">🚀 곧 실시간 채팅 기능이 추가됩니다!</p>
            <p className="text-sm mt-2">
              Socket.io를 활용한 실시간 메시징 구현 예정
            </p>
            <div className="mt-4 text-xs text-gray-400">
              <p>현재 사용자: {currentUser.uid}</p>
              <p>이메일: {currentUser.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
