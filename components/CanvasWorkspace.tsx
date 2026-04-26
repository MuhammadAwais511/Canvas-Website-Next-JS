"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";

const CANVAS_W = 1600;
const CANVAS_H = 900;

const SWATCHES = [
  "#000000","#1e1e2e","#334155","#64748b","#94a3b8","#e2e8f0","#ffffff",
  "#ef4444","#f97316","#eab308","#22c55e","#14b8a6","#06b6d4","#3b82f6",
  "#6366f1","#8b5cf6","#a855f7","#ec4899","#f43f5e","#7c3aed","#0ea5e9",
  "#10b981","#84cc16","#fbbf24","#fb923c","#f87171","#c084fc","#2dd4bf",
];

const TOOLS = [
  { id:"pen",       label:"Pen",       key:"P", icon:<PenIcon /> },
  { id:"eraser",    label:"Eraser",    key:"E", icon:<EraserIcon /> },
  { id:"spray",     label:"Spray",     key:"S", icon:<SprayIcon /> },
  { id:"bucket",    label:"Fill",      key:"B", icon:<BucketIcon /> },
  null,
  { id:"line",      label:"Line",      key:"L", icon:<LineIcon /> },
  { id:"rectangle", label:"Rect",      key:"R", icon:<RectIcon /> },
  { id:"circle",    label:"Circle",    key:"C", icon:<CircleIcon /> },
  { id:"triangle",  label:"Triangle",  key:"T", icon:<TriangleIcon /> },
  { id:"diamond",   label:"Diamond",   key:"D", icon:<DiamondIcon /> },
  { id:"arrow",     label:"Arrow",     key:"A", icon:<ArrowIcon /> },
  null,
  { id:"eyedropper",label:"Eyedrop",   key:"I", icon:<EyedropIcon /> },
];

const SIZE_PRESETS = [2, 4, 6, 8, 12, 16, 24, 32, 48, 64];

