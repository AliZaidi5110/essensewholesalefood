const products = [
  {id:'rice',name:'Rice & everyday grains',category:'Rice & grains',image:'rice',description:'The starting point for so many favourite meals.',tag:'PANTRY ESSENTIAL'},
  {id:'vegetables',name:'Fresh vegetables',category:'Fresh produce',image:'vegetables',description:'Colour, crunch and inspiration for your kitchen.',tag:'FRESH INSPIRATION'},
  {id:'spices',name:'Spices & seasonings',category:'Spices & seasonings',image:'spices',description:'Little ingredients. A whole world of flavour.',tag:'BIG ON FLAVOUR'},
  {id:'oil',name:'Cooking oils',category:'Oils & pantry',image:'oil',description:'Everyday cooking starts with the essentials.',tag:'KITCHEN STAPLE'},
  {id:'pulses',name:'Beans & pulses',category:'Beans & pulses',image:'pulses',description:'Versatile ingredients for comforting favourites.',tag:'PANTRY ESSENTIAL'},
  {id:'drinks',name:'Drinks & refreshments',category:'Drinks',image:'drinks',description:'Something refreshing for every gathering.',tag:'REFRESH YOUR RANGE'},
  {id:'pantry',name:'Pantry ingredients',category:'Oils & pantry',image:'market',description:'Explore ingredients for the meals you love.',tag:'EVERYDAY INSPIRATION'},
  {id:'herbs',name:'Fresh kitchen inspiration',category:'Fresh produce',image:'vegetables',description:'Discover the flavours for your next creation.',tag:'FOR YOUR KITCHEN'}
];
const $ = (selector) => document.querySelector(selector);
const storageKey = 'essence-enquiry-v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
let enquiry = new Set(Array.isArray(saved.items) ? saved.items.filter(id => products.some(p => p.id === id)) : []);
let currentFilter = 'All';
let searchTerm = '';
let toastTimer;
let lastDialogTrigger;
const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
$('#enquiry-notes').value = typeof saved.notes === 'string' ? saved.notes : '';
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({items:[...enquiry],notes:$('#enquiry-notes').value})); } catch {}
  $('#count').textContent = enquiry.size;
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800);
}
function renderProducts() {
  const list = products.filter(product => {
    const matchesCategory = currentFilter === 'All' || product.category === currentFilter || (currentFilter === 'Pantry' && !['Fresh produce','Drinks'].includes(product.category));
    const matchesSearch = `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });
  $('#products').innerHTML = list.map(product => `<article class="product"><div class="product-image"><img src="assets/${product.image}.jpg" alt="${product.name} — illustrative food photography" loading="lazy" width="400" height="300"><span class="product-tag">${product.tag}</span></div><div class="product-body"><span class="product-category">${product.category}</span><h3>${product.name}</h3><p class="product-description">${product.description}</p><div class="product-bottom"><span>Enquire for availability</span><button class="add-product ${enquiry.has(product.id) ? 'added' : ''}" data-add="${product.id}" aria-label="${enquiry.has(product.id) ? 'Remove' : 'Add'} ${product.name} ${enquiry.has(product.id) ? 'from' : 'to'} enquiry" aria-pressed="${enquiry.has(product.id)}">${enquiry.has(product.id) ? '✓' : '+'}</button></div></div></article>`).join('');
  $('#results-count').textContent = `${list.length} ${list.length === 1 ? 'idea' : 'ideas'} to explore`;
  $('#empty-results').hidden = list.length > 0;
  document.querySelectorAll('[data-filter]').forEach(button => {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.querySelectorAll('[data-category]').forEach(button => {
    button.classList.toggle('current', button.dataset.category === currentFilter);
    button.setAttribute('aria-pressed', String(button.dataset.category === currentFilter));
  });
}
function filter(category) {
  currentFilter = category;
  renderProducts();
}
function renderEnquiry() {
  const items = products.filter(p => enquiry.has(p.id));
  $('#enquiry-items').innerHTML = items.length ? items.map(p => `<div class="enquiry-item"><img src="assets/${p.image}.jpg" alt=""><div><h3>${p.name}</h3><p>Confirm availability, quantities and price in person</p></div><button data-remove="${p.id}" aria-label="Remove ${p.name}">Remove</button></div>`).join('') + '<button class="clear-list" id="clear-list">Clear list</button>' : '<p class="empty-list">Your list is ready for a little inspiration. Use the + buttons in our range to add ingredients, or write what you need below.</p>';
  $('#enquiry-status').textContent = '';
}
function openDialog(dialog, trigger) {
  lastDialogTrigger = trigger;
  if (dialog === $('#enquiry-dialog')) renderEnquiry();
  dialog.showModal();
  document.body.style.overflow = 'hidden';
}
function enquiryText() {
  const items = products.filter(p => enquiry.has(p.id));
  return `ESSENCE WHOLESALE FOODS — MY ENQUIRY LIST\n\n${items.length ? items.map(p => `• ${p.name}`).join('\n') : 'No product categories selected.'}\n\nAdditional requirements:\n${$('#enquiry-notes').value.trim() || 'None added.'}\n\nThis is a prepared list, not a placed order or submitted enquiry. Please discuss availability, quantities and prices with the team.\n\nVisit: Unit 28, Enterprise Park Industrial Estate, Woodbourn Road, Sheffield S9 3JL, United Kingdom`;
}
document.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  if (add) {
    const id = add.dataset.add;
    const wasAdded = enquiry.has(id);
    wasAdded ? enquiry.delete(id) : enquiry.add(id);
    persist(); renderProducts();
    toast(wasAdded ? 'Removed from your enquiry list' : 'Added to your enquiry list');
  }
  const remove = event.target.closest('[data-remove]');
  if (remove) { enquiry.delete(remove.dataset.remove); persist(); renderProducts(); renderEnquiry(); }
  if (event.target.closest('#clear-list')) { enquiry.clear(); $('#enquiry-notes').value = ''; persist(); renderProducts(); renderEnquiry(); }
  const open = event.target.closest('[data-open-enquiry]');
  if (open) openDialog($('#enquiry-dialog'),open);
  const close = event.target.closest('[data-close-dialog]');
  if (close) close.closest('dialog').close();
  const category = event.target.closest('[data-category]');
  if (category) { filter(category.dataset.category); $('.catalogue-top').scrollIntoView({block:'start',behavior:'smooth'}); }
  const filterButton = event.target.closest('[data-filter]');
  if (filterButton) filter(filterButton.dataset.filter);
  if (event.target.closest('.reset-range')) { searchTerm = ''; $('#search').value = ''; filter('All'); $('#range').scrollIntoView({behavior:'smooth'}); }
});
$('#search').addEventListener('input', event => { searchTerm = event.target.value.trim().toLowerCase(); renderProducts(); });
$('#search-form').addEventListener('submit', event => { event.preventDefault(); renderProducts(); $('#products').scrollIntoView({behavior:'smooth',block:'start'}); });
$('#enquiry-notes').addEventListener('input', persist);
$('#download-enquiry').addEventListener('click', () => {
  const blob = new Blob([enquiryText()],{type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'essence-wholesale-enquiry.txt'; a.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
  $('#enquiry-status').textContent = 'Your list has been downloaded. Bring it along when you visit.';
});
$('#copy-enquiry').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(enquiryText()); $('#enquiry-status').textContent = 'List copied. You can paste it into your own notes or message.'; }
  catch { $('#enquiry-status').textContent = 'Copy is unavailable in this browser. Use Download my list to save it instead.'; }
});
$('[data-visit-link]').addEventListener('click', () => $('#enquiry-dialog').close());
$('#privacy-button').addEventListener('click', event => openDialog($('#privacy-dialog'),event.currentTarget));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; lastDialogTrigger?.focus(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close(); } });
});
$('.menu-toggle').addEventListener('click', () => {
  const open = $('#navigation').classList.toggle('open');
  $('.menu-toggle').setAttribute('aria-expanded',String(open));
  $('.menu-toggle').setAttribute('aria-label',open?'Close menu':'Open menu');
});
document.querySelectorAll('#navigation a').forEach(link => link.addEventListener('click', () => {
  $('#navigation').classList.remove('open'); $('.menu-toggle').setAttribute('aria-expanded','false'); $('.menu-toggle').setAttribute('aria-label','Open menu');
}));
document.addEventListener('keydown', event => { if(event.key === 'Escape') { $('#navigation').classList.remove('open'); $('.menu-toggle').setAttribute('aria-expanded','false'); $('.menu-toggle').setAttribute('aria-label','Open menu'); } });
$('#year').textContent = new Date().getFullYear();
persist(); renderProducts();
