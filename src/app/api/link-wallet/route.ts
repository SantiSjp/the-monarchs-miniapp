// app/api/link-wallet/route.ts

import { NextRequest } from "next/server";
import { initializeApp } from "firebase/app";
import { getFirestore,collection, addDoc, getDocs  } from "firebase/firestore";

type WalletLink = {
  wallet: string;
  fid: number;
  username: string;
};

const firebaseConfig = {
  apiKey: "AIzaSyAMehmlRWaujW67jrxL9wC-ptXMo9Y9PKE",
  authDomain: "monarchs-59cab.firebaseapp.com",
  projectId: "monarchs-59cab",
  storageBucket: "monarchs-59cab.firebasestorage.app",
  messagingSenderId: "604561171698",
  appId: "1:604561171698:web:66d9d35a2275b05b9cdc6b",
  measurementId: "G-6RLRTBRCMC"
};

export async function POST(req: NextRequest) {
  const { wallet, fid, username } = await req.json();
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  if (!wallet || !fid) {
    return new Response("Missing wallet or fid", { status: 400 });
  }

  const querySnapshot = await getDocs(collection(db, "wallets"));
  const existingWallet = querySnapshot.docs.find(
    (doc) => doc.data().wallet.toLowerCase() === wallet.toLowerCase()
  );

  if (existingWallet) {
    return Response.json({ 
      success: false, 
      message: "Wallet already linked" 
    }, { status: 400 });
  }  

  await addDoc(collection(db, "wallets"), {
    wallet: wallet,
    fid: fid,
    username: username,
  }); 

  return Response.json({ success: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return new Response(JSON.stringify({ error: "Missing wallet param" }), {
      status: 400,
    });
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const querySnapshot = await getDocs(collection(db, "wallets"));

  const links = querySnapshot.docs.find(
    (doc) => doc.data().wallet.toLowerCase() === wallet.toLowerCase()
  );

  return Response.json({ data: links?.data() || null });
}
