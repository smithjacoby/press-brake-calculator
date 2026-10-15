const calculatorForm = document.querySelector('#calculator-form');
const inputDefinitions = [
  { input: document.querySelector('#die-size'), error: document.querySelector('#die-error'), name: 'Die Size', allowZero: false },
  { input: document.querySelector('#piece-length'), error: document.querySelector('#piece-error'), name: 'Piece Length', allowZero: false },
  { input: document.querySelector('#bend-length'), error: document.querySelector('#bend-error'), name: 'Bend Length', allowZero: true }
];
const formError = document.querySelector('#form-error');
const output = document.querySelector('#x-value');
const resultDialog = document.querySelector('#x-result-dialog');

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
