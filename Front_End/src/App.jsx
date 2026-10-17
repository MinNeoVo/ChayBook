import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import ContentPage from "./Pages/ContentPage";
import ContentPageDetail from "./Pages/ContentPageDetail";

import HomePage from "./Pages/HomePage";
import ProfilePage from "./Pages/ProfilePage";
import CommunityPage from "./Pages/CommunityPage";

import RecipesPage from "./Pages/RecipesPage";
import RecipeDetailPage from "./Pages/RecipeDetailPage";
import BmiPage from "./Pages/BmiPage";
import MealPlanPage from "./Pages/MealPlanPage";
import AIAssistantPage from "./Pages/AIAssistantPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

import AdminDashboardPage from "./Pages/admin/AdminDashboardPage";
import AdminUsers from "./Pages/admin/AdminUsers";
import AdminPostVideoPage from "./Pages/admin/AdminPostVideoPage";
import AdminRecipeManagement, {
  AdminRecipeListPage, AdminRecipeCreatePage, AdminRecipeDetailPage, AdminRecipeEditPage,
} from "./Pages/admin/AdminRecipeManagement";
import AdminArticleManagement, {
  AdminArticleCreatePage,
  AdminArticleDetailPage,
  AdminArticleListPage,
} from "./Pages/admin/AdminArticleManagement";

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
        <Route path="/ai-assistant" element={<AIAssistantPage />} />

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
          <Route path="users" element={<AdminUsers />} />
          <Route path="recipes" element={<AdminRecipeManagement />}>
            <Route index element={<AdminRecipeListPage />} />
            <Route path="new" element={<AdminRecipeCreatePage />} />
            <Route path=":recipeId" element={<AdminRecipeDetailPage />} />
            <Route path=":recipeId/edit" element={<AdminRecipeEditPage />} />
          </Route>
          <Route path="posts-videos" element={<AdminPostVideoPage />} />
          <Route path="articles" element={<AdminArticleManagement />}>
            <Route index element={<AdminArticleListPage />} />
            <Route path="new" element={<AdminArticleCreatePage />} />
            <Route path=":articleId" element={<AdminArticleDetailPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
