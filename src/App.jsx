import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  RotateCcw,
  Save,
  Sun,
  Train,
  Trash2,
  TrendingDown,
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

const STORAGE_KEY = 'sistema-dormentes-rumo-v1'
const THEME_KEY = 'sistema-dormentes-rumo-theme'

const STATUS = {
  bom: { label: 'Bom', short: 'B', score: 100, severity: 0, className: 'status-bom' },
  regular: { label: 'Regular', short: 'R', score: 50, severity: 1, className: 'status-regular' },
  inservivel: { label: 'Inservível', short: 'I', score: 0, severity: 2, className: 'status-inservivel' },
  ruina: { label: 'Ruína', short: 'RU', score: 0, severity: 3, className: 'status-ruina' }
}

const CHART_COLORS = {
  navy: '#083b6e',
  green: '#8bd86f',
  white: '#ffffff',
  aqua: '#39a9db',
  yellow: '#f2c94c',
  red: '#7a1f1f',
  grid: '#d7e3ef',
  text: '#22435e'
}

const DARK_CHART_COLORS = {
  navy: '#63b3ff',
  green: '#8bd86f',
  white: '#ffffff',
  aqua: '#58d2ff',
  yellow: '#f2c94c',
  red: '#ff7b7b',
  grid: '#244f78',
  text: '#d7ebff'
}

const today = () => new Date().toISOString().slice(0, 10)
const formatDate = (date) => date ? date.split('-').reverse().join('/') : ''
const parseDate = (date) => new Date(`${date}T00:00:00`)
const daysBetween = (start, end) => Math.max(1, Math.round((parseDate(end) - parseDate(start)) / 86400000))

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

function buildSleepers(count) {
  return Array.from({ length: Number(count) || 0 }, (_, index) => ({
    id: `D${String(index + 1).padStart(3, '0')}`,
    number: index + 1
  }))
}

function createInspection(sleepers, date = today(), notes = 'Inspeção inicial') {
  const conditions = {}
  sleepers.forEach((sleeper) => {
    conditions[sleeper.id] = 'bom'
  })
  return { id: uid('insp'), date, notes, conditions }
}

function createTrack(name = 'Trecho exemplo - Malha Rumo', count = 12) {
  const sleepers = buildSleepers(count)
  const first = createInspection(sleepers, today(), 'Inspeção inicial')
  return {
    id: uid('trecho'),
    name,
    equipment: 'Equipamento / trecho a informar',
    responsible: 'Equipe de prospecção',
    malha: 'Malha Central',
    sleeperMaterial: 'concreto',
    geometryType: 'tangente',
    trackClass: 'C.3',
    hasGaugeLoss: 'nao',
    hasSupportLoss: 'nao',
    kmStart: 'km 123+000',
    kmEnd: 'km 123+500',
    hasJointWeld: 'nao',
    jointSurroundingGood: 'sim',
    sleeperCount: count,
    sleepers,
    inspections: [first],
    periodRule: 'Periodicidade a definir: mensal, quinzenal, por criticidade ou por trecho.'
  }
}

function demoTracks() {
  const trackA = createTrack('Trecho A - Pátio Norte', 12)
  const trackB = createTrack('Trecho B - Serra', 12)
  const trackC = createTrack('Trecho C - Ramal Sul', 12)

  const d1 = today()
  const d2 = addDays(d1, 30)
  const d3 = addDays(d1, 60)

  trackA.inspections = [
    createInspection(trackA.sleepers, d1, 'Inspeção inicial'),
    createInspection(trackA.sleepers, d2, 'Início de degradação pontual'),
    createInspection(trackA.sleepers, d3, 'Piora moderada')
  ]
  trackA.inspections[1].conditions.D003 = 'regular'
  trackA.inspections[1].conditions.D004 = 'regular'
  trackA.inspections[2].conditions.D003 = 'inservivel'
  trackA.inspections[2].conditions.D011 = 'ruina'
  trackA.inspections[2].conditions.D004 = 'regular'
  trackA.inspections[2].conditions.D008 = 'regular'

  trackB.inspections = [
    createInspection(trackB.sleepers, d1, 'Inspeção inicial'),
    createInspection(trackB.sleepers, d2, 'Degradação acelerada'),
    createInspection(trackB.sleepers, d3, 'Trecho exige prioridade')
  ]
  ;['D002', 'D003', 'D004', 'D006', 'D009'].forEach((id) => { trackB.inspections[1].conditions[id] = 'regular' })
  ;['D002', 'D003'].forEach((id) => { trackB.inspections[2].conditions[id] = 'inservivel' })
  trackB.inspections[2].conditions.D004 = 'ruina'
  ;['D006', 'D007', 'D008', 'D009'].forEach((id) => { trackB.inspections[2].conditions[id] = 'regular' })

  trackC.inspections = [
    createInspection(trackC.sleepers, d1, 'Inspeção inicial'),
    createInspection(trackC.sleepers, d2, 'Trecho estável'),
    createInspection(trackC.sleepers, d3, 'Pouca alteração')
  ]
  trackC.inspections[2].conditions.D010 = 'regular'

  return [trackA, trackB, trackC]
}

