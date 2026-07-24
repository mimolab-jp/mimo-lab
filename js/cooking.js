'use strict';

/* =========================================================
   みもLAB ごはんページ
   cooking.js
   ========================================================= */

/* ---------- 設定 ---------- */

const COOKING_API_URL =
  'https://script.google.com/macros/s/AKfycbyadofcyXYDLF0SxQpUdpWxU8pwEi7BljcLe3V_dUuAqAPslxFYW6GThj1DMeO5Pt47/exec?type=cooking';

const FAVORITE_STORAGE_KEY = 'mimoLabCookingFavorites';


/* ---------- ページ内で使うデータ ---------- */

let recipes = [];
let filteredRecipes = [];
let activeFilter = null;
let currentFeaturedRecipeId = null;
let favoriteIds = loadFavoriteIds();


/* ---------- HTML要素 ---------- */

const recipeContainer = document.getElementById('recipe-container');
const shuffleButton = document.getElementById('shuffle-button');
const featuredRecipe = document.querySelector('.featured-recipe');
const filterButtons = document.querySelectorAll('.filter-buttons button');


/* =========================================================
   初期処理
   ========================================================= */

document.addEventListener('DOMContentLoaded', init);

async function init() {
  if (!recipeContainer || !featuredRecipe) {
    console.error('ごはんページに必要なHTML要素が見つかりません。');
    return;
  }

  createRecipeModal();
  setupEvents();
  showLoading();

  try {
    recipes = await fetchRecipes();

    if (recipes.length === 0) {
      showEmptyMessage('表示できるレシピがまだありません。');
      showFeaturedEmpty();
      return;
    }

    filteredRecipes = [...recipes];

    renderRecipeCards(filteredRecipes);
    showRandomFeaturedRecipe();
  } catch (error) {
    console.error('レシピの読み込みに失敗しました。', error);

    showErrorMessage(
      'レシピを読み込めませんでした。通信状態やGASの公開設定を確認してください。'
    );

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
    throw new Error(data.message || 'APIからエラーが返されました。');
  }

  if (!Array.isArray(data.recipes)) {
    throw new Error('レシピデータの形式が正しくありません。');
  }

  return data.recipes
    .map(normalizeRecipe)
    .filter(recipe => recipe.title && recipe.visible);
}


/* =========================================================
   APIデータを画面用の形に整える
   ========================================================= */

function normalizeRecipe(rawRecipe, index) {
  const recipe = rawRecipe || {};

  return {
    id: String(recipe.id || index + 1),

    title: String(recipe.title || '').trim(),

    image: String(
      recipe.image ||
      recipe.imageUrl ||
      ''
    ).trim(),

    sourceUrl: String(
      recipe.sourceUrl ||
      recipe.url ||
      ''
    ).trim(),

    category: String(recipe.category || '').trim(),

    ingredients: normalizeList(recipe.ingredients),

    workTime: normalizeNumber(
      recipe.workTime ??
      recipe.prepTime ??
      recipe.activeTime
    ),

    leaveTime: normalizeNumber(
      recipe.leaveTime ??
      recipe.cookingTime ??
      recipe.waitTime
    ),

    tool: String(
      recipe.tool ||
      recipe.appliance ||
      recipe.cookingTool ||
      ''
    ).trim(),

    tags: normalizeList(recipe.tags),

    summary: String(
      recipe.summary ||
      recipe.memo ||
      recipe.description ||
      recipe.comment ||
      ''
    ).trim(),

    steps: normalizeList(
      recipe.steps ||
      recipe.instructions
    ),

    husbandRating: normalizeNumber(
      recipe.husbandRating ??
      recipe.rating
    ),

    backPainOk: normalizeBoolean(
      recipe.backPainOk ??
      recipe.lowEffort ??
      recipe.backOk
    ),

    gyomu: normalizeBoolean(
      recipe.gyomu ??
      recipe.gyomuSuper
    ),

    visible: normalizeVisible(
      recipe.visible ??
      recipe.display
    )
  };
}


