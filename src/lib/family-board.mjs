const sessionKey = 'vf-family-board-session-v1'

const cleanBaseUrl = (value = '') => value.trim().replace(/\/+$/, '')

export function isFamilyBoardConfigured(config = {}) {
  return Boolean(cleanBaseUrl(config.url) && String(config.anonKey ?? '').trim())
}

export function validateFamilyBoardPost(value = '') {
  const content = value.trim()
  if (!content) return { valid: false, error: 'Scrivi un messaggio.' }
  if (content.length > 500) return { valid: false, error: 'Il messaggio può contenere al massimo 500 caratteri.' }
  return { valid: true, content }
}

export function createFamilyBoardClient(config = {}, storage = localStorage) {
  const url = cleanBaseUrl(config.url)
  const anonKey = String(config.anonKey ?? '').trim()

  const saveSession = (session) => storage.setItem(sessionKey, JSON.stringify({
    ...session,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + Number(session.expires_in ?? 3600),
  }))
  const readSession = () => {
    try { return JSON.parse(storage.getItem(sessionKey) ?? 'null') }
    catch { return null }
  }

  const authRequest = async (path, body) => {
    const response = await fetch(`${url}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error('Non riesco a collegare questo telefono alla bacheca.')
    const session = await response.json()
    saveSession(session)
    return session
  }

  const session = async () => {
    if (!isFamilyBoardConfigured(config)) throw new Error('La bacheca condivisa non è ancora collegata.')
    const current = readSession()
    const expiresAt = Number(current?.expires_at ?? 0)
    if (current?.access_token && expiresAt > Math.floor(Date.now() / 1000) + 90) return current
    if (current?.refresh_token) {
      try { return await authRequest('token?grant_type=refresh_token', { refresh_token: current.refresh_token }) }
      catch { storage.removeItem(sessionKey) }
    }
    return authRequest('signup', {})
  }

  const rpc = async (name, body = {}) => {
    const current = await session()
    const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${current.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const message = String(payload?.message ?? '')
      if (message.includes('VF_NOT_MEMBER')) throw new Error('VF_NOT_MEMBER')
      if (message.includes('VF_INVALID_INVITE')) throw new Error('Codice famiglia non riconosciuto.')
      throw new Error('La bacheca non è raggiungibile in questo momento.')
    }
    return payload
  }

  return {
    configured: isFamilyBoardConfigured(config),
    clearSession: () => storage.removeItem(sessionKey),
    join: (familyCode, displayName) => rpc('vf_join_family', { p_invite_code: familyCode.trim(), p_display_name: displayName.trim() }),
    list: () => rpc('vf_list_family_messages'),
    post: ({ content, kind, matchId }) => rpc('vf_post_family_message', { p_content: content, p_kind: kind, p_match_id: matchId || null }),
    remove: (id) => rpc('vf_delete_family_message', { p_message_id: id }),
  }
}
