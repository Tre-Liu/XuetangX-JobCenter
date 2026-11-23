// Both rendering backends share this cartographic layer and the same camera coordinates.
;(function(root) {
  const tau=2*Math.PI
  const day={
    mapOcean:'#eef5f9',mapGrid:'#d6e2e9',mapBorder:'95',mapFill:'25',
    ocean:[[0,'#fbfdff'],[.68,'#edf5fa'],[.94,'#dcebf4'],[1,'#dbe9f2']],
    rim:'#b4cddc',outerRim:'#dceaf2',graticule:'#97b3c442',
    land:{rear:'05',overview:'13',selected:'15',nearby:'09',linked:'42',muted:'07'},
    coast:{normal:'56',selected:'76',linked:'d0',muted:'30'},
    link:{normal:'80',dense:'60',muted:'46',underlay:'#ffffffd9',markerRim:'#fff'},
  }
  const night={
    mapOcean:'#102133',mapGrid:'#20394b',mapBorder:'c0',mapFill:'35',
    ocean:[[0,'#274359bc'],[.66,'#172e42c7'],[.91,'#122636dd'],[1,'#33566bcb']],
    rim:'#8fc1db86',outerRim:'#6195b526',graticule:'#96c3db39',
    land:{rear:'06',overview:'1b',selected:'28',nearby:'0c',linked:'3b',muted:'08'},
    coast:{normal:'76',selected:'b0',linked:'fa',muted:'35'},
    link:{normal:'a0',dense:'68',muted:'56',underlay:'#091522dc',markerRim:'#d9f1ff'},
  }
  function coordinates(canvas,w,h,dpr) {
    canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr)
    const ctx=canvas.getContext('2d')
    ctx.setTransform(dpr,0,0,dpr,0,0)
    return ctx
  }
  function membershipRing(ctx,x,y,radius,domains,regions) {
    const segment=tau/domains.length
    domains.forEach((di,i)=>{
      const start=-Math.PI/2+i*segment
      ctx.beginPath()
      ctx.arc(x,y,radius,start+.05,start+segment-.05)
      ctx.strokeStyle=regions[di].domain.color
      ctx.stroke()
    })
  }
  function miniature(canvas,regions,darkMode=false) {
    const w=320,h=160,ctx=coordinates(canvas,w,h,1)
    const paint=darkMode ? night : day
    const point=root.KnowledgeDomainAtlas.mapPoint
    ctx.fillStyle=paint.mapOcean; ctx.fillRect(0,0,w,h)
    ctx.beginPath()
    for(let x=0;x<=w;x+=w/12) {ctx.moveTo(x,0);ctx.lineTo(x,h)}
    for(let y=0;y<=h;y+=h/6) {ctx.moveTo(0,y);ctx.lineTo(w,y)}
    ctx.strokeStyle=paint.mapGrid;ctx.lineWidth=1;ctx.stroke()
    for (const r of regions) {
      if(r.domain.deleted || !r.rim.length) continue
      const rim=r.rim.map(point)
      const unwrapped=[rim[0]]
      for(const p of [...rim.slice(1),rim[0]]) {
        const last=unwrapped[unwrapped.length-1]
        unwrapped.push({u:p.u+Math.round(last.u-p.u),v:p.v})
      }
      for(const shift of [-1,0,1]) {
        ctx.beginPath()
        unwrapped.forEach((p,i)=>{
          if(i===0)ctx.moveTo((p.u+shift)*w,p.v*h)
          else ctx.lineTo((p.u+shift)*w,p.v*h)
        })
        ctx.lineWidth=1.2;ctx.strokeStyle=r.domain.color+paint.mapBorder;ctx.stroke()
        const first=unwrapped[0],last=unwrapped[unwrapped.length-1]
        if(Math.abs(last.u-first.u)>.5) {
          const poleY=r.center.y>0?0:h
          ctx.lineTo((last.u+shift)*w,poleY);ctx.lineTo((first.u+shift)*w,poleY)
        }
        ctx.closePath();ctx.fillStyle=r.domain.color+paint.mapFill;ctx.fill()
      }
    }
  }
  // Reuse the same soft volume and lettering for drawing and for rear-surface attenuation.
  function coreImage(doc,name) {
    const image=doc.createElement('canvas'), size=384, mid=size/2
    image.width=image.height=size
    const ctx=image.getContext('2d')
    const glow=ctx.createRadialGradient(mid,mid,0,mid,mid,mid)
    glow.addColorStop(0,'rgba(255,210,135,.92)')
    glow.addColorStop(.34,'rgba(255,189,99,.80)')
    glow.addColorStop(.62,'rgba(248,164,73,.43)')
    glow.addColorStop(.84,'rgba(242,155,72,.11)')
    glow.addColorStop(1,'rgba(242,155,72,0)')
    ctx.fillStyle=glow
    ctx.fillRect(0,0,size,size)

    const letters=Array.from(name)
    // Keep the name in the bright center, where it stays legible over either ocean.
    const columns=Math.max(5,Math.ceil(Math.sqrt(letters.length*1.7)))
    const rows=Math.ceil(letters.length/columns) || 1
    const perRow=Math.ceil(letters.length/rows)
    const fontSize=Math.min(42,size*.75/columns,size*.52/(rows*1.2))
    ctx.font='550 '+fontSize+'px system-ui, sans-serif'
    ctx.fillStyle='#634329'
    ctx.textAlign='center';ctx.textBaseline='middle'
    for(let i=0;i<rows;i++) {
      const line=letters.slice(i*perRow,(i+1)*perRow).join('')
      ctx.fillText(line,mid,mid+(i-(rows-1)/2)*fontSize*1.2,size*.75)
    }
    return image
  }
  function mount(stage,graph,atlas,satellites,options) {
    const doc=stage.ownerDocument,canvas=doc.createElement('canvas'),layer=doc.createElement('div')
    canvas.className='kdg-globe-terrain';canvas.setAttribute('aria-hidden','true')
    canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1'
    layer.className='kdg-globe-annotations'
    layer.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none'
    stage.appendChild(canvas);stage.appendChild(layer)
    function button(cls,label,action) {
      const el=doc.createElement('button')
      el.type='button';el.className=cls;el.textContent=label;el.hidden=true
      el.addEventListener('click',event=>{if(event.detail===0)action()})
      layer.appendChild(el);return el
    }
    const nucleus=coreImage(doc,atlas.major)
    const regions=graph.regions.map((r,index)=>{
      const action=()=>options.onDomain?.(index)
      const title=button('kdg-globe-region',r.domain.name,action)
      title.title=r.domain.name
      title.style.setProperty('--land',r.domain.color)
      title.setAttribute('aria-label','查看知识领域，'+r.domain.name)
      return {...r,title,action}
    })
    const goalSatellites=satellites.map(({index,position})=>{
      const goal=atlas.goals[index]
      const action=()=>options.onGoal?.(index)
      const el=button('kdg-globe-satellite','',action)
      el.dataset.goal=String(index)
      const craft=doc.createElement('span'), body=doc.createElement('i'), name=doc.createElement('span')
      craft.className='kdg-satellite-craft'
      craft.setAttribute('aria-hidden','true')
      craft.appendChild(body)
      el.appendChild(craft)
      el.setAttribute('aria-label','查看培养目标，'+goal.title)
      el.setAttribute('aria-pressed','false')
      name.className='kdg-satellite-name'
      name.textContent=goal.title
      name.hidden=true
      name.setAttribute('aria-hidden','true')
      layer.appendChild(name)
      return {el,name,action,index,position,goal}
    })
    // Store graticule samples in world space so rotation and the atlas use one globe.
    const grid=[]
    const R=graph.sphereRadius
    function gridLine(lon,lat,dlon,dlat,steps) {
      const line=[]
      for(let k=0;k<=steps;k++) {
        const lambda=lon+k*dlon,phi=lat+k*dlat
        line.push({x:R*Math.cos(phi)*Math.sin(lambda),y:R*Math.sin(phi),z:R*Math.cos(phi)*Math.cos(lambda)})
      }
      grid.push(line)
    }
    for(let i=0;i<12;i++) gridLine(i*tau/12,-Math.PI/2,0,Math.PI/40,40)
    for(let j=-2;j<=2;j++) gridLine(0,j*Math.PI/6,tau/70,0,70)
    const workspaceOverlays = stage.closest('.kdg-workspace')?.querySelectorAll('.kdg-graph-search, .kdg-detail, .kdg-viewport-controls, .kdg-initialize')
    let w,h,dpr,ctx,boxes=[],regionPaths=[],globeDisk=null
    function resize(width,height,pixelRatio) {
      w=width;h=height;dpr=pixelRatio;ctx=coordinates(canvas,w,h,dpr)
    }
    function draw(view,a,focal,selected,overviewDist,avoid,domainsVisible,activeDomain,activeGoal,darkMode=false,pointsFiltered=false) {
      if (!ctx) return
      const paint=darkMode ? night : day
      ctx.clearRect(0,0,w,h);boxes=[];regionPaths=[];globeDisk=null
      const goalFocused=activeGoal!==null, domainFocused=activeDomain!==null
      const linkedDomains=goalFocused ? new Set(atlas.goals[activeGoal].domains.map(d=>d.index))
        : domainFocused ? new Set([activeDomain]) : null
      const relatedDomains=domainsVisible && selected ? new Set(root.KnowledgeDomainAtlas.relatedDomains(atlas,selected.path)) : null
      const overlayBoxes = []
      if ((goalFocused || domainFocused || relatedDomains?.size) && workspaceOverlays?.length) {
        const scene = stage.getBoundingClientRect()
        const scaleX = w / scene.width, scaleY = h / scene.height
        for (const overlay of workspaceOverlays) {
          const rect = overlay.getBoundingClientRect()
          if (rect.width && rect.height) overlayBoxes.push({
            x:(rect.left-scene.left)*scaleX,y:(rect.top-scene.top)*scaleY,w:rect.width*scaleX,h:rect.height*scaleY,
          })
        }
      }
      const radius=graph.sphereRadius
      const eye={x:view.x+a.sx*a.cp*view.dist,y:view.y+a.sp*view.dist,z:view.z+a.cx*a.cp*view.dist}
      function project(p) {
        const dx=p.x-view.x,dy=p.y-view.y,dz=p.z-view.z,along=dx*a.sx+dz*a.cx
        const depth=view.dist-along*a.cp-dy*a.sp, scale=focal/Math.max(.1,depth)
        return {x:w/2+(dx*a.cx-dz*a.sx)*scale,y:h/2-(dy*a.cp-along*a.sp)*scale,depth,
          front:p.x*(eye.x-p.x)+p.y*(eye.y-p.y)+p.z*(eye.z-p.z)}
      }
      function behindGlobe(position) {
        const dx=position.x-eye.x,dy=position.y-eye.y,dz=position.z-eye.z
        const t=-(eye.x*dx+eye.y*dy+eye.z*dz)/(dx*dx+dy*dy+dz*dz)
        return t>0 && t<1 && (eye.x+t*dx)**2+(eye.y+t*dy)**2+(eye.z+t*dz)**2<radius*radius
      }
      const center=project({x:0,y:0,z:0}), globalView=!selected && view.dist>=overviewDist*.74
      let core=null
      if (globalView && center.depth>radius) {
        const r=focal*radius/Math.sqrt(center.depth*center.depth-radius*radius)
        globeDisk = { x: center.x, y: center.y, radius: r + 4 }
        const grad=ctx.createRadialGradient(center.x-r*.32,center.y-r*.42,r*.05,center.x,center.y,r)
        for(const [position,color] of paint.ocean) grad.addColorStop(position,color)
        ctx.beginPath();ctx.arc(center.x,center.y,r,0,tau);ctx.fillStyle=grad;ctx.fill()
        ctx.strokeStyle=paint.rim;ctx.lineWidth=1;ctx.stroke()
        ctx.beginPath();ctx.arc(center.x,center.y,r+4,0,tau);ctx.strokeStyle=paint.outerRim;ctx.stroke()
      }
      if(!selected && center.depth>radius) {
        const projectedRadius=radius*focal/center.depth
        const size=Math.min(projectedRadius*.95,Math.max(100,projectedRadius*.58))
        core={x:center.x-size/2,y:center.y-size/2,size,depth:center.depth}
        ctx.globalAlpha=goalFocused ? .48 : 1
        ctx.drawImage(nucleus,core.x,core.y,size,size)
        ctx.globalAlpha=1
        // Keep other captions clear of the name. This box has no pointer action.
        boxes.push({x:center.x-size*.37,y:center.y-size*.18,w:size*.74,h:size*.36})
      }
      if(globalView) {
        ctx.beginPath()
        for(const line of grid) {
          let prev
          for(const n of line) {
            const p=project(n)
            if(prev?.front>0 && p.front>0){ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y)}
            prev=p
          }
        }
        ctx.strokeStyle=paint.graticule;ctx.lineWidth=.8;ctx.stroke()
      }
      // Clip surface tiles at the visible horizon. A single fill per region avoids seams.
      function triangle(p,q,s,path) {
        const points=[p,q,s]
        if (points.some(v=>v.depth<.2) || points.every(v=>v.front<=0)) return
        let old=s,first=true
        for (const v of points) {
          if ((v.front>0)!==(old.front>0)) {
            const t=old.front/(old.front-v.front),x=old.x+(v.x-old.x)*t,y=old.y+(v.y-old.y)*t
            if(first)path.moveTo(x,y);else path.lineTo(x,y)
            first=false
          }
          if(v.front>0){if(first)path.moveTo(v.x,v.y);else path.lineTo(v.x,v.y);first=false}
          old=v
        }
        path.closePath()
      }
      const anchors=regions.map(r=>project(r.center))
      if(domainsVisible) for(const [di,r] of regions.entries()) {
        if (r.domain.deleted) continue
        const active=relatedDomains?.has(di)
        const linked=linkedDomains?.has(di)
        r.title.toggleAttribute('data-linked',Boolean(linked || active))
        const middle=anchors[di], path=new Path2D()
        if(globalView && middle.front<0) {
          const back=r.rim.map(project)
          ctx.beginPath();back.forEach((p,j)=>{if(j)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y)})
          ctx.closePath();ctx.fillStyle=r.domain.color+paint.land.rear;ctx.fill()
        }
        let previous
        for(const ring of r.rings) {
          const next=ring.map(project)
          for(let j=0;j<next.length;j++) {
            const k=(j+1)%next.length
            if (previous) {triangle(previous[j],next[j],next[k],path);triangle(previous[j],next[k],previous[k],path)}
            else triangle(middle,next[j],next[k],path)
          }
          previous=next
        }
        const fill=linkedDomains ? (linked?paint.land.linked:paint.land.muted)
          : (globalView?paint.land.overview:active?paint.land.selected:paint.land.nearby)
        ctx.fillStyle=r.domain.color+fill;ctx.fill(path)
        regionPaths.push({index:di,path})
        ctx.beginPath()
        for(let j=0;j<previous.length;j++) {
          const p=previous[j],q=previous[(j+1)%previous.length]
          if(p.depth>1&&q.depth>1&&p.front>=0&&q.front>=0){ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y)}
        }
        ctx.strokeStyle=r.domain.color+(linked?paint.coast.linked:linkedDomains?paint.coast.muted:active?paint.coast.selected:paint.coast.normal)
        ctx.lineWidth=linked?1.8:active?1.15:.9;ctx.stroke()
      }
      if(domainsVisible) {
        ctx.save()
        for(const node of graph.sharedNodes) {
          if(!node.visible) continue
          const front=project(node).front>0
          const opacity=node===selected ? 1 : !front ? .21 : selected && node.accent===0 ? .34 : .82
          ctx.globalAlpha=opacity*(goalFocused ? .24 : node.domainMuted ? .12 : 1)
          ctx.lineWidth=node===selected ? 2.5 : 1.4
          membershipRing(ctx,node.sx,node.sy,Math.max(4.4,node.diameter*.45+2),node.domains,regions)
        }
        ctx.restore()
      }
      function show(el,x,y,width,height,act) {
        const left=x-width/2,top=y-height/2
        if (left<1||top<1||left+width>w-1||top+height>h-1) {el.hidden=true;return false}
        el.hidden=false;el.style.transform='translate('+Math.round(left)+'px,'+Math.round(top)+'px)'
        el.style.width=width+'px';el.style.height=height+'px'
        boxes.push({x:left,y:top,w:width,h:height,act})
        return true
      }
      const reserved = avoid ? [avoid] : []
      if (domainFocused) for (const {nodes:[course]} of graph.groups) {
        if (!course.visible || course.domainMuted) continue
        const r = course.diameter * .37
        reserved.push({x:course.sx-r,y:course.sy-r,w:2*r,h:2*r})
      }
      const overlaps=(x,y,width,height,obstacles=[...boxes,...reserved])=>obstacles.some(b=>x-width/2 < b.x+b.w+4 && x+width/2>b.x-4 && y-height/2<b.y+b.h+4 && y+height/2>b.y-4)
      function nearestLabel(base,width,height,obstacles) {
        const left = width/2+6, right = w-width/2-6, top = height/2+6, bottom = h-height/2-6
        if (width<=0 || right<left || bottom<top) return null
        const fitX = x => Math.max(left, Math.min(right,x))
        const fitY = y => Math.max(top, Math.min(bottom,y))
        const xs = new Set([fitX(base.x),left,right]), ys = new Set([fitY(base.y),top,bottom])
        // Try the preferred point, canvas bounds and the spaces beside each obstacle.
        for (const box of obstacles) {
          xs.add(fitX(box.x-width/2-5)).add(fitX(box.x+box.w+width/2+5))
          ys.add(fitY(box.y-height/2-5)).add(fitY(box.y+box.h+height/2+5))
        }
        let nearest = null, bestDistance = Infinity
        for (const y of ys) for (const x of xs) {
          const distance = (x-base.x)**2 + (y-base.y)**2
          if (distance >= bestDistance || overlaps(x,y,width,height,obstacles)) continue
          nearest = {x,y}
          bestDistance = distance
        }
        return nearest
      }
      function showLinkedDomain(index, base, connect) {
        const region = regions[index]
        ctx.font = '700 14px system-ui, sans-serif'
        const width = Math.min(Math.ceil(ctx.measureText(region.domain.name).width) + 20, w - 12)
        const height = 24
        const nearest = nearestLabel(base,width,height,[...boxes,...reserved])
        if (!nearest || !show(region.title,nearest.x,nearest.y,width,height,region.action) || !connect) return
        const edgeX = Math.max(nearest.x-width/2, Math.min(nearest.x+width/2,base.x))
        const edgeY = Math.max(nearest.y-height/2, Math.min(nearest.y+height/2,base.y))
        ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(edgeX,edgeY)
        ctx.strokeStyle=region.domain.color;ctx.lineWidth=1;ctx.stroke()
      }
      // The land, its labels and its connections use the same visibility toggle.
      for (const r of regions) r.title.hidden=true
      for (const {el,name,index} of goalSatellites) {
        el.hidden=true;name.hidden=true
        const pressed=String(index===activeGoal)
        if(el.getAttribute('aria-pressed')!==pressed) el.setAttribute('aria-pressed',pressed)
        name.toggleAttribute('data-active',index===activeGoal)
      }
      if (!domainsVisible) return core
      if (relatedDomains?.size) {
        reserved.push(...overlayBoxes)
        if (selected.visible) {
          const r = selected.diameter / 2 + 5
          reserved.push({x:selected.sx-r,y:selected.sy-r,w:2*r,h:2*r})
        }
        for (const index of relatedDomains) {
          const anchor = anchors[index]
          const onScreen = anchor.front > 0 && anchor.depth > 1 && anchor.x > 0 && anchor.x < w && anchor.y > 0 && anchor.y < h
          showLinkedDomain(index,anchor,onScreen)
        }
      }
      // Reserve room for the selected domain label before laying out the satellites.
      if (domainFocused) {
        const region = regions[activeDomain], anchor = anchors[activeDomain]
        ctx.font = '700 18px system-ui, sans-serif'
        const width = Math.min(Math.ceil(ctx.measureText(region.domain.name).width) + 24, w - 14)
        const height = 32
        const hardObstacles = avoid ? [...overlayBoxes,avoid] : overlayBoxes
        const obstacles = [...boxes,...reserved,...overlayBoxes]
        const left = width / 2 + 7, right = w - width / 2 - 7
        const x = Math.max(left, Math.min(right, anchor.x))
        const clearance = core ? core.size * .18 + height / 2 + 8 : 30
        const anchored = globalView && anchor.front > 0
        let position = null
        if (anchored) {
          const y = [0,-clearance,clearance,-clearance-height,clearance+height].map(offset => anchor.y + offset)
            .find(y => y >= 58 && y <= h - 28 && !overlaps(x,y,width,height,obstacles))
          if (y !== undefined) position = {x,y}
        }
        const preferred = anchored ? anchor : {x:w/2,y:height/2+10}
        position ??= nearestLabel(preferred,width,height,obstacles) ?? nearestLabel(preferred,width,height,hardObstacles)
        if (position) show(region.title,position.x,position.y,width,height,region.action)
      }
      if (!globalView) return core
      // Keep relationships visible through the globe, independently of icon placement.
      const projected=(pointsFiltered ? [] : goalSatellites).map(s=>{
        const muted=domainFocused && !s.goal.domains.some(({index})=>index===activeDomain)
        s.el.toggleAttribute('data-domain-muted',muted)
        return {s,p:project(s.position),active:s.index===activeGoal,muted}
      }).sort((a,b)=>Number(b.active)-Number(a.active)||Number(a.muted)-Number(b.muted)||a.p.depth-b.p.depth)
      const dense=goalSatellites.length>12
      const size=w<490 || dense ? {width:42,height:24} : {width:54,height:30}
      const highlighted=[]
      for(const {s,p,active,muted} of projected) {
        if(p.depth<1) continue
        const iconShown=(active || (!behindGlobe(s.position) && !overlaps(p.x,p.y,size.width,size.height)))
          && show(s.el,p.x,p.y,size.width,size.height,s.action)
        for(const {index} of s.goal.domains) {
          const base=anchors[index]
          if(base.depth<1) continue
          const color=regions[index].domain.color
          if(active) {highlighted.push({base,p,color,index});continue}
          const linkMuted=domainFocused && index!==activeDomain
          ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(p.x,p.y)
          ctx.strokeStyle=color+(linkMuted?'18':goalFocused?paint.link.muted:dense?paint.link.dense:paint.link.normal)
          ctx.lineWidth=linkMuted || goalFocused || dense ? .8 : 1.1;ctx.stroke()
        }
        if(!iconShown && s.goal.domains.length) {
          ctx.beginPath();ctx.arc(p.x,p.y,2,0,tau)
          ctx.globalAlpha=muted ? .24 : 1
          ctx.fillStyle=paint.link.markerRim;ctx.fill()
          ctx.globalAlpha=1
        }
      }
      for(const {base,p,color} of highlighted) {
        ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(p.x,p.y)
        ctx.strokeStyle=paint.link.underlay;ctx.lineWidth=4.2;ctx.stroke()
        ctx.strokeStyle=color;ctx.lineWidth=2.3;ctx.stroke()
        ctx.beginPath();ctx.arc(base.x,base.y,3.9,0,tau)
        ctx.fillStyle=color;ctx.fill()
        ctx.strokeStyle=paint.link.markerRim;ctx.lineWidth=1.5;ctx.stroke()
      }
      for(const {s,p,active,muted} of projected) {
        if(s.el.hidden || (!active && (!domainFocused || muted))) continue
        const desired=s.goal.title.length*12+16
        const width=Math.min(desired,Math.max(88,w*.30),168,w-12), height=width<desired ? 32 : 22
        const x=Math.max(width/2+6,Math.min(w-width/2-6,p.x))
        const gap=(size.height+height)/2+5, outwardY=p.y<center.y ? -1 : 1
        const top=(w<680 ? 48 : 4)+height/2, bottom=h-54-height/2
        const sideGap=(size.width+width)/2+5, outwardX=p.x<center.x ? -1 : 1
        const sideY=Math.max(top,Math.min(bottom,p.y))
        const candidates=[
          [x,p.y+outwardY*gap], [x,p.y-outwardY*gap],
          [p.x+outwardX*sideGap,sideY], [p.x-outwardX*sideGap,sideY],
        ]
        if (domainFocused) {
          const left=Math.max(width/2+6,x-sideGap*.55), right=Math.min(w-width/2-6,x+sideGap*.55)
          for (const y of [p.y+outwardY*gap,p.y-outwardY*gap]) candidates.push([left,y],[right,y])
        }
        for(const [labelX,y] of candidates) {
          if(y<top || y>bottom || overlaps(labelX,y,width,height)) continue
          if(show(s.name,labelX,y,width,height,s.action)) break
        }
      }
      // Place each linked domain name beside its connection endpoint, after reserving the satellite labels.
      reserved.push(...overlayBoxes,...highlighted.map(({base})=>({x:base.x-4,y:base.y-4,w:8,h:8})))
      for (const {base, index} of highlighted) showLinkedDomain(index,base,true)
      return core
    }
    function regionAt(x,y) {
      // Hit test the painted front-side paths in backing-store coordinates.
      for (let i=regionPaths.length-1;i>=0;i--) {
        const {index,path}=regionPaths[i]
        if (ctx.isPointInPath(path,x*dpr,y*dpr)) return index
      }
      return -1
    }
    function containsGlobe(x,y) {
      return globeDisk && Math.hypot(x-globeDisk.x,y-globeDisk.y) <= globeDisk.radius
    }
    return {resize,draw,layer,nucleus,regionAt,containsGlobe,boxes:()=>boxes}
  }
  root.KnowledgeDomainAtlasPaint={mount,miniature}
})(globalThis)
