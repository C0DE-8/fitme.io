import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/admin/AdminLayout";
import { PublicLayout } from "./components/public/PublicLayout";
import { PageSeo } from "./components/seo/PageSeo";
import { UserLayout } from "./components/user/UserLayout";
import { getToken, isAdminSession } from "./lib/auth";
import { AdminAuthPage } from "./pages/admin/auth/AdminAuthPage";
import { AdminPage } from "./pages/admin/dashboard/AdminPage";
import { AdminFoodsPage } from "./pages/admin/foods/AdminFoodsPage";
import { AuthPage } from "./pages/auth/AuthPage";
import { HomePage } from "./pages/home/HomePage";
import { SharedStoragePage } from "./pages/shared/SharedStoragePage";
import { UserBudgetPage } from "./pages/user/budget/UserBudgetPage";
import { UserDashboardPage } from "./pages/user/dashboard/UserDashboardPage";
import { UserFoodDetailPage } from "./pages/user/food/UserFoodDetailPage";
import { UserFoodFeedPage } from "./pages/user/feed/UserFoodFeedPage";
import { UserPlaceholderPage } from "./pages/user/placeholder/UserPlaceholderPage";
import { UserStoragePage } from "./pages/user/storage/UserStoragePage";

function AdminRoute({ children }) {
  if (!getToken()) return <Navigate to="/admin/auth" replace />;
  if (!isAdminSession()) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}

function UserRoute({ children }) {
  if (!getToken()) return <Navigate to="/auth" replace />;
  if (isAdminSession()) return <Navigate to="/admin" replace />;

  return <UserLayout>{children}</UserLayout>;
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicLayout>
            <PageSeo
              title="fitme.io | AI Food Planner by Copupbid"
              description="fitme.io is an AI-powered food planner by Copupbid that helps you plan meals from your storage, ingredients, and food preferences."
            />
            <HomePage />
          </PublicLayout>
        }
      />
      <Route
        path="/auth"
        element={
          <PublicLayout>
            <PageSeo
              title="Sign in to fitme.io | AI Food Planner"
              description="Sign in to fitme.io to manage your food storage, meal plans, budget, and AI-powered meal suggestions."
              robots="noindex, nofollow"
            />
            <AuthPage />
          </PublicLayout>
        }
      />
      <Route
        path="/admin/auth"
        element={
          <AdminLayout>
            <PageSeo
              title="Admin Sign In | fitme.io"
              description="Secure admin sign in for fitme.io food planning operations."
              robots="noindex, nofollow"
            />
            <AdminAuthPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <PageSeo
              title="Admin Dashboard | fitme.io"
              description="Manage fitme.io users, subscriptions, plans, accounts, and food data."
              robots="noindex, nofollow"
            />
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/foods"
        element={
          <AdminRoute>
            <PageSeo
              title="Food Management | fitme.io Admin"
              description="Manage fitme.io food items, ingredients, estimated costs, preparation notes, and food images."
              robots="noindex, nofollow"
            />
            <AdminFoodsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <UserRoute>
            <PageSeo
              title="Dashboard | fitme.io"
              description="View your fitme.io food storage, account status, and AI meal suggestions from available ingredients."
              robots="noindex, nofollow"
            />
            <UserDashboardPage />
          </UserRoute>
        }
      />
      <Route
        path="/storage"
        element={
          <UserRoute>
            <PageSeo
              title="Storage | fitme.io"
              description="Manage your saved food storage and ingredients for fitme.io meal planning."
              robots="noindex, nofollow"
            />
            <UserStoragePage />
          </UserRoute>
        }
      />
      <Route
        path="/shared-storage/:shareId"
        element={
          <PublicLayout>
            <PageSeo
              title="Shared Storage | fitme.io"
              description="View a shared fitme.io storage list."
              robots="noindex, nofollow"
            />
            <SharedStoragePage />
          </PublicLayout>
        }
      />
      <Route
        path="/foods/:type/:id"
        element={
          <UserRoute>
            <PageSeo
              title="Food Details | fitme.io"
              description="View fitme.io meal details, ingredients, missing costs, and preparation notes."
              robots="noindex, nofollow"
            />
            <UserFoodDetailPage />
          </UserRoute>
        }
      />
      <Route
        path="/foods"
        element={
          <UserRoute>
            <PageSeo
              title="Food Feed | fitme.io"
              description="Share food posts, reactions, comments, and follows in the fitme.io food feed."
              robots="noindex, nofollow"
            />
            <UserFoodFeedPage />
          </UserRoute>
        }
      />
      <Route
        path="/budget"
        element={
          <UserRoute>
            <PageSeo
              title="Budget | fitme.io"
              description="Plan meals around your budget with fitme.io AI-powered food planning."
              robots="noindex, nofollow"
            />
            <UserBudgetPage />
          </UserRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <UserRoute>
            <PageSeo
              title="Profile | fitme.io"
              description="Manage your fitme.io profile and food planning account settings."
              robots="noindex, nofollow"
            />
            <UserPlaceholderPage type="profile" />
          </UserRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