function addDays(date, days) {
  const d = parseDate(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function escapeExcel(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function normalizeStatus(status) {
  return STATUS[status] ? status : 'bom'
}

function analyzeInspectionMarkers(sleepers, inspection) {
  const criticalSet = new Set(['inservivel', 'ruina'])
  const clusters = []
  let current = []

  sleepers.forEach((sleeper) => {
    const status = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
    if (criticalSet.has(status)) {
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
    if (!criticalSet.has(status)) return
    ;[sleepers[index - 1], sleepers[index + 1]].forEach((neighbor) => {
      if (!neighbor) return
      const neighborStatus = normalizeStatus(inspection.conditions?.[neighbor.id] || 'bom')
      if (neighborStatus === 'regular') regularAdjacents.add(neighbor.id)
    })
  })

  const clusterDetails = clusters.map((items, index) => ({
    id: index + 1,
    inicio: items[0].id,
    fim: items.at(-1).id,
    quantidade: items.length,
    inserviveis: items.filter((item) => item.status === 'inservivel').length,
    ruinas: items.filter((item) => item.status === 'ruina').length,
    descricao: `${items[0].id}${items.length > 1 ? ` a ${items.at(-1).id}` : ''}`
  }))

  const inserviveis = sleepers.filter((sleeper) => normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom') === 'inservivel').length
  const ruinas = sleepers.filter((sleeper) => normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom') === 'ruina').length

  return {
    clusterCount: clusters.length,
    maxClusterSize: clusterDetails.reduce((max, item) => Math.max(max, item.quantidade), 0),
    criticalSleepers: inserviveis + ruinas,
    inserviveis,
    ruinas,
    regularAdjacents: regularAdjacents.size,
    regularAdjacentsList: [...regularAdjacents].sort(),
    clusterDetails,
    onePaints: inserviveis,
    doublePaints: ruinas
  }
}

function analyzeTrack(track) {
  const sleepers = track.sleepers || []
  const inspections = [...(track.inspections || [])].sort((a, b) => parseDate(a.date) - parseDate(b.date))

  const rows = inspections.map((inspection, index) => {
    const totals = { bom: 0, regular: 0, inservivel: 0, ruina: 0 }
    sleepers.forEach((sleeper) => {
      const status = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
      totals[status] += 1
    })

    const markerAnalysis = analyzeInspectionMarkers(sleepers, inspection)
    const scoreSum = sleepers.reduce((sum, sleeper) => {
      const status = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
      return sum + STATUS[status].score
    }, 0)
    const score = sleepers.length ? Math.round(scoreSum / sleepers.length) : 0

    let worsened = 0
    let improved = 0
    let newCritical = 0
    let newRuins = 0
    let deteriorationSpeed = 0
    let daysSincePrevious = 0

    const previous = inspections[index - 1]
    if (previous) {
      daysSincePrevious = daysBetween(previous.date, inspection.date)
      sleepers.forEach((sleeper) => {
        const before = normalizeStatus(previous.conditions?.[sleeper.id] || 'bom')
        const now = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
        if (STATUS[now].severity > STATUS[before].severity) worsened += 1
        if (STATUS[now].severity < STATUS[before].severity) improved += 1
        if ((now === 'inservivel' || now === 'ruina') && before !== 'inservivel' && before !== 'ruina') newCritical += 1
        if (now === 'ruina' && before !== 'ruina') newRuins += 1
      })
      const prevScoreSum = sleepers.reduce((sum, sleeper) => {
        const status = normalizeStatus(previous.conditions?.[sleeper.id] || 'bom')
        return sum + STATUS[status].score
      }, 0)
      const prevScore = sleepers.length ? prevScoreSum / sleepers.length : 0
      deteriorationSpeed = Number(((prevScore - score) / daysSincePrevious).toFixed(2))
    }

    return {
      date: inspection.date,
      data: formatDate(inspection.date),
      notes: inspection.notes,
      Bom: totals.bom,
      Regular: totals.regular,
      Inservível: totals.inservivel,
      Ruína: totals.ruina,
      desempenho: score,
      criticalPercent: sleepers.length ? Number((((totals.inservivel + totals.ruina) / sleepers.length) * 100).toFixed(1)) : 0,
      regularOrWorsePercent: sleepers.length ? Number((((totals.regular + totals.inservivel + totals.ruina) / sleepers.length) * 100).toFixed(1)) : 0,
      clustersCriticos: markerAnalysis.clusterCount,
      maiorMalhaCritica: markerAnalysis.maxClusterSize,
      dormentesCriticos: markerAnalysis.criticalSleepers,
      regularesAdjacentes: markerAnalysis.regularAdjacents,
      pinturasUma: markerAnalysis.onePaints,
      pinturasDuas: markerAnalysis.doublePaints,
      clusterDetails: markerAnalysis.clusterDetails,
      worsened,
      improved,
      newCritical,
      newRuins,
      daysSincePrevious,
      deteriorationSpeed
    }
  })

  const latest = rows.at(-1) || { Bom: 0, Regular: 0, Inservível: 0, Ruína: 0, desempenho: 0, criticalPercent: 0, regularOrWorsePercent: 0, clustersCriticos: 0, maiorMalhaCritica: 0, dormentesCriticos: 0, regularesAdjacentes: 0, pinturasUma: 0, pinturasDuas: 0, clusterDetails: [] }
  const initial = rows[0] || latest
  const totalDays = rows.length > 1 ? daysBetween(initial.date, latest.date) : 1
  const totalScoreDrop = Number(((initial.desempenho || 0) - (latest.desempenho || 0)).toFixed(1))
  const averageSpeed = Number((totalScoreDrop / totalDays).toFixed(2))
  const projectedDaysToCritical = averageSpeed > 0 ? Math.max(0, Math.round(latest.desempenho / averageSpeed)) : null

  const sleeperTrend = sleepers.map((sleeper) => {
    let degradationSteps = 0
    let criticalSince = null
    let currentStatus = 'bom'
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

  let classification = 'Ótimo'
  if (latest.Ruína > 0 || latest.desempenho < 40 || latest.criticalPercent >= 30 || latest.maiorMalhaCritica >= 3) classification = 'Crítico'
  else if (latest.Inservível > 0 || latest.desempenho < 70 || latest.criticalPercent >= 10 || latest.regularOrWorsePercent >= 35) classification = 'Atenção'

  const riskIndex = Number(((100 - latest.desempenho) + latest.criticalPercent * 1.5 + latest.Inservível * 2.5 + latest.Ruína * 5 + latest.clustersCriticos * 4 + latest.regularesAdjacentes * 1.2 + Math.max(0, averageSpeed) * 15).toFixed(1))

  let interpretation = 'Ainda não há dados suficientes para calcular tendência.'
  if (rows.length === 1) {
    interpretation = 'Ainda há apenas uma inspeção. A velocidade de deterioração aparecerá após a segunda visita ao mesmo trecho.'
  } else if (latest.Ruína > 0) {
    interpretation = `Há ${latest.Ruína} dormente(s) em RUÍNA. Priorize a substituição, marque com duas pinturas e avalie os inservíveis/intercalados do agrupamento.`
  } else if (latest.Inservível > 0) {
    interpretation = `Há ${latest.Inservível} dormente(s) inservível(is). A marcação prevista é uma pintura por dormente e o acompanhamento dos regulares adjacentes deve ser reforçado.`
  } else if (averageSpeed > 1) {
    interpretation = `O trecho está perdendo desempenho em ritmo alto: queda média de ${averageSpeed} ponto(s) por dia.`
  } else if (averageSpeed > 0.25) {
    interpretation = `O trecho apresenta deterioração moderada: queda média de ${averageSpeed} ponto(s) por dia.`
  } else if (totalScoreDrop > 0) {
    interpretation = `O trecho deteriorou, mas em velocidade baixa: queda média de ${averageSpeed} ponto(s) por dia.`
  } else {
    interpretation = 'O trecho está estável ou melhorou no período analisado.'
  }

  return {
    rows,
    latest,
    initial,
    totalDays,
    totalScoreDrop,
    averageSpeed,
    projectedDaysToCritical,
    sleeperTrend,
    worstSleepers: sleeperTrend.filter((item) => item.riskScore > 0).slice(0, 10),
    classification,
    riskIndex,
    interpretation
  }
}

function getActionPlan(track, analytics) {
  const latest = analytics.latest || {}
  const maxCluster = latest.maiorMalhaCritica || 0
  const geometry = track.geometryType || 'tangente'
  const isCurve = geometry === 'curva'
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
    restriction = 'Avaliar restrição operacional conforme condição de via'
    action = 'Marcar ruína com duas pinturas, substituir o dormente em ruína e avaliar todo o agrupamento com inservíveis intercalados.'
    reason = 'Dormente em ruína deixou de cumprir suporte/fixação e transfere esforço aos adjacentes.'
  } else if (gaugeLoss && supportLoss && ((isCurve && maxCluster >= 3) || (!isCurve && maxCluster >= 5))) {
    priority = 'P1'
    deadline = '24h / interdição programada'
    restriction = 'Interdição programada conforme avaliação local'
    action = 'Priorizar substituição da malha crítica e escalar para decisão operacional.'
    reason = 'Sequência com perda de bitola e suporte atingiu limite alto para o traçado informado.'
  } else if (gaugeLoss && supportLoss && ((isCurve && maxCluster >= 2) || (!isCurve && maxCluster >= 3))) {
    priority = 'P2'
    deadline = '48h'
    restriction = 'Restrição 22 km/h até tratativa'
    action = 'Programar substituição em curto prazo e acompanhar evolução diária até execução.'
    reason = 'Sequência com perda de bitola e suporte atingiu limite médio para o traçado informado.'
  } else if (gaugeLoss && !supportLoss && ((isCurve && maxCluster >= 2) || (!isCurve && maxCluster >= 5))) {
    priority = 'P3'
    deadline = '7 dias'
    restriction = 'Restrição 22 km/h até tratativa'
    action = 'Programar substituição e monitorar vencimento de prazo para não migrar para prioridade superior.'
    reason = 'Sequência com perda de bitola sem perda de suporte atingiu limite baixo para o traçado informado.'
  } else if (latest.Inservível > 0 || latest.clustersCriticos > 0) {
    priority = 'Prospecção crítica'
    deadline = 'Planejar substituição'
    restriction = 'Avaliar restrição pela classe e condição local'
    action = 'Marcar inservíveis com uma pintura, quantificar por equipamento e acompanhar regulares adjacentes.'
    reason = 'Existem dormentes inservíveis ou agrupamentos que precisam entrar no plano de substituição.'
  }

  if (jointNeedsAction) {
    action += ' Em junta/solda sem dormentes bons antes e depois, aplicar marcação com duas pinturas para substituição.'
    reason += ' Há junta/solda com entorno sem dormentes bons cadastrados.'
  }

  return { priority, deadline, restriction, action, reason, jointNeedsAction }
}

function createPresentationFileName(track) {
  return `apresentacao-dormentes-${track.name || 'trecho'}`.replaceAll(' ', '-').toLowerCase()
}

export default function App() {
  const [tracks, setTracks] = useState(() => [createTrack()])
  const [selectedTrackId, setSelectedTrackId] = useState(null)
  const [newInspectionDate, setNewInspectionDate] = useState(today())
  const [selectedStatus, setSelectedStatus] = useState('regular')
  const [savedAt, setSavedAt] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark')

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (Array.isArray(data.tracks) && data.tracks.length) {
        setTracks(data.tracks)
        setSelectedTrackId(data.selectedTrackId || data.tracks[0].id)
        setSavedAt(data.savedAt || '')
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (!selectedTrackId && tracks.length) setSelectedTrackId(tracks[0].id)
  }, [tracks, selectedTrackId])

  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) || tracks[0]
  const analytics = useMemo(() => analyzeTrack(selectedTrack), [selectedTrack])
  const ranking = useMemo(() => {
    return tracks
      .map((track) => ({ track, analytics: analyzeTrack(track) }))
      .sort((a, b) => b.analytics.riskIndex - a.analytics.riskIndex)
  }, [tracks])
  const actionPlan = useMemo(() => getActionPlan(selectedTrack, analytics), [selectedTrack, analytics])
  const chartColors = theme === 'dark' ? DARK_CHART_COLORS : CHART_COLORS

  function updateTrack(patch) {
    setTracks((current) => current.map((track) => track.id === selectedTrack.id ? { ...track, ...patch } : track))
  }

  function updateInspections(nextInspections) {
    updateTrack({ inspections: nextInspections })
  }

  function addTrack() {
    const next = createTrack(`Novo trecho ${tracks.length + 1}`, 12)
    setTracks((current) => [...current, next])
    setSelectedTrackId(next.id)
    setActiveTab('dados')
  }

  function removeTrack(trackId) {
    if (tracks.length === 1) return
    const nextTracks = tracks.filter((track) => track.id !== trackId)
    setTracks(nextTracks)
    if (trackId === selectedTrackId) setSelectedTrackId(nextTracks[0].id)
  }

  function applySleeperCount() {
    const count = Math.max(1, Math.min(300, Number(selectedTrack.sleeperCount) || 1))
    const sleepers = buildSleepers(count)
    updateTrack({ sleeperCount: count, sleepers, inspections: [createInspection(sleepers)] })
  }

  function addInspection() {
    const sorted = [...selectedTrack.inspections].sort((a, b) => parseDate(a.date) - parseDate(b.date))
    const previous = sorted.at(-1)
    const conditions = {}
    selectedTrack.sleepers.forEach((sleeper) => {
      conditions[sleeper.id] = previous?.conditions?.[sleeper.id] || 'bom'
    })
    updateInspections([
      ...selectedTrack.inspections,
      { id: uid('insp'), date: newInspectionDate || today(), notes: 'Nova inspeção', conditions }
    ])
    setActiveTab('inspecoes')
  }

  function deleteInspection(inspectionId) {
    if (selectedTrack.inspections.length === 1) return
    updateInspections(selectedTrack.inspections.filter((inspection) => inspection.id !== inspectionId))
  }

  function updateCell(inspectionId, sleeperId, nextStatus = selectedStatus) {
    updateInspections(selectedTrack.inspections.map((inspection) => {
      if (inspection.id !== inspectionId) return inspection
      return { ...inspection, conditions: { ...inspection.conditions, [sleeperId]: nextStatus } }
    }))
  }

  function updateInspectionDate(inspectionId, date) {
    updateInspections(selectedTrack.inspections.map((inspection) => inspection.id === inspectionId ? { ...inspection, date } : inspection))
  }

  function updateNote(inspectionId, notes) {
    updateInspections(selectedTrack.inspections.map((inspection) => inspection.id === inspectionId ? { ...inspection, notes } : inspection))
  }

  function saveData() {
    const timestamp = new Date().toLocaleString('pt-BR')
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tracks, selectedTrackId, savedAt: timestamp }))
    setSavedAt(timestamp)
  }

  function loadDemo() {
    const demo = demoTracks()
    setTracks(demo)
    setSelectedTrackId(demo[1].id)
    setSavedAt('')
    setActiveTab('dashboard')
  }

  function exportExcel() {
    const rows = analytics.rows.map((row) => `
      <tr>
        <td>${escapeExcel(row.data)}</td>
        <td>${escapeExcel(row.Bom)}</td>
        <td>${escapeExcel(row.Regular)}</td>
        <td>${escapeExcel(row.Inservível)}</td>
        <td>${escapeExcel(row.Ruína)}</td>
        <td>${escapeExcel(row.desempenho)}</td>
        <td>${escapeExcel(row.criticalPercent)}%</td>
        <td>${escapeExcel(row.clustersCriticos)}</td>
        <td>${escapeExcel(row.maiorMalhaCritica)}</td>
        <td>${escapeExcel(row.regularesAdjacentes)}</td>
        <td>${escapeExcel(row.pinturasUma)}</td>
        <td>${escapeExcel(row.pinturasDuas)}</td>
        <td>${escapeExcel(row.worsened)}</td>
        <td>${escapeExcel(row.newCritical)}</td>
        <td>${escapeExcel(row.newRuins)}</td>
        <td>${escapeExcel(row.deteriorationSpeed)}</td>
      </tr>
    `).join('')

    const gridRows = [...selectedTrack.inspections]
      .sort((a, b) => parseDate(a.date) - parseDate(b.date))
      .map((inspection) => `
        <tr>
          <td>${escapeExcel(formatDate(inspection.date))}</td>
          <td>${escapeExcel(inspection.notes)}</td>
          ${selectedTrack.sleepers.map((sleeper) => `<td>${escapeExcel(STATUS[normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')].label)}</td>`).join('')}
        </tr>
      `).join('')

    const rankingRows = ranking.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeExcel(item.track.name)}</td>
        <td>${escapeExcel(item.track.equipment || '-')}</td>
        <td>${escapeExcel(item.track.kmStart)}</td>
        <td>${escapeExcel(item.track.kmEnd)}</td>
        <td>${escapeExcel(item.analytics.classification)}</td>
        <td>${escapeExcel(item.analytics.latest.desempenho)}</td>
        <td>${escapeExcel(item.analytics.latest.Inservível)}</td>
        <td>${escapeExcel(item.analytics.latest.Ruína)}</td>
        <td>${escapeExcel(item.analytics.latest.clustersCriticos)}</td>
        <td>${escapeExcel(item.analytics.riskIndex)}</td>
      </tr>
    `).join('')

    const clusterRows = (analytics.latest.clusterDetails || []).map((cluster) => `
      <tr>
        <td>${escapeExcel(cluster.id)}</td>
        <td>${escapeExcel(cluster.descricao)}</td>
        <td>${escapeExcel(cluster.quantidade)}</td>
        <td>${escapeExcel(cluster.inserviveis)}</td>
        <td>${escapeExcel(cluster.ruinas)}</td>
      </tr>
    `).join('')

    const sleeperHeaders = selectedTrack.sleepers.map((sleeper) => `<th>${escapeExcel(sleeper.id)}</th>`).join('')
    const html = `
      <html><head><meta charset="UTF-8" /></head><body>
        <h1>Relatório de inspeção de dormentes</h1>
        <p><strong>Trecho:</strong> ${escapeExcel(selectedTrack.name)}</p>
        <p><strong>Equipamento:</strong> ${escapeExcel(selectedTrack.equipment || '-')}</p>
        <p><strong>Local:</strong> ${escapeExcel(selectedTrack.kmStart)} até ${escapeExcel(selectedTrack.kmEnd)}</p>
        <p><strong>Classificação:</strong> ${escapeExcel(analytics.classification)}</p>
        <p><strong>Análise:</strong> ${escapeExcel(analytics.interpretation)}</p>
        <h2>Ranking de trechos da companhia</h2>
        <table border="1"><tr><th>Ranking</th><th>Trecho</th><th>Equipamento</th><th>KM inicial</th><th>KM final</th><th>Classificação</th><th>Desempenho</th><th>Inservíveis</th><th>Ruína</th><th>Malhas críticas</th><th>Índice de risco</th></tr>${rankingRows}</table>
        <h2>Análise por inspeção</h2>
        <table border="1"><tr><th>Data</th><th>Bom</th><th>Regular</th><th>Inservível</th><th>Ruína</th><th>Desempenho</th><th>% Crítico</th><th>Malhas críticas</th><th>Maior malha</th><th>Regulares adjacentes</th><th>1 pintura</th><th>2 pinturas</th><th>Pioraram</th><th>Novos críticos</th><th>Novas ruínas</th><th>Velocidade</th></tr>${rows}</table>
        <h2>Malhas / clusters críticos da última inspeção</h2>
        <table border="1"><tr><th>#</th><th>Dormentes</th><th>Quantidade</th><th>Inservíveis</th><th>Ruína</th></tr>${clusterRows || '<tr><td colspan="5">Sem malhas críticas.</td></tr>'}</table>
        <h2>Grade completa</h2>
        <table border="1"><tr><th>Data</th><th>Observação</th>${sleeperHeaders}</tr>${gridRows}</table>
      </body></html>
    `

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-dormentes-${selectedTrack.name || 'trecho'}.xls`.replaceAll(' ', '-').toLowerCase()
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function printPDF() {
    window.print()
  }

  function printPresentationPDF() {
    setActiveTab('apresentacao')
    setTimeout(() => window.print(), 150)
  }

  function toggleTheme() {
    setTheme((current) => current === 'dark' ? 'light' : 'dark')
  }

  function openTab(tabId) {
    setActiveTab(tabId)
    setSidebarOpen(false)
  }

  const latest = analytics.latest
  const tabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dados', label: 'Cadastro do trecho', icon: Train },
    { id: 'inspecoes', label: 'Inspeções', icon: CalendarDays },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'apresentacao', label: 'Apresentação PDF', icon: FileText },
    { id: 'parametros', label: 'Parâmetros', icon: FileText }
  ]

  return (
    <main className="app">
      <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar no-print ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div>
            <strong>Menu principal</strong>
            <p>Navegue pelas abas e gerencie os trechos.</p>
          </div>
          <button className="ghost sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>

        <nav className="nav-menu">
          {tabItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-button ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => openTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <section className="sidebar-section">
          <div className="panel-title-row compact-row">
            <h3>Trechos</h3>
            <button className="icon-button" onClick={addTrack} title="Adicionar trecho">
              <Plus size={18} />
            </button>
          </div>
          <p className="muted">Adição, seleção e exclusão de trechos abaixo das abas principais.</p>
          <div className="track-list sidebar-track-list">
            {tracks.map((track) => {
              const item = analyzeTrack(track)
              return (
                <button
                  key={track.id}
                  className={`track-button ${track.id === selectedTrack.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTrackId(track.id)
                    setSidebarOpen(false)
                  }}
                >
                  <strong>{track.name}</strong>
                  <span>{track.kmStart} até {track.kmEnd}</span>
                  <small>Risco {item.riskIndex} • {item.classification}</small>
                </button>
              )
            })}
          </div>
          <button className="danger outline full" disabled={tracks.length === 1} onClick={() => removeTrack(selectedTrack.id)}>
            <Trash2 size={16} /> Excluir trecho selecionado
          </button>
        </section>
      </aside>

      <header className="hero">
        <div className="hero-copy">
          <div className="hero-menu-row no-print">
            <button className="menu-trigger outline" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} /> Menu
            </button>
            <button className="theme-toggle outline" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            </button>
          </div>
          <span className="eyebrow"><Train size={16} /> Sistema de acompanhamento de dormentes</span>
          <h1>Controle de desempenho por trecho ferroviário</h1>
          <p>Registre prospecções, identifique dormentes bons, regulares, inservíveis e em ruína, acompanhe clusters e prepare dados objetivos para apresentação gerencial.</p>
          <div className="hero-tags">
            <span className="hero-tag">{selectedTrack.name}</span>
            <span className="hero-tag">{selectedTrack.kmStart} até {selectedTrack.kmEnd}</span>
            <span className="hero-tag hero-tag-green">{selectedTrack.sleepers.length} dormentes</span>
          </div>
        </div>
        <div className="hero-side">
          <div className={`classification classification-${analytics.classification.toLowerCase().replace('ç', 'c').replace('ã', 'a')}`}>
            <small>Classificação atual</small>
            <strong>{analytics.classification}</strong>
            <span>{latest.desempenho}/100</span>
          </div>
          <AppPreview latest={latest} actionPlan={actionPlan} />
        </div>
      </header>

      <section className="panel toolbar no-print">
        <div className="toolbar-copy">
          <span className="section-kicker">Trecho selecionado</span>
          <h2>{selectedTrack.name}</h2>
          <p className="muted">{selectedTrack.kmStart} até {selectedTrack.kmEnd}{savedAt ? ` • Último salvamento: ${savedAt}` : ''}</p>
        </div>
        <div className="actions">
          <button onClick={saveData}><Save size={16} /> Salvar</button>
          <button onClick={exportExcel} className="success"><FileSpreadsheet size={16} /> Excel</button>
          <button onClick={printPresentationPDF} className="danger"><FileText size={16} /> PDF Gerencial</button>
          <button onClick={printPDF} className="outline"><FileText size={16} /> PDF da tela</button>
          <button onClick={loadDemo} className="outline"><RotateCcw size={16} /> Exemplo</button>
        </div>
      </section>

      <section className="content">
        {activeTab === 'dashboard' && (
          <>
            <section className="metrics report-section">
              <Metric icon={<BarChart3 />} title="Desempenho atual" value={`${latest.desempenho}/100`} detail="Bom 100, Regular 50, Crítico 0" />
              <Metric icon={<AlertTriangle />} title="Inservíveis + Ruína" value={`${latest.Inservível + latest.Ruína}`} detail={`${latest.criticalPercent}% do trecho`} />
              <Metric icon={<Train />} title="Malhas críticas" value={`${latest.clustersCriticos}`} detail={`Maior agrupamento: ${latest.maiorMalhaCritica} dormente(s)`} />
              <Metric icon={<CalendarDays />} title="Marcação" value={`${latest.pinturasUma}/${latest.pinturasDuas}`} detail="1 pintura / 2 pinturas" />
              <Metric icon={<TrendingDown />} title="Velocidade de queda" value={`${analytics.averageSpeed}`} detail="ponto(s) perdidos por dia" />
              <Metric icon={<CalendarDays />} title="Projeção crítica" value={analytics.projectedDaysToCritical === null ? 'Estável' : `${analytics.projectedDaysToCritical} dias`} detail="Se o ritmo continuar" />
            </section>

            <section className="panel report-section">
              <h2>Leitura automática para apresentação</h2>
              <p className="analysis-text">
                {analytics.interpretation} Na última inspeção, o trecho possui <strong>{latest.Bom}</strong> bom(ns), <strong>{latest.Regular}</strong> regular(es), <strong>{latest.Inservível}</strong> inservível(is) e <strong>{latest.Ruína}</strong> em ruína. Foram identificada(s) <strong>{latest.clustersCriticos}</strong> malha(s) crítica(s), <strong>{latest.regularesAdjacentes}</strong> regular(es) adjacente(s) para acompanhamento, <strong>{latest.pinturasUma}</strong> marcação(ões) de uma pintura e <strong>{latest.pinturasDuas}</strong> marcação(ões) de duas pinturas.
              </p>
            </section>

            <section className="panel report-section action-plan-card">
              <div>
                <span className="section-kicker">Plano sugerido</span>
                <h2>{actionPlan.priority} • {actionPlan.deadline}</h2>
                <p className="analysis-text"><strong>Ação:</strong> {actionPlan.action}</p>
              </div>
              <div className="action-plan-meta">
                <span><strong>Restrição</strong>{actionPlan.restriction}</span>
                <span><strong>Motivo</strong>{actionPlan.reason}</span>
              </div>
            </section>

            <section className="panel app-style-board no-print">
              <div className="panel-title-row">
                <div>
                  <span className="section-kicker">Visual inspirado no app Rumo</span>
                  <h2>Atalhos operacionais para coleta e apresentação</h2>
                  <p className="muted">Cards grandes, contraste alto, leitura rápida em campo e resumo pronto para mostrar à gerência.</p>
                </div>
              </div>
              <div className="app-action-grid">
                <button onClick={() => openTab('inspecoes')} className="app-action-card primary-action">
                  <span>+</span>
                  <strong>Nova inspeção</strong>
                  <small>Registrar piora por dormente</small>
                </button>
                <button onClick={() => openTab('dashboard')} className="app-action-card">
                  <span>{latest.clustersCriticos}</span>
                  <strong>Malhas</strong>
                  <small>Clusters críticos encontrados</small>
                </button>
                <button onClick={() => openTab('relatorios')} className="app-action-card">
                  <span>{latest.pinturasUma + latest.pinturasDuas}</span>
                  <strong>Marcações</strong>
                  <small>Uma e duas pinturas</small>
                </button>
                <button onClick={() => openTab('apresentacao')} className="app-action-card">
                  <span>PDF</span>
                  <strong>Apresentar</strong>
                  <small>Resumo gerencial</small>
                </button>
              </div>
            </section>

            <section className="charts report-section">
              <ChartCard title="Desempenho do trecho" subtitle="Quanto mais a linha cai, pior a evolução.">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={analytics.rows}>
                    <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="data" stroke={chartColors.text} />
                    <YAxis domain={[0, 100]} stroke={chartColors.text} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="desempenho" name="Desempenho" stroke={chartColors.navy} strokeWidth={3} dot={{ r: 5, fill: chartColors.green, stroke: chartColors.navy }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Composição por inspeção" subtitle="Mostra a passagem de bom para regular, inservível e ruína.">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analytics.rows}>
                    <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="data" stroke={chartColors.text} />
                    <YAxis allowDecimals={false} stroke={chartColors.text} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="Bom" stackId="1" stroke={chartColors.green} fill={chartColors.green} fillOpacity={0.65} />
                    <Area type="monotone" dataKey="Regular" stackId="1" stroke={chartColors.yellow} fill={chartColors.yellow} fillOpacity={0.7} />
                    <Area type="monotone" dataKey="Inservível" stackId="1" stroke={chartColors.navy} fill={chartColors.navy} fillOpacity={0.85} />
                    <Area type="monotone" dataKey="Ruína" stackId="1" stroke={chartColors.red} fill={chartColors.red} fillOpacity={0.88} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Taxa crítica e tendência" subtitle="Taxa crítica = percentual de inservíveis + ruína no trecho. Regular ou pior indica pressão futura.">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={analytics.rows}>
                    <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="data" stroke={chartColors.text} />
                    <YAxis domain={[0, 100]} stroke={chartColors.text} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="criticalPercent" name="Taxa crítica %" stroke={chartColors.red} strokeWidth={3} />
                    <Line type="monotone" dataKey="regularOrWorsePercent" name="Regular ou pior %" stroke={chartColors.yellow} strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Novas entradas críticas" subtitle="Mostra novos dormentes críticos e novas ruínas entre inspeções.">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.rows}>
                    <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="data" stroke={chartColors.text} />
                    <YAxis allowDecimals={false} stroke={chartColors.text} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newCritical" name="Novos críticos" fill={chartColors.navy} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="newRuins" name="Novas ruínas" fill={chartColors.red} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Clusters / malhas críticas" subtitle="Agrupamentos consecutivos de inservíveis e ruína por inspeção.">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.rows}>
                    <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="data" stroke={chartColors.text} />
                    <YAxis allowDecimals={false} stroke={chartColors.text} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="clustersCriticos" name="Malhas críticas" fill={chartColors.navy} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="maiorMalhaCritica" name="Maior malha" fill={chartColors.red} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Plano de marcação" subtitle="Uma pintura para inservíveis e duas pinturas para ruína.">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.rows}>
                    <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="data" stroke={chartColors.text} />
                    <YAxis allowDecimals={false} stroke={chartColors.text} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pinturasUma" name="1 pintura" fill={chartColors.navy} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="pinturasDuas" name="2 pinturas" fill={chartColors.red} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Velocidade de deterioração" subtitle="Pontos perdidos por dia entre uma inspeção e outra.">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.rows}>
                    <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="data" stroke={chartColors.text} />
                    <YAxis stroke={chartColors.text} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="deteriorationSpeed" name="Pontos/dia" fill={chartColors.navy} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Dormentes que pioraram" subtitle="Quantidade de dormentes que decaíram desde a visita anterior.">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.rows}>
                    <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="data" stroke={chartColors.text} />
                    <YAxis allowDecimals={false} stroke={chartColors.text} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="worsened" name="Pioraram" fill={chartColors.navy} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="newCritical" name="Novos críticos" fill={chartColors.yellow} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="newRuins" name="Novas ruínas" fill={chartColors.red} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>
          </>
        )}

        {activeTab === 'dados' && (
          <>
            <section className="panel no-print">
              <div className="panel-title-row">
                <div>
                  <h2>Dados do trecho</h2>
                  <p className="muted">Cadastre o trecho e ajuste a quantidade de dormentes.</p>
                </div>
              </div>

              <div className="form-grid form-grid-expanded">
                <label>
                  Nome do trecho
                  <input value={selectedTrack.name} onChange={(e) => updateTrack({ name: e.target.value })} />
                </label>
                <label>
                  Equipamento / ativo
                  <input value={selectedTrack.equipment || ''} onChange={(e) => updateTrack({ equipment: e.target.value })} />
                </label>
                <label>
                  Responsável / equipe
                  <input value={selectedTrack.responsible || ''} onChange={(e) => updateTrack({ responsible: e.target.value })} />
                </label>
                <label>
                  Malha
                  <select value={selectedTrack.malha || 'Malha Central'} onChange={(e) => updateTrack({ malha: e.target.value })}>
                    <option>Malha Central</option>
                    <option>Ferronorte</option>
                    <option>Malha Paulista</option>
                    <option>Outra</option>
                  </select>
                </label>
                <label>
                  Material
                  <select value={selectedTrack.sleeperMaterial || 'concreto'} onChange={(e) => updateTrack({ sleeperMaterial: e.target.value })}>
                    <option value="concreto">Concreto</option>
                    <option value="madeira">Madeira</option>
                    <option value="aco">Aço</option>
                    <option value="polimero">Polímero</option>
                  </select>
                </label>
                <label>
                  Traçado
                  <select value={selectedTrack.geometryType || 'tangente'} onChange={(e) => updateTrack({ geometryType: e.target.value })}>
                    <option value="tangente">Tangente</option>
                    <option value="curva">Curva</option>
                  </select>
                </label>
                <label>
                  Classe
                  <input value={selectedTrack.trackClass || ''} onChange={(e) => updateTrack({ trackClass: e.target.value })} placeholder="Ex.: C.3" />
                </label>
                <label>
                  KM inicial
                  <input value={selectedTrack.kmStart} onChange={(e) => updateTrack({ kmStart: e.target.value })} />
                </label>
                <label>
                  KM final
                  <input value={selectedTrack.kmEnd} onChange={(e) => updateTrack({ kmEnd: e.target.value })} />
                </label>
                <label>
                  Junta/solda no trilho?
                  <select value={selectedTrack.hasJointWeld || 'nao'} onChange={(e) => updateTrack({ hasJointWeld: e.target.value })}>
                    <option value="nao">Não informado / Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </label>
                <label>
                  Quantidade de dormentes
                  <span className="input-with-button">
                    <input type="number" min="1" max="300" value={selectedTrack.sleeperCount} onChange={(e) => updateTrack({ sleeperCount: e.target.value })} />
                    <button onClick={applySleeperCount}>Aplicar</button>
                  </span>
                </label>
              </div>
            </section>

            <section className="panel no-print">
              <h2>Periodicidade e retorno</h2>
              <label className="full-label">
                Regra de retorno / periodicidade
                <textarea value={selectedTrack.periodRule} onChange={(e) => updateTrack({ periodRule: e.target.value })} rows={4} />
              </label>
            </section>
          </>
        )}

        {activeTab === 'inspecoes' && (
          <>
            <section className="panel no-print">
              <h2>Nova inspeção</h2>
              <div className="inspection-controls inspection-controls-grid">
                <label className="date-picker-field">
                  Data da nova inspeção
                  <input
                    type="date"
                    value={newInspectionDate}
                    onChange={(e) => setNewInspectionDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onFocus={(e) => e.currentTarget.showPicker?.()}
                  />
                </label>
                <button onClick={addInspection}><Plus size={16} /> Adicionar linha</button>
                <div className="status-picker status-picker-vertical">
                  {Object.entries(STATUS).map(([key, status]) => (
                    <button key={key} type="button" className={`${status.className} ${selectedStatus === key ? 'selected' : ''}`} onClick={() => setSelectedStatus(key)}>{status.label}</button>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel report-section">
              <div className="panel-title-row">
                <div>
                  <h2>Resumo da última prospecção</h2>
                  <p className="muted">Quantificação pronta para reunião: inservíveis, ruína, malhas críticas e marcação.</p>
                </div>
              </div>
              <div className="summary-grid">
                <div><span>Inservíveis</span><strong>{latest.Inservível}</strong></div>
                <div><span>Ruína</span><strong>{latest.Ruína}</strong></div>
                <div><span>Malhas críticas</span><strong>{latest.clustersCriticos}</strong></div>
                <div><span>Maior malha</span><strong>{latest.maiorMalhaCritica}</strong></div>
                <div><span>1 pintura</span><strong>{latest.pinturasUma}</strong></div>
                <div><span>2 pinturas</span><strong>{latest.pinturasDuas}</strong></div>
                <div><span>Regulares adjacentes</span><strong>{latest.regularesAdjacentes}</strong></div>
              </div>
            </section>

            <section className="panel report-section">
              <div className="panel-title-row">
                <div>
                  <h2>Grade de inspeção</h2>
                  <p className="muted">Cada coluna é um dormente. Cada linha é uma data de inspeção.</p>
                </div>
                <div className="legend no-print">
                  {Object.entries(STATUS).map(([key, status]) => <span key={key} className={status.className}>{status.label}</span>)}
                </div>
              </div>

              <div className="table-wrap">
                <table className="inspection-table">
                  <thead>
                    <tr>
                      <th className="sticky-col">Data</th>
                      <th>Observação</th>
                      {selectedTrack.sleepers.map((sleeper) => <th key={sleeper.id}>{sleeper.id}</th>)}
                      <th className="no-print">Excluir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedTrack.inspections].sort((a, b) => parseDate(a.date) - parseDate(b.date)).map((inspection) => (
                      <tr key={inspection.id}>
                        <td className="sticky-col strong date-cell">
                          <input
                            type="date"
                            className="table-date-input no-print"
                            value={inspection.date}
                            onChange={(e) => updateInspectionDate(inspection.id, e.target.value)}
                            onClick={(e) => e.currentTarget.showPicker?.()}
                            onFocus={(e) => e.currentTarget.showPicker?.()}
                          />
                          <span className="print-only">{formatDate(inspection.date)}</span>
                        </td>
                        <td>
                          <input className="table-input no-print" value={inspection.notes} onChange={(e) => updateNote(inspection.id, e.target.value)} />
                          <span className="print-only">{inspection.notes}</span>
                        </td>
                        {selectedTrack.sleepers.map((sleeper) => {
                          const currentStatus = normalizeStatus(inspection.conditions?.[sleeper.id] || 'bom')
                          return (
                            <td key={sleeper.id}>
                              <div className="cell-stack no-print">
                                {Object.entries(STATUS).map(([statusKey, status]) => (
                                  <button
                                    key={statusKey}
                                    type="button"
                                    className={`cell-option ${status.className} ${currentStatus === statusKey ? 'active' : ''}`}
                                    onClick={() => updateCell(inspection.id, sleeper.id, statusKey)}
                                    title={status.label}
                                  >
                                    {status.short}
                                  </button>
                                ))}
                              </div>
                              <span className={`print-cell ${STATUS[currentStatus].className} print-only`}>{STATUS[currentStatus].short}</span>
                            </td>
                          )
                        })}
                        <td className="no-print"><button className="ghost" disabled={selectedTrack.inspections.length === 1} onClick={() => deleteInspection(inspection.id)}><Trash2 size={15} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === 'relatorios' && (
          <>
            <section className="split report-section">
              <div className="panel">
                <h2>Ranking dos trechos da companhia</h2>
                <div className="table-wrap compact">
                  <table>
                    <thead>
                      <tr><th>#</th><th>Trecho</th><th>Classificação</th><th>Desempenho</th><th>Inservíveis</th><th>Ruína</th><th>Malhas</th><th>Risco</th></tr>
                    </thead>
                    <tbody>
                      {ranking.map((item, index) => (
                        <tr key={item.track.id} className={item.track.id === selectedTrack.id ? 'highlight-row' : ''}>
                          <td>{index + 1}</td>
                          <td>{item.track.name}</td>
                          <td>{item.analytics.classification}</td>
                          <td>{item.analytics.latest.desempenho}</td>
                          <td>{item.analytics.latest.Inservível}</td>
                          <td>{item.analytics.latest.Ruína}</td>
                          <td>{item.analytics.latest.clustersCriticos}</td>
                          <td>{item.analytics.riskIndex}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel">
                <h2>Piores dormentes do trecho</h2>
                {analytics.worstSleepers.length === 0 ? (
                  <p className="analysis-text ok">Nenhum dormente com degradação registrada.</p>
                ) : (
                  <div className="table-wrap compact">
                    <table>
                      <thead><tr><th>Dormente</th><th>Status atual</th><th>Pioras</th><th>Crítico desde</th></tr></thead>
                      <tbody>
                        {analytics.worstSleepers.map((item) => (
                          <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{STATUS[item.currentStatus].label}</td>
                            <td>{item.degradationSteps}</td>
                            <td>{item.criticalSince ? formatDate(item.criticalSince) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section className="panel report-section">
              <h2>Malhas críticas da última inspeção</h2>
              {(latest.clusterDetails || []).length === 0 ? (
                <p className="analysis-text ok">Sem agrupamento crítico na última inspeção.</p>
              ) : (
                <div className="table-wrap compact">
                  <table>
                    <thead><tr><th>#</th><th>Dormentes</th><th>Quantidade</th><th>Inservíveis</th><th>Ruína</th><th>Ação sugerida</th></tr></thead>
                    <tbody>
                      {latest.clusterDetails.map((cluster) => (
                        <tr key={cluster.id}>
                          <td>{cluster.id}</td>
                          <td>{cluster.descricao}</td>
                          <td>{cluster.quantidade}</td>
                          <td>{cluster.inserviveis}</td>
                          <td>{cluster.ruinas}</td>
                          <td>{cluster.ruinas > 0 ? 'Substituir agrupamento e marcar ruína com 2 pinturas' : 'Marcar inservíveis com 1 pintura e acompanhar adjacentes'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'apresentacao' && (
          <PresentationTab
            track={selectedTrack}
            analytics={analytics}
            latest={latest}
            ranking={ranking}
            actionPlan={actionPlan}
            chartColors={chartColors}
            onPrint={printPresentationPDF}
          />
        )}

        {activeTab === 'parametros' && (
          <ParameterTab />
        )}
      </section>
    </main>
  )
}

function AppPreview({ latest, actionPlan }) {
  return (
    <div className="app-preview no-print" aria-label="Prévia visual inspirada no aplicativo Rumo">
      <div className="app-phone">
        <div className="phone-topbar">
          <span className="phone-logo">rumo</span>
          <span className="phone-menu">☰</span>
        </div>
        <div className="phone-search">O que deseja procurar?</div>
        <div className="phone-card route-card">
          <small>Trecho / FVS</small>
          <strong>Prospecção de dormentes</strong>
          <span>{latest.Inservível + latest.Ruína} críticos • {latest.clustersCriticos} malha(s)</span>
        </div>
        <div className="phone-tiles">
          <div>
            <strong>+</strong>
            <span>Nova FVS</span>
          </div>
          <div>
            <strong>≡</strong>
            <span>Minhas tarefas</span>
          </div>
        </div>
        <div className="phone-bottom-card">
          <span className="status-dot" /> {actionPlan.priority} • {actionPlan.deadline}
        </div>
      </div>
      <div className="fvs-panel">
        <div className="fvs-counter warning">
          <strong>{latest.pinturasDuas}</strong>
          <span>Ruína</span>
        </div>
        <div className="fvs-counter info">
          <strong>{latest.pinturasUma}</strong>
          <span>Inservíveis</span>
        </div>
        <div className="activity-list">
          <span>Atividades recentes</span>
          <p><b>OK</b> Malha atualizada</p>
          <p><b>NOK</b> Substituição pendente</p>
        </div>
      </div>
    </div>
  )
}

function Metric({ icon, title, value, detail }) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <article className="chart-card">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {children}
    </article>
  )
}

function PresentationTab({ track, analytics, latest, ranking, actionPlan, chartColors, onPrint }) {
  const topRisks = analytics.worstSleepers.slice(0, 6)
  const clusters = latest.clusterDetails || []
  const fileName = createPresentationFileName(track)

  return (
    <section className="presentation-page report-section">
      <section className="panel presentation-cover">
        <div>
          <span className="section-kicker">Apresentação gerencial</span>
          <h2>{track.name}</h2>
          <p>{track.equipment || 'Equipamento não informado'} • {track.kmStart} até {track.kmEnd}</p>
          <p className="muted">Arquivo sugerido: {fileName}.pdf</p>
        </div>
        <div className="presentation-score">
          <span>Classificação</span>
          <strong>{analytics.classification}</strong>
          <em>{latest.desempenho}/100</em>
        </div>
        <button className="danger no-print" onClick={onPrint}><FileText size={16} /> Gerar PDF gerencial</button>
      </section>

      <section className="presentation-kpis">
        <Metric icon={<AlertTriangle />} title="Críticos" value={`${latest.Inservível + latest.Ruína}`} detail={`${latest.criticalPercent}% inservível + ruína`} />
        <Metric icon={<Train />} title="Malhas" value={`${latest.clustersCriticos}`} detail={`Maior: ${latest.maiorMalhaCritica} dormente(s)`} />
        <Metric icon={<TrendingDown />} title="Piora" value={`${analytics.totalScoreDrop}`} detail={`em ${analytics.totalDays} dia(s)`} />
        <Metric icon={<CalendarDays />} title="Plano" value={actionPlan.priority} detail={actionPlan.deadline} />
      </section>

      <section className="panel presentation-section">
        <h2>1. Resumo executivo</h2>
        <p className="analysis-text">{analytics.interpretation} {actionPlan.action}</p>
      </section>

      <section className="split presentation-section">
        <ChartCard title="Evolução do desempenho" subtitle="Perda de desempenho ao longo das inspeções.">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analytics.rows}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis dataKey="data" stroke={chartColors.text} />
              <YAxis domain={[0, 100]} stroke={chartColors.text} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="desempenho" name="Desempenho" stroke={chartColors.navy} strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Críticos e ruína" subtitle="Quantidade de inservíveis e ruína por inspeção.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.rows}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis dataKey="data" stroke={chartColors.text} />
              <YAxis allowDecimals={false} stroke={chartColors.text} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Inservível" name="Inservível" fill={chartColors.navy} radius={[8, 8, 0, 0]} />
              <Bar dataKey="Ruína" name="Ruína" fill={chartColors.red} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="split presentation-section">
        <ChartCard title="Malhas / clusters" subtitle="Agrupamentos consecutivos críticos.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.rows}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis dataKey="data" stroke={chartColors.text} />
              <YAxis allowDecimals={false} stroke={chartColors.text} />
              <Tooltip />
              <Legend />
              <Bar dataKey="clustersCriticos" name="Malhas" fill={chartColors.navy} radius={[8, 8, 0, 0]} />
              <Bar dataKey="maiorMalhaCritica" name="Maior malha" fill={chartColors.red} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Marcação de prospecção" subtitle="Uma pintura para inservível; duas pinturas para ruína.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.rows}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis dataKey="data" stroke={chartColors.text} />
              <YAxis allowDecimals={false} stroke={chartColors.text} />
              <Tooltip />
              <Legend />
              <Bar dataKey="pinturasUma" name="1 pintura" fill={chartColors.navy} radius={[8, 8, 0, 0]} />
              <Bar dataKey="pinturasDuas" name="2 pinturas" fill={chartColors.red} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="panel presentation-section">
        <h2>2. Plano de ação sugerido</h2>
        <div className="action-plan-meta presentation-action-meta">
          <span><strong>Prioridade</strong>{actionPlan.priority}</span>
          <span><strong>Prazo</strong>{actionPlan.deadline}</span>
          <span><strong>Restrição</strong>{actionPlan.restriction}</span>
          <span><strong>Motivo</strong>{actionPlan.reason}</span>
        </div>
      </section>

      <section className="split presentation-section">
        <div className="panel">
          <h2>3. Malhas críticas</h2>
          {clusters.length === 0 ? (
            <p className="analysis-text ok">Sem malhas críticas na última inspeção.</p>
          ) : (
            <div className="table-wrap compact"><table><thead><tr><th>#</th><th>Dormentes</th><th>Qtd.</th><th>Inservíveis</th><th>Ruína</th></tr></thead><tbody>{clusters.map((cluster) => <tr key={cluster.id}><td>{cluster.id}</td><td>{cluster.descricao}</td><td>{cluster.quantidade}</td><td>{cluster.inserviveis}</td><td>{cluster.ruinas}</td></tr>)}</tbody></table></div>
          )}
        </div>
        <div className="panel">
          <h2>4. Dormentes de maior risco</h2>
          {topRisks.length === 0 ? (
            <p className="analysis-text ok">Sem dormentes degradados no trecho.</p>
          ) : (
            <div className="table-wrap compact"><table><thead><tr><th>Dormente</th><th>Status</th><th>Pioras</th><th>Crítico desde</th></tr></thead><tbody>{topRisks.map((item) => <tr key={item.id}><td>{item.id}</td><td>{STATUS[item.currentStatus].label}</td><td>{item.degradationSteps}</td><td>{item.criticalSince ? formatDate(item.criticalSince) : '-'}</td></tr>)}</tbody></table></div>
          )}
        </div>
      </section>

      <section className="panel presentation-section">
        <h2>5. Comparativo entre trechos</h2>
        <div className="table-wrap compact"><table><thead><tr><th>#</th><th>Trecho</th><th>Classificação</th><th>Críticos</th><th>Malhas</th><th>Risco</th></tr></thead><tbody>{ranking.map((item, index) => <tr key={item.track.id} className={item.track.id === track.id ? 'highlight-row' : ''}><td>{index + 1}</td><td>{item.track.name}</td><td>{item.analytics.classification}</td><td>{item.analytics.latest.Inservível + item.analytics.latest.Ruína}</td><td>{item.analytics.latest.clustersCriticos}</td><td>{item.analytics.riskIndex}</td></tr>)}</tbody></table></div>
      </section>
    </section>
  )
}

function ParameterTab() {
  const parameters = [
    {
      status: 'Bom',
      className: 'status-bom',
      resumo: 'Dormente visualmente adequado para permanecer em serviço.',
      criterio: 'Não deve apresentar perda de bitola, ombreira comprometida, fixação não travada, aço exposto, trincas relevantes ou deterioração na região do trilho.'
    },
    {
      status: 'Regular',
      className: 'status-regular',
      resumo: 'Dormente com sinais de degradação, mas ainda sem critério visual para retirada imediata.',
      criterio: 'Atenção para trincas longitudinais fora da região do trilho, fissuras e desgaste que ainda não caracterizem perda funcional crítica.'
    },
    {
      status: 'Inservível',
      className: 'status-inservivel',
      resumo: 'Dormente que ainda pode receber carga parcial, mas já transfere esforço para dormentes intercalados e deve ser quantificado para substituição.',
      criterio: 'Exemplos: perda de bitola, ombreira afogada ou quebrada, fixações não travadas, aço exposto com perda de bitola, DRT agressivo, vazios/quebras na região do trilho ou trincas transversais com perda de bitola.'
    },
    {
      status: 'Ruína',
      className: 'status-ruina',
      resumo: 'Dormente que deixou de cumprir a função de suporte e fixação dos trilhos.',
      criterio: 'A condição concentra carga nos adjacentes e exige prioridade. Na marcação, usar duas pinturas para ruína e avaliar substituição do agrupamento afetado.'
    }
  ]

  return (
    <section className="parameters-page">
      <section className="panel">
        <span className="section-kicker">Parâmetros técnicos</span>
        <h2>Como classificar dormentes na prospecção</h2>
        <p className="analysis-text">
          Esta aba transforma os critérios técnicos em uma referência rápida para o usuário durante o levantamento. A ideia é reduzir dúvida em campo e padronizar a leitura dos dados para reunião gerencial.
        </p>
      </section>

      <section className="parameter-grid">
        {parameters.map((item) => (
          <article key={item.status} className="parameter-card">
            <span className={`parameter-badge ${item.className}`}>{item.status}</span>
            <h3>{item.resumo}</h3>
            <p>{item.criterio}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>Critérios de levantamento que o sistema passou a controlar</h2>
        <div className="table-wrap compact">
          <table>
            <thead>
              <tr><th>Dado</th><th>Por que importa</th><th>Onde aparece</th></tr>
            </thead>
            <tbody>
              <tr><td>Quantidade de inservíveis</td><td>Define marcações de uma pintura e volume básico de substituição.</td><td>Dashboard, Relatórios e Excel</td></tr>
              <tr><td>Quantidade de ruína</td><td>Indica perda de função de suporte/fixação e marcação de duas pinturas.</td><td>Dashboard, Relatórios e Excel</td></tr>
              <tr><td>Malhas críticas / clusters</td><td>Mostra agrupamentos consecutivos, facilitando priorização por trecho.</td><td>Dashboard e Relatórios</td></tr>
              <tr><td>Regulares adjacentes</td><td>Mostra dormentes que precisam de acompanhamento por receberem esforço adicional.</td><td>Dashboard e resumo da inspeção</td></tr>
              <tr><td>Junta/solda no trilho</td><td>Ajuda a lembrar que a região deve ter dormentes bons antes e depois.</td><td>Cadastro do trecho</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Regra rápida de marcação</h2>
        <div className="marking-grid">
          <div><strong>Inservível</strong><span>1 pintura</span><p>Recebe carga parcial, mas acelera desgaste dos regulares intercalados.</p></div>
          <div><strong>Ruína</strong><span>2 pinturas</span><p>Deixou de cumprir função de suporte/fixação e exige prioridade no agrupamento.</p></div>
          <div><strong>Junta/solda</strong><span>Verificar entorno</span><p>Se não houver dormentes bons antes e depois, marcar substituição conforme prospecção.</p></div>
        </div>
      </section>
    </section>
  )
}
