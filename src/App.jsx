import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Lock,
  Menu,
  Moon,
  Pencil,
  Plus,
  Save,
  Sun,
  Train,
  Trash2,
  X
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const STORAGE_KEY = 'sistema-dormentes-rumo-v2-plano-marcelo-dias'
const THEME_KEY = 'sistema-dormentes-rumo-theme'

const STATUS = {
  bom: {
    label: 'Bom',
    short: 'B',
    score: 100,
    severity: 0,
    className: 'status-bom',
    color: '#0b3d6d',
    description: 'Dormente em condição de suporte e fixação, sem anomalia que comprometa bitola, apoio do trilho ou região de fixação.'
  },
  regular: {
    label: 'Regular',
    short: 'R',
    score: 50,
    severity: 1,
    className: 'status-regular',
    color: '#f2c94c',
    description: 'Dormente com degradação visual controlada, exigindo acompanhamento para não evoluir para condição crítica.'
  },
  inservivel: {
    label: 'Inservível',
    short: 'I',
    score: 0,
    severity: 2,
    className: 'status-inservivel',
    color: '#8b2323',
    description: 'Dormente que deve entrar em plano de substituição. Na prospecção, recebe uma pintura.'
  },
  ruina: {
    label: 'Ruína',
    short: 'RU',
    score: 0,
    severity: 3,
    className: 'status-ruina',
    color: '#3d0f0f',
    description: 'Dormente que deixou de cumprir suporte/fixação. Na prospecção, recebe duas pinturas.'
  }
}

const CHART_COLORS = {
  bom: '#0b3d6d',
  regular: '#f2c94c',
  inservivel: '#8b2323',
  ruina: '#3d0f0f',
  line: '#0b3d6d',
  green: '#24a36a',
  aqua: '#28a8e0',
  grid: '#d7e3ef',
  text: '#24435f'
}

const DARK_CHART_COLORS = {
  bom: '#58a9f5',
  regular: '#f2c94c',
  inservivel: '#ff8a8a',
  ruina: '#ff4d4d',
  line: '#58a9f5',
  green: '#58d68d',
  aqua: '#5bd7ff',
  grid: '#265178',
  text: '#d7ebff'
}

const today = () => new Date().toISOString().slice(0, 10)
const parseDate = (date) => new Date(`${date || today()}T00:00:00`)
const formatDate = (date) => date ? date.split('-').reverse().join('/') : ''
const daysBetween = (start, end) => Math.max(1, Math.round((parseDate(end) - parseDate(start)) / 86400000))

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

function normalizeStatus(status) {
  return STATUS[status] ? status : 'bom'
}

function buildSleepers(count) {
  return Array.from({ length: Math.max(1, Number(count) || 1) }, (_, index) => ({
    id: `D${String(index + 1).padStart(3, '0')}`,
    number: index + 1
  }))
}

function createInspection(sleepers, date = today(), notes = 'Inspeção inicial', locked = true) {
  const conditions = {}
  sleepers.forEach((sleeper) => {
    conditions[sleeper.id] = 'bom'
  })
  return { id: uid('insp'), date, notes, conditions, locked }
}

function createTrack(name = 'Trecho exemplo - Malha Central', count = 16) {
  const sleepers = buildSleepers(count)
  return {
    id: uid('trecho'),
    name,
    malha: 'Malha Central',
    equipment: '',
    responsible: 'Marcelo Dias / equipe',
    kmStart: 'km 123+000',
    kmEnd: 'km 123+500',
    sleeperMaterial: 'concreto',
    geometryType: 'tangente',
    trackClass: 'C.3',
    hasJointWeld: 'nao',
    jointSurroundingGood: 'sim',
    hasGaugeLoss: 'nao',
    hasSupportLoss: 'nao',
    sleeperCount: count,
    sleepers,
    inspections: [createInspection(sleepers, today(), 'Inspeção inicial', true)],
    notes: ''
  }
}

