import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Movie from './pages/Movie';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Admin from './pages/Admin';
import Random from './pages/Random';
import Genre from './pages/Genre';
import Category from './pages/Category';
import { Toaster } from 'sonner';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/watch/:type/:id" element={<Movie />} />
            <Route path="/movie/:id" element={<Movie />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/random" element={<Random />} />
            <Route path="/genre/:id" element={<Genre />} />
            <Route path="/category/:type" element={<Category />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/popular" element={<Category />} />
            <Route path="/new" element={<Category />} />
            <Route path="/favorites" element={<Profile />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
        <Toaster position="bottom-right" theme="dark" richColors />
      </Router>
    </AuthProvider>
  );
}
