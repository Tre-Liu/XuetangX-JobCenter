export const json = (data,status=200,headers={}) => Response.json(data,{status,headers:{'cache-control':'no-store',...headers}})

export async function readGraphJson(request, maxRequestBytes) {
  if (Number(request.headers.get('content-length'))>maxRequestBytes) return {response:json({error:'payload-too-large'},413)}
  const reader = request.body?.getReader()
  if (!reader) return {response:json({error:'missing-body'},400)}
  const decoder = new TextDecoder()
  let bytes = 0
  let raw = ''
  try {
    for (;;) {
      const {done,value} = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes>maxRequestBytes) {
        await reader.cancel()
        return {response:json({error:'payload-too-large'},413)}
      }
      raw += decoder.decode(value,{stream:true})
    }
    return {data: JSON.parse(raw+decoder.decode())}
  } catch {
    return {response:json({error:'invalid-input'},400)}
  } finally {
    reader.releaseLock()
  }
}

function responseText(payload) {
  if (payload?.status==='incomplete' || payload?.status==='failed') return null
  const parts = (Array.isArray(payload?.output)?payload.output:[]).filter(item=>item?.type==='message').flatMap(item=>item.content || [])
  if (parts.some(p=>p?.type==='refusal')) return null
  return parts.filter(p=>p?.type==='output_text').map(p=>p.text).join('') || null
}

export async function generateGraphResponse({request, env, fetchImpl, data, model, instructions, format, prepare}) {
  if (!env.OPENAI_API_KEY) return json({error:'model-disabled'},503)
  if (request.signal.aborted) return json({error:'request-cancelled'},499)
  const controller = new AbortController()
  const abort = () => controller.abort()
  request.signal.addEventListener('abort',abort,{once:true})
  const timer = setTimeout(abort,90000)
  try {
    const response = await fetchImpl(env.AI_SUMMARY_API_URL || 'https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{'content-type':'application/json',authorization:'Bearer '+env.OPENAI_API_KEY},
      body:JSON.stringify({
        model,
        store:false,
        reasoning:{effort:'low'},
        max_output_tokens:12000,
        instructions,
        input:JSON.stringify(data),
        text:{verbosity:'low',format},
      }),
      signal:controller.signal,
    })
    if (!response.ok) return json({error:'model-request-failed'},502)
    const content = responseText(await response.json())
    if (!content) return json({error:'missing-model-output'},502)
    let output
    try { output = JSON.parse(content) } catch { return json({error:'invalid-model-output'},502) }
    const result = prepare(output)
    return result ? json(result) : json({error:'invalid-model-output'},502)
  } catch {
    if (request.signal.aborted) return json({error:'request-cancelled'},499)
    if (controller.signal.aborted) return json({error:'model-timeout'},504)
    return json({error:'model-unavailable'},502)
  } finally {
    clearTimeout(timer)
    request.signal.removeEventListener('abort',abort)
  }
}
