"""Detail pack for the consultation room: named muscles (for the strength test groups), arteries
(brain, heart, aorta and legs), vertebrae and discs, and heart valves.
Source: BodyParts3D 4.0 (c) The Database Center for Life Science, CC BY 4.0, as prepared by Human Atlas
(MIT, (c) 2026 ashemag). Adapted: subset selected, metres to mm, further simplified, quantised to 0.1 mm,
packed as MPA1. Run: python3 -I detail.py <human-atlas public/models dir> <out.bin>"""
import json, re, struct, sys, numpy as np, fast_simplification as fs
src, out = sys.argv[1], sys.argv[2]
atlas = json.load(open(f"{src}/atlas.json")); chunks = {}
def chunk(i):
    if i not in chunks: chunks[i] = open(f"{src}/body-{i}.bin", "rb").read()
    return chunks[i]
MUSC = ["sternocleidomastoid", "scalenus anterior", "deltoid", "pectoralis major", "coracobrachialis", "supraspinatus", "infraspinatus", "teres minor", "biceps brachii", "brachialis", "brachioradialis",
        "triceps brachii", "anconeus", "extensor carpi radialis longus", "extensor carpi radialis brevis", "extensor carpi ulnaris", "flexor digitorum superficialis", "flexor digitorum profundus", "flexor pollicis longus",
        "external oblique", "psoas major", "iliacus", "rectus femoris", "sartorius", "gluteus medius", "gluteus minimus", "gluteus maximus", "biceps femoris", "semitendinosus", "semimembranosus",
        "vastus lateralis", "vastus medialis", "vastus intermedius", "extensor digitorum longus", "extensor hallucis longus", "gastrocnemius", "soleus", "adductor longus", "adductor magnus", "diaphragm"]
ART = re.compile(r"cerebral artery|internal carotid|common carotid|vertebral artery|basilar|coronary|aorta|iliac artery|femoral artery|popliteal artery|tibial artery|dorsalis pedis")
BONE = re.compile(r"vertebra$|^atlas$|^axis$|intervertebral disk|^sacrum$", re.I)
pick = []
for p in atlas["parts"]:
    n, s = p["name"], p["system"]; nl = n.lower()
    if s == "muscular" and any(m in nl for m in MUSC) and "papillary" not in nl: pick.append((p, "muscle", 500))
    elif s == "arterial" and ART.search(nl) and "branch of arch" not in nl and "oesophageal" not in nl: pick.append((p, "artery", 300))
    elif s == "skeletal" and BONE.search(n): pick.append((p, "disc" if "disk" in nl else "vertebra", 160 if "disk" in nl else 700))
    elif s in ("connective", "cardiac") and re.search(r"valve|leaflet|cusp", nl): pick.append((p, "valve", 120))
parts, blob = [], b""
for p, g, cap in pick:
    b = chunk(p["chunk"]); P = np.frombuffer(b, "<f4", p["vertexCount"] * 3, p["positions"]).reshape(-1, 3).astype(float) * 1000
    I = np.frombuffer(b, "<u4", p["indexCount"], p["indices"]).reshape(-1, 3).astype(np.int64)
    if len(P) > cap:
        P2, F = fs.simplify(P.astype(np.float32), I, 1 - cap / len(P)); P, I = P2.astype(float), F
    if not len(I): continue
    q = np.round(P / .1); assert np.abs(q).max() < 32767, p["name"]
    pos = q.astype("<i2").tobytes(); idx = np.asarray(I).ravel().astype("<u2").tobytes()
    parts.append({"id": "x" + p["id"], "kind": "hx", "g": g, "n": p["name"], "v": len(P), "i": int(np.asarray(I).size), "off": len(blob)})
    blob += pos + idx; blob += b"\0" * ((-len(blob)) % 4)
head = {"units": "mm", "q": .1, "source": "BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0, prepared by Human Atlas (MIT); subset, simplified and re-packed", "parts": parts}
js = json.dumps(head, separators=(",", ":")).encode(); js += b" " * ((-len(js)) % 4)
open(out, "wb").write(b"MPA1" + struct.pack("<I", len(js)) + js + blob)
from collections import Counter
print(out, (len(js) + len(blob)) // 1024, "KB", len(parts), "parts", Counter(x["g"] for x in parts), sum(x["i"] for x in parts) // 3, "tris")
