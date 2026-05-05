import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  RotateCcw,
  Save,
  Train,
  Trash2,
  TrendingDown
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

const STATUS = {
  bom: { label: 'Bom', short: 'B', score: 100, severity: 0, className: 'status-bom' },
  regular: { label: 'Regular', short: 'R', score: 50, severity: 1, className: 'status-regular' },
  inservivel: { label: 'Inservível', short: 'I', score: 0, severity: 2, className: 'status-inservivel' }
}

const CHART_COLORS = {
  navy: '#083b6e',
  green: '#8bd86f',
  white: '#ffffff',
  aqua: '#39a9db',
  grid: '#d7e3ef',
  text: '#22435e'
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
    kmStart: 'km 123+000',
    kmEnd: 'km 123+500',
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
  trackA.inspections[2].conditions.D004 = 'regular'
  trackA.inspections[2].conditions.D008 = 'regular'

  trackB.inspections = [
    createInspection(trackB.sleepers, d1, 'Inspeção inicial'),
    createInspection(trackB.sleepers, d2, 'Degradação acelerada'),
    createInspection(trackB.sleepers, d3, 'Trecho exige prioridade')
  ]
  ;['D002', 'D003', 'D004', 'D006', 'D009'].forEach((id) => { trackB.inspections[1].conditions[id] = 'regular' })
  ;['D002', 'D003', 'D004'].forEach((id) => { trackB.inspections[2].conditions[id] = 'inservivel' })
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

function analyzeTrack(track) {
  const sleepers = track.sleepers || []
  const inspections = [...(track.inspections || [])].sort((a, b) => parseDate(a.date) - parseDate(b.date))

  const rows = inspections.map((inspection, index) => {
    const totals = { bom: 0, regular: 0, inservivel: 0 }
    sleepers.forEach((sleeper) => {
      const status = inspection.conditions?.[sleeper.id] || 'bom'
      totals[status] += 1
    })

    const scoreSum = sleepers.reduce((sum, sleeper) => {
      const status = inspection.conditions?.[sleeper.id] || 'bom'
      return sum + STATUS[status].score
    }, 0)
    const score = sleepers.length ? Math.round(scoreSum / sleepers.length) : 0

    let worsened = 0
    let improved = 0
    let newCritical = 0
    let deteriorationSpeed = 0
    let daysSincePrevious = 0

    const previous = inspections[index - 1]
    if (previous) {
      daysSincePrevious = daysBetween(previous.date, inspection.date)
      sleepers.forEach((sleeper) => {
        const before = previous.conditions?.[sleeper.id] || 'bom'
        const now = inspection.conditions?.[sleeper.id] || 'bom'
        if (STATUS[now].severity > STATUS[before].severity) worsened += 1
        if (STATUS[now].severity < STATUS[before].severity) improved += 1
        if (now === 'inservivel' && before !== 'inservivel') newCritical += 1
      })
      const prevScoreSum = sleepers.reduce((sum, sleeper) => {
        const status = previous.conditions?.[sleeper.id] || 'bom'
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
      desempenho: score,
      criticalPercent: sleepers.length ? Number(((totals.inservivel / sleepers.length) * 100).toFixed(1)) : 0,
      regularOrWorsePercent: sleepers.length ? Number((((totals.regular + totals.inservivel) / sleepers.length) * 100).toFixed(1)) : 0,
      worsened,
      improved,
      newCritical,
      daysSincePrevious,
      deteriorationSpeed
    }
  })

  const latest = rows.at(-1) || { Bom: 0, Regular: 0, Inservível: 0, desempenho: 0, criticalPercent: 0, regularOrWorsePercent: 0 }
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
      const status = inspection.conditions?.[sleeper.id] || 'bom'
      currentStatus = status
      const previous = inspections[index - 1]
      if (previous) {
        const before = previous.conditions?.[sleeper.id] || 'bom'
        const diff = STATUS[status].severity - STATUS[before].severity
        if (diff > 0) degradationSteps += diff
      }
      if (status === 'inservivel' && !criticalSince) criticalSince = inspection.date
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
  if (latest.desempenho < 40 || latest.criticalPercent >= 30) classification = 'Crítico'
  else if (latest.desempenho < 70 || latest.criticalPercent >= 10 || latest.regularOrWorsePercent >= 35) classification = 'Atenção'

  const riskIndex = Number(((100 - latest.desempenho) + latest.criticalPercent * 1.5 + Math.max(0, averageSpeed) * 15 + latest.Inservível * 2).toFixed(1))

  let interpretation = 'Ainda não há dados suficientes para calcular tendência.'
  if (rows.length === 1) {
    interpretation = 'Ainda há apenas uma inspeção. A velocidade de deterioração aparecerá após a segunda visita ao mesmo trecho.'
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

export default function App() {
  const [tracks, setTracks] = useState(() => [createTrack()])
  const [selectedTrackId, setSelectedTrackId] = useState(null)
  const [newInspectionDate, setNewInspectionDate] = useState(today())
  const [selectedStatus, setSelectedStatus] = useState('regular')
  const [savedAt, setSavedAt] = useState('')

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
    if (!selectedTrackId && tracks.length) setSelectedTrackId(tracks[0].id)
  }, [tracks, selectedTrackId])

  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) || tracks[0]
  const analytics = useMemo(() => analyzeTrack(selectedTrack), [selectedTrack])
  const ranking = useMemo(() => {
    return tracks
      .map((track) => ({ track, analytics: analyzeTrack(track) }))
      .sort((a, b) => b.analytics.riskIndex - a.analytics.riskIndex)
  }, [tracks])

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
  }

  function deleteInspection(inspectionId) {
    if (selectedTrack.inspections.length === 1) return
    updateInspections(selectedTrack.inspections.filter((inspection) => inspection.id !== inspectionId))
  }

  function updateCell(inspectionId, sleeperId) {
    updateInspections(selectedTrack.inspections.map((inspection) => {
      if (inspection.id !== inspectionId) return inspection
      return { ...inspection, conditions: { ...inspection.conditions, [sleeperId]: selectedStatus } }
    }))
  }

  function cycleCell(inspectionId, sleeperId) {
    const order = ['bom', 'regular', 'inservivel']
    updateInspections(selectedTrack.inspections.map((inspection) => {
      if (inspection.id !== inspectionId) return inspection
      const current = inspection.conditions?.[sleeperId] || 'bom'
      const next = order[(order.indexOf(current) + 1) % order.length]
      return { ...inspection, conditions: { ...inspection.conditions, [sleeperId]: next } }
    }))
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
  }

  function exportExcel() {
    const rows = analytics.rows.map((row) => `
      <tr>
        <td>${escapeExcel(row.data)}</td>
        <td>${escapeExcel(row.Bom)}</td>
        <td>${escapeExcel(row.Regular)}</td>
        <td>${escapeExcel(row.Inservível)}</td>
        <td>${escapeExcel(row.desempenho)}</td>
        <td>${escapeExcel(row.criticalPercent)}%</td>
        <td>${escapeExcel(row.worsened)}</td>
        <td>${escapeExcel(row.newCritical)}</td>
        <td>${escapeExcel(row.deteriorationSpeed)}</td>
      </tr>
    `).join('')

    const gridRows = [...selectedTrack.inspections]
      .sort((a, b) => parseDate(a.date) - parseDate(b.date))
      .map((inspection) => `
        <tr>
          <td>${escapeExcel(formatDate(inspection.date))}</td>
          <td>${escapeExcel(inspection.notes)}</td>
          ${selectedTrack.sleepers.map((sleeper) => `<td>${escapeExcel(STATUS[inspection.conditions?.[sleeper.id] || 'bom'].label)}</td>`).join('')}
        </tr>
      `).join('')

    const rankingRows = ranking.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeExcel(item.track.name)}</td>
        <td>${escapeExcel(item.track.kmStart)}</td>
        <td>${escapeExcel(item.track.kmEnd)}</td>
        <td>${escapeExcel(item.analytics.classification)}</td>
        <td>${escapeExcel(item.analytics.latest.desempenho)}</td>
        <td>${escapeExcel(item.analytics.averageSpeed)}</td>
        <td>${escapeExcel(item.analytics.riskIndex)}</td>
      </tr>
    `).join('')

    const sleeperHeaders = selectedTrack.sleepers.map((sleeper) => `<th>${escapeExcel(sleeper.id)}</th>`).join('')
    const html = `
      <html><head><meta charset="UTF-8" /></head><body>
        <h1>Relatório de inspeção de dormentes</h1>
        <p><strong>Trecho:</strong> ${escapeExcel(selectedTrack.name)}</p>
        <p><strong>Local:</strong> ${escapeExcel(selectedTrack.kmStart)} até ${escapeExcel(selectedTrack.kmEnd)}</p>
        <p><strong>Classificação:</strong> ${escapeExcel(analytics.classification)}</p>
        <p><strong>Análise:</strong> ${escapeExcel(analytics.interpretation)}</p>
        <h2>Ranking de trechos da companhia</h2>
        <table border="1"><tr><th>Ranking</th><th>Trecho</th><th>KM inicial</th><th>KM final</th><th>Classificação</th><th>Desempenho</th><th>Velocidade</th><th>Índice de risco</th></tr>${rankingRows}</table>
        <h2>Análise por inspeção</h2>
        <table border="1"><tr><th>Data</th><th>Bom</th><th>Regular</th><th>Inservível</th><th>Desempenho</th><th>% Inservível</th><th>Pioraram</th><th>Novos inservíveis</th><th>Velocidade</th></tr>${rows}</table>
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

  const latest = analytics.latest

  return (
    <main className="app">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Train size={16} /> Sistema de acompanhamento de dormentes</span>
          <h1>Controle de desempenho por trecho ferroviário</h1>
          <p>Registre inspeções, acompanhe a deterioração dos dormentes e compare quais trechos da companhia exigem prioridade.</p>
          <div className="hero-tags">
            <span className="hero-tag">Azul escuro</span>
            <span className="hero-tag">Branco</span>
            <span className="hero-tag hero-tag-green">Verde claro</span>
          </div>
        </div>
        <div className="hero-side">
          <div className={`classification classification-${analytics.classification.toLowerCase().replace('ç', 'c').replace('ã', 'a')}`}>
            <small>Classificação atual</small>
            <strong>{analytics.classification}</strong>
            <span>{latest.desempenho}/100</span>
          </div>
          <div className="hero-art" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, index) => (
              <span key={index} className={`hero-block ${index % 2 === 0 ? 'primary' : 'accent'}`} />
            ))}
          </div>
        </div>
      </header>

      <section className="layout">
        <aside className="panel no-print">
          <div className="panel-title-row">
            <h2>Trechos</h2>
            <button className="icon-button" onClick={addTrack} title="Adicionar trecho"><Plus size={18} /></button>
          </div>
          <div className="track-list">
            {tracks.map((track) => {
              const item = analyzeTrack(track)
              return (
                <button key={track.id} className={`track-button ${track.id === selectedTrack.id ? 'active' : ''}`} onClick={() => setSelectedTrackId(track.id)}>
                  <strong>{track.name}</strong>
                  <span>{track.kmStart} até {track.kmEnd}</span>
                  <small>Risco {item.riskIndex} • {item.classification}</small>
                </button>
              )
            })}
          </div>
          <button className="danger outline full" disabled={tracks.length === 1} onClick={() => removeTrack(selectedTrack.id)}><Trash2 size={16} /> Excluir trecho selecionado</button>
        </aside>

        <section className="content">
          <section className="panel no-print">
            <div className="panel-title-row">
              <h2>Dados do trecho</h2>
              <div className="actions">
                <button onClick={saveData}><Save size={16} /> Salvar</button>
                <button onClick={exportExcel} className="success"><FileSpreadsheet size={16} /> Excel</button>
                <button onClick={printPDF} className="danger"><FileText size={16} /> PDF</button>
                <button onClick={loadDemo} className="outline"><RotateCcw size={16} /> Exemplo</button>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Nome do trecho
                <input value={selectedTrack.name} onChange={(e) => updateTrack({ name: e.target.value })} />
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
                Quantidade de dormentes
                <span className="input-with-button">
                  <input type="number" min="1" max="300" value={selectedTrack.sleeperCount} onChange={(e) => updateTrack({ sleeperCount: e.target.value })} />
                  <button onClick={applySleeperCount}>Aplicar</button>
                </span>
              </label>
            </div>
            {savedAt && <p className="muted">Último salvamento: {savedAt}</p>}
          </section>

          <section className="metrics report-section">
            <Metric icon={<BarChart3 />} title="Desempenho atual" value={`${latest.desempenho}/100`} detail="Bom 100, Regular 50, Inservível 0" />
            <Metric icon={<TrendingDown />} title="Velocidade de queda" value={`${analytics.averageSpeed}`} detail="ponto(s) perdidos por dia" />
            <Metric icon={<AlertTriangle />} title="Inservíveis" value={`${latest.Inservível}`} detail={`${latest.criticalPercent}% do trecho`} />
            <Metric icon={<CalendarDays />} title="Projeção crítica" value={analytics.projectedDaysToCritical === null ? 'Estável' : `${analytics.projectedDaysToCritical} dias`} detail="Se o ritmo continuar" />
          </section>

          <section className="panel report-section">
            <h2>Leitura automática</h2>
            <p className="analysis-text">
              {analytics.interpretation} Na última inspeção, o trecho possui <strong>{latest.Bom}</strong> dormente(s) bom(ns), <strong>{latest.Regular}</strong> regular(es) e <strong>{latest.Inservível}</strong> inservível(is). A perda total de desempenho desde a primeira inspeção foi de <strong>{analytics.totalScoreDrop}</strong> ponto(s) em <strong>{analytics.totalDays}</strong> dia(s).
            </p>
          </section>

          <section className="charts report-section">
            <ChartCard title="Desempenho do trecho" subtitle="Quanto mais a linha cai, pior a evolução.">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analytics.rows}>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="data" stroke={CHART_COLORS.text} />
                  <YAxis domain={[0, 100]} stroke={CHART_COLORS.text} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="desempenho" name="Desempenho" stroke={CHART_COLORS.navy} strokeWidth={3} dot={{ r: 5, fill: CHART_COLORS.green, stroke: CHART_COLORS.navy }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Composição por inspeção" subtitle="Mostra a passagem de bom para regular e inservível.">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={analytics.rows}>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="data" stroke={CHART_COLORS.text} />
                  <YAxis allowDecimals={false} stroke={CHART_COLORS.text} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Bom" stackId="1" stroke={CHART_COLORS.green} fill={CHART_COLORS.green} fillOpacity={0.75} />
                  <Area type="monotone" dataKey="Regular" stackId="1" stroke={CHART_COLORS.aqua} fill={CHART_COLORS.aqua} fillOpacity={0.7} />
                  <Area type="monotone" dataKey="Inservível" stackId="1" stroke={CHART_COLORS.navy} fill={CHART_COLORS.navy} fillOpacity={0.9} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Velocidade de deterioração" subtitle="Pontos perdidos por dia entre uma inspeção e outra.">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.rows}>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="data" stroke={CHART_COLORS.text} />
                  <YAxis stroke={CHART_COLORS.text} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deteriorationSpeed" name="Pontos/dia" fill={CHART_COLORS.navy} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Dormentes que pioraram" subtitle="Quantidade de dormentes que decaíram desde a visita anterior.">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.rows}>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="data" stroke={CHART_COLORS.text} />
                  <YAxis allowDecimals={false} stroke={CHART_COLORS.text} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="worsened" name="Pioraram" fill={CHART_COLORS.navy} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="newCritical" name="Novos inservíveis" fill={CHART_COLORS.green} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="panel no-print">
            <h2>Nova inspeção</h2>
            <div className="inspection-controls">
              <input type="date" value={newInspectionDate} onChange={(e) => setNewInspectionDate(e.target.value)} />
              <button onClick={addInspection}><Plus size={16} /> Adicionar linha</button>
              <div className="status-picker">
                {Object.entries(STATUS).map(([key, status]) => (
                  <button key={key} className={`${status.className} ${selectedStatus === key ? 'selected' : ''}`} onClick={() => setSelectedStatus(key)}>{status.label}</button>
                ))}
              </div>
            </div>
            <label className="full-label">
              Regra de retorno / periodicidade
              <textarea value={selectedTrack.periodRule} onChange={(e) => updateTrack({ periodRule: e.target.value })} rows={3} />
            </label>
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
                      <td className="sticky-col strong">{formatDate(inspection.date)}</td>
                      <td>
                        <input className="table-input no-print" value={inspection.notes} onChange={(e) => updateNote(inspection.id, e.target.value)} />
                        <span className="print-only">{inspection.notes}</span>
                      </td>
                      {selectedTrack.sleepers.map((sleeper) => {
                        const key = inspection.conditions?.[sleeper.id] || 'bom'
                        return (
                          <td key={sleeper.id}>
                            <button className={`cell ${STATUS[key].className} no-print`} onClick={() => updateCell(inspection.id, sleeper.id)} onDoubleClick={() => cycleCell(inspection.id, sleeper.id)}>{STATUS[key].short}</button>
                            <span className={`print-cell ${STATUS[key].className} print-only`}>{STATUS[key].short}</span>
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

          <section className="split report-section">
            <div className="panel">
              <h2>Ranking dos trechos da companhia</h2>
              <div className="table-wrap compact">
                <table>
                  <thead>
                    <tr><th>#</th><th>Trecho</th><th>Classificação</th><th>Desempenho</th><th>Velocidade</th><th>Risco</th></tr>
                  </thead>
                  <tbody>
                    {ranking.map((item, index) => (
                      <tr key={item.track.id} className={item.track.id === selectedTrack.id ? 'highlight-row' : ''}>
                        <td>{index + 1}</td>
                        <td>{item.track.name}</td>
                        <td>{item.analytics.classification}</td>
                        <td>{item.analytics.latest.desempenho}</td>
                        <td>{item.analytics.averageSpeed}</td>
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
        </section>
      </section>
    </main>
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
