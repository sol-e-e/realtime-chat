"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/chat");
    } catch (error) {
      console.error("로그인 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      await login(email, password);
      router.push("/chat");
    } catch (error) {
      console.error("로그인 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            🔥 Chat
          </CardTitle>
          <CardDescription>실시간 채팅으로 소통을 시작하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google 로그인 */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "로그인 중..." : "🔍 Google로 로그인"}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는 데모 계정으로 체험
              </span>
            </div>
          </div>
          {/* 데모 계정들 */}
          <div className="space-y-2">
            <Button
              onClick={() => handleDemoLogin("alice@rtchat.com", "demo123456")}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              👩 Alice 계정으로 로그인
            </Button>
            <Button
              onClick={() => handleDemoLogin("bob@rtchat.com", "demo123456")}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              👨 Bob 계정으로 로그인
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
