// One-time manual quote update. Does not modify holdings, quantities, costs, or broker snapshots.
(function(){
  const K='investfolio_v1';
  const s=JSON.parse(localStorage.getItem(K)||'{}');
  s.marketQuotes=s.marketQuotes||{}; s.settings=s.settings||{}; s.migrations=s.migrations||{};
  if(s.migrations.manualTwClose20260824)return;
  const prices={'0050':103.80,'00919':30.65,'1101':24.70,'2317':243.50,'2330':2375,'2454':3765,'3711':592,'6207':100.0,'6757':56.0};
  const updated='2026-08-24T14:30:00+08:00';
  for(const [symbol,price] of Object.entries(prices))s.marketQuotes['TW|'+symbol]={price,updated,source:'2026/08/24 收盤價（手動核對）'};
  s.settings.lastQuoteUpdate=updated;
  s.migrations.manualTwClose20260824=true;
  localStorage.setItem(K,JSON.stringify(s));
  location.reload();
})();