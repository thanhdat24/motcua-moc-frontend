import React, { useMemo } from "react";
import { DossierItem } from "../types";
import { ExternalLink } from "lucide-react";

type Props = {
  title: string;
  data: DossierItem[];
  ministry: "BXD" | "BYT";
};

const BASE_BXD = "https://motcuabxd.moc.gov.vn";
const BASE_BYT = "https://motcua.moh.gov.vn";

// Tooltip component (hover sẽ hiện full)
const HoverTooltip: React.FC<{ text: string; className?: string }> = ({
  text,
  className = "",
}) => {
  const t = (text || "").trim();
  if (!t) return <span className={className}>-</span>;

  return (
    <span className={`relative inline-block group max-w-full ${className}`}>
      <span className="block truncate" title={t}>
        {t}
      </span>

      <span
        className="
          pointer-events-none
          absolute z-50
          left-0 top-full mt-2
          hidden group-hover:block
          w-max max-w-[360px]
          rounded-lg
          border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900
          px-3 py-2
          text-xs text-gray-900 dark:text-gray-100
          shadow-xl
          whitespace-normal break-words
        "
      >
        {t}
      </span>
    </span>
  );
};

const parseDueDate = (s?: string): Date | null => {
  if (!s) return null;
  // string kiểu: 2026-01-23T09:46:47.000+0700 (không có dấu :)
  // đổi +0700 -> +07:00 để Date parse ổn hơn
  const fixed = s.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const d = new Date(fixed);
  return isNaN(d.getTime()) ? null : d;
};

const formatRemaining = (due?: string) => {
  const d = parseDueDate(due);
  if (!d) return "-";

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const isLate = diffMs < 0;
  const abs = Math.abs(diffMs);

  const totalMinutes = Math.floor(abs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;

  const text = `${days} ngày ${hours} giờ ${mins} phút`;
  return isLate ? `Đã quá hạn ${text}` : `Còn ${text}`;
};

const getOwnerName = (x: DossierItem) =>
  x?.applicant?.data?.ownerFullname ||
  x?.applicant?.data?.fullname ||
  x?.applicant?.data?.originOwnerFullname ||
  "-";

const getProcedureName = (x: DossierItem) =>
  x?.procedure?.translate?.name || "-";

const getStatusName = (x: DossierItem) =>
  x?.dossierStatus?.name || x?.dossierTaskStatus?.name || "-";

const buildLink = (ministry: "BXD" | "BYT", item: DossierItem) => {
  const base = ministry === "BXD" ? BASE_BXD : BASE_BYT;
  const id = item.id;
  const procedureId = item?.procedure?.id || "";
  const procedureCode = item?.procedure?.code || "";
  // bạn đang có mẫu URL dạng: /vi/dossier/search/${id}? ... &procedure=<...>&remindId=<procedure.id>...
  // mình giữ lại cấu trúc chung + đưa procedureId/remindId theo bạn mô tả
  const url =
    `${base}/vi/dossier/search/${encodeURIComponent(id)}` +
    `?code=&identity=&applicant=&procedure=${encodeURIComponent(procedureId)}` +
    `&sector=&applyMethod=&province=&ward=&ownerFullname=` +
    `&acceptFrom=&acceptTo=&status=&remindId=${encodeURIComponent(
      procedureId
    )}` +
    `&sortId=0&applicantOrganization=&appointmentFrom=&appointmentTo=` +
    `&resultReturnedFrom=&resultReturnedTo=&receiptCode=&taxCode=&resPerson=` +
    `&dossierProcessingStatus=&phoneNumberApply=`;

  // nếu bạn muốn dùng procedureCode thay vì procedureId cho param nào đó, bạn sửa ở đây.
  void procedureCode;
  return url;
};

const Pill: React.FC<{ text: string }> = ({ text }) => {
  const isProcessing = text === "Đang xử lý";
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-bold border ${
        isProcessing
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
          : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
      }`}
    >
      {text}
    </span>
  );
};

const DossierTable: React.FC<Props> = ({ title, data, ministry }) => {
  const rows = useMemo(() => data || [], [data]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm md:text-base font-extrabold uppercase tracking-tight">
          {title}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {rows.length} hồ sơ
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((item) => {
          const code = item.code || item.id;
          const owner = getOwnerName(item);
          const procName = getProcedureName(item);
          const status = getStatusName(item);
          const appointment = item.appointmentDate || "-";
          const remaining = formatRemaining(item?.currentTask?.[0]?.dueDate);
          const link = buildLink(ministry, item);

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      window.open(link, "_blank", "noopener,noreferrer")
                    }
                    className="inline-flex items-center gap-2 font-extrabold text-blue-600 dark:text-blue-400 hover:underline"
                    title="Mở chi tiết trên trang bộ"
                  >
                    <span className="truncate max-w-[220px] md:max-w-[420px]">
                      {code}
                    </span>
                    <ExternalLink size={14} />
                  </button>

                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Ngày hẹn trả:{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {appointment}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <Pill text={status} />
                </div>
              </div>

              {/* Middle */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-gray-400">
                    Chủ hồ sơ
                  </div>
                  <HoverTooltip
                    text={owner}
                    className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100 max-w-full"
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-gray-400">
                    Thủ tục
                  </div>
                  <HoverTooltip
                    text={procName}
                    className="mt-1 text-sm text-gray-800 dark:text-gray-200 max-w-full"
                  />
                </div>
              </div>

              {/* Bottom */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-gray-400">
                  Thời gian còn lại:
                </span>
                <span
                  className={`text-xs font-bold ${
                    remaining.startsWith("Đã quá hạn")
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                  title={item?.currentTask?.[0]?.dueDate || ""}
                >
                  {remaining}
                </span>
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-sm text-gray-500 dark:text-gray-400">
            Không có dữ liệu.
          </div>
        )}
      </div>
    </section>
  );
};

export default DossierTable;
