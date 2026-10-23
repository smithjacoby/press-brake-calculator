// Page controls used by the calculator form. The die dropdown stores the numeric die width.
const calculatorForm = document.querySelector('#calculator-form');
const inputDefinitions = [
  { input: document.querySelector('#die-family'), error: document.querySelector('#die-error'), name: 'Die Family', allowZero: false },
  { input: document.querySelector('#piece-length'), error: document.querySelector('#piece-error'), name: 'Piece Length', allowZero: false },
  { input: document.querySelector('#bend-length'), error: document.querySelector('#bend-error'), name: 'Bend Length', allowZero: true }
];
const formError = document.querySelector('#form-error');
const formErrorMessage = document.querySelector('#form-error-message');
const formErrorLearnMore = document.querySelector('#form-error-learn-more');
const output = document.querySelector('#x-value');
const yOutput = document.querySelector('#y-value');
const resultInstructions = document.querySelector('#result-instructions');
const resultDialog = document.querySelector('#x-result-dialog');
const settingsForm = document.querySelector('#settings-form');
const settingsStatus = document.querySelector('#settings-status');
const resetSettingsButton = document.querySelector('#reset-settings');
const settingsStorageKey = 'pressBrakeCalculatorSettings';
// Only the X home reference remains adjustable. Y/R comes from fixed tooling constants.
const settingDefinitions = [
  { key: 'homeX', input: document.querySelector('#setting-home-x'), error: document.querySelector('#setting-home-x-error'), name: 'Initial X home offset' }
];
let currentSettings = loadSettings();

// Start with built-in settings, then safely merge any values saved in this browser.
function getDefaultSettings() {
  return { ...window.PressBrakeCalculator.defaultSettings };
}

function isValidSetting(value) {
  return Number.isFinite(value);
}

function loadSettings() {
  const defaults = getDefaultSettings();

  try {
    const savedSettings = JSON.parse(localStorage.getItem(settingsStorageKey));
    if (!savedSettings || typeof savedSettings !== 'object') return defaults;

    for (const key of Object.keys(defaults)) {
      if (isValidSetting(savedSettings[key])) defaults[key] = savedSettings[key];
    }
  } catch {
    // Use the built-in values if saved browser data is unavailable or invalid.
  }

  return defaults;
}

function saveSettings() {
  try {
    localStorage.setItem(settingsStorageKey, JSON.stringify(currentSettings));
  } catch {
    // The current page still uses the values even if the browser cannot persist them.
  }
}

function clearSettingErrors() {
  for (const { input, error } of settingDefinitions) {
    input.removeAttribute('aria-invalid');
    error.textContent = '';
  }
}

function syncSettingsForm() {
  for (const { key, input } of settingDefinitions) input.value = formatMeasurement(currentSettings[key]);
}

function updateSettingReferences() {
  // Keep every visible X-home reference synchronized with the saved browser setting.
  for (const element of document.querySelectorAll('[data-setting]')) {
    element.textContent = formatMeasurement(currentSettings[element.dataset.setting]);
  }

  // Fixed tooling values are read from calculator.js so one constant controls every display.
  for (const element of document.querySelectorAll('[data-calculator-constant]')) {
    element.textContent = formatMeasurement(
      window.PressBrakeCalculator[element.dataset.calculatorConstant]
    );
  }

}

function validateSetting(definition) {
  // Settings use the same finite-number rule as measurement inputs.
  const value = definition.input.value.trim();
  if (value === '') return setSettingError(definition, `Enter the ${definition.name.toLowerCase()}.`);

  const number = Number(value);
  if (!Number.isFinite(number)) return setSettingError(definition, `${definition.name} must be a valid finite number.`);
  definition.input.removeAttribute('aria-invalid');
  definition.error.textContent = '';
  return number;
}

function setSettingError(definition, message) {
  definition.input.setAttribute('aria-invalid', 'true');
  definition.error.textContent = message;
  return null;
}

function validateInput(definition) {
  // The dropdown and numeric measurements all pass through one finite-number check.
  const value = definition.input.value.trim();
  if (value === '') return setError(definition, `Enter the ${definition.name.toLowerCase()}.`);

  const number = Number(value);
  if (!Number.isFinite(number)) return setError(definition, `${definition.name} must be a valid finite number.`);
  if (definition.allowZero ? number < 0 : number <= 0) {
    return setError(definition, definition.allowZero
      ? `${definition.name} cannot be negative.`
      : `${definition.name} must be greater than zero.`);
  }

  definition.input.removeAttribute('aria-invalid');
  definition.error.textContent = '';
  return number;
}

function setError(definition, message) {
  definition.input.setAttribute('aria-invalid', 'true');
  definition.error.textContent = message;
  return null;
}

function formatMeasurement(value) {
  return value.toFixed(5);
}

function setFormError(message = '', showLearnMore = false) {
  // Keep the error text and its optional procedure link together for screen readers.
  formErrorMessage.textContent = message;
  formErrorLearnMore.hidden = !showLearnMore;
  formError.hidden = message === '';
}

function clearResults() {
  // A changed input invalidates the old popup and every line in its calculation breakdown.
  if (resultDialog.open) resultDialog.close();
  for (const selector of [
    '#breakdown-die',
    '#breakdown-piece',
    '#breakdown-bend',
    '#breakdown-move',
    '#breakdown-home-x',
    '#breakdown-mode',
    '#breakdown-y',
    '#breakdown-x'
  ]) {
    document.querySelector(selector).textContent = '--';
  }
  output.textContent = '--';
  yOutput.textContent = '--';
}

calculatorForm.addEventListener('submit', (event) => {
  // Prevent a page reload so the current inputs and popup stay on the calculator page.
  event.preventDefault();
  setFormError();
  clearResults();

  // The selected die-family option supplies its width to the existing calculation.
  const [dieWidth, pieceLength, bendLength] = inputDefinitions.map(validateInput);
  if (dieWidth === null || pieceLength === null || bendLength === null) {
    setFormError('Correct the highlighted measurements to calculate the X position.');
    calculatorForm.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  if (bendLength > pieceLength) {
    const bend = inputDefinitions[2];
    setError(bend, 'Bend Length cannot exceed Piece Length.');
    setFormError('Correct the highlighted measurement to calculate the X position.');
    bend.input.focus();
    return;
  }

  const { moveBack, xPosition, yPosition, clearanceMode } = window.PressBrakeCalculator.calculate(
    dieWidth,
    pieceLength,
    bendLength,
    currentSettings.homeX
  );
  if (!Number.isFinite(moveBack) || !Number.isFinite(xPosition) || !Number.isFinite(yPosition)) {
    setFormError('These measurements are outside the calculator range. Enter smaller finite values.');
    return;
  }

  document.querySelector('#breakdown-die').textContent = formatMeasurement(dieWidth);
  document.querySelector('#breakdown-piece').textContent = formatMeasurement(pieceLength);
  document.querySelector('#breakdown-bend').textContent = formatMeasurement(bendLength);
  document.querySelector('#breakdown-move').textContent = formatMeasurement(moveBack);
  document.querySelector('#breakdown-home-x').textContent = formatMeasurement(currentSettings.homeX);
  document.querySelector('#breakdown-mode').textContent = clearanceMode === 'lifted'
    ? 'LIFTED / FRONT REFERENCE'
    : 'NORMAL / REAR REFERENCE';
  document.querySelector('#breakdown-y').textContent = formatMeasurement(yPosition);
  document.querySelector('#breakdown-x').textContent = formatMeasurement(xPosition);
  output.textContent = formatMeasurement(xPosition);
  yOutput.textContent = formatMeasurement(yPosition);
  resultInstructions.textContent = clearanceMode === 'lifted'
    ? 'Lifted clearance mode is active. Go to Create Bend, select Add Back Gauge, then enter the displayed Final X value in X and Final Y/R value in R.'
    : 'Normal clearance mode is active. Use the usual Move To workflow: enter the displayed Final X value in X and Final Y/R value in R, then select Go.';
  resultDialog.showModal();
});

document.querySelector('#close-result').addEventListener('click', () => resultDialog.close());

function clearCalculationFeedback(definition) {
  definition.input.removeAttribute('aria-invalid');
  definition.error.textContent = '';
  setFormError();
  clearResults();
}

// Typing a measurement or choosing a different die removes stale results immediately.
for (const definition of inputDefinitions) {
  definition.input.addEventListener('input', () => clearCalculationFeedback(definition));
}
inputDefinitions[0].input.addEventListener('change', () => clearCalculationFeedback(inputDefinitions[0]));

settingsForm.addEventListener('submit', (event) => {
  // Save only the X-home reference; Y/R is intentionally fixed in calculator.js.
  event.preventDefault();
  settingsStatus.textContent = '';

  const nextSettings = {};
  let hasErrors = false;
  for (const definition of settingDefinitions) {
    const value = validateSetting(definition);
    if (value === null) hasErrors = true;
    else nextSettings[definition.key] = value;
  }

  if (hasErrors) {
    settingsStatus.textContent = 'Correct the highlighted constants before saving.';
    settingsForm.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  currentSettings = nextSettings;
  saveSettings();
  syncSettingsForm();
  updateSettingReferences();
  clearResults();
  settingsStatus.textContent = 'X home offset saved.';
});

resetSettingsButton.addEventListener('click', () => {
  currentSettings = getDefaultSettings();
  try {
    localStorage.removeItem(settingsStorageKey);
  } catch {
    // The defaults still apply for this page even if browser storage is unavailable.
  }

  clearSettingErrors();
  syncSettingsForm();
  updateSettingReferences();
  clearResults();
  settingsStatus.textContent = 'Default X home offset restored.';
});

for (const { input, error } of settingDefinitions) {
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    error.textContent = '';
    settingsStatus.textContent = '';
  });
}

// Populate settings and references once the page is ready.
syncSettingsForm();
updateSettingReferences();

// The three tabs share one page: this toggles which panel is visible and keeps keyboard support.
const tabs = [...document.querySelectorAll('[role="tab"]')];
const pages = [...document.querySelectorAll('[role="tabpanel"]')];

function activateTab(tab, moveFocus = false) {
  for (const item of tabs) {
    const selected = item === tab;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  }

  for (const page of pages) page.hidden = page.id !== tab.dataset.page;
  if (moveFocus) tab.focus();
}

for (const tab of tabs) {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(tab);
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    }
  });
}
