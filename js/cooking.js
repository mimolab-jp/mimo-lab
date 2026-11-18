
'use strict';

/* =========================================================
   みもLAB ごはんページ
   cooking.js 2.0
   ========================================================= */

const COOKING_API_BASE_URL =
  'https://script.google.com/macros/s/AKfycbyadofcyXYDLF0SxQpUdpWxU8pwEi7BljcLe3V_dUuAqAPslxFYW6GThj1DMeO5Pt47/exec';

const COOKING_API_URL =
  `${COOKING_API_BASE_URL}?type=cooking`;

/* ---------- レシピデータ ---------- */

let recipes = [];
let filteredRecipes = [];
let currentFeaturedRecipeId = null;

/* ---------- 検索条件 ---------- */

let selectedMealType = '';
const selectedIngredients = new Set();
const selectedExtras = new Set();
let keyword = '';

/* ---------- HTML要素 ---------- */

const recipeContainer =
  document.getElementById('recipe-container');

const shuffleButton =
  document.getElementById('shuffle-button');

const featuredRecipe =
  document.querySelector('.featured-recipe');

const filterButtons =
  document.querySelectorAll('#extra-filters [data-filter]');

const mealTypeButtons =
  document.querySelectorAll('#meal-type-filters [data-meal-type]');

const ingredientButtons =
  document.querySelectorAll('#ingredient-filters [data-ingredient]');

const keywordInput =
  document.getElementById('recipe-keyword');

const clearFiltersButton =
  document.getElementById('recipe-filter-clear');

const resultCount =
  document.getElementById('recipe-result-count');

const addRecipeButton =
  document.getElementById('add-recipe-button');

const recipeAddModal =
  document.getElementById('recipe-add-modal');

const recipeAddForm =
  document.getElementById('recipe-add-form');

const recipeAddMessage =
  document.getElementById('recipe-add-message');

const recipeAddSubmit =
  document.getElementById('recipe-add-submit');
  
/* =========================================================
   初期処理
   ========================================================= */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  if (!recipeContainer || !featuredRecipe) {
    console.error('必要なHTML要素が見つかりません。');
    return;
  }

  createRecipeModal();
  setupEvents();
  showLoading();

  try {
    recipes = await fetchRecipes();
    filteredRecipes = [...recipes];

    if (recipes.length === 0) {
      showEmptyMessage('表示できるレシピがありません。');
      showFeaturedEmpty();
      updateResultCount();
      return;
    }

    renderRecipeCards(filteredRecipes);
    updateResultCount();
    showRandomFeaturedRecipe();

  } catch (error) {
    console.error('レシピの読み込みに失敗しました。', error);
    showErrorMessage('レシピを読み込めませんでした。');
    showFeaturedError();
  }
}

/* =========================================================
   APIからレシピを取得
   ========================================================= */

async function fetchRecipes() {
  const response = await fetch(COOKING_API_URL, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`HTTPエラー：${response.status}`);
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.message || 'APIエラー');
  }

  if (!Array.isArray(data.recipes)) {
    throw new Error('レシピデータの形式が正しくありません。');
  }

  return data.recipes
    .map(normalizeRecipe)
    .filter(recipe => recipe.title && recipe.visible);
}

/* =========================================================
   レシピデータの整形
   ========================================================= */

function normalizeRecipe(rawRecipe, index) {
  const recipe = rawRecipe || {};

  return {
    id: String(recipe.id || index + 1),
    title: String(recipe.title || '').trim(),
    image: String(recipe.image || recipe.imageUrl || '').trim(),
    sourceUrl: String(recipe.sourceUrl || '').trim(),
    category: String(recipe.category || '').trim(),
    mealType: String(recipe.mealType || '').trim(),
    mainIngredients: normalizeList(recipe.mainIngredients),
    relatedRecipeIds: normalizeList(recipe.relatedRecipeIds),
    ingredients: normalizeList(recipe.ingredients),
    workTime: normalizeNumber(recipe.workTime),
    leaveTime: normalizeNumber(recipe.leaveTime),
    tool: String(recipe.tool || '').trim(),
    tags: normalizeList(recipe.tags),
    summary: String(recipe.summary || '').trim(),
    steps: normalizeList(recipe.steps),
    favorite: normalizeBoolean(recipe.favorite),
    husbandRating: normalizeNumber(recipe.husbandRating),
    backPainOk: normalizeBoolean(recipe.backPainOk),
    gyomu: normalizeBoolean(recipe.gyomu),
    visible: normalizeVisible(recipe.visible)
  };
}

