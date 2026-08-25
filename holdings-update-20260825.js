// 2026-08-25 國泰證券持股更新：南亞科 50 股，買價 483 元，成本 24,150 元。
(function(){
  const id='cathay-2408-20260825';
  if (!state.transactions.some(t=>t.id===id || (t.market==='TW' && t.symbol==='2408' && brokerLabel(t.broker)==='國泰證券'))) {
    state.transactions.push({
      id,
      market:'TW',
      type:'BUY',
      symbol:'2408',
      name:'南亞科',
      broker:'原券商（館前分公司）',
      date:'2026-08-25',
      qty:50,
      price:483,
      fee:0,
      fx:1
    });
  }
  if (!state.brokers.includes('原券商（館前分公司）')) state.brokers.push('原券商（館前分公司）');
  state.migrations.cathayNanya2408='2026-08-25';
  save();
  render();
})();