function normalizeList(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item).trim())
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
    'true',
    '1',
    'yes',
    'y',
    '○',
    '〇',
    'あり',
    '可'
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

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      handleFilterButton(button);
    });
  });

  recipeContainer.addEventListener('click', handleRecipeContainerClick);

  featuredRecipe.addEventListener('click', handleFeaturedRecipeClick);
}


/* =========================================================
   レシピ一覧
   ========================================================= */

function renderRecipeCards(recipeList) {
  recipeContainer.innerHTML = '';

  if (recipeList.length === 0) {
    showEmptyMessage('この条件に合うレシピはありませんでした。');
    return;
  }

  const fragment = document.createDocumentFragment();

  recipeList.forEach(recipe => {
    fragment.appendChild(createRecipeCard(recipe));
  });

  recipeContainer.appendChild(fragment);
}


function createRecipeCard(recipe) {
  const article = document.createElement('article');
  article.className = 'recipe-card';
  article.dataset.recipeId = recipe.id;

  const icon = getRecipeIcon(recipe);
  const favorite = favoriteIds.includes(recipe.id);

  article.innerHTML = `
    <div class="recipe-card-icon" aria-hidden="true">
      ${recipe.image
        ? `<img src="${escapeAttribute(recipe.image)}"
                alt=""
                loading="lazy">`
        : icon}
    </div>

    <div class="recipe-card-content">
      <div class="recipe-tags">
        ${createTagHtml(recipe, 3)}
      </div>

      <h3>${escapeHtml(recipe.title)}</h3>

      <p class="recipe-summary">
        ${escapeHtml(
          recipe.summary || createFallbackSummary(recipe)
        )}
      </p>

      <div class="recipe-card-meta">
        ${createTimeHtml(recipe)}
      </div>

      <div class="recipe-actions">
        <button
          type="button"
          class="primary-button recipe-detail-button"
          data-recipe-id="${escapeAttribute(recipe.id)}"
        >
          レシピを見る
        </button>

        <button
          type="button"
          class="favorite-button ${favorite ? 'is-favorite' : ''}"
          data-favorite-id="${escapeAttribute(recipe.id)}"
          aria-label="${favorite
            ? 'お気に入りから外す'
            : 'お気に入りに追加'}"
          aria-pressed="${favorite}"
        >
          ${favorite ? '♥' : '♡'}
        </button>
      </div>
    </div>
  `;

  return article;
}


/* =========================================================
   今日のおすすめ
   ========================================================= */

function showRandomFeaturedRecipe(avoidCurrent = false) {
  const candidates =
    filteredRecipes.length > 0
      ? filteredRecipes
      : recipes;

  if (candidates.length === 0) {
    showFeaturedEmpty();
    return;
  }

  let candidateList = candidates;

  if (avoidCurrent && candidates.length > 1) {
    candidateList = candidates.filter(
      recipe => recipe.id !== currentFeaturedRecipeId
    );
  }

  const randomIndex = Math.floor(
    Math.random() * candidateList.length
  );

  const recipe = candidateList[randomIndex];

  currentFeaturedRecipeId = recipe.id;
  renderFeaturedRecipe(recipe);
}


