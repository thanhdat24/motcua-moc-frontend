// src/components/DossierTable.tsx
import React, { useMemo } from "react";
import type { DossierItem } from "../types";

type Ministry = "BXD" | "BYT";

type Props = {
  title: string;
  data: DossierItem[];
  ministry: Ministry;
  variant?: "urgent" | "normal";
};

const BASE_BYT = "https://motcua.moh.gov.vn";
const BASE_BXD = "https://motcuabxd.moc.gov.vn";

const safeText = (v: any) => (v == null ? "" : String(v));
const trim = (v: any) => safeText(v).trim();

const fmtDateVi = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calcDaysLeft = (appointmentIso?: string) => {
  if (!appointmentIso) return null;
  const target = new Date(appointmentIso).getTime();
  if (Number.isNaN(target)) return null;
  const now = Date.now();
  return Math.ceil((target - now) / (24 * 60 * 60 * 1000));
};

const daysLeftLabel = (daysLeft: number | null) => {
  if (daysLeft == null) return "-";
  if (daysLeft > 0) return `Còn ${daysLeft} ngày`;
  if (daysLeft === 0) return "Hôm nay";
  return `Quá hạn ${Math.abs(daysLeft)} ngày`;
};

const getOwnerName = (dossier: any) => {
  const a = dossier?.applicant?.data;
  return (
    trim(a?.ownerFullname) ||
    trim(a?.fullname) ||
    trim(dossier?.applicant?.fullname) ||
    trim(dossier?.accepter?.fullname) ||
    "-"
  );
};

const getProcedureName = (dossier: any) => {
  return (
    trim(dossier?.procedure?.translate?.name) ||
    trim(dossier?.procedure?.name) ||
    "-"
  );
};

const getStatusName = (dossier: any) => {
  return (
    trim(dossier?.dossierStatus?.name) ||
    trim(dossier?.dossierTaskStatus?.name) ||
    "-"
  );
};

/**
 * ✅ Lọc theo yêu cầu:
 * - CHỈ áp dụng cho BXD
 * - procedure.code !== "1.013225"
 * - statusName === "Đang xử lý"
 */
const filterByMinistry = (ministry: Ministry, list: any[]) => {
  const arr = Array.isArray(list) ? list : [];
  if (ministry !== "BXD") return arr;

  return arr.filter((x) => {
    const procCode = trim(x?.procedure?.code); // ví dụ "1.013225"
    if (procCode === "1.013225") return false;

    const status =
      trim(x?.dossierStatus?.name) || trim(x?.dossierTaskStatus?.name);

    // Chỉ lấy trạng thái "Đang xử lý"
    if (status !== "Đang xử lý") return false;

    return true;
  });
};

const buildSearchUrl = (ministry: Ministry, dossier: any) => {
  const base = ministry === "BYT" ? BASE_BYT : BASE_BXD;

  const id = trim(dossier?.id);
  if (!id) return base;

  const procedureId = trim(dossier?.procedure?.id) || "";
  const remindId = procedureId || "";

  const path = `/vi/dossier/search/${encodeURIComponent(id)}`;

  const params = new URLSearchParams({
    code: "",
    identity: "",
    applicant: "",
    procedure: procedureId,
    sector: "",
    applyMethod: "",
    province: "",
    ward: "",
    ownerFullname: "",
    acceptFrom: "",
    acceptTo: "",
    status: "",
    remindId: remindId,
    sortId: "0",
    applicantOrganization: "",
    appointmentFrom: "",
    appointmentTo: "",
    resultReturnedFrom: "",
    resultReturnedTo: "",
    receiptCode: "",
    taxCode: "",
    resPerson: "",
    dossierProcessingStatus: "",
    phoneNumberApply: "",
    vnpostStatus: "",
  });

  return `${base}${path}?${params.toString()}`;
};

type Row = {
  key: string;
  code: string;
  url: string;
  procedureName: string;
  appointmentText: string;
  daysLeftText: string;
  daysLeftValue: number | null;
  ownerName: string;
  statusName: string;
};

const DossierTable: React.FC<Props> = ({
  title,
  data,
  ministry,
  variant = "normal",
}) => {
  const rows: Row[] = useMemo(() => {
    const filtered = filterByMinistry(ministry, data);

    return filtered.map((x: any) => {
      const code = trim(x?.code) || trim(x?.id) || "-";
      const appointmentIso = trim(x?.appointmentDate);
      const daysLeftValue = calcDaysLeft(appointmentIso);

      return {
        key: trim(x?.id) || code,
        code,
        url: buildSearchUrl(ministry, x),
        procedureName: getProcedureName(x),
        appointmentText: fmtDateVi(appointmentIso) || "-",
        daysLeftText: daysLeftLabel(daysLeftValue),
        daysLeftValue,
        ownerName: getOwnerName(x),
        statusName: getStatusName(x),
      };
    });
  }, [data, ministry]);

  const badgeClass =
    variant === "urgent"
      ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-900/40"
      : ministry === "BXD"
      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-900/40"
      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-sm md:text-base">{title}</h3>
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${badgeClass}`}
          >
            {rows.length} hồ sơ
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
          Không có dữ liệu phù hợp.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr className="text-xs text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Mã hồ sơ
                </th>
                <th className="px-4 py-3 font-semibold min-w-[420px]">
                  Tên thủ tục
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Ngày hẹn trả
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Còn lại
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Chủ hồ sơ
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Trạng thái
                </th>
              </tr>
            </thead>

            <tbody className="divide-y dark:divide-gray-800">
              {rows.map((r) => (
                <tr
                  key={r.key}
                  className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs md:text-sm whitespace-nowrap">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      title="Mở hồ sơ trên hệ thống"
                    >
                      {r.code}
                    </a>
                  </td>

                  <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                    <div className="line-clamp-2">{r.procedureName}</div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.appointmentText}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={[
                        "text-xs font-bold px-2 py-1 rounded-full border",
                        r.daysLeftValue == null
                          ? "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                          : r.daysLeftValue < 0
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40"
                          : r.daysLeftValue <= 2
                          ? "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-900/40"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40",
                      ].join(" ")}
                    >
                      {r.daysLeftText}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">{r.ownerName}</td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      {r.statusName}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DossierTable;
