/* ==========================================================================
   Jersey Engine Pro - core.jsx   (ExtendScript = ES3: no let/const, =>, forEach)
 
   Illustrator DOM: units are points (72 pt = 1 in) and the Y axis points UP.
   In the artboard coordinate system the origin is the active artboard's
   top-left, so anything on the artboard has y <= 0.
 
   Panel-side convention for this file: inches, origin = artboard top-left,
   Y pointing DOWN (the usual convention for nesting algorithms).
   ========================================================================== */
 
// --- JSON polyfill (ExtendScript has no native JSON) ------------------------
if (typeof JSON !== 'object') {
    JSON = {};
}
if (typeof JSON.stringify !== 'function') {   // never overwrite a native one
    JSON.stringify = (function () {
        var rx = /[\\"\x00-\x1f\x7f-\x9f\u2028\u2029]/g;
        var meta = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"': '\\"', '\\': '\\\\' };
 
        function quote(s) {
            return '"' + s.replace(rx, function (c) {
                return meta[c] || '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
            }) + '"';
        }
 
        function ser(v) {
            var t = typeof v, out = [], i, k;
            if (v === null || t === 'undefined' || t === 'function') return 'null';
            if (t === 'number') return isFinite(v) ? String(v) : 'null';
            if (t === 'boolean') return String(v);
            if (t === 'string') return quote(v);
            if (v instanceof Array) {
                for (i = 0; i < v.length; i++) out.push(ser(v[i]));
                return '[' + out.join(',') + ']';
            }
            for (k in v) {
                if (v.hasOwnProperty(k) && typeof v[k] !== 'undefined' && typeof v[k] !== 'function') {
                    out.push(quote(k) + ':' + ser(v[k]));
                }
            }
            return '{' + out.join(',') + '}';
        }
 
        return function (value) { return ser(value); };
    }());
}
 
// --- Geometry helpers --------------------------------------------------------
var CURVE_STEPS = 12;   // samples per Bezier segment; raise for tighter contours
var _nestItems = [];    // item refs captured at extraction, used by placement
 
function samePt(a, b) {
    return Math.abs(a[0] - b[0]) < 0.001 && Math.abs(a[1] - b[1]) < 0.001;
}
 
function bezier(p0, p1, p2, p3, t) {
    var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
            a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}
 
// PathItem -> [[x, y], ...] in DOM points. Curves are sampled, not just anchors.
function flattenPath(path) {
    var pts = path.pathPoints, n = pts.length, out = [];
    var segs, i, k, a, b, p0, p1, p2, p3;
    if (n < 2) return out;
    segs = path.closed ? n : n - 1;
    for (i = 0; i < segs; i++) {
        a = pts[i];
        b = pts[(i + 1) % n];
        p0 = a.anchor; p1 = a.rightDirection; p2 = b.leftDirection; p3 = b.anchor;
        out.push([p0[0], p0[1]]);
        if (!samePt(p0, p1) || !samePt(p2, p3)) {   // curved segment
            for (k = 1; k < CURVE_STEPS; k++) {
                out.push(bezier(p0, p1, p2, p3, k / CURVE_STEPS));
            }
        }
    }
    if (!path.closed) {
        p3 = pts[n - 1].anchor;
        out.push([p3[0], p3[1]]);
    }
    return out;
}
 
function polyArea(poly) {
    var s = 0, i, j;
    for (i = 0; i < poly.length; i++) {
        j = (i + 1) % poly.length;
        s += poly[i][0] * poly[j][1] - poly[j][0] * poly[i][1];
    }
    return Math.abs(s / 2);
}
 
// Outer contour of a PathItem or CompoundPathItem; null for anything else.
function outerContour(item) {
    var rings = [], best = null, bestArea = -1, i, area;
    if (item.typename === 'PathItem') {
        if (item.closed) rings.push(flattenPath(item));
    } else if (item.typename === 'CompoundPathItem') {
        for (i = 0; i < item.pathItems.length; i++) {
            if (item.pathItems[i].closed) rings.push(flattenPath(item.pathItems[i]));
        }
    }
    for (i = 0; i < rings.length; i++) {
        if (rings[i].length < 3) continue;
        area = polyArea(rings[i]);
        if (area > bestArea) { bestArea = area; best = rings[i]; }
    }
    return best;
}
 
// --- Extraction: one entry per selected item ---------------------------------
// Returns a JSON string, or a string starting with "ERROR:".
// Points are inches relative to the item's top-left, Y pointing DOWN.
function getJerseyComplexVectorData() {
    var list = [], pts, poly, item, gb, kind, x, y, prev, i, j, sel;
    try {
        app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
        if (app.documents.length === 0) {
            return "ERROR: Open your jersey artboard template first.";
        }
        sel = app.activeDocument.selection;
        if (!sel || sel.length === 0) {
            return "ERROR: Select the front, back, and sleeve paths to calculate nesting.";
        }
 
        _nestItems = [];
        for (i = 0; i < sel.length; i++) {
            item = sel[i];
            gb = item.geometricBounds;               // [left, top, right, bottom], Y up
            if (!gb || gb.length !== 4 || !isFinite(gb[0]) || !isFinite(gb[1]) ||
                    !isFinite(gb[2]) || !isFinite(gb[3]) || gb[2] <= gb[0] || gb[1] <= gb[3]) {
                return "ERROR: " + (item.name || ("Selected item " + (i + 1))) + " has empty or invalid bounds.";
            }
            poly = outerContour(item);
            kind = 'path';
            if (!poly) {                             // group, text, image...: bounding box only
                poly = [[gb[0], gb[1]], [gb[2], gb[1]], [gb[2], gb[3]], [gb[0], gb[3]]];
                kind = 'bbox';
            }
 
            pts = [];
            for (j = 0; j < poly.length; j++) {
                x = Math.round((poly[j][0] - gb[0]) / 72 * 10000) / 10000;
                y = Math.round((gb[1] - poly[j][1]) / 72 * 10000) / 10000;   // flip to Y down
                prev = pts[pts.length - 1];
                if (prev && prev.x === x && prev.y === y) continue;         // drop repeated points
                pts.push({ x: x, y: y });
            }
            if (pts.length > 1 && pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y) {
                pts.pop();
            }
 
            _nestItems.push(item);
            list.push({
                index: i,
                className: item.name || "Jersey_Component_" + (i + 1),
                width: parseFloat(((gb[2] - gb[0]) / 72).toFixed(3)),
                height: parseFloat(((gb[1] - gb[3]) / 72).toFixed(3)),
                contour: kind,                       // "path" = true shape, "bbox" = rectangle fallback
                pointsCount: pts.length,
                hullGeometry: pts
            });
        }
        return JSON.stringify(list);
    } catch (e) {
        return "ERROR: " + e.message + " (line " + e.line + ")";
    }
}
 
// --- Placement -----------------------------------------------------------------
// xInches, yInches: where the piece's TOP-LEFT lands, measured from the artboard
//   top-left with Y increasing DOWN.
// rotationAngle: degrees, relative to the piece's current orientation. Illustrator
//   treats positive as counterclockwise on screen. A Y-down packer that rotates
//   with the standard matrix turns clockwise on screen, so pass -angle here.
function executeTruePlacement(index, xInches, yInches, rotationAngle) {
    var item, sel, gb;
    try {
        app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
 
        item = _nestItems[index];
        if (!item) {                                 // cache reset: fall back to the selection
            sel = app.activeDocument.selection;
            if (sel && sel.length > index) item = sel[index];
        }
        if (!item) return "FAILURE: no item at index " + index;
 
        if (rotationAngle) {
            item.rotate(rotationAngle, true, true, true, true, Transformation.CENTER);
        }
 
        // Read bounds AFTER rotating, then shift so the new top-left hits the target.
        gb = item.geometricBounds;
        item.translate(xInches * 72 - gb[0], -yInches * 72 - gb[1], true, true, true, true);
        return "SUCCESS";
    } catch (e) {
        return "ERROR: " + e.message + " (line " + e.line + ")";
    }
}
 