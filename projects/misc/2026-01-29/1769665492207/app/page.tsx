import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to login by default
  redirect('/login');
}
