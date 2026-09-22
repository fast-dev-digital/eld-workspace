import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Cliente autenticado como o usuário chamador, só para validar quem é e seu papel
    const callerClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { name, email, role, department, phone, organizationId } = body as {
      name: string;
      email: string;
      role: string;
      department?: string;
      phone?: string;
      organizationId: string;
    };

    if (!name?.trim() || !email?.trim() || !role || !organizationId) {
      return new Response(JSON.stringify({ error: "Preencha nome, e-mail, cargo e organização." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente com privilégios de admin para operações de auth e escrita
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: membership } = await adminClient
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", caller.id)
      .maybeSingle();

    if (!membership || membership.role !== "admin") {
      return new Response(JSON.stringify({ error: "Apenas administradores podem convidar colaboradores." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let newUserId: string;

    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email.trim(), {
      data: { full_name: name.trim() },
    });

    if (inviteError || !invited?.user) {
      const alreadyExists = /already.*registered|already.*exists/i.test(inviteError?.message || "");

      if (!alreadyExists) {
        return new Response(JSON.stringify({ error: inviteError?.message || "Não foi possível convidar o colaborador." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Usuário já existe no sistema (ex.: convite anterior). Reaproveita a conta em vez de falhar.
      const { data: existingList, error: listError } = await adminClient.auth.admin.listUsers();
      const existingUser = existingList?.users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());

      if (listError || !existingUser) {
        return new Response(JSON.stringify({ error: "Este e-mail já está cadastrado, mas não foi possível localizá-lo." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingMembership } = await adminClient
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingMembership) {
        return new Response(JSON.stringify({ error: "Este colaborador já faz parte da equipe." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      newUserId = existingUser.id;
    } else {
      newUserId = invited.user.id;
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ full_name: name.trim(), phone: phone || null, department: department || null })
      .eq("id", newUserId);

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: memberError } = await adminClient
      .from("organization_members")
      .insert({ organization_id: organizationId, user_id: newUserId, role });

    if (memberError) {
      return new Response(JSON.stringify({ error: memberError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, userId: newUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro inesperado." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
