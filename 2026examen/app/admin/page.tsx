import {admin} from '@/lib/auth';
import ExamApp from '../exam-app';
import Login from './login';
export const dynamic='force-dynamic';
export default async function Admin(){return await admin()?<><ExamApp manage/></>:<Login/>;}
