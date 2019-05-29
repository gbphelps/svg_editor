
let svg,points,lines;
let active;
let first;
let shape;
let selected;

const gray = "#999"
 
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
    shape = document.getElementById('shape')

    resize();
    window.addEventListener('resize',resize);

    svg.addEventListener('mousedown',e => {
        const [x,y] = [e.clientX, e.clientY]; 
        
        const p = createPoint(x,y);
        points.appendChild(p);

        if (active){
            active._pointAfter = p;
            p._pointBefore = active;
            p._path = active._path;
            setFullPath(p);     
        } else {
            const path = document.createElementNS('http://www.w3.org/2000/svg', "path");
            set(path,{stroke:"black", fill:"red", ['stroke-width']: 1});
            shape.appendChild(path);
            p._path = path;
            path._first = p;
        }

        active = p;
        
    })

  })


  function createPoint(x,y){
    const p = document.createElementNS('http://www.w3.org/2000/svg','circle');
    p.setAttribute('cx', x);
    p.setAttribute('cy', y);
    p.setAttribute('r', 5);
    p.setAttribute('fill', 'black')
    p.addEventListener('mousedown', click);
    p.addEventListener('dblclick', dblclick);
    return p;
  }
  
  function getCoords(p, type="object"){
    if (type === "array") return [p.cx.baseVal.value, p.cy.baseVal.value];
    return {x: p.cx.baseVal.value, y: p.cy.baseVal.value}
  }
  
  


  function select(p){
    if (selected) selected.setAttribute("r", 5)
    selected = p;
    p.setAttribute("r", 10);
  }





  document.addEventListener('keydown', e=>{
      if (e.keyCode === 8){
          if (!selected) return;

          if (selected._controlBefore){
                selected._controlBefore.parentNode.removeChild(selected._controlBefore);
                selected._controlBefore._controlLine.parentNode.removeChild(selected._controlBefore._controlLine);
          }
          
          if (selected._controlAfter){
            selected._controlAfter._controlLine.parentNode.removeChild(selected._controlAfter._controlLine);
            selected._controlAfter.parentNode.removeChild(selected._controlAfter);
          }

          if (selected._pointAfter) selected._pointAfter._pointBefore = selected._pointBefore;
          if (selected._pointBefore) selected._pointBefore._pointAfter = selected._pointAfter;
          if (selected === selected._path._first){ 
              console.log(selected._path.first, "need to switch");
              selected._path._first = selected._pointAfter;
            }


          setFullPath(selected._pointAfter);

          selected.parentNode.removeChild(selected)

      }
  })



  ////////////////////////////////////////////////////////////////////////////////
  
  function click(e){
    e.stopPropagation();
    e.preventDefault();

    select(e.target);

    if (!e.target._pointBefore ){
        if ( active._pointBefore && active._pointBefore !== e.target){
            e.target._pointBefore = active;
            active._pointAfter = e.target;
            active._first = e.target;
            setFullPath(active);
            active = null;
        }      
    }

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

    //////////////////////////
    setFullPath(this);////////
    //////////////////////////

  }
  
  ///////////////////////////////////////////////////////////////////////////////

  
  
  function dblclick(e){

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
            stroke: gray
        })
        lines.appendChild(l);
        e.target._controlLineAfter = l;
        l._vertex = e.target;
        m._controlLine = l;

        points.appendChild(m);
        setFullPath(e.target);
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
            stroke: gray
        })
        lines.appendChild(l);
        e.target._controlLineBefore = l;
        m._controlLine = l;
        l._vertex = e.target;

        points.appendChild(m);
        setFullPath(e.target);
    }
  }
  ///////////////////////////////////////////////////////////////////////////////

  function makeCurve(){
    
    const curve = document.getElementById('curve');
    if (curve) curve.parentNode.removeElement(curve);
    
    const points = Array.from(svg.children).map(p => ({x: p.cx.baseVal.value, y: p.cy.baseVal.value}))
    if (points.length < 3) return;
    

    
  }

  function set(el, attributes){
      Object.keys(attributes).forEach(k => {
          el.setAttribute(k, attributes[k])
      })
  }

  function createControl(point, parent){

    const p = document.createElementNS('http://www.w3.org/2000/svg','circle');
    set(p,{
        cx: point.x,
        cy: point.y,
        r: 5,
        fill: gray
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
    set(this._controlLine,{
        x2: e.clientX,
        y2: e.clientY
    })

    const vertex = this._vertexBefore || this._vertexAfter;
    if (this._lockTangent){
  
        let vec = norm(sub(getCoords(vertex), getCoords(this)));
        
        vec = mult(vec, mag(  sub (getCoords(vertex), getCoords(this._lockTangent)) ));
        vec = add(getCoords(vertex), vec);

        set(this._lockTangent,{
            cx: vec.x,
            cy: vec.y
         })
         set(this._lockTangent._controlLine,{
             x2: vec.x,
             y2: vec.y
         });
    }

    setFullPath(vertex)
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
         set(other._controlLine,{
             x2: vec.x,
             y2: vec.y
         });
    }

    setFullPath(vertex);
  }

  //////////////////////////////
  function setFullPath(p){

    let node = p._path._first;

    let d = `M ${getCoords(node).x} ${getCoords(node).y}`;

    
    do {

        console.log(getCoords(node));

        const c1 = node._controlAfter ? getCoords(node._controlAfter) : null;
        const p2 = getCoords(node._pointAfter);
        const c2 = node._pointAfter._controlBefore ? getCoords(node._pointAfter._controlBefore) : null;

        
        if (!c1 && !c2){
            d += `L ${p2.x} ${p2.y}`;
        } else if (c1 && !c2){
            d += `Q ${c1.x} ${c1.y} ${p2.x} ${p2.y}`;
        } else if (c2 && !c1){
            d += `Q ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
        } else {
            d +=`C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
        }

    node = node._pointAfter;
    } while (node !== p._path._first && node._pointAfter);

    set(p._path, {d})


  }