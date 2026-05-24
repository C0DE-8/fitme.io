import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/admin/AdminLayout";
import { PublicLayout } from "./components/public/PublicLayout";
import { PageSeo } from "./components/seo/PageSeo";
import { UserLayout } from "./components/user/UserLayout";
import { getToken, isAdminSession } from "./lib/auth";
import { AdminAccountsPage } from "./pages/admin/accounts/AdminAccountsPage";
import { AdminAuthPage } from "./pages/admin/auth/AdminAuthPage";
import { AdminPage } from "./pages/admin/dashboard/AdminPage";
import { AdminFoodsPage } from "./pages/admin/foods/AdminFoodsPage";
import { AdminFoodFeedPage } from "./pages/admin/feed/AdminFoodFeedPage";
import { AdminPlansPage } from "./pages/admin/plans/AdminPlansPage";
import { AdminSubscriptionsPage } from "./pages/admin/subscriptions/AdminSubscriptionsPage";
import { AdminUsersPage } from "./pages/admin/users/AdminUsersPage";
import { AuthPage } from "./pages/auth/AuthPage";
import { HomePage } from "./pages/home/HomePage";
import { SharedStoragePage } from "./pages/shared/SharedStoragePage";
import { UserBudgetPage } from "./pages/user/budget/UserBudgetPage";
import { UserDashboardPage } from "./pages/user/dashboard/UserDashboardPage";
import { UserFoodDetailPage } from "./pages/user/food/UserFoodDetailPage";
import { UserFoodFeedPage } from "./pages/user/feed/UserFoodFeedPage";
import { UserProfilePage } from "./pages/user/profile/UserProfilePage";
import { UserPublicProfilePage } from "./pages/user/profile/UserPublicProfilePage";
import { UserStoragePage } from "./pages/user/storage/UserStoragePage";
import { UserSubscribePage } from "./pages/user/subscribe/UserSubscribePage";
import { getUserSubscriptionStatus } from "./lib/api/userApi";

function AdminRoute({ children }) {
  if (!getToken()) return <Navigate to="/admin/auth" replace />;
  if (!isAdminSession()) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}

function SubscriptionCheck({ children }) {
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    let alive = true;

    getUserSubscriptionStatus()
      .then((status) => {
        if (alive) setState({ loading: false, allowed: !!status?.subscribed });
      })
      .catch(() => {
        if (alive) setState({ loading: false, allowed: false });
      });

    return () => {
      alive = false;
    };
  }, []);

  if (state.loading) {
    return (
      <section
        aria-live="polite"
        style={{
          width: "min(100%, 760px)",
          boxSizing: "border-box",
          margin: "0 auto",
          padding: "64px 24px 120px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            margin: "0 auto 16px",
            border: "4px solid var(--fitme-line)",
            borderTopColor: "var(--fitme-brand-text)",
            borderRadius: "999px",
            animation: "fitmeRouteSpin 900ms linear infinite",
          }}
        />
        <style>{`@keyframes fitmeRouteSpin { to { transform: rotate(360deg); } }`}</style>
        <h1 style={{ margin: 0, color: "var(--fitme-strong)", fontSize: 24 }}>Checking account status</h1>
        <p style={{ margin: "8px 0 0", color: "var(--fitme-muted)" }}>
          Confirming your subscription before opening this page.
        </p>
      </section>
    );
  }
  if (!state.allowed) return <Navigate to="/subscribe" replace />;

  return children;
}

function UserRoute({ children, requireSubscription = false }) {
  if (!getToken()) return <Navigate to="/auth" replace />;
  if (isAdminSession()) return <Navigate to="/admin" replace />;

  if (requireSubscription) {
    return (
      <UserLayout>
        <SubscriptionCheck>{children}</SubscriptionCheck>
      </UserLayout>
    );
  }

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
        path="/admin/users"
        element={
          <AdminRoute>
            <PageSeo
              title="Users | fitme.io Admin"
              description="Review fitme.io users and their subscription status from the admin area."
              robots="noindex, nofollow"
            />
            <AdminUsersPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/subscriptions"
        element={
          <AdminRoute>
            <PageSeo
              title="Subscriptions | fitme.io Admin"
              description="Review fitme.io subscriptions, payment proofs, plans, and payer details."
              robots="noindex, nofollow"
            />
            <AdminSubscriptionsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/plans"
        element={
          <AdminRoute>
            <PageSeo
              title="Plans | fitme.io Admin"
              description="Create, update, and delete fitme.io subscription plans."
              robots="noindex, nofollow"
            />
            <AdminPlansPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/accounts"
        element={
          <AdminRoute>
            <PageSeo
              title="Accounts | fitme.io Admin"
              description="Create, update, and delete fitme.io payment bank accounts."
              robots="noindex, nofollow"
            />
            <AdminAccountsPage />
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
        path="/admin/feed"
        element={
          <AdminRoute>
            <PageSeo
              title="Food Feed Moderation | fitme.io Admin"
              description="Review and moderate active fitme.io food feed posts."
              robots="noindex, nofollow"
            />
            <AdminFoodFeedPage />
          </AdminRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <UserRoute requireSubscription>
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
          <UserRoute requireSubscription>
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
          <UserRoute requireSubscription>
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
          <UserRoute requireSubscription>
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
          <UserRoute requireSubscription>
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
        path="/subscribe"
        element={
          <UserRoute>
            <PageSeo
              title="Subscribe | fitme.io"
              description="Choose a fitme.io subscription plan and submit payment proof for admin review."
              robots="noindex, nofollow"
            />
            <UserSubscribePage />
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
            <UserProfilePage />
          </UserRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <UserRoute>
            <PageSeo
              title="Food Profile | fitme.io"
              description="View a fitme.io user's food feed profile and active food posts."
              robots="noindex, nofollow"
            />
            <UserPublicProfilePage />
          </UserRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
