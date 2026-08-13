import { useEffect, useMemo, useRef, useState } from 'react'
import { defaultRewards } from './data/rewards'
import './styles.css'

const rarityLabel = { common: '일반', rare: '희귀', epic: '에픽', legendary: '전설' }

export default function App() {
  const [rewards, setRewards] = useState(defaultRewards)
  const [selected, setSelected] = useState(null)
  const [student, setStudent] = useState('')
  const [drawn, setDrawn] = useState([])
  const [scratchPrize, setScratchPrize] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const remaining = useMemo(() => rewards.reduce((sum, r) => sum + r.stock, 0), [rewards])

  const draw = () => {
    if (!student.trim()) return alert('학생 이름을 먼저 입력해주세요.')
    const available = rewards.filter(r => r.stock > 0)
    if (!available.length) return alert('복권이 모두 소진되었습니다.')
    const weighted = available.flatMap(r => Array(r.rarity === 'legendary' ? 1 : r.rarity === 'epic' ? 2 : r.rarity === 'rare' ? 4 : 8).fill(r))
    const prize = weighted[Math.floor(Math.random() * weighted.length)]
    setRewards(prev => prev.map(r => r.id === prize.id ? { ...r, stock: r.stock - 1 } : r))
    setDrawn(prev => [{ student: student.trim(), prize, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }, ...prev].slice(0, 8))
    setScratchPrize(prize)
    setIsDrawing(true)
  }

  return <div className="app">
    <header><div><span className="eyebrow">SOCIAL · HISTORY CLASS</span><h1>우리 반 행운 복권판</h1><p>수업 참여와 학급 활동에 즐거운 보상을 더해보세요.</p></div><div className="counter"><strong>{remaining}</strong><span>남은 복권</span></div></header>
    <main>
      <section className="hero-card"><div className="hero-copy"><div className="ticket">🎟️</div><h2>오늘의 행운을 뽑아볼까요?</h2><p>학생 이름을 입력하고 실제 복권처럼 긁어보세요.</p><div className="draw-row"><input value={student} onChange={e => setStudent(e.target.value)} placeholder="학생 이름" onKeyDown={e => e.key === 'Enter' && draw()} /><button onClick={draw} disabled={isDrawing}>🎟️ 복권 뽑기</button></div></div><ScratchTicket /></section>
      <section><div className="section-title"><h2>복권 보상판</h2><span>희귀도가 높을수록 당첨 확률이 낮아요.</span></div><div className="grid">{rewards.map(r => <button className={`prize ${r.rarity}`} key={r.id} onClick={() => r.stock > 0 && setSelected(r)}><span className="prize-emoji">{r.emoji}</span><span className="rarity">{rarityLabel[r.rarity]}</span><strong>{r.title}</strong><small>{r.description}</small><em>{r.stock > 0 ? `${r.stock}장 남음` : 'SOLD OUT'}</em></button>)}</div></section>
      {drawn.length > 0 && <section className="history"><div className="section-title"><h2>최근 당첨 기록</h2><span>이름 공개가 부담스럽다면 별칭을 사용하세요.</span></div>{drawn.map((d, i) => <div className="history-row" key={i}><span>{d.time}</span><b>{d.student}</b><span>→ {d.prize.emoji} {d.prize.title}</span></div>)}</section>}
    </main>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><div className="big-emoji">{selected.emoji}</div><span className={`modal-rarity ${selected.rarity}`}>{rarityLabel[selected.rarity]} 보상</span><h2>{selected.title}</h2><p>{selected.description}</p><button className="confirm" onClick={() => setSelected(null)}>확인했어요!</button></div></div>}
    {isDrawing && scratchPrize && <ScratchModal prize={scratchPrize} onDone={() => { setIsDrawing(false); setSelected(scratchPrize) }} />}
    <footer>Vite + React · Supabase 연동 준비 · GitHub/Vercel 배포 구조</footer>
  </div>
}

function ScratchModal({ prize, onDone }) {
  const [revealed, setRevealed] = useState(false)
  const [progress, setProgress] = useState(0)
  const canvasRef = useRef(null)
  const scratching = useRef(false)
  const points = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
    gradient.addColorStop(0, '#858b96'); gradient.addColorStop(.5, '#c9cdd3'); gradient.addColorStop(1, '#777e89')
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = '#ffffff99'; ctx.font = '800 16px Noto Sans KR'; ctx.textAlign = 'center'
    ctx.fillText('손가락으로 긁어주세요', rect.width / 2, rect.height / 2 + 6)
    ctx.globalCompositeOperation = 'destination-out'
  }, [])

  const scratch = e => {
    if (!scratching.current || revealed) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const point = e.touches?.[0] || e
    const x = point.clientX - rect.left
    const y = point.clientY - rect.top
    const ctx = canvas.getContext('2d')
    ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill()
    points.current += 1
    if (points.current % 3 === 0) {
      setProgress(p => {
        const next = Math.min(100, p + 2)
        if (next >= 62 && !revealed) {
          setRevealed(true)
          setTimeout(onDone, 900)
        }
        return next
      })
    }
  }

  return <div className="modal-backdrop scratch-backdrop"><div className="scratch-modal" onClick={e => e.stopPropagation()}><div className="scratch-head"><span>🎟️ LUCKY TICKET</span><b>복권을 긁어보세요!</b><small>{revealed ? '당첨 결과가 공개되었습니다!' : '회색 부분을 손가락이나 마우스로 긁어주세요.'}</small></div><div className={`scratch-ticket ${revealed ? 'revealed' : ''}`}><div className="reward-under"><span className={`scratch-rarity ${prize.rarity}`}>{rarityLabel[prize.rarity]}</span><div>{prize.emoji}</div><strong>{prize.title}</strong><small>{prize.description}</small></div><canvas ref={canvasRef} onMouseDown={() => { scratching.current = true }} onMouseUp={() => { scratching.current = false }} onMouseLeave={() => { scratching.current = false }} onMouseMove={scratch} onTouchStart={() => { scratching.current = true }} onTouchEnd={() => { scratching.current = false }} onTouchMove={scratch} /></div><div className="scratch-progress"><span>긁은 정도</span><div><i style={{ width: `${progress}%` }} /></div><b>{progress}%</b></div></div></div>
}

function ScratchTicket() {
  return <div className="scratch-preview"><span>LUCKY</span><b>?</b><small>SCRATCH & WIN</small></div>
}
