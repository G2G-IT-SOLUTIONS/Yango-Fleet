
'use client';
import * as React from 'react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { motion } from 'motion/react';

export function LoginForm({ className, onLogin, isLoading: externalLoading, error: externalError, ...props }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState('');

  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
  const error = externalError !== undefined ? externalError : internalError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (onLogin) {
      setInternalError('');
      setInternalLoading(true);
      
      try {
        const result = await onLogin(emailOrPhone, password);
        if (result && !result.success) {
          setInternalError(result.error || 'Login failed');
        }
      } catch (err) {
        setInternalError('An error occurred during login');
      } finally {
        setInternalLoading(false);
      }
    }
  };

  return (
    <form className={cn('flex flex-col gap-6', className)} onSubmit={handleSubmit} {...props}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className='flex flex-col gap-5'
      >
        <div className='flex flex-col gap-1'>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Welcome back
          </h1>
          <p className='text-sm text-muted-foreground'>
            Log in to your account to continue
          </p>
        </div>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'></span>
          </div>
        </div>

        <div className='grid gap-3'>
          <div className='space-y-1.5'>
            <Label >Email or Phone Number</Label>
            <Input
              id='email'
              placeholder='m@example.com / +2519--'
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
            />
          </div>
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='password'>Password</Label>
              <a
                href='#'
                className='text-xs text-muted-foreground underline-offset-4 hover:underline'
              >
                Forgot password?
              </a>
            </div>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter your password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='w-4 h-4'>
                    <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24'/>
                    <line x1='1' y1='1' x2='23' y2='23'/>
                  </svg>
                ) : (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='w-4 h-4'>
                    <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/>
                    <circle cx='12' cy='12' r='3'/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className='text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-md'>
            {error}
          </div>
        )}

        <Button 
          type='submit' 
          className='w-full h-11 font-semibold'
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </Button>
      </motion.div>
    </form>
  );
}