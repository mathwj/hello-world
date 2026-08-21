const $ = (id) => document.getElementById(id);

const el = {
  brief: $('brief'),
  runButton: $('runButton'),
  cancelButton: $('cancelButton'),
  exportLink: $('exportLink'),
  sourceList: $('sourceList'),
  maxProfiles: $('maxProfiles'),
  maxProfilesOut: $('maxProfilesOut'),
  minScore: $('minScore'),
  minScoreOut: $('minScoreOut'),
  progressPanel: $('progressPanel'),
  progressFill: $('progressFill'),
  log: $('log'),
  criteriaPanel: $('criteriaPanel'),
  criteriaBody: $('criteriaBody'),
  warnings: $('warnings'),
  resultsSection: $('resultsSection'),
  resultsTitle: $('resultsTitle'),
  resultsStats: $('resultsStats'),
  results: $('results'),
  emptyState: $('emptyState'),
  modePill: $('modePill'),
};

let stream = null;
/** Candidates keyed by profile id, so live arrivals can be re-sorted in place. */
let live = new Map();

const VERDICT_LABEL = {
  strong_match: 'Strong match',
  possible_match: 'Possible',
  stretch: 'Stretch',
  not_a_match: 'Not a match',
};

// --- setup -----------------------------------------------------------------

async function loadConfig() {
  const response = await fetch('/api/config');
  const cfg = await response.json();

  el.sourceList.innerHTML = '';
  for (const source of cfg.sources) {
    const enabled = cfg.defaultSources.includes(source.id) && source.configured;
    const label = document.createElement('label');
    label.className = `source-item${source.configured ? '' : ' disabled'}`;
    label.innerHTML = `
      <input type="checkbox" value="${source.id}" ${enabled ? 'checked' : ''} ${source.configured ? '' : 'disabled'} />
      <span>
        <strong>${escapeHtml(source.label)}</strong>
        <small>${escapeHtml(source.description)}</small>
        ${source.configured ? '' : `<small>⚠ ${escapeHtml(source.configHint ?? 'Not configured')}</small>`}
      </span>`;
    el.sourceList.append(label);
  }

  el.modePill.hidden = false;
  if (cfg.analysisMode === 'model') {
    el.modePill.textContent = `Full analysis · ${cfg.model}`;
  } else {
    el.modePill.textContent = 'Keyword scoring only — set OPENAI_API_KEY';
    el.modePill.classList.add('warn');
  }

  el.maxProfiles.value = Math.min(cfg.maxProfiles, Number(el.maxProfiles.max));
  el.maxProfilesOut.textContent = el.maxProfiles.value;
}

for (const [range, out] of [
  [el.maxProfiles, el.maxProfilesOut],
  [el.minScore, el.minScoreOut],
]) {
  range.addEventListener('input', () => {
    out.textContent = range.value;
  });
}

for (const button of document.querySelectorAll('[data-example]')) {
  button.addEventListener('click', () => {
    el.brief.value = button.dataset.example;
    el.brief.focus();
  });
}

el.brief.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') run();
});
el.runButton.addEventListener('click', run);
el.cancelButton.addEventListener('click', () => {
  stream?.close();
  finishRun('Stopped.');
});

// --- run -------------------------------------------------------------------

function run() {
  const brief = el.brief.value.trim();
  if (!brief) {
    el.brief.focus();
    return;
  }

  const sources = [...el.sourceList.querySelectorAll('input:checked')].map((i) => i.value);
  if (sources.length === 0) {
    addLog('Select at least one source before running.', 'warn');
    el.progressPanel.hidden = false;
    return;
  }

  stream?.close();
  live = new Map();

  el.emptyState.hidden = true;
  el.progressPanel.hidden = false;
  el.criteriaPanel.hidden = true;
  el.warnings.hidden = true;
  el.warnings.innerHTML = '';
  el.resultsSection.hidden = true;
  el.results.innerHTML = '';
  el.log.innerHTML = '';
  el.exportLink.hidden = true;
  el.progressFill.style.width = '0%';
  el.runButton.disabled = true;
  el.cancelButton.hidden = false;

  const params = new URLSearchParams({
    brief,
    sources: sources.join(','),
    maxProfiles: el.maxProfiles.value,
    minScore: el.minScore.value,
  });

  stream = new EventSource(`/api/search/stream?${params}`);
  stream.onmessage = (event) => handleEvent(JSON.parse(event.data));
  stream.onerror = () => {
    if (el.runButton.disabled) {
      addLog('Connection to the server was lost.', 'err');
      finishRun('Interrupted.');
    }
    stream?.close();
  };
}