/* =========================================================
   データ変換用の補助関数
   ========================================================= */

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item ?? '').trim())
      .filter(Boolean);
  }

  if (value === null || value === undefined || value === '') {
    return [];
  }

  return String(value)
    .split(/\r?\n|\||,|、/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  return [
    'true', '1', 'yes', 'y',
    '○', '〇', 'あり', '可'
  ].includes(normalized);
}

function normalizeVisible(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return true;
  }

  return normalizeBoolean(value);
}

/* =========================================================
   イベント設定
   ========================================================= */

function setupEvents() {
  shuffleButton?.addEventListener('click', () => {
    showRandomFeaturedRecipe(true);
  });

  mealTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const value = button.dataset.mealType || '';

      selectedMealType =
        selectedMealType === value ? '' : value;

      applyFilters();
    });
  });

  ingredientButtons.forEach(button => {
    button.addEventListener('click', () => {
      const ingredient = button.dataset.ingredient || '';

      if (selectedIngredients.has(ingredient)) {
        selectedIngredients.delete(ingredient);
      } else {
        selectedIngredients.add(ingredient);
      }

      applyFilters();
    });
  });

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || '';

      if (selectedExtras.has(filter)) {
        selectedExtras.delete(filter);
      } else {
        selectedExtras.add(filter);
      }

      applyFilters();
    });
  });

  keywordInput?.addEventListener('input', () => {
    keyword = keywordInput.value.trim();
    applyFilters();
  });

  clearFiltersButton?.addEventListener('click', () => {
    selectedMealType = '';
    selectedIngredients.clear();
    selectedExtras.clear();
    keyword = '';

    if (keywordInput) {
      keywordInput.value = '';
    }

    applyFilters();
  });

  recipeContainer.addEventListener(
    'click',
    handleRecipeContainerClick
  );

  featuredRecipe.addEventListener(
    'click',
    handleFeaturedRecipeClick
  );

  addRecipeButton?.addEventListener(
    'click',
    openRecipeAddModal
  );

  recipeAddModal?.addEventListener('click', event => {
    if (event.target.closest('[data-close-add-modal]')) {
      closeRecipeAddModal();
    }
  });

  recipeAddForm?.addEventListener(
    'submit',
    handleRecipeAddSubmit
  );

  document.addEventListener('keydown', event => {
    if (
      event.key === 'Escape' &&
      recipeAddModal &&
      !recipeAddModal.hidden
    ) {
      closeRecipeAddModal();
    }
  });
}

/* =========================================================
   レシピ検索・絞り込み
   ========================================================= */

function applyFilters() {
  filteredRecipes = recipes.filter(recipe => {
    if (selectedMealType) {
      const type = getRecipeMealType(recipe);
      if (type !== selectedMealType) return false;
    }

    if (selectedIngredients.size > 0) {
      const ingredients = getSearchableIngredients(recipe);

      const matches = [...selectedIngredients].every(
        selected => ingredients.some(
          ingredient => ingredientMatches(ingredient, selected)
        )
      );

      if (!matches) return false;
    }

    if (selectedExtras.size > 0) {
      const matches = [...selectedExtras].every(
        filter => recipeMatchesExtra(recipe, filter)
      );

      if (!matches) return false;
    }

    if (keyword) {
      const searchText = normalizeSearchText([
        recipe.title,
        recipe.category,
        recipe.mealType,
        recipe.summary,
        recipe.tool,
        ...recipe.tags,
        ...recipe.ingredients,
        ...recipe.mainIngredients
      ].join(' '));

      const words = normalizeSearchText(keyword)
        .split(/\s+/)
        .filter(Boolean);

      if (!words.every(word => searchText.includes(word))) {
        return false;
      }
    }

    return true;
  });

  renderRecipeCards(filteredRecipes);
  updateResultCount();
  updateFilterButtons();
}

