with open("src/App.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if line.strip().startswith("if (Platform.OS === 'web') {") and "navigator" not in line and lines[i-1].strip() == "// Load from local storage":
        new_lines.append("  useEffect(() => {\n")
    if line.strip().startswith("if (Platform.OS === 'web') localStorage.setItem") and lines[i-1].strip() == "}, [liquidLogs]);":
        new_lines.append("  useEffect(() => {\n")
    if line.strip().startswith("if (Platform.OS === 'web') localStorage.setItem") and lines[i-1].strip() == "}, [planTasks]);":
        new_lines.append("  useEffect(() => {\n")
    if line.strip().startswith("if (Platform.OS === 'web') localStorage.setItem") and lines[i-1].strip() == "}, [vitalsHistory]);":
        new_lines.append("  useEffect(() => {\n")
    if line.strip().startswith("if (Platform.OS === 'web') localStorage.setItem") and lines[i-1].strip() == "}, [activityData]);":
        new_lines.append("  useEffect(() => {\n")
    if line.strip().startswith("if (Platform.OS === 'web') localStorage.setItem") and lines[i-1].strip() == "}, [voiceEnabled]);":
        new_lines.append("  useEffect(() => {\n")
    if line.strip().startswith("if (Platform.OS === 'web') localStorage.setItem") and lines[i-1].strip() == "}, [emergencyInfo]);":
        new_lines.append("  useEffect(() => {\n")
    new_lines.append(line)

with open("src/App.tsx", "w") as f:
    f.writelines(new_lines)
