import React, { useState } from "react";
import { ICONS } from "../constants";

type Props = {
  isOpen: boolean;
  isLoading?: boolean;
  error?: string;
  onClose?: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
};

const LoginModal: React.FC<Props> = ({ isOpen, isLoading, error, onClose, onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in transition-colors duration-200 border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 dark:bg-blue-500 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none text-white">
               <ICONS.Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Đăng nhập</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Hệ thống quản lý Token</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ICONS.X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
            <ICONS.AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="space-y-5">
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Tài khoản</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <ICONS.User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Nhập tên đăng nhập..."
                autoFocus
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <ICONS.Key className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="••••••••"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) onLogin(username, password);
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8">
          <button
            onClick={() => onLogin(username, password)}
            disabled={isLoading || !username.trim() || !password.trim()}
            className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 dark:shadow-blue-900/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all transform active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <ICONS.Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              <>
                <ICONS.CheckCircle className="w-5 h-5 mr-2" />
                Đăng nhập hệ thống
              </>
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          © 2024 Dịch Vụ Công Cần Thơ. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginModal;