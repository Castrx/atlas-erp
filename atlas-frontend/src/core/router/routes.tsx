import { Routes, Route } from "react-router-dom";

import { MainLayout } from "../../layouts/MainLayout";
import { DashboardPage } from "../../features/dashboard/pages";
import { ProductsPage } from "../../features/products";
import { CustomersPage } from "../../features/customers";
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
    </Routes>
  );
}