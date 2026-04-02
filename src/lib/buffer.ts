export interface BufferChannelMatch {
  id: string;
  service: string;
  isLocked?: boolean;
}

export const platformToService: Record<string, string[]> = {
  Instagram: ["instagram"],
  YouTube: ["youtube"],
  X: ["twitter"],
  LinkedIn: ["linkedin"],
  Facebook: ["facebook"],
  "Google Business": ["googlebusiness", "google"],
  Pinterest: ["pinterest"],
  TikTok: ["tiktok"],
  Threads: ["threads"],
  Bluesky: ["bluesky"],
  Mastodon: ["mastodon"],
};

export function buildPublishText(content: string, hashtags?: string[]) {
  const normalizedHashtags = (hashtags || []).map((tag) => tag.trim()).filter(Boolean);
  return normalizedHashtags.length ? `${content.trim()}\n\n${normalizedHashtags.join(" ")}` : content.trim();
}

export function getEligibleBufferChannels(
  channels: BufferChannelMatch[],
  selectedChannelIds: string[] = [],
) {
  const activeChannels = channels.filter((channel) => !channel.isLocked);
  if (selectedChannelIds.length === 0) {
    return activeChannels;
  }

  const selectedSet = new Set(selectedChannelIds);
  return activeChannels.filter((channel) => selectedSet.has(channel.id));
}

export function getMatchingBufferChannelIds(
  platform: string,
  channels: BufferChannelMatch[],
  selectedChannelIds: string[] = [],
) {
  const services = platformToService[platform] || [];
  if (services.length === 0) return [];

  return getEligibleBufferChannels(channels, selectedChannelIds)
    .filter((channel) => services.includes(channel.service?.toLowerCase()))
    .map((channel) => channel.id);
}

export function getFirstMatchingBufferChannelId(
  platform: string,
  channels: BufferChannelMatch[],
  selectedChannelIds: string[] = [],
) {
  return getMatchingBufferChannelIds(platform, channels, selectedChannelIds)[0];
}
