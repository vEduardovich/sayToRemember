$(document).ready( ()=>{
  var totalScoreGap = $('.totalScore>div>span:nth-child(2)');
  var totalScoreRankGap = $('.totalScoreRank>div>span:nth-child(2)');
  var statScore = $('.statScore>div>span:nth-child(2)');
  var statRank = $('.statRank>div>span:nth-child(2)');
  var checkGap = [totalScoreGap, totalScoreRankGap, statScore, statRank];

  // 랭킹 등락 색깔 표시
  checkGap.map( (s)=>{
    s.map( (i, v)=>{
      var v = $(v);
      if (v.text().trim().startsWith('▲')) {
        v.css('color','red');
      } else if (v.text().trim().startsWith('▼')){
        v.css('color','blue');
      } 
      else v.css('fontSize','0.8em');
    })
  })

})