function addDays(date, days) {
  const d = parseDate(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function demoTracks() {
  const startDate = addDays(today(), -14 * 14)
  const trackNames = [
    'MC - Serra de Santos',
    'MC - Pátio Norte',
    'FN - Ramal Sul',
    'MP - Baixada Santista',
    'MC - Corredor Norte',
    'FN - Pátio Leste',
    'MS - Intercâmbio Sul',
    'MP - Travessia Urbana',
    'MC - Linha Principal 01',
    'FN - Serra Norte',
    'MP - Desvio Industrial',
    'MC - Ponte Seca',
    'FN - Ramal Armazém',
    'MS - Pátio Oeste',
    'MC - Acesso Terminal'
  ]
  const malhas = ['Malha Central', 'Ferronorte', 'Malha Paulista', 'Malha Sul']
  const notesByStep = [
    'Base inicial da prospecção',
    'Conferência visual sem alteração relevante',
    'Primeiros regulares pontuais',
    'Regulares adjacentes em acompanhamento',
    'Aumento de regulares no trecho',
    'Primeira evolução para inservível',
    'Acompanhar possível formação de malha',
    'Cluster curto identificado',
    'Expansão de dormentes inservíveis',
    'Verificar necessidade de programação',
    'Ponto crítico com nova ruína',
    'Revisão da marcação de prospecção',
    'Priorizar substituição no planejamento',
    'Conferência para apresentação gerencial',
    'Última leitura da série exemplo'
  ]

  function setIfExists(inspection, id, status) {
    if (Object.prototype.hasOwnProperty.call(inspection.conditions, id)) inspection.conditions[id] = status
  }

  return trackNames.map((name, trackIndex) => {
    const sleeperCount = 18 + (trackIndex % 5) * 2
    const track = createTrack(name, sleeperCount)
    track.malha = malhas[trackIndex % malhas.length]
    track.equipment = `Equipamento ${String(trackIndex + 1).padStart(2, '0')}`
    track.responsible = trackIndex % 3 === 0 ? 'Marcelo Dias / equipe' : 'Equipe de prospecção'
    track.geometryType = trackIndex % 4 === 1 ? 'curva' : 'tangente'
    track.sleeperMaterial = trackIndex % 5 === 2 ? 'madeira' : 'concreto'
    track.trackClass = ['C.2', 'C.3', 'C.4', 'C.5'][trackIndex % 4]
    track.kmStart = `km ${String(120 + trackIndex).padStart(3, '0')}+000`
    track.kmEnd = `km ${String(120 + trackIndex).padStart(3, '0')}+500`
    track.hasGaugeLoss = trackIndex % 4 === 0 ? 'sim' : 'nao'
    track.hasSupportLoss = trackIndex % 5 === 0 ? 'sim' : 'nao'
    track.hasJointWeld = trackIndex % 3 === 0 ? 'sim' : 'nao'
    track.jointSurroundingGood = trackIndex % 6 === 0 ? 'nao' : 'sim'
    track.notes = ''

    track.inspections = Array.from({ length: 15 }, (_, step) => {
      const inspection = createInspection(
        track.sleepers,
        addDays(startDate, step * 14),
        notesByStep[step],
        true
      )

      track.sleepers.forEach((sleeper) => {
        const seed = (trackIndex * 11 + sleeper.number * 7) % 19
        const regularAt = 2 + (seed % 6)
        const inservivelAt = regularAt + 3 + (seed % 3)
        const ruinaAt = inservivelAt + 3 + (seed % 4)
        let status = 'bom'
        if (step >= regularAt) status = 'regular'
        if (step >= inservivelAt) status = 'inservivel'
        if (step >= ruinaAt && (seed % 5 === 0 || trackIndex % 5 === 0)) status = 'ruina'
        inspection.conditions[sleeper.id] = status
      })

      // Força alguns agrupamentos para demonstrar clusters/malhas nos gráficos.
      if (step >= 6) {
        ;['D004', 'D005'].forEach((id) => setIfExists(inspection, id, 'inservivel'))
      }
      if (step >= 8 && trackIndex % 2 === 0) {
        ;['D006', 'D007'].forEach((id) => setIfExists(inspection, id, 'inservivel'))
      }
      if (step >= 10 && trackIndex % 3 === 0) {
        setIfExists(inspection, 'D006', 'ruina')
        setIfExists(inspection, 'D007', 'ruina')
        ;['D003', 'D008'].forEach((id) => setIfExists(inspection, id, 'regular'))
      }
      if (step >= 12 && trackIndex % 4 === 1) {
        ;['D010', 'D011', 'D012'].forEach((id) => setIfExists(inspection, id, 'inservivel'))
        setIfExists(inspection, 'D011', 'ruina')
      }

      return inspection
    })

    return track
  })
}

function ensureTrackShape(track, index = 0) {
  const sleeperCount = Math.max(1, Number(track?.sleeperCount || track?.sleepers?.length || 12))
  const sleepers = Array.isArray(track?.sleepers) && track.sleepers.length ? track.sleepers : buildSleepers(sleeperCount)
  const inspections = Array.isArray(track?.inspections) && track.inspections.length ? track.inspections : [createInspection(sleepers)]
  return {
    ...createTrack(`Trecho ${index + 1}`, sleeperCount),
    ...track,
    sleeperCount,
    sleepers,
    inspections: inspections.map((inspection) => ({
      id: inspection.id || uid('insp'),
      date: inspection.date || today(),
      notes: inspection.notes || '',
      locked: inspection.locked !== false,
      conditions: Object.fromEntries(sleepers.map((sleeper) => [
        sleeper.id,
        normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
      ]))
    }))
  }
}

function analyzeInspection(track, inspection, previousInspection = null) {
  const sleepers = track.sleepers || []
  const totals = { bom: 0, regular: 0, inservivel: 0, ruina: 0 }
  sleepers.forEach((sleeper) => {
    totals[normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')] += 1
  })

  const scoreSum = sleepers.reduce((sum, sleeper) => {
    const status = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
    return sum + STATUS[status].score
  }, 0)
  const desempenho = sleepers.length ? Math.round(scoreSum / sleepers.length) : 0

  let worsened = 0
  let improved = 0
  let newCritical = 0
  let newRuins = 0
  let speed = 0
  let days = 0

  if (previousInspection) {
    days = daysBetween(previousInspection.date, inspection.date)
    const previousScore = sleepers.reduce((sum, sleeper) => {
      const status = normalizeStatus(previousInspection.conditions?.[sleeper.id] || 'bom')
      return sum + STATUS[status].score
    }, 0) / Math.max(1, sleepers.length)
    sleepers.forEach((sleeper) => {
      const before = normalizeStatus(previousInspection.conditions?.[sleeper.id] || 'bom')
      const now = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
      if (STATUS[now].severity > STATUS[before].severity) worsened += 1
      if (STATUS[now].severity < STATUS[before].severity) improved += 1
      if ((now === 'inservivel' || now === 'ruina') && before !== 'inservivel' && before !== 'ruina') newCritical += 1
      if (now === 'ruina' && before !== 'ruina') newRuins += 1
    })
    speed = Number(((previousScore - desempenho) / days).toFixed(2))
  }

  const criticalStatuses = new Set(['inservivel', 'ruina'])
  const clusters = []
  let current = []
  sleepers.forEach((sleeper) => {
    const status = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
    if (criticalStatuses.has(status)) {
      current.push({ ...sleeper, status })
    } else if (current.length) {
      clusters.push(current)
      current = []
    }
  })
  if (current.length) clusters.push(current)

  const regularAdjacents = new Set()
  sleepers.forEach((sleeper, index) => {
    const status = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
    if (!criticalStatuses.has(status)) return
    ;[sleepers[index - 1], sleepers[index + 1]].forEach((neighbor) => {
      if (!neighbor) return
      const neighborStatus = normalizeStatus(inspection.conditions?.[neighbor.id] || 'bom')
      if (neighborStatus === 'regular') regularAdjacents.add(neighbor.id)
    })
  })

  const clusterDetails = clusters.map((items, index) => ({
    id: index + 1,
    start: items[0].id,
    end: items.at(-1).id,
    label: `${items[0].id}${items.length > 1 ? ` a ${items.at(-1).id}` : ''}`,
    total: items.length,
    inserviveis: items.filter((item) => item.status === 'inservivel').length,
    ruinas: items.filter((item) => item.status === 'ruina').length
  }))

  const critical = totals.inservivel + totals.ruina
  return {
    trackId: track.id,
    trackName: track.name,
    equipment: track.equipment,
    date: inspection.date,
    data: formatDate(inspection.date),
    notes: inspection.notes,
    Bom: totals.bom,
    Regular: totals.regular,
    Inservível: totals.inservivel,
    Ruína: totals.ruina,
    desempenho,
    criticalPercent: sleepers.length ? Number(((critical / sleepers.length) * 100).toFixed(1)) : 0,
    regularOrWorsePercent: sleepers.length ? Number((((totals.regular + critical) / sleepers.length) * 100).toFixed(1)) : 0,
    clustersCriticos: clusters.length,
    maiorMalhaCritica: clusterDetails.reduce((max, cluster) => Math.max(max, cluster.total), 0),
    clusterDetails,
    regularesAdjacentes: regularAdjacents.size,
    regularAdjacentsList: [...regularAdjacents].sort(),
    pinturasUma: totals.inservivel,
    pinturasDuas: totals.ruina,
    worsened,
    improved,
    newCritical,
    newRuins,
    daysSincePrevious: days,
    deteriorationSpeed: speed
  }
}

function analyzeTrack(track) {
  const inspections = [...(track.inspections || [])].sort((a, b) => parseDate(a.date) - parseDate(b.date))
  const rows = inspections.map((inspection, index) => analyzeInspection(track, inspection, inspections[index - 1]))
  const latest = rows.at(-1) || analyzeInspection(track, createInspection(track.sleepers || buildSleepers(1)))
  const initial = rows[0] || latest
  const totalDays = rows.length > 1 ? daysBetween(initial.date, latest.date) : 1
  const totalScoreDrop = Number(((initial.desempenho || 0) - (latest.desempenho || 0)).toFixed(1))
  const averageSpeed = Number((totalScoreDrop / totalDays).toFixed(2))

  let classification = 'Ótimo'
  if (latest.Ruína > 0 || latest.maiorMalhaCritica >= 3 || latest.criticalPercent >= 30 || latest.desempenho < 40) classification = 'Crítico'
  else if (latest.Inservível > 0 || latest.criticalPercent >= 10 || latest.regularOrWorsePercent >= 35 || latest.desempenho < 70) classification = 'Atenção'

  const sleeperTrend = (track.sleepers || []).map((sleeper) => {
    let currentStatus = 'bom'
    let degradationSteps = 0
    let criticalSince = null
    inspections.forEach((inspection, index) => {
      const status = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
      currentStatus = status
      const previous = inspections[index - 1]
      if (previous) {
        const before = normalizeStatus(previous.conditions?.[sleeper.id] || 'bom')
        const diff = STATUS[status].severity - STATUS[before].severity
        if (diff > 0) degradationSteps += diff
      }
      if ((status === 'inservivel' || status === 'ruina') && !criticalSince) criticalSince = inspection.date
    })
    return {
      id: sleeper.id,
      number: sleeper.number,
      currentStatus,
      degradationSteps,
      criticalSince,
      riskScore: STATUS[currentStatus].severity * 10 + degradationSteps
    }
  }).sort((a, b) => b.riskScore - a.riskScore || a.number - b.number)

  const riskIndex = Number(((100 - latest.desempenho) + latest.criticalPercent * 1.5 + latest.Inservível * 2.5 + latest.Ruína * 5 + latest.clustersCriticos * 4 + latest.regularesAdjacentes * 1.2 + Math.max(0, averageSpeed) * 15).toFixed(1))
  return {
    rows,
    latest,
    initial,
    totalDays,
    totalScoreDrop,
    averageSpeed,
    projectedDaysToCritical: averageSpeed > 0 ? Math.max(0, Math.round(latest.desempenho / averageSpeed)) : null,
    classification,
    riskIndex,
    sleeperTrend,
    worstSleepers: sleeperTrend.filter((item) => item.riskScore > 0).slice(0, 10)
  }
}

function getActionPlan(track, analytics) {
  const latest = analytics.latest
  const maxCluster = latest.maiorMalhaCritica || 0
  const isCurve = track.geometryType === 'curva'
  const gaugeLoss = track.hasGaugeLoss === 'sim'
  const supportLoss = track.hasSupportLoss === 'sim'
  const jointNeedsAction = track.hasJointWeld === 'sim' && track.jointSurroundingGood === 'nao'

  let priority = 'Monitorar'
  let deadline = 'Próxima rotina'
  let restriction = 'Sem restrição sugerida pelo sistema'
  let action = 'Manter acompanhamento periódico e comparar evolução na próxima inspeção.'
  let reason = 'Sem ruína, sem malha crítica relevante e sem perda de bitola/suporte cadastrada.'

  if (latest.Ruína > 0) {
    priority = 'Crítico gerencial'
    deadline = 'Tratativa imediata'
    restriction = 'Avaliar restrição operacional conforme condição real da via'
    action = 'Marcar ruína com duas pinturas, substituir o dormente em ruína e avaliar inservíveis/intercalados do agrupamento.'
    reason = 'Ruína indica perda de função de suporte/fixação e transfere esforço aos adjacentes.'
  } else if (gaugeLoss && supportLoss && ((isCurve && maxCluster >= 3) || (!isCurve && maxCluster >= 5))) {
    priority = 'P1'
    deadline = '24h / interdição programada'
    restriction = 'Interdição programada conforme avaliação local'
    action = 'Priorizar substituição da malha crítica e escalar para decisão operacional.'
    reason = 'Sequência com perda de bitola e suporte atingiu limite alto.'
  } else if (gaugeLoss && supportLoss && ((isCurve && maxCluster >= 2) || (!isCurve && maxCluster >= 3))) {
    priority = 'P2'
    deadline = '48h'
    restriction = 'Restrição 22 km/h até tratativa'
    action = 'Programar substituição em curto prazo e acompanhar evolução até execução.'
    reason = 'Sequência com perda de bitola e suporte atingiu limite médio.'
  } else if (gaugeLoss && !supportLoss && ((isCurve && maxCluster >= 2) || (!isCurve && maxCluster >= 5))) {
    priority = 'P3'
    deadline = '7 dias'
    restriction = 'Restrição 22 km/h até tratativa'
    action = 'Programar substituição e monitorar vencimento de prazo.'
    reason = 'Sequência com perda de bitola sem perda de suporte atingiu limite baixo.'
  } else if (latest.Inservível > 0 || latest.clustersCriticos > 0) {
    priority = 'Prospecção crítica'
    deadline = 'Planejar substituição'
    restriction = 'Avaliar restrição pela classe e condição local'
    action = 'Marcar inservíveis com uma pintura, quantificar por equipamento e acompanhar regulares adjacentes.'
    reason = 'Existem dormentes inservíveis ou agrupamentos a registrar no plano de substituição.'
  }

  if (jointNeedsAction) {
    action += ' Em junta/solda sem dormentes bons antes e depois, marcar dormentes para substituição com duas pinturas.'
    reason += ' Há junta/solda com entorno sem dormentes bons.'
  }

  return { priority, deadline, restriction, action, reason }
}

function escapeExcel(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}


function sanitizeFileName(value) {
  return String(value || 'arquivo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function statusCellStyle(statusKey) {
  const status = STATUS[normalizeStatus(statusKey)]
  const darkText = statusKey === 'regular'
  return `background:${status.color};color:${darkText ? '#111111' : '#ffffff'};font-weight:800;text-align:center;`
}

function buildInspectionGradeHtml(track, mode = 'pdf') {
  const sortedInspections = [...(track.inspections || [])].sort((a, b) => parseDate(a.date) - parseDate(b.date))
  const sleepers = track.sleepers || []
  const title = `Grade de inspeção de dormentes - ${escapeExcel(track.name)}`
  const sleeperHeaders = sleepers.map((sleeper) => `<th>${escapeExcel(sleeper.id)}</th>`).join('')
  const rows = sortedInspections.map((inspection) => {
    const cells = sleepers.map((sleeper) => {
      const key = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
      const content = mode === 'excel' ? STATUS[key].label : STATUS[key].short
      return `<td style="${statusCellStyle(key)}">${escapeExcel(content)}</td>`
    }).join('')
    return `<tr><td>${escapeExcel(formatDate(inspection.date))}</td><td>${escapeExcel(inspection.notes)}</td>${cells}</tr>`
  }).join('')

  const legend = Object.entries(STATUS).map(([key, status]) => `<span style="display:inline-block;margin:0 8px 8px 0;padding:6px 10px;border-radius:10px;${statusCellStyle(key)}">${escapeExcel(status.short)} - ${escapeExcel(status.label)}</span>`).join('')

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #123a63; margin: 18px; }
          h1 { margin: 0 0 8px; color: #083b6e; font-size: 22px; }
          h2 { margin: 18px 0 8px; color: #083b6e; font-size: 16px; }
          p { margin: 4px 0; }
          table { border-collapse: collapse; width: 100%; font-size: 11px; }
          th, td { border: 1px solid #9eb8d2; padding: 6px; white-space: nowrap; }
          th { background: #eaf3fb; color: #083b6e; font-weight: 800; }
          .meta { margin: 12px 0 14px; padding: 10px; border: 1px solid #d7e3ef; border-radius: 10px; background: #f6fbff; }
          .legend { margin: 10px 0 14px; }
          @media print {
            body { margin: 10mm; }
            table { font-size: 9px; }
            th, td { padding: 4px; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          <p><strong>Trecho:</strong> ${escapeExcel(track.name)}</p>
          <p><strong>KM:</strong> ${escapeExcel(track.kmStart)} até ${escapeExcel(track.kmEnd)}</p>
          <p><strong>Malha:</strong> ${escapeExcel(track.malha)} &nbsp; <strong>Equipamento:</strong> ${escapeExcel(track.equipment)}</p>
          <p><strong>Responsável:</strong> ${escapeExcel(track.responsible)} &nbsp; <strong>Material:</strong> ${escapeExcel(track.sleeperMaterial)}</p>
        </div>
        <div class="legend">${legend}</div>
        <h2>Grade de inspeção</h2>
        <table>
          <thead><tr><th>Data</th><th>Observação</th>${sleeperHeaders}</tr></thead>
          <tbody>${rows || '<tr><td colspan="2">Sem inspeções registradas.</td></tr>'}</tbody>
        </table>
      </body>
    </html>
  `
}

function getFilteredTrackIds(tracks, selectedDashboardTrack) {
  return selectedDashboardTrack === 'all' ? tracks.map((track) => track.id) : [selectedDashboardTrack]
}

function buildDashboardRows(tracks, selectedDashboardTrack, startDate, endDate) {
  const trackIds = new Set(getFilteredTrackIds(tracks, selectedDashboardTrack))
  return tracks
    .filter((track) => trackIds.has(track.id))
    .flatMap((track) => analyzeTrack(track).rows)
    .filter((row) => !startDate || parseDate(row.date) >= parseDate(startDate))
    .filter((row) => !endDate || parseDate(row.date) <= parseDate(endDate))
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
}

function groupRowsByDate(rows, conditionFilter = 'all') {
  const grouped = new Map()
  rows.forEach((row) => {
    const key = row.date
    const current = grouped.get(key) || {
      date: key,
      data: formatDate(key),
      Bom: 0,
      Regular: 0,
      Inservível: 0,
      Ruína: 0,
      desempenhoTotal: 0,
      desempenhoCount: 0,
      criticalPercentTotal: 0,
      criticalPercentCount: 0,
      clustersCriticos: 0,
      maiorMalhaCritica: 0,
      pinturasUma: 0,
      pinturasDuas: 0,
      regularesAdjacentes: 0,
      newCritical: 0,
      newRuins: 0
    }
    current.Bom += row.Bom
    current.Regular += row.Regular
    current.Inservível += row.Inservível
    current.Ruína += row.Ruína
    current.desempenhoTotal += row.desempenho
    current.desempenhoCount += 1
    current.criticalPercentTotal += row.criticalPercent
    current.criticalPercentCount += 1
    current.clustersCriticos += row.clustersCriticos
    current.maiorMalhaCritica = Math.max(current.maiorMalhaCritica, row.maiorMalhaCritica)
    current.pinturasUma += row.pinturasUma
    current.pinturasDuas += row.pinturasDuas
    current.regularesAdjacentes += row.regularesAdjacentes
    current.newCritical += row.newCritical
    current.newRuins += row.newRuins
    grouped.set(key, current)
  })
  return [...grouped.values()].map((row) => ({
    ...row,
    desempenho: row.desempenhoCount ? Math.round(row.desempenhoTotal / row.desempenhoCount) : 0,
    criticalPercent: row.criticalPercentCount ? Number((row.criticalPercentTotal / row.criticalPercentCount).toFixed(1)) : 0,
    condicaoFiltrada: conditionFilter === 'all' ? row.Bom + row.Regular + row.Inservível + row.Ruína : row[STATUS[conditionFilter].label]
  }))
}

function Metric({ icon, title, value, detail }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="chart-card">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {children}
    </div>
  )
}

function EmptyHint({ children }) {
  return <p className="empty-hint">{children}</p>
}

export default function App() {
  const [tracks, setTracks] = useState(() => [createTrack()])
  const [selectedTrackId, setSelectedTrackId] = useState(null)
  const [newInspectionDate, setNewInspectionDate] = useState(today())
  const [activeTab, setActiveTab] = useState('trechos')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark')
  const [savedAt, setSavedAt] = useState('')
  const [dashboardTrack, setDashboardTrack] = useState('all')
  const [dashboardStart, setDashboardStart] = useState('')
  const [dashboardEnd, setDashboardEnd] = useState('')
  const [conditionFilter, setConditionFilter] = useState('all')

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (Array.isArray(data.tracks) && data.tracks.length) {
        const nextTracks = data.tracks.map(ensureTrackShape)
        setTracks(nextTracks)
        setSelectedTrackId(data.selectedTrackId || nextTracks[0].id)
        setSavedAt(data.savedAt || '')
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!selectedTrackId && tracks.length) setSelectedTrackId(tracks[0].id)
  }, [tracks, selectedTrackId])

  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) || tracks[0]
  const selectedAnalysis = useMemo(() => analyzeTrack(selectedTrack), [selectedTrack])
  const ranking = useMemo(() => tracks.map((track) => ({ track, analytics: analyzeTrack(track) })).sort((a, b) => b.analytics.riskIndex - a.analytics.riskIndex), [tracks])
  const actionPlan = useMemo(() => getActionPlan(selectedTrack, selectedAnalysis), [selectedTrack, selectedAnalysis])
  const chartColors = theme === 'dark' ? DARK_CHART_COLORS : CHART_COLORS
  const dashboardRows = useMemo(() => buildDashboardRows(tracks, dashboardTrack, dashboardStart, dashboardEnd), [tracks, dashboardTrack, dashboardStart, dashboardEnd])
  const dashboardGrouped = useMemo(() => groupRowsByDate(dashboardRows, conditionFilter), [dashboardRows, conditionFilter])
  const dashboardTotals = useMemo(() => dashboardRows.reduce((acc, row) => {
    acc.Bom += row.Bom
    acc.Regular += row.Regular
    acc.Inservível += row.Inservível
    acc.Ruína += row.Ruína
    acc.clusters += row.clustersCriticos
    acc.pinturasUma += row.pinturasUma
    acc.pinturasDuas += row.pinturasDuas
    acc.regularesAdjacentes += row.regularesAdjacentes
    acc.desempenhoTotal += row.desempenho
    acc.count += 1
    return acc
  }, { Bom: 0, Regular: 0, Inservível: 0, Ruína: 0, clusters: 0, pinturasUma: 0, pinturasDuas: 0, regularesAdjacentes: 0, desempenhoTotal: 0, count: 0 }), [dashboardRows])
  const dashboardScore = dashboardTotals.count ? Math.round(dashboardTotals.desempenhoTotal / dashboardTotals.count) : 0

  function updateTrack(patch) {
    setTracks((current) => current.map((track) => track.id === selectedTrack.id ? { ...track, ...patch } : track))
  }

  function addTrack() {
    const next = createTrack(`Novo trecho ${tracks.length + 1}`, 16)
    setTracks((current) => [...current, next])
    setSelectedTrackId(next.id)
    setActiveTab('trechos')
  }

  function removeTrack(trackId) {
    if (tracks.length === 1) return
    const nextTracks = tracks.filter((track) => track.id !== trackId)
    setTracks(nextTracks)
    if (selectedTrackId === trackId) setSelectedTrackId(nextTracks[0].id)
  }

  function applySleeperCount() {
    const count = Math.max(1, Math.min(300, Number(selectedTrack.sleeperCount) || 1))
    const sleepers = buildSleepers(count)
    setTracks((current) => current.map((track) => {
      if (track.id !== selectedTrack.id) return track
      const previous = [...(track.inspections || [])].sort((a, b) => parseDate(a.date) - parseDate(b.date)).at(-1)
      const conditions = {}
      sleepers.forEach((sleeper) => {
        conditions[sleeper.id] = normalizeStatus(previous?.conditions?.[sleeper.id] || 'bom')
      })
      return {
        ...track,
        sleeperCount: count,
        sleepers,
        inspections: [{ id: uid('insp'), date: today(), notes: 'Quantidade de dormentes atualizada', conditions, locked: true }]
      }
    }))
  }

  function addInspection() {
    const sorted = [...selectedTrack.inspections].sort((a, b) => parseDate(a.date) - parseDate(b.date))
    const previous = sorted.at(-1)
    const conditions = {}
    selectedTrack.sleepers.forEach((sleeper) => {
      conditions[sleeper.id] = normalizeStatus(previous?.conditions?.[sleeper.id] || 'bom')
    })
    setTracks((current) => current.map((track) => track.id === selectedTrack.id
      ? { ...track, inspections: [...track.inspections, { id: uid('insp'), date: newInspectionDate || today(), notes: 'Nova ida ao trecho', conditions, locked: false }] }
      : track
    ))
  }

  function deleteInspection(inspectionId) {
    if (selectedTrack.inspections.length === 1) return
    setTracks((current) => current.map((track) => track.id === selectedTrack.id
      ? { ...track, inspections: track.inspections.filter((inspection) => inspection.id !== inspectionId) }
      : track
    ))
  }

  function updateInspection(inspectionId, patch) {
    setTracks((current) => current.map((track) => track.id === selectedTrack.id
      ? { ...track, inspections: track.inspections.map((inspection) => inspection.id === inspectionId ? { ...inspection, ...patch } : inspection) }
      : track
    ))
  }

  function updateCell(inspectionId, sleeperId, status) {
    setTracks((current) => current.map((track) => track.id === selectedTrack.id
      ? {
          ...track,
          inspections: track.inspections.map((inspection) => {
            if (inspection.id !== inspectionId || inspection.locked) return inspection
            return { ...inspection, conditions: { ...inspection.conditions, [sleeperId]: status } }
          })
        }
      : track
    ))
  }

  function saveData() {
    const timestamp = new Date().toLocaleString('pt-BR')
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tracks, selectedTrackId, savedAt: timestamp }))
    setSavedAt(timestamp)
  }

  function loadDemo() {
    const demo = demoTracks()
    setTracks(demo)
    setSelectedTrackId(demo[0].id)
    setDashboardTrack('all')
    setSavedAt('')
    setActiveTab('dashboard')
  }

  function exportExcel() {
    const rows = dashboardRows.map((row) => `
      <tr><td>${escapeExcel(row.trackName)}</td><td>${escapeExcel(row.equipment)}</td><td>${escapeExcel(row.data)}</td><td>${row.Bom}</td><td>${row.Regular}</td><td>${row.Inservível}</td><td>${row.Ruína}</td><td>${row.desempenho}</td><td>${row.criticalPercent}%</td><td>${row.clustersCriticos}</td><td>${row.maiorMalhaCritica}</td><td>${row.pinturasUma}</td><td>${row.pinturasDuas}</td><td>${row.regularesAdjacentes}</td><td>${escapeExcel(row.notes)}</td></tr>
    `).join('')
    const rankingRows = ranking.map((item, index) => `
      <tr><td>${index + 1}</td><td>${escapeExcel(item.track.name)}</td><td>${escapeExcel(item.track.equipment)}</td><td>${item.analytics.classification}</td><td>${item.analytics.latest.desempenho}</td><td>${item.analytics.latest.Inservível}</td><td>${item.analytics.latest.Ruína}</td><td>${item.analytics.latest.clustersCriticos}</td><td>${item.analytics.riskIndex}</td></tr>
    `).join('')
    const html = `
      <html><head><meta charset="UTF-8" /></head><body>
        <h1>Dashboard de dormentes - Marcelo Dias</h1>
        <p><strong>Filtro de trecho:</strong> ${dashboardTrack === 'all' ? 'Todos' : escapeExcel(tracks.find((t) => t.id === dashboardTrack)?.name || '')}</p>
        <p><strong>Período:</strong> ${dashboardStart ? formatDate(dashboardStart) : 'início'} até ${dashboardEnd ? formatDate(dashboardEnd) : 'fim'}</p>
        <h2>Dados filtrados</h2>
        <table border="1"><tr><th>Trecho</th><th>Equipamento</th><th>Data</th><th>Bom</th><th>Regular</th><th>Inservível</th><th>Ruína</th><th>Desempenho</th><th>% Crítico</th><th>Malhas</th><th>Maior malha</th><th>1 pintura</th><th>2 pinturas</th><th>Regulares adj.</th><th>Observação</th></tr>${rows}</table>
        <h2>Ranking de trechos</h2>
        <table border="1"><tr><th>#</th><th>Trecho</th><th>Equipamento</th><th>Classificação</th><th>Desempenho</th><th>Inservíveis</th><th>Ruína</th><th>Malhas</th><th>Risco</th></tr>${rankingRows}</table>
      </body></html>`
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'dashboard-dormentes-marcelo-dias.xls'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function printDashboardPDF() {
    setActiveTab('dashboard')
    setTimeout(() => window.print(), 150)
  }

  function exportInspectionGradeExcel() {
    const html = buildInspectionGradeHtml(selectedTrack, 'excel')
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `grade-inspecao-${sanitizeFileName(selectedTrack.name)}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function printInspectionGradePDF() {
    const html = buildInspectionGradeHtml(selectedTrack, 'pdf')
    const frame = document.createElement('iframe')
    frame.style.position = 'fixed'
    frame.style.right = '0'
    frame.style.bottom = '0'
    frame.style.width = '0'
    frame.style.height = '0'
    frame.style.border = '0'
    document.body.appendChild(frame)
    const doc = frame.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()
    setTimeout(() => {
      frame.contentWindow.focus()
      frame.contentWindow.print()
      setTimeout(() => document.body.removeChild(frame), 1200)
    }, 250)
  }

  const tabItems = [
    { id: 'trechos', label: 'Registro de trechos', icon: Train },
    { id: 'inspecao', label: 'Inspeção', icon: ClipboardList },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'procedimentos', label: 'Procedimentos', icon: BookOpen }
  ]

  return (
    <main className="app">
      <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar no-print ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div>
            <strong>Menu principal</strong>
            <p>Fluxo de trabalho: registre locais, inspecione, depois apresente no dashboard.</p>
          </div>
          <button className="ghost sidebar-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <nav className="nav-menu">
          {tabItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={`nav-button ${activeTab === item.id ? 'active' : ''}`} onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}>
                <Icon size={18} /> {item.label}
              </button>
            )
          })}
        </nav>
        <section className="sidebar-section">
          <h3>Trecho ativo</h3>
          <select value={selectedTrack?.id || ''} onChange={(e) => setSelectedTrackId(e.target.value)}>
            {tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
          </select>
          <p className="muted">O trecho ativo é usado por padrão na aba de inspeção.</p>
          <button className="full outline" onClick={addTrack}><Plus size={16} /> Novo trecho</button>
        </section>
      </aside>

      <header className="hero no-print">
        <div className="hero-copy">
          <div className="hero-menu-row">
            <button className="menu-trigger outline" onClick={() => setSidebarOpen(true)}><Menu size={18} /> Menu</button>
            <button className="theme-toggle outline" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            </button>
          </div>
          <span className="eyebrow"><Train size={16} /> Prospecção de dormentes • Rumo</span>
          <h1>Controle de degradação de dormentes</h1>
          <p>Ferramenta para Marcelo Dias registrar trechos, comparar idas ao mesmo local, identificar malhas críticas e gerar apresentação gerencial com dados filtráveis.</p>
          <div className="hero-tags">
            <span>{selectedTrack?.name}</span>
            <span>{selectedTrack?.kmStart} até {selectedTrack?.kmEnd}</span>
            <span>{selectedTrack?.sleeperCount} dormentes</span>
          </div>
        </div>
      </header>

      <section className="quick-save no-print">
        <div>
          <strong>{savedAt ? `Último salvamento: ${savedAt}` : 'Dados ainda não salvos nesta sessão'}</strong>
          <p>Os dados ficam neste navegador. Salve depois de registrar ou editar inspeções.</p>
        </div>
        <div className="actions">
          <button onClick={saveData}><Save size={16} /> Salvar</button>
          <button className="outline" onClick={loadDemo}>Carregar exemplo</button>
        </div>
      </section>

      <section className="content">
        {activeTab === 'trechos' && (
          <section className="panel no-print">
            <div className="section-head">
              <div>
                <span className="section-kicker">Cadastro base</span>
                <h2>Registro de locais / trechos</h2>
                <p className="muted">Cadastre aqui as informações que serão reutilizadas na inspeção e no dashboard.</p>
              </div>
              <button onClick={addTrack}><Plus size={16} /> Adicionar trecho</button>
            </div>
            <div className="track-management">
              <aside className="track-list-card">
                {tracks.map((track) => {
                  const analysis = analyzeTrack(track)
                  return (
                    <button key={track.id} className={`track-button ${track.id === selectedTrack.id ? 'active' : ''}`} onClick={() => setSelectedTrackId(track.id)}>
                      <strong>{track.name}</strong>
                      <span>{track.kmStart} até {track.kmEnd}</span>
                      <small>{analysis.classification} • risco {analysis.riskIndex}</small>
                    </button>
                  )
                })}
              </aside>
              <div className="track-form">
                <div className="form-grid form-grid-expanded">
                  <label>Nome do trecho<input value={selectedTrack.name} onChange={(e) => updateTrack({ name: e.target.value })} /></label>
                  <label>Responsável / equipe<input value={selectedTrack.responsible || ''} onChange={(e) => updateTrack({ responsible: e.target.value })} /></label>
                  <label>Malha<select value={selectedTrack.malha || 'Malha Central'} onChange={(e) => updateTrack({ malha: e.target.value })}><option>Malha Central</option><option>Ferronorte</option><option>Malha Paulista</option><option>Outra</option></select></label>
                  <label>Material<select value={selectedTrack.sleeperMaterial || 'concreto'} onChange={(e) => updateTrack({ sleeperMaterial: e.target.value })}><option value="concreto">Concreto</option><option value="madeira">Madeira</option><option value="aco">Aço</option><option value="polimero">Polímero</option></select></label>
                  <label>Traçado<select value={selectedTrack.geometryType || 'tangente'} onChange={(e) => updateTrack({ geometryType: e.target.value })}><option value="tangente">Tangente</option><option value="curva">Curva</option></select></label>
                  <label>Classe<input value={selectedTrack.trackClass || ''} onChange={(e) => updateTrack({ trackClass: e.target.value })} placeholder="Ex.: C.3" /></label>
                  <label>KM inicial<input value={selectedTrack.kmStart || ''} onChange={(e) => updateTrack({ kmStart: e.target.value })} /></label>
                  <label>KM final<input value={selectedTrack.kmEnd || ''} onChange={(e) => updateTrack({ kmEnd: e.target.value })} /></label>
                  <label>Quantidade de dormentes<span className="input-with-button"><input type="number" min="1" max="300" value={selectedTrack.sleeperCount} onChange={(e) => updateTrack({ sleeperCount: e.target.value })} /><button onClick={applySleeperCount}>Aplicar</button></span></label>
                </div>
                <label className="full-label compact-notes">Observações do local<textarea rows={2} placeholder="Observações rápidas do local" value={selectedTrack.notes || ''} onChange={(e) => updateTrack({ notes: e.target.value })} /></label>
                <button className="danger outline" disabled={tracks.length === 1} onClick={() => removeTrack(selectedTrack.id)}><Trash2 size={16} /> Excluir trecho selecionado</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'inspecao' && (
          <>
            <section className="panel no-print">
              <div className="section-head">
                <div>
                  <span className="section-kicker">Campo</span>
                  <h2>Inspeção de dormentes</h2>
                  <p className="muted">Escolha o trecho cadastrado e registre a condição dos mesmos dormentes ao longo das idas ao local.</p>
                </div>
              </div>
              <div className="inspection-top-grid">
                <label>Trecho para trabalhar<select value={selectedTrack.id} onChange={(e) => setSelectedTrackId(e.target.value)}>{tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}</select></label>
                <label>Data da nova linha<input type="date" value={newInspectionDate} onChange={(e) => setNewInspectionDate(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} /></label>
                <button onClick={addInspection}><Plus size={16} /> Adicionar dia de serviço</button>
              </div>
              <div className="legend legend-large">
                {Object.entries(STATUS).map(([key, status]) => <span key={key} className={status.className}>{status.label}</span>)}
              </div>
            </section>

            <section className="panel report-section">
              <div className="section-head compact-head">
                <div>
                  <h2>Grade de inspeção</h2>
                  <p className="muted">Cada linha é uma ida ao trecho. Cada coluna é um dormente. Para evitar esbarrão no celular, a linha só altera depois de clicar em <strong>Editar linha</strong>.</p>
                </div>
                <div className="actions no-print">
                  <button className="success" onClick={exportInspectionGradeExcel}><FileSpreadsheet size={16} /> Excel da grade</button>
                  <button className="danger" onClick={printInspectionGradePDF}><FileText size={16} /> PDF da grade</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="inspection-table">
                  <thead>
                    <tr>
                      <th className="sticky-col">Ação</th>
                      <th>Data</th>
                      <th>Observação</th>
                      {selectedTrack.sleepers.map((sleeper) => <th key={sleeper.id}>{sleeper.id}</th>)}
                      <th>Excluir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedTrack.inspections].sort((a, b) => parseDate(a.date) - parseDate(b.date)).map((inspection) => (
                      <tr key={inspection.id} className={inspection.locked ? 'locked-row' : 'editing-row'}>
                        <td className="sticky-col action-cell">
                          <button className={inspection.locked ? 'outline' : 'success'} onClick={() => updateInspection(inspection.id, { locked: !inspection.locked })}>
                            {inspection.locked ? <Pencil size={15} /> : <Lock size={15} />} {inspection.locked ? 'Editar' : 'Bloquear'}
                          </button>
                        </td>
                        <td><input type="date" disabled={inspection.locked} value={inspection.date} onChange={(e) => updateInspection(inspection.id, { date: e.target.value })} onClick={(e) => e.currentTarget.showPicker?.()} /></td>
                        <td><input disabled={inspection.locked} value={inspection.notes} onChange={(e) => updateInspection(inspection.id, { notes: e.target.value })} /></td>
                        {selectedTrack.sleepers.map((sleeper) => {
                          const current = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
                          return (
                            <td key={sleeper.id}>
                              <div className="cell-stack">
                                {Object.entries(STATUS).map(([statusKey, status]) => (
                                  <button key={statusKey} disabled={inspection.locked} className={`cell-option ${status.className} ${current === statusKey ? 'active' : ''}`} onClick={() => updateCell(inspection.id, sleeper.id, statusKey)} title={status.label}>{status.short}</button>
                                ))}
                              </div>
                            </td>
                          )
                        })}
                        <td><button className="ghost" disabled={selectedTrack.inspections.length === 1 || inspection.locked} onClick={() => deleteInspection(inspection.id)}><Trash2 size={15} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === 'dashboard' && (
          <section className="dashboard-report report-section">
            <section className="panel no-print dashboard-controls">
              <div>
                <span className="section-kicker">Apresentação gerencial</span>
                <h2>Dashboard filtrável</h2>
                <p className="muted">Use os filtros para montar a apresentação por trecho, período e condição do dormente.</p>
              </div>
              <div className="dashboard-filter-grid">
                <label>Trecho<select value={dashboardTrack} onChange={(e) => setDashboardTrack(e.target.value)}><option value="all">Todos os trechos</option>{tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}</select></label>
                <label>Data inicial<input type="date" value={dashboardStart} onChange={(e) => setDashboardStart(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} /></label>
                <label>Data final<input type="date" value={dashboardEnd} onChange={(e) => setDashboardEnd(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} /></label>
                <label>Condição no gráfico<select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)}><option value="all">Todas</option>{Object.entries(STATUS).map(([key, status]) => <option key={key} value={key}>{status.label}</option>)}</select></label>
              </div>
              <div className="actions dashboard-actions">
                <button onClick={exportExcel}><FileSpreadsheet size={16} /> Exportar Excel</button>
                <button className="danger" onClick={printDashboardPDF}><FileText size={16} /> PDF de apresentação</button>
              </div>
            </section>

            <section className="metrics">
              <Metric icon={<BarChart3 />} title="Desempenho médio" value={`${dashboardScore}/100`} detail="Média das inspeções filtradas" />
              <Metric icon={<AlertTriangle />} title="Críticos" value={`${dashboardTotals.Inservível + dashboardTotals.Ruína}`} detail="Inservível + Ruína" />
              <Metric icon={<Train />} title="Malhas críticas" value={dashboardTotals.clusters} detail="Clusters de inservível/ruína" />
              <Metric icon={<CheckCircle2 />} title="Marcações" value={`${dashboardTotals.pinturasUma}/${dashboardTotals.pinturasDuas}`} detail="1 pintura / 2 pinturas" />
            </section>

            <section className="panel report-section action-plan-card">
              <div>
                <span className="section-kicker">Plano sugerido do trecho ativo</span>
                <h2>{actionPlan.priority} • {actionPlan.deadline}</h2>
                <p className="analysis-text"><strong>Ação:</strong> {actionPlan.action}</p>
              </div>
              <div className="action-plan-meta"><span><strong>Restrição</strong>{actionPlan.restriction}</span><span><strong>Motivo</strong>{actionPlan.reason}</span></div>
            </section>

            {dashboardGrouped.length === 0 ? <EmptyHint>Nenhum dado encontrado para os filtros selecionados.</EmptyHint> : (
              <section className="charts">
                <ChartCard title="Evolução do desempenho" subtitle="Queda da nota indica degradação do trecho ao longo das idas.">
                  <ResponsiveContainer width="100%" height={280}><LineChart data={dashboardGrouped}><CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" /><XAxis dataKey="data" stroke={chartColors.text} /><YAxis domain={[0, 100]} stroke={chartColors.text} /><Tooltip /><Legend /><Line type="monotone" dataKey="desempenho" name="Desempenho" stroke={chartColors.line} strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Composição por condição" subtitle="Bom, Regular, Inservível e Ruína, conforme classificação de campo.">
                  <ResponsiveContainer width="100%" height={280}><AreaChart data={dashboardGrouped}><CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" /><XAxis dataKey="data" stroke={chartColors.text} /><YAxis stroke={chartColors.text} allowDecimals={false} /><Tooltip /><Legend /><Area type="monotone" dataKey="Bom" stackId="1" stroke={chartColors.bom} fill={chartColors.bom} fillOpacity={0.75} /><Area type="monotone" dataKey="Regular" stackId="1" stroke={chartColors.regular} fill={chartColors.regular} fillOpacity={0.75} /><Area type="monotone" dataKey="Inservível" stackId="1" stroke={chartColors.inservivel} fill={chartColors.inservivel} fillOpacity={0.78} /><Area type="monotone" dataKey="Ruína" stackId="1" stroke={chartColors.ruina} fill={chartColors.ruina} fillOpacity={0.85} /></AreaChart></ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Taxa crítica" subtitle="Percentual de dormentação inservível/ruína dentro do filtro.">
                  <ResponsiveContainer width="100%" height={280}><LineChart data={dashboardGrouped}><CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" /><XAxis dataKey="data" stroke={chartColors.text} /><YAxis stroke={chartColors.text} /><Tooltip /><Legend /><Line type="monotone" dataKey="criticalPercent" name="% crítico" stroke={chartColors.inservivel} strokeWidth={3} /></LineChart></ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Condição filtrada" subtitle="Mostra somente a condição escolhida nos filtros do dashboard.">
                  <ResponsiveContainer width="100%" height={280}><BarChart data={dashboardGrouped}><CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" /><XAxis dataKey="data" stroke={chartColors.text} /><YAxis stroke={chartColors.text} allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="condicaoFiltrada" name={conditionFilter === 'all' ? 'Todas as condições' : STATUS[conditionFilter].label} fill={conditionFilter === 'all' ? chartColors.line : chartColors[conditionFilter]} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Malhas / clusters" subtitle="Sequências de dormentes em condição crítica.">
                  <ResponsiveContainer width="100%" height={280}><BarChart data={dashboardGrouped}><CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" /><XAxis dataKey="data" stroke={chartColors.text} /><YAxis stroke={chartColors.text} allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="clustersCriticos" name="Malhas críticas" fill={chartColors.line} radius={[8, 8, 0, 0]} /><Bar dataKey="maiorMalhaCritica" name="Maior malha" fill={chartColors.aqua} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Marcação de prospecção" subtitle="Uma pintura para inservível e duas pinturas para ruína.">
                  <ResponsiveContainer width="100%" height={280}><BarChart data={dashboardGrouped}><CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" /><XAxis dataKey="data" stroke={chartColors.text} /><YAxis stroke={chartColors.text} allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="pinturasUma" name="1 pintura" fill={chartColors.inservivel} radius={[8, 8, 0, 0]} /><Bar dataKey="pinturasDuas" name="2 pinturas" fill={chartColors.ruina} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
                </ChartCard>
              </section>
            )}

            <section className="split report-section">
              <div className="panel">
                <h2>Ranking de trechos</h2>
                <div className="table-wrap compact"><table><thead><tr><th>#</th><th>Trecho</th><th>Classe</th><th>Desemp.</th><th>I</th><th>RU</th><th>Malhas</th><th>Risco</th></tr></thead><tbody>{ranking.map((item, index) => <tr key={item.track.id} className={item.track.id === selectedTrack.id ? 'highlight-row' : ''}><td>{index + 1}</td><td>{item.track.name}</td><td>{item.analytics.classification}</td><td>{item.analytics.latest.desempenho}</td><td>{item.analytics.latest.Inservível}</td><td>{item.analytics.latest.Ruína}</td><td>{item.analytics.latest.clustersCriticos}</td><td>{item.analytics.riskIndex}</td></tr>)}</tbody></table></div>
              </div>
              <div className="panel">
                <h2>Piores dormentes do trecho ativo</h2>
                <div className="table-wrap compact"><table><thead><tr><th>Dormente</th><th>Status</th><th>Pioras</th><th>Crítico desde</th></tr></thead><tbody>{selectedAnalysis.worstSleepers.length ? selectedAnalysis.worstSleepers.map((item) => <tr key={item.id}><td>{item.id}</td><td>{STATUS[item.currentStatus].label}</td><td>{item.degradationSteps}</td><td>{item.criticalSince ? formatDate(item.criticalSince) : '-'}</td></tr>) : <tr><td colSpan="4">Sem degradação registrada.</td></tr>}</tbody></table></div>
              </div>
            </section>
          </section>
        )}

        {activeTab === 'procedimentos' && (
          <section className="procedures-grid">
            <div className="panel procedure-intro">
              <span className="section-kicker">Consulta rápida</span>
              <h2>Procedimentos e critérios de classificação</h2>
              <p>Esta aba existe para o usuário consultar o critério antes de registrar a condição no campo. Ela resume a lógica dos documentos técnicos enviados: Bom, Regular, Inservível, Ruína, Cluster/Malha, Taxa, marcações e criticidades.</p>
            </div>
            {Object.entries(STATUS).map(([key, status]) => (
              <div key={key} className={`panel procedure-card ${status.className}`}>
                <h2>{status.label}</h2>
                <p>{status.description}</p>
                {key === 'bom' && <ul><li>Não deve haver perda de bitola.</li><li>Não deve haver ombreira afogada, quebra que impeça fixação ou fixação não travada.</li><li>Não deve haver aço exposto, DRT agressivo ou fissura/vazio na região do trilho.</li></ul>}
                {key === 'regular' && <ul><li>Condição intermediária, com defeitos visuais que ainda não caracterizam inservível.</li><li>Exige acompanhamento da evolução, principalmente quando estiver adjacente a inservível ou ruína.</li><li>Não deve haver perda de bitola, fixação comprometida ou defeito crítico na região do trilho.</li></ul>}
                {key === 'inservivel' && <ul><li>Inclui perda de bitola, ombreira quebrada/afogada, fixação não travada, aço exposto com comprometimento, DRT agressivo ou falha na região do trilho.</li><li>Na prospecção recebe uma pintura.</li><li>Deve ser quantificado por equipamento e por malha/cluster.</li></ul>}
                {key === 'ruina' && <ul><li>Indica perda da função de suporte/fixação do trilho.</li><li>Transfere esforço para dormentes adjacentes e acelera degradação dos intercalados.</li><li>Na prospecção recebe duas pinturas.</li></ul>}
              </div>
            ))}
            <div className="panel procedure-card wide">
              <h2>Cluster / Malha e Taxa</h2>
              <ul><li><strong>Cluster/Malha:</strong> sequência de dormentes inservíveis ou em ruína na via permanente.</li><li><strong>Taxa:</strong> porcentagem de dormentação inservível/crítica no trecho analisado.</li><li>O dashboard calcula a quantidade de malhas, a maior sequência e o percentual crítico.</li></ul>
            </div>
            <div className="panel procedure-card wide">
              <h2>Marcação de prospecção</h2>
              <ul><li><strong>Inservível:</strong> uma pintura.</li><li><strong>Ruína:</strong> duas pinturas.</li><li>Em equipamentos com junta/solda no trilho, deve haver dormentes bons antes e depois; se não houver, marcar com duas pinturas para substituição.</li></ul>
            </div>
            <div className="panel procedure-card wide">
              <h2>Criticidade operacional</h2>
              <ul><li><strong>P3:</strong> perda de bitola sem perda de suporte em sequência limite; restrição 22 km/h e tratativa em 7 dias.</li><li><strong>P2:</strong> perda de bitola com perda de suporte em sequência média; restrição 22 km/h e tratativa em 48h.</li><li><strong>P1:</strong> perda de bitola e suporte em sequência alta; interdição programada / 24h.</li><li>O sistema sugere prioridade, mas a decisão final deve seguir a avaliação operacional local e os documentos vigentes.</li></ul>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
