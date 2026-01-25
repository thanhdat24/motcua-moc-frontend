import React from 'react';
import { ICONS } from '../constants';

const InstructionCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex items-center space-x-2 mb-5">
        <div className="bg-blue-100 p-2 rounded-lg">
           <ICONS.Terminal className="w-5 h-5 text-blue-700" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Hướng dẫn sử dụng</h2>
      </div>

      <div className="space-y-4 text-sm text-gray-600 flex-grow">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="font-bold text-gray-900 mb-2 flex items-center">
            <span className="bg-gray-800 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">1</span>
            Đăng nhập hệ thống
          </p>
          <p className="ml-7 mb-1">Truy cập và đăng nhập tại:</p>
          <a href="https://apidvc.cantho.gov.vn" target="_blank" rel="noreferrer" className="ml-7 text-blue-600 hover:underline font-medium block truncate">
            apidvc.cantho.gov.vn
          </a>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="font-bold text-blue-900 mb-2 flex items-center">
             <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">2</span>
             Lấy Token (Authorization)
          </p>
          <ul className="ml-7 space-y-2 list-disc list-outside pl-4 text-gray-700">
            <li>Nhấn phím <b>F12</b> (Tab Network).</li>
            <li>Tại ô Filter, gõ: <code className="bg-white px-1 py-0.5 rounded border">search?code</code></li>
            <li>Copy giá trị <b>Authorization</b> trong Request Headers.</li>
            <li className="text-blue-700 font-semibold">Lưu ý: Token này thường hết hạn sau 30-60 phút.</li>
          </ul>
        </div>

        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
          <p className="font-bold text-green-900 mb-2 flex items-center">
            <ICONS.ShieldCheck className="w-4 h-4 mr-2" />
            Hệ thống ổn định
          </p>
          <p className="ml-2 text-gray-700 text-xs">
            Ứng dụng đã được kết nối với Server riêng tốc độ cao. Dữ liệu sẽ được tải về ngay lập tức nếu Token hợp lệ.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructionCard;