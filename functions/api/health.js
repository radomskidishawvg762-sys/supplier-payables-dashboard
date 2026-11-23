export function onRequestGet({env}){
 const available=Boolean(env?.AI_ENABLED==='1'&&env?.AI_API_KEY&&env?.AI_MODEL);
 return new Response(JSON.stringify({available,kind:'server-side-ai',data:'sample-only'}),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}