export default function CanvasWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);
  const historyRef = useRef<string[]>([]);
  const histIdxRef = useRef<number>(-1);

  const [tool, setTool]           = useState("pen");
  const [color, setColor]         = useState("#06b6d4");
  const [secColor, setSecColor]   = useState("#1e1e2e");
  const [brushSize, setBrushSize] = useState(8);
  const [brushShape, setBrushShape] = useState("round");
  const [fillType, setFillType]   = useState("stroke");
  const [opacity, setOpacity]     = useState(100);
  const [zoom, setZoom]           = useState(1);
  const [pan, setPan]             = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid]   = useState(false);
  const [title, setTitle]         = useState("Untitled");
  const [isMobile, setIsMobile]   = useState(false);
  const [toast, setToast]         = useState("");
  const [canUndo, setCanUndo]     = useState(false);
  const [canRedo, setCanRedo]     = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, visible: false });
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showBrushPanel, setShowBrushPanel] = useState(false);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 920);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Canvas helpers ──────────────────────────────────────────────
  const getCtx = useCallback(() => canvasRef.current?.getContext("2d"), []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = CANVAS_W + "px";
    canvas.style.height = CANVAS_H + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0d0d14";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  const fitToWindow = useCallback(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    const pw = wrap.clientWidth - 24;
    const ph = wrap.clientHeight - 24;
    const z = Math.min(pw / CANVAS_W, ph / CANVAS_H);
    setZoom(z);
    setPan({ x: 0, y: 0 });
  }, []);

  const updateHistoryState = useCallback(() => {
    setCanUndo(histIdxRef.current > 0);
    setCanRedo(histIdxRef.current < historyRef.current.length - 1);
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    historyRef.current = historyRef.current.slice(0, histIdxRef.current + 1);
    historyRef.current.push(canvas.toDataURL());
    if (historyRef.current.length > 60) historyRef.current.shift();
    histIdxRef.current = historyRef.current.length - 1;
    updateHistoryState();
  }, [updateHistoryState]);

  const restoreHistory = useCallback((idx: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    const src = historyRef.current[idx];
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      histIdxRef.current = idx;
      updateHistoryState();
    };
    img.src = src;
  }, [getCtx, updateHistoryState]);

  const undo = useCallback(() => {
    if (histIdxRef.current > 0) { restoreHistory(histIdxRef.current - 1); showToast("Undo"); }
  }, [restoreHistory, showToast]);

  const redo = useCallback(() => {
    if (histIdxRef.current < historyRef.current.length - 1) { restoreHistory(histIdxRef.current + 1); showToast("Redo"); }
  }, [restoreHistory, showToast]);

  const clearCanvas = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0d0d14";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    pushHistory();
    showToast("Cleared");
  }, [getCtx, pushHistory, showToast]);

  // ── Drawing helpers ─────────────────────────────────────────────
  const getPos = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = CANVAS_W / rect.width, sy = CANVAS_H / rect.height;
    return {
      x: Math.max(0, Math.min(CANVAS_W, (e.clientX - rect.left) * sx)),
      y: Math.max(0, Math.min(CANVAS_H, (e.clientY - rect.top) * sy)),
    };
  }, []);

  const applyStyle = useCallback((ctx: CanvasRenderingContext2D, isEraser: boolean) => {
    ctx.globalAlpha = opacity / 100;
    ctx.lineWidth = brushSize;
    ctx.lineCap = brushShape === "square" ? "square" : "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = isEraser ? "#0d0d14" : color;
    ctx.fillStyle = color;
  }, [opacity, brushSize, brushShape, color]);

  const hexToRgb = useCallback((hex: string) => [
    parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16), 255
  ], []);

  const sprayPaint = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const r = brushSize * 1.5;
    ctx.globalAlpha = (opacity / 100) * 0.35;
    ctx.fillStyle = color;
    for (let i = 0; i < Math.ceil(r * 1.5); i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * r;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a)*d, y + Math.sin(a)*d, 0.9, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [brushSize, opacity, color]);

  const bucketFill = useCallback((x: number, y: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const d = imgData.data;
    const px = Math.floor(x), py = Math.floor(y);
    const i0 = (py * CANVAS_W + px) * 4;
    const [tr, tg, tb] = [d[i0], d[i0+1], d[i0+2]];
    const [fr, fg, fb] = hexToRgb(color);
    if (tr===fr && tg===fg && tb===fb) return;
    const stack: [number, number][] = [[px, py]];
    const visited = new Uint8Array(CANVAS_W * CANVAS_H);
    const tol = 32;
    while (stack.length) {
      const pos = stack.pop();
      if (!pos) continue;
      const [cx, cy] = pos;
      if (cx<0||cx>=CANVAS_W||cy<0||cy>=CANVAS_H) continue;
      const k = cy*CANVAS_W+cx;
      if (visited[k]) continue;
      const i = k*4;
      if (Math.abs(d[i]-tr)>tol||Math.abs(d[i+1]-tg)>tol||Math.abs(d[i+2]-tb)>tol) continue;
      visited[k]=1; d[i]=fr; d[i+1]=fg; d[i+2]=fb; d[i+3]=255;
      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
    }
    ctx.putImageData(imgData, 0, 0);
  }, [getCtx, color, hexToRgb]);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, sx: number, sy: number, ex: number, ey: number, restore: boolean) => {
    if (restore && snapshotRef.current) {
      ctx.globalAlpha = 1;
      ctx.putImageData(snapshotRef.current, 0, 0);
    }
    applyStyle(ctx, false);
    const doS = fillType==="stroke"||fillType==="both";
    const doF = fillType==="fill"||fillType==="both";
    ctx.beginPath();
    if (tool==="line") {
      ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    } else if (tool==="rectangle") {
      ctx.rect(sx,sy,ex-sx,ey-sy);
      if(doF) ctx.fill(); if(doS) ctx.stroke();
    } else if (tool==="circle") {
      ctx.arc(sx, sy, Math.hypot(ex-sx,ey-sy), 0, Math.PI*2);
      if(doF) ctx.fill(); if(doS) ctx.stroke();
    } else if (tool==="triangle") {
      ctx.moveTo(sx+(ex-sx)/2, sy); ctx.lineTo(ex,ey); ctx.lineTo(sx,ey); ctx.closePath();
      if(doF) ctx.fill(); if(doS) ctx.stroke();
    } else if (tool==="diamond") {
      const mx=(sx+ex)/2, my=(sy+ey)/2;
      ctx.moveTo(mx,sy); ctx.lineTo(ex,my); ctx.lineTo(mx,ey); ctx.lineTo(sx,my); ctx.closePath();
      if(doF) ctx.fill(); if(doS) ctx.stroke();
    } else if (tool==="arrow") {
      const ang = Math.atan2(ey-sy,ex-sx);
      const hs = brushSize * 3.5;
      ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex,ey);
      ctx.lineTo(ex-hs*Math.cos(ang-Math.PI/6), ey-hs*Math.sin(ang-Math.PI/6));
      ctx.moveTo(ex,ey);
      ctx.lineTo(ex-hs*Math.cos(ang+Math.PI/6), ey-hs*Math.sin(ang+Math.PI/6));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [tool, fillType, applyStyle, brushSize]);

  const SHAPE_TOOLS = useMemo(
    () => new Set(["line","rectangle","circle","triangle","diamond","arrow"]),
    []
  );

  // ── Pointer events ──────────────────────────────────────────────
  const onPointerDown = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = getPos(e);
    isDrawingRef.current = true;
    startRef.current = { x, y };
    lastRef.current = { x, y };
    snapshotRef.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);

    if (tool==="pen"||tool==="eraser") {
      applyStyle(ctx, tool==="eraser");
      ctx.beginPath(); ctx.moveTo(x,y);
      ctx.arc(x,y,brushSize/2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x,y);
    } else if (tool==="spray") {
      sprayPaint(ctx, x, y);
    } else if (tool==="bucket") {
      bucketFill(x, y);
      pushHistory();
      isDrawingRef.current = false;
      showToast("Fill applied");
    } else if (tool==="eyedropper") {
      const d = ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data;
      const hex = "#"+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,"0")).join("");
      setColor(hex);
      isDrawingRef.current = false;
      showToast("Color: " + hex.toUpperCase());
    }
  }, [getCtx, getPos, tool, applyStyle, brushSize, sprayPaint, bucketFill, pushHistory, showToast]);

  const onPointerMove = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getPos(e);
    setMouseCoords({ x: Math.round(x), y: Math.round(y) });
    setCursorPos({ x: e.clientX, y: e.clientY, visible: true });
    if (!isDrawingRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;

    if (tool==="pen"||tool==="eraser") {
      applyStyle(ctx, tool==="eraser");
      ctx.lineTo(x,y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x,y);
    } else if (tool==="spray") {
      sprayPaint(ctx, x, y);
    } else if (SHAPE_TOOLS.has(tool)) {
      const start = startRef.current;
      if (!start) return;
      drawShape(ctx, start.x, start.y, x, y, true);
    }
    lastRef.current = { x, y };
  }, [getPos, getCtx, tool, applyStyle, sprayPaint, drawShape, SHAPE_TOOLS]);

  const onPointerUp = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = getPos(e);
    if (SHAPE_TOOLS.has(tool)) {
      const start = startRef.current;
      if (start) drawShape(ctx, start.x, start.y, x, y, true);
    }
    if (tool==="pen"||tool==="eraser") ctx.closePath();
    ctx.globalAlpha = 1;
    isDrawingRef.current = false;
    snapshotRef.current = null;
    startRef.current = null;
    lastRef.current = null;
    pushHistory();
  }, [getCtx, getPos, tool, drawShape, SHAPE_TOOLS, pushHistory]);

  const onPointerLeave = useCallback(() => {
    setCursorPos(p => ({ ...p, visible: false }));
    if (isDrawingRef.current) {
      const ctx = getCtx();
      if (ctx) { ctx.globalAlpha = 1; ctx.closePath(); }
      isDrawingRef.current = false;
      pushHistory();
    }
  }, [getCtx, pushHistory]);

  // ── Wheel zoom ──────────────────────────────────────────────────
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(z => Math.max(0.1, Math.min(5, z * delta)));
  }, []);

  // ── Download ────────────────────────────────────────────────────
  const downloadPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = (title.trim().replace(/[^a-z0-9]/gi,"_") || "canvas") + ".png";
    a.click();
    showToast("Downloaded!");
  }, [title, showToast]);

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")) return;
      const k = e.key.toLowerCase();
      if (e.ctrlKey) {
        if (k==="z") { e.preventDefault(); undo(); }
        if (k==="y") { e.preventDefault(); redo(); }
        if (k==="s") { e.preventDefault(); showToast("Saved!"); }
        return;
      }
      const map: Record<string, string> = { p:"pen",e:"eraser",l:"line",r:"rectangle",c:"circle",t:"triangle",d:"diamond",a:"arrow",s:"spray",b:"bucket",i:"eyedropper" };
      const nextTool = map[k];
      if (nextTool) setTool(nextTool);
      if (k==="="||k==="+") setZoom(z=>Math.min(5,z+0.1));
      if (k==="-") setZoom(z=>Math.max(0.1,z-0.1));
      if (k==="0") fitToWindow();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, showToast, fitToWindow]);

  // ── Init ────────────────────────────────────────────────────────
  useEffect(() => {
    initCanvas();
    setTimeout(() => { fitToWindow(); pushHistory(); }, 60);
  }, [initCanvas, fitToWindow, pushHistory]);

  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  useEffect(() => {
    const ro = new ResizeObserver(fitToWindow);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [fitToWindow]);

  // ── Render ──────────────────────────────────────────────────────
  const cursorSize = Math.max(6, brushSize * zoom * 2);

  const rootStyle: CSSProperties = isMobile
    ? { ...styles.root, width: "100%", minHeight: "calc(100vh - 240px)" }
    : styles.root;
  const topbarStyle: CSSProperties = isMobile
    ? { ...styles.topbar, flexWrap: "wrap", gap: 8, alignItems: "center", minHeight: "auto" }
    : styles.topbar;
  const workspaceStyle: CSSProperties = isMobile
    ? { ...styles.workspace, flexDirection: "column" }
    : styles.workspace;
  const sidebarStyle: CSSProperties = isMobile
    ? {
        ...styles.sidebar,
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        height: "auto",
        maxHeight: 120,
        padding: "8px 6px",
        overflowX: "auto",
        overflowY: "hidden",
        justifyContent: "flex-start",
      }
    : styles.sidebar;
  const rightPanelStyle: CSSProperties = isMobile
    ? {
        ...styles.rightPanel,
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        height: "auto",
        padding: "8px 6px",
        gap: 6,
        overflowX: "auto",
      }
    : styles.rightPanel;
  const canvasWrapperStyle: CSSProperties = isMobile
    ? { ...styles.canvasWrapper, minHeight: 360 }
    : styles.canvasWrapper;
  const titleInputStyle: CSSProperties = isMobile
    ? { ...styles.titleInput, flex: 1, minWidth: 0 }
    : styles.titleInput;

  return (
    <div style={rootStyle}>
      {/* ── TOP BAR ── */}
      <div style={topbarStyle}>
        <div style={styles.tbLogo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>Canvas Studio</span>
        </div>
        <div style={styles.tbDiv} />

        {/* History */}
        <button onClick={undo} disabled={!canUndo} style={{ ...styles.iconBtn, opacity: canUndo?1:0.3 }} title="Undo (Ctrl+Z)">
          <UndoIcon />
        </button>
        <button onClick={redo} disabled={!canRedo} style={{ ...styles.iconBtn, opacity: canRedo?1:0.3 }} title="Redo (Ctrl+Y)">
          <RedoIcon />
        </button>
        <div style={styles.tbDiv} />

        {/* Zoom */}
        <button onClick={() => setZoom(z=>Math.max(0.1,z-0.1))} style={styles.tbBtn}>−</button>
        <span style={styles.zoomLabel}>{Math.round(zoom*100)}%</span>
        <button onClick={() => setZoom(z=>Math.min(5,z+0.1))} style={styles.tbBtn}>+</button>
        <button onClick={fitToWindow} style={styles.tbBtn}>Fit</button>
        <div style={styles.tbDiv} />

        <button onClick={() => setShowGrid(g=>!g)} style={{ ...styles.tbBtn, ...(showGrid?styles.tbBtnActive:{}) }}>Grid</button>

        {/* Fill type */}
        {[
          { v:"stroke", label:"Outline" },
          { v:"fill",   label:"Fill" },
          { v:"both",   label:"Both" },
        ].map(f => (
          <button key={f.v} onClick={() => setFillType(f.v)}
            style={{ ...styles.tbBtn, ...(fillType===f.v?styles.tbBtnActive:{}) }}>
            {f.label}
          </button>
        ))}

        <div style={{ flex:1 }} />
        <input value={title} onChange={e=>setTitle(e.target.value)} style={titleInputStyle} />
        <button onClick={clearCanvas} style={styles.dangerBtn}>Clear</button>
        <button onClick={downloadPNG} style={styles.tbBtn}>PNG</button>
        <button style={styles.primaryBtn}>Save</button>
      </div>

      <div style={workspaceStyle}>
        {/* ── LEFT TOOLS ── */}
        <div style={sidebarStyle}>
          {TOOLS.map((t, i) =>
            t === null
              ? <div key={i} style={styles.sideDiv} />
              : (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  title={`${t.label} [${t.key}]`}
                  style={{ ...styles.toolBtn, ...(tool===t.id?styles.toolBtnActive:{}) }}
                >
                  {t.icon}
                </button>
              )
          )}
        </div>

        {/* ── CANVAS AREA ── */}
        <div ref={wrapperRef} style={canvasWrapperStyle}>
          {/* Checkerboard bg hint */}
          <div style={styles.checkerBg} />

          <div style={{
            position: "absolute",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            top: "50%", left: "50%",
            marginTop: -CANVAS_H/2, marginLeft: -CANVAS_W/2,
            boxShadow: "0 0 0 1px #1e1e2e, 0 20px 60px rgba(0,0,0,0.7)",
          }}>
            <canvas
              ref={canvasRef}
              style={{ display:"block", cursor:"none", touchAction:"none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerLeave}
            />
            {/* Grid overlay */}
            {showGrid && <GridOverlay />}
          </div>

          {/* Custom cursor */}
          {cursorPos.visible && (
            <div style={{
              position: "fixed",
              left: cursorPos.x, top: cursorPos.y,
              width: cursorSize, height: cursorSize,
              borderRadius: brushShape==="square"?"2px":"50%",
              border: `1.5px solid ${color}cc`,
              transform: "translate(-50%,-50%)",
              pointerEvents: "none",
              zIndex: 9999,
              mixBlendMode: "difference",
            }} />
          )}

          {/* Status bar */}
          <div style={styles.statusBar}>
            <span style={styles.sbItem}>
              <span style={styles.sbLabel}>pos</span>
              <span style={styles.sbVal}>{mouseCoords.x}, {mouseCoords.y}</span>
            </span>
            <span style={styles.sbItem}>
              <span style={styles.sbLabel}>canvas</span>
              <span style={styles.sbVal}>{CANVAS_W}×{CANVAS_H}</span>
            </span>
            <span style={styles.sbItem}>
              <span style={styles.sbLabel}>brush</span>
              <span style={styles.sbVal}>{brushSize}px</span>
            </span>
            <span style={styles.sbItem}>
              <span style={styles.sbLabel}>tool</span>
              <span style={styles.sbVal}>{tool}</span>
            </span>
            <span style={styles.sbItem}>
              <span style={styles.sbLabel}>opacity</span>
              <span style={styles.sbVal}>{opacity}%</span>
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={rightPanelStyle}>
          {/* Active color swatch */}
          <button
            onClick={() => { setShowColorPanel(p=>!p); setShowBrushPanel(false); }}
            title="Colors [K]"
            style={{ ...styles.colorSwatch, background: color, ...(showColorPanel?styles.toolBtnActive:{}) }}
          />
          <button
            onClick={() => { setShowBrushPanel(p=>!p); setShowColorPanel(false); }}
            title="Brush [W]"
            style={{ ...styles.toolBtn, ...(showBrushPanel?styles.toolBtnActive:{}) }}
          >
            <BrushIcon />
          </button>
          <div style={styles.sideDiv} />

          {/* Quick size presets */}
          <div style={styles.rpLabel}>SIZE</div>
          {[4,8,16,32].map(s => (
            <button key={s} onClick={() => setBrushSize(s)}
              style={{ ...styles.toolBtn, ...(brushSize===s?styles.toolBtnActive:{}), fontSize:9 }}>
              {s}
            </button>
          ))}

          <div style={styles.sideDiv} />
          <div style={styles.rpLabel}>OP</div>
          {[100,75,50,25].map(o => (
            <button key={o} onClick={() => setOpacity(o)}
              style={{ ...styles.toolBtn, ...(opacity===o?styles.toolBtnActive:{}), fontSize:9 }}>
              {o}%
            </button>
          ))}
        </div>
      </div>

      {/* ── COLOR PANEL ── */}
      {showColorPanel && (
        <div style={styles.floatPanel}>
          <div style={styles.fpTitle}>Color</div>
          <button onClick={() => setShowColorPanel(false)} style={styles.fpClose}>✕</button>

          <div style={styles.swatchGrid}>
            {SWATCHES.map(c => (
              <button key={c} onClick={() => { setColor(c); showToast(c.toUpperCase()); }}
                style={{
                  ...styles.swatchBtn,
                  background: c,
                  outline: color===c?"2px solid #fff":"none",
                  outlineOffset: 2,
                }} />
            ))}
          </div>

          <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ ...styles.bigSwatch, background: color }}
              onClick={() => {
                const input = document.getElementById("_native_color") as HTMLInputElement | null;
                if (input) input.click();
              }} />
            <input id="_native_color" type="color" value={color}
              onChange={e=>setColor(e.target.value)}
              style={{ width:0, height:0, opacity:0, position:"absolute" }} />
            <input
              value={color}
              onChange={e => { if(/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setColor(e.target.value); }}
              style={styles.hexInput}
              maxLength={7}
            />
          </div>

          <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ ...styles.bigSwatchSm, background: secColor }} />
            <span style={styles.fpMuted}>secondary</span>
            <button onClick={() => { const t=color; setColor(secColor); setSecColor(t); }}
              style={{ ...styles.tbBtn, marginLeft:"auto" }}>⇄ swap</button>
          </div>
        </div>
      )}

      {/* ── BRUSH PANEL ── */}
      {showBrushPanel && (
        <div style={{ ...styles.floatPanel, left: "auto", right: 68, top: 56 }}>
          <div style={styles.fpTitle}>Brush</div>
          <button onClick={() => setShowBrushPanel(false)} style={styles.fpClose}>✕</button>

          {/* Preview */}
          <div style={styles.brushPreviewWrap}>
            <div style={{
              width: Math.min(60, brushSize*1.8+4),
              height: Math.min(60, brushSize*1.8+4),
              borderRadius: brushShape==="square"?"4px":"50%",
              background: color,
              transition: "all .15s",
            }} />
          </div>

          <input type="range" min={1} max={80} value={brushSize}
            onChange={e => setBrushSize(+e.target.value)}
            style={styles.rangeSlider} />
          <div style={{ textAlign:"center", fontSize:10, color:"#64748b", marginBottom:8 }}>{brushSize}px</div>

          <div style={styles.sizePresetRow}>
            {SIZE_PRESETS.map(s => (
              <button key={s} onClick={() => setBrushSize(s)}
                style={{ ...styles.sizePreset, ...(brushSize===s?styles.sizePresetActive:{}) }}>
                {s}
              </button>
            ))}
          </div>

          <div style={styles.fpLabel}>Shape</div>
          <div style={{ display:"flex", gap:6 }}>
            {["round","square","flat"].map(sh => (
              <button key={sh} onClick={() => setBrushShape(sh)}
                style={{ ...styles.fpChip, ...(brushShape===sh?styles.fpChipActive:{}) }}>
                {sh}
              </button>
            ))}
          </div>

          <div style={styles.fpLabel}>Opacity: {opacity}%</div>
          <input type="range" min={5} max={100} value={opacity}
            onChange={e => setOpacity(+e.target.value)}
            style={styles.rangeSlider} />
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={styles.toast}>{toast}</div>
      )}
    </div>
  );
}

