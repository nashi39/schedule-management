import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, List } from 'lucide-react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">スケジュール管理</h1>
        <nav className="header-nav">
          <Link to="/" className="nav-link">
            <List size={20} />
            スケジュール一覧
          </Link>
          <Link to="/calendar" className="nav-link">
            <Calendar size={20} />
            カレンダー
          </Link>
          <Link to="/add" className="nav-link">
            <Plus size={20} />
            新規作成
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