function renderFeaturedRecipe(recipe) {
  const favorite = favoriteIds.includes(recipe.id);

  featuredRecipe.dataset.recipeId = recipe.id;

  featuredRecipe.innerHTML = `
    <div class="recipe-icon" aria-hidden="true">
      ${recipe.image
        ? `<img src="${escapeAttribute(recipe.image)}"
                alt=""
                loading="lazy">`
        : getRecipeIcon(recipe)}
    </div>

    <div class="recipe-content">
      <div class="recipe-tags">
        ${createTagHtml(recipe, 4)}
      </div>

      <h3>${escapeHtml(recipe.title)}</h3>

      <p class="recipe-summary">
        ${escapeHtml(
          recipe.summary || createFallbackSummary(recipe)
        )}
      </p>

      <div class="recipe-card-meta">
        ${createTimeHtml(recipe)}
      </div>

      <div class="recipe-actions">
        <button
          type="button"
          class="primary-button featured-detail-button"
          data-recipe-id="${escapeAttribute(recipe.id)}"
        >
          レシピを見る
        </button>

        <button
          type="button"
          class="favorite-button ${favorite ? 'is-favorite' : ''}"
          data-favorite-id="${escapeAttribute(recipe.id)}"
          aria-label="${favorite
            ? 'お気に入りから外す'
            : 'お気に入りに追加'}"
          aria-pressed="${favorite}"
        >
          ${favorite ? '♥' : '♡'}
        </button>
      </div>
    </div>
  `;
}


function showFeaturedEmpty() {
  featuredRecipe.innerHTML = `
    <div class="recipe-icon" aria-hidden="true">🍽️</div>
    <div class="recipe-content">
      <h3>レシピを登録しよう</h3>
      <p class="recipe-summary">
        スプレッドシートにレシピを追加すると、ここに表示されます。
      </p>
    </div>
  `;
}


function showFeaturedError() {
  featuredRecipe.innerHTML = `
    <div class="recipe-icon" aria-hidden="true">🥲</div>
    <div class="recipe-content">
      <h3>読み込みに失敗しました</h3>
      <p class="recipe-summary">
        少し時間を置いて、ページを再読み込みしてください。
      </p>
    </div>
  `;
}


/* =========================================================
   絞り込み
   ========================================================= */

function handleFilterButton(button) {
  const selectedFilter = button.dataset.filter;

  if (activeFilter === selectedFilter) {
    activeFilter = null;
  } else {
    activeFilter = selectedFilter;
  }

  updateFilterButtonAppearance();

  filteredRecipes = activeFilter
    ? recipes.filter(recipe =>
        recipeMatchesFilter(recipe, activeFilter)
      )
    : [...recipes];

  renderRecipeCards(filteredRecipes);

  if (filteredRecipes.length > 0) {
    showRandomFeaturedRecipe();
  }
}


function updateFilterButtonAppearance() {
  filterButtons.forEach(button => {
    const isActive =
      button.dataset.filter === activeFilter;

    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}


function recipeMatchesFilter(recipe, filter) {
  const category = recipe.category.toLowerCase();
  const tool = recipe.tool.toLowerCase();
  const tags = recipe.tags
    .join(' ')
    .toLowerCase();

  const searchableText = [
    category,
    tool,
    tags,
    recipe.title.toLowerCase()
  ].join(' ');

  switch (filter) {
    case 'meat':
      return (
        searchableText.includes('肉') ||
        searchableText.includes('鶏') ||
        searchableText.includes('豚') ||
        searchableText.includes('牛') ||
        searchableText.includes('ハンバーグ')
      );

    case 'noodle':
      return (
        searchableText.includes('麺') ||
        searchableText.includes('うどん') ||
        searchableText.includes('ラーメン') ||
        searchableText.includes('パスタ')
      );

    case 'rice':
      return (
        searchableText.includes('丼') ||
        searchableText.includes('カレー') ||
        searchableText.includes('ご飯') ||
        searchableText.includes('ドリア')
      );

    case 'hotcook':
      return (
        searchableText.includes('ホットクック') ||
        searchableText.includes('hotcook')
      );

    case 'quick':
      return isQuickRecipe(recipe);

    case 'gyomu':
      return (
        recipe.gyomu ||
        searchableText.includes('業スー') ||
        searchableText.includes('業務スーパー')
      );

    default:
      return true;
  }
}


function isQuickRecipe(recipe) {
  const totalTime =
    recipe.workTime + recipe.leaveTime;

  return (
    recipe.workTime <= 10 ||
    totalTime <= 10 ||
    recipe.tags.some(tag =>
      tag.includes('10分以内') ||
      tag.includes('5分')
    )
  );
}


/* =========================================================
   クリック処理
   ========================================================= */

function handleRecipeContainerClick(event) {
  const detailButton = event.target.closest(
    '.recipe-detail-button'
  );

  if (detailButton) {
    openRecipeModal(detailButton.dataset.recipeId);
    return;
  }

  const favoriteButton = event.target.closest(
    '[data-favorite-id]'
  );

  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favoriteId);
  }
}


