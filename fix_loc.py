with open("src/App.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "'geolocation' in navigator) {" in line:
        lines[i] = "  useEffect(() => {\n    if (Platform.OS === 'web' && 'geolocation' in navigator) {\n"
        # Since I might have inserted `useEffect(() => {` on line 41, let's remove it if it's there
        if "useEffect(() => {" in lines[i-1]:
            lines[i-1] = ""
        break

with open("src/App.tsx", "w") as f:
    f.writelines(lines)
