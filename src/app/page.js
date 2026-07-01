import React from 'react';
import { headers } from 'next/headers';
import MessengerPage from '@/Components/MessengerPage';
import { auth } from './(auth)/lib/auth';
import { redirect } from 'next/navigation';

const MainPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session)
  {
    redirect('/login')
  }
  const userId = session?.user.id;

  const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/user/${userId}`)
  const user = await res.json()
  
  return (
    <div>
      <MessengerPage userId={userId} allUser={user} />
    </div>
  );
};

export default MainPage;