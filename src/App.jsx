import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import './styles.css'

const PRIZES = [
  { rank: 1, count: 1, title: '1등', desc: '최고의 행운! 특별 보상', emoji: '👑', cls: 'r1' },
  { rank: 2, count: 5, title: '2등', desc: '대단한 행운! 특별 보상', emoji: '💎', cls: 'r2' },
  { rank: 3, count: 15, title: '3등', desc: '멋진 행운! 특별 보상', emoji: '🏆', cls: 'r3' },
  { rank: 4, count: 30, title: '4등', desc: '기분 좋은 행운!', emoji: '🎁', cls: 'r4' },
  { rank: 5, count: 60, title: '5등', desc: '작지만 확실한 행운!', emoji: '🍀', cls: 'r5' },
  { rank: 6, count: 189, title: '6등', desc: '다음 행운을 기대해요!', emoji: '⭐', cls: 'r6' },
]
const STORAGE = 'class-lottery-board-v2'
function makeTickets() { const pool = PRIZES.flatMap(p => Array.from({ length: p.count }, (_, i) => ({ id: `${p.rank}-${i + 1}`, rank: p.rank }))); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }; return pool }
function initialState() { return { tickets: makeTickets(), draws: [], students: [] } }
function loadState() { try { return JSON.parse(localStorage.getItem(STORAGE)) || initialState() } catch { return initialState() } }
function saveState(s) { localStorage.setItem(STORAGE, JSON.stringify(s)) }

export default function App() {
  const [state, setState] = useState(loadState)
  const [mode, setMode] = useState(new URLSearchParams(location.search).get('teacher') ? 'teacher' : 'student')
  const [student, setStudent] = useState('')
  const [selected, setSelected] = useState(null)
  const [scratched, setScratched] = useState(false)
  const [message, setMessage] = useState('')
  const remaining = state.tickets.length
  const counts = useMemo(() => PRIZES.map(p => ({ ...p, remaining: state.tickets.filter(t => t.rank === p.rank).length })), [state.tickets])
  const students = useMemo(() => state.students.length ? state.students : [...new Set(state.draws.map(d => d.student))], [state.students, state.draws])
  const persist = next => { setState(next); saveState(next) }
  const pickTicket = () => { if (!student.trim()) return setMessage('학생 이름을 먼저 선택해주세요.'); if (!state.tickets.length) return setMessage('모든 복권이 소진되었습니다.'); const ticket = state.tickets[Math.floor(Math.random() * state.tickets.length)]; setSelected(ticket); setScratched(false); setMessage('') }
  const reveal = () => { if (!selected || scratched) return; const draw = { id: crypto.randomUUID(), student: student.trim(), rank: selected.rank, time: new Date().toISOString() }; persist({ ...state, tickets: state.tickets.filter(t => t.id !== selected.id), draws: [draw, ...state.draws], students }); setScratched(true) }
  const reset = () => { if (!confirm('모든 뽑기 기록과 남은 복권을 초기화할까요?')) return; const next = initialState(); persist(next); setStudent(''); setSelected(null); setMessage('복권 300장이 새로 준비되었습니다.') }
  const importExcel = async e => { const file = e.target.files?.[0]; if (!file) return; try { const data = await file.arrayBuffer(); const wb = XLSX.read(data, { type: 'array' }); const ws = wb.Sheets[wb.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }); const names = [...new Set(rows.flat().map(v => String(v).trim()).filter(Boolean).filter(v => v !== '학생명' && v !== '이름'))]; persist({ ...state, students: names }); setMessage(`${names.length}명의 학생 명단을 불러왔습니다.`) } catch { setMessage('엑셀 파일을 읽지 못했습니다. .xlsx, .xls 또는 .csv 파일을 확인해주세요.') }; e.target.value = '' }
  const rankStats = name => PRIZES.map(p => state.draws.filter(d => d.student === name && d.rank === p.rank).length)
  return <div className="app"><header className="topbar"><div><span className="eyebrow">CLASS LOTTERY · SOCIAL & HISTORY</span><h1>우리 반 행운 복권판</h1><p>수업 참여 보상으로 즐기는 300장의 스크래치 복권</p></div><div className="top-actions"><button className={mode === 'student' ? 'active' : ''} onClick={() => setMode('student')}>🎟 학생 화면</button><button className={mode === 'teacher' ? 'active' : ''} onClick={() => setMode('teacher')}>👨‍🏫 교사용</button></div></header>{mode === 'student' ? <StudentView students={students} student={student} setStudent={setStudent} pickTicket={pickTicket} remaining={remaining} counts={counts} selected={selected} scratched={scratched} reveal={reveal} closeTicket={() => { setSelected(null); setScratched(false) }} message={message} /> : <TeacherView state={state} counts={counts} students={students} importExcel={importExcel} reset={reset} message={message} rankStats={rankStats} setMode={setMode} />}</div>
}

