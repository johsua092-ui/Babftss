import { Fragment } from 'react';
import { hexToRgbStr } from '../utils/colorHelper';

const inputNodeW = 46, inputNodeH = 42, inputNodeRx = 7;
const nodeR = 8, outNodeR = 13;

export default function CircuitDiagram13(props) {
    var s0=props.s0, s1=props.s1, s2=props.s2, s3=props.s3;
    var d0=props.d0, d1=props.d1, d2=props.d2, d3=props.d3;
    var d4=props.d4, d5=props.d5, d6=props.d6, d7=props.d7;
    var d8=props.d8, d9=props.d9, d10=props.d10, d11=props.d11;
    var d12=props.d12, d13=props.d13, d14=props.d14, d15=props.d15;
    var s0Not=props.s0Not, s1Not=props.s1Not, s2Not=props.s2Not, s3Not=props.s3Not;
    var y=props.y;
    var enVals = [props.en0,props.en1,props.en2,props.en3,props.en4,props.en5,props.en6,props.en7,props.en8,props.en9,props.en10,props.en11,props.en12,props.en13,props.en14,props.en15];
    var gVals = [props.g0,props.g1,props.g2,props.g3,props.g4,props.g5,props.g6,props.g7,props.g8,props.g9,props.g10,props.g11,props.g12,props.g13,props.g14,props.g15];
    var dVals = [d0,d1,d2,d3,d4,d5,d6,d7,d8,d9,d10,d11,d12,d13,d14,d15];
    var dToggles = [props.onToggleD0,props.onToggleD1,props.onToggleD2,props.onToggleD3,props.onToggleD4,props.onToggleD5,props.onToggleD6,props.onToggleD7,props.onToggleD8,props.onToggleD9,props.onToggleD10,props.onToggleD11,props.onToggleD12,props.onToggleD13,props.onToggleD14,props.onToggleD15];

    var notColor="#f87171", notRgb=hexToRgbStr(notColor);
    var selColor="#4ade80", selRgb=hexToRgbStr(selColor);
    var orColor="#a78bfa", orRgb=hexToRgbStr(orColor);
    var wc = function(val,col,rgb){return val?col:'rgba('+rgb+',0.25)';};

    // Two groups of 8 D colors — cool tones (D0-D7) and warm tones (D8-D15)
    var dCols = [
        "#22d3ee","#38bdf8","#60a5fa","#818cf8",
        "#67e8f9","#7dd3fc","#93c5fd","#a5b4fc",
        "#fb923c","#f472b6","#facc15","#34d399",
        "#f97316","#e879f9","#a3e635","#2dd4bf"
    ];
    var dRgbs = [
        "34,211,238","56,189,248","96,165,250","129,140,248",
        "103,232,249","125,211,252","147,197,253","165,180,252",
        "251,146,60","244,114,182","250,204,21","52,211,153",
        "249,115,22","232,121,249","163,230,53","45,212,191"
    ];

    // Y positions
    var s0Y=30, s1Y=80, s2Y=130, s3Y=180;
    var dStartY=250, dSpacing=80;
    var dYs=[]; for(var i=0;i<16;i++) dYs.push(dStartY+i*dSpacing);
    var svgH=dStartY+15*dSpacing+85;

    // NOT gates
    var notSX=100, jX=78;
    // S bus lanes (8 lanes, prime and direct for each of 4 select bits)
    // Prime=red color, direct=green color
    var busX = { s3p:185, s3d:205, s2p:225, s2d:245, s1p:265, s1d:285, s0p:305, s0d:325 };

    // AND-4 decode gates (4 input each, top/mid1/mid2/bot)
    var and4SX=360, and4EX=416, and4HH=26;
    var decG=dYs.map(function(dy){
        return {my:dy, ty:dy-and4HH, by:dy+and4HH, tIn:dy-20, m1In:dy-7, m2In:dy+7, bIn:dy+20};
    });

    // AND-2 data gates
    var and2SX=450, and2EX=492, and2HH=14;
    var datG=dYs.map(function(dy){
        return {my:dy+38, ty:dy+24, by:dy+52, tIn:dy+30, bIn:dy+46};
    });

    // gMap: which bus signal goes to which input of decode AND-4
    // index = D index, bits = [S3, S2, S1, S0] (MSB first)
    var gMap=[];
    for(var i=0;i<16;i++){
        var b3=(i>>3)&1, b2=(i>>2)&1, b1=(i>>1)&1, b0=i&1;
        gMap.push({
            top: b3 ? 's3d' : 's3p',
            mid1: b2 ? 's2d' : 's2p',
            mid2: b1 ? 's1d' : 's1p',
            bot: b0 ? 's0d' : 's0p',
        });
    }
    var busValMap = { s3p:s3Not, s3d:s3, s2p:s2Not, s2d:s2, s1p:s1Not, s1d:s1, s0p:s0Not, s0d:s0 };
    var busColMap = { s3p:notColor, s3d:selColor, s2p:notColor, s2d:selColor, s1p:notColor, s1d:selColor, s0p:notColor, s0d:selColor };
    var busRgbMap = { s3p:notRgb, s3d:selRgb, s2p:notRgb, s2d:selRgb, s1p:notRgb, s1d:selRgb, s0p:notRgb, s0d:selRgb };

    // Precompute bus branches
    var busBranches=[];
    for(var i=0;i<16;i++){
        var m=gMap[i]; var g=decG[i];
        ['top','mid1','mid2','bot'].forEach(function(level){
            var busKey=m[level];
            busBranches.push({
                key:i+'-'+level, bx:busX[busKey], inputY:g[level+'In'],
                bVal:busValMap[busKey], bCol:busColMap[busKey], bRgb:busRgbMap[busKey],
                dCol:dCols[i], dRgb:dRgbs[i],
            });
        });
    }

    // === OR TREE (4 levels: L1 pairs, L2 quads, L3 octs, L4 final) ===
    var orHH=16;
    // Layer 1: 8 OR gates, each pairs 2 data AND outputs
    var or1SX=570, or1EX=620;
    var or1MY=[];
    for(var i=0;i<8;i++) or1MY.push((datG[i*2].my+datG[i*2+1].my)/2);
    // Layer 2: 4 OR gates, each pairs 2 L1 outputs
    var or2SX=670, or2EX=720;
    var or2MY=[];
    for(var i=0;i<4;i++) or2MY.push((or1MY[i*2]+or1MY[i*2+1])/2);
    // Layer 3: 2 OR gates, each pairs 2 L2 outputs
    var or3SX=770, or3EX=820;
    var or3MY=[(or2MY[0]+or2MY[1])/2, (or2MY[2]+or2MY[3])/2];
    // Layer 4: 1 final OR gate
    var or4SX=870, or4EX=920;
    var orFMY=(or3MY[0]+or3MY[1])/2;

    // OR values
    var or1Vals=[]; for(var i=0;i<8;i++) or1Vals.push(gVals[i*2]||gVals[i*2+1]);
    var or2Vals=[]; for(var i=0;i<4;i++) or2Vals.push(or1Vals[i*2]||or1Vals[i*2+1]);
    var or3Vals=[or2Vals[0]||or2Vals[1], or2Vals[2]||or2Vals[3]];
    var orFVal=or3Vals[0]||or3Vals[1];

    var outX=or4EX+38+outNodeR, outY=orFMY;
    var svgW=outX+outNodeR+15;

    var mkGlow=function(val,rgb){return val?'drop-shadow(0 0 4px rgba('+rgb+',0.9)) drop-shadow(0 0 10px rgba('+rgb+',0.5))':'none';};
    var mkFill=function(val,rgb){return val?'rgba('+rgb+',0.13)':'#0f172a';};
    var mkStroke=function(val,col){return val?col:'#475569';};

    var notSt=[
        {glow:mkGlow(s0Not,notRgb),fill:mkFill(s0Not,notRgb),stroke:mkStroke(s0Not,notColor)},
        {glow:mkGlow(s1Not,notRgb),fill:mkFill(s1Not,notRgb),stroke:mkStroke(s1Not,notColor)},
        {glow:mkGlow(s2Not,notRgb),fill:mkFill(s2Not,notRgb),stroke:mkStroke(s2Not,notColor)},
        {glow:mkGlow(s3Not,notRgb),fill:mkFill(s3Not,notRgb),stroke:mkStroke(s3Not,notColor)},
    ];

    var s0pLC=s0Not?notColor:'#475569';
    var s1pLC=s1Not?notColor:'#475569';
    var s2pLC=s2Not?notColor:'#475569';
    var s3pLC=s3Not?notColor:'#475569';

    // === WIRE LANE ASSIGNMENT FOR OVERLAP PREVENTION ===
    // D wires horizontal 1: x=47..150 at y=dYs[i]
    // D wires vertical: x=150 from dYs[i] to dYs[i]+46
    // D wires horizontal 2: x=150..and2SX(450) at y=dYs[i]+46
    // S input wires: x=47..jX(78) at sY levels
    // S direct wires: jX..notSX(100) at sY levels
    // NOT output: x=140..busX[sNp] for prime, busX[sNd] for direct
    // Bus verticals: each busX has unique X — NO overlap between buses
    // Bus branch horizontals: busX..and4SX(360) at each gate input Y
    // Decode AND output: and4EX(410)..435 horizontal, then 435 vertical to datG tIn
    // Data AND output: and2EX(492)..530 horizontal, then 530 vertical to OR L1 inputs
    // OR L1 output: or1EX(620)..650 horizontal, then 650 vertical to OR L2 inputs
    // OR L2 output: or2EX(720)..750 horizontal, then 750 vertical to OR L3 inputs
    // OR L3 output: or3EX(820)..850 horizontal, then 850 vertical to OR L4 inputs
    // OR L4 output -> output node
    // Each vertical collector lane (435,530,650,750,850) is UNIQUE X
    // No horizontal segment shares both same Y range and same X range with another

    var decodeOutLane=435;
    var dataToOrLane=530;
    var orL1Lane=650, orL2Lane=750, orL3Lane=850;

    return <svg viewBox={'0 0 '+svgW+' '+svgH} width="100%" style={{overflow:'visible',display:'block'}}>
        {/* INPUT NODES — Select */}
        <InputNode ix={1} iy={s0Y} val={s0} label="S0" onToggle={props.onToggleS0} color={selColor} rgb={selRgb} />
        <InputNode ix={1} iy={s1Y} val={s1} label="S1" onToggle={props.onToggleS1} color={selColor} rgb={selRgb} />
        <InputNode ix={1} iy={s2Y} val={s2} label="S2" onToggle={props.onToggleS2} color={selColor} rgb={selRgb} />
        <InputNode ix={1} iy={s3Y} val={s3} label="S3" onToggle={props.onToggleS3} color={selColor} rgb={selRgb} />
        {/* INPUT NODES — Data */}
        {dYs.map(function(dy,i){
            return <InputNode key={i} ix={1} iy={dy} val={dVals[i]} label={'D'+i} onToggle={dToggles[i]} color={dCols[i]} rgb={dRgbs[i]} />;
        })}

        {/* S INPUT -> JUNCTION -> NOT */}
        {[s0Y,s1Y,s2Y,s3Y].map(function(sy,si){
            var sv=[s0,s1,s2,s3][si];
            return <Fragment key={'sin'+si}>
                <W d={'M 47,'+sy+' H '+jX} val={sv} col={selColor} rgb={selRgb} />
                <W d={'M '+jX+','+sy+' H '+notSX} val={sv} col={selColor} rgb={selRgb} />
                <circle cx={jX} cy={sy} r={3} fill={sv?selColor:'rgba('+selRgb+',0.25)'} style={{transition:'fill 0.3s'}} />
            </Fragment>;
        })}

        {/* NOT GATES */}
        <NotGate sx={notSX} ty={s0Y-16} by={s0Y+16} my={s0Y} glow={notSt[0].glow} fill={notSt[0].fill} stroke={notSt[0].stroke} />
        <NotGate sx={notSX} ty={s1Y-16} by={s1Y+16} my={s1Y} glow={notSt[1].glow} fill={notSt[1].fill} stroke={notSt[1].stroke} />
        <NotGate sx={notSX} ty={s2Y-16} by={s2Y+16} my={s2Y} glow={notSt[2].glow} fill={notSt[2].fill} stroke={notSt[2].stroke} />
        <NotGate sx={notSX} ty={s3Y-16} by={s3Y+16} my={s3Y} glow={notSt[3].glow} fill={notSt[3].fill} stroke={notSt[3].stroke} />

        {/* OVERLINE LABELS */}
        <OverlineLabel x={146} y={s0Y-8} text="S0" color={s0pLC} />
        <OverlineLabel x={146} y={s1Y-8} text="S1" color={s1pLC} />
        <OverlineLabel x={146} y={s2Y-8} text="S2" color={s2pLC} />
        <OverlineLabel x={146} y={s3Y-8} text="S3" color={s3pLC} />

        {/* SELECT BUS TRUNKS (8 vertical buses) */}
        {/* Prime buses: from NOT output (x=140) right to busX, then down to bottom gate */}
        <W d={'M 140,'+s3Y+' H '+busX.s3p+' V '+decG[15].tIn} val={s3Not} col={notColor} rgb={notRgb} />
        <W d={'M '+jX+','+s3Y+' V 225 H '+busX.s3d+' V '+decG[15].tIn} val={s3} col={selColor} rgb={selRgb} />
        <W d={'M 140,'+s2Y+' H '+busX.s2p+' V '+decG[15].m1In} val={s2Not} col={notColor} rgb={notRgb} />
        <W d={'M '+jX+','+s2Y+' V 175 H '+busX.s2d+' V '+decG[15].m1In} val={s2} col={selColor} rgb={selRgb} />
        <W d={'M 140,'+s1Y+' H '+busX.s1p+' V '+decG[15].m2In} val={s1Not} col={notColor} rgb={notRgb} />
        <W d={'M '+jX+','+s1Y+' V 120 H '+busX.s1d+' V '+decG[15].m2In} val={s1} col={selColor} rgb={selRgb} />
        <W d={'M 140,'+s0Y+' H '+busX.s0p+' V '+decG[15].bIn} val={s0Not} col={notColor} rgb={notRgb} />
        <W d={'M '+jX+','+s0Y+' V 65 H '+busX.s0d+' V '+decG[15].bIn} val={s0} col={selColor} rgb={selRgb} />

        {/* SELECT BUS BRANCHES (junction dot + horizontal to AND-4) */}
        {busBranches.map(function(b){
            return <Fragment key={b.key}>
                <circle cx={b.bx} cy={b.inputY} r={2.5} fill={b.bVal?b.bCol:'rgba('+b.bRgb+',0.25)'} style={{transition:'fill 0.3s'}} />
                <W d={'M '+b.bx+','+b.inputY+' H '+and4SX} val={b.bVal} col={b.dCol} rgb={b.dRgb} />
            </Fragment>;
        })}

        {/* D WIRES -> DATA AND-2 BOT INPUTS */}
        {dYs.map(function(dy,i){
            return <W key={'dw'+i} d={'M 47,'+dy+' H 150 V '+(dy+46)+' H '+and2SX} val={dVals[i]} col={dCols[i]} rgb={dRgbs[i]} />;
        })}

        {/* DECODE AND-4 GATES */}
        {decG.map(function(g,i){
            return <AndGate4 key={'dec'+i} sx={and4SX} ty={g.ty} by={g.by} w={30} ar={26} glow={mkGlow(enVals[i],dRgbs[i])} fill={mkFill(enVals[i],dRgbs[i])} stroke={mkStroke(enVals[i],dCols[i])} />;
        })}

        {/* DECODE AND-4 OUTPUT -> DATA AND-2 TOP INPUT (via decodeOutLane=435) */}
        {decG.map(function(g,i){
            return <W key={'d2d'+i} d={'M '+and4EX+','+g.my+' H '+decodeOutLane+' V '+datG[i].tIn+' H '+and2SX} val={enVals[i]} col={dCols[i]} rgb={dRgbs[i]} />;
        })}

        {/* DATA AND-2 GATES */}
        {datG.map(function(g,i){
            return <AndGate2 key={'dat'+i} sx={and2SX} ty={g.ty} by={g.by} w={24} ar={18} glow={mkGlow(gVals[i],dRgbs[i])} fill={mkFill(gVals[i],dRgbs[i])} stroke={mkStroke(gVals[i],dCols[i])} />;
        })}

        {/* DATA AND OUTPUTS -> OR TREE LAYER 1 (via dataToOrLane=530) */}
        {datG.map(function(g,i){
            var orIdx=Math.floor(i/2);
            var orSlot=i%2===0?-1:1;
            return <W key={'d2or'+i} d={'M '+and2EX+','+g.my+' H '+dataToOrLane+' V '+(or1MY[orIdx]+orSlot*orHH)+' H '+or1SX} val={gVals[i]} col={dCols[i]} rgb={dRgbs[i]} />;
        })}

        {/* OR GATES LAYER 1 (8 gates) */}
        {or1MY.map(function(my,i){
            return <OrGate key={'or1'+i} sx={or1SX} ty={my-orHH} by={my+orHH} my={my} ex={or1EX} glow={mkGlow(or1Vals[i],orRgb)} fill={mkFill(or1Vals[i],orRgb)} stroke={mkStroke(or1Vals[i],orColor)} />;
        })}

        {/* OR L1 -> L2 (via orL1Lane=650) */}
        {or1MY.map(function(my,i){
            var orIdx=Math.floor(i/2);
            var orSlot=i%2===0?-1:1;
            return <W key={'o1o2'+i} d={'M '+or1EX+','+my+' H '+orL1Lane+' V '+(or2MY[orIdx]+orSlot*orHH)+' H '+or2SX} val={or1Vals[i]} col={orColor} rgb={orRgb} />;
        })}

        {/* OR GATES LAYER 2 (4 gates) */}
        {or2MY.map(function(my,i){
            return <OrGate key={'or2'+i} sx={or2SX} ty={my-orHH} by={my+orHH} my={my} ex={or2EX} glow={mkGlow(or2Vals[i],orRgb)} fill={mkFill(or2Vals[i],orRgb)} stroke={mkStroke(or2Vals[i],orColor)} />;
        })}

        {/* OR L2 -> L3 (via orL2Lane=750) */}
        {or2MY.map(function(my,i){
            var orSlot=i%2===0?-1:1;
            return <W key={'o2o3'+i} d={'M '+or2EX+','+my+' H '+orL2Lane+' V '+(or3MY[Math.floor(i/2)]+orSlot*orHH)+' H '+or3SX} val={or2Vals[i]} col={orColor} rgb={orRgb} />;
        })}

        {/* OR GATES LAYER 3 (2 gates) */}
        {or3MY.map(function(my,i){
            return <OrGate key={'or3'+i} sx={or3SX} ty={my-orHH} by={my+orHH} my={my} ex={or3EX} glow={mkGlow(or3Vals[i],orRgb)} fill={mkFill(or3Vals[i],orRgb)} stroke={mkStroke(or3Vals[i],orColor)} />;
        })}

        {/* OR L3 -> L4 (via orL3Lane=850) */}
        {or3MY.map(function(my,i){
            var orSlot=i===0?-1:1;
            return <W key={'o3o4'+i} d={'M '+or3EX+','+my+' H '+orL3Lane+' V '+(orFMY+orSlot*orHH)+' H '+or4SX} val={or3Vals[i]} col={orColor} rgb={orRgb} />;
        })}

        {/* OR GATE FINAL (Layer 4) */}
        <OrGate sx={or4SX} ty={orFMY-orHH} by={orFMY+orHH} my={orFMY} ex={or4EX} glow={mkGlow(y,orRgb)} fill={mkFill(y,orRgb)} stroke={mkStroke(y,orColor)} />

        {/* OUTPUT */}
        <line x1={or4EX} y1={orFMY} x2={outX-outNodeR} y2={outY} stroke={wc(y,orColor,orRgb)} strokeWidth="2.5" strokeLinecap="round" style={{transition:'stroke 0.3s'}} />
        <OutputNode ox={outX} oy={outY} val={y} label="Y" color={orColor} rgb={orRgb} />

        {/* GATE LABELS */}
        {dYs.map(function(dy,i){
            return <text key={'lbl'+i} x={(and2EX+dataToOrLane)/2} y={datG[i].my-10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fontWeight="bold" fill={gVals[i]?dCols[i]:'#475569'} style={{transition:'fill 0.3s'}}>
                {'D'+i}
            </text>;
        })}
    </svg>;
}

function NotGate(props){
    var sx=props.sx,ty=props.ty,by=props.by,my=props.my;
    return <Fragment>
        <path d={'M '+sx+','+ty+' L '+(sx+30)+','+my+' L '+sx+','+by+' Z'} fill={props.fill} stroke={props.stroke} strokeWidth="2" style={{filter:props.glow,transition:'all 0.3s'}} />
        <circle cx={sx+35} cy={my} r={5} fill={props.fill} stroke={props.stroke} strokeWidth="2" style={{filter:props.glow,transition:'all 0.3s'}} />
    </Fragment>;
}

function AndGate4(props){
    var sx=props.sx,ty=props.ty,by=props.by,w=props.w,ar=props.ar;
    var h=by-ty; var cy=(ty+by)/2; var sp=h/6;
    // D-shape: flat left, right = semicircle
    return <path d={'M '+sx+','+ty+' L '+(sx+w)+','+ty+' A '+ar+','+ar+' 0 0,1 '+(sx+w)+','+by+' L '+sx+','+by+' Z'} fill={props.fill} stroke={props.stroke} strokeWidth="2" style={{filter:props.glow,transition:'all 0.3s'}} />;
}

function AndGate2(props){
    var sx=props.sx,ty=props.ty,by=props.by,w=props.w,ar=props.ar;
    return <path d={'M '+sx+','+ty+' L '+(sx+w)+','+ty+' A '+ar+','+ar+' 0 0,1 '+(sx+w)+','+by+' L '+sx+','+by+' Z'} fill={props.fill} stroke={props.stroke} strokeWidth="2" style={{filter:props.glow,transition:'all 0.3s'}} />;
}

function OrGate(props){
    var sx=props.sx,ty=props.ty,by=props.by,my=props.my,ex=props.ex;
    return <path d={'M '+sx+','+ty+' C '+(sx+14)+','+ty+' '+(ex-12)+','+(my-6)+' '+ex+','+my+' C '+(ex-12)+','+(my+6)+' '+(sx+14)+','+by+' '+sx+','+by+' C '+(sx+10)+','+(my+5)+' '+(sx+10)+','+(my-5)+' '+sx+','+ty+' Z'} fill={props.fill} stroke={props.stroke} strokeWidth="2" style={{filter:props.glow,transition:'all 0.3s'}} />;
}

function InputNode(props){
    var ix=props.ix,iy=props.iy,val=props.val,label=props.label,onToggle=props.onToggle,color=props.color,rgb=props.rgb;
    return <g onClick={onToggle} style={{cursor:'pointer'}}>
        <rect x={ix} y={iy-21} width={inputNodeW} height={inputNodeH} rx={inputNodeRx} fill={val?'rgba('+rgb+',0.2)':'rgba('+rgb+',0.1)'} stroke={val?color:'rgba('+rgb+',0.3)'} strokeWidth="1.5" style={{transition:'all 0.25s'}} />
        <text x={ix+24} y={iy-10} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="8" fill="#64748b">{label}</text>
        <circle cx={ix+24} cy={iy} r={nodeR} fill={val?color:'rgba('+rgb+',0.15)'} stroke={val?color:'rgba('+rgb+',0.4)'} strokeWidth="1.5" style={{filter:val?'drop-shadow(0 0 5px rgba('+rgb+',0.8))':'none',transition:'all 0.25s'}} />
        <text x={ix+24} y={iy+17} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="11" fontWeight="bold" fill={val?color:'rgba('+rgb+',0.5)'}>{val?'1':'0'}</text>
    </g>;
}

function OutputNode(props){
    var ox=props.ox,oy=props.oy,val=props.val,label=props.label,color=props.color,rgb=props.rgb;
    return <Fragment>
        <text x={ox} y={oy-outNodeR-5} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="7" fill="#475569" letterSpacing="1">{label}</text>
        <circle cx={ox} cy={oy} r={outNodeR} fill={val?color:'#1e293b'} stroke={val?color:'#334155'} strokeWidth="2" style={{filter:val?'drop-shadow(0 0 8px rgba('+rgb+',0.9)) drop-shadow(0 0 18px rgba('+rgb+',0.5))':'none',transition:'all 0.3s'}} />
        <text x={ox} y={oy+4} textAnchor="middle" fontFamily="Orbitron,sans-serif" fontSize="10" fontWeight="bold" fill={val?'#000':'#475569'} style={{transition:'fill 0.3s'}}>{val?'1':'0'}</text>
    </Fragment>;
}

function W(props){
    var d=props.d,val=props.val,col=props.col,rgb=props.rgb;
    return <path d={d} fill="none" stroke={val?col:'rgba('+rgb+',0.25)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transition:'stroke 0.3s'}} />;
}

function OverlineLabel(props){
    var x=props.x,y=props.y,text=props.text,color=props.color;
    return <Fragment>
        <text x={x} y={y} textAnchor="start" fontFamily="Orbitron,sans-serif" fontSize="7" fontWeight="bold" fill={color} style={{transition:'fill 0.3s'}}>{text}</text>
        <line x1={x} y1={y-7} x2={x+12} y2={y-7} stroke={color} strokeWidth="1.2" style={{transition:'stroke 0.3s'}} />
    </Fragment>;
}