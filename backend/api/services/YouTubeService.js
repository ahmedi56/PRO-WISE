/**
 * YouTubeService.js
 * 
 * @description :: Service for handling YouTube video operations
 * Current: Extracts video IDs from URLs
 * Future: Can be extended for OAuth upload flow
 */

module.exports = {

  /**
   * Extract YouTube video ID from various URL formats
   * Handles: youtube.com/watch?v=ID, youtu.be/ID, embed URLs, etc.
   */
  extractVideoId: function(urlOrId) {
    if (!urlOrId) return '';
    
    // If it's already just an ID (11 chars), return as is
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
      return urlOrId;
    }

    // Extract from various URL formats
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = urlOrId.match(regex);
    return match ? match[1] : urlOrId;
  },

  /**
   * Validate YouTube URL format
   */
  isValidYouTubeUrl: function(url) {
    if (!url) return false;
    const youtubeRegex = /(youtube\.com|youtu\.be)\//i;
    return youtubeRegex.test(url);
  },

  /**
   * Get embed URL from video ID
   */
  getEmbedUrl: function(videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  },

  /**
   * Get watch URL from video ID
   */
  getWatchUrl: function(videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  },

  /**
   * Get thumbnail URL from video ID
   */
  getThumbnailUrl: function(videoId, size = 'default') {
    // Sizes: default, medium, high, standard, maxres
    const sizes = {
      default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
      medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
    return sizes[size] || sizes.high;
  },

  /**
   * Validate video ID format (11 characters, alphanumeric + _ -)
   */
  isValidVideoId: function(videoId) {
    if (!videoId) return false;
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  },

  /**
   * NOTE: Full YouTube upload functionality would require:
   * 1. YouTube Data API v3 credentials
   * 2. OAuth 2.0 setup for user authentication
   * 3. Resumable upload handling for large files
   * 4. Permission scopes: https://www.googleapis.com/auth/youtube.upload
   * 
   * Example implementation structure:
   * 
   * uploadVideoToYouTube: async function(filePath, metadata, oauthToken) {
   *   // 1. Get authenticated YouTube client
   *   const youtube = google.youtube({
   *     version: 'v3',
   *     auth: new google.auth.OAuth2(clientId, clientSecret, redirectUrl)
   *   });
   *   oauth2Client.setCredentials({ access_token: oauthToken });
   *   
   *   // 2. Upload video
   *   const res = await youtube.videos.insert({
   *     part: 'snippet,status',
   *     requestBody: {
   *       snippet: {
   *         title: metadata.title,
   *         description: metadata.description,
   *         tags: metadata.tags || [],
   *         categoryId: '28' // Science & Technology
   *       },
   *       status: {
   *         privacyStatus: 'private' // Or 'public', 'unlisted'
   *       }
   *     },
   *     media: {
   *       body: fs.createReadStream(filePath)
   *     }
   *   });
   *   
   *   // 3. Extract video ID and return
   *   return res.data.id;
   * }
   */

  /**
   * Helper: Generate metadata for video upload
   */
  generateUploadMetadata: function(title, description, tags = []) {
    return {
      title: title.substring(0, 100), // YouTube limit
      description: description.substring(0, 5000), // YouTube limit
      tags: tags.slice(0, 30), // Max 30 tags
      categoryId: '28' // Science & Technology category
    };
  }

};
