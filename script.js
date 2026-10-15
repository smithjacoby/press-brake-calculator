const calculatorForm = document.querySelector('#calculator-form');
const inputDefinitions = [
  { input: document.querySelector('#die-size'), error: document.querySelector('#die-error'), name: 'Die Size', allowZero: false },
  { input: document.querySelector('#piece-length'), error: document.querySelector('#piece-error'), name: 'Piece Length', allowZero: false },
  { input: document.querySelector('#bend-length'), error: document.querySelector('#bend-error'), name: 'Bend Length', allowZero: true }
];
const formError = document.querySelector('#form-error');
const output = document.querySelector('#x-value');
const resultDialog = document.querySelector('#x-result-dialog');
const settingsForm = document.querySelector('#settings-form');
const settingsStatus = document.querySelector('#settings-status');
const resetSettingsButton = document.querySelector('#reset-settings');
const settingsStorageKey = 'pressBrakeCalculatorSettings';
const settingDefinitions = [
  { key: 'homeX', input: document.querySelector('#setting-home-x'), error: document.querySelector('#setting-home-x-error'), name: 'Initial X home position' },
  { key: 'homeY', input: document.querySelector('#setting-home-y'), error: document.querySelector('#setting-home-y-error'), name: 'Initial Y home position' }
];
let currentSettings = loadSettings();

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
  for (const element of document.querySelectorAll('[data-setting]')) {
    element.textContent = formatMeasurement(currentSettings[element.dataset.setting]);
  }

}

function validateSetting(definition) {
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

function clearResults() {
  if (resultDialog.open) resultDialog.close();
  for (const selector of ['#breakdown-die', '#breakdown-piece', '#breakdown-bend', '#breakdown-move', '#breakdown-x']) {
    document.querySelector(selector).textContent = '--';
  }
  output.textContent = '--';
}

calculatorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.textContent = '';
  clearResults();

  const [dieSize, pieceLength, bendLength] = inputDefinitions.map(validateInput);
  if (dieSize === null || pieceLength === null || bendLength === null) {
    formError.textContent = 'Correct the highlighted measurements to calculate the X position.';
    calculatorForm.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  if (bendLength > pieceLength) {
    const bend = inputDefinitions[2];
    setError(bend, 'Bend Length cannot exceed Piece Length.');
    formError.textContent = 'Correct the highlighted measurement to calculate the X position.';
    bend.input.focus();
    return;
  }

  const { moveBack, xPosition } = window.PressBrakeCalculator.calculate(dieSize, pieceLength, bendLength);
  if (!Number.isFinite(moveBack) || !Number.isFinite(xPosition)) {
    formError.textContent = 'These measurements are outside the calculator range. Enter smaller finite values.';
    return;
  }

  document.querySelector('#breakdown-die').textContent = formatMeasurement(dieSize);
  document.querySelector('#breakdown-piece').textContent = formatMeasurement(pieceLength);
  document.querySelector('#breakdown-bend').textContent = formatMeasurement(bendLength);
  document.querySelector('#breakdown-move').textContent = formatMeasurement(moveBack);
  document.querySelector('#breakdown-x').textContent = formatMeasurement(xPosition);
  output.textContent = formatMeasurement(xPosition);
  resultDialog.showModal();
});

document.querySelector('#close-result').addEventListener('click', () => resultDialog.close());

for (const { input, error } of inputDefinitions) {
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    error.textContent = '';
    formError.textContent = '';
    clearResults();
  });
}

settingsForm.addEventListener('submit', (event) => {
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
  settingsStatus.textContent = 'Home positions saved. Displayed references now use these values.';
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
  settingsStatus.textContent = 'Default home positions restored.';
});

for (const { input, error } of settingDefinitions) {
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    error.textContent = '';
    settingsStatus.textContent = '';
  });
}

syncSettingsForm();
updateSettingReferences();

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
