import { Routes, Route } from "react-router-dom";

import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";

import ContentPage from "./Pages/ContentPage";
import ContentPageDetail from "./pages/ContentPageDetail";

import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import CommunityPage from "./pages/CommunityPage";

import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import BmiPage from "./pages/BmiPage";
import MealPlanPage from "./pages/MealPlanPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";

function App() {
  return (
    <Routes>
      {/* ==================== */}
      {/* USER AREA */}
      {/* ==================== */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/content" element={<ContentPage />} />
        <Route path="/content/:id" element={<ContentPageDetail />} />

        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:recipeId" element={<RecipeDetailPage />} />
        <Route path="/bmi" element={<BmiPage />} />

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/meal-plan" element={<MealPlanPage />} />
        </Route>
      </Route>

      {/* ==================== */}
      {/* ADMIN AREA */}
      {/* ==================== */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
