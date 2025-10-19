let accessToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.OSU_CLIENT_ID;
  const clientSecret = process.env.OSU_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("osu! API credentials not configured");
  }

  const response = await fetch("https://osu.ppy.sh/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "public",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get osu! API access token");
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // Refresh 1 min early

  return accessToken!;
}

export async function getBeatmapData(beatmapId: number) {
  const token = await getAccessToken();

  const response = await fetch(
    `https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch beatmap ${beatmapId}`);
  }

  return response.json();
}
