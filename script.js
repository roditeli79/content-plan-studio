'use strict';

/** Локальный генератор идей контент-плана. Не использует ИИ API. */
const form = document.getElementById('plan-form');
const errorBox = document.getElementById('form-error');
const planContent = document.getElementById('plan-content');
const emptyState = document.getElementById('empty-state');
const cardsRoot = document.getElementById('cards');
let currentPlan = null;

const rubrics = [
  {type:'education', name:'Польза', title:({niche})=>`3 частые ошибки в теме «${niche}»: как их избежать`, idea:({niche,audience})=>`Разберите частые промахи и объясните, что важно знать аудитории: ${audience}.`, hook:({niche})=>`Разбираетесь в теме «${niche}»? Проверьте эти три вещи.`, cta:()=>`Сохраните чек-лист, чтобы вернуться к нему позже.`, format:'Карточки с советами'},
  {type:'expert', name:'Экспертность', title:({product})=>`Как понять, что ${product} вам подходят`, idea:({product})=>`Дайте понятные критерии выбора и расскажите, кому подходят ${product}.`, hook:({product})=>`Не всем нужны ${product}. Вот как разобраться, подходят ли они вам.`, cta:()=>`Напишите свой вопрос в комментариях — ответим по существу.`, format:'Объясняющий пост'},
  {type:'behind', name:'Закулисье', title:({niche})=>`Один день из жизни: ${niche}`, idea:()=>`Покажите реальные процессы, команду или подготовку к работе. Не выдумывайте детали.`, hook:()=>`Что остаётся за кадром нашей работы? Показываем процесс.`, cta:()=>`Какую часть нашей работы показать в следующий раз?`, format:'Фотоистория'},
  {type:'problem', name:'Боли ЦА', title:({audience})=>`Что мешает добиться результата: ${shorten(audience,55)}`, idea:({product})=>`Опишите знакомую проблему и покажите, как ${product} могут помочь. Без необоснованных обещаний.`, hook:()=>`Знакомо: стараешься, а результата всё нет? Разберём возможные причины.`, cta:()=>`Узнали себя? Расскажите, что сложнее всего.`, format:'Пост-разбор'},
  {type:'faq', name:'Вопросы', title:({product})=>`5 вопросов, которые задают про ${product}`, idea:()=>`Соберите реальные вопросы клиентов и честно ответьте на них.`, hook:()=>`Собрали вопросы, которые чаще всего возникают перед выбором.`, cta:()=>`Задайте вопрос, которого не оказалось в списке.`, format:'FAQ / ответы'},
  {type:'trust', name:'Доверие', title:()=>`Что важно знать перед покупкой: честный разбор`, idea:({product})=>`Покажите преимущества и ограничения: где ${product} полезны, а где нет.`, hook:()=>`Не обещаем волшебных результатов. Рассказываем, что работает на практике.`, cta:()=>`Сохраните материал, если планируете сравнивать варианты.`, format:'Пост с аргументами'},
  {type:'offer', name:'Продажи', title:({product})=>`Для кого созданы ${product} — и как начать`, idea:({product,audience})=>`Опишите предложение ${product} для аудитории «${audience}»: условия, первый шаг и реальные выгоды.`, hook:({product})=>`Думаете попробовать ${product}? Вот с чего можно начать.`, cta:()=>`Напишите нам, чтобы уточнить условия и подобрать вариант.`, format:'Пост-предложение'},
  {type:'case', name:'Кейс', title:()=>`Как выглядит путь клиента: от запроса к результату`, idea:()=>`Используйте только настоящий кейс с разрешения клиента или явно обозначьте гипотетический сценарий.`, hook:()=>`Расскажем, какие шаги проходит клиент, прежде чем увидеть результат.`, cta:()=>`Хотите разобрать вашу задачу? Напишите нам.`, format:'История / кейс'},
  {type:'engage', name:'Вовлечение', title:({niche})=>`Опрос: что для вас важно в теме «${niche}»?`, idea:()=>`Предложите аудитории 3–4 варианта ответа, чтобы узнать приоритеты.`, hook:()=>`Можно один вопрос? Ваш ответ поможет нам делать материалы полезнее.`, cta:()=>`Проголосуйте и расскажите почему выбрали этот вариант.`, format:'Опрос'},
  {type:'myth', name:'Мифы', title:({niche})=>`Миф или правда: 4 заблуждения про ${niche}`, idea:()=>`Проверьте популярные мифы и подкрепите опровержения фактами или опытом.`, hook:()=>`Кажется очевидным, но так ли это на самом деле?`, cta:()=>`Какой миф встречали чаще всего?`, format:'Разбор мифов'},
  {type:'checklist', name:'Чек-лист', title:({product})=>`Чек-лист перед выбором: ${product}`, idea:()=>`Составьте 5 проверяемых пунктов для осознанного выбора.`, hook:()=>`Короткая памятка, которая поможет ничего не забыть.`, cta:()=>`Сохраните и поделитесь с тем, кому пригодится.`, format:'Чек-лист'},
  {type:'story', name:'История', title:({niche})=>`Почему мы занимаемся темой «${niche}»`, idea:()=>`Расскажите настоящую историю возникновения бизнеса и ключевые принципы работы.`, hook:()=>`У каждого дела есть история. Вот наша.`, cta:()=>`Расскажите, что вам интересно узнать о нас.`, format:'Личная история'},
  {type:'compare', name:'Сравнение', title:({product})=>`Сравниваем подходы: как выбрать ${product}`, idea:()=>`Объясните два-три подхода к выбору и критерии, без придуманной статистики.`, hook:()=>`Как не потеряться среди вариантов? Сравним по делу.`, cta:()=>`Какой критерий для вас главный?`, format:'Сравнительный пост'},
  {type:'tips', name:'Практика', title:({niche})=>`Что можно сделать уже сегодня: 3 шага в теме «${niche}»`, idea:()=>`Предложите небольшие практические действия, доступные новичку.`, hook:()=>`Три простых шага, которые можно попробовать уже сегодня.`, cta:()=>`Попробуйте один шаг и расскажите, что получилось.`, format:'Практические советы'}
];
const priorityByGoal = {
  trust:['education','expert','trust','faq','myth','case','story','checklist','tips','behind','compare','problem','engage','offer'],
  sales:['problem','offer','case','faq','trust','compare','expert','checklist','education','behind','engage','myth','story','tips'],
  reach:['myth','tips','story','behind','engage','education','compare','checklist','problem','faq','case','expert','trust','offer'],
  engagement:['engage','faq','story','myth','behind','problem','tips','checklist','education','compare','expert','trust','case','offer']
};
const dayNames=['вс','пн','вт','ср','чт','пт','сб'];
const goalLabels={trust:'Доверие и экспертность',sales:'Заявки и продажи',reach:'Охват и узнаваемость',engagement:'Общение с аудиторией'};
const tonePrefixes={friendly:'Давай разберёмся вместе. ',expert:'Разбираем по пунктам. ',energetic:'Поехали! '};
const platformModifiers={telegram:{format:'Короткий пост / личный тон', cta:'Ответьте в комментариях или реакцией.'}, vk:{format:'Развёрнутый пост / вовлечение',cta:'Поделитесь своим мнением в комментариях.'}};

