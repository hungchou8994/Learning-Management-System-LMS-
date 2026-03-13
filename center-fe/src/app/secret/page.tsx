import { notFound } from "next/navigation";
import { SecretCreateUserForm } from "./secret-form";

export default function SecretPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  // Hard disable in production
  if (process.env.NODE_ENV === "production") return notFound();

  const requiredKey = process.env.CENTER_SECRET_KEY;
  const providedKey = searchParams?.key;

  if (!requiredKey) return notFound();
  if (!providedKey || providedKey !== requiredKey) return notFound();

  return <SecretCreateUserForm secretKey={providedKey} />;
}


