import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthRedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const apiKey = searchParams.get('apiKey');
    const oobCode = searchParams.get('oobCode');
    
    // Check if this is a Firebase auth action link
    if (mode && apiKey && oobCode) {
      // This is a Firebase auth link (verification or reset)
      // We don't handle it here - let Firebase handle it
      
      if (mode === 'verifyEmail') {
        alert('Email verified successfully! Please log in with your credentials.');
      } else if (mode === 'resetPassword') {
        alert('Password reset completed! Please log in with your new password.');
      }
      
      // Redirect to login page after showing message
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      // Not a valid auth link, redirect to home
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="text-6xl text-brick-600 mb-4">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <h2 className="text-2xl font-oswald font-bold text-gray-900">
          Processing...
        </h2>
        <p className="text-gray-600 mt-2">
          Please wait while we complete the action.
        </p>
        <div className="pt-6">
          <div className="animate-pulse">
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded mt-2"></div>
            <div className="h-2 bg-gray-200 rounded mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthRedirectPage;