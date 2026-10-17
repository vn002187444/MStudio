import { getSystemSetting, setSystemSetting } from "@mstudio/db";
import type { D1Database } from "@cloudflare/workers-types";
import type { GscHealthStatus, GscOverviewResponse } from "@mstudio/contracts";

function b64u(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem: string) {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");

  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

export async function generateGoogleJwt(clientEmail: string, privateKeyPem: string, scopes: string[]) {
  const header = { alg: "RS256", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const claimSet = {
    iss: clientEmail,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp,
    iat,
  };

  const encodedHeader = b64u(JSON.stringify(header));
  const encodedClaimSet = b64u(JSON.stringify(claimSet));
  const toSign = `${encodedHeader}.${encodedClaimSet}`;

  const key = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(toSign)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${toSign}.${encodedSignature}`;
}

export async function getGoogleAccessToken(jwt: string) {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  if (!tokenRes.ok) {
    throw new Error(`Failed to get Google OAuth token: ${await tokenRes.text()}`);
  }
  return (await tokenRes.json() as { access_token: string }).access_token;
}

export async function checkGscHealth(db: D1Database): Promise<GscHealthStatus> {
  let status: GscHealthStatus = {
    status: "missing",
    lastCheckedAt: new Date().toISOString(),
    indexingQuotaUsedToday: 0,
    indexingQuotaLimit: 200,
    analyticsStatus: "error",
    errorMessage: "No service account configured"
  };

  try {
    const keySetting = await getSystemSetting(db, "gsc_service_account");
    if (!keySetting || !keySetting.value) {
      await setSystemSetting(db, "gsc_service_account_status", JSON.stringify(status));
      return status;
    }

    const creds = JSON.parse(keySetting.value);
    status.clientEmail = creds.client_email;
    status.projectId = creds.project_id;
    status.errorMessage = undefined;

    // Test token generation (Webmasters scope)
    const jwt = await generateGoogleJwt(creds.client_email, creds.private_key, ["https://www.googleapis.com/auth/webmasters.readonly"]);
    await getGoogleAccessToken(jwt);
    
    // Check quota
    const today = new Date().toISOString().slice(0, 10);
    const quotaKey = `gsc_indexing_quota_${today}`;
    const quotaSetting = await getSystemSetting(db, quotaKey);
    const quotaUsed = quotaSetting ? parseInt(quotaSetting.value, 10) : 0;
    
    status.indexingQuotaUsedToday = quotaUsed;
    status.status = "connected";
    status.analyticsStatus = "active";
    
  } catch (error: any) {
    status.status = "error";
    status.errorMessage = error.message;
  }

  await setSystemSetting(db, "gsc_service_account_status", JSON.stringify(status));
  return status;
}

export async function getGscOverviewWithCache(db: D1Database, force: boolean): Promise<GscOverviewResponse> {
  const fallbackResponse: GscOverviewResponse = {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
    topQueries: [],
    fallback: true
  };

  // Check cache
  if (!force) {
    const cacheSetting = await getSystemSetting(db, "gsc_overview_cache");
    if (cacheSetting && cacheSetting.value) {
      try {
        const cached = JSON.parse(cacheSetting.value);
        if (cached.cachedAt && (Date.now() - new Date(cached.cachedAt).getTime() < 2 * 60 * 60 * 1000)) {
          return { ...cached, isCached: true };
        }
      } catch (e) {
        // invalid cache, proceed
      }
    }
  }

  const keySetting = await getSystemSetting(db, "gsc_service_account");
  if (!keySetting || !keySetting.value) {
    return fallbackResponse;
  }

  try {
    const creds = JSON.parse(keySetting.value);
    const jwt = await generateGoogleJwt(creds.client_email, creds.private_key, ["https://www.googleapis.com/auth/webmasters.readonly"]);
    const token = await getGoogleAccessToken(jwt);

    const siteUrl = "https://minds.io.vn";
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const gscRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 5
      })
    });
    
    if (!gscRes.ok) {
      console.warn("Failed to fetch GSC data", await gscRes.text());
      if (gscRes.status === 429) {
        // Circuit breaker: Return old cache
        const cacheSetting = await getSystemSetting(db, "gsc_overview_cache");
        if (cacheSetting && cacheSetting.value) {
           const cached = JSON.parse(cacheSetting.value);
           return { ...cached, isCached: true, quotaLocked: true };
        }
      }
      return fallbackResponse;
    }
    
    const gscData = await gscRes.json() as any;
    
    let clicks = 0;
    let impressions = 0;
    let positionSum = 0;
    let positionCount = 0;
    const topQueries = [];
    
    for (const row of gscData.rows || []) {
      clicks += row.clicks;
      impressions += row.impressions;
      positionSum += row.position * row.impressions;
      positionCount += row.impressions;
      topQueries.push({
        keys: row.keys,
        clicks: row.clicks,
        impressions: row.impressions
      });
    }

    const result: GscOverviewResponse = {
      clicks,
      impressions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      position: positionCount > 0 ? positionSum / positionCount : 0,
      topQueries,
      fallback: false,
      cachedAt: new Date().toISOString()
    };

    await setSystemSetting(db, "gsc_overview_cache", JSON.stringify(result));
    return result;

  } catch (error) {
    console.error("GSC error:", error);
    // Circuit breaker: Return old cache
    const cacheSetting = await getSystemSetting(db, "gsc_overview_cache");
    if (cacheSetting && cacheSetting.value) {
       const cached = JSON.parse(cacheSetting.value);
       return { ...cached, isCached: true, quotaLocked: true };
    }
    return fallbackResponse;
  }
}

export async function pingGoogleIndexingApi(db: D1Database, url: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const quotaKey = `gsc_indexing_quota_${today}`;
  
  const quotaSetting = await getSystemSetting(db, quotaKey);
  const quotaUsed = quotaSetting ? parseInt(quotaSetting.value, 10) : 0;
  
  if (quotaUsed >= 200) {
    console.warn(`Indexing API quota locked for ${today}. Skipping ${url}`);
    return false;
  }

  const keySetting = await getSystemSetting(db, "gsc_service_account");
  if (!keySetting || !keySetting.value) {
    console.warn("No GSC service account to ping indexing API");
    return false;
  }

  try {
    const creds = JSON.parse(keySetting.value);
    const jwt = await generateGoogleJwt(creds.client_email, creds.private_key, ["https://www.googleapis.com/auth/indexing"]);
    const token = await getGoogleAccessToken(jwt);
    
    const reqBody = {
      url: url,
      type: "URL_UPDATED"
    };

    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reqBody)
    });

    if (!res.ok) {
       console.error("Failed to ping Indexing API", await res.text());
       return false;
    }

    // Success, increment quota
    await setSystemSetting(db, quotaKey, (quotaUsed + 1).toString());
    return true;

  } catch (err) {
    console.error("Error pinging Indexing API:", err);
    return false;
  }
}
