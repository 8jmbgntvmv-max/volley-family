const supportedChatHosts = new Map([
  ['chat.whatsapp.com', 'WhatsApp'],
  ['t.me', 'Telegram'],
  ['telegram.me', 'Telegram'],
  ['signal.group', 'Signal'],
])

export function familyChatService(value = '') {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    const host = url.hostname.toLocaleLowerCase('it').replace(/^www\./, '')
    return supportedChatHosts.get(host) ?? null
  } catch {
    return null
  }
}