function handleEvent(event) {
  switch (event.type) {
    case 'stage':
      addLog(event.message);
      break;
    case 'criteria':
      renderCriteria(event.criteria);
      break;
    case 'sourced':
      addLog(`${event.source}: ${event.count} profile(s) added`);
      break;
    case 'analysed':
      el.progressFill.style.width = `${Math.round((event.done / event.total) * 100)}%`;
      addLog(`Analysed ${event.done}/${event.total} — ${event.name}`);
      break;
    case 'candidate':
      live.set(event.candidate.profile.id, event.candidate);
      renderResults([...live.values()]);
      break;
    case 'warning':
      addWarning(event.message);
      addLog(event.message, 'warn');
      break;
    case 'done':
      renderResults(event.result.candidates);
      renderStats(event.result);
      el.exportLink.href = `/api/runs/${event.result.runId}/export.csv`;
      el.exportLink.hidden = event.result.candidates.length === 0;
      finishRun('Done.');
      stream?.close();
      break;
    case 'error':
      addLog(event.message, 'err');
      addWarning(event.message);
      finishRun('Failed.');
      stream?.close();
      break;
  }
}

function finishRun(message) {
  addLog(message);
  el.runButton.disabled = false;
  el.cancelButton.hidden = true;
  el.progressFill.style.width = '100%';
}

// --- rendering -------------------------------------------------------------

function addLog(message, kind = '') {
  const item = document.createElement('li');
  if (kind) item.className = kind;
  item.textContent = message;
  el.log.append(item);
  el.log.scrollTop = el.log.scrollHeight;
}

function addWarning(message) {
  el.warnings.hidden = false;
  const div = document.createElement('div');
  div.className = 'warning';
  div.textContent = message;
  el.warnings.append(div);
}

function chips(values, accent = false) {
  return (values ?? [])
    .map((value) => `<span class="chip${accent ? ' accent' : ''}">${escapeHtml(value)}</span>`)
    .join('');
}

function renderCriteria(criteria) {
  const loc = criteria.location;
  const place = [loc.city, loc.region, loc.country].filter(Boolean).join(', ') || 'Anywhere';

  const blocks = [
    ['Target titles', `<div class="chips">${chips(criteria.targetTitles, true)}</div>`],
    ['Also considering', `<div class="chips">${chips(criteria.adjacentTitles)}</div>`],
  ];

  if (criteria.localLanguageTitles?.length) {
    blocks.push(['Local-language variants', `<div class="chips">${chips(criteria.localLanguageTitles)}</div>`]);
  }

  blocks.push([
    'Location',
    `<p>${escapeHtml(place)}${loc.remoteAcceptable ? ' · remote OK' : ''}</p>
     <div class="chips">${chips(loc.nearbyPlaces)}</div>`,
  ]);

  blocks.push([
    'Bar',
    `<p>${escapeHtml((criteria.targetSeniority ?? []).join(', ') || '—')} · ${criteria.minYearsExperience}+ yrs</p>`,
  ]);

  blocks.push([
    'Must have',
    `<div class="chips">${chips((criteria.mustHave ?? []).map((c) => `${c.label} · ${c.weight}`), true)}</div>`,
  ]);

  if (criteria.niceToHave?.length) {
    blocks.push(['Nice to have', `<div class="chips">${chips(criteria.niceToHave.map((c) => c.label))}</div>`]);
  }

  el.criteriaBody.innerHTML = `<div class="criteria-grid">${blocks
    .map(([title, body]) => `<div class="criteria-block"><h3>${title}</h3>${body}</div>`)
    .join('')}</div>`;
  el.criteriaPanel.hidden = false;
}

