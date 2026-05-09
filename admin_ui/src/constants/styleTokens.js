import { C } from './colors';

export const inp = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.09)",
  background: "rgba(255,255,255,.04)",
  fontSize: 13,
  color: C.text,
  fontFamily: "inherit",
};

export const lbl = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  color: C.muted,
  marginBottom: 5,
  letterSpacing: .6,
  textTransform: "uppercase",
};

export const tdS = {
  padding: "11px 12px",
  fontSize: 13,
  color: C.subtle,
  borderBottom: "1px solid rgba(255,255,255,.03)",
  verticalAlign: "middle",
};

export const pBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 18px",
  background: "linear-gradient(135deg,#3b82f6,#2563eb)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: .2,
  boxShadow: "0 4px 14px rgba(59,130,246,.28)",
};

export const oBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 18px",
  background: "transparent",
  color: C.subtle,
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

export const smBtn = {
  padding: "5px 12px",
  background: "rgba(255,255,255,.05)",
  color: C.subtle,
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
};
