import { AuthSplitLayout } from "@/components/AuthSplitLayout";
import { getServerTranslator } from "@/lib/i18n/server";
import RegisterFormClient from "./RegisterFormClient";

export default async function RegisterPage() {
  const t = await getServerTranslator();

  return (
    <AuthSplitLayout
      welcomeTitle={t("auth.login.welcomeRegisterTitle", "Create your account")}
      welcomeDescription={t(
        "auth.login.welcomeRegisterDescription",
        "Join the platform and start your learning journey today",
      )}
      backHref="/"
    >
      <RegisterFormClient />
    </AuthSplitLayout>
  );
}
