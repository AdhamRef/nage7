import React from 'react'
import Logo from '@/components/logo'
import SidebarRoutes from './sidebarRoutes'

type Props = {
};

const Sidebar = (_props: Props) => {
  return (
    <div className=' h-full border-r flex flex-col overflow-y-auto bg-white dark:bg-slate-900 shadow-md'>
        <div className='p-6'>
            <Logo height={34} priority />
        </div>
        <div className='flex flex-col w-full'>
            <SidebarRoutes />
        </div>
    </div>
  )
}

export default Sidebar