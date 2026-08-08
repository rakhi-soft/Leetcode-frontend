import { NavLink, useLocation } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../authSlice';
import { ChevronDown, Home, LogOut, Shield } from 'lucide-react';
import { useThemedBorder } from '../context/ThemeContext';

function Navbar() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const borders = useThemedBorder();
  const initial = user?.firstName?.charAt(0)?.toUpperCase() || '?';
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <nav
      className={`navbar min-h-14 h-14 bg-base-100 px-4 sm:px-6 sticky top-0 z-30 shadow-sm border-b transition-colors duration-200 ${borders.divider}`}
    >
      <div className="flex-1">
        <NavLink
          to="/"
          className="btn btn-ghost btn-sm text-lg font-bold tracking-tight px-2 h-9 min-h-9"
        >
          LeetCode
        </NavLink>
      </div>

      <div className="flex-none flex items-center gap-1">
        {user?.role === 'admin' && (
          isAdminRoute ? (
            <NavLink
              to="/"
              className="btn btn-ghost btn-sm gap-1 h-9 min-h-9 px-2 font-medium"
            >
              <Home size={15} />
              Home
            </NavLink>
          ) : (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `btn btn-ghost btn-sm gap-1 h-9 min-h-9 px-2 font-medium ${isActive ? 'bg-base-200 text-primary' : ''}`
              }
            >
              <Shield size={15} />
              Admin
            </NavLink>
          )
        )}

        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            aria-label="User menu"
            className="flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 hover:bg-base-200 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
              {initial}
            </div>
            <span className="text-sm font-medium max-w-[6rem] truncate">
              {user?.firstName}
            </span>
            <ChevronDown size={14} className="opacity-50 shrink-0" />
          </div>
          <ul
            tabIndex={0}
            className={`dropdown-content menu bg-base-100 rounded-lg z-50 w-40 p-1.5 shadow-lg border mt-2 ${borders.card}`}
          >
            <li className="menu-title px-2 py-1 text-xs text-base-content/60 pointer-events-none">
              {user?.firstName}
            </li>
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="gap-2 text-sm py-2 text-error hover:bg-error/10 rounded-md"
              >
                <LogOut size={15} />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
