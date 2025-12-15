import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to admin events page
    navigate('/admin/events', { replace: true });
  }, [navigate]);

  return null;
};

export default AdminPanel;

