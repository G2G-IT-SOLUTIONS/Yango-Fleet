// import React, { useState, useEffect } from 'react';
// import logo from '../assets/coverbackground.png'
// import './Login.css';

// const Login = ({ onLogin }) => {
//   const [emailOrPhone, setEmailOrPhone] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [showPassword, setShowPassword] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     try {
//       // Simulate API call - replace with your actual login API
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ emailOrPhone, password }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         localStorage.setItem('authToken', data.data.token);
//         localStorage.setItem('employee', JSON.stringify(data.data.employee));
//         onLogin(data.data);
//       } else {
//         setError(data.message || 'Login failed. Please try again.');
//       }
//     } catch (err) {
//       setError('Network error. Please check your connection.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="login-container">
//       {/* Animated background with blur */}
//       <div className="background-wrapper">
//         <div className="bg-image"></div>
//         <div className="bg-overlay"></div>
        
//         {/* Floating particles */}
//         <div className="particles">
//           {[...Array(20)].map((_, i) => (
//             <div key={i} className={`particle particle-${i}`}></div>
//           ))}
//         </div>
        
//         {/* Floating geometric shapes */}
//         <div className="floating-shapes">
//           <div className="shape shape-1"></div>
//           <div className="shape shape-2"></div>
//           <div className="shape shape-3"></div>
//           <div className="shape shape-4"></div>
//         </div>
//       </div>

//       {/* Main login card */}
//       <div className="login-card-wrapper">
//         <div className="login-card">
//           {/* Logo/Brand */}
//           <div className="brand-section">
//               <div className="logo-container">
//                 <div className="logo-icon">
//                        <img 
//                           src={logo} 
//                           alt="Yango Fleet Logo"
//                           className="logo-image"
//                       />
//                </div>
//              </div>
//             <h1 className="brand-title">Yango Fleet</h1>
//             <p className="brand-subtitle">Enterprise Management System</p>
//           </div>

//           {/* Login Form */}
//           <form onSubmit={handleSubmit} className="login-form">
//             <div className="form-group">
//               <label htmlFor="emailOrPhone">
//                 <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                   <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"/>
//                   <path d="M22 6L12 13L2 6"/>
//                 </svg>
//                 Email or Phone
//               </label>
//               <input
//                 type="text"
//                 id="emailOrPhone"
//                 value={emailOrPhone}
//                 onChange={(e) => setEmailOrPhone(e.target.value)}
//                 placeholder="Enter your email or phone number"
//                 required
//                 autoComplete="username"
//               />
//               <div className="input-glow"></div>
//             </div>

//             <div className="form-group">
//               <label htmlFor="password">
//                 <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                   <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
//                   <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11"/>
//                 </svg>
//                 Password
//               </label>
//               <div className="password-input-wrapper">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   id="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Enter your password"
//                   required
//                   autoComplete="current-password"
//                 />
//                 <button
//                   type="button"
//                   className="password-toggle"
//                   onClick={() => setShowPassword(!showPassword)}
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                 >
//                   {showPassword ? (
//                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                       <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
//                       <line x1="1" y1="1" x2="23" y2="23"/>
//                     </svg>
//                   ) : (
//                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                       <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
//                       <circle cx="12" cy="12" r="3"/>
//                     </svg>
//                   )}
//                 </button>
//               </div>
//               <div className="input-glow"></div>
//             </div>

//             {error && (
//               <div className="error-message">
//                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                   <circle cx="12" cy="12" r="10"/>
//                   <line x1="12" y1="8" x2="12" y2="12"/>
//                   <line x1="12" y1="16" x2="12.01" y2="16"/>
//                 </svg>
//                 {error}
//               </div>
//             )}

//             <button
//               type="submit"
//               className={`login-button ${isLoading ? 'loading' : ''}`}
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <>
//                   <span className="spinner"></span>
//                   Signing in...
//                 </>
//               ) : (
//                 <>
//                   <span>Sign In</span>
//                   <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <line x1="5" y1="12" x2="19" y2="12"/>
//                     <polyline points="12 5 19 12 12 19"/>
//                   </svg>
//                 </>
//               )}
//             </button>
//           </form>

//           {/* Footer */}
//           <div className="login-footer">
//             <p className="footer-text">
//               © {new Date().getFullYear()} Yango Fleet. All rights reserved.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;


