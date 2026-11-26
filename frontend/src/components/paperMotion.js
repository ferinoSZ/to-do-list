// Only the moving sheet is subdivided. The resting book stays ordinary HTML.
const clamp = n => Math.min(1, Math.max(0, n))
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t) }
const phase = (t, start, end) => smooth((t - start) / (end - start))
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function part(parent, name) {
  const node = document.createElement('div')
  node.className = name
  parent.append(node)
  return node
}

function printPage(element, host, x, y, width, height) {
  const print = element.cloneNode(true)
  print.classList.add('paper-imprint')
  print.style.cssText = `width:${width}px;height:${height}px;left:${-x}px;top:${-y}px`
  host.append(print)
  const content = element.querySelector('.leaf-content')
  if (content) print.querySelector('.leaf-content').scrollTop = content.scrollTop
}

// Each strip carries real type on BOTH sides and shares its hinge with the next strip.
export function turnPaper(layer, front, back, direction, drag, finish) {
  const width = front.offsetWidth, height = front.offsetHeight
  const count = 10, step = width / count
  const strips = Array.from({ length: count }, (_, i) => {
    const piece = part(layer, 'paper-strip')
    piece.style.width = (step + .55) + 'px'
    piece.style.transformOrigin = direction > 0 ? 'left center' : 'right center'
    const face = part(piece, 'strip-face')
    const reverse = part(piece, 'strip-face strip-back')
    const from = direction > 0 ? i * step : width - (i + 1) * step
    const to = width - from - step
    printPage(front, face, from, 0, width, height)
    printPage(back, reverse, to, 0, width, height)
    return { piece, shade: part(face, 'fold-shade'), backShade: part(reverse, 'fold-shade') }
  })

  let frame, start, from = 0, progress = 0
  function draw(p) {
    let x = 0, z = 0
    const bend = Math.sin(Math.PI * p)
    for (let i = 0; i < count; i++) {
      const u = (i + .5) / count
      const angle = Math.PI * p + bend * (.97 * (u - .42) + .14 * Math.sin(u * Math.PI * 2))
      const { piece, shade, backShade } = strips[i]
      piece.style.transform = `translate3d(${direction * x - (direction < 0 ? step : 0)}px,${-2.5 * bend * u}px,${z}px) rotateY(${-direction * angle}rad)`
      const light = bend * (.08 + .23 * Math.sin(angle) + .09 * (1 - u))
      shade.style.opacity = light
      backShade.style.opacity = Math.max(0, light - .12)
      x += Math.cos(angle) * step
      z += Math.sin(angle) * step
    }
    layer.style.setProperty('--cast', String(bend * .23))
  }

  function tick(now) {
    const goal = drag ? drag.goal : 1
    if (goal == null) {
      progress += (drag.progress - progress) * .65
      draw(progress)
    } else {
      if (start === undefined) { start = now; from = progress }
      const duration = drag ? 210 + 510 * Math.abs(goal - from) : 780
      const elapsed = reduced() ? 1 : clamp((now - start) / duration)
      progress = from + (goal - from) * smooth(elapsed)
      draw(progress)
      if (elapsed === 1) { finish(goal === 1); return }
    }
    frame = requestAnimationFrame(tick)
  }
  draw(0)
  frame = requestAnimationFrame(tick)
  return () => { cancelAnimationFrame(frame); layer.replaceChildren() }
}