function renderResults(candidates) {
  const sorted = [...candidates].sort(
    (a, b) =>
      b.assessment.overallScore - a.assessment.overallScore ||
      b.assessment.confidence - a.assessment.confidence,
  );

  el.resultsSection.hidden = sorted.length === 0;
  el.resultsTitle.textContent = `Shortlist · ${sorted.length}`;
  el.results.innerHTML = sorted.map(renderCard).join('');
}

function renderStats(result) {
  const { stats } = result;
  el.resultsSection.hidden = false;
  el.resultsStats.textContent =
    `${stats.profilesSourced} sourced · ${stats.profilesAnalysed} analysed · ` +
    `${stats.shortlisted} shortlisted · ${(stats.durationMs / 1000).toFixed(1)}s · ` +
    `sources: ${stats.sourcesUsed.join(', ') || 'none'}`;
  if (result.candidates.length === 0) {
    el.results.innerHTML =
      '<p class="muted">Nobody cleared the minimum score. Lower the threshold, widen the sources, or loosen the brief.</p>';
  }
}

function renderCard({ profile, assessment }) {
  const name = profile.profileUrl
    ? `<a href="${escapeHtml(profile.profileUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(profile.fullName)}</a>`
    : escapeHtml(profile.fullName);

  const meta = [
    profile.location,
    `${assessment.yearsRelevantExperience} yrs relevant`,
    `confidence ${assessment.confidence}`,
    profile.synthetic ? 'demo data' : profile.source,
    assessment.scoredBy === 'heuristic' ? 'keyword score' : null,
  ].filter(Boolean);

  const evidence = (assessment.criteriaEvidence ?? [])
    .map(
      (item) => `
      <li>
        <span class="status ${item.status}">${item.status}</span>
        <span>
          <span class="label">${escapeHtml(item.label)}</span>
          ${item.evidence ? `<span class="quote">${escapeHtml(item.evidence)}</span>` : ''}
          ${item.sourceRef && item.sourceRef !== '—' ? `<span class="ref">${escapeHtml(item.sourceRef)}</span>` : ''}
        </span>
      </li>`,
    )
    .join('');

  const list = (items) =>
    items?.length ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '<p class="muted">—</p>';

  return `
    <article class="card">
      <div class="card-head">
        <div class="score-badge ${assessment.verdict}">${assessment.overallScore}</div>
        <div class="card-identity">
          <h3>${name}</h3>
          <p class="card-headline">${escapeHtml(profile.headline ?? '')}</p>
          <div class="card-meta">
            <span class="verdict ${assessment.verdict}">${VERDICT_LABEL[assessment.verdict] ?? assessment.verdict}</span>
            ${chips(meta)}
          </div>
        </div>
      </div>

      <div class="card-why">
        <strong>Why they make sense</strong>
        ${escapeHtml(assessment.whyTheyMakeSense)}
      </div>

      <ul class="evidence">${evidence}</ul>

      <details class="detail">
        <summary>Full analysis</summary>
        <div class="detail-body">
          <div><h4>Strengths</h4>${list(assessment.strengths)}</div>
          <div><h4>Gaps</h4>${list(assessment.gaps)}</div>
          <div class="flags"><h4>Check before contacting</h4>${list(assessment.redFlags)}</div>
          <div><h4>Title fit</h4><p>${escapeHtml(assessment.titleFit)}</p></div>
          <div><h4>Location fit</h4><p>${escapeHtml(assessment.locationFit)}</p></div>
          <div><h4>Seniority</h4><p>${escapeHtml(assessment.seniorityFit)}</p></div>
          <div><h4>Trajectory</h4><p>${escapeHtml(assessment.careerTrajectory)}</p></div>
          <div><h4>Education</h4><p>${escapeHtml(assessment.educationAnalysis)}</p></div>
          <div><h4>Outreach angle</h4><p>${escapeHtml(assessment.outreachAngle)}</p></div>
        </div>
      </details>
    </article>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
}

loadConfig().catch((error) => addWarning(`Could not load configuration: ${error.message}`));
