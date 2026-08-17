import { Routes, Route } from "react-router-dom";

import { MainLayout } from "../../layouts/MainLayout";
import { DashboardPage } from "../../features/dashboard/pages";
import { ProductsPage } from "../../features/products";
import { CustomersPage } from "../../features/customers";
import { VendasPage } from "../../features/vendas";
import { EstoquePage } from "../../features/estoque";
import { CategoriesPage } from "../../features/categories";
import { UsersPage } from "../../features/users";
import { CompaniesPage } from "../../features/companies";
import { LoginPage } from "../../features/auth";
import { ProtectedRoute } from "../auth";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProductsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CustomersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendas"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VendasPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/estoque"
        element={
          <ProtectedRoute>
            <MainLayout>
              <EstoquePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CategoriesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <MainLayout>
              <UsersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/companies"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <MainLayout>
              <CompaniesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}