// The tear travels down the gutter. Shared vertices keep neighboring paper facets
// joined while their normals change under a fixed light. The last arc ends at the drawer.
export function tearPaper(layer, sheet, pocket, side, finish) {
  const w = sheet.offsetWidth, h = sheet.offsetHeight
  const origin = layer.getBoundingClientRect(), paper = sheet.getBoundingClientRect()
  const target = pocket.getBoundingClientRect()
  const ox = paper.left - origin.left, oy = paper.top - origin.top
  const tx = target.left + target.width * .49 - origin.left
  const ty = target.top + target.height * .53 - origin.top
  const cols = 3, rows = 5, cw = w / cols, ch = h / rows
  const points = [], triangles = []
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      // A slightly irregular, deterministic crease pattern for the final wad.
      const n = row * (cols + 1) + col
      points.push({ u: col / cols, v: row / rows, bump: Math.sin(n * 7.13 + 2),
        ridge: Math.cos(n * 4.37), x: 0, y: 0, z: 0 })
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const a = row * (cols + 1) + col, b = a + 1, c = a + cols + 1, d = c + 1
      const definitions = (row + col) % 2 ? [[a,b,c],[b,d,c]] : [[a,b,d],[a,d,c]]
      for (const ids of definitions) {
        const face = part(layer, 'paper-facet')
        face.style.width = cw + 'px'
        face.style.height = ch + 'px'
        const vertices = ids.map(i => points[i])
        const uv = vertices.map(p => [(p.u * cols - col) * cw, (p.v * rows - row) * ch])
        // A few fibres remain at the bound edge as the tear reaches each facet.
        const gutter = side > 0 ? 0 : cols
        const outline = []
        for (let j = 0; j < uv.length; j++) {
          const [x, y] = uv[j]
          const [nextX, nextY] = uv[(j + 1) % uv.length]
          outline.push([x, y])
          if (Math.abs(col + x / cw - gutter) > .001 || Math.abs(nextX - x) > .001) continue
          for (let k = 1; k < 16; k++) {
            const fibreY = y + (nextY - y) * k / 16
            const fibreWidth = 1.4 + 1.1 * Math.sin((row * ch + fibreY) * .73)
            outline.push([x + side * fibreWidth, fibreY])
          }
        }
        face.style.clipPath = 'polygon(' + outline.map(([x,y]) => x + 'px ' + y + 'px').join(',') + ')'
        printPage(sheet, face, col * cw, row * ch, w, h)
        triangles.push({ face, shade: part(face, 'fold-shade'), vertices, uv })
      }
    }
  }

  let frame, start
  function tick(now) {
    if (start === undefined) start = now
    const t = reduced() ? 1 : clamp((now - start) / 1830)
    const pull = phase(t, 0, .48), fold = phase(t, .37, .76), fly = phase(t, .70, 1)
    const spin = -.22 * side * pull + .55 * side * fly
    const co = Math.cos(spin), si = Math.sin(spin)
    const centerX = ox + w * (.5 + .095 * side * pull)
    const centerY = oy + h * (.5 - .11 * pull)
    const anchorX = centerX + (tx - centerX) * fly
    const anchorY = centerY + (ty - centerY) * fly - 48 * Math.sin(Math.PI * fly)
    for (const p of points) {
      const outside = side > 0 ? p.u : 1 - p.u
      const released = phase(t, .04 + .25 * p.v, .18 + .27 * p.v)
      const cling = (1 - released) * (1 - outside) ** 2
      const crease = phase(t, .35 + .06 * p.v, .71 + .05 * outside)
      const radius = 1 - .89 * crease
      const localX = (p.u - .5) * w * radius + p.bump * 9 * crease
      const localY = (p.v - .5) * h * (1 - .91 * fold) + p.ridge * 10 * crease
      const scale = 1 - .68 * fly
      p.x = anchorX + (localX * co - localY * si) * scale
      p.y = anchorY + (localX * si + localY * co) * scale
      p.x += (ox + p.u * w - p.x) * cling
      p.y += (oy + p.v * h - p.y) * cling
      p.z = (1 - cling) * ((18 + 40 * outside * (1 - p.v)) * pull * (1 - fold)
        + (17 + p.bump * 18 + p.ridge * 8) * crease + 40 * Math.sin(Math.PI * fly)) * (1 - fly)
    }
    for (const {face, shade, vertices: [a,b,c], uv: [A,B,C]} of triangles) {
      const du = B[0]-A[0], dv = B[1]-A[1], eu = C[0]-A[0], ev = C[1]-A[1]
      const det = du * ev - dv * eu
      const axis = key => [((b[key]-a[key])*ev-(c[key]-a[key])*dv)/det,
        ((c[key]-a[key])*du-(b[key]-a[key])*eu)/det]
      const [xx,yx] = axis('x'), [xy,yy] = axis('y'), [xz,yz] = axis('z')
      const dx = a.x - xx*A[0] - yx*A[1], dy = a.y - xy*A[0] - yy*A[1], dz = a.z - xz*A[0] - yz*A[1]
      face.style.transform = `matrix3d(${xx},${xy},${xz},0,${yx},${yy},${yz},0,0,0,1,0,${dx},${dy},${dz},1)`
      const nx = xy*yz - xz*yy, ny = xz*yx - xx*yz, nz = xx*yy - xy*yx
      const light = Math.abs((-.35*nx - .46*ny + .815*nz) / (Math.hypot(nx,ny,nz) || 1))
      shade.style.opacity = (1 - light) * .56 * pull
    }
    layer.style.opacity = String(1 - phase(t,.965,1))
    if (t === 1) { finish(); return }
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
  return () => { cancelAnimationFrame(frame); layer.replaceChildren() }
}
