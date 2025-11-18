"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useEffect, useState } from "react";

export function DebugPermissions() {
  const { user, permissions, getNavigationPages } = usePermissions();
  const [localStorageData, setLocalStorageData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      const permsData = localStorage.getItem("permissions");
      setLocalStorageData({
        user: userData ? JSON.parse(userData) : null,
        permissions: permsData ? JSON.parse(permsData) : null,
      });
    }
  }, []);

  const navPages = getNavigationPages();

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md max-h-96 overflow-auto z-[9999]">
      <h3 className="font-bold mb-2">🔍 Debug Permissions</h3>
      
      <div className="space-y-2">
        <div>
          <strong>User Role:</strong> {user?.role || "null"}
        </div>
        
        <div>
          <strong>User ID:</strong> {user?.id || "null"}
        </div>
        
        <div>
          <strong>Navigation Pages ({navPages.length}):</strong>
          <ul className="list-disc pl-4 mt-1">
            {navPages.map(p => (
              <li key={p.id}>{p.name} ({p.path})</li>
            ))}
          </ul>
        </div>

        <div>
          <strong>LocalStorage User:</strong>
          <pre className="bg-gray-800 p-2 rounded mt-1 text-[10px] overflow-auto">
            {JSON.stringify(localStorageData?.user, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Context Permissions:</strong>
          <pre className="bg-gray-800 p-2 rounded mt-1 text-[10px] overflow-auto">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
