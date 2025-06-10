"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/types";
import { useEffect, useState } from "react";
import { getUsers } from "../../lib/firestore";

interface UserListProps {
  onUserSelect: (user: User) => void;
}

export default function UserList({ onUserSelect }: UserListProps) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const users = await getUsers();
        const filteredUsers = users.filter(
          (user) => user.id !== currentUser.uid
        );
        setUsers(filteredUsers);
      } catch (error) {
        console.error("사용자 목록 조회 실패:", error);
        setError("사용자 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">{"error"}</div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-light text-gray-800 p-2">
        사용자 {users.length}명
      </div>
      <div className="flex flex-col gap-2">
        {users.length > 0 ? (
          users.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="cursor-pointer p-2 hover:bg-gray-100 min-h-14"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.email}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center h-full">
            <div className="text-sm text-gray-500">사용자가 없습니다.</div>
          </div>
        )}
      </div>
    </div>
  );
}
