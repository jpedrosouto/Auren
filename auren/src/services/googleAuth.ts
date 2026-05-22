// AUREN — Google OAuth2 Auth Service

class GoogleSheetsAuth {
  clientId: string | null = null;
  readonly apiKey = 'AIzaSyBDEpT6wX2t5J1gK8Hb5Fs_uiibCFO1sE8';
  readonly scopes = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
  readonly discoveryDoc = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
  isInitialized = false;
  tokenClient: any = null;
  accessToken: string | null = null;
  userInfo: any = null;

  constructor() {
    this.setupClientId();
  }

  setupClientId() {
    const stored = localStorage.getItem('auren_client_id');
    this.clientId = stored || null;
  }

  hasClientId() { return !!this.clientId; }

  setClientId(id: string) {
    this.clientId = id.trim();
    localStorage.setItem('auren_client_id', this.clientId);
  }

  async waitForGoogleAPIs(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        attempts++;
        if ((window as any).gapi && (window as any).google?.accounts) {
          resolve();
        } else if (attempts >= 100) {
          reject(new Error('APIs do Google não carregaram. Verifique sua conexão.'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  async init(): Promise<boolean> {
    if (!this.hasClientId()) return false;
    await this.waitForGoogleAPIs();

    await new Promise<void>((resolve, reject) => {
      (window as any).gapi.load('client', async () => {
        try {
          await (window as any).gapi.client.init({
            apiKey: this.apiKey,
            discoveryDocs: [this.discoveryDoc],
          });
          resolve();
        } catch (e) { reject(e); }
      });
    });

    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: this.scopes,
      callback: this.onTokenResponse.bind(this),
      error_callback: this.onTokenError.bind(this),
    });

    this.isInitialized = true;
    this.loadStoredToken();
    return true;
  }

  onTokenResponse(response: any) {
    if (response.access_token) {
      this.accessToken = response.access_token;
      this.storeToken(response.access_token);
      this.fetchUserInfo();
      window.dispatchEvent(new CustomEvent('authSuccess', { detail: { accessToken: response.access_token } }));
    } else {
      this.onTokenError({ error: 'no_access_token' });
    }
  }

  onTokenError(error: any) {
    let msg = 'Erro na autenticação.';
    if (error.error === 'popup_blocked') {
      msg = 'Popup bloqueado pelo navegador. Permita popups para este site e tente novamente.';
    } else if (error.error === 'access_denied') {
      msg = 'Acesso negado. Tente novamente.';
    }
    window.dispatchEvent(new CustomEvent('authError', { detail: { error: msg } }));
  }

  async fetchUserInfo() {
    if (!this.accessToken) return;
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      if (res.ok) {
        this.userInfo = await res.json();
        window.dispatchEvent(new CustomEvent('userInfoLoaded', { detail: { userInfo: this.userInfo } }));
      }
    } catch (_) {}
  }

  storeToken(token: string) {
    localStorage.setItem('auren_token', JSON.stringify({
      access_token: token,
      timestamp: Date.now(),
      expires_in: 3600,
    }));
  }

  loadStoredToken() {
    try {
      const raw = localStorage.getItem('auren_token');
      if (!raw) return false;
      const data = JSON.parse(raw);
      const age = Date.now() - data.timestamp;
      if (age < data.expires_in * 1000) {
        this.accessToken = data.access_token;
        this.fetchUserInfo();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('authSuccess', { detail: { accessToken: data.access_token } }));
        }, 400);
        return true;
      }
      localStorage.removeItem('auren_token');
    } catch (_) {}
    return false;
  }

  async signIn() {
    if (!this.isInitialized) await this.init();
    if (!this.tokenClient) throw new Error('OAuth não inicializado');
    this.tokenClient.requestAccessToken();
  }

  signOut() {
    this.accessToken = null;
    this.userInfo = null;
    localStorage.removeItem('auren_token');
    window.dispatchEvent(new CustomEvent('authLogout'));
  }

  isAuthenticated() { return !!this.accessToken; }
  getAccessToken() { return this.accessToken; }
  getUserInfo() { return this.userInfo; }

  getTimeUntilExpiry() {
    try {
      const raw = localStorage.getItem('auren_token');
      if (!raw) return 0;
      const data = JSON.parse(raw);
      const expiresAt = data.timestamp + data.expires_in * 1000;
      return Math.max(0, Math.floor((expiresAt - Date.now()) / 60000));
    } catch (_) { return 0; }
  }
}

const googleAuth = new GoogleSheetsAuth();
export default googleAuth;
