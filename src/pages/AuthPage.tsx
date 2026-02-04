import  { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload
} from "firebase/auth";
import { auth } from '../services/firebaseConfig';
import ReCAPTCHA from "react-google-recaptcha";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    color: 'bg-gray-200'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const googleProvider = new GoogleAuthProvider();

  // Load saved credentials and check auth state
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    
    // Listen to auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      
      // Check if user is logged in but not verified
      if (user && !user.emailVerified && user.providerData[0]?.providerId === 'password') {
        setShowVerificationWarning(true);
      } else {
        setShowVerificationWarning(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Refresh user data to check verification status
  const refreshUser = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      const updatedUser = auth.currentUser;
      setCurrentUser(updatedUser);
      
      if (updatedUser.emailVerified) {
        setShowVerificationWarning(false);
      }
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Save user info to localStorage for auto-login
      localStorage.setItem('rememberedEmail', user.email || '');
      localStorage.setItem('rememberMe', 'true');
      
      // Google users are automatically verified
      // Redirect to home page
      navigate('/');
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      
      switch (err.code) {
        case 'auth/popup-closed-by-user':
          setError("Google sign-in was cancelled.");
          break;
        case 'auth/popup-blocked':
          setError("Popup was blocked by browser. Please allow popups for this site.");
          break;
        case 'auth/cancelled-popup-request':
          setError("Sign-in cancelled.");
          break;
        case 'auth/account-exists-with-different-credential':
          setError("An account already exists with this email. Please sign in with email/password.");
          break;
        default:
          setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (pwd: string) => {
    let score = 0;
    const feedback = [];
    
    // Length check
    if (pwd.length >= 8) score += 1;
    else feedback.push("At least 8 characters");
    
    // Lowercase check
    if (/[a-z]/.test(pwd)) score += 1;
    else feedback.push("One lowercase letter");
    
    // Uppercase check
    if (/[A-Z]/.test(pwd)) score += 1;
    else feedback.push("One uppercase letter");
    
    // Number check
    if (/\d/.test(pwd)) score += 1;
    else feedback.push("One number");
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    else feedback.push("One special character");
    
    let color = '';
    let strengthText = '';
    
    switch(score) {
      case 0:
      case 1:
        color = 'bg-red-500';
        strengthText = 'Very Weak';
        break;
      case 2:
        color = 'bg-orange-500';
        strengthText = 'Weak';
        break;
      case 3:
        color = 'bg-yellow-500';
        strengthText = 'Fair';
        break;
      case 4:
        color = 'bg-blue-500';
        strengthText = 'Strong';
        break;
      case 5:
        color = 'bg-green-500';
        strengthText = 'Very Strong';
        break;
    }
    
    setPasswordStrength({
      score,
      feedback: feedback.length > 0 ? `Missing: ${feedback.join(', ')}` : strengthText,
      color
    });
  };

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!isLogin) {
      if (!fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (fullName.length < 2) {
        errors.fullName = 'Name must be at least 2 characters';
      }
      
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      if (passwordStrength.score < 3) {
        errors.password = 'Password is too weak';
      }
    }
    
    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password change
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    checkPasswordStrength(value);
  };

  // Handle forgot password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(forgotPasswordEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setForgotPasswordLoading(true);

    try {
      await sendPasswordResetEmail(auth, forgotPasswordEmail, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false
      });
      
      alert(`Password Reset Email Sent!\n\n A password reset link has been sent to:\n${forgotPasswordEmail}\n\n Please check your email and click the reset link.\n\n The link will open in your browser where you can set a new password.\n\n IMPORTANT: After resetting your password in the browser, please return back to this app to login with your new credentials.`);
      
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (err: any) {
      console.error("Password reset error:", err);
      
      switch (err.code) {
        case 'auth/user-not-found':
          setError("No account found with this email");
          break;
        case 'auth/invalid-email':
          setError("Invalid email address");
          break;
        case 'auth/too-many-requests':
          setError("Too many attempts. Please try again later");
          break;
        default:
          setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!currentUser) {
      setError("Please sign in first to resend verification email");
      return;
    }

    try {
      await sendEmailVerification(currentUser, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false
      });
      
      alert(` Verification Email Resent!\n\n A new verification email has been sent to:\n${currentUser.email}\n\n Please check your inbox and click the verification link.\n\n The link will open in your browser to confirm your email address.\n\n IMPORTANT: After verifying your email in the browser, please return back to this app to continue using your account.`);
    } catch (error: any) {
      console.error("Resend verification error:", error);
      setError("Failed to resend verification email. Please try again.");
    }
  };

  // Check verification status
  const handleCheckVerification = async () => {
    await refreshUser();
    
    if (currentUser?.emailVerified) {
      alert(` Email Verified Successfully!\n\nYour email ${currentUser.email} is now verified.\n\nYou can continue using the eBricks app.`);
      setShowVerificationWarning(false);
    } else {
      alert(` Email Not Verified Yet\n\nYour email ${currentUser?.email} is still not verified.\n\n Please check your inbox and click the verification link we sent.\n\n The link will open in your browser to complete verification.\n\n IMPORTANT: After verifying in the browser, return back to this app and click "Check Status" again.`);
    }
  };

  // Handle main form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    if (!captchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Save email to localStorage if "Remember Me" is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          // Clear saved credentials if "Remember Me" is unchecked
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
        }
        
        // LOGIN LOGIC
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check if email is verified
        if (!user.emailVerified) {
          setShowVerificationWarning(true);
          alert(` IMPORTANT: Email Verification Required!\n\nYour account ${user.email} is not verified yet.\n\n Please check your email inbox and click the verification link we sent when you signed up.\n\n The verification link will open in your browser to confirm your email.\n\n IMPORTANT: After verifying in the browser, please return back to this app to access all features.\n\n Need a new verification email? Click "Resend Verification" below.`);
        } else {
          // Redirect to home page only if verified
          navigate('/');
        }
      } else {
        // SIGN UP LOGIC
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update the user's profile with their Full Name
        await updateProfile(user, {
          displayName: fullName
        });

        // Send email verification
        try {
          await sendEmailVerification(user, {
            url: `${window.location.origin}/login`,
            handleCodeInApp: false
          });
          
          alert(` Account Created Successfully!\n\n👋 Welcome to eBricks, ${fullName}!\n\n A verification email has been sent to:\n${user.email}\n\n🔗 Please check your inbox and click the verification link.\n\n🌐 The link will open in your browser to confirm your email address.\n\n IMPORTANT: After verifying your email in the browser, please return back to this app to login with your new account.\n\n Please verify within 24 hours to activate your account fully.`);
          
          // Sign out user so they verify email first
          await auth.signOut();
          
          // Clear form and switch to login
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setFullName('');
          setIsLogin(true);
          setError('');
        } catch (error) {
          console.error("Verification email error:", error);
          alert(`Account Created Successfully!\n\n👋 Welcome to eBricks, ${fullName}!\n\n A verification email will be sent shortly to:\n${user.email}\n\n When you receive the email, please click the verification link.\n\n The link will open in your browser to confirm your email.\n\n🔄 IMPORTANT: After verifying in the browser, please return back to this app to login.\n\n Note: You must verify your email to access all features.`);
          
          // Clear form and switch to login
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setFullName('');
          setIsLogin(true);
          setError('');
        }
      }
      
    } catch (err: any) {
      console.error("Auth Error Code:", err.code);
      
      // SPECIFIC ERROR HANDLING
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError("This email is already registered. Please sign in instead.");
          break;
        case 'auth/invalid-credential':
          setError("Incorrect email or password. Please try again.");
          break;
        case 'auth/weak-password':
          setError("Password is too weak. Please use at least 6 characters.");
          break;
        case 'auth/user-not-found':
          setError("No account found with this email.");
          break;
        case 'auth/invalid-email':
          setError("Invalid email address format.");
          break;
        case 'auth/too-many-requests':
          setError("Too many attempts. Please try again later.");
          break;
        default:
          setError("Authentication failed. Please check your connection.");
      }
      
      // Reset reCAPTCHA on error so they can try again
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Password requirements checklist
  const passwordRequirements = [
    { label: 'At least 8 characters', regex: /.{8,}/ },
    { label: 'One lowercase letter', regex: /[a-z]/ },
    { label: 'One uppercase letter', regex: /[A-Z]/ },
    { label: 'One number', regex: /\d/ },
    { label: 'One special character', regex: /[^A-Za-z0-9]/ }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-oswald font-bold text-brick-900">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-500 mt-2 font-mukta">
            {isLogin ? 'Sign in to manage your brick orders' : 'Join the eBricks family today'}
          </p>
        </div>

        {/* Verification Warning for logged in users */}
        {showVerificationWarning && currentUser && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg animate-pulse">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 text-xl mt-1">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-800">⚠️ Email Not Verified!</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Your email {currentUser.email} is not verified. Please verify to access all features.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleResendVerification}
                    className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Resend Verification
                  </button>
                  <button
                    onClick={handleCheckVerification}
                    className="px-4 py-2 bg-brick-600 text-white text-sm font-medium rounded-lg hover:bg-brick-700 transition-colors"
                  >
                    Check Status
                  </button>
                  <button
                    onClick={() => auth.signOut()}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-center gap-3 animate-pulse">
            <i className="fas fa-exclamation-circle text-red-500"></i>
            <p className="text-red-700 text-sm font-bold">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name - Sign Up Only */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${formErrors.fullName ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-brick-500 outline-none transition-all`}
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                {formErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.fullName}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700">Email Address</label>
              <input
                type="email"
                required
                className={`w-full px-4 py-3 rounded-xl border ${formErrors.email ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-brick-500 outline-none transition-all`}
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className={`w-full px-4 py-3 rounded-xl border ${formErrors.password ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-brick-500 outline-none transition-all pr-10`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <i className="fas fa-eye-slash"></i>
                  ) : (
                    <i className="fas fa-eye"></i>
                  )}
                </button>
              </div>
              
              {/* Password Strength Meter - Sign Up Only */}
              {!isLogin && password && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      Password strength
                    </span>
                    <span className="text-xs font-bold">
                      {passwordStrength.feedback}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="mt-3 space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {req.regex.test(password) ? (
                          <i className="fas fa-check-circle text-green-500 text-xs"></i>
                        ) : (
                          <i className="fas fa-times-circle text-gray-300 text-xs"></i>
                        )}
                        <span className={`text-xs ${req.regex.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {formErrors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password - Sign Up Only */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className={`w-full px-4 py-3 rounded-xl border ${formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-brick-500 outline-none transition-all pr-10`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <i className="fas fa-eye-slash"></i>
                    ) : (
                      <i className="fas fa-eye"></i>
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.confirmPassword}
                  </p>
                )}
                {!formErrors.confirmPassword && password && confirmPassword && password === confirmPassword && (
                  <p className="text-green-500 text-sm mt-1">
                    <i className="fas fa-check-circle mr-1"></i>
                    Passwords match
                  </p>
                )}
              </div>
            )}

            {/* Remember Me Checkbox - Login Only */}
            {isLogin && !currentUser && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-brick-600 focus:ring-brick-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                
                {/* Forgot Password Link - Login Only */}
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-brick-600 hover:text-brick-800 font-bold text-sm"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {/* reCAPTCHA */}
          <div className="flex justify-center pt-2">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (!isLogin && password !== confirmPassword)}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
              loading || (!isLogin && password !== confirmPassword)
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-brick-800 hover:bg-brick-900 active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Processing...
              </>
            ) : (
              <>{isLogin ? (currentUser ? 'CONTINUE' : 'SIGN IN') : 'CREATE ACCOUNT'}</>
            )}
          </button>

          {/* Divider for Google Sign In */}
          {!currentUser && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Continue with Google Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className={`w-full py-3 rounded-xl font-bold text-gray-700 transition-all shadow border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-3 ${
                  googleLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {googleLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <img 
                      src="https://www.google.com/favicon.ico" 
                      alt="Google" 
                      className="w-5 h-5"
                    />
                    Continue with Google
                  </>
                )}
              </button>
            </>
          )}
        </form>

        {/* Toggle between Login/Signup */}
        {!currentUser && (
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm mb-2">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormErrors({});
                setCaptchaToken(null);
                recaptchaRef.current?.reset();
              }}
              className="text-brick-600 hover:text-brick-800 font-bold text-sm underline underline-offset-4"
            >
              {isLogin ? 'Create a new account' : 'Sign in to existing account'}
            </button>
          </div>
        )}

        {/* Verification Note */}
        <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
          <p className="flex items-center justify-center gap-1">
            <i className="fas fa-envelope"></i>
            <span>Email verification required for full access</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Google accounts are automatically verified
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-oswald font-bold text-brick-900">
                Reset Password
              </h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail('');
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brick-500 outline-none transition-all"
                  placeholder="Enter your email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="text-sm text-gray-600">
                <p>We'll send you a password reset link to your email.</p>
                <p className="mt-1 text-brick-600 font-medium">
                  <i className="fas fa-info-circle mr-1"></i>
                  After resetting, you'll be redirected to login page automatically.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setError('');
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${
                    forgotPasswordLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-brick-800 hover:bg-brick-900'
                  }`}
                >
                  {forgotPasswordLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></span>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;