function handleFeaturedRecipeClick(event) {
  const detailButton = event.target.closest(
    '.featured-detail-button'
  );

  if (detailButton) {
    openRecipeModal(detailButton.dataset.recipeId);
    return;
  }

  const favoriteButton = event.target.closest(
    '[data-favorite-id]'
  );

  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favoriteId);
  }
}


/* =========================================================
   お気に入り
   ========================================================= */

function loadFavoriteIds() {
  try {
    const saved = localStorage.getItem(
      FAVORITE_STORAGE_KEY
    );

    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed)
      ? parsed.map(String)
      : [];
  } catch (error) {
    console.warn(
      'お気に入りデータを読み込めませんでした。',
      error
    );

    return [];
  }
}


function saveFavoriteIds() {
  try {
    localStorage.setItem(
      FAVORITE_STORAGE_KEY,
      JSON.stringify(favoriteIds)
    );
  } catch (error) {
    console.warn(
      'お気に入りデータを保存できませんでした。',
      error
    );
  }
}


function toggleFavorite(recipeId) {
  const id = String(recipeId);

  if (favoriteIds.includes(id)) {
    favoriteIds = favoriteIds.filter(
      favoriteId => favoriteId !== id
    );
  } else {
    favoriteIds.push(id);
  }

  saveFavoriteIds();
  refreshRecipeDisplay();
}


function refreshRecipeDisplay() {
  renderRecipeCards(filteredRecipes);

  const featuredRecipeData = recipes.find(
    recipe => recipe.id === currentFeaturedRecipeId
  );

  if (featuredRecipeData) {
    renderFeaturedRecipe(featuredRecipeData);
  }
}


/* =========================================================
   レシピ詳細モーダル
   ========================================================= */

