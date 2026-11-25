/**
 * XMLHttpRequest wrapped in a Promise.
 *
 * Every network call in WeatherVerse (city search and weather) goes through this one helper,
 * so callers can use then/catch or async/await while the request itself is a real XHR.
 * No fetch() is used anywhere for API communication.
 */

export class XhrError extends Error {
  constructor(kind, message, status = 0, body = null) {
    super(message)
    this.name = kind === 'abort' ? 'AbortError' : 'XhrError'
    this.kind = kind
    this.status = status
    this.body = body
  }
}

export function xhrGet(url, { signal, timeout = 10_000 } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new XhrError('abort', 'The request was cancelled.'))
      return
    }

    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'text'
    xhr.timeout = timeout

    // A newer search or city selection cancels this request through the signal.
    const cancel = () => xhr.abort()
    signal?.addEventListener('abort', cancel, { once: true })
    const done = () => signal?.removeEventListener('abort', cancel)

    xhr.onload = () => {
      done()
      // onload only means the exchange completed. The status code says whether it worked.
      let parsed = null
      let parsedOk = true
      try {
        parsed = JSON.parse(xhr.responseText)
      } catch {
        parsedOk = false
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        if (parsedOk) resolve(parsed)
        else reject(new XhrError('parse', 'The server returned invalid JSON.', xhr.status))
      } else {
        reject(new XhrError('http', `HTTP request failed: ${xhr.status}`, xhr.status, parsedOk ? parsed : null))
      }
    }
    xhr.onerror = () => {
      done()
      reject(new XhrError('network', 'Network error. Check your connection.'))
    }
    xhr.ontimeout = () => {
      done()
      reject(new XhrError('timeout', 'The request timed out.'))
    }
    xhr.onabort = () => {
      done()
      reject(new XhrError('abort', 'The request was cancelled.'))
    }

    xhr.send()
  })
}
