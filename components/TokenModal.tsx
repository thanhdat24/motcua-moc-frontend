
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { Building2, Stethoscope, AlertCircle, Key, FileText, CheckCircle, X, Loader2 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  targetMinistry: 'BXD' | 'BYT';
  isLoading?: boolean;
  error?: string;
  onSaveToken: (token: string) => Promise<void>;
  onClose?: () => void;
};

const TokenModal: React.FC<Props> = ({ isOpen, targetMinistry, isLoading, error, onSaveToken, onClose }) => {
  const [tokenText, setTokenText] = useState('');

  // Reset text when switching ministry
  useEffect(() => {
    if (isOpen) setTokenText('');
  }, [isOpen, targetMinistry]);

  if (!isOpen) return null;

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
      // Fallback
    }
  };

  const isBXD = targetMinistry === 'BXD';
  const ministryName = isBXD ? "Bộ Xây dựng" : "Bộ Y tế";
  const AccentIcon = isBXD ? Building2 : Stethoscope;
  const accentColor = isBXD ? "blue" : "emerald";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-scale-in transition-colors duration-200 border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 bg-${accentColor}-500 dark:bg-${accentColor}-600 rounded-xl shadow-lg shadow-${accentColor}-200 dark:shadow-none text-white`}>
               <AccentIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cập nhật Token</h2>
              <p className={`text-xs text-${accentColor}-600 dark:text-${accentColor}-400 font-bold uppercase tracking-wider`}>
                Hệ thống {ministryName}
              </p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</span>
          </div>
        )}

        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Authorization Header</label>
            {!tokenText && (
              <button
                type="button"
                onClick={handlePaste}
                className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" /> Dán từ Clipboard
              </button>
            )}
            {tokenText && (
               <button
               type="button"
               onClick={() => setTokenText('')}
               className="text-gray-400 dark:text-gray-500 text-xs hover:text-red-500 dark:hover:text-red-400 transition-colors"
             >
               Xóa
             </button>
            )}
          </div>
          
          <textarea
            rows={5}
            className={`block w-full rounded-xl border-gray-300 dark:border-gray-600 border focus:border-${accentColor}-500 focus:ring-${accentColor}-500 p-4 text-sm shadow-sm font-mono placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 transition-all resize-none`}
            placeholder="Bearer eyJhbGciOiJIUzI1NiIsIn..."
            value={tokenText}
            onChange={(e) => setTokenText(e.target.value)}
          />
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
             <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
               <span className="font-bold underline uppercase">Cách lấy:</span> Mở trang DVC {ministryName} → F12 → Tab Network → Gõ "search" → Click 1 request → Copy giá trị "Authorization" trong Request Headers.
             </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8">
          <button
            onClick={() => onSaveToken(tokenText)}
            disabled={isLoading || !tokenText.trim()}
            className={`w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-${accentColor}-500/30 dark:shadow-none text-sm font-bold text-white bg-${accentColor}-600 hover:bg-${accentColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${accentColor}-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all transform active:scale-[0.98]`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang lưu Token...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Cập nhật cho {ministryName}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenModal;