function getRecipeMealType(recipe) {
  if (recipe.mealType) return recipe.mealType;

  const category = recipe.category;

  if (category === '副菜') return '副菜';
  if (category === '汁物') return '汁物';
  if (category === '下ごしらえ') return '下ごしらえ';

  if (['肉', '麺', 'カレー・丼', '魚'].includes(category)) {
    return '主菜';
  }

  return 'その他';
}

function getSearchableIngredients(recipe) {
  return [
    ...recipe.mainIngredients,
    ...recipe.ingredients
  ].map(normalizeSearchText);
}

function ingredientMatches(text, selected) {
  const target = normalizeSearchText(selected);

  const aliases = {
    '鶏肉': ['鶏肉', '鶏むね', '鶏もも', 'ささみ', '鶏ひき肉'],
    '豚肉': ['豚肉', '豚こま', '豚バラ', '豚ロース', '豚ひき肉'],
    '牛肉': ['牛肉', '牛こま', '牛バラ', '牛ひき肉'],
    'きゅうり': ['きゅうり', '胡瓜'],
    'キャベツ': ['キャベツ'],
    '大根': ['大根'],
    'もやし': ['もやし'],
    'なす': ['なす', 'ナス', '茄子'],
    '玉ねぎ': ['玉ねぎ', '玉葱', 'たまねぎ'],
    'にんじん': ['にんじん', '人参'],
    '卵': ['卵', 'たまご', '玉子'],
    '豆腐': ['豆腐'],
    'じゃがいも': ['じゃがいも', 'ジャガイモ']
  };

  const candidates = aliases[selected] || [selected];

  return candidates.some(candidate =>
    text.includes(normalizeSearchText(candidate))
  );
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '');
}

function recipeMatchesExtra(recipe, filter) {
  switch (filter) {
    case 'favorite':
      return recipe.favorite;

    case 'hotcook':
      return normalizeSearchText(
        [recipe.tool, ...recipe.tags].join(' ')
      ).includes('ホットクック');

    case 'quick':
      return isQuickRecipe(recipe);

    case 'gyomu':
      return recipe.gyomu;

    case 'backpain':
      return recipe.backPainOk;

    case 'meat':
      return recipe.category === '肉';

    case 'noodle':
      return recipe.category === '麺';

    case 'rice':
      return recipe.category === 'カレー・丼';

    default:
      return true;
  }
}

function isQuickRecipe(recipe) {
  if (recipe.workTime > 0 && recipe.workTime <= 10) {
    return true;
  }

  const total = recipe.workTime + recipe.leaveTime;

  if (total > 0 && total <= 10) {
    return true;
  }

  return recipe.tags.some(tag =>
    normalizeSearchText(tag).includes('10分以内')
  );
}

