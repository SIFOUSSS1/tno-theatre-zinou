export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return Response.json({
        ok: true,
        service: "TNO_CLOUDFLARE",
        time: new Date().toISOString()
      });
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      const b = await request.json();

      if (
        b.email === "newthatertno@gmail.com" &&
        b.password === "Zinoutno2018"
      ) {
        return Response.json(
          {
            ok: true,
            email: "newthatertno@gmail.com",
            role: "رئيس الفرقة"
          },
          {
            headers: {
              "Set-Cookie":
                "tno_admin=logged; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800"
            }
          }
        );
      }

      return Response.json(
        {
          ok: false,
          message: "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        },
        { status: 401 }
      );
    }

    if (url.pathname === "/api/me" && request.method === "GET") {
      const cookie = request.headers.get("Cookie") || "";

      if (cookie.includes("tno_admin=logged")) {
        return Response.json({
          authenticated: true,
          email: "newthatertno@gmail.com",
          role: "رئيس الفرقة"
        });
      }

      return Response.json({ authenticated: false });
    }

    if (url.pathname === "/api/logout" && request.method === "POST") {
      return Response.json(
        { ok: true },
        {
          headers: {
            "Set-Cookie":
              "tno_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
          }
        }
      );
    }

    return env.ASSETS.fetch(request);
  }
};
