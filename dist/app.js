const $ = selector => document.querySelector(selector);
const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const storageKey = 'essence-enquiry-v2';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('essence-enquiry-v1') || '{}') || {}; } catch {}
let enquiry = new Set(Array.isArray(saved.items) ? saved.items.filter(id => products.some(p => p.id === id)) : []);
let quantities = saved.quantities && typeof saved.quantities === 'object' && !Array.isArray(saved.quantities) ? saved.quantities : {};
let wholesaleBrief = typeof saved.wholesaleBrief === 'string' ? saved.wholesaleBrief : '';
let currentFilter = 'All';
let currentCuisine = 'All';
let searchTerm = '';
let toastTimer;
const dialogTriggers = new WeakMap();
$('#enquiry-notes').value = typeof saved.notes === 'string' ? saved.notes : '';
if ([...$('#enquiry-purpose').options].some(option => option.value === saved.purpose)) $('#enquiry-purpose').value = saved.purpose;
const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
function goTo(element) { element.scrollIntoView({block:'start',behavior:motion()}); }
function persist() {
  try {
    localStorage.setItem(storageKey,JSON.stringify({items:[...enquiry],quantities,notes:$('#enquiry-notes').value,purpose:$('#enquiry-purpose').value,wholesaleBrief}));
    localStorage.removeItem('essence-enquiry-v1');
  } catch {}
  $('#count').textContent = enquiry.size;
  $('#mobile-count').textContent = enquiry.size;
  $('#whatsapp-enquiry').href = 'https://wa.me/447402342704?text=' + encodeURIComponent(enquiryText());
}
function toast(message) {
  clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'),2800);
}
function renderProducts() {
  const list = products.filter(product => {
    const category = currentFilter === 'All' || product.category === currentFilter || (currentFilter === 'Pantry' && !['Fresh produce','Drinks'].includes(product.category));
    const cuisine = currentCuisine === 'All' || product.cuisines.includes(currentCuisine);
    return category && cuisine && `${product.name} ${product.category} ${product.description} ${product.aliases}`.toLowerCase().includes(searchTerm);
  });
  $('#products').innerHTML = list.map(p => `<article class="product"><div class="product-image"><img src="assets/${p.image}.jpg" alt="${escapeHtml(p.name)} — illustrative ingredient or serving idea" loading="lazy" width="400" height="300"><span class="product-tag">${p.tag}</span></div><div class="product-body"><span class="product-category">${p.category}</span><h3>${p.name}</h3><p class="product-description">${p.description}</p><button class="ingredient-link" data-guide="${p.id}" aria-label="Read guide to ${p.name}">Ingredient guide <span>↗</span></button><div class="product-bottom"><span>Ask about availability</span><button class="add-product ${enquiry.has(p.id)?'added':''}" data-add="${p.id}" aria-label="${enquiry.has(p.id)?'Remove':'Add'} ${p.name} ${enquiry.has(p.id)?'from':'to'} enquiry" aria-pressed="${enquiry.has(p.id)}">${enquiry.has(p.id)?'✓':'+'}</button></div></div></article>`).join('');
  $('#results-count').textContent = `${list.length} ${list.length===1?'ingredient':'ingredients'} to explore`;
  $('#empty-results').hidden = list.length > 0;
  for (const [attribute,value] of [['filter',currentFilter],['category',currentFilter],['cuisine',currentCuisine]]) {
    document.querySelectorAll(`[data-${attribute}]`).forEach(button => {
      const selected = button.dataset[attribute] === value;
      button.classList.toggle(attribute==='category'?'current':'selected',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }
}
function resetRange() { currentFilter='All'; currentCuisine='All'; searchTerm=''; $('#search').value=''; renderProducts(); }
function renderEnquiry() {
  const items=products.filter(p=>enquiry.has(p.id));
  $('#enquiry-items').innerHTML = (items.length ? items.map(p=>`<div class="enquiry-item"><img src="assets/${p.image}.jpg" alt=""><div class="enquiry-item-copy"><h3>${p.name}</h3><label for="quantity-${p.id}">Quantity or pack preference</label><input id="quantity-${p.id}" data-quantity="${p.id}" value="${escapeHtml(typeof quantities[p.id]==='string'?quantities[p.id]:'')}" maxlength="100" placeholder="e.g. 2 cases or 10 kg"></div><button data-remove="${p.id}" aria-label="Remove ${p.name}">Remove</button></div>`).join('') : '<p class="empty-list">Your next food idea starts here. Browse our ingredients or tell us what you’re looking for in the notes below.</p>') + (wholesaleBrief?`<div class="brief-summary"><span class="eyebrow">YOUR WHOLESALE BRIEF</span><p>${escapeHtml(wholesaleBrief).replace(/\n/g,'<br>')}</p></div>`:'') + '<button class="clear-list" id="clear-list">Clear list & notes</button>';
  $('#enquiry-status').textContent='';
}
function openDialog(dialog,trigger) {
  dialogTriggers.set(dialog,trigger || document.activeElement);
  if(dialog===$('#enquiry-dialog')) renderEnquiry();
  dialog.showModal(); document.body.style.overflow='hidden';
}
function enquiryText() {
  const items=products.filter(p=>enquiry.has(p.id));
  const lines=items.map(p=>`• ${p.name}${typeof quantities[p.id]==='string'&&quantities[p.id].trim()?' — '+quantities[p.id].trim():''}`);
  return `ESSENCE WHOLESALE FOODS — MY ENQUIRY\n\nShopping for: ${$('#enquiry-purpose').value}\n\n${lines.length?lines.join('\n'):'No ingredients selected. See requirements below.'}${wholesaleBrief?'\n\nWholesale brief:\n'+wholesaleBrief:''}\n\nAdditional requirements:\n${$('#enquiry-notes').value.trim()||'None added.'}\n\nPlease confirm availability, brands, pack sizes, prices and any collection or delivery arrangements. This is an enquiry, not a placed order.\n\nCall or WhatsApp: +44 7402 342704\nVisit: Unit 28, Enterprise Park Industrial Estate, Woodbourn Road, Sheffield S9 3JL, United Kingdom`;
}
function showGuide(id,trigger) {
  const p=products.find(p=>p.id===id); if(!p)return;
  $('#ingredient-title').textContent=p.name;
  $('#ingredient-content').innerHTML=`<img class="guide-image" src="assets/${p.image}.jpg" alt="Illustrative ingredient or serving idea"><p class="guide-description">${p.guide}</p><h3>Ideas for your kitchen</h3><ul>${p.uses.map(use=>`<li>${use}</li>`).join('')}</ul><div class="guide-ask"><strong>What to include in your enquiry</strong><p>${p.ask}</p></div><p class="guide-stock">This guide is for inspiration. Product availability, brands, specifications and prices need confirmation.</p><button class="button primary guide-add" data-guide-add="${p.id}">${enquiry.has(p.id)?'View my enquiry':'Add to my enquiry'} <span>↗</span></button>`;
  openDialog($('#ingredient-dialog'),trigger);
}
function toggleMenu(open) {
  $('#navigation').classList.toggle('open',open);
  $('.menu-toggle').setAttribute('aria-expanded',String(open));
  $('.menu-toggle').setAttribute('aria-label',open?'Close menu':'Open menu');
}
document.addEventListener('click',event=>{
  const add=event.target.closest('[data-add]');
  if(add){const id=add.dataset.add;if(!products.some(p=>p.id===id))return;const exists=enquiry.has(id);exists?enquiry.delete(id):enquiry.add(id);if(exists)delete quantities[id];persist();renderProducts();toast(exists?'Removed from your enquiry':'Added to your enquiry list');}
  const remove=event.target.closest('[data-remove]');
  if(remove){enquiry.delete(remove.dataset.remove);delete quantities[remove.dataset.remove];persist();renderProducts();renderEnquiry();}
  if(event.target.closest('#clear-list')){enquiry.clear();quantities={};wholesaleBrief='';$('#enquiry-notes').value='';$('#enquiry-purpose').value='Home kitchen';$('#trade-form').reset();persist();renderProducts();renderEnquiry();}
  const open=event.target.closest('[data-open-enquiry]');if(open)openDialog($('#enquiry-dialog'),open);
  const close=event.target.closest('[data-close-dialog]');if(close)close.closest('dialog').close();
  const category=event.target.closest('[data-category]');if(category){currentFilter=category.dataset.category;searchTerm='';$('#search').value='';renderProducts();goTo($('.catalogue-top'));}
  const filter=event.target.closest('[data-filter]');if(filter){currentFilter=filter.dataset.filter;renderProducts();}
  const cuisine=event.target.closest('[data-cuisine]');if(cuisine){currentCuisine=cuisine.dataset.cuisine;renderProducts();}
  if(event.target.closest('.reset-range')){resetRange();goTo($('#range'));}
  const guide=event.target.closest('[data-guide]');if(guide)showGuide(guide.dataset.guide,guide);
  const guideAdd=event.target.closest('[data-guide-add]');
  if(guideAdd){enquiry.add(guideAdd.dataset.guideAdd);persist();renderProducts();const trigger=dialogTriggers.get($('#ingredient-dialog'));$('#ingredient-dialog').close();openDialog($('#enquiry-dialog'),trigger);}
  const meal=event.target.closest('[data-meal]');
  if(meal){const list=mealLists[meal.dataset.meal];if(list){list.items.forEach(id=>enquiry.add(id));persist();renderProducts();openDialog($('#enquiry-dialog'),meal);$('#enquiry-status').textContent=`Added ingredients for ${list.name}. Adjust quantities and notes before sending.`;}}
});
$('#enquiry-items').addEventListener('input',event=>{const input=event.target.closest('[data-quantity]');if(input){quantities[input.dataset.quantity]=input.value;persist();}});
$('#search').addEventListener('input',event=>{searchTerm=event.target.value.trim().toLowerCase();renderProducts();});
$('#search-form').addEventListener('submit',event=>{event.preventDefault();renderProducts();goTo($('#products'));});
$('#enquiry-notes').addEventListener('input',persist);
$('#enquiry-purpose').addEventListener('change',persist);
$('#trade-form').addEventListener('submit',event=>{
  event.preventDefault();
  const requirements=$('#trade-requirements').value.trim();
  if(!requirements){$('#trade-requirements').setCustomValidity('Please describe the ingredients you need.');$('#trade-requirements').reportValidity();return;}
  $('#trade-requirements').setCustomValidity('');
  const date=$('#trade-date').value;
  const displayDate=date?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')):'To be discussed';
  wholesaleBrief=`Shopping for: ${$('#trade-type').value}\nFrequency: ${$('#trade-frequency').value}\nRequired date: ${displayDate}\nRequirements: ${requirements}`;
  $('#enquiry-purpose').value=$('#trade-type').value;
  persist();openDialog($('#enquiry-dialog'),$('#trade-form button[type="submit"]'));
  $('#enquiry-status').textContent='Your wholesale brief is ready to review. Choose WhatsApp when you’re ready to send it.';
});
$('#trade-requirements').addEventListener('input',()=>$('#trade-requirements').setCustomValidity(''));
$('#download-enquiry').addEventListener('click',()=>{
  const blob=new Blob([enquiryText()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='essence-wholesale-enquiry.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#enquiry-status').textContent='Your enquiry list has been downloaded.';
});
$('#copy-enquiry').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(enquiryText());$('#enquiry-status').textContent='Enquiry copied. Paste it into your notes or a message.';}catch{$('#enquiry-status').textContent='Copy is unavailable here. Use Download my list instead.';}});
$('[data-visit-link]').addEventListener('click',()=>$('#enquiry-dialog').close());
$('#privacy-button').addEventListener('click',event=>openDialog($('#privacy-dialog'),event.currentTarget));
$('#credits-button').addEventListener('click',event=>openDialog($('#credits-dialog'),event.currentTarget));
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow='';const trigger=dialogTriggers.get(dialog);if(trigger?.isConnected)trigger.focus();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
});
$('.menu-toggle').addEventListener('click',()=>toggleMenu(!$('#navigation').classList.contains('open')));
document.querySelectorAll('#navigation a').forEach(link=>link.addEventListener('click',()=>toggleMenu(false)));
document.addEventListener('keydown',event=>{if(event.key==='Escape')toggleMenu(false);});
$('#year').textContent=new Date().getFullYear();
persist();renderProducts();