// ── Inline styles ────────────────────────────────────────────────
const styles: Record<string, CSSProperties> = {
  root: {
    display:"flex", flexDirection:"column",
    width:"100%", minHeight:"calc(100vh - 240px)",
    background:"#0a0a0f", color:"#e2e8f0",
    fontFamily:"'JetBrains Mono','Fira Code',monospace",
    overflow:"hidden", userSelect:"none",
  },
  topbar: {
    display:"flex", alignItems:"center", gap:4, padding:"0 10px",
    height:44, background:"#111118", borderBottom:"1px solid #1e1e2e",
    flexShrink:0, flexWrap:"nowrap",
  },
  tbLogo: { display:"flex", alignItems:"center", gap:6, marginRight:4 },
  logoIcon: { fontSize:16, color:"#7c3aed" },
  logoText: { fontSize:11, fontWeight:600, color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase" },
  tbDiv: { width:1, height:22, background:"#1e1e2e", margin:"0 4px", flexShrink:0 },
  tbBtn: {
    background:"transparent", border:"1px solid #1e1e2e", color:"#94a3b8",
    fontSize:10, fontFamily:"inherit", padding:"4px 8px", borderRadius:4,
    cursor:"pointer", flexShrink:0, whiteSpace:"nowrap",
  },
  tbBtnActive: { background:"#7c3aed22", borderColor:"#7c3aed88", color:"#a78bfa" },
  iconBtn: {
    background:"transparent", border:"none", color:"#64748b",
    cursor:"pointer", padding:"4px 6px", display:"flex", alignItems:"center",
  },
  zoomLabel: { fontSize:10, color:"#64748b", minWidth:38, textAlign:"center" },
  titleInput: {
    background:"transparent", border:"1px solid transparent", color:"#e2e8f0",
    fontSize:11, fontFamily:"inherit", padding:"4px 8px", borderRadius:4,
    outline:"none", minWidth:110,
  },
  dangerBtn: {
    background:"transparent", border:"1px solid #7f1d1d44", color:"#f87171",
    fontSize:10, fontFamily:"inherit", padding:"4px 8px", borderRadius:4, cursor:"pointer",
  },
  primaryBtn: {
    background:"#7c3aed", border:"1px solid #7c3aed", color:"#fff",
    fontSize:10, fontFamily:"inherit", padding:"4px 12px", borderRadius:4, cursor:"pointer",
  },
  workspace: { display:"flex", flex:1, overflow:"hidden" },
  sidebar: {
    width:52, background:"#111118", borderRight:"1px solid #1e1e2e",
    display:"flex", flexDirection:"column", alignItems:"center",
    padding:"8px 0", gap:2, overflowY:"auto", flexShrink:0,
  },
  rightPanel: {
    width:52, background:"#111118", borderLeft:"1px solid #1e1e2e",
    display:"flex", flexDirection:"column", alignItems:"center",
    padding:"8px 0", gap:2, overflowY:"auto", flexShrink:0,
  },
  rpLabel: { fontSize:8, color:"#334155", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:2 },
  toolBtn: {
    width:38, height:38, background:"transparent", border:"1px solid transparent",
    borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
    transition:"all .12s", flexShrink:0, color:"#64748b",
  },
  toolBtnActive: { background:"#7c3aed22", borderColor:"#7c3aed", color:"#a78bfa" },
  sideDiv: { width:28, height:1, background:"#1e1e2e", margin:"4px 0", flexShrink:0 },
  colorSwatch: {
    width:32, height:32, borderRadius:6, border:"2px solid #2d2d44",
    cursor:"pointer", flexShrink:0,
  },
  canvasWrapper: {
    flex:1, position:"relative", overflow:"hidden",
    background:"#0d0d14", display:"flex", alignItems:"center", justifyContent:"center",
  },
  checkerBg: {
    position:"absolute", inset:0, pointerEvents:"none",
    backgroundImage:`linear-gradient(45deg,#111118 25%,transparent 25%),
      linear-gradient(-45deg,#111118 25%,transparent 25%),
      linear-gradient(45deg,transparent 75%,#111118 75%),
      linear-gradient(-45deg,transparent 75%,#111118 75%)`,
    backgroundSize:"20px 20px",
    backgroundPosition:"0 0,0 10px,10px -10px,-10px 0px",
    opacity:0.5,
  },
  statusBar: {
    position:"absolute", bottom:0, left:0, right:0, height:24,
    background:"rgba(10,10,15,0.85)", borderTop:"1px solid #1e1e2e22",
    display:"flex", alignItems:"center", padding:"0 12px", gap:20,
    pointerEvents:"none",
  },
  sbItem: { display:"flex", gap:5, alignItems:"center" },
  sbLabel: { fontSize:9, color:"#334155", textTransform:"uppercase" },
  sbVal: { fontSize:9, color:"#64748b" },

  floatPanel: {
    position:"fixed", left:62, top:56,
    background:"#111118", border:"1px solid #1e1e2e",
    borderRadius:10, padding:"14px 14px 12px",
    zIndex:100, minWidth:240,
    boxShadow:"0 20px 50px rgba(0,0,0,0.7)",
  },
  fpTitle: { fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:"#4b5563", marginBottom:10 },
  fpClose: {
    position:"absolute", top:8, right:10,
    background:"transparent", border:"none", color:"#4b5563",
    fontSize:13, cursor:"pointer",
  },
  fpLabel: { fontSize:9, color:"#4b5563", marginTop:10, marginBottom:4 },
  fpMuted: { fontSize:9, color:"#4b5563" },
  fpChip: {
    flex:1, padding:"5px 8px", background:"#1a1a28", border:"1px solid #1e1e2e",
    borderRadius:5, fontSize:9, color:"#64748b", cursor:"pointer", textAlign:"center",
  },
  fpChipActive: { background:"#7c3aed22", borderColor:"#7c3aed88", color:"#a78bfa" },

  swatchGrid: { display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 },
  swatchBtn: { width:24, height:24, borderRadius:4, border:"none", cursor:"pointer", transition:"transform .1s" },
  bigSwatch: { width:36, height:36, borderRadius:6, border:"1px solid #2d2d44", cursor:"pointer", flexShrink:0 },
  bigSwatchSm: { width:22, height:22, borderRadius:4, border:"1px solid #2d2d44", flexShrink:0 },
  hexInput: {
    background:"#0d0d14", border:"1px solid #1e1e2e", color:"#e2e8f0",
    fontSize:11, fontFamily:"inherit", padding:"5px 8px", borderRadius:4,
    outline:"none", width:82,
  },

  brushPreviewWrap: {
    display:"flex", alignItems:"center", justifyContent:"center",
    height:48, marginBottom:6,
  },
  rangeSlider: { width:"100%", margin:"4px 0 2px", accentColor:"#7c3aed" },
  sizePresetRow: { display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 },
  sizePreset: {
    width:30, height:24, background:"#1a1a28", border:"1px solid #1e1e2e",
    borderRadius:4, fontSize:9, color:"#64748b", cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center",
  },
  sizePresetActive: { borderColor:"#7c3aed88", color:"#a78bfa", background:"#7c3aed22" },

  toast: {
    position:"fixed", bottom:32, left:"50%", transform:"translateX(-50%)",
    background:"#1e1e2e", border:"1px solid #2d2d44", color:"#e2e8f0",
    fontSize:11, fontFamily:"inherit", padding:"8px 18px", borderRadius:20,
    pointerEvents:"none", zIndex:200, whiteSpace:"nowrap",
    boxShadow:"0 8px 24px rgba(0,0,0,0.5)",
  },
};

// ── Grid overlay ─────────────────────────────────────────────────
function GridOverlay() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = CANVAS_W * dpr;
    cv.height = CANVAS_H * dpr;
    cv.style.width = CANVAS_W + "px";
    cv.style.height = CANVAS_H + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = 40;
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x=0;x<=CANVAS_W;x+=g){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CANVAS_H);ctx.stroke(); }
    for (let y=0;y<=CANVAS_H;y+=g){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CANVAS_W,y);ctx.stroke(); }
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    for (let x=0;x<=CANVAS_W;x+=g*5){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CANVAS_H);ctx.stroke(); }
    for (let y=0;y<=CANVAS_H;y+=g*5){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CANVAS_W,y);ctx.stroke(); }
  }, []);
  return <canvas ref={ref} style={{ position:"absolute",top:0,left:0,pointerEvents:"none" }} />;
}

