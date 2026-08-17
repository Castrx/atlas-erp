import type { LucideIcon } from "lucide-react";
import {
    LayoutDashboard,
    Package,
    Users,
    Tags,
    Boxes,
    ShoppingCart,
    UserCog,
    Building2,
    DollarSign,
    FileBarChart,
    Settings,
} from "lucide-react";

export interface MenuItem {
    label: string;
    icon: LucideIcon;
    path?: string;
    /**
     * Papel exigido para o item aparecer no menu (ex.: "ADMIN"). Sem isto,
     * o item é visível a qualquer usuário autenticado. Isto é só reflexo
     * de UX — a permissão real de cada ação é sempre decidida pelo
     * backend, nunca por este campo.
     */
    requiredRole?: string;
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
        path: "/customers",
    },
    {
        label: "Categorias",
        icon: Tags,
        path: "/categories",
    },
    {
        label: "Estoque",
        icon: Boxes,
        path: "/estoque",
    },
    {
        label: "Vendas",
        icon: ShoppingCart,
        path: "/vendas",
    },
    {
        label: "Usuários",
        icon: UserCog,
        path: "/users",
        requiredRole: "ADMIN",
    },
    {
        label: "Empresas",
        icon: Building2,
        path: "/companies",
        requiredRole: "ADMIN",
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
