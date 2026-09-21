// Meta Instagram Graph API Client for Live Reels Publishing
// Implements official Meta Graph API v21.0 container protocol

export class InstagramApiClient {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v21.0';
  }

  // 1. Auto-Discover Instagram Accounts connected to the user's Facebook Pages
  // Given a User Access Token or System User Token, finds the Instagram Business Account ID automatically!
  async autoDiscoverAccounts(token) {
    if (!token) throw new Error("Please enter a Meta Access Token to discover accounts");

    const url = `${this.baseUrl}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      this.handleMetaError(data.error);
    }

    const discovered = [];
    if (data.data && Array.isArray(data.data)) {
      for (const page of data.data) {
        if (page.instagram_business_account) {
          discovered.push({
            facebookPageName: page.name,
            facebookPageId: page.id,
            pageAccessToken: page.access_token, // Page-scoped token
            instagramAccountId: page.instagram_business_account.id,
            instagramUsername: page.instagram_business_account.username,
            instagramName: page.instagram_business_account.name,
            profilePicture: page.instagram_business_account.profile_picture_url || '',
            followersCount: page.instagram_business_account.followers_count || 0
          });
        }
      }
    }

    return {
      ok: true,
      accounts: discovered,
      totalFound: discovered.length
    };
  }

  // 2. Verify credentials and get live profile info
  async testConnection(accessToken, igUserId) {
    if (!accessToken || !igUserId) {
      throw new Error("Missing Access Token or Instagram Account ID");
    }

    const url = `${this.baseUrl}/${igUserId}?fields=id,name,username,profile_picture_url,followers_count,media_count&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      this.handleMetaError(data.error);
    }

    return {
      ok: true,
      id: data.id,
      username: data.username,
      name: data.name,
      followersCount: data.followers_count,
      mediaCount: data.media_count,
      profilePicture: data.profile_picture_url || ''
    };
  }

  // 3. Step 1: Create Media Container for Reel
  async createReelsContainer(accessToken, igUserId, videoPublicUrl, caption, shareToFeed = true) {
    if (!videoPublicUrl.startsWith('https://')) {
      throw new Error(`Meta requires a public HTTPS video URL. Received: ${videoPublicUrl}`);
    }

    const url = `${this.baseUrl}/${igUserId}/media`;
    const params = new URLSearchParams({
      media_type: 'REELS',
      video_url: videoPublicUrl,
      caption: caption,
      share_to_feed: shareToFeed ? 'true' : 'false',
      access_token: accessToken
    });

    const res = await fetch(url, {
      method: 'POST',
      body: params
    });

    const data = await res.json();
    if (data.error) {
      this.handleMetaError(data.error);
    }

    return {
      ok: true,
      containerId: data.id
    };
  }

  // 4. Step 2: Poll status of container until Meta finishes transcoding
  async pollContainerStatus(accessToken, containerId, onStatusUpdate = () => {}) {
    const maxWaitMs = 180000; // 3 minutes
    const pollIntervalMs = 4000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const url = `${this.baseUrl}/${containerId}?fields=status_code,status&access_token=${accessToken}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        this.handleMetaError(data.error);
      }

      const statusCode = data.status_code || data.status;
      onStatusUpdate(statusCode);

      if (statusCode === 'FINISHED') {
        return { ok: true, status: 'FINISHED' };
      }

      if (statusCode === 'ERROR') {
        throw new Error(`Meta video processing failed. Check video bitrate, aspect ratio, or duration.`);
      }

      if (statusCode === 'EXPIRED') {
        throw new Error(`Meta video container expired before publishing.`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Meta video transcoding timed out after 3 minutes. Please try again.");
  }

  // 5. Step 3: Publish the container live to Instagram
  async publishReel(accessToken, igUserId, containerId) {
    const url = `${this.baseUrl}/${igUserId}/media_publish`;
    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken
    });

    const res = await fetch(url, {
      method: 'POST',
      body: params
    });

    const data = await res.json();
    if (data.error) {
      this.handleMetaError(data.error);
    }

    // Try to fetch the live Instagram permalink
    let permalink = `https://www.instagram.com/reels/`;
    try {
      const detailUrl = `${this.baseUrl}/${data.id}?fields=permalink&access_token=${accessToken}`;
      const detailRes = await fetch(detailUrl);
      const detailData = await detailRes.json();
      if (detailData.permalink) {
        permalink = detailData.permalink;
      }
    } catch (e) {}

    return {
      ok: true,
      mediaId: data.id,
      permalink
    };
  }

  // Complete end-to-end publishing pipeline
  async executeFullPublish({
    accessToken,
    igUserId,
    videoPublicUrl,
    caption,
    shareToFeed = true,
    onProgress = () => {}
  }) {
    onProgress({ step: 1, message: 'Creating media container on Meta...' });
    const { containerId } = await this.createReelsContainer(accessToken, igUserId, videoPublicUrl, caption, shareToFeed);

    onProgress({ step: 2, message: `Container created (ID: ${containerId}). Meta is transcoding the video...` });
    await this.pollContainerStatus(accessToken, containerId, (status) => {
      onProgress({ step: 2, message: `Meta video encoding status: ${status}...` });
    });

    onProgress({ step: 3, message: 'Publishing Reel to Instagram profile...' });
    const publishResult = await this.publishReel(accessToken, igUserId, containerId);

    onProgress({ step: 4, message: 'Published successfully!', result: publishResult });
    return publishResult;
  }

  // Helpful error translator for Meta API codes
  handleMetaError(error) {
    const code = error.code;
    const subcode = error.error_subcode;
    const msg = error.message || 'Unknown Meta Error';

    if (code === 190) {
      throw new Error(`Meta Access Token Expired or Invalid (Code 190). Please generate a fresh token from developers.facebook.com.`);
    }
    if (code === 10 || code === 200) {
      throw new Error(`Permission Denied (Code ${code}). Your Meta App needs 'instagram_content_publish' and 'instagram_basic' permissions.`);
    }
    if (code === 100) {
      if (msg.includes('video_url')) {
        throw new Error(`Invalid Video URL (Code 100). Meta could not download the video from the public URL.`);
      }
      if (msg.includes('share_to_feed')) {
        throw new Error(`Parameter error: ${msg}`);
      }
    }
    if (code === 36003) {
      throw new Error(`Instagram Account is not a Business or Creator account. Please switch your account to Professional in Instagram App settings.`);
    }

    throw new Error(`Meta API Error (${code}${subcode ? `/${subcode}` : ''}): ${msg}`);
  }
}

export const instagramApi = new InstagramApiClient();
