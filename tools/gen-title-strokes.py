#!/usr/bin/env python3
"""Regenerate per-stroke **full brush-stroke** vector paths for the title intro.

Yuji Boku has no per-stroke font data, so we reconstruct complete strokes:
  1. render glyph at 1200×600 (tools/render-title-mask.mjs)
  2. multi-source chamfer distance transform from the 20 KanjiVG-order
     centre lines (tools/title-plan.json) → every glyph pixel gets the
     nearest-stroke owner (Voronoi). No cross-ownership, no missing ink.
  3. per-stroke visible ink = owned glyph pixels (contourpy → pathops)
  4. full brush stroke = visible ink ∪ variable-radius tube along its own
     centreline (cover widths), clipped to glyph. Restores occluded brush
     continuity; later strokes overlap earlier ones in order.
  5. write src/ui/title-stroke-paths.ts — 20 full-stroke paths, union = glyph.

Dev-only deps: numpy, contourpy, pillow, fontTools, skia-pathops.
  PYTHONPATH=/home/jung/ai_station/sandbox/.pdfdeps python3 tools/gen-title-strokes.py
"""
import os, subprocess
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
subprocess.run(['node','tools/render-title-mask.mjs','/tmp/kiritsu-title-mask.png','2'],check=True)
import sys, json, math
sys.path.insert(0,'/home/jung/ai_station/sandbox/.pdfdeps')
import numpy as np, pathops
from PIL import Image
from contourpy import contour_generator
from fontTools.svgLib.path import parse_path

SCALE=2
# glyph mask
im=np.array(Image.open('/tmp/kiritsu-title-mask.png').convert('L'))
glyph_mask=(im>128)
H,W=glyph_mask.shape
print('mask',glyph_mask.shape,'ink',int(glyph_mask.sum()))
# glyph vector path from SVG
svg=open('public/kanji/ou-guilv-tight.svg',encoding='utf-8').read()
import re
ds=[m.group(2) for m in re.finditer(r'<g transform="([^"]+)"[^>]*><path d="([^"]+)"',svg)]
glyph=pathops.Path()
for d in ds: parse_path(d,glyph.getPen())
glyph.simplify()
print('glyph area',glyph.area)
plan=json.load(open('tools/title-plan.json'))
geoms=plan['geoms']; N=len(geoms)
# Voronoi seeds
INF=np.float32(1e30)
dist=np.full((H,W),INF,dtype=np.float32)
owner=np.full((H,W),-1,dtype=np.int16)
for i,g in enumerate(geoms):
    for pt in g['pts']:
        x=int(round(float(pt['x'])*SCALE)); y=int(round(float(pt['y'])*SCALE))
        if 0<=x<W and 0<=y<H:
            if dist[y,x]>0: dist[y,x]=0.0; owner[y,x]=i
            # if already seeded by another stroke, nearest-ish tie: keep first
# chamfer forward
A=1.0; B=math.sqrt(2)
for y in range(H):
    for x in range(W):
        d=dist[y,x]; o=owner[y,x]
        if x>0:
            nd=dist[y,x-1]+A
            if nd<d-1e-6: d=nd; o=owner[y,x-1]
        if y>0:
            nd=dist[y-1,x-1]+B
            if nd<d-1e-6: d=nd; o=owner[y-1,x-1]
            nd=dist[y-1,x]+A
            if nd<d-1e-6: d=nd; o=owner[y-1,x]
            if x<W-1:
                nd=dist[y-1,x+1]+B
                if nd<d-1e-6: d=nd; o=owner[y-1,x+1]
        dist[y,x]=d; owner[y,x]=o
# backward
for y in range(H-1,-1,-1):
    for x in range(W-1,-1,-1):
        d=dist[y,x]; o=owner[y,x]
        if x<W-1:
            nd=dist[y,x+1]+A
            if nd<d-1e-6: d=nd; o=owner[y,x+1]
        if y<H-1:
            if x<W-1:
                nd=dist[y+1,x+1]+B
                if nd<d-1e-6: d=nd; o=owner[y+1,x+1]
            nd=dist[y+1,x]+A
            if nd<d-1e-6: d=nd; o=owner[y+1,x]
            if x>0:
                nd=dist[y+1,x-1]+B
                if nd<d-1e-6: d=nd; o=owner[y+1,x-1]
        dist[y,x]=d; owner[y,x]=o
# glyph pixels ownership stats
g_owner=owner[glyph_mask]
print('unassigned glyph px',int((g_owner<0).sum()),'of',len(g_owner))
# dilate each stroke mask 1px (3x3) and contour
def dilate(m, r=3):
    p=np.pad(m,r,mode='constant')
    out=p.copy()
    for dy in range(-r,r+1):
        for dx in range(-r,r+1):
            if dx*dx+dy*dy <= r*r:
                out |= np.roll(np.roll(p,dy,0),dx,1)
    return out[r:-r,r:-r]
