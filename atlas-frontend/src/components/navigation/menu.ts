import type { LucideIcon } from "lucide-react";
import {
    LayoutDashboard,
    Package,
    Users,
    Tags,
    Boxes,
    ShoppingCart,
    DollarSign,
    FileBarChart,
    Settings,
} from "lucide-react";

interface MenuItem {
    label: string;
    icon: LucideIcon;
    path?: string;
}

export const menu: MenuItem[] = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/",
    },
    {
        label: "Produtos",
        icon: Package,
        path: "/products",
    },
    {
        label: "Clientes",
        icon: Users,
    },
    {
        label: "Categorias",
        icon: Tags,
    },
    {
        label: "Estoque",
        icon: Boxes,
    },
    {
        label: "Vendas",
        icon: ShoppingCart,
    },
    {
        label: "Financeiro",
        icon: DollarSign,
    },
    {
        label: "Relatórios",
        icon: FileBarChart,
    },
    {
        label: "Configurações",
        icon: Settings,
    },
];