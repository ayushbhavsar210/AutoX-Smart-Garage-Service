import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This component redirects to the unified login/admin login page
function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  return null;
}

export default Login;