function createRecipeModal() {
  if (document.getElementById('recipe-modal')) {
    return;
  }

  const modal = document.createElement('div');

  modal.id = 'recipe-modal';
  modal.className = 'recipe-modal';
  modal.hidden = true;

  modal.innerHTML = `
    <div class="recipe-modal-backdrop"
         data-close-modal="true"></div>

    <section
      class="recipe-modal-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-modal-title"
    >
      <button
        type="button"
        class="recipe-modal-close"
        data-close-modal="true"
        aria-label="レシピを閉じる"
      >
        ×
      </button>

      <div id="recipe-modal-content"></div>
    </section>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', event => {
    if (event.target.closest('[data-close-modal]')) {
      closeRecipeModal();
    }
  });

  document.addEventListener('keydown', event => {
    if (
      event.key === 'Escape' &&
      !modal.hidden
    ) {
      closeRecipeModal();
    }
  });
}


function openRecipeModal(recipeId) {
  const recipe = recipes.find(
    item => item.id === String(recipeId)
  );

  const modal = document.getElementById('recipe-modal');
  const modalContent = document.getElementById(
    'recipe-modal-content'
  );

  if (!recipe || !modal || !modalContent) {
    return;
  }

  modalContent.innerHTML = createRecipeDetailHtml(recipe);

  modal.hidden = false;
  document.body.classList.add('modal-open');

  requestAnimationFrame(() => {
    modal.classList.add('is-open');
  });

  const closeButton = modal.querySelector(
    '.recipe-modal-close'
  );

  closeButton?.focus();
}


function closeRecipeModal() {
  const modal = document.getElementById('recipe-modal');

  if (!modal) {
    return;
  }

  modal.classList.remove('is-open');
  document.body.classList.remove('modal-open');

  window.setTimeout(() => {
    modal.hidden = true;
  }, 180);
}


function createRecipeDetailHtml(recipe) {
  const ingredientsHtml =
    recipe.ingredients.length > 0
      ? recipe.ingredients
          .map(
            ingredient =>
              `<li>${escapeHtml(ingredient)}</li>`
          )
          .join('')
      : '<li>材料はまだ登録されていません。</li>';

  const stepsHtml =
    recipe.steps.length > 0
      ? recipe.steps
          .map(
            (step, index) => `
              <li>
                <span class="step-number">${index + 1}</span>
                <span>${escapeHtml(step)}</span>
              </li>
            `
          )
          .join('')
      : `
          <li>
            <span class="step-number">1</span>
            <span>手順はまだ登録されていません。</span>
          </li>
        `;

  return `
    <div class="recipe-modal-icon" aria-hidden="true">
      ${recipe.image
        ? `<img src="${escapeAttribute(recipe.image)}"
                alt=""
                loading="lazy">`
        : getRecipeIcon(recipe)}
    </div>

    <div class="recipe-tags">
      ${createTagHtml(recipe, 8)}
    </div>

    <h2 id="recipe-modal-title">
      ${escapeHtml(recipe.title)}
    </h2>

    ${recipe.summary
      ? `
        <p class="recipe-modal-summary">
          ${escapeHtml(recipe.summary)}
        </p>
      `
      : ''}

    <div class="recipe-detail-meta">
      ${recipe.category
        ? `<span>🍽️ ${escapeHtml(recipe.category)}</span>`
        : ''}

      ${recipe.tool
        ? `<span>🤖 ${escapeHtml(recipe.tool)}</span>`
        : ''}

      ${recipe.workTime
        ? `<span>⚡ 作業 ${recipe.workTime}分</span>`
        : ''}

      ${recipe.leaveTime
        ? `<span>⏳ おまかせ ${recipe.leaveTime}分</span>`
        : ''}

      ${recipe.backPainOk
        ? '<span>🪑 腰が痛い日OK</span>'
        : ''}
    </div>

    <section class="recipe-detail-section">
      <h3>🛒 材料</h3>
      <ul class="ingredient-list">
        ${ingredientsHtml}
      </ul>
    </section>

    <section class="recipe-detail-section">
      <h3>🍳 作り方</h3>
      <ol class="step-list">
        ${stepsHtml}
      </ol>
    </section>

    ${recipe.sourceUrl
      ? `
        <p class="recipe-source-link">
          <a
            href="${escapeAttribute(recipe.sourceUrl)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            元レシピ・参考ページを見る ↗
          </a>
        </p>
      `
      : ''}
  `;
}


/* =========================================================
   タグ・表示用部品
   ========================================================= */

function createTagHtml(recipe, maximum = 4) {
  const tags = [];

  if (
    recipe.tool.includes('ホットクック') ||
    recipe.tags.some(tag =>
      tag.includes('ホットクック')
    )
  ) {
    tags.push('🤖 ホットクック');
  }

  if (
    recipe.gyomu ||
    recipe.tags.some(tag =>
      tag.includes('業スー') ||
      tag.includes('業務スーパー')
    )
  ) {
    tags.push('🛒 業スー');
  }

  if (recipe.workTime > 0) {
    tags.push(`⚡ 作業${recipe.workTime}分`);
  }

  if (recipe.backPainOk) {
    tags.push('🪑 腰痛の日OK');
  }

  recipe.tags.forEach(tag => {
    const decoratedTag = decorateTag(tag);

    if (!tags.includes(decoratedTag)) {
      tags.push(decoratedTag);
    }
  });

  return tags
    .slice(0, maximum)
    .map(tag => `<span>${escapeHtml(tag)}</span>`)
    .join('');
}


function decorateTag(tag) {
  if (tag.includes('作り置き')) {
    return `🍱 ${tag}`;
  }

  if (
    tag.includes('10分以内') ||
    tag.includes('5分')
  ) {
    return `⚡ ${tag}`;
  }

  if (
    tag.includes('野菜') ||
    tag.includes('副菜')
  ) {
    return `🥦 ${tag}`;
  }

  if (
    tag.includes('夫さん') ||
    tag.includes('ごちそう')
  ) {
    return `✨ ${tag}`;
  }

  if (
    tag.includes('包丁なし') ||
    tag.includes('腰痛')
  ) {
    return `🪑 ${tag}`;
  }

  return tag;
}


function createTimeHtml(recipe) {
  const items = [];

  if (recipe.workTime > 0) {
    items.push(`⚡ 作業${recipe.workTime}分`);
  }

  if (recipe.leaveTime > 0) {
    items.push(`⏳ おまかせ${recipe.leaveTime}分`);
  }

  if (items.length === 0) {
    return '';
  }

  return items
    .map(item => `<span>${escapeHtml(item)}</span>`)
    .join('');
}


function createFallbackSummary(recipe) {
  if (recipe.ingredients.length > 0) {
    const mainIngredients = recipe.ingredients
      .slice(0, 3)
      .join('・');

    return `${mainIngredients}で作る、みも家のお助けメニュー。`;
  }

  return '考えたくない日に頼れる、みも家のお助けメニュー。';
}


function getRecipeIcon(recipe) {
  const text = [
    recipe.category,
    recipe.title,
    recipe.tags.join(' ')
  ].join(' ');

  if (
    text.includes('麺') ||
    text.includes('うどん') ||
    text.includes('ラーメン') ||
    text.includes('パスタ')
  ) {
    return '🍜';
  }

  if (
    text.includes('カレー') ||
    text.includes('丼') ||
    text.includes('ドリア')
  ) {
    return '🍛';
  }

  if (
    text.includes('汁物') ||
    text.includes('スープ')
  ) {
    return '🥣';
  }

  if (
    text.includes('副菜') ||
    text.includes('野菜') ||
    text.includes('キャベツ') ||
    text.includes('ブロッコリー')
  ) {
    return '🥦';
  }

  if (
    text.includes('魚') ||
    text.includes('サバ')
  ) {
    return '🐟';
  }

  if (
    text.includes('肉') ||
    text.includes('鶏') ||
    text.includes('豚') ||
    text.includes('牛') ||
    text.includes('ハンバーグ')
  ) {
    return '🍖';
  }

  return '🍳';
}


/* =========================================================
   読み込み・エラー表示
   ========================================================= */

function showLoading() {
  recipeContainer.innerHTML = `
    <p class="empty-message loading-message">
      🍳 レシピ帳を開いています…
    </p>
  `;

  featuredRecipe.innerHTML = `
    <div class="recipe-icon" aria-hidden="true">🍳</div>
    <div class="recipe-content">
      <h3>今日のごはんを考え中…</h3>
      <p class="recipe-summary">
        スプレッドシートからレシピを読み込んでいます。
      </p>
    </div>
  `;
}


function showEmptyMessage(message) {
  recipeContainer.innerHTML = `
    <p class="empty-message">
      ${escapeHtml(message)}
    </p>
  `;
}


function showErrorMessage(message) {
  recipeContainer.innerHTML = `
    <div class="empty-message error-message">
      <p>🥲 ${escapeHtml(message)}</p>
      <button
        type="button"
        class="primary-button"
        onclick="window.location.reload()"
      >
        もう一度読み込む
      </button>
    </div>
  `;
}


/* =========================================================
   安全なHTML出力
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function escapeAttribute(value) {
  return escapeHtml(value);
}