class Pen:
    def __init__(self): self.parts=[]; self.cur=''
    def _pt(self,p): return f"{p[0]:.1f} {p[1]:.1f}"
    def moveTo(self,p):
        if self.cur: self.parts.append(self.cur)
        self.cur='M'+self._pt(p)
    def lineTo(self,p): self.cur+='L'+self._pt(p)
    def qCurveTo(self,*pts):
        pts=[p for p in pts if p is not None]
        while len(pts)>2:
            c=pts[0]; nxt=pts[1]; end=((c[0]+nxt[0])/2,(c[1]+nxt[1])/2)
            self.cur+='Q'+self._pt(c)+' '+self._pt(end); pts=pts[1:]
        self.cur+='Q'+self._pt(pts[0])+' '+self._pt(pts[1])
    def curveTo(self,*pts): self.cur+='C'+' '.join(self._pt(p) for p in pts)
    def closePath(self): self.cur+='Z'
    def endPath(self):
        if self.cur: self.parts.append(self.cur); self.cur=''
    def get(self):
        if self.cur: self.parts.append(self.cur); self.cur=''
        return ''.join(self.parts)

def ring_area(r):
    a=0.0
    for i in range(len(r)):
        x1,y1=r[i-1]; x2,y2=r[i]
        a += x1*y2-x2*y1
    return a/2

def path_from_filled(pts_list, offsets):
    p=pathops.Path()
    for pts,offs in zip(pts_list,offsets):
        rings=[pts[a:b] for a,b in zip(offs[:-1],offs[1:])]
        if not rings: continue
        # contourpy filled: first ring = outer, rest = holes. Enforce opposite
        # winding so nonzero fill actually keeps the holes open.
        for k,ring in enumerate(rings):
            if len(ring)<3: continue
            if k==0:
                if ring_area(ring) < 0: ring=ring[::-1]
            else:
                if ring_area(ring) > 0: ring=ring[::-1]
            p.moveTo(float(ring[0][0]),float(ring[0][1]))
            for q in ring[1:]: p.lineTo(float(q[0]),float(q[1]))
            p.close()
    try: p=pathops.simplify(p)
    except Exception: pass
    return p

shapes=[]; radii=[]
for i,g in enumerate(geoms):
    m=(owner==i)&glyph_mask
    m=dilate(m)
    cg=contour_generator(z=m.astype(np.float64))
    pts_list, offsets = cg.filled(0.5,1.0)
    pts_list=[pts/SCALE for pts in pts_list]
    p=path_from_filled(pts_list,offsets)
    part=pathops.op(glyph,p,pathops.PathOp.INTERSECTION)
    part.simplify()
    # 서브픽셀 이음새 제거: 각 획 경계를 0.35 view unit만큼 바깥으로 확장한 뒤
    # glyph와 교집합. 이웃 획과 0.35unit만 겹치므로 눈에 띄지 않고, 흰 실금이 없다.
    outline=pathops.Path(); outline.addPath(part)
    outline.stroke(0.7, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 2)
    outline.convertConicsToQuads()
    expanded=pathops.op(part,outline,pathops.PathOp.UNION)
    part=pathops.op(glyph,expanded,pathops.PathOp.INTERSECTION)
    part.simplify()
    shapes.append(part)
    radii.append(round(max(g['cover'])+4,1))
    print(i+1,'area',round(part.area,1))
# union + leftover
union=pathops.Path()
for p in shapes: union=pathops.op(union,p,pathops.PathOp.UNION)
print('union area',round(union.area,2),'glyph',round(glyph.area,2))
# pathops의 차집합 면적은 even-odd/ winding에 민감해 신뢰하지 않는다.
# 대신 마스크가 모든 glyph 픽셀을 소유하므로 leftover를 마지막 획에 넣지 않는다
# (넣으면 그 획이 글자 대부분을 덮는 재앙이 된다).
out=[]
for p in shapes:
    p.simplify(); p.convertConicsToQuads()
    pen=Pen(); p.draw(pen); out.append(pen.get())
print('d bytes',sum(len(x) for x in out),'max',max(len(x) for x in out))
json.dump({'paths':out,'radii':radii,'inkPixels':plan['inkPixels']},open('/tmp/fullstroke-paths.json','w'))
# TS
mod=["// GENERATED by tools/gen-title-strokes.py — do not hand-edit.",
     "// Yuji Boku Light glyph: full brush-stroke paths (Voronoi ink ∪ centreline tube).",
     "export const KIRITSU_TITLE_STROKE_PATHS: string[] = ["]
for d in out: mod.append("  "+repr(d)+",")
mod.append("];")
mod.append("export const KIRITSU_TITLE_STROKE_RADII: number[] = "+repr(radii)+";")
mod.append("export const KIRITSU_TITLE_INK_PIXELS = "+str(plan['inkPixels'])+";")
open('src/ui/title-stroke-paths.ts','w').write("\n".join(mod)+"\n")
print('wrote TS fullstroke')
# overlay
cols=['#ff6b8a','#5fe0ff','#ffd166','#8dff9e','#c39bff','#ff9f43','#e77fff','#6bffd8']
parts=[]
for i,d in enumerate(out):
    parts.append(f'<path d="{d}" fill="{cols[i%len(cols)]}" fill-opacity=".72"/>')
open('/tmp/fullstroke-overlay.html','w').write('<!doctype html><html><body style="margin:0;background:#040b08"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" width="1200" height="600">'+''.join(parts)+'</svg></body></html>')
print('overlay written')
