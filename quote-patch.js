// Taiwan quote hotfix: prefer TWSE MIS latest trade, fall back to official end-of-day OpenAPI.
(function(){
  const oldRefresh=window.refreshQuotes;
  const fmtTime=iso=>{if(!iso)return '尚未更新';const d=new Date(iso);return new Intl.DateTimeFormat('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)};
  function showLastUpdated(){
    const btn=document.querySelector('.refresh'); if(!btn)return;
    let el=document.querySelector('.last-updated');
    if(!el){el=document.createElement('small');el.className='last-updated';el.style.cssText='display:block;font-size:11px;color:#7b8491;text-align:right;margin-right:8px;white-space:nowrap';btn.parentNode.insertBefore(el,btn)}
    el.textContent='最後更新 '+fmtTime(state.settings.lastQuoteRefreshAt);
  }
  new MutationObserver(showLastUpdated).observe(document.getElementById('app'),{childList:true,subtree:true});
  showLastUpdated();

  async function fetchMis(symbols){
    if(!symbols.length)return {};
    const exCh=symbols.map(s=>'tse_'+s+'.tw').join('|');
    const url='https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch='+encodeURIComponent(exCh)+'&json=1&delay=0&_='+Date.now();
    const r=await fetch(url,{cache:'no-store',credentials:'omit'}); if(!r.ok)throw new Error('MIS '+r.status);
    const j=await r.json(),out={};
    for(const row of (j.msgArray||[])){
      const s=String(row.c||'').trim();
      // z = latest trade. After close it remains the day's last trade. If z is '-', use best available close/reference fallback only when positive.
      const candidates=[row.z,row.y]; let p=0;
      for(const raw of candidates){const n=Number(String(raw||'').replace(/,/g,''));if(Number.isFinite(n)&&n>0){p=n;break}}
      if(s&&p>0)out[s]={price:p,time:row.t||'',date:row.d||'',source:'TWSE MIS 最新成交'};
    }
    return out;
  }
  async function fetchEod(){
    try{const r=await fetch('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',{cache:'no-store'});if(!r.ok)return{};const data=await r.json(),out={};for(const row of data||[]){const s=String(row.Code||'').trim(),p=Number(String(row.ClosingPrice||'').replace(/,/g,''));if(s&&p>0)out[s]={price:p,source:'TWSE 正式收盤'}}return out}catch(e){return{}}
  }
  window.refreshQuotes=async function(){
    const btn=document.querySelector('.refresh');if(btn){btn.disabled=true;btn.textContent='…'}
    const all=stocks(),twStocks=all.filter(x=>x.market==='TW'),usStocks=all.filter(x=>x.market==='US');
    let twOk=0,usOk=0,fail=0;const now=new Date().toISOString();
    let tw={};try{tw=await fetchMis(twStocks.map(x=>x.symbol))}catch(e){}
    if(Object.keys(tw).length<twStocks.length){const eod=await fetchEod();for(const h of twStocks)if(!tw[h.symbol]&&eod[h.symbol])tw[h.symbol]=eod[h.symbol]}
    for(const h of twStocks){const q=tw[h.symbol];if(q?.price>0){state.marketQuotes['TW|'+h.symbol]={price:q.price,updated:now,source:q.source};twOk++}else fail++}
    if(state.settings.twelveKey){for(let i=0;i<usStocks.length;i++){const h=usStocks[i];try{const r=await fetch('https://api.twelvedata.com/price?symbol='+encodeURIComponent(h.symbol)+'&apikey='+encodeURIComponent(state.settings.twelveKey),{cache:'no-store'}),j=await r.json(),p=Number(j.price);if(p>0){state.marketQuotes['US|'+h.symbol]={price:p,updated:new Date().toISOString(),source:'Twelve Data'};usOk++}else fail++}catch(e){fail++}if((i+1)%8===0&&i+1<usStocks.length)await new Promise(r=>setTimeout(r,61000))}}else fail+=usStocks.length;
    if(twOk+usOk>0)state.settings.lastQuoteRefreshAt=new Date().toISOString();
    save();render();showLastUpdated();
    alert(twOk+usOk?`更新完成：台股 ${twOk} 檔、美股 ${usOk} 檔。已用最新市價依原購買成本重算損益${fail?`；${fail} 檔沿用最後可信價格`:''}。`:'沒有取得新行情，已保留最後可信價格。');
  };
})();