function updateFilterButtons() {
  mealTypeButtons.forEach(button => {
    const active =
      button.dataset.mealType === selectedMealType &&
      selectedMealType !== '';

    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  ingredientButtons.forEach(button => {
    const active = selectedIngredients.has(
      button.dataset.ingredient
    );

    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  filterButtons.forEach(button => {
    const active = selectedExtras.has(
      button.dataset.filter
    );

    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function updateResultCount() {
  if (!resultCount) return;

  resultCount.textContent =
    `${filteredRecipes.length}件のレシピ`;
}

/* =========================================================
   レシピ一覧カード
   ========================================================= */

function renderRecipeCards(recipeList) {
  recipeContainer.innerHTML = '';

  if (recipeList.length === 0) {
    showEmptyMessage('条件に合うレシピがありません。');
    return;
  }

  const fragment = document.createDocumentFragment();

  recipeList.forEach(recipe => {
    const card = document.createElement('article');
    card.className = 'recipe-card';

    card.innerHTML = `
      <div class="recipe-card-icon">
        ${getRecipeImageHtml(recipe)}
      </div>
      <div class="recipe-card-content">
        <div class="recipe-tags">
          ${getRecipeTagsHtml(recipe)}
        </div>
        <h3>${escapeHtml(recipe.title)}</h3>
        <p class="recipe-summary">
          ${escapeHtml(recipe.summary || 'レシピを見てみよう')}
        </p>
        <div class="recipe-card-meta">
          ${getRecipeMetaHtml(recipe)}
        </div>
        <div class="recipe-actions">
          <button type="button"
            class="primary-button"
            data-action="detail"
            data-id="${escapeHtml(recipe.id)}">
            レシピを見る
          </button>
          <button type="button"
            class="favorite-button ${recipe.favorite ? 'is-favorite' : ''}"
            data-action="favorite"
            data-id="${escapeHtml(recipe.id)}"
            aria-label="お気に入り">
            ${recipe.favorite ? '♥' : '♡'}
          </button>
        </div>
      </div>
    `;

    fragment.appendChild(card);
  });

  recipeContainer.appendChild(fragment);
}


function convertGoogleDriveImageUrl(url) {
  if (!url) return '';

  const value = String(url).trim();

  // Googleドライブ以外のURLは変更しない
  try {
    const parsed = new URL(value);
    if (
      parsed.hostname !== 'drive.google.com' &&
      parsed.hostname !== 'www.drive.google.com'
    ) {
      return value;
    }

    // すでに画像表示用URLならそのまま
    if (parsed.pathname === '/thumbnail') {
      return value;
    }

    // 通常の共有リンクからファイルIDを取得
    const match = parsed.pathname.match(
      /^\/file\/d\/([^/]+)/
    );

    const fileId = match
      ? match[1]
      : parsed.searchParams.get('id');

    if (!fileId) return value;

    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1000`;

  } catch (error) {
    return value;
  }
}


function getRecipeImageHtml(recipe) {
  if (recipe.image) {
    const imageUrl = convertGoogleDriveImageUrl(recipe.image);

    return `<img src="${escapeHtml(imageUrl)}"
      alt="${escapeHtml(recipe.title)}"
      loading="lazy"
      onerror="this.replaceWith(document.createTextNode('🍳'))">`;
  }

  return getRecipeEmoji(recipe);
}

function getRecipeEmoji(recipe) {
  const category = recipe.category;

  if (category === '肉') return '🥩';
  if (category === '麺') return '🍜';
  if (category === 'カレー・丼') return '🍛';
  if (category === '副菜') return '🥦';
  if (category === '汁物') return '🥣';
  if (category === '魚') return '🐟';

  return '🍳';
}

function getRecipeTagsHtml(recipe) {
  const tags = [];

  const mealType = getRecipeMealType(recipe);

  if (mealType !== 'その他') {
    tags.push(mealType);
  }

  if (recipe.backPainOk) tags.push('🪑 腰痛の日OK');
  if (recipe.gyomu) tags.push('🛒 業スー');

  recipe.tags.slice(0, 2).forEach(tag => {
    if (!tags.includes(tag)) tags.push(tag);
  });

  return tags.slice(0, 4)
    .map(tag => `<span>${escapeHtml(tag)}</span>`)
    .join('');
}

function getRecipeMetaHtml(recipe) {
  const items = [];

  if (recipe.workTime > 0) {
    items.push(`⏱ 作業${recipe.workTime}分`);
  }

  if (recipe.leaveTime > 0) {
    items.push(`☕ 放置${recipe.leaveTime}分`);
  }

  if (recipe.tool) {
    items.push(`🍳 ${recipe.tool}`);
  }

  return items
    .map(item => `<span>${escapeHtml(item)}</span>`)
    .join('');
}

function showEmptyMessage(message) {
  recipeContainer.innerHTML = `
    <p class="empty-message">${escapeHtml(message)}</p>
  `;
}

function showLoading() {
  showEmptyMessage('レシピを読み込んでいます…');
}

function showErrorMessage(message) {
  recipeContainer.innerHTML = `
    <div class="empty-message error-message">
      <p>${escapeHtml(message)}</p>
      <button type="button"
        class="primary-button"
        onclick="location.reload()">
        再読み込み
      </button>
    </div>
  `;
}

function handleRecipeContainerClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === 'detail') {
    openRecipeDetail(id);
  }

  if (action === 'favorite') {
    toggleFavorite(id, button);
  }
}

/* =========================================================
   今日のおすすめ
   ========================================================= */

function showRandomFeaturedRecipe(avoidSame = false) {
  if (recipes.length === 0) {
    showFeaturedEmpty();
    return;
  }

  let candidates = recipes;

  if (avoidSame && recipes.length > 1) {
    candidates = recipes.filter(
      recipe => recipe.id !== currentFeaturedRecipeId
    );
  }

  const index = Math.floor(
    Math.random() * candidates.length
  );

  const recipe = candidates[index];
  currentFeaturedRecipeId = recipe.id;

  renderFeaturedRecipe(recipe);
}

function renderFeaturedRecipe(recipe) {
  featuredRecipe.innerHTML = `
    <div class="recipe-icon">
      ${getRecipeImageHtml(recipe)}
    </div>

    <div class="recipe-content">
      <div class="recipe-tags">
        ${getRecipeTagsHtml(recipe)}
      </div>

      <h3>${escapeHtml(recipe.title)}</h3>

      <p class="recipe-summary">
        ${escapeHtml(recipe.summary || '今日のごはん候補！')}
      </p>

      <div class="recipe-card-meta">
        ${getRecipeMetaHtml(recipe)}
      </div>

      <div class="recipe-actions">
        <button type="button"
          class="primary-button"
          data-action="detail"
          data-id="${escapeHtml(recipe.id)}">
          レシピを見る
        </button>

        <button type="button"
          class="favorite-button ${recipe.favorite ? 'is-favorite' : ''}"
          data-action="favorite"
          data-id="${escapeHtml(recipe.id)}"
          aria-label="お気に入り">
          ${recipe.favorite ? '♥' : '♡'}
        </button>
      </div>
    </div>
  `;
}

function showFeaturedEmpty() {
  featuredRecipe.innerHTML = `
    <p class="empty-message">
      おすすめできるレシピがまだありません。
    </p>
  `;
}

function showFeaturedError() {
  featuredRecipe.innerHTML = `
    <p class="empty-message">
      今日のおすすめを読み込めませんでした。
    </p>
  `;
}

function handleFeaturedRecipeClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === 'detail') {
    openRecipeDetail(id);
  }

  if (action === 'favorite') {
    toggleFavorite(id, button);
  }
}

/* =========================================================
   レシピ詳細画面
   ========================================================= */

function openRecipeDetail(id) {
  const recipe = recipes.find(
    item => item.id === String(id)
  );

  if (!recipe) return;

  const modal = document.createElement('div');
  modal.className = 'recipe-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const ingredients = recipe.ingredients.length
    ? recipe.ingredients.map(item =>
        `<li>${escapeHtml(item)}</li>`
      ).join('')
    : '<li>材料は未登録です</li>';

  const steps = recipe.steps.length
    ? recipe.steps.map(item =>
        `<li>${escapeHtml(item)}</li>`
      ).join('')
    : '<li>手順は未登録です</li>';

  const related = getRelatedRecipes(recipe);

  modal.innerHTML = `
    <div class="recipe-modal-backdrop"
      data-close-detail></div>

    <div class="recipe-modal-panel">
      <button type="button"
        class="recipe-modal-close"
        data-close-detail
        aria-label="閉じる">×</button>

      <div class="recipe-modal-icon">
        ${getRecipeImageHtml(recipe)}
      </div>

      <h2>${escapeHtml(recipe.title)}</h2>
      <p>${escapeHtml(recipe.summary)}</p>

      <div class="recipe-card-meta">
        ${getRecipeMetaHtml(recipe)}
      </div>

      <section class="recipe-detail-section">
        <h3>材料</h3>
        <ul class="ingredient-list">${ingredients}</ul>
      </section>

      <section class="recipe-detail-section">
        <h3>作り方</h3>
        <ol class="step-list">${steps}</ol>
      </section>

      ${renderRelatedRecipes(related)}
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', event => {
    if (event.target.closest('[data-close-detail]')) {
      modal.remove();
      return;
    }

    const button = event.target.closest('[data-related-id]');
    if (button) {
      const nextId = button.dataset.relatedId;
      modal.remove();
      openRecipeDetail(nextId);
    }
  });
}

/* =========================================================
   関連レシピ
   ========================================================= */

function getRelatedRecipes(recipe) {
  const ids = recipe.relatedRecipeIds.map(String);

  return ids
    .map(id => recipes.find(item => item.id === id))
    .filter(item => item && item.id !== recipe.id);
}

function renderRelatedRecipes(related) {
  if (related.length === 0) return '';

  const buttons = related.map(recipe => `
    <button type="button"
      class="related-recipe-button"
      data-related-id="${escapeHtml(recipe.id)}">
      ${getRecipeEmoji(recipe)}
      ${escapeHtml(recipe.title)}
    </button>
  `).join('');

  return `
    <section class="recipe-detail-section">
      <h3>一緒に作るなら</h3>
      <div class="related-recipes">
        ${buttons}
      </div>
    </section>
  `;
}

/* =========================================================
   お気に入り更新
   ========================================================= */

let favoriteUpdating = false;

async function toggleFavorite(id, button) {
  if (favoriteUpdating) return;

  const recipe = recipes.find(
    item => item.id === String(id)
  );

  if (!recipe) return;

  favoriteUpdating = true;

  const previousValue = recipe.favorite;
  const newValue = !previousValue;

  // 先に画面へ反映
  recipe.favorite = newValue;
  refreshRecipeDisplays();

  try {
   
const response = await fetch(
  COOKING_API_BASE_URL,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      type: 'updatefavorite',
      id: recipe.id,
      favorite: newValue
    })
  }
);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.ok) {
      throw new Error(
        result.message || 'お気に入り更新エラー'
      );
    }

  } catch (error) {
    // 保存できなかった場合は元に戻す
    recipe.favorite = previousValue;
    refreshRecipeDisplays();

    console.error(
      'お気に入り更新に失敗しました。',
      error
    );

    alert(
      'お気に入りを保存できませんでした。'
    );

  } finally {
    favoriteUpdating = false;
  }
}

/* =========================================================
   レシピ表示の更新
   ========================================================= */

function refreshRecipeDisplays() {
  // 検索条件を保ったまま再描画
  applyFilters();

  // 今日のおすすめも更新
  if (currentFeaturedRecipeId) {
    const featured = recipes.find(
      recipe => recipe.id === currentFeaturedRecipeId
    );

    if (featured) {
      renderFeaturedRecipe(featured);
    }
  }
}

/* =========================================================
   レシピ追加画面
   ========================================================= */

function createRecipeModal() {
  if (!recipeAddModal || !recipeAddForm) {
    console.warn(
      'レシピ追加フォームが見つかりません。'
    );
    return;
  }

  // 画面を開いた直後は非表示にする
  recipeAddModal.hidden = true;

  // 必須項目を設定
  const titleInput = recipeAddForm.elements.namedItem('title');

  if (titleInput) {
    titleInput.required = true;
  }

  // 閉じるボタンに識別属性を付ける
  recipeAddModal
    .querySelectorAll('.recipe-modal-close')
    .forEach(button => {
      button.setAttribute('data-close-add-modal', '');
    });

  // 背景クリックでも閉じられるようにする
  recipeAddModal
    .querySelectorAll('.recipe-modal-backdrop')
    .forEach(backdrop => {
      backdrop.setAttribute('data-close-add-modal', '');
    });
}

function openRecipeAddModal() {
  if (!recipeAddModal) return;

  recipeAddModal.hidden = false;

  if (recipeAddMessage) {
    recipeAddMessage.textContent = '';
  }

  document.body.style.overflow = 'hidden';

  const titleInput =
    recipeAddForm?.elements.namedItem('title');

  titleInput?.focus();
}

function closeRecipeAddModal() {
  if (!recipeAddModal) return;

  recipeAddModal.hidden = true;
  document.body.style.overflow = '';

  if (recipeAddMessage) {
    recipeAddMessage.textContent = '';
  }
}

/* =========================================================
   フォームの入力値取得
   ========================================================= */

function getFormText(form, name) {
  const field = form.elements.namedItem(name);

  if (!field) return '';

  return String(field.value || '').trim();
}

function getFormChecked(form, name) {
  const field = form.elements.namedItem(name);

  return Boolean(field && field.checked);
}

function getFormList(form, name) {
  return normalizeList(getFormText(form, name));
}

function getRecipeFormData(form) {
  return {
    title: getFormText(form, 'title'),
    category: getFormText(form, 'category'),
    mealType: getFormText(form, 'mealType'),
    image: getFormText(form, 'image'),
    summary: getFormText(form, 'summary'),
    ingredients: getFormList(form, 'ingredients'),
    mainIngredients: getFormList(form, 'mainIngredients'),
    relatedRecipeIds: getFormList(form, 'relatedRecipeIds'),
    steps: getFormList(form, 'steps'),
    workTime: normalizeNumber(
      getFormText(form, 'workTime')
    ),
    leaveTime: normalizeNumber(
      getFormText(form, 'leaveTime')
    ),
    tool: getFormText(form, 'tool'),
    tags: getFormList(form, 'tags'),
    sourceUrl: getFormText(form, 'sourceUrl'),
    gyomu: getFormChecked(form, 'gyomu'),
    backPainOk: getFormChecked(form, 'backPainOk')
  };
}

/* =========================================================
   レシピ新規登録
   ========================================================= */

let recipeSubmitting = false;

async function handleRecipeAddSubmit(event) {
  event.preventDefault();

  if (recipeSubmitting || !recipeAddForm) return;

  const recipeData = getRecipeFormData(recipeAddForm);

  if (!recipeData.title) {
    setRecipeAddMessage('料理名を入力してください。', true);
    return;
  }

  recipeSubmitting = true;

  if (recipeAddSubmit) {
    recipeAddSubmit.disabled = true;
  }

  setRecipeAddMessage('レシピを登録しています…');

  try {
    const params = new URLSearchParams();

    params.append('type', 'addcooking');

    Object.entries(recipeData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.append(key, value.join('\n'));
      } else {
        params.append(key, String(value));
      }
    });

    const response = await fetch(
      COOKING_API_BASE_URL,
      {
        method: 'POST',
        body: params
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.ok) {
      throw new Error(
        result.message || 'レシピの登録に失敗しました。'
      );
    }

    setRecipeAddMessage('登録できました！');

    // GASから最新のレシピ一覧を取得
    recipes = await fetchRecipes();

    recipeAddForm.reset();
    closeRecipeAddModal();

    // 検索条件を維持して一覧を更新
    applyFilters();

    // 今日のおすすめも更新
    if (recipes.length > 0) {
      showRandomFeaturedRecipe();
    } else {
      showFeaturedEmpty();
    }

  } catch (error) {
    console.error('レシピ登録エラー', error);

    setRecipeAddMessage(
      '登録または再読み込みに失敗しました。' +
      '登録済みの可能性があるため、' +
      '再送信前にシートを確認してください。',
      true
    );

  } finally {
    recipeSubmitting = false;

    if (recipeAddSubmit) {
      recipeAddSubmit.disabled = false;
    }
  }
}

/* =========================================================
   登録メッセージ
   ========================================================= */

function setRecipeAddMessage(message, isError = false) {
  if (!recipeAddMessage) return;

  recipeAddMessage.textContent = message;

  recipeAddMessage.classList.toggle(
    'is-error',
    isError
  );
}

/* =========================================================
   HTML文字列の安全な表示
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]
  );
}
