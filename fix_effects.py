with open("src/App.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if line.strip().startswith("if (Platform.OS === 'web') localStorage.setItem('ogoo_"):
        new_lines.append("  useEffect(() => {\n")
    new_lines.append(line)

with open("src/App.tsx", "w") as f:
    f.writelines(new_lines)
