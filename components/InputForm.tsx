import React, { useState } from 'react';
import { ICONS } from '../constants';

interface InputFormProps {
  onFetch: (token: string) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onFetch, isLoading }) => {
  const [tokenText, setTokenText] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        let cleanText = text.trim();
        if (cleanText.toLowerCase().startsWith('authorization:')) {
           cleanText = cleanText.split(':')[1].trim();
        }
        setTokenText(cleanText);
      }
    } catch (err) {
      alert('Không thể truy cập clipboard. Vui lòng dán thủ công (Ctrl+V).');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenText) return;
    onFetch(tokenText);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8 transition-colors">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-blue-600 dark:bg-blue-700 rounded-xl text-white shadow-md">
          <ICONS.Key className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nhập Token</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Dán Authorization Token để tải dữ liệu</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="token" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Token (Bearer ...)</label>
            {!tokenText && (
              <button
                type="button"
                onClick={handlePaste}
                className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline flex items-center"
              >
                <ICONS.FileText className="w-3 h-3 mr-1" /> Dán nhanh
              </button>
            )}
            {tokenText && (
              <button
                type="button"
                onClick={() => setTokenText('')}
                className="text-gray-400 dark:text-gray-500 text-xs hover:text-red-500 dark:hover:text-red-400"
              >
                Xóa
              </button>
            )}
          </div>
          <textarea
            id="token"
            rows={3}
            className="block w-full rounded-xl border-gray-300 dark:border-gray-600 border focus:border-blue-500 focus:ring-blue-500 p-3 text-sm shadow-sm font-mono placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 transition-colors resize-none"
            placeholder="Dán token vào đây..."
            value={tokenText}
            onChange={(e) => setTokenText(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !tokenText}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <ICONS.RefreshCw className="animate-spin w-5 h-5 mr-2" />
              Đang tải dữ liệu...
            </>
          ) : (
            <>
              <ICONS.Search className="w-5 h-5 mr-2" />
              Lấy hồ sơ
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;