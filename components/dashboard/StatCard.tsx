import type React from "react";

export function StatCard({
  left,
  label,
  value,
  blobBg,
  icon,
}: {
  left: number;
  label: string;
  value: React.ReactNode;
  blobBg: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="absolute bg-white rounded-[10px] border border-[rgba(3,2,41,0.08)]"
      style={{ left, top: 98, width: 268, height: 116 }}
    >
      <div
        className="absolute rounded-[38px]"
        style={{ left: 28, top: 28, width: 60, height: 60, background: blobBg }}
      />
      <div
        className="absolute text-[22px] font-extrabold text-[#030229]"
        style={{ left: 111, top: 33, opacity: 0.7 }}
      >
        {value}
      </div>
      <div
        className="absolute text-[14px] font-normal text-[#030229]"
        style={{ left: 111, top: 62, opacity: 0.7 }}
      >
        {label}
      </div>
      <div
        className="absolute"
        style={{
          left: 46,
          top: 46,
          width: 24,
          height: 24,
          borderRadius: 8,
          background: "rgba(3,2,41,0.10)",
        }}
      >
        {icon}
      </div>
    </div>
  );
}
