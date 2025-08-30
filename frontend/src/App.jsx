import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Upload from './components/Upload/Upload';
import Products from './components/Products/Products';
import Notes from './components/Notes/Notes';
import Suppliers from './components/Suppliers/Suppliers';
import Reports from './components/Reports/Reports';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <div className="app-body">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/notas" element={<Notes />} />
              <Route path="/fornecedores" element={<Suppliers />} />
              <Route path="/compras" element={<Reports type="compras" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
export default App;
