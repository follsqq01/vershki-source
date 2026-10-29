'use strict';
const questions = [
 ['На какую авантюру вы готовы вместе?', ['Попробовать что-то творческое','Отправиться исследовать новое место','Устроить небольшой эксперимент','Сделать что-нибудь необычное своими руками','Полностью довериться случаю!']],
 ['Где вам хотелось бы провести время вместе?', ['Дома','На свежем воздухе','В городе','Готовы отправиться куда-нибудь']],
 ['Сколько времени у вас есть?', ['До 30 минут','Около часа','1–2 часа','Хоть целый день!']],
 ['Что вам было бы интереснее попробовать?', ['Сделать что-то своими руками','Придумать или рассказать историю','Поснимать фото или видео','Приготовить что-нибудь необычное','Исследовать новое место','Пока не знаем, удивите нас!']],
 ['Какой формат отдыха вам ближе?', ['Спокойно посидеть и поболтать','Заняться чем-то творческим','Немного прогуляться','Побольше движения и активности!']],
 ['Сколько вы готовы потратить?', ['Нисколько, используем то, что есть','До 500 ₽','До 1500 ₽','Готовы потратиться ради впечатлений']],
 ['Что вам хотелось бы получить от встречи?', ['Что-нибудь на память','Новые впечатления','Что-то вкусное','Узнать друг о друге что-то новое','Просто классно провести время!']]
];
let answers = questions.map(() => []), step = 0;
try { sessionStorage.removeItem('vershki-quiz-v1'); } catch {}
const content = document.querySelector('#quiz-content');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function rankActivities() {
 const maps = {0:['craft','explore','experiment','craft',null],3:['craft','story','photo','food','explore',null],4:['calm','craft','walk','active'],6:['memory','experiment','food','learn',null]};
 const maxTime = Math.max(...answers[2].map(i => [30,60,120,1440][i]));
 const maxCost = Math.max(...answers[5].map(i => [0,500,1500,Infinity][i]));
 return window.QUIZ_ACTIVITIES.map(activity => {
  const mismatches = [];
  if (activity.minutes > maxTime) mismatches.push('понадобится больше времени');
  if (activity.cost > maxCost) mismatches.push('нужен больший бюджет');
  if (!answers[1].some(i => activity.places.includes(i))) mismatches.push('другое место');
  let score = 0;
  for (const [q,map] of Object.entries(maps)) score += answers[q].filter(i => activity.tags.includes(map[i])).length * (Number(q) === 3 ? 3 : 2);
  return {...activity,score,mismatches};
 }).sort((a,b) => a.mismatches.length-b.mismatches.length || b.score-a.score || a.id-b.id);
}
function render(focus = false) {
 document.querySelector('.quiz-shell').classList.toggle('results-mode', step === 7);
 if (step === 7) renderResults(); else renderQuestion();

 if (focus) { content.querySelector('h1').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
}
function renderQuestion() {
 const [title, options] = questions[step];
 content.innerHTML = `<section class="question"><div class="progress" aria-hidden="true">${questions.map((_,i)=>`<span class="${i<=step?'done':''}"></span>`).join('')}</div><h1 tabindex="-1" id="question-title">${title}</h1><p class="hint" id="choice-hint">Можно выбрать несколько вариантов</p><div class="choices" role="group" aria-labelledby="question-title" aria-describedby="choice-hint">${options.map((option,i)=>`<button type="button" class="choice" aria-pressed="${answers[step].includes(i)}" data-option="${i}">${option}</button>`).join('')}</div><nav class="nav" aria-label="Шаги теста"><button type="button" class="pill back" ${step===0?'hidden':''}>← назад</button><button type="button" class="pill next" ${answers[step].length?'':'disabled'}>${step===6?'подобрать занятия':'дальше'} →</button></nav></section>`;
 content.querySelectorAll('.choice').forEach(button => button.addEventListener('click', () => {
  const index = Number(button.dataset.option), selected = answers[step];
  answers[step] = selected.includes(index) ? selected.filter(v=>v!==index) : [...selected,index];
  button.setAttribute('aria-pressed', String(answers[step].includes(index)));
  content.querySelector('.next').disabled = !answers[step].length;
 }));
 content.querySelector('.back').onclick=()=>{if(step>0){step--;render(true);}};
 content.querySelector('.next').onclick=()=>{if(answers[step].length){step++;render(true);}};
}
function renderResults() {
 const ranked = rankActivities();
 const exact = ranked.filter(a=>!a.mismatches.length);
 const activities = ranked.slice(0,3);
 content.innerHTML = `<section class="results"><h1 class="bead-heading" tabindex="-1" aria-label="Поздравляем!">${[...'поздравляем!'].map(l=>`<span aria-hidden="true">${l}</span>`).join('')}</h1><p class="results-intro">${exact.length>=3?'Мы подобрали для вас 3 варианта.':'Вот самые близкие к вашим ответам варианты.'}</p>${exact.length<3?'<p class="results-note">Не все занятия подходят по времени, месту или бюджету. Отметили отличия на карточках.</p>':''}<div class="cards">${activities.map((a,i)=>`<article class="activity"><span class="card-number">идея ${String(i+1).padStart(2,'0')} / вместе</span><h2>${a.title}</h2><p class="meta">${a.meta}</p><p class="description">${a.description}</p><p class="fit">${a.mismatches.length?'Учтите: '+a.mismatches.join(' · '):'Подходит по месту, времени и бюджету'}</p></article>`).join('')}</div><nav class="results-actions" aria-label="Повторить тест"><button class="pill restart">пройти заново ↻</button><a class="pill" href="index.html">на главную →</a></nav></section>`;
 content.querySelector('.restart').onclick=resetQuiz;
 content.querySelectorAll('.activity').forEach(card=>{
  card.addEventListener('pointermove',event=>{
   if(reducedMotion.matches || event.pointerType!=='mouse') return;
   const box=card.getBoundingClientRect(), x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;
   card.style.transform=`translate(${x*10}px,${y*8-8}px) rotateX(${-y*9}deg) rotateY(${x*12}deg)`;
  });
  card.addEventListener('pointerleave',()=>{card.style.transform='';});
 });
}
function resetQuiz() { answers=questions.map(()=>[]); step=0; render(true); }
// Returning through the browser history must also start a fresh quiz.
window.addEventListener('pageshow', event => { if (event.persisted) resetQuiz(); });
render();
