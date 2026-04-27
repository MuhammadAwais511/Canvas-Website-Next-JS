"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const MAX_HISTORY = 80;

const SWATCHES = [
  "#000000","#111827","#1f2937","#374151","#4b5563","#6b7280",
  "#9ca3af","#d1d5db","#f3f4f6","#ffffff",
  "#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e",
  "#10b981","#14b8a6","#06b6d4","#0ea5e9","#3b82f6","#6366f1",
  "#8b5cf6","#a855f7","#d946ef","#ec4899","#f43f5e","#fb7185",
  "#fbbf24","#fb923c","#c084fc","#2dd4bf","#67e8f9","#7c3aed",
];

const CANVAS_PRESETS = [
  { label:"HD 1080p", w:1920, h:1080 },
  { label:"4K UHD",   w:3840, h:2160 },
  { label:"Square",   w:1080, h:1080 },
  { label:"Portrait", w:1080, h:1350 },
  { label:"Banner",   w:1200, h:628 },
  { label:"A4",       w:2480, h:3508 },
];

// ─── Tool Definitions ─────────────────────────────────────────────────────────
type ToolDef = { id: string; label: string; key: string; icon: JSX.Element; group?: string };

const TOOLS: (ToolDef | null)[] = [
  { id:"pen",        label:"Pen",        key:"P", icon:<PenIcon />,        group:"draw" },
  { id:"brush",      label:"Brush",      key:"B", icon:<BrushFatIcon />,   group:"draw" },
  { id:"spray",      label:"Spray",      key:"S", icon:<SprayIcon />,      group:"draw" },
  { id:"eraser",     label:"Eraser",     key:"E", icon:<EraserIcon />,     group:"draw" },
  null,
  { id:"line",       label:"Line",       key:"L", icon:<LineIcon />,       group:"shape" },
  { id:"rectangle",  label:"Rect",       key:"R", icon:<RectIcon />,       group:"shape" },
  { id:"circle",     label:"Circle",     key:"C", icon:<CircleIcon />,     group:"shape" },
  { id:"triangle",   label:"Triangle",   key:"T", icon:<TriangleIcon />,   group:"shape" },
  { id:"diamond",    label:"Diamond",    key:"D", icon:<DiamondIcon />,    group:"shape" },
  { id:"arrow",      label:"Arrow",      key:"A", icon:<ArrowIcon />,      group:"shape" },
  { id:"star",       label:"Star",       key:"*", icon:<StarIcon />,       group:"shape" },
  null,
  { id:"bucket",     label:"Fill",       key:"G", icon:<BucketIcon />,     group:"util" },
  { id:"eyedropper", label:"Eyedrop",    key:"I", icon:<EyedropIcon />,    group:"util" },
  { id:"text",       label:"Text",       key:"X", icon:<TextIcon />,       group:"util" },
  { id:"crop",       label:"Select",     key:"M", icon:<CropIcon />,       group:"util" },
];

const SIZE_PRESETS = [1,2,3,4,5,6,8,10,12,16,20,24,32,40,48,64];
const BLEND_MODES = ["source-over","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion"];

