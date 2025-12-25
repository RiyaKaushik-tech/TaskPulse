import React from 'react'
import ThemeToggle from './ThemeToggle'

const AuthLayout = ({children}) => {
  return (
    <div 
      className='flex h-screen overflow-hidden'
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
        {/* Theme toggle accessible on auth pages without changing logic */}
        <div className='fixed top-4 right-4 z-50'>
          <ThemeToggle />
        </div>

        <div 
          className='w-full md:w-1/2 overflow-y-auto'
          style={{ backgroundColor: "var(--bg-primary)" }}
        >
          <div 
            className='min-h-screen flex px-12 pt-8 pb-12 flex-col'
            style={{ backgroundColor: "var(--bg-primary)" }}
          >
            <div className='flex flex-grow justify-center items-center'>
              {children}
            </div>
          </div>
        </div>

      <div className='hidden md:block w-1/2'>
        <img 
          src="https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg"
          alt="login background" 
          className='h-full w-full object-cover'/>
      </div>
    </div>
  )
}

export default AuthLayout
