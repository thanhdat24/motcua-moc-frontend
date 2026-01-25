import React from 'react';
import { DossierItem } from '../types';

interface DossierTableProps {
  title: string;
  data: DossierItem[];
}

const DossierTable: React.FC<DossierTableProps> = ({ title, data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-2">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 italic text-sm">Không có hồ sơ nào.</p>
      </div>
    );
  }

  const getUrgencyLabel = (appointmentDateStr?: string) => {
    if (!appointmentDateStr || appointmentDateStr === 'N/A') return null;
    
    try {
      // Fix format múi giờ của Python sang JS nếu cần, nhưng API thường trả về ISO
      // Ví dụ: 2024-05-20T10:00:00.000+0700
      const date = new Date(appointmentDateStr);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);

      if (diffDays <= 1) { // <= 24h
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">🔥 Hỏa tốc</span>;
      } else if (diffDays <= 3) {
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">⚠️ Khẩn</span>;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const getLink = (item: DossierItem) => {
    const dossierId = item.id;
    const procedureId = item.procedure?.id;
    
    // Xử lý currentTask (có thể là array hoặc object)
    let taskId = '';
    if (Array.isArray(item.currentTask) && item.currentTask.length > 0) {
      taskId = item.currentTask[0].id;
    } else if (item.currentTask && !Array.isArray(item.currentTask)) {
      taskId = item.currentTask.id;
    }

    if (dossierId && procedureId && taskId) {
      return `https://motcua.cantho.gov.vn/vi/dossier/processing/${dossierId}?procedure=${procedureId}&task=${taskId}&xpandStatus=false`;
    }
    return '#';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8 transition-colors">
      <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
          <span className="bg-blue-600 dark:bg-blue-500 w-2 h-6 rounded mr-3"></span>
          {title} 
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({data.length} hồ sơ)</span>
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">STT</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mã hồ sơ</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider max-w-xs">Nội dung</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thực hiện</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thời hạn</th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => {
              const link = getLink(item);
              const urgency = getUrgencyLabel(item.appointmentDate);
              
              return (
                <tr key={item.id || index} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">{index + 1}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">{item.code}</td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={item.applicant?.data?.noidungyeucaugiaiquyet}>
                    {item.applicant?.data?.noidungyeucaugiaiquyet || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {item.accepter?.fullname || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex flex-col">
                      <span>{formatDate(item.appointmentDate)}</span>
                      <div className="mt-1">{urgency}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {link !== '#' ? (
                      <a 
                        href={link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 px-3 py-1.5 rounded-md text-xs transition-colors"
                      >
                        Mở Link
                      </a>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DossierTable;