// ─── Types ────────────────────────────────────────────────────────────────────
type Vec2 = { x: number; y: number };
type CanvasSize = { w: number; h: number };

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CanvasWorkspace() {
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const overlayRef   = useRef<HTMLCanvasElement | null>(null); // preview layer
  const wrapperRef   = useRef<HTMLDivElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  const isDrawingRef = useRef(false);
  const startRef     = useRef<Vec2 | null>(null);
  const lastRef      = useRef<Vec2 | null>(null);
  const snapshotRef  = useRef<ImageData | null>(null);
  const historyRef   = useRef<string[]>([]);
  const histIdxRef   = useRef<number>(-1);
  const sprayTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef      = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  // ─── State ─────────────────────────────────────────────────────
  const [tool,         setTool]         = useState("pen");
  const [color,        setColor]        = useState("#e2e8f0");
  const [secColor,     setSecColor]     = useState("#0d0d1a");
  const [brushSize,    setBrushSize]    = useState(8);
  const [brushHardness,setBrushHardness]= useState(100);
  const [brushShape,   setBrushShape]   = useState<"round"|"square">("round");
  const [fillType,     setFillType]     = useState<"stroke"|"fill"|"both">("stroke");
  const [opacity,      setOpacity]      = useState(100);
  const [blendMode,    setBlendMode]    = useState("source-over");
  const [zoom,         setZoom]         = useState(1);
  const [pan,          setPan]          = useState<Vec2>({ x:0, y:0 });
  const [showGrid,     setShowGrid]     = useState(false);
  const [gridSize,     setGridSize]     = useState(40);
  const [snapToGrid,   setSnapToGrid]   = useState(false);
  const [title,        setTitle]        = useState("Untitled");
  const [canvasSize,   setCanvasSize]   = useState<CanvasSize>({ w:CANVAS_W, h:CANVAS_H });
  const [bgColor,      setBgColor]      = useState("#0d0d1a");
  const [toast,        setToast]        = useState("");
  const [toastType,    setToastType]    = useState<"info"|"success"|"warn">("info");
  const [canUndo,      setCanUndo]      = useState(false);
  const [canRedo,      setCanRedo]      = useState(false);
  const [cursorPos,    setCursorPos]    = useState<Vec2 & {visible:boolean}>({ x:0, y:0, visible:false });
  const [mouseCoords,  setMouseCoords]  = useState<Vec2>({ x:0, y:0 });
  const [isPanning,    setIsPanning]    = useState(false);
  const [panStart,     setPanStart]     = useState<Vec2>({ x:0, y:0 });
  const [showLeftPanel,   setShowLeftPanel]   = useState(true);
  const [showRightPanel,  setShowRightPanel]  = useState(true);
  const [activeRightTab,  setActiveRightTab]  = useState<"color"|"brush"|"canvas">("color");
  const [isMobile,     setIsMobile]     = useState(false);
  const [isTablet,     setIsTablet]     = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false);
  const [textPos,      setTextPos]      = useState<Vec2 | null>(null);
  const [textInput,    setTextInput]    = useState("");
  const [fontSize,     setFontSize]     = useState(24);
  const [fontFamily,   setFontFamily]   = useState("sans-serif");
  const [selectionRect, setSelectionRect] = useState<{x:number;y:number;w:number;h:number}|null>(null);
  const [showPresets,  setShowPresets]  = useState(false);
  const [pressureSimulation, setPressureSimulation] = useState(false);
  const [smoothing,    setSmoothing]    = useState(true);
  const [lineSmoothing, setLineSmoothing] = useState<Vec2[]>([]);
  const [symmetry,     setSymmetry]     = useState<"none"|"horizontal"|"vertical"|"both">("none");
  const [darkMode,     setDarkMode]     = useState(true);

  // ─── Responsive detection ──────────────────────────────────────
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ─── Canvas init ───────────────────────────────────────────────
  const getCtx = useCallback(() => canvasRef.current?.getContext("2d"), []);
  const getOverCtx = useCallback(() => overlayRef.current?.getContext("2d"), []);

  const initCanvas = useCallback((w = canvasSize.w, h = canvasSize.h) => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    const dpr = window.devicePixelRatio || 1;
    for (const cv of [canvas, overlay]) {
      cv.width  = w * dpr;
      cv.height = h * dpr;
      cv.style.width  = w + "px";
      cv.style.height = h + "px";
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);
    const octx = overlay.getContext("2d");
    if (octx) {
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.clearRect(0, 0, w, h);
    }
  }, [canvasSize.w, canvasSize.h, bgColor]);

  const fitToWindow = useCallback(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    const pw = wrap.clientWidth - 40;
    const ph = wrap.clientHeight - 40;
    const z = Math.min(pw / canvasSize.w, ph / canvasSize.h, 2);
    setZoom(Math.max(0.05, z));
    setPan({ x:0, y:0 });
  }, [canvasSize]);

  // ─── History ───────────────────────────────────────────────────
  const updateHistState = useCallback(() => {
    setCanUndo(histIdxRef.current > 0);
    setCanRedo(histIdxRef.current < historyRef.current.length - 1);
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const slice = historyRef.current.slice(0, histIdxRef.current + 1);
    slice.push(canvas.toDataURL());
    if (slice.length > MAX_HISTORY) slice.shift();
    historyRef.current = slice;
    histIdxRef.current = slice.length - 1;
    updateHistState();
  }, [updateHistState]);

  const restoreHistory = useCallback((idx: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    const src = historyRef.current[idx];
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
      ctx.drawImage(img, 0, 0, canvasSize.w, canvasSize.h);
      histIdxRef.current = idx;
      updateHistState();
    };
    img.src = src;
  }, [getCtx, canvasSize, updateHistState]);

  const undo = useCallback(() => {
    if (histIdxRef.current > 0) { restoreHistory(histIdxRef.current - 1); showToast("Undo","info"); }
  }, [restoreHistory]);

  const redo = useCallback(() => {
    if (histIdxRef.current < historyRef.current.length - 1) { restoreHistory(histIdxRef.current + 1); showToast("Redo","info"); }
  }, [restoreHistory]);

  // ─── Toast ─────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: "info"|"success"|"warn" = "info") => {
    setToast(msg); setToastType(type);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  }, []);

  // ─── Clear / Fill ──────────────────────────────────────────────
  const clearCanvas = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
    pushHistory();
    showToast("Canvas cleared","warn");
  }, [getCtx, bgColor, canvasSize, pushHistory, showToast]);

  const fillBackground = useCallback((c: string) => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
    pushHistory();
  }, [getCtx, canvasSize, pushHistory]);

  // ─── Coordinates ──────────────────────────────────────────────
  const snapV = useCallback((v: Vec2): Vec2 => {
    if (!snapToGrid) return v;
    return { x: Math.round(v.x / gridSize) * gridSize, y: Math.round(v.y / gridSize) * gridSize };
  }, [snapToGrid, gridSize]);

  const getPos = useCallback((e: PointerEvent<HTMLCanvasElement>): Vec2 => {
    const canvas = canvasRef.current;
    if (!canvas) return { x:0, y:0 };
    const rect = canvas.getBoundingClientRect();
    const sx = canvasSize.w / rect.width;
    const sy = canvasSize.h / rect.height;
    return snapV({
      x: Math.max(0, Math.min(canvasSize.w, (e.clientX - rect.left) * sx)),
      y: Math.max(0, Math.min(canvasSize.h, (e.clientY - rect.top)  * sy)),
    });
  }, [canvasSize, snapV]);

  // ─── Style application ─────────────────────────────────────────
  const applyStyle = useCallback((ctx: CanvasRenderingContext2D, isEraser: boolean, pressure = 1) => {
    const size = pressureSimulation ? brushSize * (0.3 + pressure * 0.7) : brushSize;
    ctx.globalAlpha = (opacity / 100);
    ctx.globalCompositeOperation = isEraser ? "destination-out" : (blendMode as GlobalCompositeOperation);
    ctx.lineWidth = size;
    ctx.lineCap   = brushShape === "square" ? "square" : "round";
    ctx.lineJoin  = "round";
    ctx.strokeStyle = isEraser ? "rgba(0,0,0,1)" : color;
    ctx.fillStyle   = color;
    // Brush hardness via shadow blur for soft brush
    if (!isEraser && brushHardness < 100 && tool === "brush") {
      ctx.shadowColor = color;
      ctx.shadowBlur  = (brushSize * (100 - brushHardness)) / 50;
    } else {
      ctx.shadowBlur = 0;
    }
  }, [opacity, blendMode, brushShape, color, brushSize, brushHardness, pressureSimulation, tool]);

  // ─── Hex helpers ──────────────────────────────────────────────
  const hexToRgb = useCallback((hex: string): [number,number,number,number] => {
    const h = hex.replace("#","");
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 255];
  }, []);

  // ─── Spray ────────────────────────────────────────────────────
  const sprayPaint = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const r = brushSize * 2;
    const density = Math.ceil(r * 2);
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = Math.sqrt(Math.random()) * r;
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;
      ctx.globalAlpha = (opacity / 100) * (Math.random() * 0.5 + 0.1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, Math.random() * 1.2 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [brushSize, opacity, color]);

  // ─── Bucket fill ──────────────────────────────────────────────
  const bucketFill = useCallback((x: number, y: number) => {
    const ctx = getCtx();
    if (!ctx) return;
    const W = canvasSize.w, H = canvasSize.h;
    const imgData = ctx.getImageData(0, 0, W, H);
    const d = imgData.data;
    const px = Math.floor(x), py = Math.floor(y);
    const i0 = (py * W + px) * 4;
    const [tr, tg, tb, ta] = [d[i0], d[i0+1], d[i0+2], d[i0+3]];
    const [fr, fg, fb] = hexToRgb(color);
    if (tr===fr && tg===fg && tb===fb) return;
    const queue: number[] = [i0 / 4 | 0];
    const visited = new Uint8Array(W * H);
    const tol = 30;
    visited[py * W + px] = 1;
    while (queue.length) {
      const k = queue.pop()!;
      const cx = k % W, cy = k / W | 0;
      if (cx<0||cx>=W||cy<0||cy>=H) continue;
      const i = k * 4;
      if (Math.abs(d[i]-tr)>tol||Math.abs(d[i+1]-tg)>tol||Math.abs(d[i+2]-tb)>tol||Math.abs(d[i+3]-ta)>tol) continue;
      d[i]=fr; d[i+1]=fg; d[i+2]=fb; d[i+3]=Math.round(opacity/100*255);
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx=cx+dx, ny=cy+dy;
        if (nx>=0&&nx<W&&ny>=0&&ny<H) {
          const nk = ny*W+nx;
          if (!visited[nk]) { visited[nk]=1; queue.push(nk); }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [getCtx, canvasSize, color, opacity, hexToRgb]);

  // ─── Symmetry ─────────────────────────────────────────────────
  const drawWithSymmetry = useCallback((
    fn: (ctx: CanvasRenderingContext2D, x: number, y: number) => void,
    ctx: CanvasRenderingContext2D, x: number, y: number
  ) => {
    fn(ctx, x, y);
    const W = canvasSize.w, H = canvasSize.h;
    if (symmetry === "horizontal" || symmetry === "both") fn(ctx, W - x, y);
    if (symmetry === "vertical"   || symmetry === "both") fn(ctx, x, H - y);
    if (symmetry === "both")                              fn(ctx, W - x, H - y);
  }, [symmetry, canvasSize]);

  // ─── Star shape helper ─────────────────────────────────────────
  const starPath = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
    const pts = 5, inner = r * 0.4;
    ctx.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const angle = (i * Math.PI) / pts - Math.PI / 2;
      const rad = i % 2 === 0 ? r : inner;
      const fx = cx + Math.cos(angle) * rad;
      const fy = cy + Math.sin(angle) * rad;
      i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
    }
    ctx.closePath();
  }, []);

  // ─── Shape drawing ────────────────────────────────────────────
  const SHAPE_TOOLS = useMemo(() => new Set(["line","rectangle","circle","triangle","diamond","arrow","star","crop"]), []);

  const drawShape = useCallback((
    ctx: CanvasRenderingContext2D,
    sx: number, sy: number, ex: number, ey: number,
    restore: boolean
  ) => {
    if (restore && snapshotRef.current) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.restore();
    }
    if (tool === "crop") {
      // Show selection rect on overlay
      const octx = getOverCtx();
      if (!octx) return;
      octx.clearRect(0, 0, canvasSize.w, canvasSize.h);
      octx.setLineDash([6, 3]);
      octx.strokeStyle = "#06b6d4";
      octx.lineWidth = 1.5;
      octx.strokeRect(sx, sy, ex-sx, ey-sy);
      octx.setLineDash([]);
      return;
    }
    applyStyle(ctx, false);
    const doS = fillType === "stroke" || fillType === "both";
    const doF = fillType === "fill"   || fillType === "both";
    ctx.beginPath();
    if (tool === "line") {
      ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    } else if (tool === "rectangle") {
      const rx = Math.min(sx,ex), ry = Math.min(sy,ey);
      const rw = Math.abs(ex-sx), rh = Math.abs(ey-sy);
      ctx.rect(rx, ry, rw, rh);
      if (doF) ctx.fill(); if (doS) ctx.stroke();
    } else if (tool === "circle") {
      ctx.arc(sx, sy, Math.hypot(ex-sx, ey-sy), 0, Math.PI*2);
      if (doF) ctx.fill(); if (doS) ctx.stroke();
    } else if (tool === "triangle") {
      ctx.moveTo(sx+(ex-sx)/2, sy); ctx.lineTo(ex, ey); ctx.lineTo(sx, ey); ctx.closePath();
      if (doF) ctx.fill(); if (doS) ctx.stroke();
    } else if (tool === "diamond") {
      const mx=(sx+ex)/2, my=(sy+ey)/2;
      ctx.moveTo(mx,sy); ctx.lineTo(ex,my); ctx.lineTo(mx,ey); ctx.lineTo(sx,my); ctx.closePath();
      if (doF) ctx.fill(); if (doS) ctx.stroke();
    } else if (tool === "star") {
      const cx=(sx+ex)/2, cy=(sy+ey)/2;
      starPath(ctx, cx, cy, Math.hypot(ex-sx, ey-sy)/2);
      if (doF) ctx.fill(); if (doS) ctx.stroke();
    } else if (tool === "arrow") {
      const ang = Math.atan2(ey-sy, ex-sx);
      const hs = brushSize * 4;
      ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - hs*Math.cos(ang-Math.PI/6), ey - hs*Math.sin(ang-Math.PI/6));
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - hs*Math.cos(ang+Math.PI/6), ey - hs*Math.sin(ang+Math.PI/6));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }, [tool, fillType, applyStyle, brushSize, starPath, getOverCtx, canvasSize]);

  // ─── Text drawing ─────────────────────────────────────────────
  const commitText = useCallback(() => {
    if (!textPos || !textInput.trim()) { setTextPos(null); setTextInput(""); return; }
    const ctx = getCtx();
    if (!ctx) return;
    ctx.globalAlpha = opacity / 100;
    ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillText(textInput, textPos.x, textPos.y);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    setTextPos(null);
    setTextInput("");
    pushHistory();
  }, [textPos, textInput, getCtx, opacity, blendMode, color, fontSize, fontFamily, pushHistory]);

  // ─── Pointer down ─────────────────────────────────────────────
  const onPointerDown = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    if (e.buttons === 4 || (e.buttons === 1 && e.altKey)) { // middle mouse or alt+click = pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    isDrawingRef.current = true;
    startRef.current = pos;
    lastRef.current   = pos;
    snapshotRef.current = ctx.getImageData(0, 0, canvasSize.w, canvasSize.h);
    setLineSmoothing([pos]);

    if (tool === "pen" || tool === "brush" || tool === "eraser") {
      const isErase = tool === "eraser";
      applyStyle(ctx, isErase, e.pressure || 1);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize/2, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else if (tool === "spray") {
      sprayPaint(ctx, pos.x, pos.y);
      sprayTimer.current = setInterval(() => {
        if (isDrawingRef.current && lastRef.current) sprayPaint(ctx, lastRef.current.x, lastRef.current.y);
      }, 30);
    } else if (tool === "bucket") {
      bucketFill(pos.x, pos.y);
      pushHistory();
      isDrawingRef.current = false;
      showToast("Fill applied","success");
    } else if (tool === "eyedropper") {
      const d = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
      const hex = "#" + [d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,"0")).join("");
      setColor(hex);
      isDrawingRef.current = false;
      showToast("Picked: " + hex.toUpperCase(),"success");
    } else if (tool === "text") {
      setTextPos(pos);
      setTextInput("");
      isDrawingRef.current = false;
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  }, [getCtx, getPos, tool, applyStyle, brushSize, sprayPaint, bucketFill, pushHistory, showToast, pan]);

  // ─── Pointer move ─────────────────────────────────────────────
  const onPointerMove = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    setMouseCoords({ x: Math.round(pos.x), y: Math.round(pos.y) });
    setCursorPos({ x: e.clientX, y: e.clientY, visible: true });

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (!isDrawingRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;

    if (tool === "pen" || tool === "brush" || tool === "eraser") {
      const isErase = tool === "eraser";
      applyStyle(ctx, isErase, e.pressure || 1);
      if (smoothing) {
        setLineSmoothing(prev => {
          const pts = [...prev, pos].slice(-4);
          if (pts.length >= 2) {
            const [p0, p1] = pts.slice(-2);
            ctx.lineTo((p0.x+p1.x)/2, (p0.y+p1.y)/2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo((p0.x+p1.x)/2, (p0.y+p1.y)/2);
          }
          return pts;
        });
      } else {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
      // Symmetry
      if (symmetry !== "none" && snapshotRef.current) {
        const W = canvasSize.w, H = canvasSize.h;
        const pts: Vec2[] = [];
        if (symmetry === "horizontal" || symmetry === "both") pts.push({ x: W-pos.x, y: pos.y });
        if (symmetry === "vertical"   || symmetry === "both") pts.push({ x: pos.x, y: H-pos.y });
        if (symmetry === "both")                              pts.push({ x: W-pos.x, y: H-pos.y });
        for (const p of pts) {
          applyStyle(ctx, isErase, e.pressure || 1);
          ctx.beginPath(); ctx.arc(p.x, p.y, brushSize/2, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.moveTo(p.x, p.y);
          if (lastRef.current) { ctx.lineTo(p.x, p.y); ctx.stroke(); }
        }
      }
    } else if (tool === "spray") {
      sprayPaint(ctx, pos.x, pos.y);
    } else if (SHAPE_TOOLS.has(tool)) {
      if (!startRef.current) return;
      drawShape(ctx, startRef.current.x, startRef.current.y, pos.x, pos.y, true);
    }
    lastRef.current = pos;
  }, [getPos, isPanning, panStart, getCtx, tool, applyStyle, smoothing, symmetry, sprayPaint, drawShape, SHAPE_TOOLS, canvasSize, brushSize]);

  // ─── Pointer up ───────────────────────────────────────────────
  const onPointerUp = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) { setIsPanning(false); return; }
    if (!isDrawingRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);

    if (SHAPE_TOOLS.has(tool) && tool !== "crop") {
      if (startRef.current) drawShape(ctx, startRef.current.x, startRef.current.y, pos.x, pos.y, true);
    }
    if (tool === "crop" && startRef.current) {
      setSelectionRect({ x: Math.min(startRef.current.x, pos.x), y: Math.min(startRef.current.y, pos.y), w: Math.abs(pos.x - startRef.current.x), h: Math.abs(pos.y - startRef.current.y) });
      const octx = getOverCtx();
      if (octx) octx.clearRect(0, 0, canvasSize.w, canvasSize.h);
    }
    if (tool === "pen" || tool === "brush" || tool === "eraser") ctx.closePath();
    if (sprayTimer.current) { clearInterval(sprayTimer.current); sprayTimer.current = null; }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    isDrawingRef.current = false;
    snapshotRef.current  = null;
    startRef.current     = null;
    lastRef.current      = null;
    setLineSmoothing([]);
    pushHistory();
  }, [isPanning, getCtx, getPos, tool, drawShape, SHAPE_TOOLS, getOverCtx, canvasSize, pushHistory]);

  const onPointerLeave = useCallback(() => {
    setCursorPos(p => ({ ...p, visible:false }));
    if (isPanning) { setIsPanning(false); return; }
    if (isDrawingRef.current) {
      const ctx = getCtx();
      if (ctx) { ctx.globalAlpha=1; ctx.shadowBlur=0; ctx.globalCompositeOperation="source-over"; ctx.closePath(); }
      if (sprayTimer.current) { clearInterval(sprayTimer.current); sprayTimer.current = null; }
      isDrawingRef.current = false;
      pushHistory();
    }
  }, [isPanning, getCtx, pushHistory]);

  // ─── Wheel zoom / pan ─────────────────────────────────────────
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY < 0 ? 1.12 : 0.9;
      setZoom(z => Math.max(0.05, Math.min(20, z * delta)));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  // ─── Export ───────────────────────────────────────────────────
  const downloadAs = useCallback((fmt: "png"|"jpg"|"webp") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    const mime = fmt === "jpg" ? "image/jpeg" : fmt === "webp" ? "image/webp" : "image/png";
    a.href = canvas.toDataURL(mime, 0.92);
    a.download = (title.trim().replace(/[^a-z0-9]/gi,"_")||"canvas") + "." + fmt;
    a.click();
    showToast(`Downloaded as .${fmt}`,"success");
  }, [title, showToast]);

  const copyToClipboard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      navigator.clipboard.write([new ClipboardItem({"image/png": blob})]).then(() => showToast("Copied to clipboard","success"));
    });
  }, [showToast]);

  // ─── Canvas resize ────────────────────────────────────────────
  const applyCanvasPreset = useCallback((w: number, h: number) => {
    setCanvasSize({ w, h });
    // Re-init will happen via effect
    showToast(`Canvas: ${w}×${h}`,"info");
    setShowPresets(false);
  }, [showToast]);

  useEffect(() => {
    initCanvas(canvasSize.w, canvasSize.h);
    setTimeout(() => { fitToWindow(); pushHistory(); }, 80);
  }, [canvasSize]); // eslint-disable-line

  // ─── Keyboard shortcuts ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (k==="z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
        if (k==="y") { e.preventDefault(); redo(); }
        if (k==="s") { e.preventDefault(); downloadAs("png"); }
        if (k==="c") { e.preventDefault(); copyToClipboard(); }
        return;
      }
      const map: Record<string,string> = {
        p:"pen",b:"bucket",e:"eraser",l:"line",r:"rectangle",c:"circle",
        t:"triangle",d:"diamond",a:"arrow",s:"spray",i:"eyedropper",x:"text",m:"crop",
        v:"brush", // v for brush (b taken by bucket)
      };
      if (map[k]) setTool(map[k]);
      if (k==="["||k===",") setBrushSize(s=>Math.max(1,s-2));
      if (k==="]"||k===".") setBrushSize(s=>Math.min(200,s+2));
      if (k==="="||k==="+") setZoom(z=>Math.min(20,z+0.1));
      if (k==="-") setZoom(z=>Math.max(0.05,z-0.1));
      if (k==="0") fitToWindow();
      if (k==="g") setShowGrid(g=>!g);
      if (k==="escape") { setTextPos(null); setTextInput(""); setSelectionRect(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, downloadAs, copyToClipboard, fitToWindow]);

  // ─── Wheel listener ───────────────────────────────────────────
  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    wrap.addEventListener("wheel", onWheel, { passive:false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  useEffect(() => {
    const ro = new ResizeObserver(fitToWindow);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [fitToWindow]);

  // ─── Initial setup ────────────────────────────────────────────
  useEffect(() => {
    initCanvas();
    setTimeout(() => { fitToWindow(); pushHistory(); }, 100);
  }, []); // eslint-disable-line

  // ─── Cursor size ──────────────────────────────────────────────
  const cursorSize = Math.max(4, brushSize * zoom * 2);
  const cursorLabel = tool !== "pen" && tool !== "brush" && tool !== "eraser" && tool !== "spray";

  // ─── Theme ───────────────────────────────────────────────────
  const T = darkMode ? DARK : LIGHT;

  // ─── Active tool label ────────────────────────────────────────
  const activeTool = TOOLS.find(t => t && t.id === tool) as ToolDef | undefined;

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div style={{ ...S.root, background: T.bg, color: T.text, fontFamily: "'DM Mono', 'Fira Code', monospace" }}>

      {/* ══ TOPBAR ══════════════════════════════════════════════ */}
      <header style={{ ...S.topbar, background: T.surface, borderBottomColor: T.border }}>
        {/* Logo */}
        <div style={S.logo}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isMobile && <span style={{ fontSize:11, fontWeight:700, color:T.muted, letterSpacing:"0.12em", textTransform:"uppercase" }}>Studio</span>}
        </div>
        <div style={{ ...S.tbSep, background:T.border }} />

        {/* Title */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ ...S.titleInput, background:"transparent", border:"none", color:T.text, flex: isMobile?"1":"0 0 auto", minWidth:80, maxWidth:160 }}
        />
        <div style={{ ...S.tbSep, background:T.border }} />

        {/* History */}
        <TbButton onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" T={T}><UndoIcon /></TbButton>
        <TbButton onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" T={T}><RedoIcon /></TbButton>
        <div style={{ ...S.tbSep, background:T.border }} />

        {/* Zoom */}
        {!isMobile && <>
          <TbButton onClick={() => setZoom(z=>Math.max(0.05,z-0.1))} T={T}>−</TbButton>
          <span style={{ fontSize:10, color:T.muted, minWidth:42, textAlign:"center" }}>{Math.round(zoom*100)}%</span>
          <TbButton onClick={() => setZoom(z=>Math.min(20,z+0.1))} T={T}>+</TbButton>
          <TbButton onClick={fitToWindow} T={T} title="Fit to window [0]">Fit</TbButton>
          <div style={{ ...S.tbSep, background:T.border }} />
        </>}

        {/* Shape fill mode */}
        {!isMobile && SHAPE_TOOLS.has(tool) && (
          <>
            {(["stroke","fill","both"] as const).map(ft => (
              <TbButton key={ft} onClick={() => setFillType(ft)} active={fillType===ft} T={T} style={{ fontSize:9, padding:"3px 7px" }}>
                {ft}
              </TbButton>
            ))}
            <div style={{ ...S.tbSep, background:T.border }} />
          </>
        )}

        <div style={{ flex:1 }} />

        {/* Grid toggle */}
        <TbButton onClick={() => setShowGrid(g=>!g)} active={showGrid} T={T} title="Grid [G]">
          <GridIcon />
        </TbButton>

        {/* Theme */}
        <TbButton onClick={() => setDarkMode(d=>!d)} T={T} title="Toggle theme">
          {darkMode ? "☀" : "☾"}
        </TbButton>

        <div style={{ ...S.tbSep, background:T.border }} />

        {/* Export */}
        {!isMobile && <>
          <TbButton onClick={() => downloadAs("png")} T={T} title="Download PNG (Ctrl+S)">PNG</TbButton>
          <TbButton onClick={() => downloadAs("jpg")} T={T}>JPG</TbButton>
          <TbButton onClick={copyToClipboard} T={T} title="Copy to clipboard (Ctrl+C)"><CopyIcon /></TbButton>
        </>}
        <TbButton onClick={clearCanvas} T={T} style={{ color:"#f87171", borderColor:"#7f1d1d44" }}>Clear</TbButton>

        {/* Mobile: toggle tools panel */}
        {isMobile && (
          <TbButton onClick={() => setShowMobileTools(p=>!p)} active={showMobileTools} T={T}>Tools</TbButton>
        )}
      </header>

      {/* ══ WORKSPACE ════════════════════════════════════════════ */}
      <div style={S.workspace}>

        {/* ── LEFT TOOLBAR ── */}
        {(!isMobile || showMobileTools) && (
          <nav style={{
            ...S.sidebar,
            background: T.surface,
            borderColor: T.border,
            ...(isMobile ? { position:"fixed", top:44, left:0, right:0, zIndex:50, flexDirection:"row", flexWrap:"wrap", width:"100%", height:"auto", maxHeight:180, overflowY:"auto", padding:"6px", gap:2 } : {}),
          }}>
            {TOOLS.map((t, i) => t === null
              ? <div key={`sep-${i}`} style={{ ...S.sideDiv, background:T.border, ...(isMobile ? {width:1, height:32, margin:"0 2px"} : {}) }} />
              : (
                <button
                  key={t.id}
                  onClick={() => { setTool(t.id); if(isMobile) setShowMobileTools(false); }}
                  title={`${t.label} [${t.key}]`}
                  style={{
                    ...S.toolBtn,
                    background: tool===t.id ? "#7c3aed22" : "transparent",
                    borderColor: tool===t.id ? "#7c3aed" : "transparent",
                    color: tool===t.id ? "#a78bfa" : T.icon,
                  }}
                >
                  {t.icon}
                  {isMobile && <span style={{ fontSize:8, marginTop:1, color:"inherit" }}>{t.label}</span>}
                </button>
              )
            )}
            {isMobile && (
              <div style={{ width:"100%", display:"flex", gap:4, padding:"4px 0", flexWrap:"wrap" }}>
                <span style={{ fontSize:9, color:T.muted, alignSelf:"center", marginRight:4 }}>SIZE</span>
                {[4,8,16,32].map(s => (
                  <button key={s} onClick={() => setBrushSize(s)}
                    style={{ ...S.toolBtn, width:32, height:26, fontSize:9, background: brushSize===s?"#7c3aed22":"transparent", borderColor: brushSize===s?"#7c3aed":"transparent", color: brushSize===s?"#a78bfa":T.icon }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </nav>
        )}

        {/* ── CANVAS AREA ── */}
        <div
          ref={wrapperRef}
          style={{
            ...S.canvasArea,
            background: T.canvasBg,
            cursor: isPanning ? "grabbing" : "none",
          }}
        >
          {/* Decorative bg pattern */}
          <div style={{ position:"absolute", inset:0, backgroundImage:`radial-gradient(circle at 1px 1px, ${T.gridDot} 1px, transparent 0)`, backgroundSize:"24px 24px", opacity:0.4, pointerEvents:"none" }} />

          {/* Canvas container */}
          <div style={{
            position: "absolute",
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            transformOrigin: "center center",
            top: "50%", left: "50%",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 32px 80px rgba(0,0,0,0.6), 0 0 0 100vmax rgba(0,0,0,0.25)",
          }}>
            <canvas ref={canvasRef} style={{ display:"block", touchAction:"none" }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove}
              onPointerUp={onPointerUp} onPointerLeave={onPointerLeave} />
            <canvas ref={overlayRef} style={{ position:"absolute", top:0, left:0, pointerEvents:"none" }} />
            {showGrid && <GridOverlay W={canvasSize.w} H={canvasSize.h} gridSize={gridSize} />}
          </div>

          {/* Text input overlay */}
          {textPos && (
            <div style={{
              position:"absolute",
              left: `calc(50% + ${pan.x}px + ${textPos.x * zoom - canvasSize.w*zoom/2}px)`,
              top:  `calc(50% + ${pan.y}px + ${textPos.y * zoom - canvasSize.h*zoom/2}px)`,
              zIndex:10,
            }}>
              <input
                ref={textInputRef}
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") commitText(); if(e.key==="Escape") {setTextPos(null);setTextInput("");} }}
                onBlur={commitText}
                placeholder="Type & press Enter"
                style={{
                  background:"rgba(10,10,20,0.85)",
                  border:"1.5px dashed #7c3aed",
                  borderRadius:4,
                  color: color,
                  fontSize: fontSize * zoom + "px",
                  fontFamily,
                  padding:"2px 6px",
                  outline:"none",
                  minWidth:80,
                  backdropFilter:"blur(8px)",
                }}
              />
            </div>
          )}

          {/* Custom cursor */}
          {cursorPos.visible && !isPanning && (
            <div style={{
              position:"fixed",
              left: cursorPos.x, top: cursorPos.y,
              width: cursorLabel ? undefined : cursorSize,
              height: cursorLabel ? undefined : cursorSize,
              borderRadius: brushShape==="square" ? "3px" : "50%",
              border: cursorLabel ? undefined : `1.5px solid ${tool==="eraser" ? "#f87171" : color}88`,
              transform: "translate(-50%,-50%)",
              pointerEvents:"none",
              zIndex:9999,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
            }}>
              {cursorLabel && (
                <span style={{ fontSize:11, color:"#a78bfa", background:"rgba(10,10,20,0.7)", padding:"2px 4px", borderRadius:3, whiteSpace:"nowrap" }}>
                  {activeTool?.icon}
                </span>
              )}
            </div>
          )}

          {/* Status bar */}
          <div style={{ ...S.statusBar, background:T.statusBg, borderTopColor:T.border }}>
            <StatusItem label="pos"    val={`${mouseCoords.x}, ${mouseCoords.y}`} T={T} />
            <StatusItem label="size"   val={`${canvasSize.w}×${canvasSize.h}`} T={T} />
            <StatusItem label="zoom"   val={`${Math.round(zoom*100)}%`} T={T} />
            <StatusItem label="brush"  val={`${brushSize}px`} T={T} />
            <StatusItem label="tool"   val={tool} T={T} />
            {!isMobile && <StatusItem label="opacity" val={`${opacity}%`} T={T} />}
            {!isMobile && symmetry !== "none" && <StatusItem label="mirror" val={symmetry} T={T} />}
          </div>

          {/* Zoom mini controls (bottom right) */}
          {!isMobile && (
            <div style={{ position:"absolute", bottom:30, right:12, display:"flex", gap:4, alignItems:"center" }}>
              <MiniBtn onClick={() => setZoom(z=>Math.max(0.05,z-0.15))} T={T}>−</MiniBtn>
              <MiniBtn onClick={fitToWindow} T={T} style={{ fontSize:8, padding:"3px 5px" }}>FIT</MiniBtn>
              <MiniBtn onClick={() => setZoom(z=>Math.min(20,z+0.15))} T={T}>+</MiniBtn>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        {!isMobile && (
          <aside style={{ ...S.rightPanel, background:T.surface, borderLeftColor:T.border }}>
            {/* Tabs */}
            <div style={{ display:"flex", borderBottom:`1px solid ${T.border}` }}>
              {(["color","brush","canvas"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveRightTab(tab)} style={{
                  flex:1, padding:"7px 4px", fontSize:9, textTransform:"uppercase",
                  letterSpacing:"0.08em", background:"transparent", border:"none",
                  cursor:"pointer", fontFamily:"inherit",
                  color: activeRightTab===tab ? "#a78bfa" : T.muted,
                  borderBottom: activeRightTab===tab ? "2px solid #7c3aed" : "2px solid transparent",
                  transition:"all .15s",
                }}>
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"10px 10px 60px" }}>

              {/* ── COLOR TAB ── */}
              {activeRightTab === "color" && (
                <div>
                  {/* Active swatches */}
                  <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
                    <div style={{ position:"relative" }}>
                      <div style={{ ...S.bigSwatch, background:secColor, position:"absolute", top:6, left:6 }} />
                      <div style={{ ...S.bigSwatch, background:color, position:"relative", cursor:"pointer" }}
                        onClick={() => { (document.getElementById("_cp") as HTMLInputElement)?.click(); }} />
                      <input id="_cp" type="color" value={color} onChange={e=>setColor(e.target.value)}
                        style={{ width:0, height:0, opacity:0, position:"absolute" }} />
                    </div>
                    <button onClick={() => { const t=color; setColor(secColor); setSecColor(t); }}
                      style={{ ...S.miniChip, background:T.chip, borderColor:T.border, color:T.muted, marginLeft:4 }}>⇄</button>
                  </div>

                  <input
                    value={color}
                    onChange={e => { if(/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setColor(e.target.value); }}
                    style={{ ...S.hexInput, background:T.input, borderColor:T.border, color:T.text, marginBottom:10 }}
                    maxLength={7}
                  />

                  <div style={S.rpLabel(T)}>PALETTE</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:3, marginBottom:8 }}>
                    {SWATCHES.map(c => (
                      <button key={c} onClick={() => setColor(c)} style={{
                        width:"100%", aspectRatio:"1", borderRadius:4, border:"none",
                        background:c, cursor:"pointer",
                        outline: color===c ? "2px solid #fff" : "none",
                        outlineOffset:1,
                        transform: color===c ? "scale(1.15)" : "scale(1)",
                        transition:"all .12s",
                      }} />
                    ))}
                  </div>

                  <div style={S.rpLabel(T)}>OPACITY</div>
                  <input type="range" min={5} max={100} value={opacity}
                    onChange={e => setOpacity(+e.target.value)}
                    style={{ ...S.slider, accentColor:"#7c3aed" }} />
                  <div style={{ fontSize:9, color:T.muted, textAlign:"right" }}>{opacity}%</div>

                  <div style={S.rpLabel(T)}>BLEND MODE</div>
                  <select value={blendMode} onChange={e => setBlendMode(e.target.value)}
                    style={{ ...S.select, background:T.input, color:T.text, borderColor:T.border }}>
                    {BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}

              {/* ── BRUSH TAB ── */}
              {activeRightTab === "brush" && (
                <div>
                  {/* Preview */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:60, marginBottom:8 }}>
                    <div style={{
                      width: Math.min(56, brushSize*1.5+4),
                      height: Math.min(56, brushSize*1.5+4),
                      borderRadius: brushShape==="square" ? 4 : "50%",
                      background: color,
                      opacity: brushHardness/100 * 0.5 + 0.5,
                      filter: brushHardness < 80 ? `blur(${(80-brushHardness)/20}px)` : undefined,
                      transition:"all .15s",
                    }} />
                  </div>

                  <div style={S.rpLabel(T)}>SIZE: {brushSize}px</div>
                  <input type="range" min={1} max={200} value={brushSize}
                    onChange={e => setBrushSize(+e.target.value)}
                    style={{ ...S.slider, accentColor:"#7c3aed" }} />

                  <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:8 }}>
                    {[1,2,4,6,8,12,16,24,32,48].map(s => (
                      <button key={s} onClick={() => setBrushSize(s)} style={{
                        ...S.miniChip, background: brushSize===s?"#7c3aed22":T.chip,
                        borderColor: brushSize===s?"#7c3aed":T.border,
                        color: brushSize===s?"#a78bfa":T.muted, fontSize:9,
                      }}>{s}</button>
                    ))}
                  </div>

                  <div style={S.rpLabel(T)}>HARDNESS: {brushHardness}%</div>
                  <input type="range" min={0} max={100} value={brushHardness}
                    onChange={e => setBrushHardness(+e.target.value)}
                    style={{ ...S.slider, accentColor:"#7c3aed" }} />

                  <div style={S.rpLabel(T)}>SHAPE</div>
                  <div style={{ display:"flex", gap:4, marginBottom:10 }}>
                    {(["round","square"] as const).map(sh => (
                      <button key={sh} onClick={() => setBrushShape(sh)} style={{
                        ...S.miniChip, flex:1,
                        background: brushShape===sh?"#7c3aed22":T.chip,
                        borderColor: brushShape===sh?"#7c3aed":T.border,
                        color: brushShape===sh?"#a78bfa":T.muted,
                      }}>{sh}</button>
                    ))}
                  </div>

                  <div style={S.rpLabel(T)}>OPTIONS</div>
                  <label style={S.toggle(T)}>
                    <span>Smoothing</span>
                    <input type="checkbox" checked={smoothing} onChange={e=>setSmoothing(e.target.checked)} />
                  </label>
                  <label style={S.toggle(T)}>
                    <span>Pressure sim</span>
                    <input type="checkbox" checked={pressureSimulation} onChange={e=>setPressureSimulation(e.target.checked)} />
                  </label>

                  <div style={S.rpLabel(T)}>SYMMETRY</div>
                  <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                    {(["none","horizontal","vertical","both"] as const).map(sym => (
                      <button key={sym} onClick={() => setSymmetry(sym)} style={{
                        ...S.miniChip, fontSize:8,
                        background: symmetry===sym?"#7c3aed22":T.chip,
                        borderColor: symmetry===sym?"#7c3aed":T.border,
                        color: symmetry===sym?"#a78bfa":T.muted,
                      }}>{sym}</button>
                    ))}
                  </div>

                  {tool === "text" && (
                    <>
                      <div style={S.rpLabel(T)}>TEXT SIZE: {fontSize}px</div>
                      <input type="range" min={8} max={200} value={fontSize}
                        onChange={e => setFontSize(+e.target.value)}
                        style={{ ...S.slider, accentColor:"#7c3aed" }} />
                      <div style={S.rpLabel(T)}>FONT</div>
                      <select value={fontFamily} onChange={e=>setFontFamily(e.target.value)}
                        style={{ ...S.select, background:T.input, color:T.text, borderColor:T.border }}>
                        {["sans-serif","serif","monospace","cursive","fantasy","Georgia","Verdana","Arial"].map(f=>(
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}

              {/* ── CANVAS TAB ── */}
              {activeRightTab === "canvas" && (
                <div>
                  <div style={S.rpLabel(T)}>SIZE</div>
                  <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:8, color:T.muted, marginBottom:3 }}>W</div>
                      <input type="number" value={canvasSize.w}
                        onChange={e => setCanvasSize(s=>({...s, w:Math.max(100,+e.target.value)}))}
                        style={{ ...S.numInput, background:T.input, borderColor:T.border, color:T.text }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:8, color:T.muted, marginBottom:3 }}>H</div>
                      <input type="number" value={canvasSize.h}
                        onChange={e => setCanvasSize(s=>({...s, h:Math.max(100,+e.target.value)}))}
                        style={{ ...S.numInput, background:T.input, borderColor:T.border, color:T.text }} />
                    </div>
                  </div>
                  <button onClick={() => applyCanvasPreset(canvasSize.w, canvasSize.h)}
                    style={{ ...S.applyBtn, background:"#7c3aed", color:"#fff", width:"100%", marginBottom:8 }}>
                    Apply Size
                  </button>

                  <div style={S.rpLabel(T)}>PRESETS</div>
                  {CANVAS_PRESETS.map(p => (
                    <button key={p.label} onClick={() => applyCanvasPreset(p.w, p.h)} style={{
                      ...S.presetRow, background:T.chip, borderColor:T.border, color:T.text,
                    }}>
                      <span>{p.label}</span>
                      <span style={{ color:T.muted, fontSize:9 }}>{p.w}×{p.h}</span>
                    </button>
                  ))}

                  <div style={S.rpLabel(T)}>BACKGROUND</div>
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:4, border:`1px solid ${T.border}`, background:bgColor, cursor:"pointer", flexShrink:0 }}
                      onClick={() => { (document.getElementById("_bg") as HTMLInputElement)?.click(); }} />
                    <input id="_bg" type="color" value={bgColor} onChange={e=>setBgColor(e.target.value)}
                      style={{ width:0, height:0, opacity:0, position:"absolute" }} />
                    <input value={bgColor} onChange={e => { if(/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setBgColor(e.target.value); }}
                      style={{ ...S.hexInput, background:T.input, borderColor:T.border, color:T.text, flex:1 }} />
                  </div>
                  <button onClick={() => fillBackground(bgColor)} style={{ ...S.applyBtn, background:T.chip, borderColor:T.border, color:T.text, width:"100%" }}>
                    Fill BG
                  </button>

                  <div style={S.rpLabel(T)}>GRID</div>
                  <label style={S.toggle(T)}>
                    <span>Show grid</span>
                    <input type="checkbox" checked={showGrid} onChange={e=>setShowGrid(e.target.checked)} />
                  </label>
                  <label style={S.toggle(T)}>
                    <span>Snap to grid</span>
                    <input type="checkbox" checked={snapToGrid} onChange={e=>setSnapToGrid(e.target.checked)} />
                  </label>
                  <div style={S.rpLabel(T)}>GRID SIZE: {gridSize}px</div>
                  <input type="range" min={10} max={100} value={gridSize}
                    onChange={e => setGridSize(+e.target.value)}
                    style={{ ...S.slider, accentColor:"#7c3aed" }} />

                  <div style={{ ...S.rpLabel(T), marginTop:12 }}>EXPORT</div>
                  {(["png","jpg","webp"] as const).map(fmt => (
                    <button key={fmt} onClick={() => downloadAs(fmt)} style={{
                      ...S.presetRow, background:T.chip, borderColor:T.border, color:T.text,
                      textTransform:"uppercase", fontSize:10,
                    }}>
                      Download .{fmt}
                      <span style={{ color:T.muted, fontSize:9 }}>
                        {fmt === "png" ? "Lossless" : fmt === "jpg" ? "Small size" : "Modern"}
                      </span>
                    </button>
                  ))}
                  <button onClick={copyToClipboard} style={{ ...S.presetRow, background:T.chip, borderColor:T.border, color:T.text }}>
                    Copy to Clipboard
                    <span style={{ color:T.muted, fontSize:9 }}>PNG</span>
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ══ TOAST ════════════════════════════════════════════════ */}
      {toast && (
        <div style={{
          ...S.toast,
          background: toastType==="warn" ? "#7f1d1d" : toastType==="success" ? "#14532d" : "#1e1e2e",
          borderColor: toastType==="warn" ? "#ef444444" : toastType==="success" ? "#22c55e44" : "#2d2d44",
        }}>{toast}</div>
      )}
    </div>
  );
}

// ─── Theme Tokens ─────────────────────────────────────────────────────────────
const DARK = {
  bg:"#080810", surface:"#0f0f1a", border:"#1a1a2e",
  text:"#e2e8f0", muted:"#4b5563", icon:"#6b7280",
  input:"#0d0d1a", chip:"#12121f", canvasBg:"#0a0a12",
  gridDot:"#1e1e3020", statusBg:"rgba(8,8,16,0.9)",
};
const LIGHT = {
  bg:"#f1f5f9", surface:"#ffffff", border:"#e2e8f0",
  text:"#0f172a", muted:"#94a3b8", icon:"#64748b",
  input:"#f8fafc", chip:"#f1f5f9", canvasBg:"#e2e8f0",
  gridDot:"#94a3b830", statusBg:"rgba(241,245,249,0.9)",
};
type Theme = typeof DARK;

// ─── Shared Styles ────────────────────────────────────────────────────────────
const S: Record<string, any> = {
  root: { display:"flex", flexDirection:"column", width:"100%", height:"100vh", overflow:"hidden", userSelect:"none" },
  topbar: { display:"flex", alignItems:"center", gap:4, padding:"0 8px", height:44, borderBottom:"1px solid", flexShrink:0, zIndex:20 },
  logo: { display:"flex", alignItems:"center", gap:6, flexShrink:0 },
  tbSep: { width:1, height:20, margin:"0 2px", flexShrink:0 },
  titleInput: { fontSize:11, fontFamily:"inherit", outline:"none", padding:"3px 6px" },
  workspace: { display:"flex", flex:1, overflow:"hidden" },
  sidebar: { width:52, display:"flex", flexDirection:"column", alignItems:"center", padding:"6px 0", gap:1, overflowY:"auto", flexShrink:0, borderRight:"1px solid" },
  sideDiv: { width:30, height:1, margin:"3px 0", flexShrink:0 },
  toolBtn: { width:38, height:38, border:"1px solid", borderRadius:6, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", transition:"all .1s", flexShrink:0, fontSize:9, gap:1 },
  canvasArea: { flex:1, position:"relative", overflow:"hidden" },
  statusBar: { position:"absolute", bottom:0, left:0, right:0, height:26, borderTop:"1px solid", display:"flex", alignItems:"center", padding:"0 10px", gap:16, pointerEvents:"none", zIndex:5, backdropFilter:"blur(8px)" },
  rightPanel: { width:200, display:"flex", flexDirection:"column", borderLeft:"1px solid", flexShrink:0, overflow:"hidden" },
  rpLabel: (T: Theme) => ({ fontSize:8, textTransform:"uppercase", letterSpacing:"0.1em", color:T.muted, marginTop:10, marginBottom:4 }),
  bigSwatch: { width:34, height:34, borderRadius:5, border:"1.5px solid rgba(255,255,255,0.1)", flexShrink:0 },
  hexInput: { width:"100%", border:"1px solid", borderRadius:4, fontSize:11, fontFamily:"inherit", padding:"5px 8px", outline:"none" },
  numInput: { width:"100%", border:"1px solid", borderRadius:4, fontSize:11, fontFamily:"inherit", padding:"5px 6px", outline:"none" },
  slider: { width:"100%", margin:"4px 0 2px" },
  select: { width:"100%", border:"1px solid", borderRadius:4, fontSize:10, fontFamily:"inherit", padding:"5px 6px", outline:"none", marginBottom:4 },
  miniChip: { border:"1px solid", borderRadius:4, fontSize:10, fontFamily:"inherit", padding:"4px 8px", cursor:"pointer", textAlign:"center" as const },
  toggle: (T: Theme) => ({ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:10, color:T.text, padding:"4px 0", cursor:"pointer" }),
  presetRow: { width:"100%", border:"1px solid", borderRadius:4, cursor:"pointer", fontFamily:"inherit", padding:"7px 8px", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:10, marginBottom:3, textAlign:"left" as const },
  applyBtn: { border:"1px solid", borderRadius:4, cursor:"pointer", fontFamily:"inherit", padding:"6px 8px", fontSize:10 },
  toast: { position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", border:"1px solid", fontSize:11, fontFamily:"inherit", padding:"8px 18px", borderRadius:20, pointerEvents:"none", zIndex:200, whiteSpace:"nowrap", boxShadow:"0 8px 24px rgba(0,0,0,0.5)" },
};

// ─── Mini Components ──────────────────────────────────────────────────────────
function TbButton({ onClick, disabled, title, children, active, T, style }: {
  onClick?: () => void; disabled?: boolean; title?: string;
  children: React.ReactNode; active?: boolean; T: Theme; style?: CSSProperties;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      background: active ? "#7c3aed22" : "transparent",
      border: `1px solid ${active ? "#7c3aed88" : "transparent"}`,
      color: active ? "#a78bfa" : T.muted,
      fontSize:10, fontFamily:"inherit", padding:"4px 7px", borderRadius:4,
      cursor: disabled ? "not-allowed" : "pointer",
      display:"flex", alignItems:"center", gap:3,
      opacity: disabled ? 0.3 : 1,
      flexShrink:0, whiteSpace:"nowrap",
      transition:"all .12s", ...style,
    }}>{children}</button>
  );
}

function MiniBtn({ onClick, children, T, style }: { onClick:()=>void; children:React.ReactNode; T:Theme; style?:CSSProperties }) {
  return (
    <button onClick={onClick} style={{ background:T.chip, border:`1px solid ${T.border}`, color:T.muted, fontSize:11, fontFamily:"inherit", width:22, height:22, borderRadius:4, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", ...style }}>
      {children}
    </button>
  );
}

function StatusItem({ label, val, T }: { label:string; val:string; T:Theme }) {
  return (
    <span style={{ display:"flex", gap:4, alignItems:"center" }}>
      <span style={{ fontSize:9, color:T.muted, textTransform:"uppercase" }}>{label}</span>
      <span style={{ fontSize:9, color:T.icon }}>{val}</span>
    </span>
  );
}

// ─── Grid Overlay ─────────────────────────────────────────────────────────────
function GridOverlay({ W, H, gridSize }: { W:number; H:number; gridSize:number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W+"px"; cv.style.height = H+"px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x=0;x<=W;x+=gridSize){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
    for (let y=0;y<=H;y+=gridSize){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke(); }
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    const big = gridSize * 5;
    for (let x=0;x<=W;x+=big){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
    for (let y=0;y<=H;y+=big){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke(); }
  }, [W, H, gridSize]);
  return <canvas ref={ref} style={{ position:"absolute", top:0, left:0, pointerEvents:"none" }} />;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PenIcon()       { return <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>; }
function BrushFatIcon()  { return <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l9.96-9.96a1 1 0 0 0 0-1.41z"/></svg>; }
function EraserIcon()    { return <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M20.71 4.63l-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l1.46-1.46 4.58 4.71H9v2h10l3.42-3.42a1 1 0 0 0 0-1.41zM9.75 9.75L3 16.5V21h4.5l6.75-6.75z"/></svg>; }
function SprayIcon()     { return <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><circle cx="8" cy="12" r="1.2"/><circle cx="12" cy="8" r="0.9"/><circle cx="15" cy="11" r="1.2"/><circle cx="11" cy="15" r="0.9"/><circle cx="6" cy="8" r="0.9"/><circle cx="16" cy="7" r="0.9"/><path d="M5 20h14v-2H5z"/></svg>; }
function BucketIcon()    { return <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15a1.49 1.49 0 0 0 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10 10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/></svg>; }
function LineIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>; }
function RectIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/></svg>; }
function CircleIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/></svg>; }
function TriangleIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24"><polygon points="12,3 22,20 2,20" stroke="currentColor" strokeWidth="2" fill="none"/></svg>; }
function DiamondIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" stroke="currentColor" strokeWidth="2" fill="none"/></svg>; }
function ArrowIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="10,4 20,4 20,14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/></svg>; }
function StarIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="2" fill="none"/></svg>; }
function EyedropIcon()   { return <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41L3 17.25V21h3.75l9.46-9.46 1.41 1.41 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 0 0 .01-1.42z"/></svg>; }
function TextIcon()      { return <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M2 4v3h5v12h3V7h5V4H2zm19 5h-9v3h3v7h3v-7h3V9z"/></svg>; }
function CropIcon()      { return <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z"/></svg>; }
function UndoIcon()      { return <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>; }
function RedoIcon()      { return <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 15.7C5 12.81 7.7 10.5 11 10.5c1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>; }
function GridIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function CopyIcon()      { return <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>; }
