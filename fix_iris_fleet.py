#!/usr/bin/env python3
# fix_iris_fleet.py — Elimina duplicados de fleetTypeFilter en App.jsx
import shutil, os

src = os.path.expanduser("~/Desktop/IRSFLT/src/App.jsx")
bak = src + ".bak_fix_" + __import__('datetime').datetime.now().strftime("%Y%m%d_%H%M%S")

shutil.copy2(src, bak)
print(f"Backup: {bak}")

with open(src, 'r', encoding='utf-8') as f:
    lines = f.readlines()

TARGET = 'const [fleetTypeFilter, setFleetTypeFilter] = useState("todos"); // ligeros, pesados, todos'

before = sum(1 for l in lines if TARGET in l)
print(f"Declaraciones encontradas: {before}")

seen = False
clean = []
removed = 0
for line in lines:
    if TARGET in line:
        if not seen:
            seen = True
            clean.append(line)
        else:
            removed += 1
    else:
        clean.append(line)

with open(src, 'w', encoding='utf-8') as f:
    f.writelines(clean)

after = sum(1 for l in clean if TARGET in l)
print(f"Duplicados eliminados: {removed}")
print(f"Declaraciones restantes: {after}")
print(f"Lineas totales: {len(clean)}")
print()
print("LISTO. Ahora ejecuta:")
print("   cd ~/Desktop/IRSFLT && npm run build 2>&1 | tail -8")
