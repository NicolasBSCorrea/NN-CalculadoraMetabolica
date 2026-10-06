// Função serverless da Vercel: guarda dados no Upstash Redis (Vercel Marketplace)
// Aceita qualquer prefixo (KV_, UPSTASH_REDIS_, STORAGE_KV_ ...) nas variáveis do Upstash
const pick=(exact,re)=>{for(const n of exact)if(process.env[n])return process.env[n];const k=Object.keys(process.env).find(n=>re.test(n));return k?process.env[k]:undefined};
const U=pick(['KV_REST_API_URL','UPSTASH_REDIS_REST_URL'],/REST_API_URL$|REST_URL$/);
const T=pick(['KV_REST_API_TOKEN','UPSTASH_REDIS_REST_TOKEN'],/REST_API_TOKEN$|REST_TOKEN$/);
const KEYS=['custom','diets'];
async function redis(cmd){
  const x=await fetch(U,{method:'POST',headers:{Authorization:'Bearer '+T},body:JSON.stringify(cmd)});
  const j=await x.json();if(j.error)throw new Error(j.error);return j.result;
}
module.exports=async(req,res)=>{
  const pw=process.env.APP_PASSWORD;
  if(pw&&req.headers['x-pass']!==pw)return res.status(401).json({error:'senha'});
  const key=req.query.key;
  if(!KEYS.includes(key))return res.status(400).json({error:'chave inválida'});
  if(!U||!T)return res.status(500).json({error:'banco de dados não configurado (URL: '+(U?'ok':'faltando')+', token: '+(T?'ok':'faltando')+')'});
  try{
    if(req.method==='GET'){const v=await redis(['GET','nn:'+key]);return res.json({value:v?JSON.parse(v):null})}
    if(req.method==='PUT'){await redis(['SET','nn:'+key,JSON.stringify(req.body)]);return res.json({ok:true})}
    res.status(405).end();
  }catch(e){res.status(500).json({error:e.message})}
};
