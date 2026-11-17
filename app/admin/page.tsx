import {redirect} from 'next/navigation';
import {authenticated} from '@/lib/admin-auth';
import Admin from '../admin-app';
export default async function Page(){if(!await authenticated())redirect('/admin/login');return <Admin/>}
