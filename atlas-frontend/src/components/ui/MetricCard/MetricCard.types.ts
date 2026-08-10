import type { ReactNode } from "react";

export interface MetricCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color?: string;
}