export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
    githubAuthUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    githubAuthUrl.searchParams.set("scope", "repo,user");
    githubAuthUrl.searchParams.set("redirect_uri", `https://jamstack-test-apk.pages.dev/api/auth`);
    return Response.redirect(githubAuthUrl.toString(), 302);
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await response.json();

  if (data.error) {
    return new Response(`Auth error: ${data.error_description}`, { status: 400 });
  }

  const script = `
    <script>
      window.opener.postMessage(
        'authorization:github:success:${JSON.stringify({ token: data.access_token, provider: "github" })}',
        '*'
      );
    </script>
  `;

  return new Response(script, {
    headers: { "Content-Type": "text/html" },
  });
}
