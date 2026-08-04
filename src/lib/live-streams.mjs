export function youtubeLiveUrl(channelUrl) {
  if (!channelUrl) return null
  try {
    const url = new URL(channelUrl)
    if (!/^(www\.)?youtube\.com$/i.test(url.hostname)) return null
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/live`
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}
