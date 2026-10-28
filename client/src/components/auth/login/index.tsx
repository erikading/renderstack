import './index.css';
import useAuth from '../../../hooks/useAuth';
import { useAuth0 } from '@auth0/auth0-react';
/**
 * Renders a login form with username and password inputs, password visibility toggle,
 * error handling, and a link to the signup page.
 */
const Login = () => {
  const { isLoading, isAuthenticated } = useAuth0();
  const { handleLogin, err } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Don't render login button if already authenticated
  if (isAuthenticated) {
    return <div>{err || 'Redirecting...'}</div>;
  }

  return (
    <div className='container'>
      <img
        src='/logo.png'
        alt='RenderStack Logo'
        className='login-logo'
      />

      <h3>Please login to continue.</h3>

      <button className='login-button' onClick={handleLogin} disabled={isLoading}>
        Log In or Sign Up
      </button>
    </div>
  );
};

export default Login;
