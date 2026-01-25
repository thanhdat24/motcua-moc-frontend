import React from "react";
import { DossierItem } from "../types";
import { AlertCircle, Clock, ExternalLink } from "lucide-react";

interface DossierTableProps {
  title: string;
  data: DossierItem[];
  variant?: "normal" | "urgent";
}

const DossierTable: React.FC<DossierTableProps> = ({
  title,
  data,
  variant = "normal",
}) => {
  const isUrgent = variant === "urgent";

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        isUrgent
          ? "border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10"
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      }`}
    >
      <div
        className={`px-6 py-4 flex items-center justify-between border-b ${
          isUrgent
            ? "bg-red-500/10 border-red-200 dark:border-red-900/50"
            : "bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800"
        }`}
      >
        <div className="flex items-center gap-3">
          {isUrgent ? (
            <AlertCircle className="text-red-500 animate-pulse" />
          ) : (
            <Clock className="text-blue-500" />
          )}
          <h3
            className={`font-bold ${
              isUrgent
                ? "text-red-700 dark:text-red-400"
                : "text-gray-700 dark:text-gray-200"
            }`}
          >
            {title}
          </h3>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isUrgent
              ? "bg-red-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          {data.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50/50 dark:bg-gray-950/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Mã hồ sơ
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Nội dung yêu cầu
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Thời hạn
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Liên kết
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-gray-400 italic"
                >
                  Không có hồ sơ nào trong danh mục này
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400">
                    {item.code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-md truncate">
                    {item.applicant?.data?.noidungyeucaugiaiquyet ||
                      "Nội dung chưa cập nhật"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col">
                      <span
                        className={
                          isUrgent ? "text-red-600 font-bold" : "text-gray-500"
                        }
                      >
                        {item.appointmentDate
                          ? new Date(item.appointmentDate).toLocaleDateString(
                              "vi-VN"
                            )
                          : "N/A"}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] uppercase font-black text-red-500 tracking-tighter">
                          Sắp quá hạn
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      className={`p-2 rounded-lg transition-colors ${
                        isUrgent
                          ? "bg-red-100 text-red-600 hover:bg-red-200"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DossierTable;
