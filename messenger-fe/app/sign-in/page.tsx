import SignInClient from "./signInClient";

export default function SignInPage({
  searchParams,
}: {
  searchParams?: { redirect?: string };
}) {
  const redirectTo = typeof searchParams?.redirect === "string" ? searchParams.redirect : "/messenger";
  return <SignInClient redirectTo={redirectTo} />;
}


