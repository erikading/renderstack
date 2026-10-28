import { useNavigate } from 'react-router-dom';
import useHeader from '../../hooks/useHeader';
import './index.css';
import useUserContext from '../../hooks/useUserContext';
import { Search, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

/**
 * Header component that renders the main title and a search bar.
 * The search bar allows the user to input a query and navigate to the search results page
 * when they press Enter.
 */
const Header = () => {
  const { val, handleInputChange, handleKeyDown } = useHeader();
  const { user: currentUser } = useUserContext();
  const navigate = useNavigate();
  const { logout } = useAuth0();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /*
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className='header'>
      <div className='header-left' onClick={() => navigate('/')}>
        <img
          src='/logo.png'
          alt='Logo'
          className='header-logo'
        />
      </div>

      <div className='header-center'>
        <div className='search-wrapper'>
          <Search size={18} className='searchIcon' />
          <input
            id='searchBar'
            className='search-input'
            placeholder='Search questions…'
            type='text'
            value={val}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      <div className='header-right'>
        <div ref={menuRef} className='profile-dropdown-container'>
          {currentUser && (
            <div className='profile-trigger' onClick={() => setOpen(prev => !prev)}>
              {currentUser.profilePicture ? (
                <div
                  className='navbar-profile-icon'
                  style={{ backgroundImage: `url(${currentUser.profilePicture})` }}
                />
              ) : (
                <User className='navbar-default-icon' size={32} />
              )}

              <svg
                className={`dropdown-arrow ${open ? 'open' : ''}`}
                width='16'
                height='16'
                viewBox='0 0 24 24'>
                <path
                  d='M7 10l5 5 5-5'
                  stroke='black'
                  strokeWidth='2'
                  fill='none'
                  strokeLinecap='round'
                />
              </svg>
            </div>
          )}

          {open && (
            <div className='profile-menu'>
              <div
                className='profile-menu-item'
                onClick={() => {
                  setOpen(false);
                  navigate(`/user/${currentUser.username}`);
                }}>
                Profile
              </div>

              <div
                className='profile-menu-item'
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
                Log Out
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