// ── SVG Icons ────────────────────────────────────────────────────
function PenIcon()      { return <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>; }
function EraserIcon()   { return <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20.71 4.63l-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l1.46-1.46 4.58 4.71H9v2h10l3.42-3.42a1 1 0 0 0 0-1.41zM9.75 9.75L3 16.5V21h4.5l6.75-6.75z"/></svg>; }
function SprayIcon()    { return <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="8" cy="12" r="1.5"/><circle cx="12" cy="8" r="1"/><circle cx="15" cy="11" r="1.5"/><circle cx="11" cy="15" r="1"/><circle cx="6" cy="8" r="1"/><circle cx="16" cy="7" r="1"/><circle cx="9" cy="17" r="1.5"/><path d="M5 20h14v-2H5z"/></svg>; }
function BucketIcon()   { return <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15a1.49 1.49 0 0 0 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10 10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/><path d="M0 20h24v4H0z" opacity=".3"/></svg>; }
function LineIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>; }
function RectIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/></svg>; }
function CircleIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/></svg>; }
function TriangleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24"><polygon points="12,3 22,20 2,20" stroke="currentColor" strokeWidth="2" fill="none"/></svg>; }
function DiamondIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" stroke="currentColor" strokeWidth="2" fill="none"/></svg>; }
function ArrowIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="10,4 20,4 20,14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/></svg>; }
function EyedropIcon()  { return <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41L3 17.25V21h3.75l9.46-9.46 1.41 1.41 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 0 0 .01-1.42z"/></svg>; }
function BrushIcon()    { return <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l9.96-9.96a1 1 0 0 0 0-1.41z"/></svg>; }
function UndoIcon()     { return <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>; }
function RedoIcon()     { return <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 15.7C5 12.81 7.7 10.5 11 10.5c1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>; }
