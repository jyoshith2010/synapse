import { useEffect, useRef } from 'react'

export default function Canvas() {
  const ref = useRef()
  useEffect(() => {
    const cv = ref.current, cx = cv.getContext('2d')
    let W, H, pts = [], mx = 0, my = 0, raf
    function resize() {
      W = cv.width = window.innerWidth
      H = cv.height = window.innerHeight
    }
    resize()
    for (let i = 0; i < 60; i++) pts.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2,
      r: Math.random() * 1.2 + .3,
      h: Math.random() > .5 ? '0,255,224' : '124,58,255',
      a: Math.random() * .28 + .06
    })
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY })
    function draw() {
      cx.clearRect(0, 0, W, H)
      cx.fillStyle = '#04060f'; cx.fillRect(0, 0, W, H)
      cx.strokeStyle = 'rgba(0,255,224,0.018)'; cx.lineWidth = .5
      for (let x = 0; x < W; x += 72) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke() }
      for (let y = 0; y < H; y += 72) { cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke() }
      const mg = cx.createRadialGradient(mx, my, 0, mx, my, 220)
      mg.addColorStop(0, 'rgba(0,255,224,0.035)'); mg.addColorStop(1, 'transparent')
      cx.fillStyle = mg; cx.fillRect(0, 0, W, H)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        const dx = p.x - mx, dy = p.y - my, d = Math.sqrt(dx*dx+dy*dy)
        const b = d < 150 ? 1 + .55*(1-d/150) : 1
        cx.beginPath(); cx.arc(p.x, p.y, p.r*b, 0, Math.PI*2)
        cx.fillStyle = `rgba(${p.h},${p.a*b})`; cx.fill()
      })
      for (let i = 0; i < pts.length; i++)
        for (let j = i+1; j < pts.length; j++) {
          const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y
          const d = Math.sqrt(dx*dx+dy*dy)
          if (d < 110) {
            cx.beginPath(); cx.moveTo(pts[i].x, pts[i].y); cx.lineTo(pts[j].x, pts[j].y)
            cx.strokeStyle = `rgba(0,255,224,${.04*(1-d/110)})`; cx.lineWidth = .5; cx.stroke()
          }
        }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf) }
  }, [])
  return <canvas ref={ref} style={{ position:'fixed',inset:0,zIndex:0,pointerEvents:'none' }} />
}
