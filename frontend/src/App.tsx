import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/UI/ProtectedRoute';
import ErrorBoundary from './components/UI/ErrorBoundary';
import { useAuthStore } from './store/authStore';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NetworkTestPage from './pages/NetworkTestPage';
import ProfilePage from './pages/ProfilePage';
import NewsFeedPage from './pages/NewsFeedPage';
import PostDetailPage from './pages/PostDetailPage';
import ArticlesPage from './pages/ArticlesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import CreatePostPage from './pages/CreatePostPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import LFGPage from './pages/LFGPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';

const App: React.FC = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/test" element={<NetworkTestPage />} />
            <Route path="/news" element={<NewsFeedPage />} />
            <Route path="/post/:id" element={<PostDetailPage />} />
            <Route path="/post/create" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/:id" element={<ArticleDetailPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/lfg" element={<LFGPage />} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
