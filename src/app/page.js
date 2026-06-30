import mongoose from 'mongoose';
import React from 'react';
import { headers } from 'next/headers';
import MessengerPage from '@/Components/MessengerPage';
import { auth } from './(auth)/lib/auth';

const MainPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  const userId = session.user.id;

  await mongoose.connect(process.env.MONGODB_URI);
  const userModel =  mongoose.connection.db.collection('user')
  const allUser = await userModel.find({_id: {$ne: new mongoose.Types.ObjectId(userId)}}).toArray()
  
  return (
    <div>
      <MessengerPage userId={userId} allUser={allUser} />
    </div>
  );
};

export default MainPage;