function StudentView({ students, student, setStudent, pickTicket, remaining, counts, selected, scratched, reveal, closeTicket, message }) {
  return <main className="shell"><section className="hero"><div className="hero-text"><span className="hero-kicker">TODAY'S LUCKY DRAW</span><h2>내 행운의 복권을<br /><strong>직접 골라보세요!</strong></h2><p>복권 한 장을 선택하고 회색 은박을 긁으면<br />당첨 결과가 나타납니다.</p><div className="student-select"><label>학생 이름</label>{students.length ? <select value={student} onChange={e => setStudent(e.target.value)}><option value="">내 이름을 선택하세요</option>{students.map(n => <option key={n}>{n}</option>)}</select> : <input value={student} onChange={e => setStudent(e.target.value)} placeholder="학생 이름을 입력하세요" />}</div><button className="main-cta" onClick={pickTicket}>🎟️ 내 복권 뽑기 <span>→</span></button>{message && <div className="notice">{message}</div>}</div><div className="hero-ticket"><div className="ticket-stamp">LUCKY<br />DRAW</div><div className="ticket-question">?</div><small>SCRATCH TO REVEAL</small></div></section><section className="board"><div className="board-head"><div><span>PRIZE BOARD</span><h2>등수별 복권 현황</h2></div><b>{remaining}<small> / 300장 남음</small></b></div><div className="rank-grid">{counts.map(p => <div key={p.rank} className={`rank-card ${p.cls}`}><div className="rank-num">{p.rank}<small>등</small></div><div className="rank-icon">{p.emoji}</div><div className="rank-info"><strong>{p.title}</strong><span>{p.desc}</span></div><div className="rank-stock">{p.remaining}<small>남음</small></div></div>)}</div></section>{selected && <ScratchModal ticket={selected} scratched={scratched} onScratch={reveal} onClose={closeTicket} />}</main>
}

function ScratchModal({ ticket, scratched, onScratch, onClose }) {
  const [progress, setProgress] = useState(0); const prize = PRIZES.find(p => p.rank === ticket.rank)
  const doScratch = () => { if (scratched) return; const n = Math.min(100, progress + 14); setProgress(n); if (n >= 70) onScratch() }
  return <div className="overlay"><div className="scratch-modal"><button className="x" onClick={onClose}>×</button><div className="scratch-header"><span>🎟️ CLASS LOTTERY</span><h2>복권을 긁어보세요!</h2><p>{scratched ? '축하합니다! 당첨 결과가 공개되었습니다.' : '은박 부분을 마우스나 손가락으로 여러 번 문질러주세요.'}</p></div><div className={`real-ticket ${scratched ? 'revealed' : ''}`}><div className="ticket-edge" /><div className="result"><span className={`result-rank ${prize.cls}`}>{prize.title}</span><div className="result-emoji">{prize.emoji}</div><h3>{scratched ? `${prize.title} 당첨!` : '???'}</h3><p>{scratched ? prize.desc : '은박을 모두 긁으면 결과가 공개됩니다.'}</p></div>{!scratched && <div className="foil" onMouseMove={e => e.buttons && doScratch()} onMouseDown={doScratch} onTouchMove={doScratch} onTouchStart={doScratch}><span>SCRATCH</span><b>긁어주세요</b><small>LUCKY TICKET</small></div>}</div><div className="scratch-meter"><div><span>긁은 정도</span><b>{scratched ? 100 : progress}%</b></div><i><em style={{ width: `${scratched ? 100 : progress}%` }} /></i></div>{scratched && <button className="done" onClick={onClose}>🎉 결과 확인하기</button>}</div></div>
}

function TeacherView({ state, counts, students, importExcel, reset, message, rankStats, setMode }) {
  const [q, setQ] = useState(''); const filtered = students.filter(s => s.includes(q))
  return <main className="teacher-shell"><div className="teacher-title"><div><span className="eyebrow">TEACHER DASHBOARD</span><h2>교사용 현황판</h2><p>복권 재고, 당첨 기록, 학생 명단을 한 곳에서 관리합니다.</p></div><button onClick={() => setMode('student')}>← 학생 화면으로</button></div><section className="admin-grid"><div className="admin-card upload-card"><div className="card-icon">📊</div><h3>학생 명단 올리기</h3><p>엑셀 첫 번째 시트에 학생 이름을 한 열로 넣어주세요.</p><label className="upload-btn">📥 Excel 파일 선택<input type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} hidden /></label><small>지원: .xlsx / .xls / .csv</small>{message && <div className="notice">{message}</div>}</div><div className="admin-card total-card"><span>남은 복권</span><strong>{state.tickets.length}<small> / 300</small></strong><div className="total-bar"><i style={{ width: `${state.tickets.length / 3}%` }} /></div><p>사용된 복권 {300 - state.tickets.length}장</p></div></section><section className="admin-card"><div className="card-heading"><div><span>INVENTORY</span><h3>등수별 잔여 복권</h3></div><button className="danger" onClick={reset}>↻ 전체 초기화</button></div><div className="inventory">{counts.map(p => <div key={p.rank} className={`inventory-row ${p.cls}`}><b>{p.rank}등</b><span>{p.emoji}</span><strong>{p.remaining}</strong><small>/ {p.count}장</small><div><i style={{ width: `${p.remaining / p.count * 100}%` }} /></div></div>)}</div></section><section className="admin-card"><div className="card-heading"><div><span>DRAW HISTORY</span><h3>학생별 당첨 현황</h3></div><input className="search" value={q} onChange={e => setQ(e.target.value)} placeholder="학생 검색" /></div><div className="student-table"><div className="tr th"><span>학생</span>{PRIZES.map(p => <span key={p.rank}>{p.rank}등</span>)}<span>총 횟수</span></div>{filtered.map(name => { const stats = rankStats(name); return <div className="tr" key={name}><b>{name}</b>{stats.map((n, i) => <span key={i}>{n}</span>)}<strong>{stats.reduce((a,b)=>a+b,0)}</strong></div> })}</div>{!students.length && <div className="empty">아직 학생 명단이 없습니다. 위에서 엑셀 파일을 올려주세요.</div>}</section><section className="admin-card recent"><div className="card-heading"><div><span>RECENT DRAWS</span><h3>최근 추첨 기록</h3></div></div>{state.draws.slice(0,20).map(d => <div className="recent-row" key={d.id}><time>{new Date(d.time).toLocaleString('ko-KR')}</time><b>{d.student}</b><span>{d.rank}등</span></div>)}</section></main>
}
