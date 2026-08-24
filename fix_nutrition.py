with open("src/App.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "if (Platform.OS === 'web') localStorage.setItem('ogoo_nutrition', JSON.stringify(nutritionLogs));" in line:
        continue
    if "}, [nutritionLogs]);" in line:
        continue
    if "useEffect(() => {" in line and lines[i+1] if i+1 < len(lines) else "" and "if (Platform.OS === 'web') localStorage.setItem('ogoo_nutrition'" in lines[i+1]:
        continue # this removes the empty useEffect wrapping
    new_lines.append(line)

with open("src/App.tsx", "w") as f:
    f.writelines(new_lines)
