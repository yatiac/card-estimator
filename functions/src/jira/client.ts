import {Issuer, Client, generators, TokenSet} from "openid-client";
import * as functions from "firebase-functions";

export class JiraClient {
  openIdHost = "https://auth.atlassian.com";
  issuer: Issuer | undefined;
  client: Client | undefined;
  config: { clientId: string; clientSecret: string; redirectUri: string };

  constructor() {
    const config = {
      clientId: process.env.JIRA_CLIENT_ID || "",
      clientSecret: process.env.JIRA_CLIENT_SECRET || "",
      redirectUri: process.env.JIRA_REDIRECT_URI || "",
    };

    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
      throw new Error("JIRA secrets not configured");
    }
    this.config = config;
  }

  async initializeClient() {
    this.issuer = await Issuer.discover(this.openIdHost);
    this.client = new this.issuer.Client({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uris: [this.config.redirectUri],
      response_types: ["code"],
      // id_token_signed_response_alg (default "RS256")
      // token_endpoint_auth_method (default "client_secret_basic")
    });
  }

  authorize(request: functions.Request, response: functions.Response): string {
    if (!this.client) {
      throw new Error("Please call initialize() first.");
    }

    const codeVerifier = generators.codeVerifier();

    const codeChallenge = generators.codeChallenge(codeVerifier);

    return this.client.authorizationUrl({
      scope: "read:jira-work write:issue:jira write:comment:jira write:issue.vote:jira offline_access",
      audience: "api.atlassian.com",
      state: codeChallenge,
      prompt: "consent",
      response_type: "code",
      redirect_uri: this.config.redirectUri,
    });
  }

  async getToken(req: functions.Request, res: functions.Response) {
    const params = this.client!.callbackParams(req);

    const tokenSet = await this.client!.oauthCallback(this.config.redirectUri, {
      code: params.code,
    });

    return tokenSet;
  }

  refreshToken(refreshToken: string): Promise<TokenSet> {
    return this.client!.refresh(refreshToken);
  }
}