function shorten(value,length){return value.length>length?value.slice(0,length-1).trimEnd()+'…':value;}
function startOfLocalDate(dateStr){const [year,month,day]=dateStr.split('-').map(Number);return new Date(year,month-1,day,12,0,0);}
function dateLabel(date){return `${String(date.getDate()).padStart(2,'0')}.${String(date.getMonth()+1).padStart(2,'0')}.${date.getFullYear()} · ${dayNames[date.getDay()]}`;}
function dateISO(date){const y=date.getFullYear();return `${y}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function getInput(){
 const data=new FormData(form);
 return {niche:String(data.get('niche')||'').trim(),product:String(data.get('product')||'').trim(),audience:String(data.get('audience')||'').trim(),goal:String(data.get('goal')),tone:String(data.get('tone')),duration:Number(data.get('duration')),start:String(data.get('start-date')),channels:data.getAll('channel')};
}
function validate(input){if(!input.niche||!input.product||!input.audience)return 'Заполни нишу, продукт и целевую аудиторию.';if(!input.start||Number.isNaN(startOfLocalDate(input.start).valueOf()))return 'Выбери корректную дату.';if(!input.channels.length)return 'Выбери хотя бы одну площадку.';return '';}
function makePlan(input){
 const start=startOfLocalDate(input.start);const order=priorityByGoal[input.goal];
 const entries=[];const channels=input.channels.map(String);
 for(let day=0;day<input.duration;day++){
  const date=new Date(start.getFullYear(),start.getMonth(),start.getDate()+day,12);
  const item=rubrics.find(r=>r.type===order[day%order.length]);
  for(let idx=0;idx<channels.length;idx++){
   const channel=channels[idx];const modifier=platformModifiers[channel];
   const opening=typeof item.hook==='function'?item.hook(input):item.hook;
   const cta=item.cta(input);
   entries.push({date:dateISO(date),date_label:dateLabel(date),platform:channel==='telegram'?'Telegram':'ВКонтакте',rubric:item.name,topic:item.title(input),idea:item.idea(input),format:channel==='telegram'?item.format+' · короткая версия':item.format+' · с обсуждением',opening:tonePrefixes[input.tone]+opening,cta:channel==='telegram'?cta:cta+' '+modifier.cta});
  }
 }
 return {metadata:{project:'Контент-планер',version:'1.0',method:'rule-based, без ИИ API',generated_at:new Date().toISOString(),niche:input.niche,product:input.product,audience:input.audience,goal:goalLabels[input.goal],tone:input.tone,duration_days:input.duration,channels:channels},posts:entries};
}
function el(tag,className,text){const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;}
function appendMeta(parent,label,text){const line=el('div');line.append(el('span','',label+' '),el('p','',text));parent.append(line);}
function postAsText(post){return `${post.date_label} | ${post.platform}\nРубрика: ${post.rubric}\nТема: ${post.topic}\nИдея: ${post.idea}\nФормат: ${post.format}\nНачало: ${post.opening}\nПризыв: ${post.cta}`;}
async function copyPost(post,button){try{await navigator.clipboard.writeText(postAsText(post));button.textContent='Скопировано ✓';setTimeout(()=>button.textContent='Копировать идею',1700);}catch{const textarea=document.createElement('textarea');textarea.value=postAsText(post);document.body.append(textarea);textarea.select();document.execCommand('copy');textarea.remove();button.textContent='Скопировано ✓';setTimeout(()=>button.textContent='Копировать идею',1700);}}
function renderPlan(plan){
 currentPlan=plan;const posts=plan.posts,metadata=plan.metadata;
 document.getElementById('metric-posts').textContent=posts.length;
 document.getElementById('metric-days').textContent=metadata.duration_days;
 document.getElementById('metric-channels').textContent=metadata.channels.length;
 document.getElementById('plan-title').textContent=`Контент-план: ${metadata.niche}`;
 document.getElementById('plan-subtitle').textContent=`${metadata.duration_days} дней · ${metadata.goal} · ${metadata.channels.map(c=>c==='vk'?'ВК':'ТГ').join(' + ')}`;
 cardsRoot.replaceChildren();
 for(const post of posts){
  const card=el('article','post-card');
  const top=el('div','post-card-top');top.append(el('span','date-line',post.date_label),el('span','platform '+(post.platform==='Telegram'?'telegram':'vk'),post.platform));
  const heading=el('h4','',post.topic);const idea=el('p','angle',post.idea);const meta=el('div','card-meta');
  appendMeta(meta,'Формат:',post.format);appendMeta(meta,'Первая строка:',post.opening);appendMeta(meta,'CTA:',post.cta);
  const bottom=el('div','card-bottom');bottom.append(el('span','rubric',post.rubric));
  const copy=el('button','mini-copy','Копировать идею');copy.type='button';copy.setAttribute('aria-label','Копировать: '+post.topic);copy.addEventListener('click',()=>copyPost(post,copy));bottom.append(copy);
  card.append(top,heading,idea,meta,bottom);cardsRoot.append(card);
 }
 emptyState.hidden=true;planContent.hidden=false;
}
function download(content,name,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);}
function csvCell(value){return '"'+String(value??'').replaceAll('"','""')+'"';}
function toCSV(posts){const columns=[['date','Дата'],['platform','Площадка'],['rubric','Рубрика'],['topic','Тема'],['idea','Идея'],['format','Формат'],['opening','Первая строка'],['cta','Призыв']];const rows=[columns.map(c=>csvCell(c[1])).join(';')];for(const post of posts){rows.push(columns.map(([key])=>csvCell(post[key])).join(';'));}return '\uFEFF'+rows.join('\r\n');}
form.addEventListener('submit',event=>{event.preventDefault();const input=getInput();const error=validate(input);errorBox.hidden=!error;errorBox.textContent=error;if(error)return;renderPlan(makePlan(input));});
document.getElementById('reset-btn').addEventListener('click',()=>{form.reset();setDefaultDate();errorBox.hidden=true;currentPlan=null;emptyState.hidden=false;planContent.hidden=true;cardsRoot.replaceChildren();});
document.getElementById('download-csv').addEventListener('click',()=>{if(currentPlan)download(toCSV(currentPlan.posts),'content-plan.csv','text/csv;charset=utf-8');});
document.getElementById('download-json').addEventListener('click',()=>{if(currentPlan)download(JSON.stringify(currentPlan,null,2),'content-plan.json','application/json;charset=utf-8');});
function setDefaultDate(){const now=new Date();document.getElementById('start-date').value=dateISO(now);}
setDefaultDate();