// import React from 'react';
// import { LoginForm } from '../components/Admin/LoginForm';
// import { MotionGrid } from '../components/ui/MotionGrid';
// import backgroundImage from '../assets/coverbackground.png';
// import logo from '../assets/logo.png'
// export default function Login() {
//   return (
//     <div className='grid min-h-svh lg:grid-cols-2'>
//       <div className='flex flex-col gap-4 p-6 md:p-10'>
//         <div className='flex justify-center gap-2 md:justify-start'>
//           <a href='#' className='flex items-center gap-2 font-medium'>
//             <div className='flex size-7 items-center justify-center rounded-md'>
//               {/* <svg
//                 xmlns='http://www.w3.org/2000/svg'
//                 className='shrink-0 w-6 h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black dark:text-white'
//                 viewBox='0 0 24 24'
//               >
//                 <path
//                   fill='currentColor'
//                   d='M5.999 17a3 3 0 0 1-1.873-.658a2.98 2.98 0 0 1-1.107-2.011a2.98 2.98 0 0 1 .639-2.206l4-5c.978-1.225 2.883-1.471 4.143-.523l1.674 1.254l2.184-2.729a3 3 0 1 1 4.682 3.747l-4 5c-.977 1.226-2.882 1.471-4.143.526l-1.674-1.256l-2.184 2.729A2.98 2.98 0 0 1 5.999 17M10 8a1 1 0 0 0-.781.374l-4 5.001a1 1 0 0 0-.213.734c.03.266.161.504.369.67a.996.996 0 0 0 1.406-.155l3.395-4.244L13.4 12.8c.42.316 1.056.231 1.381-.176l4-5.001a1 1 0 0 0 .213-.734a1 1 0 0 0-.369-.67a.996.996 0 0 0-1.406.156l-3.395 4.242L10.6 8.2A1 1 0 0 0 10 8m9 13H5a1 1 0 1 1 0-2h14a1 1 0 1 1 0 2'
//                 />
//               </svg> */}
//               <img src={logo} alt="" />
//             </div>
//             G2G IT SOLUTION
//           </a>
//         </div>
//         <div className='flex flex-1 items-center justify-center'>
//           <div className='w-full max-w-xs'>
//             <LoginForm />
//           </div>
//         </div>
//       </div>
//       <div className='relative hidden bg-muted lg:block'>
//        <MotionGrid
//           speed='3s'
//           opacity={0.15}
//           enableGlow={true}
//           lineColor='20, 184, 166'
//           backgroundImage={backgroundImage}
//           imageBlur='3px'
//           overlayColor='rgba(255,255,255,0.35)'
//           className='relative h-full w-full flex flex-col items-center justify-center'
//        >
//           <div className='relative flex min-h-80 flex-col items-start justify-center overflow-hidden rounded-2xl bg-white p-4 md:p-8 dark:bg-black'>
        
//             <div className='relative z-40 max-w-sm rounded-xl bg-black/5 p-4 backdrop-blur-sm dark:bg-black/50'>
//               <img src={backgroundImage} alt="" />
//             </div>

//              <div className='mask-r-from-50% absolute -top-48 -right-40 z-20 grid rotate-45 transform grid-cols-4 gap-32'>
//               <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
//               <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
//               <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
//               <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
//             </div>

//             <div className='mask-r-from-50% absolute top-0 -right-10 z-20 grid rotate-45 transform grid-cols-4 gap-32 opacity-50'>
//               <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
//               <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
//               <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
//               <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
//             </div> 
            

//             <canvas
//               className='mask-t-from-50% absolute inset-0 z-30 h-full w-200 blur-3xl'
//               width='1000'
//               height='956'
//             />
//           </div>
//         </MotionGrid>
//       </div>
//     </div>
//   );
// }

import React, { useState } from 'react';
import { LoginForm } from '../components/Admin/LoginForm';
import { MotionGrid } from '../components/ui/MotionGrid';
import backgroundImage from '../assets/coverbackground.png';
import logo from '../assets/logo.png';

export default function Login({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // This function will be passed to LoginForm as a prop
  const handleLogin = async (emailOrPhone, password) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('employee', JSON.stringify(data.data.employee));
        if (onLogin) {
          onLogin(data.data);
        }
        return { success: true, data: data.data };
      } else {
        setError(data.message || 'Login failed. Please try again.');
        return { success: false, error: data.message };
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      return { success: false, error: 'Network error' };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      <div className='flex flex-col gap-4 p-6 md:p-10'>
        <div className='flex justify-center gap-2 md:justify-start'>
          <a href='#' className='flex items-center gap-2 font-medium'>
            <div className='flex size-7 items-center justify-center rounded-md'>
              <img src={logo} alt="Logo" />
            </div>
            G2G IT SOLUTION
          </a>
        </div>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-xs'>
            <LoginForm 
              onLogin={handleLogin} 
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </div>
      <div className='relative hidden bg-muted lg:block'>
        <MotionGrid
          speed='3s'
          opacity={0.15}
          enableGlow={true}
          lineColor='20, 184, 166'
          backgroundImage={backgroundImage}
          imageBlur='3px'
          overlayColor='rgba(255,255,255,0.35)'
          className='relative h-full w-full flex flex-col items-center justify-center'
        >
          <div className='relative flex min-h-80 flex-col items-start justify-center overflow-hidden rounded-2xl bg-white p-4 md:p-8 dark:bg-black'>
            <div className='relative z-40 max-w-sm rounded-xl bg-black/5 p-4 backdrop-blur-sm dark:bg-black/50'>
              <img src={backgroundImage} alt="Background" />
            </div>

            <div className='mask-r-from-50% absolute -top-48 -right-40 z-20 grid rotate-45 transform grid-cols-4 gap-32'>
              <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
              <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
              <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
              <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
            </div>

            <div className='mask-r-from-50% absolute top-0 -right-10 z-20 grid rotate-45 transform grid-cols-4 gap-32 opacity-50'>
              <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
              <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
              <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
              <div className='size-40 shrink-0 rounded-3xl bg-neutral-200 dark:bg-neutral-900 shadow-[0px_2px_0px_0px_var(--color-neutral-300)_inset] dark:shadow-[0px_2px_0px_0px_var(--color-neutral-600)_inset]' />
            </div>

            <canvas
              className='mask-t-from-50% absolute inset-0 z-30 h-full w-200 blur-3xl'
              width='1000'
              height='956'
            />
          </div>
        </MotionGrid>
      </div>
    </div>
  );
}