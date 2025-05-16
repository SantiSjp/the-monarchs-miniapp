"use client";

import { useCallback, useState } from "react";
import { useSession, signIn, signOut, getCsrfToken } from "next-auth/react";
import { Button } from "./ui/Button";
import sdk, { SignIn as SignInCore } from "@farcaster/frame-sdk";

export default function FarcasterLogin() {
  const { data: session, status } = useSession();
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signInFailure, setSignInFailure] = useState<string>();

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      setSignInFailure(undefined);

      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });

      await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });
    } catch (e) {
      if (e instanceof SignInCore.RejectedByUser) {
        setSignInFailure("Login cancelado");
      } else {
        setSignInFailure("Erro ao fazer login");
      }
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    await signOut({ redirect: false });
    setSigningOut(false);
  }, []);

  if (status === "loading") return null;

  return (
    <div className="flex flex-col items-center gap-3">
      {status !== "authenticated" ? (
        <Button onClick={handleSignIn} disabled={signingIn}>
          {signingIn ? "Conectando..." : "Entrar com Farcaster"}
        </Button>
      ) : (
        <>
          <p className="text-sm text-white">🎉 Logado como {session.user?.fid}</p>
          <Button onClick={handleSignOut} disabled={signingOut}>
            Sair
          </Button>
        </>
      )}

      {signInFailure && (
        <p className="text-sm text-red-500">{signInFailure}</p>
      )}
    </div>
  );
}
