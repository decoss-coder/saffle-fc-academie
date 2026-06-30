"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, phoneToAuthEmail } from "@/lib/phone";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AuthState = {
  error?: string;
  success?: string;
};

type PhoneAuthCheck = {
  allowed: boolean;
  already_registered?: boolean;
  reason?: string;
  role?: string;
  display_name?: string;
};

async function checkPhone(supabase: Awaited<ReturnType<typeof createClient>>, phone: string) {
  const { data, error } = await supabase.rpc("check_phone_auth", {
    p_phone: phone,
  });

  if (error) {
    return null;
  }

  return data as PhoneAuthCheck;
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!phone || !password) {
    return { error: "Numéro de téléphone et mot de passe requis." };
  }

  const supabase = await createClient();
  const check = await checkPhone(supabase, phone);

  if (!check?.allowed) {
    return {
      error:
        "Ce numéro n'est pas reconnu. Contactez le club si votre enfant est déjà inscrit.",
    };
  }

  if (!check.already_registered) {
    return {
      error:
        "Compte non activé. Utilisez « Première connexion » pour créer votre accès.",
    };
  }

  const email = phoneToAuthEmail(phone);
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Numéro ou mot de passe incorrect." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function activateAccount(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");

  if (!phone || !password) {
    return { error: "Numéro de téléphone et mot de passe requis." };
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  if (password !== passwordConfirm) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();
  const check = await checkPhone(supabase, phone);

  if (!check?.allowed) {
    return {
      error:
        "Ce numéro n'est pas enregistré par le club. Vérifiez le numéro ou contactez l'administration.",
    };
  }

  if (check.already_registered) {
    return {
      error: "Ce numéro a déjà un compte. Connectez-vous avec votre mot de passe.",
    };
  }

  const email = phoneToAuthEmail(phone);
  const admin = createAdminClient();

  if (!admin) {
    return {
      error:
        "Activation temporairement indisponible. Contactez l'administrateur du club.",
    };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: check.display_name ?? "Utilisateur",
      phone,
    },
  });

  if (createError || !created.user) {
    return {
      error: "Impossible d'activer le compte. Réessayez ou contactez le club.",
    };
  }

  const { error: activationError } = await admin.rpc("complete_phone_activation", {
    p_user_id: created.user.id,
    p_phone: phone,
  });

  if (activationError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Activation échouée. Contactez le club." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      success:
        "Compte activé. Vous pouvez maintenant vous connecter avec votre numéro.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
