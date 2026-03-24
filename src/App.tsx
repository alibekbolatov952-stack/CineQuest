import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Movie from './pages/Movie';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Admin from './pages/Admin';
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
            <Route path="/movie/:id" element={<Movie />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/popular" element={<Home />} />
            <Route path="/new" element={<Home />} />
            <Route path="/favorites" element={<Profile />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
        <Toaster position="bottom-right" theme="dark" richColors />
      </Router>
    </AuthProvider>
  );
}
