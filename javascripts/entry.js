
let svg,points,lines;
let active;
 
function sub(a,b){
    return {x: a.x - b.x, y: a.y - b.y}
}

function add(a,b){
    return {x: a.x + b.x, y: a.y + b.y}
}

function div(a,b){
    return {x: a.x / b, y: a.y / b}
}

function mult(a,b){
    return {x: a.x * b, y: a.y * b}
}

function mid(a,b){
return {x: (a.x + b.x)/2, y: (a.y + b.y)/2}
}

function mag(a){
    return Math.sqrt(a.x*a.x + a.y*a.y);
}

function norm(a){
    return div(a, mag(a));
}
  ///////////////////////////////////////////////////////////////////////////////
  
  function resize(){
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  }

  document.addEventListener('DOMContentLoaded',()=>{
    svg = document.getElementById('svg');
    points = document.getElementById('points');
    lines = document.getElementById('lines');

    resize();
    window.addEventListener('resize',resize);

    svg.addEventListener('mousedown',e => {
        const [x,y] = [e.clientX, e.clientY]; 
        
        const p = createPoint(x,y);
        points.appendChild(p);
        if (active) createLine(active, p);

        
        active = p;
        
        //makeCurve();
    })

  })

  function createLine(p0, p1){
    const [x1, y1] = getCoords(p0, "array");
    const [x2, y2] = getCoords(p1, "array");

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    set(path, { 
        d: `M ${x1} ${y1} L ${x2} ${y2}`,
        stroke: "black",
        fill: "transparent" 
    });
    
    p0._pointAfter = p1;
    p1._pointBefore = p0;
    p0._lineAfter = path;
    p1._lineBefore = path;

    lines.appendChild(path)
  }

  function createPoint(x,y){
    const p = document.createElementNS('http://www.w3.org/2000/svg','circle');
    p.setAttribute('cx', x);
    p.setAttribute('cy', y);
    p.setAttribute('r', 10);
    p.setAttribute('fill', 'orange')
    p.addEventListener('mousedown', click);
    p.addEventListener('dblclick', dblclick);
    return p;
  }
  
  function getCoords(p, type="object"){
    if (type === "array") return [p.cx.baseVal.value, p.cy.baseVal.value];
    return {x: p.cx.baseVal.value, y: p.cy.baseVal.value}
  }
  
  
  ////////////////////////////////////////////////////////////////////////////////
  
  function click(e){
    e.stopPropagation();
    e.preventDefault();
    const move = drag.bind(e.target);
    
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup',e => {
      document.removeEventListener('mousemove', move)
    },{once: true})
  }

  function drag(e){
    e.preventDefault();
    e.stopPropagation();
    const prev = getCoords(this);
    const delta = sub({x: e.clientX, y: e.clientY}, prev);

    set(this, {cx: e.clientX, cy: e.clientY});
    if (this._controlBefore){
        const coords = getCoords(this._controlBefore);
        set(this._controlBefore,{
            cx: coords.x + delta.x,
            cy: coords.y + delta.y
        })
    }
    if (this._controlAfter){
        const coords = getCoords(this._controlAfter);
        set(this._controlAfter,{
            cx: coords.x + delta.x,
            cy: coords.y + delta.y
        })
    }

    if (this._controlLineAfter){
        const p1 = getCoords(this);
        const p2 = getCoords(this._controlAfter)
        set(this._controlLineAfter,{
            x1: p1.x,
            y1: p1.y,
            x2: p2.x + delta.x,
            y2: p2.y + delta.y
        })
    }
    if (this._controlLineBefore){
        const p1 = getCoords(this);
        const p2 = getCoords(this._controlBefore)
        set(this._controlLineBefore,{
            x1: p1.x,
            y1: p1.y,
            x2: p2.x + delta.x,
            y2: p2.y + delta.y
        })
    }

    setCurves(this);
  }
  
  ///////////////////////////////////////////////////////////////////////////////

  function dblclick(e){

    if (!e.target._pointBefore){
        // e.target._pointBefore = active;
        // active._pointAfter = e.target;
        createLine(active, e.target)
        return;
    }

    if (!e.target._controlAfter && e.target._pointAfter){
        const p0 = getCoords(e.target);
        const p1 = getCoords(e.target._pointAfter);

        const m = createControl(mid(p0,p1), {_vertexBefore: e.target})
        e.target._controlAfter = m;
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        set(l,{
            x1: p0.x,
            y1: p0.y,
            x2: getCoords(m).x,
            y2: getCoords(m).y,
            stroke: 'gray'
        })
        lines.appendChild(l);
        e.target._controlLineAfter = l;
        l._vertex = e.target;
        m._controlLine = l;


        setCurveCtrl(m);
        points.appendChild(m);
    }

    if (!e.target._controlBefore && e.target._pointBefore){
        const p0 = getCoords(e.target);
        const p1 = getCoords(e.target._pointBefore);
        
        const m = createControl(mid(p0, p1), {_vertexAfter: e.target});
        e.target._controlBefore = m;
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        set(l,{
            x1: p0.x,
            y1: p0.y,
            x2: getCoords(m).x,
            y2: getCoords(m).y,
            stroke: 'gray'
        })
        lines.appendChild(l);
        e.target._controlLineBefore = l;
        m._controlLine = l;
        l._vertex = e.target;

        setCurveCtrl(m);
        points.appendChild(m)
    }
  }
  ///////////////////////////////////////////////////////////////////////////////

  function makeCurve(){
    
    const curve = document.getElementById('curve');
    if (curve) curve.parentNode.removeElement(curve);
    
    const points = Array.from(svg.children).map(p => ({x: p.cx.baseVal.value, y: p.cy.baseVal.value}))
    if (points.length < 3) return;
    

    
  }

  /////////////////////////////////////////////////////////////////
  function set(el, attributes){
      Object.keys(attributes).forEach(k => {
          el.setAttribute(k, attributes[k])
      })
  }


  /////////////////////////////////////////////////////////////////

  function setCurves(p){

    let line;
    if (line = p._lineAfter){
        const p1 = getCoords(p);
        const p2 = getCoords(p._pointAfter);
        const c1 = p._controlAfter ? getCoords(p._controlAfter) : null;
        const c2 = p._pointAfter._controlBefore ? getCoords(p._pointAfter._controlBefore) : null;

        if (!c1 && !c2){
            set(line,{
                d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}` //todo
            })
        } else if (c1 && !c2){
            set(line,{
                d: `M ${p1.x} ${p1.y} Q ${c1.x} ${c1.y} ${p2.x} ${p2.y}` //todo
            })
        } else if (c2 && !c1){
            set(line,{
                d: `M ${p1.x} ${p1.y} Q ${c2.x} ${c2.y} ${p2.x} ${p2.y}` //todo
            })
        } else {
            set(line,{
                d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}` //todo
            })
        }
    }
    if (line = p._lineBefore){
        const p1 = getCoords(p._pointBefore);
        const p2 = getCoords(p);
        const c1 = p._pointBefore._controlAfter ? getCoords(p._pointBefore._controlAfter) : null;
        const c2 = p._controlBefore ? getCoords(p._controlBefore) : null;
        if (!c1 && !c2){
            set(line,{
                d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}` //todo
            })
        } else if (c1 && !c2){
            set(line,{
                d: `M ${p1.x} ${p1.y} Q ${c1.x} ${c1.y} ${p2.x} ${p2.y}` //todo
            })
        } else if (c2 && !c1){
            set(line,{
                d: `M ${p1.x} ${p1.y} Q ${c2.x} ${c2.y} ${p2.x} ${p2.y}` //todo
            })
        } else {
            set(line,{
                d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}` //todo
            })
        }
    }
  }

  ////////////////////////////////////////////////////////////////////////

  function createControl(point, parent){

    const p = document.createElementNS('http://www.w3.org/2000/svg','circle');
    set(p,{
        cx: point.x,
        cy: point.y,
        r: 10,
        fill: 'pink'
    })

    Object.assign(p,parent);
    p.addEventListener('mousedown', ctrlClick);
    p.addEventListener('dblclick', ctrlDblClick);
    return p;
  }


  function ctrlClick(e){
    e.preventDefault();
    e.stopPropagation();
    const move = ctrlDrag.bind(e.target);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup',()=>{
        document.removeEventListener('mousemove', move)    
    },{once: true})
  }

  function ctrlDrag(e){
    e.preventDefault();
    e.stopPropagation();
    set(this,{
       cx: e.clientX,
       cy: e.clientY 
    })
    setCurveCtrl(this);
    set(this._controlLine,{
        x2: e.clientX,
        y2: e.clientY
    })

    if (this._lockTangent){

        const vertex = this._vertexBefore || this._vertexAfter;
        let vec = norm(sub(getCoords(vertex), getCoords(this)));
        
        vec = mult(vec, mag(  sub (getCoords(vertex), getCoords(this._lockTangent)) ));
        vec = add(getCoords(vertex), vec);

        set(this._lockTangent,{
            cx: vec.x,
            cy: vec.y
         })
         setCurveCtrl(this._lockTangent);
         set(this._lockTangent._controlLine,{
             x2: vec.x,
             y2: vec.y
         });
    }
  }

  function setCurveCtrl(p){
    if (p._vertexBefore){
        const p1 = getCoords(p._vertexBefore);
        const c1 = getCoords(p);
        const p2 = getCoords(p._vertexBefore._pointAfter);
        const c2 = p._vertexBefore._pointAfter._controlBefore ? getCoords(p._vertexBefore._pointAfter._controlBefore) : null;

        set(p._vertexBefore._lineAfter,{
            d: c2 ? 
                `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}` :
                `M ${p1.x} ${p1.y} Q ${c1.x} ${c1.y} ${p2.x} ${p2.y}`
        })
    }

    if (p._vertexAfter){
        const p1 = getCoords(p._vertexAfter._pointBefore);
        const c1 = p._vertexAfter._pointBefore._controlAfter ? getCoords(p._vertexAfter._pointBefore._controlAfter) : null;

        const c2 = getCoords(p);
        const p2 = getCoords(p._vertexAfter);

        set(p._vertexAfter._lineBefore,{
            d: c1 ? 
                `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}` :
                `M ${p1.x} ${p1.y} Q ${c2.x} ${c2.y} ${p2.x} ${p2.y}`
        })
    }

  }

  function ctrlDblClick(e){
    const point = e.target;
    let other, vertex;
    if (vertex = e.target._vertexBefore){
        other = e.target._vertexBefore._controlBefore;
    } else if (vertex = e.target._vertexAfter){
        other = e.target._vertexAfter._controlAfter;
    }

    if (other){
        point._lockTangent = other;
        other._lockTangent = point;

        let vec = norm(sub(getCoords(vertex), getCoords(point)));

        vec = mult(vec, mag(  sub (getCoords(vertex), getCoords(other)) ));
        vec = add(getCoords(vertex), vec);

        set(other,{
            cx: vec.x,
            cy: vec.y
         })
         setCurveCtrl(other);
         set(other._controlLine,{
             x2: vec.x,
             y2: vec.y
         });

    }
  }